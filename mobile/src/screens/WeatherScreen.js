import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';

// Iconos de clima basados en el código WMO
const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function getIcon(code) {
  return WEATHER_ICONS[code] || '🌡️';
}

function getWindArrow(degrees) {
  if (degrees == null) return '→';
  // Convertir grados a flecha
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const idx = Math.round(degrees / 45) % 8;
  return arrows[idx];
}

export default function WeatherScreen({ onBack }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(null);
  const [selectedDepartamentoLabel, setSelectedDepartamentoLabel] = useState('Selecciona un departamento...');
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

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

  const actual = clima?.actual;
  const porHora = clima?.por_hora || [];
  const pronostico7 = clima?.pronostico_7_dias || [];

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
          <Text style={[styles.title, { color: COLORS.tan }]}>Tiempo en Bolivia</Text>
          <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>Pronóstico por departamento</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Departamento</Text>
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
                        setClima(null);
                      }}
                    >
                      <Text style={[styles.pickerItemText, { color: COLORS.spaceCadet }]}>{d.nombre_departamento}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.coffee }]} onPress={consultarClima}>
            <Text style={[styles.buttonText, { color: '#FFF' }]}>
              {loading ? 'Consultando...' : 'Ver pronóstico'}
            </Text>
          </TouchableOpacity>
        </View>

        {clima && actual && (
          <>
            {/* Tiempo actual estilo noticiero */}
            <View style={styles.currentCard}>
              <Text style={styles.currentLocation}>Tiempo en {clima.ubicacion}</Text>
              <Text style={styles.currentDateTime}>
                {actual.fecha_hora ? actual.fecha_hora.replace('T', ' | ') : ''}
              </Text>
              <View style={styles.currentMain}>
                <View style={styles.currentLeft}>
                  <Text style={styles.currentDesc}>{actual.descripcion}</Text>
                  <View style={styles.currentTempRow}>
                    <Text style={styles.currentIcon}>{getIcon(actual.codigo_clima)}</Text>
                    <Text style={styles.currentTemp}>{actual.temperatura != null ? `${Math.round(actual.temperatura)}°` : '—'}</Text>
                  </View>
                  {actual.sensacion_termica != null && (
                    <Text style={styles.currentSensacion}>Sensación de {Math.round(actual.sensacion_termica)}°</Text>
                  )}
                </View>
                <View style={styles.currentRight}>
                  <Text style={styles.currentWindIcon}>{getWindArrow(actual.viento_direccion)}</Text>
                  <Text style={styles.currentWindText}>{actual.viento_direccion_texto}</Text>
                  <Text style={styles.currentWindSpeed}>{actual.viento_velocidad != null ? `${actual.viento_velocidad} km/h` : '—'}</Text>
                </View>
              </View>
              <View style={styles.currentLinks}>
                <Text style={styles.linkText}>Tiempo 1 - 7 días</Text>
                <Text style={styles.linkText}>|</Text>
                <Text style={styles.linkText}>Mapa de lluvia</Text>
                <Text style={styles.linkText}>|</Text>
                <Text style={styles.linkText}>Satélites</Text>
              </View>
            </View>

            {/* Pronóstico por hora */}
            {porHora.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Por hora</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyRow}>
                  {porHora.map((h, idx) => (
                    <View key={idx} style={styles.hourCard}>
                      <Text style={styles.hourTime}>{h.hora}</Text>
                      <Text style={styles.hourIcon}>{getIcon(h.codigo_clima)}</Text>
                      <Text style={styles.hourTemp}>{h.temperatura != null ? `${Math.round(h.temperatura)}°` : '—'}</Text>
                      <Text style={styles.hourDesc}>{h.descripcion}</Text>
                      {h.viento_velocidad != null && (
                        <Text style={styles.hourWind}>{getWindArrow(h.viento_direccion)} {h.viento_velocidad} km/h</Text>
                      )}
                      {h.precipitacion_prob != null && (
                        <Text style={styles.hourRain}>💧 {h.precipitacion_prob}%</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Pronóstico 7 días */}
            {pronostico7.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pronóstico 7 días</Text>
                <View style={styles.dailyRow}>
                  {pronostico7.map((d, idx) => (
                    <View key={idx} style={styles.dayCard}>
                      <Text style={styles.dayName}>{d.dia_nombre}</Text>
                      <Text style={styles.dayDate}>{d.fecha ? d.fecha.slice(5) : ''}</Text>
                      <Text style={styles.dayIcon}>{getIcon(d.codigo_clima)}</Text>
                      {d.precipitacion_prob != null && (
                        <Text style={styles.dayRain}>💧 {d.precipitacion_prob}%</Text>
                      )}
                      {d.precipitacion_mm != null && (
                        <Text style={styles.dayMm}>{d.precipitacion_mm} mm</Text>
                      )}
                      <Text style={styles.dayTemp}>
                        {d.temperatura_max != null ? Math.round(d.temperatura_max) : '—'}° / {d.temperatura_min != null ? Math.round(d.temperatura_min) : '—'}°
                      </Text>
                      {d.viento_velocidad_max != null && (
                        <Text style={styles.dayWind}>🌬️ {d.viento_velocidad_max} km/h</Text>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Recomendaciones */}
            {clima.recomendaciones && (
              <>
                <Text style={styles.sectionTitle}>Recomendaciones preventivas</Text>
                <View style={styles.recomCard}>
                  <Text style={styles.recomText}>{clima.recomendaciones}</Text>
                </View>
              </>
            )}

            <Text style={styles.disclaimer}>
              Información de referencia de {clima.proveedor}. No representa una alerta oficial.
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
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
  },
  pickerItem: { padding: 14, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 15 },
  button: {
    backgroundColor: COLORS.coffee,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  currentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    elevation: 2,
  },
  currentLocation: { fontSize: 22, fontWeight: 'bold', color: COLORS.spaceCadet },
  currentDateTime: { fontSize: 13, color: COLORS.slateGray, marginTop: 2, marginBottom: 12 },
  currentMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentLeft: { flex: 1 },
  currentDesc: { fontSize: 16, fontWeight: '600', color: COLORS.spaceCadet },
  currentTempRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  currentIcon: { fontSize: 48, marginRight: 12 },
  currentTemp: { fontSize: 64, fontWeight: 'bold', color: COLORS.spaceCadet },
  currentSensacion: { fontSize: 13, color: COLORS.slateGray, marginTop: 4 },
  currentRight: { alignItems: 'center', paddingLeft: 16 },
  currentWindIcon: { fontSize: 36 },
  currentWindText: { fontSize: 13, color: COLORS.spaceCadet, fontWeight: '600' },
  currentWindSpeed: { fontSize: 12, color: COLORS.slateGray },
  currentLinks: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  linkText: { fontSize: 12, color: COLORS.coffee, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.tan, marginTop: 20, marginBottom: 10 },
  hourlyRow: { flexDirection: 'row' },
  hourCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  hourTime: { fontSize: 12, color: COLORS.slateGray, fontWeight: '600' },
  hourIcon: { fontSize: 28, marginVertical: 4 },
  hourTemp: { fontSize: 18, fontWeight: 'bold', color: COLORS.spaceCadet },
  hourDesc: { fontSize: 10, color: COLORS.slateGray, textAlign: 'center' },
  hourWind: { fontSize: 10, color: COLORS.spaceCadet, marginTop: 2 },
  hourRain: { fontSize: 10, color: '#1E88E5', marginTop: 2 },
  dailyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: '18%',
    minWidth: 70,
  },
  dayName: { fontSize: 11, color: COLORS.slateGray, fontWeight: '600' },
  dayDate: { fontSize: 10, color: COLORS.slateGray },
  dayIcon: { fontSize: 24, marginVertical: 4 },
  dayRain: { fontSize: 10, color: '#1E88E5' },
  dayMm: { fontSize: 10, color: COLORS.slateGray },
  dayTemp: { fontSize: 12, fontWeight: 'bold', color: COLORS.spaceCadet, marginTop: 4 },
  dayWind: { fontSize: 10, color: COLORS.slateGray, marginTop: 2 },
  recomCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  recomText: { fontSize: 13, color: COLORS.spaceCadet, lineHeight: 20 },
  disclaimer: {
    fontSize: 12,
    color: COLORS.slateGray,
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
