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
import { apiRequest, authApi } from '../api/client';
import { clearAuthToken } from '../api/tokenStorage';
import { COLORS } from '../theme/colors';

export default function IncidentListScreen({
  onMap,
  onCreate,
  onWeather,
  onPrevention,
  onEmergency,
  onLogout,
  onDetail,
  isAdmin,
  onAdmin,
}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchIncidents() {
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
  }

  useEffect(() => {
    fetchIncidents();
  }, []);

  const renderItem = ({ item }) => {
    const latNum = item.latitud != null ? parseFloat(item.latitud) : null;
    const lngNum = item.longitud != null ? parseFloat(item.longitud) : null;
    return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onDetail(item.id_incidente || item.pk)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>#{item.id_incidente || item.pk} • {item.tipo_riesgo_nombre || (item.id_tipo_riesgo ? `ID ${item.id_tipo_riesgo}` : 'Sin tipo')}</Text>
        <Text style={styles.statusBadge}>{item.estado_nombre || (item.id_estado ? `Estado ${item.id_estado}` : '—')}</Text>
      </View>
      <Text style={styles.description}>{item.descripcion || 'Sin descripción'}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Severidad: {item.nivel_severidad_nombre || 'Sin definir'} • Zona: {item.zona_nombre || 'Sin zona'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {'📍 ' + (latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum)
            ? latNum.toFixed(4) + ', ' + lngNum.toFixed(4)
            : 'sin coordenadas')}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {item.fecha_reporte ? 'Fecha: ' + item.fecha_reporte.slice(0, 10) : ''}
        </Text>
      </View>
    </TouchableOpacity>
    );
  };

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {}
    await clearAuthToken();
    onLogout();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes ciudadanos</Text>
        <Text style={styles.subtitle}>{incidents.length} incidente(s) registrado(s)</Text>
        <View style={styles.headerButtons}>
          {isAdmin ? (
            <TouchableOpacity style={[styles.headerButton, { backgroundColor: COLORS.caput, borderColor: COLORS.caput }]} onPress={onAdmin}>
              <Text style={[styles.headerButtonText, { color: '#FFF' }]}>🛡️ Panel Moderación</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.headerButton} onPress={onMap}>
            <Text style={styles.headerButtonText}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onWeather}>
            <Text style={styles.headerButtonText}>🌤️ Clima</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onPrevention}>
            <Text style={styles.headerButtonText}>🛡️ Prevención</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onEmergency}>
            <Text style={styles.headerButtonText}>🚨 Emergencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Text style={styles.headerButtonText}>🚪 Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={incidents}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id_incidente || item.pk)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchIncidents} />
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={onCreate}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.spaceCadet },
  header: { padding: 16, paddingTop: 44 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.tan },
  subtitle: { fontSize: 14, color: COLORS.slateGray, marginTop: 4 },
  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.tan,
    borderWidth: 1,
    borderColor: COLORS.coffee,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerButtonText: { color: COLORS.spaceCadet, fontSize: 11, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.spaceCadet },
  statusBadge: { fontSize: 12, color: COLORS.slateGray },
  description: { fontSize: 14, color: COLORS.spaceCadet, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 12, color: COLORS.slateGray },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.spaceCadet },
  fabContainer: { position: 'absolute', bottom: 24, right: 24 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.caput,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 24, fontWeight: 'bold', lineHeight: 56 },
});