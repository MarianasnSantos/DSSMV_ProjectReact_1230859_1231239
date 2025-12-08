import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import OpcoesScreen from '../screens/OpcoesScreen';


export type MainStackParamList = {
    Opcoes: undefined; // O novo ecrã inicial
    PetList: undefined; // Rota da lista de adoção
    ForumFeed: undefined; // Rota do fórum
    Home: undefined; // Rota de placeholder
};
const MainStack = createStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
    return (
        <MainStack.Navigator
            initialRouteName="Opcoes"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#f3b4b4'},
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <MainStack.Screen
                name="Opcoes"
                component={OpcoesScreen}
                options={{ title: 'Menu Principal' }}
            />

            <MainStack.Screen name="PetList" component={HomeScreen} options={{ title: 'Animais para Adoção' }} />
            <MainStack.Screen name="ForumFeed" component={HomeScreen} options={{ title: 'Comunidade' }} />
            <MainStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        </MainStack.Navigator>
    );
};

export default MainNavigator;