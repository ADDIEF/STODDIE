import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';

export default function IncidentDetailScreen({ incidentId, onBack }) {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest(`incidents/${incidentId}/`);
        setIncident(data);
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudo cargar el incidente');
      } finally {
        setLoading(false);
      }
    }
    if (incidentId) load();
  }, [incidentId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.center}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text>Incidente no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.title}>Incidente #{incident.id_incidente || incident.pk}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Tipo de riesgo:</Text>
          <Text style={styles.value}>{incident.tipo_riesgo_nombre || incident.tipo_riesgo || (incident.id_tipo_riesgo ? `ID ${incident.id_tipo_riesgo}` : '—')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nivel de severidad:</Text>
          <Text style={styles.value}>{incident.nivel_severidad_nombre || (incident.id_nivel_severidad ? `ID ${incident.id_nivel_severidad}` : 'Sin definir')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Estado:</Text>
          <Text style={styles.value}>{incident.estado_nombre || incident.estado || (incident.id_estado ? `ID ${incident.id_estado}` : '—')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Zona:</Text>
          <Text style={styles.value}>{incident.zona_nombre || (incident.id_zona ? `ID ${incident.id_zona}` : 'Sin zona')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Latitud:</Text>
          <Text style={styles.value}>
            {incident.latitud != null ? incident.latitud : '—'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Longitud:</Text>
          <Text style={styles.value}>
            {incident.longitud != null ? incident.longitud : '—'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Referencia:</Text>
          <Text style={styles.value}>{incident.referencia_ubicacion || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Descripción:</Text>
          <Text style={styles.description}>{incident.descripcion || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>
            {incident.fecha_reporte ? incident.fecha_reporte.slice(0, 16) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.spaceCadet, padding: 16, paddingTop: 44 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: COLORS.tan, fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.caput },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.spaceCadet, marginBottom: 16 },
  row: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.slateGray },
  value: { fontSize: 15, color: COLORS.spaceCadet, marginTop: 2 },
  description: { fontSize: 15, color: COLORS.spaceCadet, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.spaceCadet },
});