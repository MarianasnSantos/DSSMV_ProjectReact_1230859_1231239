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
                headerShown: false,
                tabBarActiveTintColor: '#e91e63',
            }}
        >
            <Tab.Screen
                name="Feed"
                component={AnimalsFeedScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (

                        <Ionicons name="paw" size={size} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Explorar"
                component={ExploreScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        // icone de busca
                        <Ionicons name="search" size={size} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Favoritos"
                component={FavoriteScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        // icone de coração para os favoritos
                        <Ionicons name="heart" size={size} color={color} />
                    )
                }}
            />
        </Tab.Navigator>
    );
}