import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // Opcional: para ícones bonitos

// Imports corrigidos conforme a tua lista de ficheiros:
import AnimalsFeedScreen from "../screens/AnimalsFeedScreen";
import ExploreScreen from "../screens/ExploreScreen";
import FavoriteScreen from "../screens/FavoriteScreen";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#e91e63', // Cor do ícone ativo
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
                        <Ionicons name="search" size={size} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Favoritos"
                component={FavoriteScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="heart" size={size} color={color} />
                    )
                }}
            />
        </Tab.Navigator>
    );
}