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

export default function IncidentCreateScreen({ onBack, onCreated }) {
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

  const loadCatalogs = async () => {
    setCatalogsLoading(true);
    const [riskRes, sevRes, zoneRes] = await Promise.allSettled([
      apiRequest('risk-types/'),
      apiRequest('severity-levels/'),
      apiRequest('geography/zones/'),
    ]);
    if (riskRes.status === 'fulfilled') {
      setTipoRiesgoOptions(riskRes.value.results || riskRes.value);
    }
    if (sevRes.status === 'fulfilled') {
      setSeveridadOptions(sevRes.value.results || sevRes.value);
    }
    if (zoneRes.status === 'fulfilled') {
      setZonaOptions(zoneRes.value.results || zoneRes.value);
    }
    if (riskRes.status === 'rejected' && sevRes.status === 'rejected') {
      Alert.alert('Error', 'No se pudieron cargar los catálogos. Revisa tu conexión e inténtalo de nuevo.');
    }
    setCatalogsLoading(false);
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  async function useCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitud(location.coords.latitude.toFixed(6));
      setLongitud(location.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  }

  async function handleSubmit() {
    if (!selectedTipoRiesgoId) {
      Alert.alert('Campo requerido', 'Selecciona un tipo de riesgo.');
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert('Campo requerido', 'Escribe una descripción.');
      return;
    }
    if (!latitud || !longitud) {
      Alert.alert('Campo requerido', 'Ingresa latitud y longitud.');
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
      Alert.alert('Éxito', 'El incidente fue registrado correctamente.');
      onCreated();
    } catch (error) {
      const msg = error.data ? JSON.stringify(error.data) : error.message;
      Alert.alert('Error al registrar', msg || 'No se pudo guardar el incidente');
    } finally {
      setLoading(false);
    }
  }

  if (catalogsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
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
      <View style={[styles.pickerOverlay, { backgroundColor: COLORS.spaceCadet + 'DD' }]}>
        <View style={styles.pickerBox}>
          <Text style={[styles.pickerTitle, { color: COLORS.spaceCadet }]}>{showPicker === 'riesgo' ? 'Tipo de riesgo' : showPicker === 'severidad' ? 'Nivel de severidad' : 'Zona'}</Text>
          {options.length === 0 ? (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ color: COLORS.slateGray, paddingVertical: 8 }}>No se cargaron opciones. Revisa tu conexión.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { loadCatalogs(); }}>
                <Text style={[styles.retryBtnText, { color: COLORS.coffee }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={true}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt[idField]}
                  style={[styles.pickerItem, { borderBottomColor: '#E5E7EB' }]}
                  onPress={() => setSelected(opt[idField], opt[labelField])}
                >
                  <Text style={[styles.pickerItemText, { color: COLORS.spaceCadet }]} numberOfLines={2} ellipsizeMode="tail">{opt[labelField]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.pickerClose} onPress={() => setShowPicker(null)}>
            <Text style={[styles.pickerCloseText, { color: COLORS.coffee }]}>Cerrar</Text>
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={[styles.backText, { color: COLORS.tan }]}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: COLORS.tan }]}>Nuevo incidente</Text>
          <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>Reporta un riesgo natural urbano</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Tipo de riesgo (obligatorio)</Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: COLORS.slateGray }]}
              onPress={() => setShowPicker('riesgo')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedTipoRiesgoLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Nivel de severidad (opcional)</Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: COLORS.slateGray }]}
              onPress={() => setShowPicker('severidad')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedSeveridadLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Zona (opcional)</Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: COLORS.slateGray }]}
              onPress={() => setShowPicker('zona')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedZonaLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: COLORS.tan }]}>Descripción</Text>
          <TextInput
            style={[styles.textarea, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="¿Qué estás observando?"
            multiline
            numberOfLines={4}
          />

          <View style={styles.locationRow}>
            <View style={styles.locationCol}>
              <Text style={[styles.label, { color: COLORS.tan }]}>Latitud</Text>
              <TextInput
                style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
                value={latitud}
                onChangeText={setLatitud}
                keyboardType="numeric"
                placeholder="-16.5..."
              />
            </View>
            <View style={styles.locationCol}>
              <Text style={[styles.label, { color: COLORS.tan }]}>Longitud</Text>
              <TextInput
                style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
                value={longitud}
                onChangeText={setLongitud}
                keyboardType="numeric"
                placeholder="-68.1..."
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.useLocationBtn, { backgroundColor: COLORS.tan, borderColor: COLORS.coffee }]} onPress={useCurrentLocation}>
            <Text style={[styles.useLocationText, { color: COLORS.coffee }]}>📍 Usar ubicación actual (GPS)</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { color: COLORS.tan }]}>Referencia de ubicación (opcional)</Text>
          <TextInput
            style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]}
            value={referencia}
            onChangeText={setReferencia}
            placeholder="Cerca del mercado..."
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={[styles.loading, { color: COLORS.coffee }]} />
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.coffee }]} onPress={handleSubmit}>
            <Text style={[styles.buttonText, { color: '#FFF' }]}>Registrar incidente</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showPicker && pickerContent()}
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    width: '100%',
  },
  selectorText: { fontSize: 15, flex: 1, marginRight: 8, flexWrap: 'wrap', lineHeight: 20 },
  selectorArrow: { fontSize: 14 },
  textarea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  locationRow: { flexDirection: 'row', gap: 10 },
  locationCol: { flex: 1 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  useLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginVertical: 8,
  },
  useLocationText: { fontSize: 14, fontWeight: '600' },
  loading: { marginVertical: 20 },
  button: {
    backgroundColor: COLORS.coffee,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pickerBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    width: '92%',
    maxWidth: 420,
    maxHeight: 340,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  pickerItemText: { fontSize: 15, lineHeight: 20, flexShrink: 1, flexWrap: 'wrap' },
  pickerClose: {
    marginTop: 16,
    alignItems: 'center',
  },
  pickerCloseText: { fontSize: 16, fontWeight: '600' },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: COLORS.coffee, marginTop: 4 },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
});