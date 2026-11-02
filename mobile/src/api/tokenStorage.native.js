import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'stoddie.auth.token';

export function getAuthToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function setAuthToken(token) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearAuthToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
