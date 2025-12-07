// src/screens/LoginScreen.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet, // <-- CORREÇÃO 1: Importar StyleSheet
    Alert,
    ActivityIndicator // Adicionado para UX
} from 'react-native';

import { User } from '../model/User'; // <-- CORREÇÃO 2: Usa 'model' (singular)
import { loginUser } from '../services/UserService';

interface LoginScreenProps {
    onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim()) {
            Alert.alert('Erro', 'Por favor, insira o nome de utilizador.');
            return;
        }

        setIsLoading(true);

        try {
            // Chama o serviço apenas com o username
            const user = await loginUser(username);

            if (user) {
                onLoginSuccess(user);
            } else {
                // Falha no login (usuário não encontrado)
                Alert.alert('Erro', 'Nome de utilizador não encontrado. Tente novamente.');
            }
        } catch (error) {
            // Erro de rede/API
            Alert.alert('Erro', 'Falha na comunicação com o servidor. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🐾 Bem-vindo ao Pet Match!</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome de Utilizador"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading} // Desabilita o input durante o carregamento
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Entrar</Text>
                )}
            </TouchableOpacity>

        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 50,
        color: '#f3b4b4', // Cor de destaque para o Pet Match
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#fff',
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    button: {
        backgroundColor: '#f3b4b4', // Cor do botão
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default LoginScreen;