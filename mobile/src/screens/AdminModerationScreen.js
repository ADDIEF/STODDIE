import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';

const ESTADOS = [
  { id: 'ALL', label: 'Todos' },
  { id: '1', label: 'Pendientes' },
  { id: '2', label: 'En Revisión' },
  { id: '3', label: 'Confirmados' },
  { id: '4', label: 'Resueltos' },
  { id: '5', label: 'Falsos' },
];

export default function AdminModerationScreen({
  onBack,
  onDetail,
  onMap,
  onWeather,
  onPrevention,
  onEmergency,
  onLogout,
}) {
  const [incidents, setIncidents] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstado, setFilterEstado] = useState('ALL');
  const [filterDepartamento, setFilterDepartamento] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [showDepPicker, setShowDepPicker] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const [incData, depData] = await Promise.all([
        apiRequest('incidents/'),
        apiRequest('geography/departments/'),
      ]);
      setIncidents(incData.results || incData);
      setDepartamentos(depData.results || depData);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los incidentes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getEstadoLabel = (id) => {
    const est = ESTADOS.find((e) => e.id === String(id));
    return est ? est.label : `Estado ${id}`;
  };

  const filtered = incidents.filter((item) => {
    if (filterEstado !== 'ALL' && String(item.id_estado) !== filterEstado) return false;
    if (filterDepartamento !== 'ALL') {
      const depId = item.id_zona != null ? null : null;
      // Filtrar por departamento requiere que el incidente tenga zona con municipio/departamento
      // Por ahora filtramos por nombre de zona si coincide con un municipio del departamento
      // Simplificación: mostramos todos si no hay forma de filtrar por departamento directamente
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const text = `${item.descripcion || ''} ${item.tipo_riesgo_nombre || ''} ${item.zona_nombre || ''} ${item.id_estado || ''}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const countByEstado = (estadoId) =>
    incidents.filter((i) => String(i.id_estado) === String(estadoId)).length;

  const renderItem = ({ item }) => {
    const isPend = String(item.id_estado) === '1';
    return (
      <TouchableOpacity style={[styles.card, isPend && styles.cardPending]} onPress={() => onDetail(item.id_incidente || item.pk)}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: COLORS.spaceCadet }]}>#{item.id_incidente || item.pk} • {item.tipo_riesgo_nombre || 'Sin tipo'}</Text>
          <Text style={[styles.badge, isPend ? { color: COLORS.caput } : { color: COLORS.slateGray }]}>{getEstadoLabel(item.id_estado)}</Text>
        </View>
        <Text style={[styles.description, { color: COLORS.spaceCadet }]} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</Text>
        <Text style={[styles.meta, { color: COLORS.slateGray }]}>
          Severidad: {item.nivel_severidad_nombre || 'Sin definir'} • Zona: {item.zona_nombre || 'Sin zona'}
        </Text>
        <Text style={[styles.meta, { color: COLORS.slateGray }]}>
          📍 {item.latitud != null ? parseFloat(item.latitud).toFixed(4) : '—'}, {item.longitud != null ? parseFloat(item.longitud).toFixed(4) : '—'} • {item.fecha_reporte ? item.fecha_reporte.slice(0, 10) : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: COLORS.tan }]}>← Cliente</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: COLORS.tan }]}>Panel Admin — Moderación</Text>
        <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>
          {incidents.length} totales • {countByEstado(1)} pendientes
        </Text>

        <TextInput
          style={[styles.searchInput, { borderColor: COLORS.slateGray }]}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por descripción, tipo, zona..."
          placeholderTextColor={COLORS.slateGray}
        />

        <Text style={[styles.filterLabel, { color: COLORS.tan }]}>Filtrar por estado:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {ESTADOS.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.filterBtn, filterEstado === e.id && { backgroundColor: COLORS.coffee, borderColor: COLORS.coffee }]}
              onPress={() => setFilterEstado(e.id)}
            >
              <Text style={[styles.filterText, filterEstado === e.id ? { color: '#FFF' } : { color: COLORS.spaceCadet }]}>
                {e.label} {e.id !== 'ALL' ? `(${countByEstado(e.id)})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.filterLabel, { color: COLORS.tan }]}>Filtrar por departamento:</Text>
        <TouchableOpacity
          style={[styles.depSelector, { borderColor: COLORS.slateGray }]}
          onPress={() => setShowDepPicker(!showDepPicker)}
        >
          <Text style={[styles.depSelectorText, { color: COLORS.spaceCadet }]}>
            {filterDepartamento === 'ALL' ? 'Todos los departamentos' : departamentos.find((d) => d.id_departamento === filterDepartamento)?.nombre_departamento || 'Todos'}
          </Text>
          <Text style={[styles.depSelectorArrow, { color: COLORS.coffee }]}>▼</Text>
        </TouchableOpacity>
        {showDepPicker && (
          <View style={[styles.depPickerList, { borderColor: COLORS.slateGray }]}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <TouchableOpacity
                style={[styles.depPickerItem, { borderBottomColor: COLORS.tan }]}
                onPress={() => { setFilterDepartamento('ALL'); setShowDepPicker(false); }}
              >
                <Text style={[styles.depPickerItemText, { color: COLORS.spaceCadet }]}>Todos los departamentos</Text>
              </TouchableOpacity>
              {departamentos.map((d) => (
                <TouchableOpacity
                  key={d.id_departamento}
                  style={[styles.depPickerItem, { borderBottomColor: COLORS.tan }]}
                  onPress={() => { setFilterDepartamento(d.id_departamento); setShowDepPicker(false); }}
                >
                  <Text style={[styles.depPickerItemText, { color: COLORS.spaceCadet }]}>{d.nombre_departamento}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.tan, borderColor: COLORS.coffee }]} onPress={onMap}>
            <Text style={[styles.headerButtonText, { color: COLORS.spaceCadet }]}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.tan, borderColor: COLORS.coffee }]} onPress={onWeather}>
            <Text style={[styles.headerButtonText, { color: COLORS.spaceCadet }]}>🌤️ Clima</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.tan, borderColor: COLORS.coffee }]} onPress={onPrevention}>
            <Text style={[styles.headerButtonText, { color: COLORS.spaceCadet }]}>🛡️ Prevención</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.tan, borderColor: COLORS.coffee }]} onPress={onEmergency}>
            <Text style={[styles.headerButtonText, { color: COLORS.spaceCadet }]}>🚨 Emergencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.caput, borderColor: COLORS.caput }]} onPress={onLogout}>
            <Text style={[styles.headerButtonText, { color: '#FFF' }]}>🚪 Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(i) => String(i.id_incidente || i.pk)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchIncidents} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 44 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginTop: 10,
  },
  filterLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  filterRow: { flexDirection: 'row', marginBottom: 4 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: COLORS.slateGray, backgroundColor: '#FFF', marginRight: 8 },
  filterText: { fontSize: 12, fontWeight: '600' },
  depSelector: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depSelectorText: { fontSize: 14, flex: 1 },
  depSelectorArrow: { fontSize: 12 },
  depPickerList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 8,
    marginTop: 4,
  },
  depPickerItem: { padding: 12, borderBottomWidth: 1 },
  depPickerItemText: { fontSize: 14 },
  headerButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  headerButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  headerButtonText: { fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginHorizontal: 12, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.slateGray },
  cardPending: { borderLeftColor: COLORS.caput },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, flexWrap: 'wrap' },
  badge: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 14, marginBottom: 6 },
  meta: { fontSize: 12, marginBottom: 2 },
  list: { paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
