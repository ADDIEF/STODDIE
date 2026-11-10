import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { authApi } from '../api/client';
import { COLORS } from '../theme/colors';

export default function RegisterScreen({ onRegister, onLogin }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(null);
  const [selectedDepartamentoLabel, setSelectedDepartamentoLabel] = useState('Selecciona tu departamento...');
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // null, 'loading', 'ok', 'error'
  const [gpsCoords, setGpsCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deptsLoading, setDeptsLoading] = useState(true);

  useEffect(() => {
    async function loadDepartamentos() {
      try {
        const { apiRequest } = await import('../api/client');
        const data = await apiRequest('geography/departments/');
        setDepartamentos(data.results || data);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los departamentos');
      } finally {
        setDeptsLoading(false);
      }
    }
    loadDepartamentos();
  }, []);

  async function verificarUbicacion() {
    if (!selectedDepartamentoId) {
      Alert.alert('Selecciona departamento', 'Primero selecciona tu departamento.');
      return;
    }
    setGpsStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('error');
        Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación para validar tu departamento.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setGpsCoords({ lat, lon });

      if (selectedDepartamento && selectedDepartamento.contiene_coordenada) {
        const dentro = (
          lat >= parseFloat(selectedDepartamento.lat_min) &&
          lat <= parseFloat(selectedDepartamento.lat_max) &&
          lon >= parseFloat(selectedDepartamento.lon_min) &&
          lon <= parseFloat(selectedDepartamento.lon_max)
        );
        if (dentro) {
          setGpsStatus('ok');
          Alert.alert('Ubicación válida', `Tu ubicación (${lat.toFixed(4)}, ${lon.toFixed(4)}) corresponde a ${selectedDepartamento.nombre_departamento}.`);
        } else {
          setGpsStatus('error');
          Alert.alert('Ubicación no válida', `Tu ubicación (${lat.toFixed(4)}, ${lon.toFixed(4)}) no corresponde a ${selectedDepartamento.nombre_departamento}. No puedes reportar en otra región.`);
        }
      } else {
        setGpsStatus('ok');
      }
    } catch {
      setGpsStatus('error');
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    }
  }

  async function handleRegister() {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (!selectedDepartamentoId) {
      Alert.alert('Departamento requerido', 'Selecciona tu departamento.');
      return;
    }
    if (!gpsCoords) {
      Alert.alert('Verificación requerida', 'Debes verificar tu ubicación con GPS antes de registrarte.');
      return;
    }
    if (gpsStatus !== 'ok') {
      Alert.alert('Ubicación no válida', 'Tu ubicación no corresponde al departamento seleccionado.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 8 caracteres.');
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
      Alert.alert('Registro exitoso', 'Tu cuenta fue creada. Ahora inicia sesión.');
      onLogin();
    } catch (error) {
      Alert.alert('Error al registrarse', error.message || 'No se pudo completar el registro');
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
            onPress={() => setShowPicker(!showPicker)}
          >
            <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedDepartamentoLabel}</Text>
            <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
          </TouchableOpacity>
          {showPicker && (
            <View style={[styles.pickerList, { borderColor: COLORS.slateGray }]}>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {departamentos.map((d) => (
                  <TouchableOpacity
                    key={d.id_departamento}
                    style={[styles.pickerItem, { borderBottomColor: COLORS.tan }]}
                    onPress={() => {
                      setSelectedDepartamentoId(d.id_departamento);
                      setSelectedDepartamentoLabel(d.nombre_departamento);
                      setSelectedDepartamento(d);
                      setShowPicker(false);
                      setGpsStatus(null);
                      setGpsCoords(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, { color: COLORS.spaceCadet }]}>{d.nombre_departamento}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[styles.label, { color: COLORS.tan }]}>Verificación de ubicación (GPS)</Text>
          <TouchableOpacity
            style={[
              styles.gpsBtn,
              { backgroundColor: gpsStatus === 'ok' ? COLORS.tan : '#e8f4fd', borderColor: COLORS.coffee }
            ]}
            onPress={verificarUbicacion}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 8 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  pickerList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 8,
    marginTop: 4,
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  pickerItemText: { fontSize: 15 },
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
});
