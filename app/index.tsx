import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from '../firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';

const DEFAULT_AVATAR = 'https://api.dicebear.com/8.x/avataaars-neutral/png?seed=placeholder';

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [form, setForm] = useState({
    nome: '', username: '', nascimento: new Date(), email: '', senha: '', genero: '', avatar: DEFAULT_AVATAR
  });
  const [dataTexto, setDataTexto] = useState('Selecionar Data de Nascimento');

  // FUNÇÃO PARA ALERTAS HÍBRIDOS (WEB + NATIVO)
  const notify = (title: string, message: string, onPress?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (onPress) onPress();
    } else {
      Alert.alert(title, message, onPress ? [{ text: "OK", onPress }] : undefined);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        router.replace('/home'); 
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (params.avatarEscolhido) {
      setIsLogin(false); 
      setForm(prev => ({ ...prev, avatar: String(params.avatarEscolhido).replace('.svg', '.png') }));
    }
  }, [params.avatarEscolhido]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    
    if (event.type === "set" && selectedDate) {
      setForm({ ...form, nascimento: selectedDate });
      const dia = selectedDate.getDate().toString().padStart(2, '0');
      const mes = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const ano = selectedDate.getFullYear();
      setDataTexto(`${dia}/${mes}/${ano}`);
    } else {
      setShowDatePicker(false);
    }
  };

  const handleAuth = async () => {
    const emailLimpo = form.email.toLowerCase().trim();
    const senhaLimpa = form.senha.trim();

    if (!emailLimpo || !senhaLimpa) return notify("Erro", "E-mail e senha são obrigatórios.");

    setLoading(true);
    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
        
        if (!res.user.emailVerified) {
          notify("E-mail pendente", "Verifique seu e-mail para ativar sua conta.");
          await signOut(auth);
          setLoading(false);
          return;
        }

        await updateDoc(doc(db, "pacientes", res.user.uid), { emailVerificado: true });
        router.replace('/home'); 

      } else {
        if (!form.nome || !form.username || !form.genero || dataTexto === 'Selecionar Data de Nascimento') {
          setLoading(false);
          return notify("Erro", "Preencha todos os campos.");
        }

        const res = await createUserWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
        await sendEmailVerification(res.user);

        await setDoc(doc(db, "pacientes", res.user.uid), {
          nome: form.nome,
          username: form.username.toLowerCase().trim(),
          nascimento: dataTexto,
          genero: form.genero,
          email: emailLimpo,
          avatar: form.avatar,
          role: 'paciente',
          emailVerificado: false,
          criado_em: serverTimestamp()
        });

        notify("Sucesso!", "Verifique seu e-mail para ativar.", () => {
          setIsLogin(true);
        });
      }
    } catch (e: any) {
      notify("Atenção", "Erro ao processar. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {isLogin && (
          <Image 
            source={require('../assets/images/LOGOG_GABS_WOBG.png')} 
            style={styles.logoTopo} 
            resizeMode="contain"
          />
        )}
        <Text style={styles.title}>
          {isLogin ? (form.genero === 'M' ? 'Bem-vindo!' : 'Bem-vinda!') : 'Nova Conta'}
        </Text>
        
        {!isLogin && (
          <View style={{alignItems: 'center', width: '100%'}}>
            <Image key={form.avatar} source={{ uri: form.avatar }} style={styles.avatarPreview} />
            <TouchableOpacity onPress={() => router.push('/avatar')}>
                <Text style={styles.linkText}>Trocar Avatar</Text>
            </TouchableOpacity>

            <View style={styles.genderRow}>
              {['F', 'M'].map(g => (
                <TouchableOpacity 
                  key={g}
                  style={[styles.genderBtn, form.genero === g && styles.genderBtnActive]} 
                  onPress={() => setForm({...form, genero: g})}>
                  <Text style={{color: form.genero === g ? '#fff' : '#26A69A'}}>{g === 'F' ? 'Feminino' : 'Masculino'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput 
              placeholder="Nome" 
              placeholderTextColor="#999" 
              style={styles.input} 
              value={form.nome} 
              onChangeText={t => setForm({...form, nome: t})}
            />
            
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{
                  backgroundColor: '#fff',
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 15,
                  marginBottom: 10,
                  border: '1px solid #B2DFDB',
                  width: '100%',
                  height: 52,
                  fontSize: 16,
                  color: '#000',
                  boxSizing: 'border-box',
                  fontFamily: 'sans-serif',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none'
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if(val) {
                    const date = new Date(val + 'T12:00:00');
                    const dia = date.getDate().toString().padStart(2, '0');
                    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
                    const ano = date.getFullYear();
                    setDataTexto(`${dia}/${mes}/${ano}`);
                    setForm({ ...form, nascimento: date });
                  }
                }}
              />
            ) : (
              <>
                <TouchableOpacity style={styles.inputDate} onPress={() => setShowDatePicker(true)}>
                  <Text style={{color: dataTexto.includes('/') ? '#000' : '#999', fontSize: 16}}>{dataTexto}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : null}>
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity style={styles.doneButton} onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.doneButtonText}>Confirmar</Text>
                      </TouchableOpacity>
                    )}
                    <DateTimePicker
                      value={form.nascimento}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onChangeDate}
                      maximumDate={new Date()}
                      textColor="#000000"
                      accentColor="#26A69A"
                    />
                  </View>
                )}
              </>
            )}

            <TextInput 
              placeholder="Username" 
              placeholderTextColor="#999" 
              style={styles.input} 
              autoCapitalize="none" 
              value={form.username} 
              onChangeText={t => setForm({...form, username: t})}
            />
          </View>
        )}

        <TextInput 
          placeholder="E-mail" 
          placeholderTextColor="#999" 
          style={styles.input} 
          autoCapitalize="none" 
          keyboardType="email-address" 
          value={form.email} 
          onChangeText={t => setForm({...form, email: t})}
        />

        <TextInput 
          placeholder="Senha" 
          placeholderTextColor="#999" 
          style={styles.input} 
          secureTextEntry 
          value={form.senha} 
          onChangeText={t => setForm({...form, senha: t})}
          onSubmitEditing={handleAuth}
        />

        <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isLogin ? 'ENTRAR' : 'CADASTRAR'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20 }}>
          <Text style={styles.switchText}>{isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Login'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logoTopo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 10 },
  container: { flexGrow: 1, padding: 30, backgroundColor: '#EAF9F4', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#00392D', marginBottom: 20, textAlign: 'center' },
  avatarPreview: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', borderWidth: 2, borderColor: '#26A69A' },
  linkText: { color: '#26A69A', fontWeight: 'bold', marginVertical: 10 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  genderBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 15, borderWidth: 1, borderColor: '#26A69A' },
  genderBtnActive: { backgroundColor: '#26A69A' },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#B2DFDB', width: '100%', color: '#000' },
  inputDate: { backgroundColor: '#fff', padding: 16, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#B2DFDB', width: '100%', justifyContent: 'center' },
  mainBtn: { backgroundColor: '#26A69A', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { textAlign: 'center', color: '#00392D', fontWeight: '600' },
  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 15, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#B2DFDB' },
  doneButton: { alignItems: 'flex-end', padding: 10 },
  doneButtonText: { color: '#26A69A', fontWeight: 'bold', fontSize: 16 }
});