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

// ❌ REMOVER: import Icon from 'react-native-vector-icons/FontAwesome';

// ⭐️ NOVO: IMPORTAR A IMAGEM FAVORITAR.JPG ⭐️
const FAVORITE_ICON = require('../assets/favoritar.jpg');

// --- Funções Auxiliares ---
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

export default function AnimalsFeedScreen({ navigation }) {
    const {
        animals = [],
        loading = false,
        error = null,
        adoptionRequests = {},
        breeds = [],
        filters = {}
    } = usePetStoreState() || {};

    const { favorites, isLoggedIn } = getAuthData();

    useEffect(() => {
        PetActions.loadAnimals();
    }, []);

    const getFilteredAnimals = () => {
        let filteredList = animals;

        if (filters.breed && filters.breed !== 'Todos') {
            filteredList = filteredList.filter(animal => animal.breed === filters.breed || animal.name === filters.breed);
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

    if (loading) {
        return <ActivityIndicator size="large" color="#FFC0CB" style={styles.loader} />;
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: "#FF69B4", fontSize: 16 }}>{error}</Text>
            </View>
        );
    }

    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;
        const isFavorite = favorites.includes(item.id);

        // ⭐️ Renderização do Ícone como IMAGEM ⭐️
        // Se a imagem for transparente e você quiser cor, use tintColor,
        // mas é melhor ter duas imagens (preenchida e vazia) para JPG/PNG.

        // Assumindo que a imagem FAZER FAVORITO é a base:
        const tintColorStyle = { tintColor: isFavorite ? '#FF69B4' : '#FFC0CB' };

        return (
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => PetActions.toggleFavorite(item.id)}
            >
                <Image
                    source={FAVORITE_ICON}
                    style={[styles.customIcon, tintColorStyle]} // Usar customIcon para tamanho
                />
            </TouchableOpacity>
        );
    };

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

    return (
        <View style={styles.container}>
            {/* FILTROS */}
            <View style={styles.filterContainer}>
                <Picker
                    selectedValue={filters.breed || 'Todos'}
                    style={styles.pickerStyle}
                    onValueChange={(itemValue) => PetActions.setFilter('breed', itemValue)}
                >
                    <Picker.Item key="Todos" label="Todos" value="Todos" />
                    {breeds?.map(breed => (
                        <Picker.Item key={breed} label={breed} value={breed} />
                    ))}
                </Picker>

                <TextInput
                    style={styles.textInputStyle}
                    placeholder="Idade (Anos)"
                    keyboardType="numeric"
                    placeholderTextColor="#FFB6C1"
                    value={filters.minAge}
                    onChangeText={(text) => PetActions.setFilter('minAge', text)}
                />
            </View>

            <TextInput
                style={[styles.textInputStyle, styles.temperamentSearch]}
                placeholder="Pesquisar Temperamento (Ex: Corajoso, Leal)"
                placeholderTextColor="#FFB6C1"
                value={filters.temperament}
                onChangeText={(text) => PetActions.setFilter('temperament', text)}
            />

            {/* FLATLIST */}
            <FlatList
                data={filteredAnimals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const photo = item.image?.url || item.photoUrl || "https://placehold.co/300x200";
                    const displayBreed = item.breed || item.name;
                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                            <View style={styles.info}>
                                <View style={styles.headerContainer}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    {renderFavoriteIcon(item)}
                                </View>

                                {displayBreed && item.name !== displayBreed && (
                                    <Text style={styles.breedText}>{displayBreed}</Text>
                                )}

                                <View style={styles.separator} />

                                <View style={styles.detailsContainer}>
                                    {item.life_span && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Tempo de Vida:</Text>
                                            <Text style={styles.detailValue}>{item.life_span}</Text>
                                        </View>
                                    )}
                                    {item.age && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Idade:</Text>
                                            <Text style={styles.detailValue}>{item.age} anos</Text>
                                        </View>
                                    )}
                                    {item.temperament && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Temperamento:</Text>
                                            <Text style={styles.detailValue}>{item.temperament}</Text>
                                        </View>
                                    )}
                                </View>

                                {renderAdoptionButton(item)}
                            </View>
                        </View>
                    );
                }}
            />

            {/* BOTÃO FLUTUANTE */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddAnimal')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" }, // rosa bebê suave
    loader: { flex: 1, justifyContent: "center" },
    card: {
        margin: 15,
        backgroundColor: "#FFE4E1", // card rosa bebê
        borderRadius: 15,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        paddingBottom: 10,
    },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },

    customIcon: { width: 30, height: 30, resizeMode: 'contain' }, // ⭐️ Usado para o ícone de imagem ⭐️
    favoriteButton: { padding: 8 },

    separator: { height: 1, backgroundColor: '#FFB6C1', marginVertical: 10 },
    detailsContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 10 },
    detailItem: { width: '48%', marginBottom: 10 },
    detailLabel: { fontSize: 14, fontWeight: 'bold', color: '#FF69B4' },
    detailValue: { fontSize: 16, color: '#880E4F', marginTop: 2 },

    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Distribuir o espaço uniformemente
        padding: 5,
        backgroundColor: '#FFDDE6',
        borderBottomWidth: 1,
        borderBottomColor: '#FFB6C1',
        width: '100%',
        paddingHorizontal: 10,
    },

    pickerStyle: {
        height: 40,
        width: '45%',
        color: '#333',
        backgroundColor: '#fff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#FFB6C1',
        marginLeft: 0,
        paddingLeft: 8,
        fontSize: 14,
    },

    textInputStyle: {
        height: 40,
        width: '45%',
        borderColor: '#FFB6C1',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        color: '#880E4F'
    },

    temperamentSearch: { width: '95%', marginVertical: 5, alignSelf: 'center' },
    adoptButton: { backgroundColor: '#FFB6C1', padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
    adoptButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    pendingButton: { backgroundColor: '#FFC0CB' },
    successButton: { backgroundColor: '#FF69B4' },
    failButton: { backgroundColor: '#FF1493' },

    breedText: {
        fontSize: 18,
        color: '#FF69B4', // Rosa Choque (para ser visível)
        marginBottom: 8,
        marginTop: -5, // Puxa para cima
        fontWeight: '500',
    },

    // BOTÃO FLUTUANTE
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF69B4',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 3,
    },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});