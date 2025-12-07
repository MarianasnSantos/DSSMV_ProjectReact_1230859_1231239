// App.tsx

import React, { useState } from 'react';
import {
    SafeAreaView,
    Text,
    StyleSheet,
    StatusBar,
    useColorScheme
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importe a tela de Login (View) e o Modelo de Usuário (Model)
import LoginScreen from './src/screens/LoginScreen';
import { User } from './src/model/User';

const App: React.FC = () => {
    // 1. Estados para gerenciar a autenticação e o usuário
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null); // Tipado com a interface User

    const isDarkMode = useColorScheme() === 'dark';

    // 2. Função de callback (Controller)
    // É chamada pelo LoginScreen ao fazer o login com sucesso
    const handleSuccessfulLogin = (user: User) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
    };

    // Exemplo de tela principal que será exibida após o login
    const MainAppContent = () => (
        <SafeAreaView style={styles.mainContainer}>
            <Text style={styles.mainText}>✅ Logado com sucesso!</Text>
            {currentUser && (
                <Text style={styles.subText}>Bem-vindo ao Pet Match, {currentUser.username}!</Text>
            )}
            <Text style={styles.subText}>Substitua este conteúdo pela navegação principal do seu app.</Text>
        </SafeAreaView>
    );

    return (
        <SafeAreaProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            {/* 3. Renderização Condicional (O coração do Controller de autenticação) */}
            {isLoggedIn ? (
                <MainAppContent />
            ) : (
                // Passa a função de callback para o LoginScreen
                <LoginScreen onLoginSuccess={handleSuccessfulLogin} />
            )}
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0f7fa',
    },
    mainText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00796b',
        marginBottom: 10,
        textAlign: 'center',
    },
    subText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginHorizontal: 20,
    }
});

export default App;