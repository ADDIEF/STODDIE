import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

export default function AdminDetailScreen({ incidentId, onBack }) {
  const { showError, showSuccess } = useToast();
  const [incident, setIncident] = useState(null);
  const [histories, setHistories] = useState([]);
  const [comments, setComments] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedStateLabel, setSelectedStateLabel] = useState('Selecciona...');
  const [observation, setObservation] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [inc, hist, comm, estados] = await Promise.allSettled([
        apiRequest(`incidents/${incidentId}/`),
        apiRequest(`incidents/${incidentId}/history/`),
        apiRequest(`incidents/${incidentId}/comments/`),
        apiRequest('incident-statuses/'),
      ]);
      if (inc.status === 'fulfilled') setIncident(inc.value);
      else throw inc.reason;
      if (hist.status === 'fulfilled') setHistories(hist.value.results || hist.value);
      if (comm.status === 'fulfilled') setComments(comm.value.results || comm.value);
      if (estados.status === 'fulfilled') setStates(estados.value.results || estados.value);
    } catch (e) {
      showError(e.message || 'No se pudo cargar el incidente');
    } finally {
      setLoading(false);
    }
  }, [incidentId, showError]);

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      await loadAll();
    })();
  }, [loadAll]);

  const changeStatus = async () => {
    if (!selectedStateId) {
      showError('Elige el nuevo estado para el incidente');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`incidents/${incidentId}/status/`, {
        method: 'POST',
        body: { id_estado: selectedStateId, observacion: observation.trim() || null },
      });
      showSuccess('Estado actualizado y registrado en historial');
      setObservation('');
      await loadAll();
    } catch (e) {
      showError(e.message || 'No se pudo actualizar');
    } finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!commentText.trim()) {
      showError('Escribe un comentario antes de enviar');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`incidents/${incidentId}/comments/`, {
        method: 'POST',
        body: { comentario: commentText.trim() },
      });
      showSuccess('Comentario agregado');
      setCommentText('');
      await loadAll();
    } catch (e) {
      showError(e.message || 'No se pudo agregar el comentario');
    } finally { setSaving(false); }
  };

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
          <Text style={GLASS.backText}>← Moderación</Text>
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
    <KeyboardAvoidingView
      style={GLASS.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
          <Text style={GLASS.backText}>← Moderación</Text>
        </TouchableOpacity>

        <View style={[GLASS.card, { borderLeftWidth: 5, borderLeftColor: semaforoColor }]}>
          <View style={styles.semaforoRow}>
            <View style={[styles.semaforoDot, { backgroundColor: semaforoColor }]} />
            <Text style={styles.semaforoLabel}>{estado}</Text>
          </View>
          <Text style={styles.title}>Incidente #{incident.id_incidente || incident.pk}</Text>
          <DetailRow label="Tipo de riesgo" value={incident.tipo_riesgo_nombre || '—'} />
          <DetailRow label="Nivel de severidad" value={incident.nivel_severidad_nombre || 'Sin definir'} />
          <DetailRow label="Zona" value={incident.zona_nombre || 'Sin zona'} />
          <DetailRow label="Latitud" value={incident.latitud != null ? String(incident.latitud) : '—'} />
          <DetailRow label="Longitud" value={incident.longitud != null ? String(incident.longitud) : '—'} />
          <DetailRow label="Referencia" value={incident.referencia_ubicacion || '—'} />
          <DetailRow label="Descripción" value={incident.descripcion || '—'} />
          <DetailRow label="Fecha" value={incident.fecha_reporte ? incident.fecha_reporte.slice(0, 16) : '—'} />
        </View>

        <Text style={styles.section}>Cambiar estado (moderación)</Text>
        <TouchableOpacity style={GLASS.selector} onPress={() => setShowPicker(!showPicker)} activeOpacity={0.82}>
          <Text style={styles.selectorText}>{selectedStateLabel}</Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>
        {showPicker && (
          <View style={styles.picker}>
            {states.map((s) => (
              <TouchableOpacity
                key={s.id_estado}
                style={GLASS.modalItem}
                onPress={() => {
                  setSelectedStateId(s.id_estado);
                  setSelectedStateLabel(s.nombre_estado);
                  setShowPicker(false);
                }}
                activeOpacity={0.82}
              >
                <Text style={styles.pickerItemText}>{s.nombre_estado}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={[GLASS.label, { marginTop: 12 }]}>Observación (opcional)</Text>
        <TextInput
          style={GLASS.input}
          value={observation}
          onChangeText={setObservation}
          placeholder="Ej. Verificado en terreno..."
          placeholderTextColor={COLORS.textMedium}
        />
        <TouchableOpacity style={[GLASS.buttonAction, { marginTop: 14 }]} onPress={changeStatus} disabled={saving} activeOpacity={0.85}>
          <Text style={GLASS.buttonActionText}>{saving ? 'Guardando...' : 'Aplicar cambio de estado'}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Historial ({histories.length})</Text>
        {histories.length === 0 ? (
          <Text style={styles.emptyText}>Sin cambios registrados.</Text>
        ) : histories.map((h) => (
          <View key={h.id_historial} style={styles.histCard}>
            <Text style={styles.histText}>
              {h.id_estado_anterior ? `Estado ${h.id_estado_anterior}` : 'Creación'} → Estado {h.id_estado_nuevo} • {h.fecha_cambio ? h.fecha_cambio.slice(0, 16) : ''}
            </Text>
            {h.observacion ? <Text style={styles.histObs}>{h.observacion}</Text> : null}
          </View>
        ))}

        <Text style={styles.section}>Comentarios admin ({comments.length})</Text>
        {comments.map((c) => (
          <View key={c.id_comentario} style={styles.histCard}>
            <Text style={styles.commentText}>{c.comentario}</Text>
            <Text style={styles.commentDate}>{c.fecha_comentario ? c.fecha_comentario.slice(0, 16) : ''}</Text>
          </View>
        ))}
        <TextInput
          style={GLASS.input}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Agregar comentario de moderación..."
          placeholderTextColor={COLORS.textMedium}
        />
        <TouchableOpacity style={[GLASS.buttonPrimary, { marginTop: 12 }]} onPress={addComment} disabled={saving} activeOpacity={0.85}>
          <Text style={GLASS.buttonPrimaryText}>Agregar comentario</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scroll: { padding: 14, paddingBottom: 40 },
  semaforoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  semaforoDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderDark },
  semaforoLabel: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.navy, marginBottom: 8 },
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
  section: { fontSize: 16, fontWeight: '800', color: COLORS.pureLight, marginTop: 20, marginBottom: 10, textShadowColor: '#000', textShadowRadius: 4 },
  selectorText: { fontSize: 15, flex: 1, color: COLORS.ink, fontWeight: '600' },
  selectorArrow: { fontSize: 13, color: COLORS.navy },
  picker: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 14,
    marginTop: 6,
    padding: 4,
  },
  pickerItemText: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
  histCard: {
    backgroundColor: COLORS.glassStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.navy,
  },
  histText: { fontSize: 12, color: COLORS.ink, fontWeight: '600' },
  histObs: { fontSize: 12, color: COLORS.cocoa, marginTop: 4, fontStyle: 'italic' },
  commentText: { fontSize: 13, color: COLORS.ink, fontWeight: '600' },
  commentDate: { fontSize: 11, color: COLORS.cocoa, marginTop: 4 },
  emptyText: { color: COLORS.pureLight, fontSize: 14, marginTop: 8, fontWeight: '600' },
});
