let webToken = null;

export async function getAuthToken() {
  return webToken;
}

export async function setAuthToken(token) {
  webToken = token;
}

export async function clearAuthToken() {
  webToken = null;
}
