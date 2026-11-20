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
      <View style={[styles.center, { backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loaderText}>Cargando guías...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.white }]}>
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
    backgroundColor: COLORS.navy,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.accent },
  subtitle: { fontSize: 14, color: COLORS.serenityBlue, marginTop: 4 },
  catCard: {
    backgroundColor: COLORS.pureLight,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  catHeader: { marginBottom: 12 },
  catTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  catSubtitle: { fontSize: 13, color: COLORS.textMedium, marginTop: 4 },
  guiaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  guiaTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  guiaContent: { fontSize: 14, color: COLORS.textDark, lineHeight: 20, marginBottom: 8 },
  guiaFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  guiaMeta: { fontSize: 11, color: COLORS.textMedium, fontStyle: 'italic' },
  listContent: { paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  loaderText: { color: COLORS.textMedium, marginTop: 12, fontSize: 14 },
});