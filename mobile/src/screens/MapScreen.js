import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { apiRequest, authApi } from '../api/client';
import { COLORS } from '../theme/colors';
import { GLASS } from '../theme/glass';
import { useToast } from '../context/ToastContext';
import {
  enrichIncident,
  getSeverityInfo,
  isAdminProfile,
} from '../utils/incidentMap';

const MAP_FILTERS = [
  { id: 'ALL', label: 'Todos los incidentes' },
  { id: 'MINE', label: 'Solo mis reportes' },
];

const MAP_HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
    .stoddie-pin { position: relative; width: 34px; height: 46px; }
    .stoddie-pin .pin-head {
      position: absolute; top: 2px; left: 5px; width: 24px; height: 24px;
      border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
      border: 3px solid #FFFFFF; box-shadow: 0 3px 8px rgba(8, 16, 32, 0.45);
    }
    .stoddie-pin .pin-core {
      position: absolute; top: 9px; left: 12px; width: 10px; height: 10px;
      border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.95);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    }
    .stoddie-pin.own .pin-head {
      box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.55), 0 3px 10px rgba(8, 16, 32, 0.5);
    }
    .stoddie-pin .own-badge {
      position: absolute; top: -6px; right: -10px;
      background: #00E5FF; color: #062833; font-size: 9px; font-weight: 800;
      padding: 2px 5px; border-radius: 8px; border: 1px solid #FFFFFF;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    }
    .popup { font-size: 12px; line-height: 1.5; color: #111827; min-width: 190px; }
    .popup-title { font-size: 13px; font-weight: 800; margin-bottom: 6px; }
    .popup-row { margin: 2px 0; }
    .popup-label { color: #617891; font-weight: 700; }
    .popup-badge { display: inline-block; color: #FFFFFF; font-weight: 800; padding: 1px 7px; border-radius: 8px; }
    .popup-own { display: inline-block; background: #00B8D9; color: #FFFFFF; font-weight: 800; padding: 1px 7px; border-radius: 8px; }
    .leaflet-popup-content-wrapper { border-radius: 14px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script id="incidents-data" type="application/json">__INCIDENTS_JSON__</script>
  <script>
    (function () {
      function esc(value) {
        if (value === null || value === undefined) return '—';
        return String(value).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }

      var defaultCenter = [-16.5, -68.13];
      var map = L.map('map', { scrollWheelZoom: false }).setView(defaultCenter, 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      var layer = L.layerGroup().addTo(map);
      var initial = JSON.parse(document.getElementById('incidents-data').textContent || '[]');

      function makeIcon(inc) {
        var severityColor = inc.color_severidad || '#6B7280';
        var markerColor = inc.color_marcador || severityColor;
        var coreColor = inc.es_mio ? severityColor : '#FFFFFF';
        var html =
          '<div class="stoddie-pin' + (inc.es_mio ? ' own' : '') + '">' +
            '<div class="pin-head" style="background:' + markerColor + '"></div>' +
            '<div class="pin-core" style="background:' + coreColor + '"></div>' +
            (inc.es_mio ? '<div class="own-badge">TÚ</div>' : '') +
          '</div>';
        return L.divIcon({
          className: '',
          html: html,
          iconSize: [34, 46],
          iconAnchor: [17, 44],
          popupAnchor: [0, -40],
        });
      }

      function popupHtml(inc) {
        var severityColor = inc.color_severidad || '#6B7280';
        var own = inc.es_mio ? '<span class="popup-own">Tu reporte</span>' : '';
        return '<div class="popup">' +
          '<div class="popup-title">Incidente #' + esc(inc.id_incidente || inc.pk) + ' ' + own + '</div>' +
          '<div class="popup-row"><span class="popup-label">Severidad:</span> ' +
            '<span class="popup-badge" style="background:' + severityColor + '">' + esc(inc.severidad_label) + '</span></div>' +
          '<div class="popup-row"><span class="popup-label">Tipo:</span> ' + esc(inc.tipo_riesgo_nombre || inc.tipo_riesgo) + '</div>' +
          '<div class="popup-row"><span class="popup-label">Estado:</span> ' + esc(inc.estado_nombre || inc.id_estado) + '</div>' +
          '<div class="popup-row"><span class="popup-label">Zona:</span> ' + esc(inc.zona_nombre) + '</div>' +
          '<div class="popup-row"><span class="popup-label">Departamento:</span> ' + esc(inc.nombre_departamento) + '</div>' +
          '<div class="popup-row"><span class="popup-label">Fecha:</span> ' +
            esc(inc.fecha_reporte ? String(inc.fecha_reporte).slice(0, 10) : '') + '</div>' +
          '<div class="popup-row"><span class="popup-label">Coordenadas:</span> ' +
            esc(inc.latitud) + ', ' + esc(inc.longitud) + '</div>' +
          '<div class="popup-row"><span class="popup-label">Nota:</span> ' + esc(inc.descripcion) + '</div>' +
          '</div>';
      }

      function render(incidents) {
        layer.clearLayers();
        var bounds = [];
        (incidents || []).forEach(function (inc) {
          var lat = parseFloat(inc.latitud);
          var lng = parseFloat(inc.longitud);
          if (isNaN(lat) || isNaN(lng)) return;
          var marker = L.marker([lat, lng], { icon: makeIcon(inc) });
          marker.bindPopup(popupHtml(inc));
          marker.addTo(layer);
          bounds.push([lat, lng]);
        });
        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 13);
        } else {
          map.setView(defaultCenter, 6);
        }
      }

      window.__stoddieMap = { set: render };
      window.addEventListener('message', function (event) {
        var data = event && event.data;
        if (data && data.type === 'STODDIE_SET_INCIDENTS') {
          render(data.incidents || []);
        }
      });

      render(initial);
    })();
  </script>
</body>
</html>
`;

// El HTML base no incluye incidentes: se inyectan después de `onLoad`.
// Así el WebView no se recarga al cambiar el filtro, el perfil o los datos.
const MAP_HTML = MAP_HTML_TEMPLATE.replace('__INCIDENTS_JSON__', '[]');

function safeJsLiteral(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

async function fetchAllIncidents() {
  const all = [];
  let page = 1;
  for (let guard = 0; guard < 25; guard += 1) {
    const data = await apiRequest(`incidents/?page=${page}`);
    const results = Array.isArray(data) ? data : data?.results || [];
    all.push(...results);
    if (!data?.next) break;
    page += 1;
  }
  return all;
}

function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function Chip({ label, active, color, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {color ? (
        <View style={[styles.chipDot, { backgroundColor: color }]} />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function IncidentCard({ incident, onPress }) {
  const fecha = incident.fecha_reporte
    ? String(incident.fecha_reporte).slice(0, 10)
    : '—';

  return (
    <TouchableOpacity
      style={[GLASS.cardInner, styles.listCard]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.listCardTop}>
        <Text style={styles.listCardTitle}>
          Incidente #{incident.id_incidente ?? incident.pk}
        </Text>
        {incident.es_mio ? (
          <View style={styles.ownTag}>
            <Text style={styles.ownTagText}>Tu reporte</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.listCardRow}>
        <View
          style={[
            styles.severityDot,
            { backgroundColor: incident.color_severidad },
          ]}
        />
        <Text style={styles.listCardText}>
          Severidad: {incident.severidad_label}
        </Text>
      </View>
      <Text style={styles.listCardText}>
        {incident.tipo_riesgo_nombre || '—'} · {incident.estado_nombre || '—'}
      </Text>
      <Text style={styles.listCardMuted}>
        {incident.zona_nombre || 'Sin zona'} · {fecha}
      </Text>
    </TouchableOpacity>
  );
}

export default function MapScreen({
  onBack,
  onDetail,
  profile: profileProp,
  isAdmin: isAdminProp,
}) {
  const { showError } = useToast();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);

  const [profile, setProfile] = useState(profileProp || null);
  const [incidents, setIncidents] = useState([]);
  const [catalogs, setCatalogs] = useState({ statuses: [], severities: [] });
  const [loading, setLoading] = useState(true);
  const [mapLoadCount, setMapLoadCount] = useState(0);
  const [viewMode, setViewMode] = useState('MAP');
  const [filter, setFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(null);
  const [severityFilter, setSeverityFilter] = useState(null);

  const isAdmin = isAdminProfile(profile, isAdminProp);

  useEffect(() => {
    let alive = true;
    async function resolveProfile() {
      if (profileProp) {
        setProfile(profileProp);
        return;
      }
      try {
        const me = await authApi.me();
        if (alive) setProfile(me);
      } catch {
        // Sin perfil no podemos marcar "Tu reporte", pero el mapa sigue funcionando.
      }
    }
    resolveProfile();
    return () => {
      alive = false;
    };
  }, [profileProp]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [incidentResult, statusResult, severityResult] =
        await Promise.allSettled([
          fetchAllIncidents(),
          apiRequest('incident-statuses/'),
          apiRequest('severity-levels/'),
        ]);

      if (incidentResult.status === 'fulfilled') {
        setIncidents(incidentResult.value || []);
      } else {
        throw incidentResult.reason;
      }

      if (statusResult.status === 'fulfilled') {
        setCatalogs((prev) => ({
          ...prev,
          statuses: statusResult.value?.results || statusResult.value || [],
        }));
      }
      if (severityResult.status === 'fulfilled') {
        setCatalogs((prev) => ({
          ...prev,
          severities: severityResult.value?.results || severityResult.value || [],
        }));
      }
    } catch (error) {
      showError(error.message || 'No se pudieron cargar los incidentes');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      await load();
    })();
  }, [load]);

  const enrichedIncidents = useMemo(
    () => incidents.map((incident) => enrichIncident(incident, profile)),
    [incidents, profile],
  );

  const visibleIncidents = useMemo(() => {
    return enrichedIncidents.filter((incident) => {
      if (filter === 'MINE' && !incident.es_mio) return false;
      if (statusFilter != null && !sameId(incident.id_estado, statusFilter)) {
        return false;
      }
      if (
        severityFilter != null &&
        !sameId(incident.id_nivel_severidad, severityFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [enrichedIncidents, filter, statusFilter, severityFilter]);

  useEffect(() => {
    if (!mapLoadCount || viewMode !== 'MAP') return;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'STODDIE_SET_INCIDENTS', incidents: visibleIncidents },
        '*',
      );
    } else {
      const script =
        '(function(){ if (window.__stoddieMap) { window.__stoddieMap.set(' +
        safeJsLiteral(visibleIncidents) +
        '); } })();';
      webViewRef.current?.injectJavaScript(script);
    }
  }, [mapLoadCount, viewMode, visibleIncidents]);

  if (loading) {
    return (
      <View style={GLASS.centered}>
        <ActivityIndicator size="large" color={COLORS.goldenCustard} />
        <Text style={GLASS.loaderText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={GLASS.screen}>
      <View style={GLASS.header}>
        <TouchableOpacity
          style={GLASS.backButton}
          onPress={onBack}
          activeOpacity={0.82}
        >
          <Text style={GLASS.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={GLASS.titleOnDark}>Mapa de Incidentes - Bolivia</Text>
        <Text style={GLASS.subtitleOnDark}>
          {visibleIncidents.length} de {enrichedIncidents.length} reporte(s)
          visibles
        </Text>

        <View style={[styles.filterRow, compact && styles.filterRowStacked]}>
          <View style={[styles.segment, compact && styles.segmentStacked]}>
            {MAP_FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.segmentButton,
                    active && styles.segmentButtonActive,
                  ]}
                  onPress={() => setFilter(option.id)}
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.viewToggle, compact && styles.viewToggleStacked]}
            onPress={() => setViewMode(viewMode === 'MAP' ? 'LIST' : 'MAP')}
            activeOpacity={0.82}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === 'MAP' ? 'Ver lista' : 'Ver mapa'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isAdmin ? (
        <View style={styles.adminFilters}>
          <Text style={styles.filterCaption}>Moderación:</Text>
          <Chip
            label="Todos los estados"
            active={statusFilter == null}
            onPress={() => setStatusFilter(null)}
          />
          {catalogs.statuses.map((status) => (
            <Chip
              key={status.id_estado}
              label={status.nombre_estado}
              active={sameId(statusFilter, status.id_estado)}
              onPress={() => setStatusFilter(status.id_estado)}
            />
          ))}
          <Chip
            label="Todas las severidades"
            active={severityFilter == null}
            onPress={() => setSeverityFilter(null)}
          />
          {catalogs.severities.map((severity) => (
            <Chip
              key={severity.id_nivel_severidad}
              label={severity.nombre_nivel}
              color={
                getSeverityInfo({
                  nivel_severidad_nombre: severity.nombre_nivel,
                  id_nivel_severidad: severity.id_nivel_severidad,
                }).color
              }
              active={sameId(severityFilter, severity.id_nivel_severidad)}
              onPress={() => setSeverityFilter(severity.id_nivel_severidad)}
            />
          ))}
        </View>
      ) : null}

      {viewMode === 'MAP' ? (
        <View style={styles.mapFrame}>
          {Platform.OS === 'web' ? (
            React.createElement('iframe', {
              ref: iframeRef,
              srcDoc: MAP_HTML,
              title: 'Mapa de incidentes - Bolivia',
              style: {
                border: 0,
                width: '100%',
                height: '100%',
                display: 'block',
              },
              onLoad: () => setMapLoadCount((count) => count + 1),
            })
          ) : (
            <WebView
              ref={webViewRef}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              source={{ html: MAP_HTML }}
              onLoad={() => setMapLoadCount((count) => count + 1)}
            />
          )}
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={visibleIncidents}
          keyExtractor={(item) =>
            String(item.id_incidente ?? item.pk ?? item.fecha_reporte)
          }
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() => onDetail?.(item.id_incidente ?? item.pk)}
            />
          )}
          ListEmptyComponent={
            <View style={GLASS.cardInner}>
              <Text style={styles.emptyText}>No hay reportes para este filtro.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  filterRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  viewToggle: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.glassStrong,
    flexShrink: 0,
  },
  viewToggleStacked: {
    width: '100%',
  },
  viewToggleText: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  segment: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.glassStrong,
    alignSelf: 'stretch',
  },
  segmentStacked: {
    flexGrow: 0,
    width: '100%',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.navy,
  },
  segmentText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  adminFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterCaption: {
    width: '100%',
    color: COLORS.pureLight,
    fontSize: 12,
    fontWeight: '800',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.glassStrong,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  chipActive: {
    backgroundColor: COLORS.goldenCustard,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  chipText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: COLORS.ink,
  },
  list: {
    flex: 1,
    paddingHorizontal: 14,
  },
  listContent: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 18,
  },
  listCard: {
    gap: 6,
  },
  listCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listCardTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  ownTag: {
    backgroundColor: '#00B8D9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ownTagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  listCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  listCardText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  listCardMuted: {
    color: COLORS.textMedium,
    fontSize: 11,
  },
  emptyText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 6,
  },
  mapFrame: {
    flex: 1,
    margin: 14,
    marginTop: 4,
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
