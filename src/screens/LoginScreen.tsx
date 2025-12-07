import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { User } from '../model/User';
// ✅ Importa a função de autenticação real do seu serviço
import { authenticateUser } from '../services/AuthService';

interface LoginScreenProps {
    /** Função chamada após o login ser bem-sucedido, passando o objeto de utilizador. */
    onLoginSuccess: (user: User) => void;
    /** Função para navegar para a tela de Registo. */
    onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
    // Estado apenas para o username
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username) {
            Alert.alert('Erro', 'Por favor, preencha o nome de utilizador.');
            return;
        }

        setIsLoading(true);
        try {
            // ✅ Chama o serviço para verificar se o utilizador existe
            const user = await authenticateUser(username);

            if (user) {
                // Sucesso! Chama o callback que está no App.tsx para mudar o estado
                onLoginSuccess(user);
            } else {
                // Utilizador não encontrado na base de dados
                Alert.alert('Erro de Login', 'Nome de utilizador inválido ou não registado.');
            }
        } catch (error: any) {
            // Erro de comunicação ou erro HTTP
            console.error("Erro no login:", error);
            Alert.alert('Erro de Conexão', error.message || 'Não foi possível conectar-se ao servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bem-vindo! 🐾</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome de Utilizador"
                keyboardType="default"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
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

            <TouchableOpacity
                style={styles.linkButton}
                onPress={onNavigateToRegister}
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