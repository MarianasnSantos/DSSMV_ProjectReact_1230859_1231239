// src/navigation/MainNavigator.jsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import OpcoesScreen from '../screens/OpcoesScreen';
import AnimalsFeedScreen from '../screens/AnimalsFeedScreen';
import ExploreScreen from '../screens/ExploreScreen';
import HomeScreen from '../screens/HomeScreen';
import AddAnimalScreen from "../screens/AddAnimalScreen";

const MainStack = createStackNavigator();

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

            {/* FEED COMUNIDADE */}
            <MainStack.Screen
                name="ForumFeed"
                component={ExploreScreen}
                options={{ title: 'Comunidade' }}
            />

            <MainStack.Screen
                name="AddAnimal"
                component={AddAnimalScreen}
                options={{ title: "Adicionar Animal" }}
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
