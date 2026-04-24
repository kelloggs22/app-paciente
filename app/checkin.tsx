import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, 
  Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../firebaseConfig'; 
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dm7vfysob/image/upload";
const UPLOAD_PRESET = "gabs_nutri";

const getSemanaId = () => {
  const agora = new Date();
  const primeiroDiaAno = new Date(agora.getFullYear(), 0, 1);
  const dias = Math.floor((agora.getTime() - primeiroDiaAno.getTime()) / 86400000);
  const semana = Math.ceil((dias + primeiroDiaAno.getDay() + 1) / 7);
  return `${agora.getFullYear()}-W${semana}`; 
};

export default function CheckIn() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [respostas, setRespostas] = useState<any>({ agua_litros: 2 });
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const semanaAtual = getSemanaId();

  useEffect(() => {
    const verificarStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const docRef = doc(db, "pacientes", user.uid, "checkins", semanaAtual);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        Alert.alert("Check-in Ok", "Você já enviou suas respostas desta semana! ✨");
        router.replace('/home');
      }
      setVerificando(false);
    };
    verificarStatus();
  }, []);

  // Definição dinâmica das perguntas
  const PERGUNTAS: any[] = [
    { id: 'nota_alimento', label: 'Nota da alimentação 🍎', sub: 'De 0 a 10 na semana', type: 'escala', max: 10 },
    { id: 'dias_plano', label: 'Dias no plano 🗓️', sub: 'Quantos dias seguiu o plano?', type: 'escala', max: 7 },
    { id: 'dificuldade', label: 'O que foi mais difícil? 🤯', type: 'texto' },
    { id: 'melhoria', label: 'O que pode melhorar? 🌿', type: 'texto' },
    { id: 'furo_plano', label: 'O que furou do plano? 🍕', type: 'texto' },
    { id: 'agua_litros', label: 'Consumo de Água 💧', sub: 'Litros médios por dia', type: 'slider', max: 5 },
    { id: 'dias_treino', label: 'Dias de treino 🏋️', sub: 'Quantos dias treinou?', type: 'escala', max: 7 },
    { id: 'tipo_treino', label: 'Tipo de treino 📝', sub: 'Opcional', type: 'texto_curto' },
    { id: 'fez_refeicao_livre', label: 'Fez refeição livre? 🍔', type: 'selecao', options: ['Sim', 'Não'] },
    ...(respostas.fez_refeicao_livre === 'Sim' ? [
      { id: 'qtd_livre', label: 'Quantas refeições? 🔢', type: 'escala', max: 5 },
      { id: 'quais_livres', label: 'Quais foram? 🍕', type: 'texto' },
      { id: 'foto_livre', label: 'Foto da refeição (opcional) 📸', type: 'foto' },
      { id: 'sentimento_pos_livre', label: 'Como se sentiu depois? 💭', type: 'texto' },
    ] : []),
    { id: 'energia', label: 'Energia na semana ⚡', type: 'selecao', options: ['Baixa', 'Média', 'Alta'] },
    { id: 'humor', label: 'Humor na semana 😄', type: 'selecao', options: ['Ruim', 'Ok', 'Bom', 'Ótimo'] },
    { id: 'humor_afetou', label: 'O humor afetou a comida? 🧠', type: 'selecao', options: ['Sim', 'Um pouco', 'Não'] },
    ...(respostas.humor_afetou === 'Sim' || respostas.humor_afetou === 'Um pouco' ? [
        { id: 'como_afetou', label: 'Como afetou? 📝', type: 'texto' }
    ] : []),
    { id: 'extra', label: 'Recado para Gabs ✉️', sub: 'Algo importante?', type: 'texto' }
  ];

  const proximoOuEnviar = () => {
    if (currentStep < PERGUNTAS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      enviarCheckin(respostas);
    }
  };

  const handleResposta = (id: string, valor: any, autoAdvance: boolean = true) => {
    const novasRespostas = { ...respostas, [id]: valor };
    setRespostas(novasRespostas);
    if (autoAdvance) {
      setTimeout(() => {
        if (currentStep < PERGUNTAS.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          enviarCheckin(novasRespostas);
        }
      }, 300);
    }
  };

  const enviarCheckin = async (finalData: any) => {
  if (loading) return;
  setLoading(true);

  try {
    const user = auth.currentUser;
    if (!user) return;

    // Salva no Firestore
    await setDoc(doc(db, "pacientes", user.uid, "checkins", semanaAtual), {
      ...finalData,
      data_envio: serverTimestamp(),
      semana: semanaAtual
    });

    await updateDoc(doc(db, "pacientes", user.uid), {
      ultima_semana_respondida: semanaAtual
    });

    // --- CORREÇÃO AQUI ---
    if (Platform.OS === 'web') {
      // No Web, evite o Alert.alert do RN para fluxos de navegação
      window.alert("Sucesso! A Gab recebeu suas respostas 🌿");
      
      // Use um pequeno delay para garantir que o estado do Firebase sincronizou
      setTimeout(() => {
        router.replace('/home');
      }, 100);
      
    } else {
      Alert.alert("Sucesso!", "A Gab recebeu suas respostas 🌿", [
        { text: "OK", onPress: () => router.replace('/home') }
      ]);
    }

  } catch (e) { 
    console.error("Erro ao enviar:", e);
    // No Web, use alert nativo para garantir visibilidade
    if (Platform.OS === 'web') window.alert("Erro ao enviar. Verifique sua conexão.");
    else Alert.alert("Erro", "Falha ao enviar."); 
  } finally { 
    setLoading(false); 
  }
};

  if (verificando) return <View style={styles.center}><ActivityIndicator size="large" color="#26A69A" /></View>;

  const p = PERGUNTAS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${((currentStep + 1) / PERGUNTAS.length) * 100}%`}]} />
        </View>
        
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{p?.label}</Text>
          {p?.sub && <Text style={styles.subText}>{p.sub}</Text>}

          {p?.type === 'escala' && (
            <View style={styles.optionsGrid}>
              {Array.from({length: p.max + 1}).map((_, i) => (
                <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleResposta(p.id, i)}>
                  <Text style={styles.optionText}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {p?.type === 'selecao' && (
            <View style={{gap: 12}}>
              {p.options?.map((opt: string) => (
                <TouchableOpacity key={opt} style={styles.selectBtn} onPress={() => handleResposta(p.id, opt)}>
                  <Text style={styles.selectText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {p?.type === 'slider' && (
            <View style={styles.center}>
              <Text style={styles.sliderVal}>{respostas[p.id] || 0}L</Text>
              <Slider
                style={{width: '100%', height: 80}}
                minimumValue={0} maximumValue={p.max} step={0.5}
                minimumTrackTintColor="#26A69A" thumbTintColor="#00392D"
                value={respostas[p.id] || 0}
                onValueChange={v => setRespostas({...respostas, [p.id]: v})}
              />
              <TouchableOpacity style={styles.nextBtn} onPress={proximoOuEnviar}>
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}

          {(p?.type === 'texto' || p?.type === 'texto_curto') && (
            <View>
              <TextInput 
                style={p.type === 'texto' ? styles.inputArea : styles.input} 
                multiline={p.type === 'texto'} value={respostas[p.id] || ''}
                onChangeText={t => setRespostas({...respostas, [p.id]: t})}
                placeholder="Escreva aqui..."
              />
              <TouchableOpacity 
                style={[styles.nextBtn, loading && {opacity: 0.7}]} 
                onPress={proximoOuEnviar}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>
                  {currentStep === PERGUNTAS.length - 1 ? "Finalizar Check-in" : "Continuar"}
                </Text>}
              </TouchableOpacity>
            </View>
          )}

          {p?.type === 'foto' && (
  <View style={styles.center}>
    {respostas.foto_livre && <Image source={{uri: respostas.foto_livre}} style={styles.previewImg} />}
    
    <TouchableOpacity 
      style={styles.btnSec} 
      disabled={uploadingImage} 
      onPress={async () => {
        let result = await ImagePicker.launchImageLibraryAsync({ 
          allowsEditing: true, 
          quality: 0.5 
        });

        if (!result.canceled) {
          setUploadingImage(true);
          try {
            const formData = new FormData();
            const imageUri = result.assets[0].uri;

            if (Platform.OS === 'web') {
              // CORREÇÃO PARA WEB: Converter URI em Blob real
              const response = await fetch(imageUri);
              const blob = await response.blob();
              formData.append('file', blob);
            } else {
              // MANTÉM PARA NATIVO (iOS/Android)
              formData.append('file', { 
                uri: imageUri, 
                type: 'image/jpeg', 
                name: 'checkin.jpg' 
              } as any);
            }

            formData.append('upload_preset', UPLOAD_PRESET);

            const res = await fetch(CLOUDINARY_URL, { 
              method: 'POST', 
              body: formData 
            });

            const data = await res.json();
            
            if (data.secure_url) {
              handleResposta('foto_livre', data.secure_url, true);
            } else {
              throw new Error("Falha no Cloudinary");
            }

          } catch (err) {
            console.error("Erro upload:", err);
            if (Platform.OS === 'web') window.alert("Erro ao subir imagem.");
            else Alert.alert("Erro", "Falha ao subir imagem.");
          } finally {
            setUploadingImage(false);
          }
        }
      }}
    >
      {uploadingImage ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.btnSecText}>Subir Foto</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity style={{marginTop: 20}} onPress={proximoOuEnviar}>
      <Text style={{color: '#26A69A'}}>Pular por enquanto</Text>
    </TouchableOpacity>
  </View>
)}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF9F4' },
  progressBar: { height: 8, backgroundColor: '#B2DFDB' },
  progressFill: { height: '100%', backgroundColor: '#26A69A' },
  content: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  label: { fontSize: 26, fontWeight: 'bold', color: '#00392D' },
  subText: { fontSize: 14, color: '#558B7F', marginBottom: 20 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  optionBtn: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B2DFDB' },
  optionText: { fontSize: 18, fontWeight: 'bold', color: '#26A69A' },
  selectBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#B2DFDB' },
  selectText: { fontSize: 16, color: '#00392D', textAlign: 'center' },
  sliderVal: { fontSize: 50, fontWeight: 'bold', color: '#26A69A' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#B2DFDB', color: '#000' },
  inputArea: { backgroundColor: '#fff', borderRadius: 12, padding: 15, fontSize: 16, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#B2DFDB', color: '#000' },
  nextBtn: { backgroundColor: '#26A69A', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  nextBtnText: { color: '#fff', fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnSec: { backgroundColor: '#00392D', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  btnSecText: { color: '#fff', fontWeight: 'bold' },
  previewImg: { width: 150, height: 150, borderRadius: 15, marginBottom: 15 }
});