// src/screens/ExploreScreen.jsx

import React, { useEffect, useState } from "react";
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

const FAVORITE_ICON = require('../assets/favoritar.jpg');


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
    // ⭐️ IGUAL AO ANIMALSFEEDSCREEN ⭐️
    const [feedbackMessage, setFeedbackMessage] = useState({ id: null, text: '' });

    const { favorites, isLoggedIn } = useAuthStoreState();

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


    // ⭐️ FUNÇÃO DE TOGGLE COM A MENSAGEM CORRETA ⭐️
    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;

        const favoriteId = item.id.toString();
        const isFavorite = favorites.includes(favoriteId);
        const iconColor = isFavorite ? '#FF69B4' : '#FFC0CB';

        const handleToggleFavorite = () => {
            // Verifica o estado ANTES da ação para escolher a mensagem
            const isCurrentlyFavorite = favorites.includes(favoriteId);

            PetActions.toggleFavorite(favoriteId);

            // ⭐️ MENSAGEM IDÊNTICA AO ANIMALSFEEDSCREEN ⭐️
            const message = isCurrentlyFavorite ? 'Removido dos Favoritos!' : 'Adicionado aos Favoritos!';
            setFeedbackMessage({ id: favoriteId, text: message });

            // Limpar a mensagem após 2 segundos (ajustado para igual ao AnimalsFeedScreen)
            setTimeout(() => setFeedbackMessage({ id: null, text: '' }), 2000);
        };


        return (
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleToggleFavorite}
            >
                <Image
                    source={FAVORITE_ICON}
                    style={[
                        styles.customIcon,
                        { tintColor: iconColor }
                    ]}
                />
            </TouchableOpacity>
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

                            {/* ⭐️ EXIBIR FEEDBACK TEMPORÁRIO AQUI (IGUAL AO ANIMALSFEEDSCREEN) ⭐️ */}
                            {feedbackMessage.id === item.id.toString() && (
                                <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
                            )}

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

    customIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5
    },
    name: { fontSize: 22, fontWeight: "bold", color: "#D81B60" },
    favoriteButton: { padding: 8 },

    temperament: { fontSize: 14, color: "#880E4F", lineHeight: 20 },

    // ⭐️ ESTILO DE FEEDBACK IDÊNTICO AO ANIMALSFEEDSCREEN ⭐️
    feedbackText: {
        fontSize: 14,
        color: '#FF1493', // Deep Pink
        textAlign: 'right',
        marginTop: -5,
        marginBottom: 5,
        fontWeight: 'bold',
    },
});