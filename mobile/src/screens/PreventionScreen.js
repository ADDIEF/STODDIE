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

export default function PreventionScreen({ onBack }) {
  const [categorias, setCategorias] = useState([]);
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsData, guidesData] = await Promise.all([
          apiRequest('prevention/categories/'),
          apiRequest('prevention/guides/'),
        ]);
        setCategorias(catsData.results || catsData);
        setGuias(guidesData.results || guidesData);
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudieron cargar las guías');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
    loadData();
  }, []);

  const renderCategoria = ({ item }) => {
    const guiasDeCategoria = guias.filter(
      (g) => g.id_categoria === item.id_categoria
    );
    return (
      <View style={styles.catCard} key={item.id_categoria}>
        <TouchableOpacity style={styles.catHeader} onPress={() => {}}>
          <Text style={styles.catTitle}>{item.nombre_categoria}</Text>
          <Text style={styles.catSubtitle}>{item.descripcion}</Text>
        </TouchableOpacity>
        {guiasDeCategoria.map((guia) => (
          <View style={styles.guiaCard} key={guia.id_guia}>
            <Text style={styles.guiaTitle}>{guia.titulo}</Text>
            <Text style={styles.guiaContent}>{guia.contenido}</Text>
            <View style={styles.guiaFooter}>
              <Text style={styles.guiaMeta}>
                Fecha: {guia.fecha_actualizacion ? guia.fecha_actualizacion.slice(0, 10) : '—'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

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
        <Text style={styles.title}>Guías de prevención</Text>
        <Text style={styles.subtitle}>Información por tipo de riesgo</Text>
      </View>

      <FlatList
        data={categorias}
        renderItem={renderCategoria}
        keyExtractor={(item) => String(item.id_categoria)}
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
  catCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  catHeader: { marginBottom: 12 },
  catTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.spaceCadet },
  catSubtitle: { fontSize: 13, color: COLORS.slateGray, marginTop: 4 },
  guiaCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  guiaTitle: { fontSize: 15, fontWeight: '600', color: COLORS.spaceCadet, marginBottom: 6 },
  guiaContent: { fontSize: 14, color: COLORS.spaceCadet, lineHeight: 20, marginBottom: 8 },
  guiaFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  guiaMeta: { fontSize: 11, color: COLORS.slateGray, fontStyle: 'italic' },
  listContent: { paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.spaceCadet },
});