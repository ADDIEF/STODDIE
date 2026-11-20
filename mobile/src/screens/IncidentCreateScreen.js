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

const SELECTED_PLACEHOLDER = 'Selecciona...';

const PICKER_CONFIG = {
  riesgo: {
    title: 'Tipo de riesgo',
    idField: 'id_tipo_riesgo',
    labelField: 'nombre_riesgo',
    detailField: null,
    setter: 'tipoRiesgo',
  },
  severidad: {
    title: 'Nivel de severidad',
    idField: 'id_nivel_severidad',
    labelField: 'nombre_nivel',
    detailField: null,
    setter: 'severidad',
  },
  departamento: {
    title: 'Departamento',
    idField: 'id_departamento',
    labelField: 'nombre_departamento',
    detailField: 'nombre_pais',
    setter: 'departamento',
  },
  provincia: {
    title: 'Provincia',
    idField: 'id_provincia',
    labelField: 'nombre_provincia',
    detailField: 'nombre_departamento',
    setter: 'provincia',
  },
  municipio: {
    title: 'Municipio',
    idField: 'id_municipio',
    labelField: 'nombre_municipio',
    detailField: 'nombre_provincia',
    setter: 'municipio',
  },
  localidad: {
    title: 'Localidad',
    idField: 'id_localidad',
    labelField: 'nombre_localidad',
    detailField: 'nombre_municipio',
    setter: 'localidad',
  },
  zona: {
    title: 'Zona / barrio (opcional)',
    idField: 'id_zona',
    labelField: 'nombre_zona',
    detailField: 'ruta_territorial',
    setter: 'zona',
  },
};

function toOptions(response) {
  const items = response?.results || response;
  return Array.isArray(items) ? items : [];
}

function optionLabel(config, option) {
  const label = option[config.labelField];
  const detail = config.detailField ? option[config.detailField] : null;
  return detail ? `${label} — ${detail}` : label;
}

function buildTerritorialRoute(selection) {
  const parts = [
    selection.departamentoLabel,
    selection.provinciaLabel,
    selection.municipioLabel,
    selection.localidadLabel,
    selection.zonaLabel,
  ].filter(Boolean);
  return parts.join(' - ');
}

