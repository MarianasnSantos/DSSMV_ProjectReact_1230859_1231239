import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

// IMPORTAÇÕES FLUX
import AuthStore from '../stores/AuthStore'; // O Store que mantém o estado de login
import { UserActions } from '../actions/UserActions'; // A Action que dispara a autenticação

// Hook Customizado para integração com o AuthStore
function useAuthStoreState() {
    // Estado inicializado com o estado atual do Store
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

// ⚠️ Removemos a interface Props e as tipagens de parâmetro
const LoginScreen = ({ onLoginSuccess, onNavigateToRegister }) => {
    // Mantemos apenas o estado local para o INPUT
    const [username, setUsername] = useState('');

    // ✅ Obtemos o estado global do Store
    const { loading, error, isLoggedIn, user } = useAuthStoreState();

    // ------------------------------------------------------------------
    // Efeito para REAGIR ao sucesso ou falha do Store
    // ------------------------------------------------------------------
    useEffect(() => {
        if (error) {
            // Reage ao erro vindo do Store
            Alert.alert('Erro de Login', error);
            // O Store já limpou o erro após o dispatch, mas limpamos o input
            setUsername('');
        }

        if (isLoggedIn && user) {
            // Reage ao sucesso vindo do Store e notifica o navegador raiz
            onLoginSuccess(user);
        }
    }, [error, isLoggedIn, user]); // Dependências do estado do Store

    const handleLogin = () => {
        if (!username) {
            Alert.alert('Erro', 'Por favor, preencha o nome de utilizador.');
            return;
        }

        // ✅ Ação Flux: Dispara o processo de login.
        // A lógica de API e loading está AGORA no UserActions/AuthStore.
        UserActions.login({ username });
    };

    return (
        <View style={styles.container}>
            {/* ... (Título e Subtítulo) */}
            <Text style={styles.title}>Bem-vindo! 🐾</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome de Utilizador"
                keyboardType="default"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                // Desabilitar input durante o carregamento
                editable={!loading}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading} // Usa o estado 'loading' do Store
            >
                {loading ? ( // Usa o estado 'loading' do Store
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Entrar</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.linkButton}
                onPress={onNavigateToRegister}
                disabled={loading}
            >
                <Text style={styles.linkText}>Não tem conta? Registe-se</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 40,
        textAlign: 'center',
        color: '#666',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#f3b4b4',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        height: 50,
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 10,
    },
    linkText: {
        color: '#f3b4b4',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;