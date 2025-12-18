import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    SafeAreaView
} from "react-native";

// --- Flux ---
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";

// --- Utilitários ---
import { translateTemperament, translateLifeSpan } from "../utils/translations";

// Ícone (Garante que o caminho está correto no teu projeto)
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');

export default function FavoritesScreen({ navigation }) {
    // --- Estados do Flux ---
    const [animals, setAnimals] = useState(PetStore.getState().animals || []);
    const [favorites, setFavorites] = useState(AuthStore.getState().favorites || []);
    const [isLoggedIn] = useState(AuthStore.getState().isLoggedIn);
    const [petLoading, setPetLoading] = useState(PetStore.getState().loading);

    // --- Estados Locais ---
    const [favoriteBreeds, setFavoriteBreeds] = useState([]);
    const [breedsLoading, setBreedsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('adoption');

    // --- Efeito: Ouvir os Stores (Flux) ---
    useEffect(() => {
        const onPetChange = () => {
            setAnimals(PetStore.getState().animals);
            setPetLoading(PetStore.getState().loading);
        };
        const onAuthChange = () => {
            setFavorites(AuthStore.getState().favorites);
        };

        PetStore.addChangeListener(onPetChange);
        AuthStore.addChangeListener(onAuthChange);

        // Carregar se a lista estiver vazia
        if (PetStore.getState().animals.length === 0) {
            PetActions.loadAnimals();
        }

        return () => {
            PetStore.removeChangeListener(onPetChange);
            AuthStore.removeChangeListener(onAuthChange);
        };
    }, []);

    // --- Efeito: Carregar Raças da API (Comunidade) ---
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

        async function loadFavoriteBreeds() {
            setBreedsLoading(true);
            try {
                const response = await fetch("https://api.thedogapi.com/v1/breeds");
                const allBreeds = await response.json();

                const filteredBreedsWithImages = await Promise.all(
                    allBreeds
                        .filter(breed => favoriteBreedIds.includes(breed.id))
                        .map(async (breed) => {
                            let imageUrl = breed.image?.url;

                            if (!imageUrl && breed.reference_image_id) {
                                try {
                                    const imgRes = await fetch(`https://api.thedogapi.com/v1/images/${breed.reference_image_id}`);
                                    const imgData = await imgRes.json();
                                    imageUrl = imgData.url;
                                } catch { imageUrl = "https://placehold.co/300x300?text=Sem+imagem"; }
                            }

                            return {
                                isBreed: true,
                                ...breed,
                                id: breed.id.toString(),
                                imageUrl: imageUrl || "https://placehold.co/300x300?text=Sem+imagem",
                                translatedTemperament: translateTemperament(breed.temperament),
                                translatedLifeSpan: translateLifeSpan(breed.life_span),
                            };
                        })
                );
                setFavoriteBreeds(filteredBreedsWithImages);
            } catch (err) {
                console.error("Erro raças:", err);
            } finally {
                setBreedsLoading(false);
            }
        }
        loadFavoriteBreeds();
    }, [favorites, isLoggedIn]);

    // --- Lógica de Filtragem ---
    const filteredFavoriteItems = useMemo(() => {
        // Favoritos da base de dados (Adoção)
        const favoriteAnimalIds = favorites.filter(id => id && isNaN(Number(id)));
        const actualFavoriteAnimals = animals.filter(animal => favoriteAnimalIds.includes(animal.id));

        if (activeFilter === 'adoption') return actualFavoriteAnimals;
        if (activeFilter === 'community') return favoriteBreeds;
        return [...actualFavoriteAnimals, ...favoriteBreeds];
    }, [animals, favorites, favoriteBreeds, activeFilter]);

    // --- Renderização do Card ---
    const renderAnimalCard = ({ item }) => {
        const photo = item.isBreed ? item.imageUrl : (item.photoUrl || "https://placehold.co/300x200");
        const displayName = item.name;
        const displaySubName = item.isBreed ? 'Raça Pura (Comunidade)' : (item.breed || 'Animal para Adoção');

        return (
            <View style={styles.card}>
                <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                <View style={styles.info}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.name}>{displayName}</Text>
                        <View style={styles.favoriteControlContainer}>
                            <TouchableOpacity style={styles.favoriteButton} onPress={() => PetActions.toggleFavorite(item.id)}>
                                <Image source={STAR_FILLED} style={styles.customIcon} />
                            </TouchableOpacity>
                            <Text style={styles.favoritePermanentText}>Favorito</Text>
                        </View>
                    </View>

                    <Text style={styles.removeInstructionText}>Para remover, toque na estrela "Favorito"</Text>
                    <Text style={styles.breedText}>{displaySubName}</Text>
                    <View style={styles.separator} />

                    <View style={styles.detailsContainer}>
                        {!item.isBreed && item.age && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Idade:</Text>
                                <Text style={styles.detailValue}>{item.age} anos</Text>
                            </View>
                        )}
                        {(item.isBreed ? item.translatedLifeSpan : item.life_span) && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Tempo de Vida:</Text>
                                <Text style={styles.detailValue}>{item.isBreed ? item.translatedLifeSpan : item.life_span}</Text>
                            </View>
                        )}
                        {(item.isBreed ? item.translatedTemperament : item.temperament) && (
                            <View style={styles.detailItemFull}>
                                <Text style={styles.detailLabel}>Temperamento:</Text>
                                <Text style={styles.detailValue}>
                                    {item.isBreed ? item.translatedTemperament : translateTemperament(item.temperament)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (!isLoggedIn) {
        return (
            <View style={styles.center}><Text style={styles.errorText}>Precisa de estar autenticado.</Text></View>
        );
    }

    if (petLoading || breedsLoading) {
        return <ActivityIndicator size="large" color="#FF69B4" style={styles.loader} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topMessageContainer}>
                <Text style={styles.topMessageText}>Está na página dos favoritos, selecione qual quer ver:</Text>
            </View>

            {filteredFavoriteItems.length === 0 ? (
                <View style={styles.emptyFilterContainer}>
                    <Text style={styles.emptyFilterText}>
                        Não tem favoritos em "{activeFilter === 'adoption' ? 'Adoção' : 'Comunidade'}"
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredFavoriteItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderAnimalCard}
                    style={{ flex: 1 }}
                />
            )}

            {/* TAB BAR INFERIOR */}
            <View style={styles.tabBarContainer}>
                <View style={styles.tabOptionsContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeFilter === 'adoption' && styles.tabButtonActive]}
                        onPress={() => setActiveFilter('adoption')}
                    >
                        <Text style={[styles.tabButtonText, activeFilter === 'adoption' && styles.tabButtonTextActive]}>Favoritos para Adoção</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeFilter === 'community' && styles.tabButtonActive]}
                        onPress={() => setActiveFilter('community')}
                    >
                        <Text style={[styles.tabButtonText, activeFilter === 'community' && styles.tabButtonTextActive]}>Favoritos da Comunidade</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loader: { flex: 1, justifyContent: "center" },
    errorText: { color: '#D81B60', fontSize: 18, textAlign: 'center' },
    topMessageContainer: { padding: 12, backgroundColor: '#FFB6C1', borderBottomWidth: 1, borderBottomColor: '#FF69B4' },
    topMessageText: { fontSize: 14, color: '#D81B60', textAlign: 'center', fontWeight: 'bold' },
    tabBarContainer: { backgroundColor: '#FFE4E1', borderTopWidth: 1, borderTopColor: '#FF69B4', padding: 8 },
    tabOptionsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginHorizontal: 4 },
    tabButtonActive: { backgroundColor: '#FF69B4' },
    tabButtonText: { color: '#D81B60', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
    tabButtonTextActive: { color: '#FFFFFF' },
    emptyFilterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyFilterText: { fontSize: 16, color: '#D81B60', fontWeight: 'bold' },
    card: { margin: 15, backgroundColor: "#FFE4E1", borderRadius: 15, overflow: "hidden", elevation: 3, borderWidth: 2, borderColor: '#FF69B4' },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    favoriteControlContainer: { alignItems: 'center' },
    favoritePermanentText: { color: '#FF69B4', fontWeight: 'bold', fontSize: 11 },
    favoriteButton: { padding: 5 },
    customIcon: { width: 30, height: 30, resizeMode: 'contain' },
    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },
    separator: { height: 1, backgroundColor: '#FFB6C1', marginVertical: 10 },
    breedText: { fontSize: 16, color: '#FF69B4', fontWeight: '600' },
    removeInstructionText: { fontSize: 11, color: '#D81B60', marginBottom: 5 },
    detailsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    detailItem: { width: '50%', marginBottom: 10 },
    detailItemFull: { width: '100%', marginBottom: 10 },
    detailLabel: { fontSize: 13, fontWeight: 'bold', color: '#FF69B4' },
    detailValue: { fontSize: 14, color: '#880E4F' },
});