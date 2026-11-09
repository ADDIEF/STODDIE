import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map { height: 100vh; width: 100vw; }
    body { margin: 0; padding: 0; }
    .popup { font-family: Arial, sans-serif; font-size: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const incidents = __INCIDENTS__;
    const map = L.map('map', { scrollWheelZoom: false }).setView([-16.5, -68.13], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const markers = [];
    if (incidents && incidents.length > 0) {
      incidents.forEach((inc) => {
        if (inc.latitud == null || inc.longitud == null) return;
        const m = L.marker([inc.latitud, inc.longitud], { icon: redIcon }).addTo(map);
        m.bindPopup('<div class="popup"><b>Incidente #' + (inc.id_incidente || inc.pk) + '</b><br><b>Tipo:</b> ' + (inc.tipo_riesgo_nombre || inc.tipo_riesgo || '—') + '<br><b>Severidad:</b> ' + (inc.nivel_severidad_nombre || 'Sin definir') + '<br><b>Estado:</b> ' + (inc.estado_nombre || inc.id_estado || '—') + '<br><b>Zona:</b> ' + (inc.zona_nombre || 'Sin zona') + '<br><b>Fecha:</b> ' + (inc.fecha_reporte ? inc.fecha_reporte.slice(0,10) : '—') + '<br><b>Nota:</b> ' + (inc.descripcion || '—') + '</div>');
        markers.push(m);
      });
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  </script>
</body>
</html>
`;

export default function MapScreen({ onBack }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest('incidents/');
        const list = (data.results || data).map((inc) => ({
          ...inc,
          latitud: inc.latitud != null ? parseFloat(inc.latitud) : null,
          longitud: inc.longitud != null ? parseFloat(inc.longitud) : null,
        }));
        setIncidents(list);
      } catch (error) {
        Alert.alert('Error', error.message || 'No se pudieron cargar los incidentes');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.spaceCadet }]}>
        <ActivityIndicator size="large" color={COLORS.coffee} />
      </View>
    );
  }

  const html = MAP_HTML.replace('__INCIDENTS__', JSON.stringify(incidents));

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={[styles.backText, { color: COLORS.tan }]}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: COLORS.tan }]}>Mapa La Paz</Text>
          <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>{incidents.length} reporte(s) • clic en punto rojo para detalle</Text>
        </View>
        <View style={{ flex: 1 }}>
          {React.createElement('iframe', {
            srcDoc: html,
            title: 'Mapa de incidentes — La Paz',
            style: { border: '0', width: '100%', height: '100%', display: 'block' },
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={[styles.backText, { color: COLORS.tan }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: COLORS.tan }]}>Mapa La Paz</Text>
        <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>{incidents.length} reporte(s) en La Paz • clic en punto rojo</Text>
      </View>
      <WebView style={styles.webview} originWhitelist={['*']} javaScriptEnabled domStorageEnabled source={{ html }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 12,
    paddingTop: 44,
    backgroundColor: COLORS.spaceCadet,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slateGray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 2 },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  metaLabel: { fontSize: 12, fontWeight: '600', minWidth: 90 },
  metaValue: { fontSize: 14 },
  listContent: { paddingBottom: 20 },
});