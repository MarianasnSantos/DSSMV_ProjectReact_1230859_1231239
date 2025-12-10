

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image, // ⭐️ COMPONENTE IMAGEM AGORA USADO PARA O ÍCONE
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Alert
} from "react-native";

// ⚠️ Removemos: import Icon from 'react-native-vector-icons/FontAwesome';

// ⭐️ IMPORTAÇÃO DA IMAGEM DO ÍCONE ⭐️
// Assumimos que a imagem está em src/assets/images/dog_heart_icon.png
const FAVORITE_ICON = require('../assets/favorito.png');


// Importações Flux
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";

// --- Hook Customizado (inalterado) ---
function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => { setState(PetStore.getState()); };
        PetStore.addChangeListener(handleChange);
        return () => { PetStore.removeListener(handleChange); };
    }, []);
    return state;
}

// --- Funções Auxiliares de Estado (inalteradas) ---
const getAuthData = () => {
    const { user, favorites, isLoggedIn } = AuthStore.getState();
    return {
        userId: user?._id,
        favorites: favorites || [],
        isLoggedIn
    };
};

const handleAdoption = (animalId) => {
    const { userId } = getAuthData();
    if (!userId) {
        Alert.alert("Erro de Autenticação", "Deve estar autenticado para iniciar o processo de adoção.");
        return;
    }
    PetActions.startAdoption(animalId, userId);
};


export default function AnimalsFeedScreen() {
    const { animals, loading, error, adoptionRequests } = usePetStoreState();
    const { favorites, isLoggedIn } = getAuthData();

    useEffect(() => {
        PetActions.loadAnimals();
    }, []);

    // ... (Renderização Condicional loading/error)

    // --- Renderização do Ícone de Favoritos (AGORA COM IMAGEM) ---
    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;

        const isFavorite = favorites.includes(item.id);

        return (
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => PetActions.toggleFavorite(item.id)}
            >
                {/* ⭐️ USO DA IMAGEM PARA O ÍCONE ⭐️ */}
                <Image
                    source={FAVORITE_ICON}
                    style={[
                        styles.customIcon,
                        // Aplica um filtro de cor (tintColor) para indicar o estado
                        { tintColor: isFavorite ? '#ff5252' : '#f3b4b4' }
                    ]}
                />
            </TouchableOpacity>
        );
    };


    // --- Renderização do Botão de Adoção (inalterada) ---
    const renderAdoptionButton = (item) => {
        const adoptionStatus = adoptionRequests[item.id];
        // ... (lógica do botão)

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
        color: '#000000', // Cor original que tínhamos
    },
    favoriteButton: {
        padding: 8,
    },
    // ⭐️ NOVO ESTILO PARA A IMAGEM ⭐️
    customIcon: {
        width: 30, // Ajuste o tamanho conforme necessário
        height: 30,
        resizeMode: 'contain',
        // O tintColor no renderFavoriteIcon lida com a cor
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