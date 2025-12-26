import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from "../styles/theme";

const OpcoesScreen = ({ navigation }) => {

    return (
        <View style={styles.container}>
            <Text style={styles.title}>O que deseja fazer? 🐾</Text>
            <Text style={styles.subtitle}>Escolha o seu destino na PetMatch.</Text>

            {/* Opção 1: Feed de Animais */}
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
                onPress={() => navigation.navigate('Explore')}
            >
                <Text style={styles.buttonText}>💬 Comunidade e Partilha</Text>
                <Text style={styles.buttonSubText}>Partilhe dicas e converse com outros.</Text>
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
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.colors.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginBottom: 40,
    },
    button: {
        padding: 20,
        borderRadius: 16,
        marginVertical: 10,
        alignItems: 'flex-start',
        elevation: 4,
        // Sombra Rosa
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },

    // Botão 1
    adoptionButton: {
        backgroundColor: theme.colors.primary,
    },

    // Botão 2
    forumButton: {
        backgroundColor: theme.colors.secondary,
    },

    // Botão 3
    favoritesButton: {
        backgroundColor: '#FF9EB5',

    },

    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.white,
        marginBottom: 5,
    },
    buttonSubText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.95)',
    },
});

export default OpcoesScreen;