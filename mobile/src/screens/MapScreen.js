import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { apiRequest } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';

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
          bounds.push([lat, lng]);
        }
      });
      if (bounds.length > 0) map.fitBounds(bounds);
    } else {
      map.setView([-16.5, -68.13], 6);
    }
  </script>
</body>
</html>
`;

export default function MapScreen({ onBack }) {
  const { showError } = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

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
        showError(error.message || 'No se pudieron cargar los incidentes');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showError]);

  if (loading) {
    return (
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando mapa...</Text>
      </View>
    );
  }

  const html = MAP_HTML_TEMPLATE.replace(
    '__INCIDENTS_JSON__',
    JSON.stringify(incidents).replace(/</g, '\\u003c')
  );

  return (
    <View style={GLASS.screen}>
      <View style={GLASS.header}>
        <TouchableOpacity style={GLASS.backButton} onPress={onBack} activeOpacity={0.82}>
          <Text style={GLASS.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={GLASS.titleOnDark}>Mapa de Incidentes - Bolivia</Text>
        <Text style={GLASS.subtitleOnDark}>{incidents.length} reporte(s) en el mapa</Text>
      </View>

      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          React.createElement('iframe', {
            srcDoc: html,
            title: 'Mapa de incidentes - Bolivia',
            style: { border: 0, width: '100%', height: '100%', display: 'block' },
          })
        ) : (
          <WebView
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            source={{ html }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: {
    flex: 1,
    margin: 14,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 9,
  },
  webview: { flex: 1, backgroundColor: COLORS.white },
});
