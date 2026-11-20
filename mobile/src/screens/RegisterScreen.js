import { useEffect, useState } from 'react';
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
import * as Location from 'expo-location';
import { authApi, apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

export default function RegisterScreen({ onRegister, onLogin }) {
  const { showError, showSuccess } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(null);
  const [selectedDepartamentoLabel, setSelectedDepartamentoLabel] = useState('Selecciona tu departamento');
  const [gpsStatus, setGpsStatus] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    async function loadDepartamentos() {
      try {
        const data = await apiRequest('geography/departments/');
        setDepartamentos(data.results || data);
      } catch {
        showError('No se pudieron cargar los departamentos');
      } finally {
        setDeptsLoading(false);
      }
    }
    loadDepartamentos();
  }, [showError]);

  async function verifyLocation() {
    if (!selectedDepartamentoId) {
      showError('Primero selecciona tu departamento');
      return;
    }
    setGpsStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('error');
        showError('Se necesita permiso de ubicación para verificar');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setGpsCoords({ lat: parseFloat(lat.toFixed(6)), lon: parseFloat(lon.toFixed(6)) });

      const dep = departamentos.find((d) => d.id_departamento === selectedDepartamentoId);
      if (!dep) {
        setGpsStatus('error');
        showError('Departamento no válido');
        return;
      }

      if (dep.lat_min && dep.lat_max && dep.lon_min && dep.lon_max) {
        const latMin = parseFloat(dep.lat_min);
        const latMax = parseFloat(dep.lat_max);
        const lonMin = parseFloat(dep.lon_min);
        const lonMax = parseFloat(dep.lon_max);
        if (lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax) {
          setGpsStatus('ok');
          showSuccess(`Ubicación válida en ${dep.nombre_departamento}`);
        } else {
          setGpsStatus('error');
          showError(`Tu ubicación no corresponde a ${dep.nombre_departamento}. No puedes registrarte desde otra región.`);
        }
      } else {
        setGpsStatus('ok');
      }
    } catch {
      setGpsStatus('error');
      showError('No se pudo obtener tu ubicación');
    }
  }

  async function handleRegister() {
    if (!firstName || !lastName || !email || !password) {
      showError('Completa todos los campos');
      return;
    }
    if (!selectedDepartamentoId) {
      showError('Selecciona tu departamento');
      return;
    }
    if (!gpsCoords || gpsStatus !== 'ok') {
      showError('Debes verificar tu ubicación con GPS');
      return;
    }
    if (password.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        departamento_id: selectedDepartamentoId,
        latitud: gpsCoords.lat,
        longitud: gpsCoords.lon,
      });
      showSuccess('¡Cuenta creada exitosamente!');
      onRegister();
    } catch (error) {
      const msg = error.data ? JSON.stringify(error.data) : error.message;
      showError(msg || 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  }

  if (deptsLoading) {
    return (
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando departamentos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={GLASS.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[GLASS.card, styles.card]}>
          <View style={styles.brand}>
            <Text style={styles.title}>STODDIE</Text>
            <Text style={styles.subtitle}>Crear cuenta</Text>
            <Text style={styles.caption}>Sistema de Reportes Ciudadanos</Text>
          </View>

          <View style={styles.form}>
            <Text style={GLASS.label}>Nombres</Text>
            <TextInput
              style={GLASS.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Juan Carlos"
              placeholderTextColor={COLORS.textMedium}
            />

            <Text style={[GLASS.label, { marginTop: 12 }]}>Apellidos</Text>
            <TextInput
              style={GLASS.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Pérez Gómez"
              placeholderTextColor={COLORS.textMedium}
            />

            <Text style={[GLASS.label, { marginTop: 12 }]}>Correo electrónico</Text>
            <TextInput
              style={GLASS.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
              placeholderTextColor={COLORS.textMedium}
            />

            <Text style={[GLASS.label, { marginTop: 12 }]}>Contraseña (mín. 8 caracteres)</Text>
            <TextInput
              style={GLASS.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMedium}
            />

            <Text style={[GLASS.label, { marginTop: 12 }]}>Departamento (obligatorio)</Text>
            <TouchableOpacity style={GLASS.selector} onPress={() => setShowPicker(true)} activeOpacity={0.82}>
              <Text style={styles.selectorText}>{selectedDepartamentoLabel}</Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={[GLASS.label, { marginTop: 12 }]}>Verificación de ubicación (GPS)</Text>
            <TouchableOpacity
              style={[styles.gpsBtn, gpsStatus === 'ok' && styles.gpsOk, gpsStatus === 'error' && styles.gpsError]}
              onPress={verifyLocation}
              activeOpacity={0.82}
            >
              <Text style={styles.gpsText}>
                {gpsStatus === 'loading' ? 'Obteniendo ubicación...' :
                 gpsStatus === 'ok' ? '✅ Ubicación verificada' :
                 gpsStatus === 'error' ? '❌ Error — Reintentar' :
                 '📍 Verificar mi ubicación (GPS)'}
              </Text>
            </TouchableOpacity>
            {gpsCoords && gpsStatus === 'ok' && (
              <Text style={styles.gpsInfo}>
                Lat: {gpsCoords.lat.toFixed(4)}, Lon: {gpsCoords.lon.toFixed(4)}
              </Text>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.navy} style={styles.loading} />
          ) : (
            <TouchableOpacity style={GLASS.buttonPrimary} onPress={handleRegister} activeOpacity={0.82}>
              <Text style={GLASS.buttonPrimaryText}>Registrarse</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.loginButton} onPress={onLogin} activeOpacity={0.82}>
            <Text style={styles.loginText}>Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showPicker && (
        <View style={GLASS.modalOverlay}>
          <View style={GLASS.modalBox}>
            <Text style={styles.modalTitle}>Selecciona tu departamento</Text>
            <ScrollView style={styles.modalScroll} nestedScrollEnabled>
              {departamentos.map((d) => (
                <TouchableOpacity
                  key={d.id_departamento}
                  style={GLASS.modalItem}
                  onPress={() => {
                    setSelectedDepartamentoId(d.id_departamento);
                    setSelectedDepartamentoLabel(d.nombre_departamento);
                    setShowPicker(false);
                    setGpsStatus(null);
                    setGpsCoords(null);
                  }}
                  activeOpacity={0.82}
                >
                  <Text style={styles.modalItemText}>{d.nombre_departamento}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowPicker(false)} activeOpacity={0.82}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  card: { padding: 22 },
  brand: { alignItems: 'center', marginBottom: 22 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.navy, letterSpacing: 2 },
  subtitle: { fontSize: 16, color: COLORS.ink, fontWeight: '700', marginTop: 4 },
  caption: { fontSize: 12, color: COLORS.cocoa, marginTop: 2 },
  form: {},
  selectorText: { fontSize: 15, flex: 1, color: COLORS.ink, fontWeight: '600' },
  selectorArrow: { fontSize: 13, color: COLORS.navy },
  gpsBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.champagne,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  gpsOk: { backgroundColor: COLORS.butter },
  gpsError: { backgroundColor: COLORS.azalea },
  gpsText: { color: COLORS.ink, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  gpsInfo: { fontSize: 12, color: COLORS.cocoa, textAlign: 'center', marginTop: 6 },
  loading: { marginVertical: 18 },
  loginButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.serenityBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  loginText: { color: COLORS.ink, fontWeight: '700', fontSize: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink, marginBottom: 12, textAlign: 'center' },
  modalScroll: { maxHeight: 320 },
  modalItemText: { fontSize: 15, color: COLORS.ink, fontWeight: '600' },
  modalClose: { marginTop: 12, minHeight: 44, borderRadius: 12, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
});
