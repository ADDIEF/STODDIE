const TOKEN_KEY = 'stoddie.auth.token';

// Fallback en memoria por si el navegador bloquea localStorage (modo privado).
let memoryToken = null;

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {}
  return null;
}

export async function getAuthToken() {
  const storage = getStorage();
  if (!storage) return memoryToken;
  try {
    return storage.getItem(TOKEN_KEY) || memoryToken;
  } catch {
    return memoryToken;
  }
}

export async function setAuthToken(token) {
  memoryToken = token || null;
  const storage = getStorage();
  if (!storage) return;
  try {
    if (token) {
      storage.setItem(TOKEN_KEY, token);
    } else {
      storage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export async function clearAuthToken() {
  await setAuthToken(null);
}
