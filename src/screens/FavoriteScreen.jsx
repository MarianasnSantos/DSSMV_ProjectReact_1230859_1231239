// src/screens/FavoritesScreen.jsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity
} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';

// Importações Flux
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";

// ⭐️ IMPORTAR FUNÇÕES DE TRADUÇÃO ⭐️
import { translateTemperament, translateLifeSpan } from "../utils/translations";

// --- Funções Auxiliares FLUX (Para ligar ao Store) ---

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

export default function FavoritesScreen({ navigation }) {
    // 1. Obter todos os animais e status de carregamento
    const { animals = [], loading = false, error = null } = usePetStoreState() || {};
    // 2. Obter a lista de IDs favoritos do utilizador
    const { favorites, isLoggedIn } = getAuthData();

    // Carregar animais ao montar (caso não tenham sido carregados pelo Feed)
    useEffect(() => {
        if (animals.length === 0) {
            PetActions.loadAnimals();
        }
    }, [animals.length]);


    // --- LÓGICA DE FILTRAGEM ---
    const favoriteAnimals = animals.filter(animal =>
        favorites.includes(animal.id)
    );

    // --- Renderização do Card (Reutilizando a lógica do Feed) ---
    const renderAnimalCard = ({ item }) => {
        const photo = item.image?.url || item.photoUrl || "https://placehold.co/300x200";
        const displayBreed = item.breed || item.name;

        // Traduzir Temperamento e Tempo de Vida
        const translatedTemperament = translateTemperament(item.temperament);
        const translatedLifeSpan = translateLifeSpan(item.life_span);

        // Renderizar o botão de favorito (o botão só remove, pois já está nos favoritos)
        const renderRemoveButton = () => (
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => PetActions.toggleFavorite(item.id)} // O toggleFavorite irá removê-lo
            >
                {/* Coração preenchido para indicar que está nos favoritos e será removido */}
                <Icon name={'heart'} size={30} color={'#FF69B4'} />
            </TouchableOpacity>
        );

        return (
            <View style={styles.card}>
                <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                <View style={styles.info}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        {renderRemoveButton()}
                    </View>

                    {displayBreed && item.name !== displayBreed && (
                        <Text style={styles.breedText}>{displayBreed}</Text>
                    )}

                    <View style={styles.separator} />

                    {/* ⭐️ DETALHES COM TRADUÇÕES E LAYOUT MELHORADO ⭐️ */}
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
                    {/* FIM DETALHES */}

                    <Text style={styles.removeText}>Clique na estrela para remover</Text>
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

    if (loading) {
        return <ActivityIndicator size="large" color="#FFC0CB" style={styles.loader} />;
    }

    if (error) {
        return (
            <View style={[styles.center, styles.container]}>
                <Text style={styles.errorText}>Erro ao carregar animais: {error}</Text>
            </View>
        );
    }

    if (favoriteAnimals.length === 0) {
        return (
            <View style={[styles.center, styles.container]}>
                <Text style={styles.noFavoritesText}>Ainda não adicionou nenhum animal aos favoritos! 💔</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <FlatList
                data={favoriteAnimals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAnimalCard}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

// --- ESTILOS (Alinhados ao tema Rosa Bebê) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loader: { flex: 1, justifyContent: "center" },
    errorText: { color: '#D81B60', fontSize: 18, textAlign: 'center' },
    noFavoritesText: { color: '#D81B60', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },

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
    },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },
    favoriteButton: { padding: 8 },
    separator: { height: 1, backgroundColor: '#FFB6C1', marginVertical: 10 },

    breedText: { fontSize: 18, color: '#FF69B4', marginBottom: 8, marginTop: -5, fontWeight: '500' },

    // ⭐️ DETALHES (Nova Estrutura) ⭐️
    detailsContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 10 },
    detailItem: { width: '48%', marginBottom: 10 },
    detailItemFull: { width: '100%', marginBottom: 10 }, // Para o Temperamento que é mais longo
    detailLabel: { fontSize: 14, fontWeight: 'bold', color: '#FF69B4' },
    detailValue: { fontSize: 16, color: '#880E4F', marginTop: 2 },

    removeText: { fontSize: 12, color: '#FF69B4', textAlign: 'right', marginTop: 5 },
});