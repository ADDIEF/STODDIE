import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

const ESTADOS = [
  { id: 'ALL', label: 'Todos' },
  { id: '1', label: 'Pendientes' },
  { id: '2', label: 'En Revisión' },
  { id: '3', label: 'Confirmados' },
  { id: '4', label: 'Resueltos' },
  { id: '5', label: 'Falso / Rechazado' },
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

  const fetchIncidents = useCallback(async () => {
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
  }, [showError]);

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      await fetchIncidents();
    })();
  }, [fetchIncidents]);

  const getEstadoLabel = (id) => {
    const est = ESTADOS.find((e) => e.id === String(id));
    return est ? est.label : `Estado ${id}`;
  };

  const filtered = incidents.filter((item) => {
    if (filterEstado !== 'ALL' && String(item.id_estado) !== filterEstado) return false;
    if (
      filterDepartamento !== 'ALL' &&
      String(item.id_departamento) !== String(filterDepartamento)
    ) return false;
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
      <TouchableOpacity
        style={[styles.card, isPend && styles.cardPending]}
        onPress={() => onDetail(item.id_incidente || item.pk)}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            #{item.id_incidente || item.pk} • {item.tipo_riesgo_nombre || 'Sin tipo'}
          </Text>
          <View style={[GLASS.badge, { backgroundColor: isPend ? COLORS.rust : COLORS.navy }]}>
            <Text style={GLASS.badgeText}>{getEstadoLabel(item.id_estado)}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</Text>
        <Text style={styles.meta}>
          Severidad: {item.nivel_severidad_nombre || 'Sin definir'} • Zona: {item.zona_nombre || 'Sin zona'}
        </Text>
        <Text style={styles.meta}>
          📍 {latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum)
            ? `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`
            : 'sin coordenadas'} • {item.fecha_reporte ? item.fecha_reporte.slice(0, 10) : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando incidentes...</Text>
      </View>
    );
  }

  return (
    <View style={GLASS.screen}>
      <View style={GLASS.header}>
        <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
          <Text style={GLASS.backText}>← Cliente</Text>
        </TouchableOpacity>
        <Text style={GLASS.titleOnDark}>Panel Admin — Moderación</Text>
        <Text style={GLASS.subtitleOnDark}>
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
        <View style={styles.filterRow}>
          {ESTADOS.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.filterBtn, filterEstado === e.id && styles.filterBtnActive]}
              onPress={() => setFilterEstado(e.id)}
              activeOpacity={0.82}
            >
              <Text style={[styles.filterText, filterEstado === e.id && styles.filterTextActive]}>
                {e.label} {e.id !== 'ALL' ? `(${countByEstado(e.id)})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterLabel}>Filtrar por departamento:</Text>
        <TouchableOpacity style={styles.depSelector} onPress={() => setShowDepPicker(!showDepPicker)} activeOpacity={0.82}>
          <Text style={styles.depSelectorText}>
            {filterDepartamento === 'ALL'
              ? 'Todos los departamentos'
              : departamentos.find((d) => d.id_departamento === filterDepartamento)?.nombre_departamento || 'Todos'}
          </Text>
          <Text style={styles.depSelectorArrow}>▼</Text>
        </TouchableOpacity>
        {showDepPicker && (
          <View style={styles.depPickerList}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <TouchableOpacity
                style={GLASS.modalItem}
                onPress={() => { setFilterDepartamento('ALL'); setShowDepPicker(false); }}
                activeOpacity={0.82}
              >
                <Text style={styles.depPickerItemText}>Todos los departamentos</Text>
              </TouchableOpacity>
              {departamentos.map((d) => (
                <TouchableOpacity
                  key={d.id_departamento}
                  style={GLASS.modalItem}
                  onPress={() => { setFilterDepartamento(d.id_departamento); setShowDepPicker(false); }}
                  activeOpacity={0.82}
                >
                  <Text style={styles.depPickerItemText}>{d.nombre_departamento}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={onMap} activeOpacity={0.82}>
            <Text style={styles.headerButtonText}>🗺️ Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onWeather} activeOpacity={0.82}>
            <Text style={styles.headerButtonText}>🌤️ Clima</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onPrevention} activeOpacity={0.82}>
            <Text style={styles.headerButtonText}>🛡️ Prevención</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onEmergency} activeOpacity={0.82}>
            <Text style={styles.headerButtonText}>🚨 Emergencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, styles.logoutButton]} onPress={onLogout} activeOpacity={0.82}>
            <Text style={[styles.headerButtonText, styles.logoutText]}>🚪 Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(i) => String(i.id_incidente || i.pk)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchIncidents(); }}
          />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.ink,
    minHeight: 46,
    marginTop: 8,
  },
  filterLabel: { fontSize: 12, fontWeight: '800', color: COLORS.butter, marginTop: 10, marginBottom: 6 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  filterBtn: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.glassStrong,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: COLORS.navy },
  filterText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
  },
  filterTextActive: { color: COLORS.white },
  depSelector: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  depSelectorText: {
    fontSize: 13,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    color: COLORS.ink,
    fontWeight: '700',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  depSelectorArrow: { fontSize: 12, color: COLORS.navy },
  depPickerList: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 14,
    marginTop: 6,
  },
  depPickerItemText: { fontSize: 13, color: COLORS.ink, fontWeight: '600' },
  headerButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  headerButton: {
    width: '48%',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.glassStrong,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
  },
  logoutButton: { backgroundColor: COLORS.rust },
  logoutText: { color: COLORS.white },
  list: { padding: 14, paddingBottom: 30 },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.serenityBlue,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 6,
  },
  cardPending: { borderLeftColor: COLORS.rust },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.ink, flex: 1, flexWrap: 'wrap' },
  description: { fontSize: 13, color: COLORS.ink, marginBottom: 6 },
  meta: { fontSize: 11, color: COLORS.cocoa, marginBottom: 2, fontWeight: '600' },
});
