// src/screens/AnimalsFeedScreen.jsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Alert
} from "react-native";

// ⭐️ IMPORTAÇÃO DO ÍCONE (Necessário após a instalação via npm)
import Icon from 'react-native-vector-icons/FontAwesome';

// Importações Flux
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";

// --- Hook Customizado para integração com o Store ---
function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => { setState(PetStore.getState()); };
        PetStore.addChangeListener(handleChange);
        return () => { PetStore.removeListener(handleChange); };
    }, []);
    return state;
}

// --- Funções Auxiliares de Estado ---
const getAuthData = () => {
    // Obtém o user, favoritos e status de login do Store de Autenticação
    const { user, favorites, isLoggedIn } = AuthStore.getState();
    return {
        userId: user?._id,
        favorites: favorites || [], // Garante que é um array
        isLoggedIn
    };
};

const handleAdoption = (animalId) => {
    const { userId } = getAuthData();
    if (!userId) {
        Alert.alert("Erro de Autenticação", "Deve estar autenticado para iniciar o processo de adoção.");
        return;
    }
    // Dispara a Ação Flux
    PetActions.startAdoption(animalId, userId);
};


export default function AnimalsFeedScreen() {
    // ⭐️ Usando 'animals' para satisfazer o cache do TypeScript
    const { animals, loading, error, adoptionRequests } = usePetStoreState();

    // Obtemos a lista de favoritos
    const { favorites, isLoggedIn } = getAuthData();

    useEffect(() => {
        // Dispara a AÇÃO para iniciar o fluxo de procura de animais
        PetActions.loadAnimals();
    }, []);

    // --- Renderização Condicional ---
    if (loading) {
        return <ActivityIndicator size="large" color="#e91e63" style={styles.loader} />;
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: "red", fontSize: 16 }}>{error}</Text>
            </View>
        );
    }

    // --- Renderização do Ícone de Favoritos ---
    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;

        const isFavorite = favorites.includes(item.id);

        return (
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => PetActions.toggleFavorite(item.id)}
            >
                {/* Ícone de Coração - Cheio se favorito, Contorno caso contrário */}
                <Icon
                    name={isFavorite ? 'paw' : 'paw'}
                    size={28}
                    color={isFavorite ? '#ff5252' : '#cccccc'}
                />
            </TouchableOpacity>
        );
    };


    // --- Renderização do Botão de Adoção ---
    const renderAdoptionButton = (item) => {
        const adoptionStatus = adoptionRequests[item.id];
        let buttonText;
        let buttonStyle = styles.adoptButton;
        let isDisabled = false;

        switch (adoptionStatus) {
            case 'pending':
                buttonText = "PROCESSANDO...";
                isDisabled = true;
                buttonStyle = [styles.adoptButton, styles.pendingButton];
                break;
            case 'success':
                buttonText = "PEDIDO ENVIADO";
                isDisabled = true;
                buttonStyle = [styles.adoptButton, styles.successButton];
                break;
            case 'fail':
                buttonText = "TENTAR NOVAMENTE";
                buttonStyle = [styles.adoptButton, styles.failButton];
                break;
            default:
                buttonText = "ADOTAR";
                break;
        }

        return (
            <TouchableOpacity
                style={buttonStyle}
                onPress={() => handleAdoption(item.id)}
                disabled={isDisabled}
            >
                {adoptionStatus === 'pending' ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.adoptButtonText}>{buttonText}</Text>
                )}
            </TouchableOpacity>
        );
    };

    // --- Renderização Principal (FlatList) ---
    return (
        <View style={styles.container}>
            <FlatList
                data={animals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const photo = item.image?.url || "https://placehold.co/300x200";
                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />

                            <View style={styles.info}>

                                {/* Nome e Favorito (alinhados) */}
                                <View style={styles.headerContainer}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    {renderFavoriteIcon(item)}
                                </View>

                                <View style={styles.separator} />

                                {/* Detalhes (layout de colunas) */}
                                <View style={styles.detailsContainer}>
                                    {item.life_span && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Tempo de Vida:</Text>
                                            <Text style={styles.detailValue}>{item.life_span}</Text>
                                        </View>
                                    )}
                                    {item.temperament && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Temperamento:</Text>
                                            <Text style={styles.detailValue}>{item.temperament.split(',')[0]}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Botão de Adoção (com estado Flux) */}
                                {renderAdoptionButton(item)}

                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f2f2" },
    loader: { flex: 1, justifyContent: "center" },
    card: {
        margin: 15,
        backgroundColor: "#fff",
        borderRadius: 15,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
    },
    image: { width: "100%", height: 250 },
    info: { padding: 15 },

    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        color: '#000000',
    },
    favoriteButton: {
        padding: 8,
    },
    separator: {
        height: 1,
        backgroundColor: '#f3b4b4',
        marginVertical: 10,
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    detailItem: {
        width: '48%',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        marginTop: 2,
    },
    adoptButton: {
        backgroundColor: '#f3b4b4',
        padding: 12,
        borderRadius: 8,
        marginTop: 15,
        alignItems: 'center',
    },
    adoptButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    pendingButton: {
        backgroundColor: '#ffb300',
    },
    successButton: {
        backgroundColor: '#4caf50',
    },
    failButton: {
        backgroundColor: '#f44336',
    },
});