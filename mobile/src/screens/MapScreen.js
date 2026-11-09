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

const MAP_HTML_TEMPLATE = `
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
  <script id="incidents-data" type="application/json">__INCIDENTS_JSON__</script>
  <script>
    const incidents = JSON.parse(document.getElementById('incidents-data').textContent);
    const map = L.map('map', { scrollWheelZoom: false }).setView([-16.5, -68.13], 6);

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
    const bounds = [];

    if (incidents && incidents.length > 0) {
      incidents.forEach((inc) => {
        const lat = parseFloat(inc.latitud);
        const lng = parseFloat(inc.longitud);
        if (!isNaN(lat) && !isNaN(lng)) {
          const m = L.marker([lat, lng], { icon: redIcon }).addTo(map);
          m.bindPopup(
            '<div class="popup">' +
            '<b>Incidente #' + (inc.id_incidente || inc.pk) + '</b><br>' +
            '<b>Tipo:</b> ' + (inc.tipo_riesgo_nombre || inc.tipo_riesgo || '—') + '<br>' +
            '<b>Severidad:</b> ' + (inc.nivel_severidad_nombre || 'Sin definir') + '<br>' +
            '<b>Estado:</b> ' + (inc.estado_nombre || inc.id_estado || '—') + '<br>' +
            '<b>Zona:</b> ' + (inc.zona_nombre || 'Sin zona') + '<br>' +
            '<b>Fecha:</b> ' + (inc.fecha_reporte ? inc.fecha_reporte.slice(0, 10) : '—') + '<br>' +
            '<b>Nota:</b> ' + (inc.descripcion || '—') +
            '</div>'
          );
          markers.push(m);
          bounds.push([lat, lng]);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds);
      }
    } else {
      map.setView([-16.5, -68.13], 6);
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
          latitud: inc.latitud != null ? String(inc.latitud) : null,
          longitud: inc.longitud != null ? String(inc.longitud) : null,
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

  if (Platform.OS === 'web') {
    const html = MAP_HTML_TEMPLATE.replace(
      '__INCIDENTS_JSON__',
      JSON.stringify(incidents).replace(/</g, '\\u003c')
    );

    return (
      <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={[styles.backText, { color: COLORS.tan }]}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: COLORS.tan }]}>Mapa de incidentes - Bolivia</Text>
          <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>{incidents.length} reporte(s) en el mapa</Text>
        </View>
        <View style={{ flex: 1 }}>
          {React.createElement('iframe', {
            srcDoc: html,
            title: 'Mapa de incidentes - Bolivia',
            style: { border: '0', width: '100%', height: '100%', display: 'block' },
          })}
        </View>
      </View>
    );
  }

  const html = MAP_HTML_TEMPLATE.replace(
    '__INCIDENTS_JSON__',
    JSON.stringify(incidents).replace(/</g, '\\u003c')
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.spaceCadet }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={[styles.backText, { color: COLORS.tan }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: COLORS.tan }]}>Mapa de incidentes - Bolivia</Text>
        <Text style={[styles.subtitle, { color: COLORS.slateGray }]}>{incidents.length} reporte(s) en el mapa</Text>
      </View>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        source={{ html }}
      />
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
});
