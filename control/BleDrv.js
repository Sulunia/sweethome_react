'use strict';
import { BleManager, LogLevel } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { useEffect, useState } from 'react';
const Buffer = global.Buffer || require('buffer').Buffer


var BleManagerModule = undefined
// const bleEventEmitter = new NativeEventEmitter(BleManagerModule);
var timerConnect = undefined

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const BleDrv = {
  initialize: (parentUpdFn) => {
    return new Promise(async (resolve, reject) => {
      BleDrv.internal.parentUpdFn = parentUpdFn;

      if (BleDrv.bleInfo.state === "PoweredOn" || BleManagerModule !== undefined) {
        console.log("[BLE] Already enabled")
        resolve()
      } else {
        console.log("[BLE] Initializing...")
        BleManagerModule = new BleManager();
        BleManagerModule.setLogLevel(LogLevel.Verbose);
        BleDrv.internal.subcriptions.push(BleManagerModule.onStateChange((state) => {
          console.log("[BLE-PLX] State:", state)
          BleDrv.bleInfo.state = state;
          BleDrv.updateParent()
        }))

        console.log("[BLE] Check perms")
        if (Platform.OS === 'android' && Platform.Version >= 18) {
          var result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
          BleDrv.updateParent()
          if (result) {
            console.log("[BLE] Permissions are OK");
            try {
              let state = await BleManagerModule.state()
              BleDrv.bleInfo.state = state
              if (state !== "PoweredOn") {
                await BleManagerModule.enable('enabling');
                BleDrv.updateParent()
                console.log("[BLE] The bluetooth is already enabled or the user confirm");
                resolve()
              }else{
                resolve()
              }
            } catch (error) {
              // Failure code
              console.log("[BLE] The user refuse to enable bluetooth", error);
              BleDrv.updateParent()
              resolve();
            }
          } else {
            PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION, PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]).then(async (result) => {
              if (result) {
                console.log("[BLE] User accept perms, enabling BT");
                try {
                  let state = await BleManagerModule.state()
                  BleDrv.bleInfo.state = state
                  if (state !== "PoweredOn") {
                    await BleManagerModule.enable('enabling');
                    console.log("[BLE] The bluetooth is already enabled or the user confirm");
                    BleDrv.updateParent()
                    resolve();
                  }else{
                    resolve();
                  }
                } catch (error) {
                  // Failure code
                  console.log("[BLE] The user refuse to enable bluetooth", error);
                  BleDrv.updateParent()
                  reject()
                }
              } else {
                console.log("[BLE] User refuse perms");
                BleDrv.updateParent()
                reject()
              }
            });

          }

        }
        setTimeout(()=>{
          BleDrv.updateParent()
        }, 500)

      }
    }); //End promise

  }, //end init

  //Scan: Scans for BLE devices, calls deviceListUpdateFunction on new non repeated device
  scan: () => {
    if (BleDrv.bleInfo.state === "PoweredOn") {
      // console.log("[BLE] Initializing scan")
      BleDrv.bleInfo.devices = new Map([])
      BleManagerModule.startDeviceScan(null, {}, BleDrv.callBacks.deviceDiscovered)
      BleDrv.bleInfo.state = "SCAN"
      console.log("[BLE] Scan started!")
    } else {
      console.log("[BLE] Not ready. Adapter state:", BleDrv.bleInfo.state)
    }
  },

  stopScan: async () => {
    if (BleManagerModule !== undefined) {
      await BleManagerModule.stopDeviceScan();
      BleDrv.bleInfo.devices = undefined
      console.log("[BLE] Scan stopped!")
      BleDrv.bleInfo.devices = new Map([])
      BleDrv.bleInfo.state = "PoweredOn"
      setTimeout(()=>{
        BleDrv.updateParent();
      }, 200)
    }
  },

  turnOffBt: async () => {
    await BleManagerModule.stopDeviceScan();
    await BleManagerModule.disable();
    BleDrv.bleInfo.devices = new Map([])
    console.log("[BLE] BT deactivated!")
    BleDrv.updateParent()
  },

  turnOnBt: async () => {
    let tries = 0
    BleDrv.bleInfo.state = await BleManagerModule.state();
    while (BleDrv.bleInfo.state !== "PoweredOn" && tries < 2) {
      try {
        await BleManagerModule.enable();
        await new Promise(r => setTimeout(r, 1000));
        console.log("[BLE] BT activated!")
        return;
      } catch (error) {
        console.log("[BLE-DRV] Error:", error)
        await new Promise(r => setTimeout(r, 1000));
        tries += 1;
      }
    }
    if (BleDrv.bleInfo.state !== "PoweredOn") {
      throw "Unable to turn on bluetooth after 3 tries"
    }
    return;
  },

  stop: async () => {
    console.log("[CLEANUP] Stopscan")

    if (BleManagerModule !== undefined) {
      await BleManagerModule.stopDeviceScan()
      console.log("[CLEANUP] disconn")
      await BleDrv.disconnect()

      for (const sub of BleDrv.internal.subcriptions) {
        console.log("[CLEANUP] Remove of:", sub)
        sub.remove();
      }

      // if (BleDrv.mldpInfo.device) {
      //   if (BleDrv.mldpInfo.notificationSubscription !== undefined) {
      //     console.log("[BLE][DEBUG] De-register", BleDrv.mldpInfo.notificationSubscription)
      //     BleDrv.mldpInfo.notificationSubscription.remove()
      //   }
      // }

      await BleManagerModule.destroy()
      BleManagerModule = undefined
    }
    BleDrv.bleInfo.state = "OFF"
    BleDrv.internal.subcriptions = []
    BleDrv.updateParent()
  },

  disconnect: async () => {
    try {
      if (BleDrv.internal.currentDevice !== undefined) {
        console.log("[BLE-PLX] Disconnecting from device", BleDrv.internal.currentDevice.id)
        await BleManagerModule.cancelDeviceConnection(BleDrv.internal.currentDevice.id)
        BleDrv.internal.currentDevice = undefined
        BleDrv.updateParent()
      }
    } catch (error) {
      console.log("[BLE-PLX][DISCON]Err:", error)
    }
  },

  // Connects to a BLE device and sets up MLDP communication
  //  device: the device to connect to
  connectToDevice: async (device) => {
    if (BleDrv.internal.currentDevice !== undefined) {
      await BleDrv.disconnect();
      BleDrv.internal.currentDevice = undefined
    }

    console.log("[BLE-PLX] Connecting to", device)
    BleDrv.updateParent()
    try {
      BleDrv.internal.currentDevice = await BleManagerModule.connectToDevice(device.id, { autoConnect: true, timeout: 10000, refreshGatt: "OnConnected" })
      console.log("[BLE] Connected to device. Discovering services")
      BleDrv.updateParent()
      await BleDrv.internal.currentDevice.discoverAllServicesAndCharacteristics("servdisc")
      let services = await BleDrv.internal.currentDevice.services()
      let characteristics = undefined

      for (const serv of services) {
        console.log("[BLE-PLX] Services:", serv.id, serv.uuid)
        characteristics = await serv.characteristics();
        for (const chr of characteristics) {
          console.log("[BLE-PLX] Char:", chr.id, chr.uuid, chr.isNotifiable, chr.isIndicatable)
        }
      }
      await sleep(100)
      return true;
    } catch (error) {
      console.log("[BLE-PLX][CONN]", error, error.errorCode)
      BleDrv.internal.currentDevice = undefined
      BleDrv.updateParent()
      return false
    }
  },

  writeChar: async (frame, service, characteristic) => {
    // console.log("[BLE][TX]", frame.trim(), "[" + Buffer.from(frame).toString('base64') + "]")
    if (BleDrv.internal.currentDevice) {
      setTimeout(async () => {
        try {
          await BleDrv.internal.currentDevice.writeCharacteristicWithResponseForService(service, characteristic, Buffer.from(frame).toString('base64'))
        } catch (error) {
          console.log("[BLE][ERR] Error writing to device, trying again...", error)
          try {
            await BleDrv.internal.currentDevice.writeCharacteristicWithResponseForService(service, characteristic, Buffer.from(frame).toString('base64'))
          } catch (error) {
            console.log("[BLE] Unable to write to device!")
          }
        }
      }, 100)
    } else {
      console.log("[BLE][ERR] No devices connected!")
    }
    
  },

  callBacks: {
    deviceDiscovered: (error, device) => {

      if (error) {
        console.log("[BLE-PLX][SCAN] Err:", error)
      } else {
        let filteredDevice = {
          id: device.id,
          isConnectable: device.isConnectable,
          name: device.localName,
          mtu: device.mtu,
          rssi: device.rssi
        }
        console.log("[BLE-PLX] Device:", filteredDevice)
        BleDrv.bleInfo.devices.set(filteredDevice.id, filteredDevice)
        BleDrv.updateParent()
      }
    }
  },

  updateParent: ()=>{
    if (BleDrv.internal.parentUpdFn !== undefined) {
      // console.log("[BT-INTEG] Update state", BleDrv.bleInfo)
      BleDrv.internal.parentUpdFn(Object.assign({},BleDrv.bleInfo))
    }
  },

  bleInfo: {
    devices: new Map([]),
    scanIntervalHandle: undefined,
    state: undefined
  },

  internal: {
    parentUpdFn: undefined,
    subcriptions: [],
    currentDevice: undefined
  }
}


module.exports = BleDrv;