import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const OpcoesScreen = ({ navigation }) => {

    return (
        <View style={styles.container}>
            <Text style={styles.title}>O que deseja fazer? 🐾</Text>
            <Text style={styles.subtitle}>Escolha o seu destino na PetMatch.</Text>

            {/* Opção 1: Feed de Animais para Adoção */}
            <TouchableOpacity
                style={[styles.button, styles.adoptionButton]}

                onPress={() => navigation.navigate('AnimalsFeed')}
            >
                <Text style={styles.buttonText}>🐶 Ver Animais para Adoção</Text>
                <Text style={styles.buttonSubText}>Conheça os patudos à espera de um lar.</Text>
            </TouchableOpacity>

            {/* Opção 2: Comunidade */}
            <TouchableOpacity
                style={[styles.button, styles.forumButton]}
                onPress={() => navigation.navigate('ForumFeed')}
            >
                <Text style={styles.buttonText}>💬 Comunidade e Partilha</Text>
                <Text style={styles.buttonSubText}>Partilhe dicas e converse com outros tutores.</Text>
            </TouchableOpacity>

            {/* Opção 3: Favoritos */}
            <TouchableOpacity
                style={[styles.button, styles.favoritesButton]}
                onPress={() => navigation.navigate('Favorites')}
            >
                <Text style={styles.buttonText}>❤️ Favoritos</Text>
                <Text style={styles.buttonSubText}>Reveja os animais que gostou.</Text>
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
        marginBottom: 10,
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
        backgroundColor: '#f3b4b4',
    },
    forumButton: {
        backgroundColor: '#9be3ff',
    },
    favoritesButton: {
        backgroundColor: 'rgba(200, 162, 200, 0.93)',
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