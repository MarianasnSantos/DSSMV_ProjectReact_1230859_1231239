// App.jsx (ou App.js na raiz do seu projeto)

import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    Text,
    StyleSheet,
    StatusBar,
    useColorScheme,
    ActivityIndicator,
    View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importação crucial para usar a navegação
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

// ⭐️ IMPORTAÇÕES FLUX
import AuthStore from './src/stores/AuthStore';
import { UserActions } from './src/actions/UserActions';

// --- Hook Customizado para integração com o AuthStore ---
// (Removemos toda a tipagem TS)
function useAuthStoreState() {
    const [state, setState] = useState(AuthStore.getState());

    useEffect(() => {
        const handleChange = () => {
            setState(AuthStore.getState());
        };
        AuthStore.addChangeListener(handleChange);
        return () => {
            AuthStore.removeListener(handleChange); // removeListener é o método correto
        };
    }, []);

    return state;
}

const App = () => {
    // 1. Obtém o estado centralizado do Store (sem tipagem de retorno)
    const { isLoggedIn, loading, user } = useAuthStoreState();

    const isDarkMode = useColorScheme() === 'dark';

    // Se a aplicação estiver carregando a sessão ou processando o login
    if (loading) {
        return (
            <SafeAreaProvider>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#f3b4b4" />
                    <Text style={styles.loadingText}>A processar autenticação...</Text>
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar barStyle={isDarkMode ? 'dark-content' : 'dark-content'} />

            {/* ⭐️ Envolve a aplicação com o container de navegação */}
            <NavigationContainer>
                {/* Renderização Condicional baseada no estado do FLUX */}
                {isLoggedIn ? (
                    // Se logado, mostra o conteúdo principal
                    <MainNavigator/>
                ) : (
                    // Se não logado, mostra o navegador de autenticação
                    <AuthNavigator />
                )}
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
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