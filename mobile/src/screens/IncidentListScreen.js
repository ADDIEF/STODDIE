import { useCallback, useEffect, useState } from 'react';
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
import { GLASS } from '../theme/glass';
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

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await apiRequest('incidents/');
      setIncidents(data.results || data);
    } catch (error) {
      showError(error.message || 'No se pudieron cargar los incidentes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      await fetchIncidents();
    })();
  }, [fetchIncidents]);

  const renderItem = ({ item }) => {
    const latNum = item.latitud != null ? parseFloat(item.latitud) : null;
    const lngNum = item.longitud != null ? parseFloat(item.longitud) : null;
    const pendiente = item.id_estado === 1 || item.estado_nombre === 'Pendiente';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onDetail(item.id_incidente || item.pk)}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>#{item.id_incidente || item.pk}</Text>
          <View style={[GLASS.badge, { backgroundColor: pendiente ? COLORS.rust : COLORS.navy }]}>
            <Text style={GLASS.badgeText}>{item.estado_nombre || `Estado ${item.id_estado}`}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          {item.tipo_riesgo_nombre || 'Sin tipo'} • {item.nivel_severidad_nombre || 'Sin definir'}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.descripcion || 'Sin descripción'}
        </Text>
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
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <View style={GLASS.screen}>
      <View style={GLASS.header}>
        <Text style={GLASS.titleOnDark}>Reportes Ciudadanos</Text>
        <Text style={GLASS.subtitleOnDark}>{incidents.length} incidente(s) registrado(s)</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onMap} activeOpacity={0.82}>
            <Text style={styles.actionText}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onWeather} activeOpacity={0.82}>
            <Text style={styles.actionText}>🌤️ Clima</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onPrevention} activeOpacity={0.82}>
            <Text style={styles.actionText}>🛡️ Prevención</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onEmergency} activeOpacity={0.82}>
            <Text style={styles.actionText}>🚨 Emergencia</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <TouchableOpacity style={styles.adminButton} onPress={onAdmin} activeOpacity={0.82}>
            <Text style={styles.adminText}>🛡️ Panel de Moderación</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.82}>
          <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={incidents}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id_incidente || item.pk)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchIncidents(); }}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={onCreate} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>📋</Text>
        <Text style={styles.fabText}>Nuevo Reporte</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  actionButton: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  adminButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.rust,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  adminText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  logoutButton: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
    marginHorizontal: 14,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.rust,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 7,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  cardSubtitle: { fontSize: 13, color: COLORS.cocoa, marginBottom: 6, fontWeight: '700' },
  cardDescription: { fontSize: 14, color: COLORS.ink, marginBottom: 8, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardMetaText: { fontSize: 11, color: COLORS.cocoa, fontWeight: '600' },
  listContent: { paddingTop: 14, paddingBottom: 110 },
  fab: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: COLORS.rust,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 10,
  },
  fabIcon: { fontSize: 22, color: COLORS.white },
  fabText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
