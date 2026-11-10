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
  const { showToast, showError, showSuccess } = useToast();
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
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.tan }]}>STODDIE</Text>
          <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>Crear cuenta</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: COLORS.tan }]}>Nombres</Text>
          <TextInput
            style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Juan Carlos"
          />

          <Text style={[styles.label, { color: COLORS.tan }]}>Apellidos</Text>
          <TextInput
            style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Pérez Gómez"
          />

          <Text style={[styles.label, { color: COLORS.tan }]}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="correo@ejemplo.com"
          />

          <Text style={[styles.label, { color: COLORS.tan }]}>Contraseña (mín. 8 caracteres)</Text>
          <TextInput
            style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <Text style={[styles.label, { color: COLORS.tan }]}>Departamento (obligatorio)</Text>
          <TouchableOpacity
            style={[styles.selector, { borderColor: COLORS.slateGray }]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedDepartamentoLabel}</Text>
            <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { color: COLORS.tan }]}>Verificación de ubicación (GPS)</Text>
          <TouchableOpacity
            style={[
              styles.gpsBtn,
              { backgroundColor: gpsStatus === 'ok' ? COLORS.tan : '#e8f4fd', borderColor: COLORS.coffee }
            ]}
            onPress={verifyLocation}
          >
            <Text style={[styles.gpsBtnText, { color: COLORS.coffee }]}>
              {gpsStatus === 'loading' ? 'Obteniendo ubicación...' :
               gpsStatus === 'ok' ? '✅ Ubicación verificada' :
               gpsStatus === 'error' ? '❌ Error — Reintentar' :
               '📍 Verificar mi ubicación (GPS)'}
            </Text>
          </TouchableOpacity>
          {gpsCoords && gpsStatus === 'ok' && (
            <Text style={[styles.gpsInfo, { color: COLORS.slateGray }]}>
              Lat: {gpsCoords.lat.toFixed(4)}, Lon: {gpsCoords.lon.toFixed(4)}
            </Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={[styles.loading, { color: COLORS.coffee }]} />
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.coffee }]} onPress={handleRegister}>
            <Text style={[styles.buttonText, { color: '#FFF' }]}>Registrarse</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.link} onPress={onLogin}>
          <Text style={[styles.linkText, { color: COLORS.tan }]}>Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {showPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Selecciona tu departamento</Text>
            <ScrollView style={{ maxHeight: 300 }}>
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
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.tan },
  subtitle: { fontSize: 16, color: COLORS.slateGray, marginTop: 8 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.tan, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.spaceCadet,
  },
  selector: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  selectorText: { fontSize: 16, flex: 1 },
  selectorArrow: { fontSize: 14 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  gpsBtnText: { fontSize: 14, fontWeight: '600' },
  gpsInfo: { fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  loading: { marginVertical: 20 },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.spaceCadet,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemText: { fontSize: 16, color: COLORS.spaceCadet },
  modalClose: {
    marginTop: 12,
    padding: 10,
    alignItems: 'center',
  },
  modalCloseText: { fontSize: 14, color: COLORS.coffee, fontWeight: '600' },
});