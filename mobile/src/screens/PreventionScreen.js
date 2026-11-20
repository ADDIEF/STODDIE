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
import { useToast } from '../context/ToastContext';

export default function PreventionScreen({ onBack }) {
  const { showError } = useToast();
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
        showError(error.message || 'No se pudieron cargar las guías');
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
        <View style={styles.catHeader}>
          <Text style={styles.catTitle}>{item.nombre_categoria}</Text>
          <Text style={styles.catSubtitle}>{item.descripcion}</Text>
        </View>
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
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
        <Text style={styles.loaderText}>Cargando guías...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Guías de Prevención</Text>
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
  subtitle: { fontSize: 14, color: COLORS.slateGray, marginTop: 4 },
  catCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  catHeader: { marginBottom: 12 },
  catTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.spaceCadet },
  catSubtitle: { fontSize: 13, color: COLORS.slateGray, marginTop: 4 },
  guiaCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.coffee,
  },
  guiaTitle: { fontSize: 15, fontWeight: '600', color: COLORS.spaceCadet, marginBottom: 6 },
  guiaContent: { fontSize: 14, color: COLORS.spaceCadet, lineHeight: 20, marginBottom: 8 },
  guiaFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  guiaMeta: { fontSize: 11, color: COLORS.slateGray, fontStyle: 'italic' },
  listContent: { paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: COLORS.tan, marginTop: 12, fontSize: 14 },
});