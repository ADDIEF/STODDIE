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
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

export default function PreventionScreen({ onBack }) {
  const { showError } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
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
  }, [showError]);

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      await loadData();
    })();
  }, [loadData]);

  const renderCategoria = ({ item }) => {
    const guiasDeCategoria = guias.filter((g) => g.id_categoria === item.id_categoria);
    return (
      <View style={styles.catCard}>
        <View style={styles.catHeader}>
          <Text style={styles.catTitle}>{item.nombre_categoria}</Text>
          <Text style={styles.catSubtitle}>{item.descripcion}</Text>
        </View>
        {guiasDeCategoria.map((guia) => (
          <View key={guia.id_guia} style={styles.guiaCard}>
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
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando guías...</Text>
      </View>
    );
  }

  return (
    <View style={GLASS.screen}>
      <View style={GLASS.header}>
        <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
          <Text style={GLASS.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={GLASS.titleOnDark}>Guías de Prevención</Text>
        <Text style={GLASS.subtitleOnDark}>Información por tipo de riesgo</Text>
      </View>

      <FlatList
        data={categorias}
        renderItem={renderCategoria}
        keyExtractor={(item) => String(item.id_categoria)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, paddingBottom: 30 },
  catCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.navy,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 7,
  },
  catHeader: { marginBottom: 12 },
  catTitle: { fontSize: 18, fontWeight: '800', color: COLORS.navy },
  catSubtitle: { fontSize: 13, color: COLORS.cocoa, marginTop: 3 },
  guiaCard: {
    backgroundColor: COLORS.glassStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.rust,
  },
  guiaTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink, marginBottom: 6 },
  guiaContent: { fontSize: 13, color: COLORS.ink, lineHeight: 20, marginBottom: 8 },
  guiaFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  guiaMeta: { fontSize: 11, color: COLORS.cocoa, fontStyle: 'italic' },
});
