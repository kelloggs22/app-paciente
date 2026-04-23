import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* INDEX: Login/Cadastro. Blindamos para não voltar por gesto */}
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false, 
            gestureEnabled: false 
          }} 
        />

        {/* HOME: Quando entrar aqui, o replace vai garantir que não tenha "volta" */}
        <Stack.Screen 
          name="home" 
          options={{ 
            headerShown: false, 
            gestureEnabled: false 
          }} 
        />

        {/* CHECK-IN: Mantemos seu estilo verde, mas tiramos o gesto de voltar para não bugar o rascunho */}
        <Stack.Screen 
          name="checkin" 
          options={{ 
            headerShown: true, 
            title: 'Check-in Gabs',
            headerTintColor: '#00392D',
            headerStyle: { backgroundColor: '#EAF9F4' },
            gestureEnabled: false 
          }} 
        />
        
        {/* AVATAR: Modal puro. Ele abre por cima e, ao dar navigate ou back, ele some sem deixar rastro */}
        <Stack.Screen 
          name="avatar" 
          options={{ 
            presentation: 'modal', 
            headerShown: true, 
            title: 'Escolha seu Avatar',
            headerTintColor: '#00392D',
            headerStyle: { backgroundColor: '#fff' }
          }} 
        />
        
        {/* Caso ainda use abas, mantemos a referência */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}