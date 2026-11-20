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
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deptsLoading, setDeptsLoading] = useState(true);

  useEffect(() => {
    async function loadDepartamentos() {
      try {
        const data = await apiRequest('geography/departments/');
        setDepartamentos(data.results || data);
      } catch (err) {
        showError('No se pudieron cargar los departamentos');
      } finally {
        setDeptsLoading(false);
      }
    }
    loadDepartamentos();
  }, []);

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
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        const latMin = parseFloat(dep.lat_min);
        const latMax = parseFloat(dep.lat_max);
        const lonMin = parseFloat(dep.lon_min);
        const lonMax = parseFloat(dep.lon_max);

        if (latNum >= latMin && latNum <= latMax && lonNum >= lonMin && lonNum <= lonMax) {
          setGpsStatus('ok');
          showSuccess(`Ubicación válida en ${dep.nombre_departamento}`);
        } else {
          setGpsStatus('error');
          showError(`Tu ubicación no corresponde a ${dep.nombre_departamento}. No puedes registrarte desde otra región.`);
        }
      } else {
        setGpsStatus('ok');
      }
    } catch (err) {
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
      onLogin();
    } catch (error) {
      const msg = error.data ? JSON.stringify(error.data) : error.message;
      showError(msg || 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  }

  if (deptsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loaderText}>Cargando departamentos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: COLORS.white }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>STODDIE</Text>
            <Text style={styles.subtitle}>Crear cuenta</Text>
            <Text style={styles.subtitle2}>Sistema de Reportes Ciudadanos</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombres</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Juan Carlos"
            />

            <Text style={styles.label}>Apellidos</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Pérez Gómez"
            />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
            />

            <Text style={styles.label}>Contraseña (mín. 8 caracteres)</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Text style={styles.label}>Departamento (obligatorio)</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectorText}>{selectedDepartamentoLabel}</Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Verificación de ubicación (GPS)</Text>
            <TouchableOpacity
              style={[
                styles.gpsBtn,
                gpsStatus === 'ok' && styles.gpsBtnOk,
                gpsStatus === 'error' && styles.gpsBtnError,
              ]}
              onPress={verifyLocation}
              activeOpacity={0.7}
            >
              <Text style={styles.gpsBtnText}>
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
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleRegister}>
              <Text style={styles.buttonPrimaryText}>Registrarse</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.linkButton} onPress={onLogin} activeOpacity={0.7}>
            <Text style={styles.linkText}>Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Selecciona tu departamento</Text>
            <ScrollView style={styles.modalScroll}>
              {departamentos.map((d) => (
                <TouchableOpacity
                  key={d.id_departamento}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedDepartamentoId(d.id_departamento);
                    setSelectedDepartamentoLabel(d.nombre_departamento);
                    setSelectedDepartamento(d);
                    setShowPicker(false);
                    setGpsStatus(null);
                    setGpsCoords(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalItemText}>{d.nombre_departamento}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowPicker(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.pureLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 36, fontWeight: 'bold', color: COLORS.navy, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: COLORS.textMedium, marginTop: 4 },
  subtitle2: { fontSize: 12, color: COLORS.serenityBlue, marginTop: 2 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.textDark,
  },
  selector: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  selectorText: { fontSize: 16, flex: 1, color: COLORS.textDark },
  selectorArrow: { fontSize: 14, color: COLORS.navy },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: COLORS.accentWarm,
    borderColor: COLORS.navy,
  },
  gpsBtnOk: { backgroundColor: COLORS.accent, borderColor: COLORS.navy },
  gpsBtnError: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  gpsBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.navy },
  gpsInfo: { fontSize: 12, fontStyle: 'italic', textAlign: 'center', color: COLORS.textMedium },
  loading: { marginVertical: 20 },
  buttonPrimary: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.navy, fontSize: 14, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalScroll: { maxHeight: 300 },
  modalItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalItemText: { fontSize: 16, color: COLORS.textDark },
  modalClose: {
    marginTop: 12,
    padding: 10,
    alignItems: 'center',
  },
  modalCloseText: { fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  loaderText: { color: COLORS.textMedium, marginTop: 12, fontSize: 14 },
});