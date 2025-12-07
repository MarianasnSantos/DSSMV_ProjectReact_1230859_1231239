// src/navigation/AuthNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';


type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// 2. Interface para as props que o AuthNavigator recebe do App.tsx
interface AuthNavigatorProps {
    // É recomendado importar o tipo User do seu modelo, mas 'any' funciona como fallback.
    onLoginSuccess: (user: any) => void;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onLoginSuccess }) => {
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
                        // Prop 1: Recebida do App.tsx para autenticar
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