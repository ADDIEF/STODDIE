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
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
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
  }, []);

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
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
        <Text style={styles.loaderText}>Cargando catálogos...</Text>
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{showPicker === 'riesgo' ? 'Tipo de riesgo' : showPicker === 'severidad' ? 'Nivel de severidad' : 'Zona'}</Text>
          <View style={styles.modalScroll}>
            {options.length === 0 ? (
              <Text style={styles.modalEmpty}>Cargando opciones...</Text>
            ) : (
              options.map((opt) => (
                <TouchableOpacity
                  key={opt[idField]}
                  style={styles.modalItem}
                  onPress={() => setSelected(opt[idField], opt[labelField])}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalItemText}>{opt[labelField]}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowPicker(null)}>
            <Text style={styles.modalCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.glassCard}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nuevo Incidente</Text>
          <Text style={styles.subtitle}>Reporta un riesgo natural urbano en La Paz</Text>

          <View style={styles.form}>
            <View style={styles.selectorGroup}>
              <Text style={styles.label}>Tipo de riesgo (obligatorio)</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowPicker('riesgo')}
                activeOpacity={0.7}
              >
                <Text style={styles.selectorText}>{selectedTipoRiesgoLabel}</Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectorGroup}>
              <Text style={styles.label}>Nivel de severidad (opcional)</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowPicker('severidad')}
                activeOpacity={0.7}
              >
                <Text style={styles.selectorText}>{selectedSeveridadLabel}</Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectorGroup}>
              <Text style={styles.label}>Zona (opcional)</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowPicker('zona')}
                activeOpacity={0.7}
              >
                <Text style={styles.selectorText}>{selectedZonaLabel}</Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.textarea}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="¿Qué estás observando? (ej. posible inundación en la avenida...)"
              multiline
              numberOfLines={4}
            />

            <View style={styles.locationRow}>
              <View style={styles.locationCol}>
                <Text style={styles.label}>Latitud</Text>
                <TextInput
                  style={styles.input}
                  value={latitud}
                  onChangeText={setLatitud}
                  keyboardType="numeric"
                  placeholder="-16.5..."
                />
              </View>
              <View style={styles.locationCol}>
                <Text style={styles.label}>Longitud</Text>
                <TextInput
                  style={styles.input}
                  value={longitud}
                  onChangeText={setLongitud}
                  keyboardType="numeric"
                  placeholder="-68.1..."
                />
              </View>
            </View>

            <TouchableOpacity style={styles.useLocationBtn} onPress={useCurrentLocation} activeOpacity={0.7}>
              <Text style={styles.useLocationText}>📍 Usar ubicación actual (GPS)</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Referencia de ubicación (opcional)</Text>
            <TextInput
              style={styles.input}
              value={referencia}
              onChangeText={setReferencia}
              placeholder="Cerca del mercado, esquina con calle 5..."
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.coffee} style={styles.loading} />
          ) : (
            <TouchableOpacity style={styles.buttonAction} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.buttonActionIcon}>📋</Text>
              <Text style={styles.buttonActionText}>Registrar Incidente</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showPicker && pickerContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: COLORS.tan, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.tan, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.slateGray, marginBottom: 20 },
  form: { gap: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.tan, marginBottom: 6 },
  selector: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  selectorText: { fontSize: 16, flex: 1, color: COLORS.spaceCadet, marginRight: 8 },
  selectorArrow: { fontSize: 14, color: COLORS.coffee },
  textarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.spaceCadet,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  locationRow: { flexDirection: 'row', gap: 10 },
  locationCol: { flex: 1 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.spaceCadet,
  },
  useLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(213, 184, 147, 0.25)',
    borderWidth: 1,
    borderColor: COLORS.coffee,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  useLocationText: { color: COLORS.coffee, fontSize: 14, fontWeight: '600' },
  loading: { marginVertical: 20 },
  buttonAction: {
    backgroundColor: COLORS.caput,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonActionIcon: { fontSize: 20, color: '#FFF' },
  buttonActionText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: COLORS.tan, marginTop: 12, fontSize: 14 },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(213, 184, 147, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.spaceCadet, marginBottom: 12, textAlign: 'center' },
  modalScroll: { maxHeight: 300 },
  modalItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalItemText: { fontSize: 16, color: COLORS.spaceCadet },
  modalEmpty: { color: COLORS.slateGray, paddingVertical: 12, textAlign: 'center' },
  modalClose: { marginTop: 12, padding: 10, alignItems: 'center' },
  modalCloseText: { fontSize: 14, color: COLORS.coffee, fontWeight: '600' },
});