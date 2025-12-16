// src/screens/OpcoesScreen.jsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// ⭐️ IMPORTAÇÃO FLUX: Ações do Utilizador para o Logout ⭐️
import { UserActions } from '../actions/UserActions';

const OpcoesScreen = ({ navigation }) => {

    const handleLogout = () => {
        // Confirmação (opcional, mas recomendada)
        Alert.alert(
            "Terminar Sessão",
            "Tem a certeza que deseja sair?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Sair",
                    onPress: () => {
                        // 1. Dispara a Ação FLUX de Logout
                        UserActions.logout();

                        // O AuthStore irá limpar o Async/State. O App.jsx irá redirecionar.
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>O que deseja fazer? 🐾</Text>
            <Text style={styles.subtitle}>Escolha o seu destino na PetMatch.</Text>

            {/* Opção 1: Feed de Animais para Adoção */}
            <TouchableOpacity
                style={[styles.button, styles.adoptionButton]}
                onPress={() => navigation.navigate('PetList')}
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
                <Text style={styles.buttonSubText}>Reveja os animais que curtiu.</Text>
            </TouchableOpacity>

            {/* ----------------------------------------------------- */}
            {/* ⭐️ RODAPÉ E BOTÃO TERMINAR SESSÃO ⭐️ */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>
                        Terminar Sessão
                    </Text>
                </TouchableOpacity>
            </View>
            {/* ----------------------------------------------------- */}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        backgroundColor: '#f8f8f8',
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

    // --- ESTILOS DO RODAPÉ E BOTÃO DE LOGOUT ---
    footer: {
        // Usa auto-margin para empurrar o conteúdo para o fundo
        marginTop: 'auto',
        paddingTop: 15,
        alignItems: 'center',
        // Adiciona uma pequena borda para separar visualmente
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    logoutButton: {
        backgroundColor: '#FF69B4', // Cor destacada para Logout
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
        // Estilo de sombra para dar relevo
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OpcoesScreen;