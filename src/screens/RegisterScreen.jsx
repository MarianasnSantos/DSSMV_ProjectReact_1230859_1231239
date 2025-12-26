import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';

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

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');

    // Obtemos o estado global do Store
    const { loading, error, isLoggedIn } = useAuthStoreState();

    const validateUsername = (input) => {
        if (input.includes(' ') || input !== input.toLowerCase()) {
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (error) {
            Alert.alert("Erro de Registo", error);
        }

        if (isLoggedIn) {
            Alert.alert("Sucesso", `Bem-vindo(a), ${username}! Registo concluído.`);
            navigation.navigate('Login');
        }
    }, [error, isLoggedIn, navigation, username]);

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

        UserActions.register({ username: trimmedUsername });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Criar Conta 🐾</Text>
            <Text style={styles.subtitle}>Junta-te à comunidade PetMatch</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome de Utilizador (só minúsculas)"
                placeholderTextColor={theme.colors.textPlaceholder}
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase())}
                autoCapitalize="none"
                editable={!loading}
            />

            {/* Botão de Registo (Rosa Choque) */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.buttonText}>Registar</Text>
                )}
            </TouchableOpacity>

            {/* Botão Voltar (Link) */}
            <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
            >
                <Text style={styles.linkText}>Já tens conta? Voltar ao Login</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
        // Fundo Rosa Bebé
        backgroundColor: theme.colors.background
    },
    title: {
        fontSize: 32,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
        // Título Rosa Choque
        color: theme.colors.primary
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 40,
        textAlign: 'center',
        color: theme.colors.textSecondary,
    },
    input: {
        height: 50,
        // Input Branco com borda Rosa
        backgroundColor: theme.colors.inputBackground,
        borderColor: theme.colors.border,
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        color: theme.colors.textPrimary
    },
    button: {
        // Botão Rosa Choque Sólido
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        height: 50,
        justifyContent: 'center',
        // Sombra Rosa
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
        // Link Rosa Choque
        color: theme.colors.primary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});

export default RegisterScreen;