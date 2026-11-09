import { useState } from 'react';
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
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';

export default function WeatherScreen({ onBack }) {
  const [latitud, setLatitud] = useState('-16.5');
  const [longitud, setLongitud] = useState('-68.1');
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(false);

  async function consultarClima() {
    if (!latitud || !longitud) {
      Alert.alert('Campos requeridos', 'Ingresa latitud y longitud.');
      return;
    }
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Coordenadas inválidas', 'Latitud: -90 a 90. Longitud: -180 a 180.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest(
        `weather/sources/forecast/?latitud=${latitud}&longitud=${longitud}`
      );
      setClima(data);
    } catch (error) {
      if (error.status === 503) {
        Alert.alert(
          'Servicio no disponible',
          error.data?.detail || 'El servicio meteorológico no está disponible en este momento.'
        );
      } else {
        Alert.alert('Error', error.message || 'No se pudo consultar el clima.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Información meteorológica</Text>
          <Text style={styles.subtitle}>Consulta de referencia climática</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Latitud</Text>
          <TextInput
            style={styles.input}
            value={latitud}
            onChangeText={setLatitud}
            keyboardType="numeric"
            placeholder="-16.5..."
          />

          <Text style={styles.label}>Longitud</Text>
          <TextInput
            style={styles.input}
            value={longitud}
            onChangeText={setLongitud}
            keyboardType="numeric"
            placeholder="-68.1..."
          />

          <TouchableOpacity style={styles.button} onPress={consultarClima}>
            <Text style={styles.buttonText}>
              {loading ? 'Consultando...' : 'Consultar clima'}
            </Text>
          </TouchableOpacity>
        </View>

        {clima && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Resultado</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Proveedor:</Text>
              <Text style={styles.resultValue}>{clima.proveedor}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Temperatura:</Text>
              <Text style={styles.resultValue}>
                {clima.temperatura != null ? `${clima.temperatura} °C` : '—'}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Viento:</Text>
              <Text style={styles.resultValue}>
                {clima.viento_velocidad != null ? `${clima.viento_velocidad} km/h` : '—'}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Dirección viento:</Text>
              <Text style={styles.resultValue}>
                {clima.viento_direccion != null ? `${clima.viento_direccion}°` : '—'}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Fecha/Hora:</Text>
              <Text style={styles.resultValue}>
                {clima.fecha_hora || '—'}
              </Text>
            </View>
            <Text style={styles.disclaimer}>
              Información de referencia de {clima.proveedor}. No representa una alerta oficial.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.spaceCadet },
  scrollContent: { flexGrow: 1, padding: 16 },
  header: { marginBottom: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: COLORS.tan, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.tan },
  subtitle: { fontSize: 14, color: COLORS.slateGray, marginTop: 4 },
  form: { gap: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.tan, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.slateGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.spaceCadet,
  },
  button: {
    backgroundColor: COLORS.coffee,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.spaceCadet, marginBottom: 12 },
  resultRow: { marginBottom: 10 },
  resultLabel: { fontSize: 13, fontWeight: '600', color: COLORS.slateGray },
  resultValue: { fontSize: 15, color: COLORS.spaceCadet, marginTop: 2 },
  disclaimer: {
    fontSize: 12,
    color: COLORS.slateGray,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});