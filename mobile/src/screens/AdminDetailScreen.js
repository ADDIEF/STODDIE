import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  const loadAll = async () => {
    setLoading(true);
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
  };

  useEffect(() => { loadAll(); }, [incidentId]);

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
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
        <Text style={styles.loaderText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <Text style={styles.emptyText}>Incidente no encontrado</Text>
      </View>
    );
  }

  const estado = incident.estado_nombre || `Estado ${incident.id_estado}`;
  const isPendiente = incident.id_estado === 1 || estado.toLowerCase() === 'pendiente';
  const isConfirmado = incident.id_estado === 3 || estado.toLowerCase() === 'confirmado';
  const isFalso = incident.id_estado === 5 || estado.toLowerCase() === 'falso / rechazado';
  const semaforoColor = isConfirmado ? '#4CAF50' : isPendiente ? '#FFA000' : isFalso ? '#D32F2F' : COLORS.slateGray;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: COLORS.spaceCadet }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Moderación</Text>
        </TouchableOpacity>
        <View style={styles.glassCard}>
          <View style={styles.semaforoRow}>
            <View style={[styles.semaforoDot, { backgroundColor: semaforoColor }]} />
            <Text style={styles.semaforoLabel}>{estado}</Text>
          </View>
          <Text style={styles.title}>Incidente #{incident.id_incidente || incident.pk}</Text>
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

        <Text style={styles.section}>Cambiar estado (moderación)</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowPicker(!showPicker)} activeOpacity={0.7}>
          <Text style={styles.selectorText}>{selectedStateLabel}</Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>
        {showPicker && (
          <View style={styles.picker}>
            {states.map((s) => (
              <TouchableOpacity key={s.id_estado} style={styles.pickerItem} onPress={() => { setSelectedStateId(s.id_estado); setSelectedStateLabel(s.nombre_estado); setShowPicker(false); }} activeOpacity={0.7}>
                <Text style={styles.pickerItemText}>{s.nombre_estado}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={styles.label}>Observación (opcional)</Text>
        <TextInput style={styles.input} value={observation} onChangeText={setObservation} placeholder="Ej. Verificado en terreno..." />
        <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.caput }]} onPress={changeStatus} disabled={saving} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Aplicar cambio de estado'}</Text>
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
        <TextInput style={styles.input} value={commentText} onChangeText={setCommentText} placeholder="Agregar comentario de moderación..." />
        <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.coffee }]} onPress={addComment} disabled={saving} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Agregar comentario</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: COLORS.tan, fontSize: 14, fontWeight: '600' },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.caput,
  },
  semaforoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  semaforoDot: { width: 16, height: 16, borderRadius: 8 },
  semaforoLabel: { fontSize: 16, fontWeight: '700', color: COLORS.spaceCadet },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.spaceCadet, marginBottom: 8 },
  row: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.slateGray },
  value: { fontSize: 15, color: COLORS.spaceCadet, marginTop: 2 },
  description: { fontSize: 15, color: COLORS.spaceCadet, marginTop: 2, lineHeight: 22 },
  section: { fontSize: 16, fontWeight: 'bold', color: COLORS.tan, marginTop: 18, marginBottom: 8 },
  selector: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  selectorText: { fontSize: 15, flex: 1, color: COLORS.spaceCadet },
  selectorArrow: { fontSize: 14, color: COLORS.coffee },
  picker: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    marginTop: 6,
    padding: 6,
  },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(213, 184, 147, 0.3)' },
  pickerItemText: { fontSize: 15, color: COLORS.spaceCadet },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.spaceCadet,
    marginTop: 6,
  },
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  histCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.coffee,
  },
  histText: { fontSize: 13, color: COLORS.spaceCadet },
  histObs: { fontSize: 12, color: COLORS.slateGray, marginTop: 4, fontStyle: 'italic' },
  commentText: { fontSize: 14, color: COLORS.spaceCadet },
  commentDate: { fontSize: 11, color: COLORS.slateGray, marginTop: 4 },
  emptyText: { color: COLORS.slateGray, fontSize: 14, marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: COLORS.tan, marginTop: 12, fontSize: 14 },
});