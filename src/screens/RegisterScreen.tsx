import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';

// ✅ Importa a função de Registo do seu Serviço (o único local onde a API é chamada)
import { registerUser } from '../services/AuthService';

// --- DEFINIÇÃO DE TIPOS ---
interface RegisterScreenProps {
    navigation: {
        navigate: (screen: 'Login') => void; // Apenas para navegar para Login
        goBack: () => void;
    };
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Função de Validação ---
    const validateUsername = (input: string): boolean => {
        if (input.includes(' ') || input !== input.toLowerCase()) {
            return false;
        }
        return true;
    };

    // --- Função Principal de Registo ---
    const handleRegister = async () => {
        if (!username) {
            Alert.alert("Erro", "Por favor, preencha o nome de utilizador.");
            return;
        }

        if (!validateUsername(username)) {
            Alert.alert("Erro", "O nome de utilizador deve ser apenas em minúsculas e sem espaços.");
            return;
        }

        setLoading(true);

        try {
            // ✅ Chama a função de serviço
            await registerUser(username);

            Alert.alert("Sucesso", `Bem-vindo(a), ${username}! Registo concluído.`);
            navigation.navigate('Login'); // Redireciona para o Login

        } catch (error: any) {
            // Captura o erro detalhado do AuthService
            Alert.alert("Erro de Registo", error.message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Criar Conta PetMatch 🐾</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome de Utilizador (só minúsculas, sem espaços)"
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase().trim())}
                autoCapitalize="none"
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