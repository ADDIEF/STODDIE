import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  }, [incidentId, showError]);

  if (loading) {
    return (
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={GLASS.centered}>
        <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
          <Text style={GLASS.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.emptyText}>Incidente no encontrado</Text>
      </View>
    );
  }

  const estado = incident.estado_nombre || `Estado ${incident.id_estado}`;
  const isPendiente = incident.id_estado === 1 || estado.toLowerCase() === 'pendiente';
  const isConfirmado = incident.id_estado === 3 || estado.toLowerCase() === 'confirmado';
  const isFalso = incident.id_estado === 5 || estado.toLowerCase() === 'falso / rechazado';
  const semaforoColor = isConfirmado ? '#2E9E5B' : isPendiente ? '#E0A100' : isFalso ? COLORS.rust : COLORS.serenityBlue;

  return (
    <View style={GLASS.screen}>
      <View style={GLASS.header}>
        <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
          <Text style={GLASS.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={GLASS.titleOnDark}>Incidente #{incident.id_incidente || incident.pk}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[GLASS.card, { borderLeftWidth: 5, borderLeftColor: semaforoColor }]}>
          <View style={styles.semaforoRow}>
            <View style={[styles.semaforoDot, { backgroundColor: semaforoColor }]} />
            <Text style={styles.semaforoLabel}>{estado}</Text>
          </View>

          <DetailRow label="Tipo de riesgo" value={incident.tipo_riesgo_nombre || '—'} />
          <DetailRow label="Nivel de severidad" value={incident.nivel_severidad_nombre || 'Sin definir'} />
          <DetailRow label="Zona" value={incident.zona_nombre || 'Sin zona'} />
          <DetailRow label="Latitud" value={incident.latitud != null ? String(incident.latitud) : '—'} />
          <DetailRow label="Longitud" value={incident.longitud != null ? String(incident.longitud) : '—'} />
          <DetailRow label="Referencia" value={incident.referencia_ubicacion || '—'} />
          <DetailRow label="Descripción" value={incident.descripcion || '—'} />
          <DetailRow label="Fecha" value={incident.fecha_reporte ? incident.fecha_reporte.slice(0, 16) : '—'} />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={[GLASS.buttonGlass, { flex: 1 }]} activeOpacity={0.82}>
            <Text style={styles.quickIcon}>🛡️</Text>
            <Text style={GLASS.buttonGlassText}>Ver guías preventivas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[GLASS.buttonGlass, { flex: 1 }]} activeOpacity={0.82}>
            <Text style={styles.quickIcon}>🚨</Text>
            <Text style={GLASS.buttonGlassText}>Contactos de emergencia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 14, paddingBottom: 30 },
  semaforoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  semaforoDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderDark },
  semaforoLabel: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorderDark,
  },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.cocoa, flex: 1 },
  value: { fontSize: 14, color: COLORS.ink, fontWeight: '600', flex: 1.4, textAlign: 'right' },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  quickIcon: { fontSize: 22, marginBottom: 4 },
  emptyText: { color: COLORS.pureLight, fontSize: 15, marginTop: 10, fontWeight: '600' },
});
