import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';

export default function AdminModerationScreen({
  onBack,
  onDetail,
  onMap,
  onLogout,
}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('incidents/');
      setIncidents(data.results || data);
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

  const getEstado = (item) => item.estado_nombre || `Estado ${item.id_estado || '—'}`;

  const filtered =
    filter === 'PENDIENTE'
      ? incidents.filter((i) => (i.estado_nombre || '').toLowerCase() === 'pendiente' || i.id_estado === 1)
      : filter === 'CONFIRMADO'
        ? incidents.filter((i) => (i.estado_nombre || '').toLowerCase() === 'confirmado' || i.id_estado === 3)
        : incidents;

  const countPendientes = incidents.filter(
    (i) => (i.estado_nombre || '').toLowerCase() === 'pendiente' || i.id_estado === 1
  ).length;

  const renderItem = ({ item }) => {
    const latNum = item.latitud != null ? parseFloat(item.latitud) : null;
    const lngNum = item.longitud != null ? parseFloat(item.longitud) : null;
    const isPend = (item.estado_nombre || '').toLowerCase() === 'pendiente' || item.id_estado === 1;
    return (
      <TouchableOpacity style={[styles.card, isPend && styles.cardPending]} onPress={() => onDetail(item.id_incidente || item.pk)}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: COLORS.spaceCadet }]}>#{item.id_incidente || item.pk} • {item.tipo_riesgo_nombre || 'Sin tipo'}</Text>
          <Text style={[styles.badge, isPend ? { color: COLORS.caput } : { color: COLORS.slateGray }]}>{getEstado(item)}</Text>
        </View>
        <Text style={[styles.description, { color: COLORS.spaceCadet }]} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</Text>
        <Text style={[styles.meta, { color: COLORS.slateGray }]}>
          Severidad: {item.nivel_severidad_nombre || 'Sin definir'} • Zona: {item.zona_nombre || 'Sin zona'}
        </Text>
        <Text style={[styles.meta, { color: COLORS.slateGray }]}>
          📍 {latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum) ? `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}` : 'sin coordenadas'} • {item.fecha_reporte ? item.fecha_reporte.slice(0, 10) : ''}
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
          {incidents.length} totales • {countPendientes} pendientes
        </Text>
        <View style={styles.filters}>
          {['ALL', 'PENDIENTE', 'CONFIRMADO'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && { backgroundColor: COLORS.coffee, borderColor: COLORS.coffee }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f ? { color: '#FFF' } : { color: COLORS.spaceCadet }]}>
                {f === 'ALL' ? 'Todos' : f === 'PENDIENTE' ? 'Pendientes' : 'Confirmados'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.tan, borderColor: COLORS.coffee }]} onPress={onMap}>
            <Text style={[styles.headerButtonText, { color: COLORS.spaceCadet }]}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.tan, borderColor: COLORS.coffee }]} onPress={onLogout}>
            <Text style={[styles.headerButtonText, { color: COLORS.spaceCadet }]}>🚪 Salir</Text>
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
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: COLORS.slateGray, backgroundColor: '#FFF' },
  filterText: { fontSize: 12, fontWeight: '600' },
  headerButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
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
