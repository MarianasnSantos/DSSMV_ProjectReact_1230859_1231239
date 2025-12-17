import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from "react-native";
import { translateTemperament } from "../utils/translations";

// Importações FLUX para Favoritos
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";

const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');

const getAuthData = () => {
    const { favorites, isLoggedIn } = AuthStore.getState();
    return { favorites: favorites || [], isLoggedIn };
};

function useAuthStoreState() {
    const [state, setState] = useState(getAuthData());
    useEffect(() => {
        const handleChange = () => { setState(getAuthData()); };
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeListener(handleChange);
    }, []);
    return state;
}

export default function ExploreScreen() {
    const [breeds, setBreeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false); // Loader para paginação
    const [page, setPage] = useState(0); // Controle de página da API
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { favorites, isLoggedIn } = useAuthStoreState();
    const [optimisticChanges, setOptimisticChanges] = useState({});

    // Função de carregamento adaptada para paginação
    const fetchBreeds = async (pageNumber, shouldRefresh = false) => {
        try {
            if (pageNumber === 0 && !shouldRefresh) setLoading(true);
            else if (!shouldRefresh) setLoadingMore(true);

            // Chamada à API com limit e page
            const response = await fetch(`https://api.thedogapi.com/v1/breeds?limit=10&page=${pageNumber}`);
            const data = await response.json();

            const breedsWithImages = await Promise.all(
                data.map(async (breed) => {
                    let imageUrl = breed.image?.url || null;

                    if (!imageUrl && breed.reference_image_id) {
                        try {
                            const imgResponse = await fetch(`https://api.thedogapi.com/v1/images/${breed.reference_image_id}`);
                            const imgData = await imgResponse.json();
                            imageUrl = imgData.url;
                        } catch {
                            imageUrl = "https://placehold.co/300x200?text=Sem+imagem";
                        }
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
            console.log("Erro ao carregar raças:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBreeds(0);
    }, []);

    // Disparado ao chegar no fim da lista
    const handleLoadMore = () => {
        if (!loadingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchBreeds(nextPage);
        }
    };

    // Pull to Refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        setPage(0);
        fetchBreeds(0, true);
    };

    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;
        const favoriteId = item.id.toString();
        const isCurrentlyInStore = favorites.includes(favoriteId);
        const optimisticState = optimisticChanges[favoriteId];
        const isFav = optimisticState !== undefined ? optimisticState : isCurrentlyInStore;

        const handleToggleFavorite = () => {
            const newFavState = !isFav;
            setOptimisticChanges(prev => ({ ...prev, [favoriteId]: newFavState }));
            PetActions.toggleFavorite(favoriteId);
        };

        return (
            <View style={styles.favoriteControlContainer}>
                <TouchableOpacity onPress={handleToggleFavorite}>
                    <Image
                        source={isFav ? STAR_FILLED : STAR_OUTLINE}
                        style={[styles.customIcon, !isFav && { tintColor: '#FFC0CB' }]}
                    />
                </TouchableOpacity>
                {isFav && <Text style={styles.favoritePermanentText}>Favorito</Text>}
            </View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return (
            <View style={styles.loaderFooter}>
                <ActivityIndicator color="#D81B60" />
                <Text style={styles.loadingMoreText}>A buscar mais patudos...</Text>
            </View>
        );
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
        <View style={styles.container}>
            <FlatList
                data={breeds}
                keyExtractor={(item, index) => item.id.toString() + index}
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.imageUrl }} style={styles.image} />
                        <View style={styles.textContainer}>
                            <View style={styles.headerContainer}>
                                <Text style={styles.name}>{item.name}</Text>
                                {renderFavoriteIcon(item)}
                            </View>
                            {item.translatedTemperament && (
                                <Text style={styles.temperament}>{item.translatedTemperament}</Text>
                            )}
                        </View>
                    </View>
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5", paddingHorizontal: 15, paddingTop: 10 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF0F5" },
    loadingText: { marginTop: 10, color: "#D81B60", fontSize: 16 },
    card: {
        backgroundColor: "#FFE4E1",
        marginVertical: 12,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#FF69B4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    image: { width: "100%", height: 220, resizeMode: "cover" },
    textContainer: { padding: 15 },
    favoriteControlContainer: { alignItems: 'center', justifyContent: 'center', paddingRight: 5 },
    customIcon: { width: 30, height: 30, resizeMode: 'contain' },
    favoritePermanentText: { color: '#FF69B4', textAlign: 'center', fontWeight: 'bold', fontSize: 12, marginTop: 2 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    name: { fontSize: 22, fontWeight: "bold", color: "#D81B60" },
    temperament: { fontSize: 14, color: "#880E4F", lineHeight: 20 },
    loaderFooter: { paddingVertical: 20, alignItems: 'center' },
    loadingMoreText: { color: "#D81B60", fontSize: 12, marginTop: 5 }
});