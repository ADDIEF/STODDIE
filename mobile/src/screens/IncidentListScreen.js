import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
          <View style={[styles.badge, { backgroundColor: (item.id_estado === 1 || item.estado_nombre === 'Pendiente') ? COLORS.danger : COLORS.navy }]}>
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
      <View style={[styles.center, { backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loaderText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.white }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes Ciudadanos</Text>
        <Text style={styles.subtitle}>{incidents.length} incidente(s) registrado(s)</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onMap} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onWeather} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>🌤️ Clima</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onPrevention} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>🛡️ Prevención</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onEmergency} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>🚨 Emergencia</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <TouchableOpacity style={styles.adminButton} onPress={onAdmin} activeOpacity={0.7}>
            <Text style={styles.adminButtonText}>🛡️ Panel de Moderación</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
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
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.navy },
  subtitle: { fontSize: 14, color: COLORS.textMedium, marginTop: 4, marginBottom: 16 },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  actionButton: {
    backgroundColor: COLORS.pureLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  actionButtonText: { color: COLORS.navy, fontSize: 12, fontWeight: '600' },
  adminButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  adminButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  logoutButton: {
    backgroundColor: COLORS.pureLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  logoutButtonText: { color: COLORS.textDark, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.pureLight,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, color: COLORS.textMedium, marginBottom: 6, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: COLORS.textDark, marginBottom: 8, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardMetaText: { fontSize: 11, color: COLORS.textMedium },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: COLORS.textMedium, marginTop: 12, fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabIcon: { fontSize: 20, color: '#FFF' },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});