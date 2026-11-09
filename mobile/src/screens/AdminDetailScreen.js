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

export default function AdminDetailScreen({ incidentId, onBack }) {
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
      Alert.alert('Error', e.message || 'No se pudo cargar el incidente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [incidentId]);

  const changeStatus = async () => {
    if (!selectedStateId) {
      Alert.alert('Selecciona estado', 'Elige el nuevo estado para el incidente.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`incidents/${incidentId}/status/`, {
        method: 'POST',
        body: { id_estado: selectedStateId, observacion: observation.trim() || null },
      });
      Alert.alert('Éxito', 'Estado actualizado y registrado en historial.');
      setObservation('');
      await loadAll();
    } catch (e) {
      Alert.alert('Error al cambiar estado', e.message || 'No se pudo actualizar');
    } finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Comentario vacío', 'Escribe un comentario antes de enviar.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`incidents/${incidentId}/comments/`, {
        method: 'POST',
        body: { comentario: commentText.trim() },
      });
      setCommentText('');
      await loadAll();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo agregar el comentario');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <Text style={{ color: COLORS.tan }}>Incidente no encontrado</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: COLORS.spaceCadet }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: COLORS.tan }]}>← Moderación</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={[styles.title, { color: COLORS.spaceCadet }]}>Incidente #{incident.id_incidente || incident.pk}</Text>
          <Text style={[styles.rowText, { color: COLORS.slateGray }]}>Tipo: {incident.tipo_riesgo_nombre || '—'}</Text>
          <Text style={[styles.rowText, { color: COLORS.slateGray }]}>Severidad: {incident.nivel_severidad_nombre || 'Sin definir'}</Text>
          <Text style={[styles.rowText, { color: COLORS.slateGray }]}>Estado: {incident.estado_nombre || '—'}</Text>
          <Text style={[styles.rowText, { color: COLORS.slateGray }]}>Zona: {incident.zona_nombre || 'Sin zona'}</Text>
          <Text style={[styles.rowText, { color: COLORS.slateGray }]}>📍 {incident.latitud}, {incident.longitud}</Text>
          <Text style={[styles.desc, { color: COLORS.spaceCadet }]}>{incident.descripcion}</Text>
        </View>

        <Text style={[styles.section, { color: COLORS.tan }]}>Cambiar estado (moderación)</Text>
        <TouchableOpacity style={[styles.selector, { borderColor: COLORS.slateGray }]} onPress={() => setShowPicker(!showPicker)}>
          <Text style={[styles.selectorText, { color: COLORS.spaceCadet }]}>{selectedStateLabel}</Text>
        </TouchableOpacity>
        {showPicker && (
          <View style={[styles.picker, { borderColor: COLORS.slateGray }]}>
            {states.map((s) => (
              <TouchableOpacity key={s.id_estado} style={styles.pickerItem} onPress={() => { setSelectedStateId(s.id_estado); setSelectedStateLabel(s.nombre_estado); setShowPicker(false); }}>
                <Text style={[styles.pickerItemText, { color: COLORS.spaceCadet }]} numberOfLines={2}>{s.nombre_estado}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={[styles.label, { color: COLORS.tan }]}>Observación (opcional)</Text>
        <TextInput style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]} value={observation} onChangeText={setObservation} placeholder="Ej. Verificado en terreno..." />
        <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.caput }]} onPress={changeStatus} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Aplicar cambio de estado'}</Text>
        </TouchableOpacity>

        <Text style={[styles.section, { color: COLORS.tan }]}>Historial ({histories.length})</Text>
        {histories.length === 0 ? (
          <Text style={{ color: COLORS.slateGray }}>Sin cambios registrados.</Text>
        ) : histories.map((h) => (
          <View key={h.id_historial} style={styles.histCard}>
            <Text style={[styles.histText, { color: COLORS.spaceCadet }]}>
              {h.id_estado_anterior ? `Estado ${h.id_estado_anterior}` : 'Creación'} → Estado {h.id_estado_nuevo} • {h.fecha_cambio ? h.fecha_cambio.slice(0, 16) : ''}
            </Text>
            {h.observacion ? <Text style={{ color: COLORS.slateGray }}>{h.observacion}</Text> : null}
          </View>
        ))}

        <Text style={[styles.section, { color: COLORS.tan }]}>Comentarios admin ({comments.length})</Text>
        {comments.map((c) => (
          <View key={c.id_comentario} style={styles.histCard}>
            <Text style={{ color: COLORS.spaceCadet }}>{c.comentario}</Text>
            <Text style={{ color: COLORS.slateGray, fontSize: 11 }}>{c.fecha_comentario ? c.fecha_comentario.slice(0, 16) : ''}</Text>
          </View>
        ))}
        <TextInput style={[styles.input, { borderColor: COLORS.slateGray, color: COLORS.spaceCadet }]} value={commentText} onChangeText={setCommentText} placeholder="Agregar comentario de moderación..." />
        <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.coffee }]} onPress={addComment} disabled={saving}>
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
  backText: { fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.caput },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  rowText: { fontSize: 14, marginBottom: 4 },
  desc: { fontSize: 15, marginTop: 8 },
  section: { fontSize: 16, fontWeight: 'bold', marginTop: 18, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  selector: { backgroundColor: '#FFF', borderWidth: 1, borderRadius: 8, padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  selectorText: { fontSize: 15, flex: 1 },
  picker: { backgroundColor: '#FFF', borderWidth: 1, borderRadius: 8, marginTop: 6, padding: 6 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pickerItemText: { fontSize: 15 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  button: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  histCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: COLORS.coffee },
  histText: { fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
