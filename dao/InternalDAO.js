const Buffer = global.Buffer || require('buffer').Buffer
import { useEffect, useState } from 'react';
import * as FS from 'expo-file-system'

const dataDir = FS.documentDirectory + "swcp_data/"

const DAO = {
  devices: [],
  config: {},

  /**
   * Prepara o storage no celular para armazenar dados de Dispositivo
   */
  deleteStorage: async () => {
    console.log("[DAO] Deleting ENTIRE database")
    FS.deleteAsync(dataDir, { 'idempotent': true })
  },

  /**
   * Prepara o storage no celular para armazenar dados de Dispositivo
   */
  prepareStorage: () => {
    return new Promise(async (resolve, reject) => {
      let dirInfo = await FS.getInfoAsync(dataDir)
      if (!dirInfo.exists) {
        console.log("[FILE] Creating folder for SWCP data")
        await FS.makeDirectoryAsync(dataDir, { intermediates: true })
      } else {
        console.log("[FILE] Data folder found")
      }

      let config = await FS.getInfoAsync(dataDir + "appconfig.json")
      if (!config.exists) {
        console.log("[FILE] Creating", "appconfig.json")
        FS.writeAsStringAsync(dataDir + "appconfig.json", "{}")
      }

      let devices = await FS.getInfoAsync(dataDir + "devices.json")
      if (!devices.exists) {
        console.log("[FILE] Creating", "devices.json")
        FS.writeAsStringAsync(dataDir + "devices.json", "[]")
      }
      resolve();
    })
  },

  /**
   * Salva dispositivos pareados na memória do celular
   * @param {ListaDispositivos} disps
   */
  saveDevices: async (disps) => {
    console.log("[FILE][SAVE] Saving devices:", disps)
    await FS.writeAsStringAsync(dataDir + "devices.json", JSON.stringify(disps))
    DAO.devices = disps
    console.log("[FILE][SAVE] Devices saved!")
  },

  loadDevices: async () => {
    console.log("[FILE][LOAD] Get devices")
    let deviceFile = await FS.readAsStringAsync(dataDir + "/" + "devices.json")
    deviceFile = JSON.parse(deviceFile)
    DAO.devices = deviceFile
    console.log("[DAO][DEBUG] Done", DAO.devices)
  },

  loadConfig: async () => {
    console.log("[FILE][LOAD] Get config")
    let configFile = await FS.readAsStringAsync(dataDir + "/" + "appconfig.json")
    configFile = JSON.parse(configFile)
    DAO.config = configFile
  },

  //React hooks
  useConfig: () => {
    const [conf, setConf] = useState({ operation_mode: undefined });
    useEffect(() => {
      let confg = DAO.config
      if (JSON.stringify(confg) !== JSON.stringify(conf)) {
        console.log("[DAO][DEBUG][HOOK] Update config")
        setConf(Object.assign({}, confg))
      }
    })
    return conf
  }
}

//Export handler as a javascript module
module.exports = DAO;