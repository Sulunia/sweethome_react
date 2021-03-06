'use strict';
import { StyleSheet } from 'react-native';

module.exports = StyleSheet.create({
  //Structure
  body: {
    flex: 20,
    flexDirection: 'row',
    backgroundColor: 'black',
    marginTop: 8,
    borderRadius:20,
    // borderColor:'#0000ff66',
    // borderWidth:0.2
  },
  header: {
    backgroundColor: '#040404',
    flex: 1,
    alignItems: 'center',
    borderColor:'#731315',
    borderBottomWidth:2,
    marginHorizontal:48,
    marginTop: -8
  },

  //Debug
  dR: {
    borderWidth: 1,
    borderColor: 'red'
  },
  dG: {
    borderWidth: 1,
    borderColor: 'green'
  },
  dB: {
    borderWidth: 1,
    borderColor: 'blue'
  },

  textLight: {
    color: '#655555',
    fontSize: 16,
    marginHorizontal:6
  },

  textLightBig: {
    color: '#676767',
    fontSize: 28,
    marginLeft:4
  },

  sectionContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    flex: 4,
    paddingVertical: 4
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: "#d6ffeF",
    fontFamily: 'sans-serif-medium',
    flex: 0
  },
  sectionDescription: {
    marginTop: 0,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: '400',
    color: "#d6d6eF",
  },
  inputField: {
    height: 36,
    borderColor: '#888888',
    borderBottomWidth: 1,
    backgroundColor: '#080808',
    color: 'white',
    fontSize: 20,
    paddingTop: 2,
    paddingBottom: 2,
    minWidth:200,
    marginTop:4,
    marginBottom:12
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: "#000000",
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  tinyLogo: {
    width: 400,
    height: 70,
  },

  separator: {
    marginVertical: 6,
    borderBottomColor: '#43a343',
    borderBottomWidth: 2,
  },
  separatorLarge: {
    marginVertical: 10,
    borderBottomColor: '#43a343',
    borderBottomWidth: 2,
  },
  separatorInvis: {
    marginVertical: 10,
  },

  //Buttons
  textBtn: {
    color: "white",
    textAlign: 'center',
    fontSize: 24,
    textShadowColor: '#222222',
    textShadowRadius: 4,
    textShadowOffset: { width: 2, height: 2 }
  },
  textBtnSm: {
    color: "white",
    textAlign: 'center',
    fontSize: 16
  },
  textInfo: {
    fontSize: 20,
    color: "#BBBBBB",
    fontWeight: "200",
    textAlign: 'center',
    textAlignVertical: 'center'
  },
  btnDefault:{
    backgroundColor:'#001200',
    paddingHorizontal:10,
    paddingVertical:6,
    marginHorizontal:4
  },
  btnOk:{
    backgroundColor:'#001600',
    paddingHorizontal:10,
    paddingVertical:6,
    marginHorizontal:16
  },
  btnCancel:{
    backgroundColor:'#300000',
    paddingHorizontal:10,
    paddingVertical:6,
    marginHorizontal:16
  }
});