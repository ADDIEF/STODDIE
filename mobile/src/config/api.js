import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

const defaultApiUrl = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  default: 'http://127.0.0.1:8000/api/v1',
});

export const API_BASE_URL = (
  configuredApiUrl?.trim() || defaultApiUrl
).replace(/\/+$/, '');
