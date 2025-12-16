// src/screens/ExploreScreen.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
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

// Estrelas preenchida/vazia
const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');


// --- Funções Auxiliares FLUX ---
const getAuthData = () => {
    const { favorites, isLoggedIn } = AuthStore.getState();
    return {
        favorites: favorites || [],
        isLoggedIn
    };
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

    const { favorites, isLoggedIn } = useAuthStoreState();

    // ESTADO OTIMISTA: Para Optimistic UI
    const [optimisticChanges, setOptimisticChanges] = useState({});

    useEffect(() => {
        async function loadBreeds() {
            try {
                const response = await fetch("https://api.thedogapi.com/v1/breeds");
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

                        const translatedTemperament = translateTemperament(breed.temperament);

                        return {
                            ...breed,
                            id: breed.id.toString(),
                            imageUrl: imageUrl || "https://placehold.co/300x200?text=Sem+imagem",
                            translatedTemperament: translatedTemperament
                        };
                    })
                );

                setBreeds(breedsWithImages);
            } catch (error) {
                console.log("Erro ao carregar raças:", error);
            } finally {
                setLoading(false);
            }
        }

        loadBreeds();
    }, []);

    // EFEITO PARA LIMPAR ESTADO OTIMISTA quando o Store é atualizado
    useEffect(() => {
        setOptimisticChanges(prev => {
            const next = { ...prev };
            Object.keys(prev).forEach(id => {
                if (favorites.includes(id) === prev[id]) {
                    delete next[id];
                }
            });
            return next;
        });
    }, [favorites]);


    // FUNÇÃO DE TOGGLE OTIMISTA COM A ESTRELA PERMANENTE
    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;

        const favoriteId = item.id.toString();

        // CÁLCULO OTIMISTA DO ESTADO DO FAVORITO
        const isCurrentlyInStore = favorites.includes(favoriteId);
        const optimisticState = optimisticChanges[favoriteId];
        const isFav = optimisticState !== undefined ? optimisticState : isCurrentlyInStore;


        const handleToggleFavorite = () => {

            const isFavBeforeClick = optimisticState !== undefined ? optimisticState : isCurrentlyInStore;
            const newFavState = !isFavBeforeClick;

            // 1. Optimistic Update (Feedback visual imediato)
            setOptimisticChanges(prev => ({
                ...prev,
                [favoriteId]: newFavState,
            }));

            // 2. Dispara a ação
            PetActions.toggleFavorite(favoriteId);
        };


        return (
            <View style={styles.favoriteControlContainer}>
                <TouchableOpacity
                    onPress={handleToggleFavorite}
                >
                    <Image
                        source={isFav ? STAR_FILLED : STAR_OUTLINE}
                        style={[
                            styles.customIcon,
                            // Pinta a estrela vazia de rosa claro
                            !isFav && { tintColor: '#FFC0CB' },
                            // ❌ CORRIGIDO: favoriteIconBorder removido daqui ❌
                        ]}
                    />
                </TouchableOpacity>

                {/* Mensagem "Favorito" se o item estiver nos favoritos */}
                {isFav && (
                    <Text style={styles.favoritePermanentText}>
                        Favorito
                    </Text>
                )}
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
                keyExtractor={(item) => item.id.toString()}
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
            />
        </View>
    );
}

// --- ESTILOS ROSA BEBÊ ---
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

    // ⭐️ ESTILOS PADRÃO PARA FAVORITOS (CORRIGIDOS) ⭐️
    favoriteControlContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 5,
    },
    customIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    favoritePermanentText: {
        color: '#FF69B4',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 2,
    },
    // ❌ REMOVIDO: favoriteIconBorder (Estilo que causava o quadrado) ❌

    // FIM ESTILOS DE FAVORITOS PADRÃO

    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5
    },
    name: { fontSize: 22, fontWeight: "bold", color: "#D81B60" },
    favoriteButton: { padding: 8 },

    temperament: { fontSize: 14, color: "#880E4F", lineHeight: 20 },
});