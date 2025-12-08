import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// Tipagem de navegação para o MainNavigator
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator'; // Importa a tipagem das rotas

// Definindo as props que este ecrã recebe do MainNavigator
type OpcoesScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Opcoes'>;

interface OpcoesScreenProps {
    navigation: OpcoesScreenNavigationProp;
}

const OpcoesScreen: React.FC<OpcoesScreenProps> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>O que deseja fazer? 🐾</Text>
            <Text style={styles.subtitle}>Escolha o seu destino na PetMatch.</Text>

            {/* Opção 1: Módulo de Adoção (CRUD de Pets) */}
            <TouchableOpacity
                style={[styles.button, styles.adoptionButton]}
                onPress={() => navigation.navigate('PetList')} // ✅ Rota para a lista de animais
            >
                <Text style={styles.buttonText}>🐶 Ver Animais para Adoção</Text>
                <Text style={styles.buttonSubText}>Pesquise, filtre e adote o seu novo amigo.</Text>
            </TouchableOpacity>

            {/* Opção 2: Módulo de Comunidade (CRUD de Posts) */}
            <TouchableOpacity
                style={[styles.button, styles.forumButton]}
                onPress={() => navigation.navigate('ForumFeed')} // ✅ Rota para o Fórum
            >
                <Text style={styles.buttonText}>💬 Comunidade e Partilha</Text>
                <Text style={styles.buttonSubText}>Partilhe informações e converse com outros tutores.</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 40,
    },
    button: {
        padding: 20,
        borderRadius: 12,
        marginVertical: 10,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    adoptionButton: {
        backgroundColor: '#f3b4b4', // Rosa mais escuro (cor PetMatch)
    },
    forumButton: {
        backgroundColor: '#9be3ff', // Azul suave (cor de contraste para o fórum)
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    buttonSubText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
});

export default OpcoesScreen;