import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { useToast } from '../context/ToastContext';

export default function IncidentDetailScreen({ incidentId, onBack }) {
  const { showError } = useToast();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest(`incidents/${incidentId}/`);
        setIncident(data);
      } catch (error) {
        showError(error.message || 'No se pudo cargar el incidente');
      } finally {
        setLoading(false);
      }
    }
    if (incidentId) load();
  }, [incidentId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loaderText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.white }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.emptyText}>Incidente no encontrado</Text>
      </View>
    );
  }

  const estado = incident.estado_nombre || `Estado ${incident.id_estado}`;
  const isPendiente = incident.id_estado === 1 || estado.toLowerCase() === 'pendiente';
  const isConfirmado = incident.id_estado === 3 || estado.toLowerCase() === 'confirmado';
  const isFalso = incident.id_estado === 5 || estado.toLowerCase() === 'falso / rechazado';
  const semaforoColor = isConfirmado ? '#4CAF50' : isPendiente ? '#FFA000' : isFalso ? '#D32F2F' : COLORS.serenityBlue;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.white }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Incidente #{incident.id_incidente || incident.pk}</Text>
      </View>

      <View style={styles.glassCard}>
        <View style={styles.semaforoRow}>
          <View style={[styles.semaforoDot, { backgroundColor: semaforoColor }]} />
          <Text style={styles.semaforoLabel}>{estado}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Tipo de riesgo:</Text>
          <Text style={styles.value}>{incident.tipo_riesgo_nombre || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nivel de severidad:</Text>
          <Text style={styles.value}>{incident.nivel_severidad_nombre || 'Sin definir'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Zona:</Text>
          <Text style={styles.value}>{incident.zona_nombre || 'Sin zona'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Latitud:</Text>
          <Text style={styles.value}>{incident.latitud != null ? incident.latitud : '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Longitud:</Text>
          <Text style={styles.value}>{incident.longitud != null ? incident.longitud : '—'}</Text>
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
          <Text style={styles.value}>{incident.fecha_reporte ? incident.fecha_reporte.slice(0, 16) : '—'}</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.quickButtonIcon}>🛡️</Text>
          <Text style={styles.quickButtonText}>Ver guías preventivas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.quickButtonIcon}>🚨</Text>
          <Text style={styles.quickButtonText}>Contactos de emergencia</Text>
        </TouchableOpacity>
      </View>
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
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.accent },
  glassCard: {
    backgroundColor: COLORS.pureLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  semaforoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  semaforoDot: { width: 16, height: 16, borderRadius: 8 },
  semaforoLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  row: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
  value: { fontSize: 15, color: COLORS.textDark, marginTop: 2 },
  description: { fontSize: 15, color: COLORS.textDark, marginTop: 2, lineHeight: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  emptyText: { color: COLORS.textMedium, fontSize: 16, marginTop: 8 },
  loaderText: { color: COLORS.textMedium, marginTop: 12, fontSize: 14 },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: COLORS.pureLight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  quickButtonIcon: { fontSize: 24, marginBottom: 6 },
  quickButtonText: { color: COLORS.navy, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});