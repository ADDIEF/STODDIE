// Utilidades del mapa de incidentes: identidad del autor, severidad y roles.
// Se mantienen aquí para que MapScreen no dependa de detalles del serializer.

export const OWN_REPORT_COLOR = '#00B8D9';
export const OWN_REPORT_RING = '#00E5FF';
export const UNKNOWN_SEVERITY_COLOR = '#6B7280';

const SEVERITY_COLORS_BY_NAME = {
  leve: '#2E9E5B',
  bajo: '#2E9E5B',
  baja: '#2E9E5B',
  moderado: '#E0A100',
  moderada: '#E0A100',
  medio: '#E0A100',
  media: '#E0A100',
  grave: '#E4572E',
  alto: '#E4572E',
  alta: '#E4572E',
  critico: '#C1121F',
  critica: '#C1121F',
};

const SEVERITY_COLORS_BY_ID = {
  1: '#2E9E5B',
  2: '#E0A100',
  3: '#E4572E',
  4: '#C1121F',
};

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'object') {
    return normalizeId(
      value.id ??
        value.pk ??
        value.id_usuario ??
        value.usuario_id ??
        value.user_id ??
        value.uid,
    );
  }
  return null;
}

export function getCurrentUserId(profile) {
  if (!profile) return null;
  return normalizeId(
    profile.id_usuario ??
      profile.usuario_id ??
      profile.user_id ??
      profile.id ??
      profile.pk ??
      profile.usuario ??
      profile.user,
  );
}

export function getIncidentAuthorId(incident) {
  if (!incident) return null;
  return normalizeId(
    incident.id_usuario ??
      incident.usuario_id ??
      incident.user_id ??
      incident.idUser ??
      incident.usuario ??
      incident.user ??
      incident.autor ??
      incident.author,
  );
}

export function isOwnIncident(incident, profile) {
  const authorId = getIncidentAuthorId(incident);
  const currentId = getCurrentUserId(profile);
  return Boolean(authorId && currentId && authorId === currentId);
}

export function getSeverityInfo(incident) {
  const rawName = incident?.nivel_severidad_nombre;
  const label =
    typeof rawName === 'string' && rawName.trim()
      ? rawName.trim()
      : 'Sin definir';
  const id = normalizeId(incident?.id_nivel_severidad);
  const color =
    SEVERITY_COLORS_BY_NAME[normalizeText(label)] ||
    (id ? SEVERITY_COLORS_BY_ID[id] : null) ||
    UNKNOWN_SEVERITY_COLOR;

  return { label, color };
}

export function isAdminProfile(profile, override) {
  if (typeof override === 'boolean') return override;
  if (!profile) return false;
  if (profile.is_staff || profile.is_superuser) return true;

  const roles = Array.isArray(profile.roles) ? profile.roles : [];
  return roles.some((role) => {
    const name = typeof role === 'string' ? role : role?.nombre_rol ?? role?.name;
    return normalizeText(name) === 'administrador';
  });
}

export function enrichIncident(incident, profile) {
  const severity = getSeverityInfo(incident);
  const own = isOwnIncident(incident, profile);

  return {
    ...incident,
    latitud: incident?.latitud != null ? String(incident.latitud) : null,
    longitud: incident?.longitud != null ? String(incident.longitud) : null,
    es_mio: own,
    severidad_label: severity.label,
    color_severidad: severity.color,
    color_marcador: own ? OWN_REPORT_COLOR : severity.color,
  };
}
