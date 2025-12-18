// src/navigation/MainNavigator.jsx

import React from 'react';
import { Text, TouchableOpacity, Alert, StyleSheet, View } from 'react-native'; // Adicionado
import { createStackNavigator } from '@react-navigation/stack';

import OpcoesScreen from '../screens/OpcoesScreen';
import AnimalsFeedScreen from '../screens/AnimalsFeedScreen';
import ExploreScreen from '../screens/ExploreScreen';
import HomeScreen from '../screens/HomeScreen';
import AddAnimalScreen from "../screens/AddAnimalScreen";
import FavoritesScreen from '../screens/FavoriteScreen';

// ⭐️ IMPORTAÇÕES PARA O HEADER ⭐️
import AuthStore from '../stores/AuthStore';
import { UserActions } from '../actions/UserActions';

const MainStack = createStackNavigator();

const MainNavigator = () => {
    // Pegamos o utilizador atual do Store
    const { user } = AuthStore.getState();

    const handleLogout = () => {
        Alert.alert("Terminar Sessão", "Deseja terminar a sessão?", [
            { text: "Não", style: "cancel" },
            { text: "Terminar sessão", onPress: () => UserActions.logout(), style: 'destructive' }
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
                    // ⭐️ TÍTULO À ESQUERDA (NOME DO USER)
                    headerTitle: `Olá, ${user?.username || 'User'}`,
                    headerTitleAlign: 'left',

                    // ⭐️ BOTÃO À DIREITA (LOGOUT)
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.headerLogoutBtn}
                        >
                            <Text style={styles.logoutText}>Terminar Sessão</Text>
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Restantes ecrãs mantêm-se iguais */}
            <MainStack.Screen name="PetList" component={AnimalsFeedScreen} options={{ title: 'Animais para Adoção' }} />
            <MainStack.Screen name="ForumFeed" component={ExploreScreen} options={{ title: 'Comunidade' }} />
            <MainStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Meus Favoritos' }} />
            <MainStack.Screen name="AddAnimal" component={AddAnimalScreen} options={{ title: "Adicionar Animal" }} />
            <MainStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        </MainStack.Navigator>
    );
};

// Estilos para o botão no header
const styles = StyleSheet.create({
    headerLogoutBtn: {
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.2)', // Fundo subtil
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#fff'
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    }
});

export default MainNavigator;