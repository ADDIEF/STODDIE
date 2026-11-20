import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
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
        setDepartamentos(depData.results || depData);

        const entidadesConContactos = entList.map((entidad) => ({
          ...entidad,
          contactos: conList.filter((c) => c.id_entidad === entidad.id_entidad),
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
  }, [showError]);

  const filteredEntidades = selectedDepartamentoId
    ? entidades.filter((e) => e.id_departamento === selectedDepartamentoId)
    : entidades;

  if (loading) {
    return (
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando contactos...</Text>
      </View>
    );
  }

  return (
    <View style={GLASS.screen}>
      <View style={GLASS.header}>
        <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
          <Text style={GLASS.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={GLASS.titleOnDark}>Contactos de Emergencia - Bolivia</Text>
        <Text style={GLASS.subtitleOnDark}>{filteredEntidades.length} entidad(es) registrada(s)</Text>

        <TouchableOpacity style={styles.depSelector} onPress={() => setShowPicker(!showPicker)} activeOpacity={0.82}>
          <Text style={styles.depSelectorText}>{selectedDepartamentoLabel}</Text>
          <Text style={styles.depSelectorArrow}>▼</Text>
        </TouchableOpacity>
        {showPicker && (
          <View style={styles.depPickerList}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              <TouchableOpacity
                style={GLASS.modalItem}
                onPress={() => {
                  setSelectedDepartamentoId(null);
                  setSelectedDepartamentoLabel('Todos los departamentos');
                  setShowPicker(false);
                }}
                activeOpacity={0.82}
              >
                <Text style={styles.depPickerItemText}>Todos los departamentos</Text>
              </TouchableOpacity>
              {departamentos.map((d) => (
                <TouchableOpacity
                  key={d.id_departamento}
                  style={GLASS.modalItem}
                  onPress={() => {
                    setSelectedDepartamentoId(d.id_departamento);
                    setSelectedDepartamentoLabel(d.nombre_departamento);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.82}
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
          <View style={styles.card}>
            <Text style={styles.entityName}>{item.nombre_entidad}</Text>
            <Text style={styles.entityType}>
              {item.tipo_entidad} • {item.nombre_departamento || 'Sin departamento'}
            </Text>
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
                    {c.horario && <Text style={styles.contactoHorario}> ({c.horario})</Text>}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noContacts}>Sin contactos registrados</Text>
            )}
          </View>
        )}
        keyExtractor={(item) => String(item.id_entidad)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  depSelector: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    minHeight: 46,
  },
  depSelectorText: { fontSize: 14, flex: 1, color: COLORS.ink, fontWeight: '700' },
  depSelectorArrow: { fontSize: 12, color: COLORS.navy },
  depPickerList: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 14,
    marginTop: 6,
  },
  depPickerItemText: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
  list: { padding: 14, paddingBottom: 30 },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.rust,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 7,
  },
  entityName: { fontSize: 17, fontWeight: '800', color: COLORS.navy, marginBottom: 4 },
  entityType: { fontSize: 13, color: COLORS.cocoa, marginBottom: 8, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  metaLabel: { fontSize: 12, fontWeight: '700', color: COLORS.cocoa },
  metaValue: { fontSize: 13, color: COLORS.ink, flex: 1 },
  contactos: { marginTop: 8 },
  contactosTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 6 },
  contactoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  contactoLabel: { fontSize: 12, color: COLORS.cocoa, minWidth: 72, fontWeight: '700' },
  contactoValue: { fontSize: 12, color: COLORS.ink, fontWeight: '800' },
  contactoHorario: { fontSize: 11, color: COLORS.cocoa, fontStyle: 'italic' },
  noContacts: { fontSize: 12, color: COLORS.cocoa, fontStyle: 'italic' },
});
