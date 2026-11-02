import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiRequest } from './src/api/client';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('Comprobando conexión...');
  const [detail, setDetail] = useState('');

  async function checkConnection() {
    setLoading(true);
    setConnected(false);
    setMessage('Comprobando conexión...');
    setDetail('');

    try {
      await apiRequest('', {
        authenticated: false,
        timeoutMs: 10000,
      });

      setConnected(true);
      setMessage('Conexión correcta');
      setDetail('La API respondió correctamente.');
    } catch (error) {
      if (error.status === 401) {
        setConnected(true);
        setMessage('¡API conectada correctamente!');
        setDetail('Django respondió HTTP 401. La API es accesible, pero requiere autenticación.');
      } else {
        setConnected(false);
        setMessage('No se pudo conectar con la API');
        setDetail(error.message || 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>STODDIE</Text>
      <Text style={styles.subtitle}>Prueba de conexión móvil</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Text style={[
            styles.status,
            { color: connected ? '#16803c' : '#c62828' },
          ]}>
            {message}
          </Text>
          <Text style={styles.detail}>{detail}</Text>
        </>
      )}

      <View style={styles.button}>
        <Button
          title="Volver a probar"
          onPress={checkConnection}
          disabled={loading}
        />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#173b57',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 35,
  },
  status: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    marginTop: 30,
    width: 200,
  },
});