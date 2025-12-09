import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import OpcoesScreen from '../screens/OpcoesScreen';
import AnimalsFeedScreen from '../screens/AnimalsFeedScreen';

export type MainStackParamList = {
    Opcoes: undefined;   // Ecrã inicial
    PetList: undefined;  // Lista de animais para adoção
    ForumFeed: undefined;
    Home: undefined;
};

const MainStack = createStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
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
                component={AnimalsFeedScreen}   // <-- ALTERADO AQUI
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
