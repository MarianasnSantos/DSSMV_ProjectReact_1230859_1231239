

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';

// IMPORTAÇÕES FLUX
import AuthStore from '../stores/AuthStore'; // O Store que mantém o estado de login/registo
import { UserActions } from '../actions/UserActions'; // A Action que dispara o registo

// Hook Customizado para integração com o AuthStore (reutilizado do LoginScreen)
function useAuthStoreState() {
    const [state, setState] = useState(AuthStore.getState());

    useEffect(() => {
        const handleChange = () => {
            setState(AuthStore.getState());
        };
        AuthStore.addChangeListener(handleChange);
        return () => {
            AuthStore.removeChangeListener(handleChange);
        };
    }, []);
    return state;
}


// ⚠️ Removemos a interface Props e a tipagem React.FC
const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');

    // ✅ Obtemos o estado global do Store (incluindo loading e error)
    const { loading, error, isLoggedIn } = useAuthStoreState();

    // --- Função de Validação (Mantida localmente) ---
    const validateUsername = (input) => {
        // Remove espaços e verifica se já está em minúsculas
        if (input.includes(' ') || input !== input.toLowerCase()) {
            return false;
        }
        return true;
    };

    // ------------------------------------------------------------------
    // Efeito para REAGIR ao sucesso ou falha do Store
    // ------------------------------------------------------------------
    useEffect(() => {
        if (error) {
            // Reage ao erro vindo do Store
            Alert.alert("Erro de Registo", error);
        }

        if (isLoggedIn) {
            // Se o registo foi um sucesso e o utilizador foi logado automaticamente
            Alert.alert("Sucesso", `Bem-vindo(a), ${username}! Registo concluído.`);
            navigation.navigate('Login'); // Redireciona para o Login
        }
    }, [error, isLoggedIn]); // Dependências do estado do Store

    // --- Função Principal de Registo (Disparando a Action) ---
    const handleRegister = async () => {
        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            Alert.alert("Erro", "Por favor, preencha o nome de utilizador.");
            return;
        }

        if (!validateUsername(trimmedUsername)) {
            Alert.alert("Erro", "O nome de utilizador deve ser apenas em minúsculas e sem espaços.");
            return;
        }

        // ✅ Ação Flux: Dispara o processo de registo.
        // A lógica de API, loading e try/catch está AGORA no UserActions/AuthStore.
        UserActions.register({ username: trimmedUsername });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Criar Conta PetMatch 🐾</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome de Utilizador (só minúsculas, sem espaços)"
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase())} // Normaliza para minúsculas
                autoCapitalize="none"
                editable={!loading} // Usa o estado 'loading' do Store
            />

            <Button
                title={loading ? "A registar..." : "Registar"}
                onPress={handleRegister}
                disabled={loading}
                color="#f3b4b4"
            />
            {loading && <ActivityIndicator size="small" color="#f3b4b4" style={{ marginTop: 10 }} />}

            <Button
                title="Voltar ao Login"
                onPress={() => navigation.goBack()}
                color="#ccc"
                disabled={loading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
    title: { fontSize: 28, marginBottom: 20, textAlign: 'center', fontWeight: 'bold', color: '#f3b4b4' },
    input: { height: 50, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingHorizontal: 10, borderRadius: 8 },
});

export default RegisterScreen;