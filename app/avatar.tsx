import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const AVATARES = [
  'https://api.dicebear.com/8.x/avataaars-neutral/png?seed=Felix',
  'https://api.dicebear.com/8.x/avataaars-neutral/png?seed=Aneka',
  'https://api.dicebear.com/8.x/avataaars-neutral/png?seed=Milo',
  'https://api.dicebear.com/8.x/avataaars-neutral/png?seed=Luna'
];

export default function EscolherAvatar() {
  const router = useRouter();

  const selecionar = (url: string) => {
    // router.navigate não cria uma nova tela, ele volta para a tela inicial 
    // com os parâmetros, limpando o modal.
    router.navigate({
      pathname: "/",
      params: { avatarEscolhido: url }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Escolha seu estilo 🎨</Text>
      <View style={styles.grid}>
        {AVATARES.map((url, i) => (
          <TouchableOpacity key={i} onPress={() => selecionar(url)} style={styles.card}>
            <Image source={{ uri: url }} style={styles.img} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  card: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 20 },
  img: { width: 100, height: 100 }
});