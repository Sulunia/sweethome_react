import React, { useState, useEffect } from 'react';
import {
  View,
  ToastAndroid,
  Text,
  Button,
  ActivityIndicator,
  BackHandler,
  Vibration,
  Pressable,
  Modal,
  Image,
  Alert,
  TextInput
} from 'react-native';

const css = require('../styles')
import Slider from '@react-native-community/slider';

import BleDrv from "../control/BleDrv";
import DAO from '../dao/InternalDAO'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let isConnecting = false

const MainMenu = (props) => {
  const [mainMenuState, setMainMenuState] = useState("MAIN")

  const [btInfo, setBtInfo] = useState({})
  const [statusMessage, setStatusMessage] = useState("Buscando dispositivos BLE...\nAguarde...")
  const [newNameInput, setNewNameInput] = useState("")

  const [deviceControlModalVisible, setDeviceControlModalVisible] = useState(false)
  const [deviceRenameModalVisible, setDeviceRenameModalVisible] = useState(false)
  const [targetDevice, setTargetDevice] = useState({})
  const [deviceControlReady, setDeviceControlReady] = useState(false)
  const [deviceControlVars, setDeviceControlVars] = useState({})

  const [pairedDevices, setPairedDevices] = useState([])

  useEffect(() => {
    console.log("[MENU] Render")
    BleDrv.initialize(setBtInfo)

    return (async () => {
      console.log("[MAIN] Cleanup")
      await BleDrv.stop();
    })
  }, [])

  useEffect(() => {
    if (pairedDevices.length !== DAO.devices.length) {
      console.log("[MENU] Update devices")
      setPairedDevices(DAO.devices)
    }
  }, [DAO.devices])

  //Navigation callbacks
  const returnToMainMenu = async () => {
    if (BleDrv.bleInfo.state === "SCAN") {
      console.log("[BHANDLER] Stop scan")
      await BleDrv.stopScan();
    }
    setMainMenuState("MAIN")
    return true;
  }

  const lampControlModalContent = () => {
    return (
      <View style={[{ flex: 1 }]}>
        <Text style={[css.textLightBig, { textAlign: 'center', fontSize: 20, flex: 0 }]}>Controle Luz - {targetDevice.name !== undefined ? targetDevice.name : "???"}</Text>
        <View style={{ flex: 5.5, justifyContent: 'center' }}>
          <Text style={[css.textLightBig, { textAlign: 'center', fontSize: 72 }]}>{statusMessage}</Text>
        </View>
        <View style={[{ flex: 5, justifyContent: 'center', borderTopWidth: 1, borderColor: '#440000', marginHorizontal: 18 }]}>
          <Text style={[css.textLight, { margin: 10, textAlign: 'center' }]}>Temperatura</Text>
          <Slider
            style={{ flex: 0, marginBottom: 50 }}
            minimumValue={0}
            maximumValue={100}
            onSlidingStart={() => Vibration.vibrate(10)}
            minimumTrackTintColor="#333366"
            thumbTintColor="#4444bb"
            maximumTrackTintColor="#2e2e2e"
            onValueChange={(newValue) => { setStatusMessage(Math.round(Math.round(newValue * 10) / 1000 * 1000) / 10 + "% quente") }}
            onSlidingComplete={(newValue) => {
              newValue = Math.round(newValue * 10) / 1000
              Vibration.vibrate(20)
              setStatusMessage(Math.round(newValue * 1000) / 10 + "% quente")
              setDeviceControlVars({
                temp_warm: newValue,
                brilho: deviceControlVars.brilho
              })
              console.log(deviceControlVars)
              console.log("[TEMP]", newValue, [parseInt((1 - newValue) * deviceControlVars.brilho), parseInt(newValue * deviceControlVars.brilho), 0x00])
              BleDrv.writeChar([parseInt((1 - newValue) * deviceControlVars.brilho), parseInt(newValue * deviceControlVars.brilho), 0x00], "00005251-0000-1000-8000-00805f9b34fb", "00002501-0000-1000-8000-00805f9b34fb")
            }}
          />

          <Text style={[css.textLight, { margin: 10, textAlign: 'center' }]}>Nível de luz</Text>
          <Slider
            style={{ flex: 0 }}
            minimumValue={0}
            maximumValue={187}
            minimumTrackTintColor="#865633"
            maximumTrackTintColor="#2e2e2e"
            thumbTintColor="#a66633"
            onValueChange={(newValue) => { setStatusMessage((Math.round((Math.floor(newValue) / 187) * 10000) / 100) + "% Brilho") }}
            onSlidingComplete={(newValue) => {
              newValue = Math.floor(newValue)
              Vibration.vibrate((newValue / 3 < 10 ? 10 : newValue / 3))
              setStatusMessage((Math.round((newValue / 187) * 10000) / 100) + "% Brilho")
              setDeviceControlVars({
                temp_warm: deviceControlVars.temp_warm,
                brilho: newValue
              })
              console.log("[BRILHO]", newValue, [parseInt((1 - deviceControlVars.temp_warm) * newValue), parseInt(deviceControlVars.temp_warm * newValue), 0x00])
              BleDrv.writeChar([parseInt((1 - deviceControlVars.temp_warm) * newValue), parseInt(deviceControlVars.temp_warm * newValue), 0x00], "00005251-0000-1000-8000-00805f9b34fb", "00002501-0000-1000-8000-00805f9b34fb")
            }}
          />
        </View>
      </View>
    );
  }

  const handleDeviceManagement = (devicePicked) => {
    Vibration.vibrate(100, false)
    Alert.alert("Gerenciar", "Deseja renomear ou excluir '" + devicePicked.name + "'?", [
      {
        text: 'Voltar',
        style: 'cancel'
      },
      {
        text: 'Apagar',
        onPress: async () => {
          Alert.alert("Excluir", "Deseja esquecer '" + devicePicked.name + "'?", [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'OK',
              onPress: async () => {
                console.log("[MAIN] Remove device")
                let newPaireds = []
                for (const device of pairedDevices) {
                  if (val.id !== device.id) {
                    newPaireds.push(Object.assign({}, device))
                  }
                }
                await DAO.saveDevices(newPaireds)
                setPairedDevices(newPaireds)
                ToastAndroid.show("Dispositivo esquecido", ToastAndroid.SHORT)
              }
            }
          ])
        }
      },
      {
        text: 'Renomear',
        onPress: async () => {
          setDeviceRenameModalVisible(true)
          setTargetDevice(devicePicked)
        }
      }
    ])
  }

  const scanDevices = async () => {
    setMainMenuState("ADD")
    await BleDrv.turnOnBt();
    console.log("[MAIN] Scan start...")
    BleDrv.scan()
  }

  const establish = async () => {
    console.log("[MAIN] Establish conn and control", targetDevice)

    let result = false
    let tryCount = 0
    while (!result && (tryCount < 3) && isConnecting) {
      result = await BleDrv.connectToDevice(targetDevice)
      if (result && !isConnecting) {
        console.log("[MAIN] Cancel connection")
        BleDrv.disconnect();
        return;
      }
      tryCount += 1;
    }
    if (!result && isConnecting) {
      setDeviceControlModalVisible(false)
      setDeviceControlReady(false)
      ToastAndroid.show("Falha na conexão", ToastAndroid.SHORT)
      isConnecting = false
      return;
    } else if (result) {
      ToastAndroid.show("Conectado", ToastAndroid.SHORT)

      //Prepare the device accordingly
      if (targetDevice.name === "RqBleLight") {
        //Support FLC A67 Bluetooth Smart lamp
        //Authenticate
        BleDrv.writeChar([0x72, 0x22, 0x9a, 0xbb, 0xa0], "00005251-0000-1000-8000-00805f9b34fb", "00002506-0000-1000-8000-00805f9b34fb")

        //Read current value and set sliders
        //TODO

        //Initialize driver vars
        setDeviceControlVars({
          brilho: 30,
          temp_warm: 50
        })
      }

      //Setup finished, hand control to user
      setDeviceControlReady(true)
      return;
    }
  }

  //Render
  switch (mainMenuState) {

    case "MAIN":
      //Set back button handle
      BackHandler.addEventListener("hardwareBackPress", () => {
        Vibration.vibrate(30)
        BackHandler.exitApp()
      })

      //Calculate default fragments
      let menuContent = <View style={[{ flexDirection: 'row', flex: 100, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[css.textLight, { textAlign: 'center' }]}>Sem dispositivos cadastrados.{'\n'}Vincule dispositivos utilizando o botão "+"
        {'\n\n\n'}Toque e mantenha pressionado sobre um dispositivo da lista para renomear ou excluir.</Text>
      </View>

      let modalContent = <View style={{ flex: 1, flexDirection: 'row', marginHorizontal: 12 }}>
        <ActivityIndicator color="#5A1A1A" size="large"/>
        <Text style={[css.textLightBig, { textAlign: 'center', textAlignVertical: 'center' }]}>Conectando...</Text>
      </View>;

      if (deviceControlReady) {
        modalContent = lampControlModalContent()
      }

      let modalDeviceControl = <Modal visible={deviceControlModalVisible} animationType={'slide'}
        onShow={() => {
          isConnecting = true
          setStatusMessage("???")
          establish()
        }}
        onRequestClose={() => {
          setDeviceControlModalVisible(false)
          Vibration.vibrate(40)
          setTargetDevice(Object.assign({}, {}))
          BleDrv.disconnect();
          ToastAndroid.show("Desconectado", ToastAndroid.SHORT)
          isConnecting = false
        }}>
        <View style={{ flexDirection: 'row', flex: 1, backgroundColor: 'black' }}>
          {modalContent}
        </View>
      </Modal>

      let modalDeviceRename = <Modal visible={deviceRenameModalVisible} animationType={'fade'} transparent={true}
        onShow={() => {
          console.log("[MAIN] Show device rename modal")
        }}
        onRequestClose={() => {
          console.log("[MAIN] Hide device rename modal")
          setDeviceRenameModalVisible(false)
          setTargetDevice(Object.assign({}, {}))
          Vibration.vibrate(40, false)
        }}>
        <View style={{ flexDirection: 'row', flex: 1, backgroundColor: '#000000A6', alignItems:"center", justifyContent:"center" }}>
          <View style={{flex:1, borderWidth:2, borderColor:"#464646", margin:12, padding:4, alignItems:'center'}}>
            <Text style={css.textInfo}>Renomear '{targetDevice.name}' para:</Text>
            <TextInput style={css.inputField} value={newNameInput} onChangeText={(txt)=>setNewNameInput(txt)}/>
            <View style={{flexDirection:'row'}}>
            <Pressable style={css.btnCancel} 
            onPress={()=>{
              Vibration.vibrate(12, false)
              setDeviceRenameModalVisible(false)
              setNewNameInput("")
            }}>
              <Text style={css.textBtnSm}>Cancelar</Text>
            </Pressable>
            
            <Pressable style={css.btnOk}
            onPress={async ()=>{
              if(newNameInput.length<3){
                alert("Insira um nome com pelo menos 3 caracteres!")
                return;
              }
              Vibration.vibrate(40, false)
              let deviceIndex = pairedDevices.findIndex((dev => dev.id === targetDevice.id))
              let newPaireds = Object.assign([], pairedDevices)
              newPaireds[deviceIndex].name = newNameInput
              await DAO.saveDevices(newPaireds)
              setNewNameInput("")
              setDeviceRenameModalVisible(false)
              ToastAndroid.show("Dispositivo renomeado!", ToastAndroid.SHORT)
            }}>
              <Text style={css.textBtnSm}>OK</Text>
            </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      //Calculate render
      if (pairedDevices.length > 0) {
        let iterat = pairedDevices.map((val, idx, arr) => {
          return (
            <View key={val.id + val.name} style={[{ flex: 0, margin: 12, flexDirection: 'row', borderColor: '#880000', borderBottomWidth: 2, backgroundColor: '#180000' }]}>
              <Pressable style={{ flex: 1, flexDirection: 'row' }} onPressIn={() => Vibration.vibrate(11)}
                onPress={() => {
                  setTargetDevice(val)
                  setDeviceControlReady(false)
                  setDeviceControlModalVisible(true)
                }}
                onLongPress={() => handleDeviceManagement(val)}>
                <Text style={[css.textLightBig, { flex: 6, textAlignVertical: 'center' }]}>{val.name}</Text>
                <Image source={require("../gfx/light-bulb.png")} style={{ height: 50, flex: 1, margin: 8 }} resizeMethod="scale" resizeMode="contain"></Image>
              </Pressable>
            </View>
          );
        })
        menuContent = <View style={[{ flexDirection: 'column', flex: 100, justifyContent: 'flex-start', alignItems: 'flex-start' }]}>
          {iterat}
          {modalDeviceControl}
          {modalDeviceRename}
        </View>
      }

      return (
        <View style={[{ flex: 1, flexDirection: 'column' }]}>
          {menuContent}
          <View style={[{ flexDirection: 'row', flex: 13, justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 12 }]}>
            <Pressable onPress={() => {
              console.log("[SETTINGS] Not implemented")
              Vibration.vibrate([120, 40, 80, 180])
              // setPairedDevices([])
              // setPairedDevices([].concat({ "id": "98:5D:AD:18:CA:F0", "isConnectable": null, "mtu": 23, "name": "RqBleLight", "rssi": -69, "type": "LAMP" }))
            }}
            onLongPress={()=>{
              ToastAndroid.show("v1.0.1", ToastAndroid.SHORT)
              alert("Desenvolvido por:\nPedro Polez\ngithub.com/Sulunia\n\n#IoT #BLE #ReactNative")
              }}>
              <Image source={require('../gfx/cogs.png')} style={{ height: 50, width: 50 }} resizeMode='contain'></Image>
            </Pressable>

            <Pressable onPress={() => {
              Vibration.vibrate(12, false)
              scanDevices();
            }}>
              <Text style={[css.textLight, { fontSize: 50, marginBottom: 6, color: "#00770066" }]}>+</Text>
            </Pressable>
          </View>
        </View>
      );

    case "ADD":
      BackHandler.addEventListener("hardwareBackPress", returnToMainMenu)
      let deviceListView = null;
      if (btInfo.devices.size > 0) {
        let data = [...btInfo.devices].map((value, index, arr) => {
          if (value[1].name === "RqBleLight") {
            return (
              <View key={value[1].id} style={{ margin: 10 }}>
                <Button key={value[1]} title={value[1].id + '  ||  ' + value[1].rssi + " db"}
                  color="#274727" onPress={async () => {
                    // Add device to paired devices list
                    if (pairedDevices.length > 0) {
                      for (const device of pairedDevices) {
                        if (device.id === value[1].id) {
                          Alert.alert("Atenção", "Este Dispositivo ja está vinculado!");
                          return;
                        }
                      }
                    }
                    BleDrv.stopScan();
                    setStatusMessage("Vinculando...")
                    await BleDrv.connectToDevice(value[1]);
                    ToastAndroid.show("Dispositivo BLE pareado!", ToastAndroid.SHORT)
                    let connDev = value[1]
                    if (value[1].name === "RqBleLight") {
                      connDev.type = "LAMP";
                    }
                    let newPaireds = pairedDevices.concat(connDev)
                    setPairedDevices(newPaireds)
                    await DAO.saveDevices(newPaireds)
                    await BleDrv.disconnect();
                    await sleep(100)
                    setMainMenuState("MAIN")
                    setStatusMessage("Buscando dispositivos BLE...\nAguarde...");
                  }}></Button>
              </View>
            );
          } else {
            return (
              <View key={value[1].id} style={{ margin: 10 }}>
                <Button key={value[1].id} title={value[1].id + '  ||  ' + value[1].rssi + " db"}
                  color="#272747" onPress={() => {
                    ToastAndroid.show("Dispositivo não suportado.", ToastAndroid.SHORT)
                  }}></Button>
              </View>
            );
          }
        })
        deviceListView = <View style={[{ flex: 100, flexDirection: 'column', marginTop: 10 }]}>
          {data}
          <ActivityIndicator color="#7A1A1A" size="small"></ActivityIndicator>
        </View>
      } else {
        deviceListView = <View style={[{ flexDirection: 'row', flex: 100, justifyContent: 'space-evenly', alignItems: 'center' }]}>
          <ActivityIndicator color="#7A1A1A" size="large"></ActivityIndicator>
          <Text style={css.textLight}>{statusMessage}</Text>
        </View>
      }
      return (
        <View style={[{ flex: 1, flexDirection: 'column' }]}>
          {deviceListView}
          <View style={[{ flexDirection: 'row', flex: 13, justifyContent: 'flex-end', alignItems: 'center', marginHorizontal: 12 }]}>
            <Pressable onPress={() => {
              BleDrv.stopScan();
              setMainMenuState("MAIN")
            }}>
              <Text style={[css.textLight, { fontWeight: 'bold', fontSize: 34, marginBottom: 6, color: "#99000066" }]}>X</Text>
            </Pressable>
          </View>
        </View>
      );

    default:
      return (
        <View style={[{ flex: 1, flexDirection: 'column' }]}>
          <View style={[{ flexDirection: 'row', flex: 100, justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={css.textLight}>Unknown app state!</Text>
            <Button title="Voltar" onPress={() => {
              setMainMenuState("MAIN")
            }}></Button>
          </View>
        </View>
      );
  }
};

export default MainMenu;