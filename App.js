// App.jsx (ou App.js na raiz do seu projeto)

import React, { useEffect, useState } from 'react';
import {
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

// --- Hook Customizado para integração com o AuthStore ---
function useAuthStoreState() {
    const [state, setState] = useState(AuthStore.getState());

    useEffect(() => {
        const handleChange = () => {
            setState(AuthStore.getState());
        };
        AuthStore.addChangeListener(handleChange);
        return () => {
            // Usa o método corrigido do AuthStore
            AuthStore.removeChangeListener(handleChange);
        };
    }, []);

    return state;
}

const App = () => {

    // Obtemos o estado completo
    const { isLoggedIn, loading, user } = useAuthStoreState();

    // ⭐️ ESTADO PARA ESPERAR PELO ASYNCSTORAGE ⭐️
    const [isStoreInitialized, setIsStoreInitialized] = useState(false);

    useEffect(() => {
        // 1. CHAMA O MÉTODO PARA CARREGAR O ESTADO PERSISTENTE
        AuthStore.initialize();

        // 2. Timeout para garantir que o processo assíncrono do loadState()
        // termina antes de decidir o que renderizar.
        const initializeTimeout = setTimeout(() => {
            setIsStoreInitialized(true);
        }, 800); // 800ms é um valor seguro para esperar pelo AsyncStorage

        return () => clearTimeout(initializeTimeout);

    }, []);


    const isDarkMode = useColorScheme() === 'dark';

    // ⭐️ ECRÃ DE CARREGAMENTO INICIAL: Mostra se o Store ainda não carregou os dados ⭐️
    if (loading || !isStoreInitialized) {
        return (
            <SafeAreaProvider>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#f3b4b4" />
                    <Text style={styles.loadingText}>A carregar sessão...</Text>
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar barStyle={isDarkMode ? 'dark-content' : 'dark-content'} />

            <NavigationContainer>
                {/* ⭐️ DECISÃO DE NAVEGAÇÃO: Baseada no estado persistente ⭐️ */}
                {isLoggedIn && user ? (
                    // Se estiver logado E tiver os dados do utilizador
                    <MainNavigator/>
                ) : (
                    // Se não estiver logado (ou se os dados falharam), vai para o Login/Registo
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