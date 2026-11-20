import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

export default function LoginScreen({ onLogin, onRegister }) {
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      showError('Ingresa correo y contraseña');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      showSuccess('¡Bienvenido!');
      onLogin(res.user);
    } catch (error) {
      showError(error.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={GLASS.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[GLASS.card, styles.card]}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandIcon}>🌤️</Text>
            </View>
            <Text style={styles.title}>STODDIE</Text>
            <Text style={styles.subtitle}>Sistema de Reportes Ciudadanos</Text>
            <Text style={styles.caption}>La Paz, Bolivia</Text>
          </View>

          <View style={styles.form}>
            <Text style={GLASS.label}>Correo electrónico</Text>
            <TextInput
              style={GLASS.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
              placeholderTextColor={COLORS.textMedium}
            />

            <Text style={[GLASS.label, { marginTop: 14 }]}>Contraseña</Text>
            <TextInput
              style={GLASS.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMedium}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.navy} style={styles.loading} />
          ) : (
            <TouchableOpacity style={GLASS.buttonPrimary} onPress={handleLogin} activeOpacity={0.82}>
              <Text style={GLASS.buttonPrimaryText}>Ingresar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.registerButton} onPress={onRegister} activeOpacity={0.82}>
            <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 24 },
  brand: { alignItems: 'center', marginBottom: 26 },
  brandMark: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  brandIcon: { fontSize: 30 },
  title: { fontSize: 34, fontWeight: '800', color: COLORS.navy, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: COLORS.cocoa, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  caption: { fontSize: 12, color: COLORS.serenityBlue, marginTop: 4 },
  form: { marginBottom: 24 },
  loading: { marginVertical: 18 },
  registerButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.champagne,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  registerText: { color: COLORS.ink, fontWeight: '700', fontSize: 14 },
});
