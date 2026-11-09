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

export default function EmergencyScreen({ onBack }) {
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [entData, conData] = await Promise.all([
          apiRequest('emergency/entities/'),
          apiRequest('emergency/contacts/'),
        ]);
        const entList = entData.results || entData;
        const conList = conData.results || conData;

        const entidadesConContactos = entList.map((entidad) => ({
          ...entidad,
          contactos: conList.filter(
            (c) => c.id_entidad === entidad.id_entidad
          ),
        }));
        setEntidades(entidadesConContactos);
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudieron cargar los contactos');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
    loadData();
  }, []);

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
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Contactos de emergencia</Text>
        <Text style={styles.subtitle}>{entidades.length} entidad(es) registrada(s)</Text>
      </View>

      <FlatList
        data={entidades}
        renderItem={({ item }) => (
          <View style={styles.card} key={item.id_entidad}>
            <Text style={styles.entityName}>{item.nombre_entidad}</Text>
            <Text style={styles.entityType}>{item.tipo_entidad}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.spaceCadet },
  header: { padding: 16, paddingTop: 44 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: COLORS.tan, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.tan },
  subtitle: { fontSize: 14, color: COLORS.slateGray, marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.spaceCadet },
});