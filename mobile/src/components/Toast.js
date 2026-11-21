import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme/colors';

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

const ACCENTS = {
  success: COLORS.navy,
  error: COLORS.rust,
  warning: COLORS.goldenCustard,
  info: COLORS.serenityBlue,
};

export default function Toast({ message, type = 'info', visible, onHide }) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-18));

  useEffect(() => {
    if (!visible) return undefined;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -18, duration: 220, useNativeDriver: true }),
      ]).start(() => onHide && onHide());
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { borderLeftColor: ACCENTS[type] || ACCENTS.info },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.icon}>{ICONS[type] || ICONS.info}</Text>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 260,
    maxWidth: '88%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderLeftWidth: 5,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 2000,
  },
  icon: { fontSize: 20, marginRight: 10 },
  text: { flex: 1, color: COLORS.ink, fontSize: 14, fontWeight: '700', lineHeight: 20 },
});
