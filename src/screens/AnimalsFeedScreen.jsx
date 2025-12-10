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
    Alert,
    TextInput
} from "react-native";

import { Picker } from '@react-native-picker/picker';

// Importações Flux
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";

const FAVORITE_ICON = require('../assets/favorito.png');

// --- Funções Auxiliares (inalteradas) ---
function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => { setState(PetStore.getState()); };
        PetStore.addChangeListener(handleChange);
        return () => { PetStore.removeListener(handleChange); };
    }, []);
    return state;
}

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
    const {
        animals,
        loading,
        error,
        adoptionRequests,
        availableBreeds,
        filters
    } = usePetStoreState();

    const { favorites, isLoggedIn } = getAuthData();

    useEffect(() => {
        PetActions.loadAnimals();
    }, []);

    const getFilteredAnimals = () => {
        let filteredList = animals;

        if (filters.breed) {
            filteredList = filteredList.filter(animal => animal.name === filters.breed);
        }

        const minAge = parseInt(filters.minAge);
        if (!isNaN(minAge) && minAge > 0) {
            filteredList = filteredList.filter(animal => {
                if (!animal.life_span) return false;
                const spanParts = animal.life_span.split('-');
                let maxLifeSpan;

                if (spanParts.length > 1) {
                    maxLifeSpan = parseInt(spanParts[1].replace('anos', '').replace('ano', '').trim());
                } else {
                    maxLifeSpan = parseInt(spanParts[0].replace('anos', '').replace('ano', '').trim());
                }
                return maxLifeSpan >= minAge;
            });
        }

        if (filters.temperament && filters.temperament.trim().length > 0) {
            const searchText = filters.temperament.trim().toLowerCase();
            filteredList = filteredList.filter(animal =>
                animal.temperament && animal.temperament.toLowerCase().includes(searchText)
            );
        }

        return filteredList;
    };

    const filteredAnimals = getFilteredAnimals();


    // --- Renderização Condicional (Loading/Error) ---
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

    // --- Renderização do Ícone de Favoritos (Imagem) ---
    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;

        const isFavorite = favorites.includes(item.id);

        return (
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => PetActions.toggleFavorite(item.id)}
            >
                <Image
                    source={FAVORITE_ICON}
                    style={[
                        styles.customIcon,
                        { tintColor: isFavorite ? '#e91e63' : '#999999' } // Coração vermelho/cinza escuro
                    ]}
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

            {/* ⭐️ CONTROLO DE FILTROS ⭐️ */}
            <View style={styles.filterContainer}>

                {/* 1. FILTRO POR RAÇA */}
                <Picker
                    selectedValue={filters.breed || 'Todos'}
                    style={styles.pickerStyle}
                    onValueChange={(itemValue) => PetActions.setFilter('breed', itemValue)}
                >
                    {availableBreeds.map(breed => (
                        <Picker.Item key={breed} label={breed} value={breed} />
                    ))}
                </Picker>

                {/* 2. FILTRO POR IDADE MÍNIMA */}
                <TextInput
                    style={styles.textInputStyle}
                    placeholder="Idade Mínima (Anos)"
                    keyboardType="numeric"
                    placeholderTextColor="#999" // Cor do placeholder
                    value={filters.minAge}
                    onChangeText={(text) => PetActions.setFilter('minAge', text)}
                />
            </View>

            {/* 3. BARRA DE PESQUISA POR TEMPERAMENTO */}
            <TextInput
                style={[styles.textInputStyle, styles.temperamentSearch]}
                placeholder="Pesquisar Temperamento (Ex: Corajoso, Leal)"
                placeholderTextColor="#999" // Cor do placeholder
                value={filters.temperament}
                onChangeText={(text) => PetActions.setFilter('temperament', text)}
            />

            {/* ⭐️ FLATLIST USA filteredAnimals ⭐️ */}
            <FlatList
                data={filteredAnimals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const photo = item.image?.url || "https://placehold.co/300x200";
                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />

                            <View style={styles.info}>

                                <View style={styles.headerContainer}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    {renderFavoriteIcon(item)}
                                </View>

                                <View style={styles.separator} />

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
    container: { flex: 1, backgroundColor: "#f2f2f2" }, // Fundo geral
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
        color: '#f3b4b4', // Cor Principal
    },
    favoriteButton: {
        padding: 8,
    },
    customIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    separator: {
        height: 1,
        backgroundColor: '#dddddd', // Cinza claro para separador
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
        color: '#666', // Cinza médio para labels
    },
    detailValue: {
        fontSize: 16,
        color: '#333', // Cinza escuro para valores
        marginTop: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 5,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc', // Borda inferior do container de filtros
    },
    pickerStyle: {
        height: 40,
        width: '45%',
        color: '#333', // Cor do texto do Picker
    },
    textInputStyle: {
        height: 40,
        width: '45%',
        borderColor: '#999999', // Borda dos inputs
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        marginHorizontal: 5,
        color: '#333', // Cor do texto digitado
    },
    temperamentSearch: {
        width: '95%',
        marginVertical: 5,
        alignSelf: 'center',
    },
    adoptButton: {
        backgroundColor: '#f3b4b4', // Cor Principal
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
        backgroundColor: '#ffb300', // Cores secundárias para estado
    },
    successButton: {
        backgroundColor: '#4caf50',
    },
    failButton: {
        backgroundColor: '#f44336',
    },
});