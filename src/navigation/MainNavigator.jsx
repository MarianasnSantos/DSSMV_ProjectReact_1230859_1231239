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

// ⚠️ CORREÇÃO AQUI: Tem de ser '../screens/' e não './screens/'
import CreatePostScreen from "../screens/CreatePostScreen";

const MainStack = createStackNavigator();

const MainNavigator = () => {
    const [user, setUser] = useState(AuthStore.getState().user);

    useEffect(() => {
        const handleChange = () => setUser(AuthStore.getState().user);
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeChangeListener(handleChange);
    }, []);

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
                    headerTitle: user ? `Olá, ${user.username}` : 'Menu Principal',
                    headerTitleAlign: 'left',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutBtn}>
                            <Text style={styles.logoutText}>Sair</Text>
                        </TouchableOpacity>
                    ),
                }}
            />

            <MainStack.Screen
                name="AnimalsFeed"
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

            {}
            <MainStack.Screen
                name="CreatePost"
                component={CreatePostScreen}
                options={{ title: "Nova Publicação" }}
            />
            {/* ------------------------------------------- */}

            <MainStack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Home' }}
            />
        </MainStack.Navigator>
    );
};

const styles = StyleSheet.create({
    headerLogoutBtn: {
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
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