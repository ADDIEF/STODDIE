import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getAuthToken, clearAuthToken } from '../api/tokenStorage';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import IncidentListScreen from '../screens/IncidentListScreen';
import IncidentCreateScreen from '../screens/IncidentCreateScreen';
import MapScreen from '../screens/MapScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const token = await getAuthToken();
      setIsAuthenticated(!!token);
    }
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#173b57', borderBottomWidth: 0 },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Crear cuenta' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={IncidentListScreen}
              options={{ title: 'Reportes', headerRight: () => null }}
            />
            <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Mapa' }} />
            <Stack.Screen
              name="IncidentCreate"
              component={IncidentCreateScreen}
              options={{ title: 'Nuevo incidente' }}
            />
            <Stack.Screen
              name="IncidentDetail"
              component={IncidentDetailScreen}
              options={{ title: 'Detalle del incidente' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}