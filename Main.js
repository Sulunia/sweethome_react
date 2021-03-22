/**
 * Sweethome CP ~ Source
 * React Native 0.60+
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  View,
  StatusBar,
  ToastAndroid,
  Text,
  DevSettings
} from 'react-native';

const css = require('./styles')

import MainPageContent from './views/MainMenu'
import DAO from './dao/InternalDAO'

const Main: () => React$Node = () => {
    DevSettings.addMenuItem('[DEBUG] Limpar dados', async () => {
      console.log("[SAVE][LOAD] Limpando storage")
      await DAO.deleteStorage()
    });

  ToastAndroid.show("v0.0.1", ToastAndroid.SHORT)
  console.log("[MAIN] Execution started")

  DAO.prepareStorage().then(async ()=>{
    console.log("[MAIN] Storage ready!")
    await DAO.loadDevices();
    // await DAO.loadConfig();
  })

  return (
    <View style={{flex:1, backgroundColor:"black"}}>
      {/* Android Status header */}
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Company logo view */}
      <View style={{ justifyContent: "center", flex: 1, backgroundColor:'#040404' }}>
        <View style={css.header}>
          <Text style={[css.textLight, {fontSize:26}]}>SweetHome</Text>
        </View>
      </View>

      {/* Application content view */}
      <View style={[css.body]}>
        <MainPageContent></MainPageContent>
      </View>
    </View>
  );
};


export default Main;
