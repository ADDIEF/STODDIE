import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/colors';

// Copia local del fondo ubicado en /fondo/fondoStoddie.jpeg.
// Al estar dentro del bundle de Expo funciona igual en web, iOS y Android.
const BACKGROUND_IMAGE = require('../../assets/fondoStoddie.jpeg');

export default function AppBackground({ children }) {
  return (
    <ImageBackground
      source={BACKGROUND_IMAGE}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Capas oscuras para dar profundidad y mejorar el contraste del vidrio */}
      <View style={styles.blueTint} pointerEvents="box-none" />
      <View style={styles.darkTint} pointerEvents="box-none">
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blueTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBlue,
  },
  darkTint: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
});
