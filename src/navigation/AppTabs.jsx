// src/navigation/AppTabs.jsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Importa os componentes de tela
import AnimalsFeedScreen from "../screens/AnimalsFeedScreen";
import ExploreScreen from "../screens/ExploreScreen";
import FavoriteScreen from "../screens/FavoriteScreen";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                // Desativa o cabeçalho para usar o layout customizado nas telas
                headerShown: false,
                tabBarActiveTintColor: '#e91e63', // Cor do ícone ativo (Ex: Vermelho do PetMatch)
            }}
        >
            <Tab.Screen
                name="Feed"
                component={AnimalsFeedScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        // Ícone de patinha para o feed principal
                        <Ionicons name="paw" size={size} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Explorar"
                component={ExploreScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        // Ícone de busca
                        <Ionicons name="search" size={size} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Favoritos"
                component={FavoriteScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        // Ícone de coração para os favoritos (pets curtidos)
                        <Ionicons name="heart" size={size} color={color} />
                    )
                }}
            />
        </Tab.Navigator>
    );
}