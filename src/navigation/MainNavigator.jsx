// src/navigation/MainNavigator.jsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import OpcoesScreen from '../screens/OpcoesScreen';
import AnimalsFeedScreen from '../screens/AnimalsFeedScreen';

// A tipagem 'MainStackParamList' é removida, 
// o objeto MainStack é criado sem tipos explícitos.
const MainStack = createStackNavigator();

// A tipagem React.FC é removida.
const MainNavigator = () => {
    return (
        <MainStack.Navigator
            initialRouteName="Opcoes"
            screenOptions={{
                headerStyle: { backgroundColor: '#f3b4b4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            {/* MENU PRINCIPAL */}
            <MainStack.Screen
                name="Opcoes"
                component={OpcoesScreen}
                options={{ title: 'Menu Principal' }}
            />

            {/* FEED DE ANIMAIS */}
            <MainStack.Screen
                name="PetList"
                component={AnimalsFeedScreen}
                options={{ title: 'Animais para Adoção' }}
            />

            {/* FUTURO FÓRUM */}
            <MainStack.Screen
                name="ForumFeed"
                component={HomeScreen}
                options={{ title: 'Comunidade' }}
            />

            {/* HOME (placeholder) */}
            <MainStack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Home' }}
            />
        </MainStack.Navigator>
    );
};

export default MainNavigator;