import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';


export type MainStackParamList = {
    Home: undefined;
    // Poderia ter mais ecrãs aqui, como 'Settings', 'Profile', etc.
};

const MainStack = createStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
    return (
        <MainStack.Navigator
            // Configurações gerais da navegação principal
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#f3b4b4',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <MainStack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Início' }}
            />
        </MainStack.Navigator>
    );
};

export default MainNavigator;