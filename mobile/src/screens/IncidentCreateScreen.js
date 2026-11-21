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
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

export default function IncidentCreateScreen({ onBack, onCreated }) {
  const { showError, showSuccess } = useToast();
  const [tipoRiesgoOptions, setTipoRiesgoOptions] = useState([]);
  const [severidadOptions, setSeveridadOptions] = useState([]);
  const [zonaOptions, setZonaOptions] = useState([]);
  const [selectedTipoRiesgoId, setSelectedTipoRiesgoId] = useState(null);
  const [selectedTipoRiesgoLabel, setSelectedTipoRiesgoLabel] = useState('Selecciona...');
  const [selectedSeveridadId, setSelectedSeveridadId] = useState(null);
  const [selectedSeveridadLabel, setSelectedSeveridadLabel] = useState('Selecciona...');
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [selectedZonaLabel, setSelectedZonaLabel] = useState('Selecciona...');
  const [descripcion, setDescripcion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(null);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [riskTypes, severityLevels] = await Promise.all([
          apiRequest('risk-types/'),
          apiRequest('severity-levels/'),
        ]);
        setTipoRiesgoOptions(riskTypes.results || riskTypes);
        setSeveridadOptions(severityLevels.results || severityLevels);
      } catch {
        showError('No se pudieron cargar los catálogos de riesgo');
      } finally {
        setCatalogsLoading(false);
      }
    }
    loadCatalogs();
  }, [showError]);

  useEffect(() => {
    async function loadZones() {
      try {
        const data = await apiRequest('geography/zones/');
        setZonaOptions(data.results || data);
      } catch {
        // Zonas opcionales
      }
    }
    loadZones();
  }, []);

  async function useCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Se necesita permiso de ubicación.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitud(location.coords.latitude.toFixed(6));
      setLongitud(location.coords.longitude.toFixed(6));
      showSuccess('Ubicación obtenida correctamente');
    } catch {
      showError('No se pudo obtener la ubicación actual');
    }
  }

  async function handleSubmit() {
    if (!selectedTipoRiesgoId) {
      showError('Selecciona un tipo de riesgo');
      return;
    }
    if (!descripcion.trim()) {
      showError('Escribe una descripción del incidente');
      return;
    }
    if (!latitud || !longitud) {
      showError('Ingresa latitud y longitud');
      return;
    }
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showError('Coordenadas inválidas. Latitud: -90 a 90, Longitud: -180 a 180');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('incidents/', {
        method: 'POST',
        body: {
          tipo_riesgo: selectedTipoRiesgoId,
          nivel_severidad: selectedSeveridadId || null,
          zona: selectedZonaId || null,
          descripcion: descripcion.trim(),
          latitud: lat,
          longitud: lng,
          referencia_ubicacion: referencia.trim() || null,
        },
      });
      showSuccess('¡Incidente registrado exitosamente!');
      onCreated();
    } catch (error) {
      const msg = error.data ? JSON.stringify(error.data) : error.message;
      showError(msg || 'No se pudo guardar el incidente');
    } finally {
      setLoading(false);
    }
  }

  if (catalogsLoading) {
    return (
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando catálogos...</Text>
      </View>
    );
  }

  const pickerContent = () => {
    const options = showPicker === 'riesgo' ? tipoRiesgoOptions : showPicker === 'severidad' ? severidadOptions : zonaOptions;
    const labelField = showPicker === 'riesgo' ? 'nombre_riesgo' : showPicker === 'severidad' ? 'nombre_nivel' : 'nombre_zona';
    const idField = showPicker === 'riesgo' ? 'id_tipo_riesgo' : showPicker === 'severidad' ? 'id_nivel_severidad' : 'id_zona';
    const setSelected = (id, label) => {
      if (showPicker === 'riesgo') { setSelectedTipoRiesgoId(id); setSelectedTipoRiesgoLabel(label); }
      else if (showPicker === 'severidad') { setSelectedSeveridadId(id); setSelectedSeveridadLabel(label); }
      else { setSelectedZonaId(id); setSelectedZonaLabel(label); }
      setShowPicker(null);
    };

    return (
      <View style={GLASS.modalOverlay}>
        <View style={GLASS.modalBox}>
          <Text style={styles.modalTitle}>
            {showPicker === 'riesgo' ? 'Tipo de riesgo' : showPicker === 'severidad' ? 'Nivel de severidad' : 'Zona'}
          </Text>
          <ScrollView style={styles.modalScroll} nestedScrollEnabled>
            {options.length === 0 ? (
              <Text style={styles.modalEmpty}>Cargando opciones...</Text>
            ) : (
              options.map((opt) => (
                <TouchableOpacity
                  key={opt[idField]}
                  style={GLASS.modalItem}
                  onPress={() => setSelected(opt[idField], opt[labelField])}
                  activeOpacity={0.82}
                >
                  <Text style={styles.modalItemText}>{opt[labelField]}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowPicker(null)} activeOpacity={0.82}>
            <Text style={styles.modalCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={GLASS.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[GLASS.card, styles.card]}>
          <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
            <Text style={GLASS.backText}>← Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Nuevo Incidente</Text>
          <Text style={styles.subtitle}>Reporta un riesgo natural urbano en Bolivia</Text>

          <View style={styles.form}>
            <Text style={GLASS.label}>Tipo de riesgo (obligatorio)</Text>
            <TouchableOpacity style={GLASS.selector} onPress={() => setShowPicker('riesgo')} activeOpacity={0.82}>
              <Text style={styles.selectorText}>{selectedTipoRiesgoLabel}</Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={[GLASS.label, { marginTop: 12 }]}>Nivel de severidad (opcional)</Text>
            <TouchableOpacity style={GLASS.selector} onPress={() => setShowPicker('severidad')} activeOpacity={0.82}>
              <Text style={styles.selectorText}>{selectedSeveridadLabel}</Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={[GLASS.label, { marginTop: 12 }]}>Zona (opcional)</Text>
            <TouchableOpacity style={GLASS.selector} onPress={() => setShowPicker('zona')} activeOpacity={0.82}>
              <Text style={styles.selectorText}>{selectedZonaLabel}</Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={[GLASS.label, { marginTop: 12 }]}>Descripción</Text>
            <TextInput
              style={GLASS.textarea}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="¿Qué estás observando? (ej. posible inundación en la avenida...)"
              placeholderTextColor={COLORS.textMedium}
              multiline
              numberOfLines={4}
            />

            <View style={styles.locationRow}>
              <View style={styles.locationCol}>
                <Text style={[GLASS.label, { marginTop: 12 }]}>Latitud</Text>
                <TextInput
                  style={GLASS.input}
                  value={latitud}
                  onChangeText={setLatitud}
                  keyboardType="numeric"
                  placeholder="-16.5..."
                  placeholderTextColor={COLORS.textMedium}
                />
              </View>
              <View style={styles.locationCol}>
                <Text style={[GLASS.label, { marginTop: 12 }]}>Longitud</Text>
                <TextInput
                  style={GLASS.input}
                  value={longitud}
                  onChangeText={setLongitud}
                  keyboardType="numeric"
                  placeholder="-68.1..."
                  placeholderTextColor={COLORS.textMedium}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.useLocationBtn} onPress={useCurrentLocation} activeOpacity={0.82}>
              <Text style={styles.useLocationText}>📍 Usar ubicación actual (GPS)</Text>
            </TouchableOpacity>

            <Text style={[GLASS.label, { marginTop: 12 }]}>Referencia de ubicación (opcional)</Text>
            <TextInput
              style={GLASS.input}
              value={referencia}
              onChangeText={setReferencia}
              placeholder="Cerca del mercado, esquina con calle 5..."
              placeholderTextColor={COLORS.textMedium}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.navy} style={styles.loading} />
          ) : (
            <TouchableOpacity style={GLASS.buttonAction} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={styles.buttonIcon}>📋</Text>
              <Text style={GLASS.buttonActionText}>Registrar Incidente</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showPicker && pickerContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  card: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.navy },
  subtitle: { fontSize: 13, color: COLORS.cocoa, marginBottom: 18, fontWeight: '600' },
  form: {},
  selectorText: {
    fontSize: 15,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    color: COLORS.ink,
    fontWeight: '600',
    marginRight: 8,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  selectorArrow: { fontSize: 13, color: COLORS.navy },
  locationRow: { flexDirection: 'row', gap: 10 },
  locationCol: { flex: 1 },
  useLocationBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.champagne,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  useLocationText: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  loading: { marginVertical: 20 },
  buttonIcon: { fontSize: 20, color: COLORS.white },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink, marginBottom: 12, textAlign: 'center' },
  modalScroll: { maxHeight: 320 },
  modalItemText: { fontSize: 15, color: COLORS.ink, fontWeight: '600' },
  modalEmpty: { color: COLORS.cocoa, paddingVertical: 12, textAlign: 'center' },
  modalClose: { marginTop: 12, minHeight: 44, borderRadius: 12, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
});
