import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

// --- Flux & Stores ---
import AuthStore from '../stores/AuthStore';
import { UserActions } from '../actions/UserActions';

// --- Ecrãs ---
import OpcoesScreen from '../screens/OpcoesScreen';
import AnimalsFeedScreen from '../screens/AnimalsFeedScreen';
import ExploreScreen from '../screens/ExploreScreen';
import HomeScreen from '../screens/HomeScreen';
import AddAnimalScreen from "../screens/AddAnimalScreen";
import FavoritesScreen from '../screens/FavoriteScreen';

const MainStack = createStackNavigator();

const MainNavigator = () => {
    // 1. Estado local para refletir o utilizador atual no Header
    const [user, setUser] = useState(AuthStore.getState().user);

    // 2. Listener para atualizar o Header se o nome mudar ou houver logout
    useEffect(() => {
        const handleChange = () => setUser(AuthStore.getState().user);
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeChangeListener(handleChange);
    }, []);

    // 3. Função de Logout com Confirmação
    const handleLogout = () => {
        Alert.alert("Sair", "Deseja terminar a sessão?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Sair",
                onPress: () => UserActions.logout(),
                style: 'destructive'
            }
        ]);
    };

    return (
        <MainStack.Navigator
            initialRouteName="Opcoes"
            screenOptions={{
                headerStyle: { backgroundColor: '#f3b4b4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <MainStack.Screen
                name="Opcoes"
                component={OpcoesScreen}
                options={{
                    // ⭐️ Título dinâmico à esquerda com o nome do user
                    headerTitle: user ? `Olá, ${user.username}` : 'Menu Principal',
                    headerTitleAlign: 'left',

                    // ⭐️ Botão de Terminar Sessão à direita
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.headerLogoutBtn}
                        >
                            <Text style={styles.logoutText}>Sair</Text>
                        </TouchableOpacity>
                    ),
                }}
            />

            <MainStack.Screen
                name="PetList"
                component={AnimalsFeedScreen}
                options={{ title: 'Animais para Adoção' }}
            />
            <MainStack.Screen
                name="ForumFeed"
                component={ExploreScreen}
                options={{ title: 'Comunidade' }}
            />
            <MainStack.Screen
                name="Favorites"
                component={FavoritesScreen}
                options={{ title: 'Meus Favoritos' }}
            />
            <MainStack.Screen
                name="AddAnimal"
                component={AddAnimalScreen}
                options={{ title: "Adicionar Animal" }}
            />
            <MainStack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Home' }}
            />
        </MainStack.Navigator>
    );
};

// Estilos para o botão de Logout no Header
const styles = StyleSheet.create({
    headerLogoutBtn: {
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.2)', // Efeito de transparência
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#fff'
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    }
});

export default MainNavigator;