import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 👇 IMPORTA O TEMA
import { theme } from "../styles/theme";

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bem-vindo! 🐾</Text>
            <Text style={styles.subtitle}>Está na sua Área Principal (Autenticada).</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // Fundo Rosa Bebé
        backgroundColor: theme.colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: theme.colors.primary,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
});

export default HomeScreen;