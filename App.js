import React, { useEffect, useState } from 'react';
import {
    Text,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

// Flux
import AuthStore from './src/stores/AuthStore';

import { theme } from './src/styles/theme';

function useAuthStoreState() {
    const [state, setState] = useState(AuthStore.getState());
    useEffect(() => {
        const handleChange = () => setState(AuthStore.getState());
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeChangeListener(handleChange);
    }, []);
    return state;
}

const App = () => {
    const { isLoggedIn, loading, user } = useAuthStoreState();
    const [isStoreInitialized, setIsStoreInitialized] = useState(false);

    useEffect(() => {
        AuthStore.initialize();
        const initializeTimeout = setTimeout(() => {
            setIsStoreInitialized(true);
        }, 800);
        return () => clearTimeout(initializeTimeout);
    }, []);

    // Ecrã de Carregamento
    if (loading || !isStoreInitialized) {
        return (
            <SafeAreaProvider>
                <View style={styles.loaderContainer}>
                    {/* Loader Rosa Choque */}
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>A carregar sessão...</Text>
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            {/*
                backgroundColor: Cor de fundo da barra da bateria
                barStyle: "light-content" põe os ícones (bateria, horas) a branco
            */}
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

            <NavigationContainer>
                {isLoggedIn && user ? (
                    <MainNavigator/>
                ) : (
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
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
    },
});

export default App;