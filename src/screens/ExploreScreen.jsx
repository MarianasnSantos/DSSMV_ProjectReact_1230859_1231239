import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView
} from "react-native";
import { translateTemperament } from "../utils/translations";

// --- Flux ---
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";

const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');

//{ navigation } para podermos mudar de ecrã
export default function ExploreScreen({ navigation }) {

    // --- Estados Reativos Flux ---
    const [favorites, setFavorites] = useState(AuthStore.getState().favorites || []);
    const [isLoggedIn, setIsLoggedIn] = useState(AuthStore.getState().isLoggedIn);

    // --- Estados da API ---
    const [breeds, setBreeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [optimisticChanges, setOptimisticChanges] = useState({});

    // --- Ciclo de Vida Flux ---
    useEffect(() => {
        const onAuthChange = () => {
            const state = AuthStore.getState();
            setFavorites(state.favorites || []);
            setIsLoggedIn(state.isLoggedIn);
        };

        AuthStore.addChangeListener(onAuthChange);
        fetchBreeds(0); // Carga inicial

        return () => AuthStore.removeChangeListener(onAuthChange);
    }, []);

    // Limpeza de estado otimista
    useEffect(() => {
        setOptimisticChanges(prev => {
            const next = { ...prev };
            Object.keys(prev).forEach(id => {
                if (favorites.includes(id) === prev[id]) delete next[id];
            });
            return next;
        });
    }, [favorites]);

    // --- Lógica de Dados (DogAPI) ---
    const fetchBreeds = async (pageNumber, shouldRefresh = false) => {
        try {
            if (pageNumber === 0 && !shouldRefresh) setLoading(true);
            else if (!shouldRefresh) setLoadingMore(true);

            const response = await fetch(`https://api.thedogapi.com/v1/breeds?limit=10&page=${pageNumber}`);
            const data = await response.json();

            const breedsWithImages = await Promise.all(
                data.map(async (breed) => {
                    let imageUrl = breed.image?.url;

                    if (!imageUrl && breed.reference_image_id) {
                        try {
                            const imgRes = await fetch(`https://api.thedogapi.com/v1/images/${breed.reference_image_id}`);
                            const imgData = await imgRes.json();
                            imageUrl = imgData.url;
                        } catch { imageUrl = "https://placehold.co/300x200?text=Sem+imagem"; }
                    }

                    return {
                        ...breed,
                        id: breed.id.toString(),
                        imageUrl: imageUrl || "https://placehold.co/300x200?text=Sem+imagem",
                        translatedTemperament: translateTemperament(breed.temperament)
                    };
                })
            );

            setBreeds(prev => shouldRefresh ? breedsWithImages : [...prev, ...breedsWithImages]);
        } catch (error) {
            console.log("Erro API:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setIsRefreshing(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && breeds.length > 0) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchBreeds(nextPage);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setPage(0);
        fetchBreeds(0, true);
    };

    // --- Renderização do Favorito ---
    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;
        const favId = item.id.toString();
        const isCurrentlyInStore = favorites.includes(favId);
        const optimistic = optimisticChanges[favId];
        const isFav = optimistic !== undefined ? optimistic : isCurrentlyInStore;

        const toggle = () => {
            setOptimisticChanges(prev => ({ ...prev, [favId]: !isFav }));
            PetActions.toggleFavorite(favId);
        };

        return (
            <View style={styles.favoriteControlContainer}>
                <TouchableOpacity onPress={toggle}>
                    <Image
                        source={isFav ? STAR_FILLED : STAR_OUTLINE}
                        style={[styles.customIcon, !isFav && { tintColor: '#FFC0CB' }]}
                    />
                </TouchableOpacity>
                {isFav && <Text style={styles.favoriteText}>Favorito</Text>}
            </View>
        );
    };

    const handleGoToFeed = (item) => {
        // Agora enviamos APENAS os temperamentos para comparação
        // Não enviamos o nome da raça, porque queremos incluir rafeiros
        navigation.navigate('AnimalsFeed', {
            smartTemperament: item.temperament || "" // Ex: "Friendly, Intelligent, Active"
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#D81B60" />
                <Text style={styles.loadingText}>A carregar 🐾...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={breeds}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => (
                    //View em TouchableOpacity para ser clicável
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handleGoToFeed(item)}
                        activeOpacity={0.9}
                    >
                        <Image source={{ uri: item.imageUrl }} style={styles.image} />
                        <View style={styles.textContainer}>
                            <View style={styles.headerContainer}>
                                <Text style={styles.name}>{item.name}</Text>
                                {renderFavoriteIcon(item)}
                            </View>

                            <Text style={styles.temperament}>
                                {item.translatedTemperament || "Temperamento calmo"}
                            </Text>

                            {/* 3. AQUI: Um pequeno botão visual para indicar a ação */}
                            <View style={styles.ctaContainer}>
                                <Text style={styles.ctaText}>🔍 Ver animais desta raça</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListFooterComponent={loadingMore && (
                    <View style={styles.footer}><ActivityIndicator color="#D81B60" /></View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 10, color: "#D81B60", fontWeight: "bold" },

    card: { backgroundColor: "#FFE4E1", margin: 15, borderRadius: 20, overflow: "hidden", elevation: 4 },
    image: { width: "100%", height: 220 },
    textContainer: { padding: 15 },

    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 22, fontWeight: "bold", color: "#D81B60", flex: 1 },

    favoriteControlContainer: { alignItems: 'center' },
    customIcon: { width: 30, height: 30, resizeMode: 'contain' },
    favoriteText: { color: '#FF69B4', fontSize: 10, fontWeight: 'bold' },

    temperament: { fontSize: 14, color: "#880E4F", marginTop: 5 },

    // Estilos novos para o CTA (Call To Action)
    ctaContainer: {
        marginTop: 15,
        backgroundColor: '#FF69B4',
        padding: 8,
        borderRadius: 10,
        alignSelf: 'flex-start'
    },
    ctaText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    footer: { padding: 20 }
});