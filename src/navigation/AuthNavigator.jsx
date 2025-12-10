// src/navigation/AuthNavigator.jsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Componentes de tela
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// 1. A tipagem AuthStackParamList é removida
const AuthStack = createNativeStackNavigator();

// 2. A interface e a tipagem React.FC são removidas.
// As props são acessadas diretamente.
const AuthNavigator = ({ onLoginSuccess }) => {
    return (
        <AuthStack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false,
            }}
        >
            <AuthStack.Screen name="Login">
                {/* 3. Função de renderização para injetar as props necessárias */}
                {({ navigation }) => (
                    <LoginScreen
                        // Prop 1: Recebida da tela pai (App.js)
                        onLoginSuccess={onLoginSuccess}

                        // Prop 2: Usada para navegar para a próxima tela
                        onNavigateToRegister={() => navigation.navigate('Register')}
                    />
                )}
            </AuthStack.Screen>

            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
};

export default AuthNavigator;