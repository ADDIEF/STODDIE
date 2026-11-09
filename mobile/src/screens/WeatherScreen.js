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
import { apiRequest } from '../api/client';
import { COLORS } from '../App';

export default function WeatherScreen({ onBack }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(null);
  const [selectedDepartamentoLabel, setSelectedDepartamentoLabel] = useState('Selecciona un departamento...');
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deptsLoading, setDeptsLoading] = useState(true);
  [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    async function loadDepartamentos() {
      try {
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

  async function consultarClima() {
    if (!selectedDepartamentoId) {
      Alert.alert('Campo requerido', 'Selecciona un departamento.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest(
        `weather/sources/forecast/?departamento_id=${selectedDepartamentoId}`
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
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={[styles.backText, { color: COLORS.tan }]}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: COLORS.tan }]}>Información meteorológica</Text>
          <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>Consulta por departamento de Bolivia</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
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
                {departamentos.map((d) => (
                  <TouchableOpacity
                    key={d.id_departamento}
                    style={[styles.pickerItem, { borderBottomColor: COLORS.tan }]}
                    onPress={() => {
                      setSelectedDepartamentoId(d.id_departamento);
                      setSelectedDepartamentoLabel(d.nombre_departamento);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, { color: COLORS.spaceCadet }]}>{d.nombre_departamento}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.coffee }]} onPress={consultarClima}>
            <Text style={[styles.buttonText, { color: '#FFF' }]}>
              {loading ? 'Consultando...' : 'Consultar clima por departamento'}
            </Text>
          </TouchableOpacity>
        </View>

        {clima && (
          <View style={[styles.resultCard, { backgroundColor: '#FFF', borderLeftColor: COLORS.caput }]}>
            <Text style={[styles.resultTitle, { color: COLORS.spaceCadet }]}>Resultado - {clima.ubicacion}</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: COLORS.slateGray }]}>Proveedor:</Text>
              <Text style={[styles.resultValue, { color: COLORS.spaceCadet }]}>{clima.proveedor}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: COLORS.slateGray }]}>Temperatura:</Text>
              <Text style={[styles.resultValue, { color: COLORS.spaceCadet }]}>
                {clima.temperatura != null ? `${clima.temperatura} °C` : '—'}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: COLORS.slateGray }]}>Viento:</Text>
              <Text style={[styles.resultValue, { color: COLORS.spaceCadet }]}>
                {clima.viento_velocidad != null ? `${clima.viento_velocidad} km/h` : '—'}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: COLORS.slateGray }]}>Dirección viento:</Text>
              <Text style={[styles.resultValue, { color: COLORS.spaceCadet }]}>
                {clima.viento_direccion != null ? `${clima.viento_direccion}°` : '—'}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: COLORS.slateGray }]}>Fecha/Hora:</Text>
              <Text style={[styles.resultValue, { color: COLORS.spaceCadet }]}>
                {clima.fecha_hora || '—'}
              </Text>
            </View>
            <Text style={[styles.disclaimer, { color: COLORS.slateGray }]}>
              Información de referencia de {clima.proveedor}. No representa una alerta oficial.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  header: { marginBottom: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  subtitle: { fontSize: 14, marginTop: 4 },
  form: { gap: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  selectorGroup: { position: 'relative', marginBottom: 4 },
  selector: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
    width: '100%',
  },
  selectorText: { fontSize: 16, flex: 1 },
  selectorArrow: { fontSize: 14 },
  pickerList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 260,
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  pickerItemText: { fontSize: 15 },
  button: {
    backgroundColor: COLORS.coffee,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  resultRow: { marginBottom: 10 },
  resultLabel: { fontSize: 13, fontWeight: '600' },
  resultValue: { fontSize: 15, marginTop: 2 },
  disclaimer: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
