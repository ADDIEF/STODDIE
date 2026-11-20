import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { useToast } from '../context/ToastContext';

export default function EmergencyScreen({ onBack }) {
  const { showError } = useToast();
  const [entidades, setEntidades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(null);
  const [selectedDepartamentoLabel, setSelectedDepartamentoLabel] = useState('Todos los departamentos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [entData, conData, depData] = await Promise.all([
          apiRequest('emergency/entities/'),
          apiRequest('emergency/contacts/'),
          apiRequest('geography/departments/'),
        ]);
        const entList = entData.results || entData;
        const conList = conData.results || conData;
        const depList = depData.results || depData;
        setDepartamentos(depList);

        const entidadesConContactos = entList.map((entidad) => ({
          ...entidad,
          contactos: conList.filter(
            (c) => c.id_entidad === entidad.id_entidad
          ),
        }));
        setEntidades(entidadesConContactos);
      } catch (error) {
        showError(error.message || 'No se pudieron cargar los contactos');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
    loadData();
  }, []);

  const filteredEntidades = selectedDepartamentoId
    ? entidades.filter((e) => e.id_departamento === selectedDepartamentoId)
    : entidades;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
        <Text style={styles.loaderText}>Cargando contactos...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Contactos de Emergencia - Bolivia</Text>
        <Text style={styles.subtitle}>{filteredEntidades.length} entidad(es) registrada(s)</Text>
        <TouchableOpacity
          style={styles.depSelector}
          onPress={() => setShowPicker(!showPicker)}
          activeOpacity={0.7}
        >
          <Text style={styles.depSelectorText}>{selectedDepartamentoLabel}</Text>
          <Text style={styles.depSelectorArrow}>▼</Text>
        </TouchableOpacity>
        {showPicker && (
          <View style={styles.depPickerList}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.depPickerItem}
                onPress={() => {
                  setSelectedDepartamentoId(null);
                  setSelectedDepartamentoLabel('Todos los departamentos');
                  setShowPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.depPickerItemText}>Todos los departamentos</Text>
              </TouchableOpacity>
              {departamentos.map((d) => (
                <TouchableOpacity
                  key={d.id_departamento}
                  style={styles.depPickerItem}
                  onPress={() => {
                    setSelectedDepartamentoId(d.id_departamento);
                    setSelectedDepartamentoLabel(d.nombre_departamento);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.depPickerItemText}>{d.nombre_departamento}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={filteredEntidades}
        renderItem={({ item }) => (
          <View style={styles.card} key={item.id_entidad}>
            <Text style={styles.entityName}>{item.nombre_entidad}</Text>
            <Text style={styles.entityType}>{item.tipo_entidad} • {item.nombre_departamento || 'Sin departamento'}</Text>
            {item.direccion && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>📍 Dirección:</Text>
                <Text style={styles.metaValue}>{item.direccion}</Text>
              </View>
            )}
            {item.contactos && item.contactos.length > 0 ? (
              <View style={styles.contactos}>
                <Text style={styles.contactosTitle}>Contactos:</Text>
                {item.contactos.map((c) => (
                  <View style={styles.contactoRow} key={c.id_contacto}>
                    <Text style={styles.contactoLabel}>{c.tipo_contacto}:</Text>
                    <Text style={styles.contactoValue}>{c.valor_contacto}</Text>
                    {c.horario && (
                      <Text style={styles.contactoHorario}> ({c.horario})</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noContacts}>Sin contactos registrados</Text>
            )}
          </View>
        )}
        keyExtractor={(item) => String(item.id_entidad)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 16,
    paddingTop: 44,
    backgroundColor: 'rgba(37, 52, 79, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 184, 147, 0.25)',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: COLORS.tan, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.tan },
  subtitle: { fontSize: 14, color: COLORS.slateGray, marginTop: 4, marginBottom: 8 },
  depSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depSelectorText: { fontSize: 15, flex: 1, color: COLORS.spaceCadet },
  depSelectorArrow: { fontSize: 12, color: COLORS.coffee },
  depPickerList: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 220,
  },
  depPickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 184, 147, 0.3)',
  },
  depPickerItemText: { fontSize: 15, color: COLORS.spaceCadet },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  entityName: { fontSize: 18, fontWeight: 'bold', color: COLORS.spaceCadet, marginBottom: 4 },
  entityType: { fontSize: 14, color: COLORS.slateGray, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  metaLabel: { fontSize: 12, fontWeight: '600', color: COLORS.slateGray },
  metaValue: { fontSize: 14, color: COLORS.spaceCadet },
  contactos: { marginTop: 8 },
  contactosTitle: { fontSize: 13, fontWeight: '600', color: COLORS.spaceCadet, marginBottom: 6 },
  contactoRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  contactoLabel: { fontSize: 13, color: COLORS.slateGray, minWidth: 70 },
  contactoValue: { fontSize: 13, color: COLORS.spaceCadet, fontWeight: '600' },
  contactoHorario: { fontSize: 11, color: COLORS.slateGray, fontStyle: 'italic' },
  noContacts: { fontSize: 13, color: COLORS.slateGray, fontStyle: 'italic' },
  listContent: { paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: COLORS.tan, marginTop: 12, fontSize: 14 },
});