export default function IncidentCreateScreen({ onBack, onCreated }) {
  const [tipoRiesgoOptions, setTipoRiesgoOptions] = useState([]);
  const [severidadOptions, setSeveridadOptions] = useState([]);
  const [departamentoOptions, setDepartamentoOptions] = useState([]);
  const [provinciaOptions, setProvinciaOptions] = useState([]);
  const [municipioOptions, setMunicipioOptions] = useState([]);
  const [localidadOptions, setLocalidadOptions] = useState([]);
  const [zonaOptions, setZonaOptions] = useState([]);
  const [selectedTipoRiesgoId, setSelectedTipoRiesgoId] = useState(null);
  const [selectedTipoRiesgoLabel, setSelectedTipoRiesgoLabel] = useState(SELECTED_PLACEHOLDER);
  const [selectedSeveridadId, setSelectedSeveridadId] = useState(null);
  const [selectedSeveridadLabel, setSelectedSeveridadLabel] = useState(SELECTED_PLACEHOLDER);
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [selectedZonaLabel, setSelectedZonaLabel] = useState(SELECTED_PLACEHOLDER);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(null);
  const [selectedDepartamentoLabel, setSelectedDepartamentoLabel] = useState(SELECTED_PLACEHOLDER);
  const [selectedProvinciaId, setSelectedProvinciaId] = useState(null);
  const [selectedProvinciaLabel, setSelectedProvinciaLabel] = useState(SELECTED_PLACEHOLDER);
  const [selectedMunicipioId, setSelectedMunicipioId] = useState(null);
  const [selectedMunicipioLabel, setSelectedMunicipioLabel] = useState(SELECTED_PLACEHOLDER);
  const [selectedLocalidadId, setSelectedLocalidadId] = useState(null);
  const [selectedLocalidadLabel, setSelectedLocalidadLabel] = useState(SELECTED_PLACEHOLDER);
  const [descripcion, setDescripcion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(null);
  const [showPicker, setShowPicker] = useState(null);
  const [geoLoadError, setGeoLoadError] = useState(false);

  async function loadOptions(picker, path, { clearFrom } = {}) {
    setLoadingOptions(picker);
    try {
      const response = await apiRequest(path);
      const options = toOptions(response);
      if (picker === 'provincia') setProvinciaOptions(options);
      if (picker === 'municipio') setMunicipioOptions(options);
      if (picker === 'localidad') setLocalidadOptions(options);
      if (picker === 'zona') setZonaOptions(options);
      setGeoLoadError(false);
    } catch (_error) {
      if (clearFrom) clearFrom();
      setGeoLoadError(true);
      Alert.alert(
        'Error',
        `No se pudieron cargar las opciones de ${PICKER_CONFIG[picker].title.toLowerCase()}. Revisa tu conexión e inténtalo de nuevo.`,
      );
    } finally {
      setLoadingOptions(null);
    }
  }

  function clearDownstream(level) {
    const clears = {
      departamento: ['provincia', 'municipio', 'localidad', 'zona'],
      provincia: ['municipio', 'localidad', 'zona'],
      municipio: ['localidad', 'zona'],
      localidad: ['zona'],
    };
    const levels = clears[level] || [];
    if (levels.includes('provincia')) {
      setProvinciaOptions([]);
      setSelectedProvinciaId(null);
      setSelectedProvinciaLabel(SELECTED_PLACEHOLDER);
    }
    if (levels.includes('municipio')) {
      setMunicipioOptions([]);
      setSelectedMunicipioId(null);
      setSelectedMunicipioLabel(SELECTED_PLACEHOLDER);
    }
    if (levels.includes('localidad')) {
      setLocalidadOptions([]);
      setSelectedLocalidadId(null);
      setSelectedLocalidadLabel(SELECTED_PLACEHOLDER);
    }
    if (levels.includes('zona')) {
      setZonaOptions([]);
      setSelectedZonaId(null);
      setSelectedZonaLabel(SELECTED_PLACEHOLDER);
    }
  }

  const loadCatalogs = async () => {
    setCatalogsLoading(true);
    const [riskRes, sevRes, deptRes] = await Promise.allSettled([
      apiRequest('risk-types/'),
      apiRequest('severity-levels/'),
      apiRequest('geography/departments/'),
    ]);
    if (riskRes.status === 'fulfilled') setTipoRiesgoOptions(toOptions(riskRes.value));
    if (sevRes.status === 'fulfilled') setSeveridadOptions(toOptions(sevRes.value));
    if (deptRes.status === 'fulfilled') setDepartamentoOptions(toOptions(deptRes.value));
    if (riskRes.status === 'rejected' && sevRes.status === 'rejected' && deptRes.status === 'rejected') {
      Alert.alert('Error', 'No se pudieron cargar los catálogos. Revisa tu conexión e inténtalo de nuevo.');
    }
    setCatalogsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadInitialCatalogs() {
      setCatalogsLoading(true);
      const [riskRes, sevRes, deptRes] = await Promise.allSettled([
        apiRequest('risk-types/'),
        apiRequest('severity-levels/'),
        apiRequest('geography/departments/'),
      ]);
      if (cancelled) return;
      if (riskRes.status === 'fulfilled') setTipoRiesgoOptions(toOptions(riskRes.value));
      if (sevRes.status === 'fulfilled') setSeveridadOptions(toOptions(sevRes.value));
      if (deptRes.status === 'fulfilled') setDepartamentoOptions(toOptions(deptRes.value));
      if (riskRes.status === 'rejected' && sevRes.status === 'rejected' && deptRes.status === 'rejected') {
        Alert.alert('Error', 'No se pudieron cargar los catálogos. Revisa tu conexión e inténtalo de nuevo.');
      }
      setCatalogsLoading(false);
    }
    loadInitialCatalogs();
    return () => {
      cancelled = true;
    };
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

  function selectOption(id, label) {
    const config = PICKER_CONFIG[showPicker];
    if (!config) return;
    const setter = config.setter;
    if (setter === 'tipoRiesgo') {
      setSelectedTipoRiesgoId(id);
      setSelectedTipoRiesgoLabel(label);
    } else if (setter === 'severidad') {
      setSelectedSeveridadId(id);
      setSelectedSeveridadLabel(label);
    } else if (setter === 'departamento') {
      setSelectedDepartamentoId(id);
      setSelectedDepartamentoLabel(label);
      clearDownstream('departamento');
      loadOptions('provincia', `geography/provinces/?id_departamento=${id}`);
    } else if (setter === 'provincia') {
      setSelectedProvinciaId(id);
      setSelectedProvinciaLabel(label);
      clearDownstream('provincia');
      loadOptions('municipio', `geography/municipalities/?id_provincia=${id}`);
    } else if (setter === 'municipio') {
      setSelectedMunicipioId(id);
      setSelectedMunicipioLabel(label);
      clearDownstream('municipio');
      loadOptions('localidad', `geography/localities/?id_municipio=${id}`);
    } else if (setter === 'localidad') {
      setSelectedLocalidadId(id);
      setSelectedLocalidadLabel(label);
      clearDownstream('localidad');
      loadOptions('zona', `geography/zones/?id_localidad=${id}`);
    } else if (setter === 'zona') {
      setSelectedZonaId(id);
      setSelectedZonaLabel(label);
    }
    setShowPicker(null);
  }

  function retryLoad() {
    if (!showPicker) return;
    const idByPicker = {
      departamento: selectedDepartamentoId,
      provincia: selectedProvinciaId,
      municipio: selectedMunicipioId,
      localidad: selectedLocalidadId,
      zona: selectedLocalidadId,
    };
    const id = idByPicker[showPicker];
    if (!id) {
      setShowPicker(null);
      loadCatalogs();
      return;
    }
    const pathByPicker = {
      provincia: `geography/provinces/?id_departamento=${id}`,
      municipio: `geography/municipalities/?id_provincia=${id}`,
      localidad: `geography/localities/?id_municipio=${id}`,
      zona: `geography/zones/?id_localidad=${id}`,
    };
    loadOptions(showPicker, pathByPicker[showPicker]);
  }

  if (catalogsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
      </View>
    );
  }

  const pickerContent = () => {
    const config = PICKER_CONFIG[showPicker];
    const options = {
      riesgo: tipoRiesgoOptions,
      severidad: severidadOptions,
      departamento: departamentoOptions,
      provincia: provinciaOptions,
      municipio: municipioOptions,
      localidad: localidadOptions,
      zona: zonaOptions,
    }[showPicker];
    const isLoading = loadingOptions === showPicker;

    return (
      <View style={[styles.pickerOverlay, { backgroundColor: COLORS.spaceCadet + 'DD' }]}>
        <View style={styles.pickerBox}>
          <Text style={[styles.pickerTitle, { color: COLORS.spaceCadet }]}>{config.title}</Text>
          {isLoading ? (
            <View style={styles.pickerLoading}>
              <ActivityIndicator size="large" color={COLORS.coffee} />
              <Text style={{ color: COLORS.slateGray }}>Cargando opciones...</Text>
            </View>
          ) : options.length === 0 ? (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ color: COLORS.slateGray, paddingVertical: 8 }}>No se cargaron opciones. Revisa tu conexión.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={retryLoad}>
                <Text style={[styles.retryBtnText, { color: COLORS.coffee }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={true}>
              {showPicker === 'zona' && (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: '#E5E7EB' }]}
                  onPress={() => selectOption(null, SELECTED_PLACEHOLDER)}
                >
                  <Text style={[styles.pickerItemText, { color: COLORS.slateGray }]}>Sin zona (opcional)</Text>
                </TouchableOpacity>
              )}
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt[config.idField]}
                  style={[styles.pickerItem, { borderBottomColor: '#E5E7EB' }]}
                  onPress={() => selectOption(opt[config.idField], optionLabel(config, opt))}
                >
                  <Text style={[styles.pickerItemText, { color: COLORS.spaceCadet }]} numberOfLines={2} ellipsizeMode="tail">{optionLabel(config, opt)}</Text>
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

  const territorialRoute = buildTerritorialRoute({
    departamentoLabel: selectedDepartamentoId ? selectedDepartamentoLabel : null,
    provinciaLabel: selectedProvinciaId ? selectedProvinciaLabel : null,
    municipioLabel: selectedMunicipioId ? selectedMunicipioLabel : null,
    localidadLabel: selectedLocalidadId ? selectedLocalidadLabel : null,
    zonaLabel: selectedZonaId ? selectedZonaLabel : null,
  });
  const canOpenPicker = (picker) => {
    if (picker === 'provincia') return Boolean(selectedDepartamentoId);
    if (picker === 'municipio') return Boolean(selectedProvinciaId);
    if (picker === 'localidad') return Boolean(selectedMunicipioId);
    if (picker === 'zona') return Boolean(selectedLocalidadId);
    return true;
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

          <Text style={[styles.sectionTitle, { color: COLORS.tan }]}>Ubicación territorial</Text>

          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Departamento (opcional)</Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: COLORS.slateGray }]}
              onPress={() => setShowPicker('departamento')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedDepartamentoLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Provincia (opcional)</Text>
            <TouchableOpacity
              style={[
                styles.selector,
                { borderColor: COLORS.slateGray },
                !canOpenPicker('provincia') && styles.selectorDisabled,
              ]}
              disabled={!canOpenPicker('provincia')}
              onPress={() => setShowPicker('provincia')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedProvinciaLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Municipio (opcional)</Text>
            <TouchableOpacity
              style={[
                styles.selector,
                { borderColor: COLORS.slateGray },
                !canOpenPicker('municipio') && styles.selectorDisabled,
              ]}
              disabled={!canOpenPicker('municipio')}
              onPress={() => setShowPicker('municipio')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedMunicipioLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Localidad (opcional)</Text>
            <TouchableOpacity
              style={[
                styles.selector,
                { borderColor: COLORS.slateGray },
                !canOpenPicker('localidad') && styles.selectorDisabled,
              ]}
              disabled={!canOpenPicker('localidad')}
              onPress={() => setShowPicker('localidad')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedLocalidadLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.selectorGroup, { borderColor: COLORS.slateGray }]}>
            <Text style={[styles.label, { color: COLORS.tan }]}>Zona / barrio (opcional)</Text>
            <TouchableOpacity
              style={[
                styles.selector,
                { borderColor: COLORS.slateGray },
                !canOpenPicker('zona') && styles.selectorDisabled,
              ]}
              disabled={!canOpenPicker('zona')}
              onPress={() => setShowPicker('zona')}
            >
              <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedZonaLabel}</Text>
              <Text style={[styles.selectorArrow, { color: COLORS.coffee }]}>▼</Text>
            </TouchableOpacity>
          </View>

          {territorialRoute ? (
            <View style={styles.routeBox}>
              <Text style={[styles.routeLabel, { color: COLORS.tan }]}>Ruta territorial</Text>
              <Text style={[styles.routeText, { color: COLORS.spaceCadet }]}>{territorialRoute}</Text>
            </View>
          ) : null}
          {geoLoadError ? (
            <Text style={[styles.geoErrorText, { color: COLORS.slateGray }]}>
              Algunas opciones de ubicación no se cargaron. Abre un selector para reintentar.
            </Text>
          ) : null}

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
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
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
  selectorDisabled: { opacity: 0.6 },
  selectorText: { fontSize: 15, flex: 1, marginRight: 8, flexWrap: 'wrap', lineHeight: 20 },
  selectorArrow: { fontSize: 14 },
  routeBox: {
    borderWidth: 1,
    borderColor: COLORS.slateGray,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF10',
  },
  routeLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  routeText: { fontSize: 14, lineHeight: 20 },
  geoErrorText: { fontSize: 12, lineHeight: 18 },
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
  pickerLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
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
