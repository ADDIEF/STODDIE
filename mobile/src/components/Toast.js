import { useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export default function Toast({ message, type = 'info', visible, onHide }) {
  const opacity = new Animated.Value(visible ? 1 : 0);
  const translateY = new Animated.Value(visible ? 0 : 20);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 10,
      minWidth: 250,
      maxWidth: '85%',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 1000,
    },
    success: { backgroundColor: '#1E88E5', borderLeftWidth: 4, borderLeftColor: '#0D47A1' },
    error: { backgroundColor: '#D32F2F', borderLeftWidth: 4, borderLeftColor: '#B71C1C' },
    warning: { backgroundColor: '#FFA000', borderLeftWidth: 4, borderLeftColor: '#F57C00' },
    info: { backgroundColor: '#1976D2', borderLeftWidth: 4, borderLeftColor: '#0D47A1' },
    text: { color: '#FFF', fontSize: 14, fontWeight: '600', lineHeight: 20 },
    icon: { fontSize: 20, marginRight: 10 },
  });

  const typeStyles = {
    success: styles.success,
    error: styles.error,
    warning: styles.warning,
    info: styles.info,
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  Animated.timing(opacity, {
    toValue: visible ? 1 : 0,
    duration: 300,
    useNativeDriver: false,
  }).start();

  Animated.timing(translateY, {
    toValue: visible ? 0 : 20,
    duration: 300,
    useNativeDriver: false,
  }).start();

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, typeStyles[type], { opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.text]}>{icons[type]} {message}</Text>
    </Animated.View>
  );
}