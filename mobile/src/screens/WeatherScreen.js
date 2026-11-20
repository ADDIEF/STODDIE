import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function getIcon(code) { return WEATHER_ICONS[code] || '🌡️'; }
function getWindArrow(degrees) {
  if (degrees == null) return '→';
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  return arrows[Math.round(degrees / 45) % 8];
}

export default function WeatherScreen({ onBack }) {
  const { showError } = useToast();
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(null);
  const [selectedDepartamentoLabel, setSelectedDepartamentoLabel] = useState('Selecciona un departamento...');
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
        showError('No se pudieron cargar los departamentos');
      } finally {
        setDeptsLoading(false);
      }
    }
    loadDepartamentos();
  }, [showError]);

  async function consultarClima() {
    if (!selectedDepartamentoId) {
      showError('Selecciona un departamento');
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
        showError(error.data?.detail || 'Servicio no disponible');
      } else {
        showError(error.message || 'No se pudo consultar el clima');
      }
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

  const actual = clima?.actual;
  const porHora = clima?.por_hora || [];
  const pronostico7 = clima?.pronostico_7_dias || [];
  const weatherCode = actual?.codigo_clima;
  const semaforoColor = weatherCode === 0 ? '#2E9E5B' : weatherCode <= 3 ? '#E0A100' : weatherCode >= 80 ? COLORS.rust : COLORS.serenityBlue;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={GLASS.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
            <Text style={GLASS.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={GLASS.titleOnDark}>Tiempo en Bolivia</Text>
          <Text style={GLASS.subtitleOnDark}>Pronóstico por departamento</Text>
        </View>

        <View style={GLASS.card}>
          <Text style={GLASS.label}>Departamento</Text>
          <TouchableOpacity style={GLASS.selector} onPress={() => setShowPicker(!showPicker)} activeOpacity={0.82}>
            <Text style={styles.selectorText}>{selectedDepartamentoLabel}</Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
          {showPicker && (
            <View style={styles.pickerList}>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {departamentos.map((d) => (
                  <TouchableOpacity
                    key={d.id_departamento}
                    style={GLASS.modalItem}
                    onPress={() => {
                      setSelectedDepartamentoId(d.id_departamento);
                      setSelectedDepartamentoLabel(d.nombre_departamento);
                      setShowPicker(false);
                      setClima(null);
                    }}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.pickerItemText}>{d.nombre_departamento}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={[GLASS.buttonPrimary, { marginTop: 14 }]} onPress={consultarClima} activeOpacity={0.85}>
            <Text style={GLASS.buttonPrimaryText}>{loading ? 'Consultando...' : 'Ver pronóstico'}</Text>
          </TouchableOpacity>
        </View>

        {clima && actual && (
          <>
            <View style={[GLASS.card, { borderLeftWidth: 5, borderLeftColor: semaforoColor, marginTop: 14 }]}>
              <View style={styles.semaforoRow}>
                <View style={[styles.semaforoDot, { backgroundColor: semaforoColor }]} />
                <Text style={styles.semaforoLabel}>Condición actual: {actual.descripcion}</Text>
              </View>
              <Text style={styles.currentLocation}>Tiempo en {clima.ubicacion}</Text>
              <Text style={styles.currentDateTime}>{actual.fecha_hora ? actual.fecha_hora.replace('T', ' | ') : ''}</Text>
              <View style={styles.currentMain}>
                <View style={styles.currentLeft}>
                  <Text style={styles.currentTemp}>{actual.temperatura != null ? `${Math.round(actual.temperatura)}°` : '—'}</Text>
                  {actual.sensacion_termica != null && (
                    <Text style={styles.currentSensacion}>Sensación de {Math.round(actual.sensacion_termica)}°</Text>
                  )}
                </View>
                <View style={styles.currentRight}>
                  <Text style={styles.windIcon}>{getWindArrow(actual.viento_direccion)}</Text>
                  <Text style={styles.windText}>{actual.viento_direccion_texto}</Text>
                  <Text style={styles.windSpeed}>{actual.viento_velocidad != null ? `${actual.viento_velocidad} km/h` : '—'}</Text>
                </View>
              </View>
              <View style={styles.currentLinks}>
                <Text style={styles.linkText}>Tiempo 1-7 días</Text>
                <Text style={styles.linkText}>|</Text>
                <Text style={styles.linkText}>Mapa de lluvia</Text>
                <Text style={styles.linkText}>|</Text>
                <Text style={styles.linkText}>Satélites</Text>
              </View>
            </View>

            {porHora.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Por hora</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyRow}>
                  {porHora.map((h, idx) => (
                    <View key={idx} style={styles.hourCard}>
                      <Text style={styles.hourTime}>{h.hora}</Text>
                      <Text style={styles.hourIcon}>{getIcon(h.codigo_clima)}</Text>
                      <Text style={styles.hourTemp}>{h.temperatura != null ? `${Math.round(h.temperatura)}°` : '—'}</Text>
                      <Text style={styles.hourDesc} numberOfLines={1}>{h.descripcion}</Text>
                      {h.viento_velocidad != null && (
                        <Text style={styles.hourMeta}>{getWindArrow(h.viento_direccion)} {h.viento_velocidad} km/h</Text>
                      )}
                      {h.precipitacion_prob != null && (
                        <Text style={styles.hourRain}>💧 {h.precipitacion_prob}%</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {pronostico7.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pronóstico 7 días</Text>
                <View style={styles.dailyRow}>
                  {pronostico7.map((d, idx) => (
                    <View key={idx} style={styles.dayCard}>
                      <Text style={styles.dayName}>{d.dia_nombre}</Text>
                      <Text style={styles.dayDate}>{d.fecha ? d.fecha.slice(5) : ''}</Text>
                      <Text style={styles.dayIcon}>{getIcon(d.codigo_clima)}</Text>
                      {d.precipitacion_prob != null && <Text style={styles.hourRain}>💧 {d.precipitacion_prob}%</Text>}
                      {d.precipitacion_mm != null && <Text style={styles.dayMeta}>{d.precipitacion_mm} mm</Text>}
                      <Text style={styles.dayTemp}>
                        {d.temperatura_max != null ? Math.round(d.temperatura_max) : '—'}° / {d.temperatura_min != null ? Math.round(d.temperatura_min) : '—'}°
                      </Text>
                      {d.viento_velocidad_max != null && <Text style={styles.dayMeta}>🌬️ {d.viento_velocidad_max} km/h</Text>}
                    </View>
                  ))}
                </View>
              </>
            )}

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
  scroll: { padding: 14, paddingBottom: 40 },
  header: { marginBottom: 14 },
  selectorText: { fontSize: 15, flex: 1, color: COLORS.ink, fontWeight: '600' },
  selectorArrow: { fontSize: 13, color: COLORS.navy },
  pickerList: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 14,
    marginTop: 6,
  },
  pickerItemText: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
  semaforoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  semaforoDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderDark },
  semaforoLabel: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  currentLocation: { fontSize: 22, fontWeight: '800', color: COLORS.navy, marginBottom: 2 },
  currentDateTime: { fontSize: 12, color: COLORS.cocoa, marginBottom: 12 },
  currentMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentLeft: { flex: 1 },
  currentTemp: { fontSize: 60, fontWeight: '800', color: COLORS.navy },
  currentSensacion: { fontSize: 13, color: COLORS.cocoa, marginTop: 4 },
  currentRight: { alignItems: 'center', paddingLeft: 12 },
  windIcon: { fontSize: 34 },
  windText: { fontSize: 12, color: COLORS.ink, fontWeight: '700' },
  windSpeed: { fontSize: 11, color: COLORS.cocoa },
  currentLinks: { flexDirection: 'row', gap: 7, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.glassBorderDark },
  linkText: { fontSize: 11, color: COLORS.navy, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.pureLight, marginTop: 20, marginBottom: 10, textShadowColor: '#000', textShadowRadius: 4 },
  hourlyRow: { flexDirection: 'row', paddingVertical: 6 },
  hourCard: {
    backgroundColor: COLORS.glassStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 86,
  },
  hourTime: { fontSize: 12, color: COLORS.cocoa, fontWeight: '700' },
  hourIcon: { fontSize: 26, marginVertical: 3 },
  hourTemp: { fontSize: 18, fontWeight: '800', color: COLORS.navy },
  hourDesc: { fontSize: 10, color: COLORS.cocoa, textAlign: 'center' },
  hourMeta: { fontSize: 10, color: COLORS.ink, marginTop: 2 },
  hourRain: { fontSize: 10, color: COLORS.navy, marginTop: 2, fontWeight: '700' },
  dailyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCard: {
    backgroundColor: COLORS.glassStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 10,
    alignItems: 'center',
    width: '18%',
    minWidth: 68,
  },
  dayName: { fontSize: 11, color: COLORS.cocoa, fontWeight: '700' },
  dayDate: { fontSize: 10, color: COLORS.cocoa },
  dayIcon: { fontSize: 22, marginVertical: 3 },
  dayMeta: { fontSize: 9, color: COLORS.cocoa },
  dayTemp: { fontSize: 11, fontWeight: '800', color: COLORS.navy, marginTop: 3 },
  recomCard: {
    backgroundColor: COLORS.glassWarm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.rust,
    padding: 14,
  },
  recomText: { fontSize: 13, color: COLORS.ink, lineHeight: 20 },
  disclaimer: { fontSize: 11, color: COLORS.pureLight, marginTop: 18, fontStyle: 'italic', textAlign: 'center' },
});
