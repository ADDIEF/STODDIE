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
import { useToast } from '../context/ToastContext';

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
  const { showError, showSuccess } = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchIncidents() {
    setLoading(true);
    try {
      const data = await apiRequest('incidents/');
      setIncidents(data.results || data);
    } catch (error) {
      showError(error.message || 'No se pudieron cargar los incidentes');
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
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>#{item.id_incidente || item.pk}</Text>
          <View style={[styles.badge, { backgroundColor: (item.id_estado === 1 || item.estado_nombre === 'Pendiente') ? COLORS.caput : COLORS.coffee }]}>
            <Text style={styles.badgeText}>{item.estado_nombre || `Estado ${item.id_estado}`}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{item.tipo_riesgo_nombre || 'Sin tipo'} • {item.nivel_severidad_nombre || 'Sin definir'}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            📍 {latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum)
              ? `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`
              : 'sin coordenadas'}
          </Text>
          <Text style={styles.cardMetaText}>
            {item.fecha_reporte ? '📅 ' + item.fecha_reporte.slice(0, 10) : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  async function handleLogout() {
    try {
      await authApi.logout();
      showSuccess('Sesión cerrada');
    } catch {}
    await clearAuthToken();
    onLogout();
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.coffee} />
          <Text style={styles.loaderText}>Cargando reportes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes Ciudadanos</Text>
        <Text style={styles.subtitle}>{incidents.length} incidente(s) registrado(s)</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onMap}>
            <Text style={styles.actionButtonText}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onWeather}>
            <Text style={styles.actionButtonText}>🌤️ Clima</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onPrevention}>
            <Text style={styles.actionButtonText}>🛡️ Prevención</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onEmergency}>
            <Text style={styles.actionButtonText}>🚨 Emergencia</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <TouchableOpacity style={styles.adminButton} onPress={onAdmin}>
            <Text style={styles.adminButtonText}>🛡️ Panel de Moderación</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
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

      <TouchableOpacity style={styles.fab} onPress={onCreate} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>📋</Text>
        <Text style={styles.fabText}>Nuevo Reporte</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 44 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.tan },
  subtitle: { fontSize: 14, color: COLORS.slateGray, marginTop: 4, marginBottom: 16 },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(213, 184, 147, 0.3)',
  },
  actionButtonText: { color: COLORS.tan, fontSize: 12, fontWeight: '600' },
  adminButton: {
    backgroundColor: COLORS.caput,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  adminButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(213, 184, 147, 0.2)',
  },
  logoutButtonText: { color: COLORS.slateGray, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.spaceCadet },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, color: COLORS.slateGray, marginBottom: 6, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: COLORS.spaceCadet, marginBottom: 8, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardMetaText: { fontSize: 11, color: COLORS.slateGray },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: COLORS.tan, marginTop: 12, fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.caput,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: { fontSize: 20 },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});