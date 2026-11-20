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
      style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.glassCard}>
          <View style={styles.header}>
            <Text style={styles.title}>STODDIE</Text>
            <Text style={styles.subtitle}>Sistema de Reportes Ciudadanos</Text>
            <Text style={styles.subtitle2}>La Paz, Bolivia</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.coffee} style={styles.loading} />
          ) : (
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.buttonPrimaryText}>Ingresar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.linkButton} onPress={onRegister} activeOpacity={0.7}>
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#FFF', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: 'rgba(213, 184, 147, 0.9)', marginTop: 4 },
  subtitle2: { fontSize: 12, color: 'rgba(213, 184, 147, 0.6)', marginTop: 2 },
  form: { gap: 16, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(213, 184, 147, 0.9)', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.spaceCadet,
  },
  loading: { marginVertical: 20 },
  buttonPrimary: {
    backgroundColor: COLORS.coffee,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.tan, fontSize: 14, fontWeight: '600' },
});