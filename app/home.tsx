import { onAuthStateChanged } from 'firebase/auth';
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, useFocusEffect } from 'expo-router';

// FUNÇÃO DE UTILIDADE PARA GERAR O ID DA SEMANA ATUAL
const getSemanaId = () => {
const agora = new Date();
const primeiroDiaAno = new Date(agora.getFullYear(), 0, 1);
const dias = Math.floor((agora.getTime() - primeiroDiaAno.getTime()) / 86400000);
const semana = Math.ceil((dias + primeiroDiaAno.getDay() + 1) / 7);
return `${agora.getFullYear()}-W${semana}`;
};

export default function Home() {
    useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Se o usuário deslogou, limpa tudo e manda para o index
      setUserData(null);
      router.replace('/');
    }
  });
  return unsubscribe;
}, []);
const router = useRouter();
const [userData, setUserData] = useState<any>(null);
const [jaFezCheckin, setJaFezCheckin] = useState(false);
const [loading, setLoading] = useState(true);

const fetchData = async () => {
const user = auth.currentUser;
if (!user) return;

try {
// 1. Busca dados do perfil (nome, conquistas, etc)
const userSnap = await getDoc(doc(db, "pacientes", user.uid));
if (userSnap.exists()) {
setUserData(userSnap.data());
}

// 2. VERIFICAÇÃO DE CALENDÁRIO: Já existe check-in para ESTA semana?
const semanaAtual = getSemanaId();
const checkinRef = doc(db, "pacientes", user.uid, "checkins", semanaAtual);
const checkinSnap = await getDoc(checkinRef);

setJaFezCheckin(checkinSnap.exists());

} catch (error) {
console.error("Erro ao sincronizar:", error);
} finally {
setLoading(false);
}
};

useFocusEffect(
useCallback(() => {
fetchData();
}, [])
);

if (loading) {
return <View style={styles.center}><ActivityIndicator size="large" color="#26A69A" /></View>;
}

return (
<SafeAreaView style={{ flex: 1, backgroundColor: '#EAF9F4' }}>
<ScrollView style={styles.container}>
<View style={styles.header}>
<View>
<Text style={styles.greeting}>Bem-vinda, {userData?.nome?.split(' ')[0] || 'Paciente'} ✨</Text>
<Text style={styles.username}>@{userData?.username || 'gabs_user'}</Text>
</View>
<Image
source={{ uri: userData?.avatar || 'https://api.dicebear.com/8.x/avataaars-neutral/svg?seed=placeholder' }}
style={styles.avatar}
/>
</View>

<View style={styles.body}>
{/* CARD DE STATUS BASEADO NO CALENDÁRIO */}
<View style={[styles.statusCard, jaFezCheckin && styles.statusCardConcluido]}>
<Text style={[styles.statusLabel, jaFezCheckin && { color: '#fff' }]}>SEMANA {getSemanaId().split('-W')[1]}</Text>
<Text style={[styles.statusValue, jaFezCheckin && { color: '#fff' }]}>
{jaFezCheckin ? 'Check-in concluído! ✅' : 'Check-in disponível 📅'}
</Text>
</View>

<TouchableOpacity
style={[styles.mainBtn, jaFezCheckin && styles.mainBtnDisabled]}
onPress={() => !jaFezCheckin && router.push('/checkin')}
disabled={jaFezCheckin}
>
<Text style={styles.btnText}>
{jaFezCheckin ? 'Volte na próxima semana!' : 'Fazer Check-in Semanal'}
</Text>
</TouchableOpacity>

<Text style={styles.sectionTitle}>Minha Jornada</Text>
<View style={styles.badgeRow}>
<View style={[styles.badge, !userData?.conquista_estrela && styles.badgeLocked]}>
<Text style={styles.badgeEmoji}>{userData?.conquista_estrela ? '⭐' : '🔒'}</Text>
<Text style={[styles.badgeText, !userData?.conquista_estrela && styles.badgeTextLocked]}>Estrelinha</Text>
</View>
<View style={[styles.badge, !userData?.conquista_coracao && styles.badgeLocked]}>
<Text style={styles.badgeEmoji}>{userData?.conquista_coracao ? '❤️' : '🔒'}</Text>
<Text style={[styles.badgeText, !userData?.conquista_coracao && styles.badgeTextLocked]}>Coração</Text>
</View>
</View>

<View style={styles.infoCard}>
<Text style={styles.infoTitle}>Dica da Gabs 🌿</Text>
<Text style={styles.infoText}>
{jaFezCheckin
? "Tudo pronto! Seus dados já estão com a Gabs para análise."
: "Não esqueça de detalhar suas dificuldades, isso ajuda muito no seu plano!"}
</Text>
</View>

<TouchableOpacity style={styles.logoutBtn} onPress={() => auth.signOut()}>
  <Text style={styles.logoutText}>Sair da conta</Text>
</TouchableOpacity>
</View>
</ScrollView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1 },
center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAF9F4' },
header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 30, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4 },
greeting: { fontSize: 14, color: '#666' },
username: { fontSize: 20, fontWeight: 'bold', color: '#00392D' },
avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#B2DFDB', borderWidth: 2, borderColor: '#26A69A' },
body: { padding: 25 },
statusCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#B2DFDB' },
statusCardConcluido: { backgroundColor: '#00392D', borderColor: '#00392D' },
statusLabel: { fontSize: 10, color: '#26A69A', fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
statusValue: { fontSize: 17, fontWeight: 'bold', color: '#00392D' },
mainBtn: { backgroundColor: '#26A69A', padding: 22, borderRadius: 20, alignItems: 'center', marginBottom: 35, elevation: 5 },
mainBtnDisabled: { backgroundColor: '#B2DFDB', elevation: 0 },
btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#00392D', marginBottom: 15 },
badgeRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
badge: { backgroundColor: '#fff', padding: 15, borderRadius: 20, alignItems: 'center', flex: 1, borderWidth: 1, borderColor: '#eee' },
badgeLocked: { opacity: 0.5, backgroundColor: '#f9f9f9', borderStyle: 'dashed' },
badgeEmoji: { fontSize: 30, marginBottom: 5 },
badgeText: { fontSize: 11, color: '#444', fontWeight: 'bold' },
badgeTextLocked: { color: '#bbb' },
infoCard: { backgroundColor: '#00392D', padding: 20, borderRadius: 25, marginBottom: 30 },
infoTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
infoText: { color: '#B2DFDB', fontSize: 14, lineHeight: 20 },
logoutBtn: { alignSelf: 'center', marginTop: 10, marginBottom: 30 },
logoutText: { color: '#FF5252', fontWeight: '600', fontSize: 14 }
});