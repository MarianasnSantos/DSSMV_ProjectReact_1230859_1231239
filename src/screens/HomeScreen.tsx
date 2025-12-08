import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bem-vindo!🐾</Text>
            <Text style={styles.subtitle}>Está na sua Área Principal (Autenticada).</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
});

export default HomeScreen;