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
import { useToast } from '../context/ToastContext';

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
  const { showError } = useToast();
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
      showError(error.message || 'No se pudieron cargar los incidentes');
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
    const latNum = item.latitud != null ? parseFloat(item.latitud) : null;
    const lngNum = item.longitud != null ? parseFloat(item.longitud) : null;
    return (
      <TouchableOpacity style={[styles.card, isPend && styles.cardPending]} onPress={() => onDetail(item.id_incidente || item.pk)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>#{item.id_incidente || item.pk} • {item.tipo_riesgo_nombre || 'Sin tipo'}</Text>
          <View style={[styles.badge, { backgroundColor: isPend ? COLORS.danger : COLORS.navy }]}>
            <Text style={styles.badgeText}>{getEstadoLabel(item.id_estado)}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</Text>
        <Text style={styles.meta}>
          Severidad: {item.nivel_severidad_nombre || 'Sin definir'} • Zona: {item.zona_nombre || 'Sin zona'}
        </Text>
        <Text style={styles.meta}>
          📍 {latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum) ? `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}` : 'sin coordenadas'} • {item.fecha_reporte ? item.fecha_reporte.slice(0, 10) : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loaderText}>Cargando incidentes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.white }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Cliente</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Panel Admin — Moderación</Text>
        <Text style={styles.subtitle}>
          {incidents.length} totales • {countByEstado(1)} pendientes
        </Text>

        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por descripción, tipo, zona..."
          placeholderTextColor={COLORS.textMedium}
        />

        <Text style={styles.filterLabel}>Filtrar por estado:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {ESTADOS.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.filterBtn, filterEstado === e.id && styles.filterBtnActive]}
              onPress={() => setFilterEstado(e.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filterEstado === e.id && styles.filterTextActive]}>
                {e.label} {e.id !== 'ALL' ? `(${countByEstado(e.id)})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Filtrar por departamento:</Text>
        <TouchableOpacity
          style={styles.depSelector}
          onPress={() => setShowDepPicker(!showDepPicker)}
          activeOpacity={0.7}
        >
          <Text style={styles.depSelectorText}>
            {filterDepartamento === 'ALL' ? 'Todos los departamentos' : departamentos.find((d) => d.id_departamento === filterDepartamento)?.nombre_departamento || 'Todos'}
          </Text>
          <Text style={styles.depSelectorArrow}>▼</Text>
        </TouchableOpacity>
        {showDepPicker && (
          <View style={styles.depPickerList}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.depPickerItem}
                onPress={() => { setFilterDepartamento('ALL'); setShowDepPicker(false); }}
                activeOpacity={0.7}
              >
                <Text style={styles.depPickerItemText}>Todos los departamentos</Text>
              </TouchableOpacity>
              {departamentos.map((d) => (
                <TouchableOpacity
                  key={d.id_departamento}
                  style={styles.depPickerItem}
                  onPress={() => { setFilterDepartamento(d.id_departamento); setShowDepPicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.depPickerItemText}>{d.nombre_departamento}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={onMap} activeOpacity={0.7}>
            <Text style={styles.headerButtonText}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onWeather} activeOpacity={0.7}>
            <Text style={styles.headerButtonText}>🌤️ Clima</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onPrevention} activeOpacity={0.7}>
            <Text style={styles.headerButtonText}>🛡️ Prevención</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onEmergency} activeOpacity={0.7}>
            <Text style={styles.headerButtonText}>🚨 Emergencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, styles.logoutButton]} onPress={onLogout} activeOpacity={0.7}>
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
  header: {
    padding: 16,
    paddingTop: 44,
    backgroundColor: COLORS.navy,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.accent },
  subtitle: { fontSize: 13, color: COLORS.serenityBlue, marginTop: 4, marginBottom: 8 },
  searchInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.textDark,
    marginTop: 8,
  },
  filterLabel: { fontSize: 12, fontWeight: '600', color: COLORS.accent, marginTop: 10, marginBottom: 6 },
  filterRow: { flexDirection: 'row', marginBottom: 4 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderDark, backgroundColor: COLORS.white, marginRight: 8 },
  filterBtnActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  filterTextActive: { color: '#FFF' },
  depSelector: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depSelectorText: { fontSize: 14, flex: 1, color: COLORS.textDark },
  depSelectorArrow: { fontSize: 12, color: COLORS.navy },
  depPickerList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
  },
  depPickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  depPickerItemText: { fontSize: 14, color: COLORS.textDark },
  headerButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.pureLight,
  },
  headerButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.navy },
  logoutButton: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  card: {
    backgroundColor: COLORS.pureLight,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.serenityBlue,
  },
  cardPending: { borderLeftColor: COLORS.danger },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1, flexWrap: 'wrap' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  description: { fontSize: 14, color: COLORS.textDark, marginBottom: 6 },
  meta: { fontSize: 12, color: COLORS.textMedium, marginBottom: 2 },
  list: { paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  loaderText: { color: COLORS.textMedium, marginTop: 12, fontSize: 14 },
});