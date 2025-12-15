// src/screens/FavoritesScreen.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity
} from "react-native";

// Importações Flux
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";

// Importar funções de tradução
import { translateTemperament, translateLifeSpan } from "../utils/translations";

// Ícone preenchido
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');


// --- Funções Auxiliares FLUX ---

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
    const { favorites, isLoggedIn } = AuthStore.getState();
    return {
        favorites: favorites || [],
        isLoggedIn
    };
};

// HOOK REATIVO PARA O AUTHSTORE
function useAuthStoreState() {
    const [state, setState] = useState(getAuthData());
    useEffect(() => {
        const handleChange = () => { setState(getAuthData()); };
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeListener(handleChange);
    }, []);
    return state;
}


export default function FavoritesScreen({ navigation }) {
    const { animals = [], loading: petLoading = false } = usePetStoreState() || {};
    const { favorites, isLoggedIn } = useAuthStoreState();

    const [favoriteBreeds, setFavoriteBreeds] = useState([]);
    const [breedsLoading, setBreedsLoading] = useState(false);

    // Carregar animais ao montar
    useEffect(() => {
        if (animals.length === 0) {
            PetActions.loadAnimals();
        }
    }, [animals.length]);

    // EFEITO: CARREGAR DADOS DAS RAÇAS FAVORITAS
    useEffect(() => {
        if (!favorites.length || !isLoggedIn) {
            setFavoriteBreeds([]);
            return;
        }

        const favoriteBreedIds = favorites
            .filter(id => id && !isNaN(Number(id)))
            .map(Number);

        if (favoriteBreedIds.length === 0) {
            setFavoriteBreeds([]);
            return;
        }

        setBreedsLoading(true);

        async function loadFavoriteBreeds() {
            try {
                const response = await fetch("https://api.thedogapi.com/v1/breeds");
                const allBreeds = await response.json();

                const filteredBreeds = allBreeds
                    .filter(breed => favoriteBreedIds.includes(breed.id))
                    .map(breed => ({
                        isBreed: true,
                        ...breed,
                        id: breed.id.toString(),
                        name: breed.name,
                        imageUrl: breed.image?.url || "https://placehold.co/300x300?text=Raça",
                        translatedTemperament: translateTemperament(breed.temperament),
                        translatedLifeSpan: translateLifeSpan(breed.life_span),
                    }));

                setFavoriteBreeds(filteredBreeds);
            } catch (err) {
                console.error("Erro ao buscar raças favoritas:", err);
            } finally {
                setBreedsLoading(false);
            }
        }

        loadFavoriteBreeds();
    }, [favorites, isLoggedIn]);

    // --- LÓGICA DE FILTRAGEM E COMBINAÇÃO ---

    const favoriteAnimalIds = favorites.filter(id => id && isNaN(Number(id)));
    const actualFavoriteAnimals = animals.filter(animal =>
        favoriteAnimalIds.includes(animal.id)
    );
    const allFavoriteItems = [...actualFavoriteAnimals, ...favoriteBreeds];


    // --- Renderização do Card ---
    const renderAnimalCard = ({ item }) => {
        const photo = item.image?.url || item.photoUrl || "https://placehold.co/300x200";
        const displayBreed = item.breed || item.name;

        const translatedTemperament = item.isBreed ? item.translatedTemperament : translateTemperament(item.temperament);
        const translatedLifeSpan = item.isBreed ? item.translatedLifeSpan : (item.life_span ? translateLifeSpan(item.life_span) : null);
        const displayName = item.name;
        const displaySubName = item.isBreed ? 'Raça Pura (Comunidade)' : displayBreed;

        const renderRemoveButton = () => (
            // Ícone de remoção: sempre preenchido e com mensagem "Favorito"
            <View style={styles.favoriteControlContainer}>
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => PetActions.toggleFavorite(item.id)}
                >
                    <Image
                        source={STAR_FILLED}
                        // ⭐️ CORREÇÃO: Aplica apenas o estilo base. Nenhuma borda externa indesejada. ⭐️
                        style={styles.customIcon}
                    />
                </TouchableOpacity>
                <Text style={styles.favoritePermanentText}>
                    Favorito
                </Text>
            </View>
        );

        return (
            <View style={styles.card}>
                <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                <View style={styles.info}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.name}>{displayName}</Text>
                        {renderRemoveButton()}
                    </View>

                    {/* Instrução de remoção */}
                    <Text style={styles.removeInstructionText}>
                        Para remover, toque na estrela "Favorito"
                    </Text>

                    <Text style={styles.breedText}>{displaySubName}</Text>

                    <View style={styles.separator} />

                    <View style={styles.detailsContainer}>
                        {item.age && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Idade:</Text>
                                <Text style={styles.detailValue}>{item.age} anos</Text>
                            </View>
                        )}
                        {translatedLifeSpan && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Tempo de Vida:</Text>
                                <Text style={styles.detailValue}>{translatedLifeSpan}</Text>
                            </View>
                        )}
                        {translatedTemperament && (
                            <View style={styles.detailItemFull}>
                                <Text style={styles.detailLabel}>Temperamento:</Text>
                                <Text style={styles.detailValue}>{translatedTemperament}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };


    // --- Renderização Principal ---

    if (!isLoggedIn) {
        return (
            <View style={[styles.center, styles.container]}>
                <Text style={styles.errorText}>Precisa de estar autenticado para ver os favoritos.</Text>
            </View>
        );
    }

    if (petLoading || breedsLoading) {
        return <ActivityIndicator size="large" color="#FFC0CB" style={styles.loader} />;
    }

    if (allFavoriteItems.length === 0) {
        return (
            <View style={[styles.center, styles.container]}>
                <Text style={styles.noFavoritesText}>Ainda não adicionou nenhum item aos favoritos! 💔</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={allFavoriteItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAnimalCard}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loader: { flex: 1, justifyContent: "center" },
    errorText: { color: '#D81B60', fontSize: 18, textAlign: 'center' },
    noFavoritesText: { color: '#D81B60', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },

    // ⭐️ ESTILO DO CARTÃO COM BORDA ROSA ⭐️
    card: {
        margin: 15,
        backgroundColor: "#FFE4E1",
        borderRadius: 15,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#FF69B4",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        paddingBottom: 10,
        borderWidth: 2,
        borderColor: '#FF69B4',
    },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

    // ESTILOS DE FAVORITO
    favoriteControlContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 5,
    },
    favoritePermanentText: {
        color: '#FF69B4',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 2,
    },
    favoriteButton: { padding: 8 },

    customIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
        // As propriedades de borda foram removidas daqui para evitar o quadrado indesejado.
    },

    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },

    separator: { height: 1, backgroundColor: '#FFB6C1', marginVertical: 10 },

    breedText: { fontSize: 18, color: '#FF69B4', marginBottom: 8, marginTop: -5, fontWeight: '500' },

    removeInstructionText: {
        fontSize: 12,
        color: '#D81B60',
        textAlign: 'left',
        marginTop: 0,
        marginBottom: 10,
        fontWeight: '500'
    },

    detailsContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 10 },
    detailItem: { width: '48%', marginBottom: 10 },
    detailItemFull: { width: '100%', marginBottom: 10 },
    detailLabel: { fontSize: 14, fontWeight: 'bold', color: '#FF69B4' },
    detailValue: { fontSize: 16, color: '#880E4F', marginTop: 2 },
});