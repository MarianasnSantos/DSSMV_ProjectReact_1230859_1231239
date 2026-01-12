// src/navigation/AuthNavigator.jsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const AuthStack = createNativeStackNavigator();


const AuthNavigator = ({ onLoginSuccess }) => {
    return (
        <AuthStack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false,
            }}
        >
            <AuthStack.Screen name="Login">
                {}
                {({ navigation }) => (
                    <LoginScreen

                        onLoginSuccess={onLoginSuccess}


                        onNavigateToRegister={() => navigation.navigate('Register')}
                    />
                )}
            </AuthStack.Screen>

            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
};

export default AuthNavigator;