import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

// IMPORTAÇÕES FLUX
import AuthStore from '../stores/AuthStore';
import { UserActions } from '../actions/UserActions';

import { theme } from '../styles/theme';

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

const LoginScreen = ({ onLoginSuccess, onNavigateToRegister }) => {
    const [username, setUsername] = useState('');

    const { loading, error, isLoggedIn, user } = useAuthStoreState();

    useEffect(() => {
        if (error) {
            Alert.alert('Erro de Login', error);
            setUsername('');
        }
        if (isLoggedIn && user) {
            if (onLoginSuccess) onLoginSuccess(user);
        }
    }, [error, isLoggedIn, user, onLoginSuccess]);

    const handleLogin = () => {
        if (!username) {
            Alert.alert('Erro', 'Por favor, preencha o nome de utilizador.');
            return;
        }
        UserActions.login({ username });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bem-vindo! 🐾</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome de Utilizador"
                placeholderTextColor={theme.colors.textPlaceholder}
                keyboardType="default"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
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
        padding: 30,
        backgroundColor: theme.colors.background,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: theme.colors.primary,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 40,
        textAlign: 'center',
        color: theme.colors.textSecondary,
    },
    input: {
        height: 50,
        backgroundColor: theme.colors.inputBackground,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        color: theme.colors.textPrimary,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        height: 50,
        justifyContent: 'center',
        elevation: 3,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 10,
    },
    linkText: {
        color: theme.colors.primary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;