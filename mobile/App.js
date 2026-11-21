import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getAuthToken, clearAuthToken } from './src/api/tokenStorage';
import { authApi } from './src/api/client';

import AppBackground from './src/components/AppBackground';
import { COLORS } from './src/theme/colors';
import { GLASS } from './src/theme/glass';
import { ToastProvider } from './src/context/ToastContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import IncidentListScreen from './src/screens/IncidentListScreen';
import IncidentCreateScreen from './src/screens/IncidentCreateScreen';
import MapScreen from './src/screens/MapScreen';
import IncidentDetailScreen from './src/screens/IncidentDetailScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import PreventionScreen from './src/screens/PreventionScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';
import AdminModerationScreen from './src/screens/AdminModerationScreen';
import AdminDetailScreen from './src/screens/AdminDetailScreen';

function isAdminUser(user) {
  if (!user) return false;
  if (user.is_staff || user.is_superuser) return true;
  const roles = user.roles || [];
  return roles.includes('Administrador');
}

export default function App() {
  const [screen, setScreen] = useState('LOADING');
  const [incidentId, setIncidentId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const token = await getAuthToken();
      if (!token) { setScreen('LOGIN'); return; }
      try {
        const me = await authApi.me();
        setProfile(me);
        const admin = isAdminUser(me);
        setIsAdmin(admin);
        setScreen(admin ? 'ADMIN' : 'LIST');
      } catch {
        setScreen('LIST');
      }
    }
    checkAuth();
  }, []);

  const handleAfterLogin = (user) => {
    if (user) {
      setProfile(user);
      const admin = isAdminUser(user);
      setIsAdmin(admin);
      setScreen(admin ? 'ADMIN' : 'LIST');
    } else {
      setScreen('LIST');
    }
  };

  const goLogin = () => setScreen('LOGIN');
  const goRegister = () => setScreen('REGISTER');
  const goList = () => setScreen(isAdmin ? 'ADMIN' : 'LIST');
  const goMap = () => setScreen('MAP');
  const goCreate = () => setScreen('CREATE');
  const goDetail = (id) => { setIncidentId(id); setScreen('DETAIL'); };
  const goAdminDetail = (id) => { setIncidentId(id); setScreen('ADMIN_DETAIL'); };
  const goWeather = () => setScreen('WEATHER');
  const goPrevention = () => setScreen('PREVENTION');
  const goEmergency = () => setScreen('EMERGENCY');

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    await clearAuthToken();
    setProfile(null);
    setIsAdmin(false);
    setScreen('LOGIN');
  };

  let content;
  switch (screen) {
    case 'LOGIN':
      content = <LoginScreen onLogin={handleAfterLogin} onRegister={goRegister} />;
      break;
    case 'REGISTER':
      content = <RegisterScreen onRegister={() => setScreen('LOGIN')} onLogin={goLogin} />;
      break;
    case 'ADMIN':
      content = (
        <AdminModerationScreen
          onBack={() => setScreen('LIST')}
          onDetail={goAdminDetail}
          onMap={goMap}
          onWeather={goWeather}
          onPrevention={goPrevention}
          onEmergency={goEmergency}
          onLogout={handleLogout}
        />
      );
      break;
    case 'ADMIN_DETAIL':
      content = <AdminDetailScreen incidentId={incidentId} onBack={() => setScreen('ADMIN')} />;
      break;
    case 'LIST':
      content = (
        <IncidentListScreen
          onMap={goMap}
          onCreate={goCreate}
          onWeather={goWeather}
          onPrevention={goPrevention}
          onEmergency={goEmergency}
          onLogout={handleLogout}
          onDetail={goDetail}
          isAdmin={isAdmin}
          onAdmin={() => setScreen('ADMIN')}
        />
      );
      break;
    case 'MAP':
      content = (
        <MapScreen onBack={goList} profile={profile} isAdmin={isAdmin} />
      );
      break;
    case 'CREATE':
      content = (
        <IncidentCreateScreen onBack={goList} onCreated={() => setScreen(isAdmin ? 'ADMIN' : 'LIST')} />
      );
      break;
    case 'DETAIL':
      content = <IncidentDetailScreen incidentId={incidentId} onBack={goList} />;
      break;
    case 'WEATHER':
      content = <WeatherScreen onBack={isAdmin ? () => setScreen('ADMIN') : goList} />;
      break;
    case 'PREVENTION':
      content = <PreventionScreen onBack={isAdmin ? () => setScreen('ADMIN') : goList} />;
      break;
    case 'EMERGENCY':
      content = <EmergencyScreen onBack={isAdmin ? () => setScreen('ADMIN') : goList} />;
      break;
    default:
      content = (
        <View style={GLASS.centered}>
          <View style={[GLASS.card, { alignItems: 'center', minWidth: 220 }]}>
            <ActivityIndicator size="large" color={COLORS.navy} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppBackground>
          <SafeAreaView style={GLASS.screen} edges={['top', 'left', 'right']}>
            <StatusBar style="light" backgroundColor="#1E1A30" />
            {content}
          </SafeAreaView>
        </AppBackground>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingText: { marginTop: 12, color: '#4C362B', fontWeight: '700', fontSize: 14 },
});
