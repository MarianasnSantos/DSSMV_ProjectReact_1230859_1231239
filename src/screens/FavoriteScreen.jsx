// src/screens/FavoritesScreen.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
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

    // ESTADO: Filtro Ativo
    const [activeFilter, setActiveFilter] = useState('adoption');

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

                // Usamos Promise.all para tratar todas as raças em paralelo
                const filteredBreedsWithImages = await Promise.all(
                    allBreeds
                        .filter(breed => favoriteBreedIds.includes(breed.id))
                        .map(async (breed) => {
                            let imageUrl = breed.image?.url || null;

                            // ⭐️ CORREÇÃO CHAVE: Busca robusta de URL de imagem ⭐️
                            if (!imageUrl && breed.reference_image_id) {
                                try {
                                    const imgResponse = await fetch(`https://api.thedogapi.com/v1/images/${breed.reference_image_id}`);
                                    const imgData = await imgResponse.json();
                                    imageUrl = imgData.url;
                                } catch {
                                    // Fallback se a busca secundária falhar
                                    imageUrl = "https://placehold.co/300x300?text=Sem+imagem";
                                }
                            }
                            // ⭐️ FIM CORREÇÃO CHAVE ⭐️

                            // Se ainda não tiver imagem, usa o placeholder final
                            const finalImageUrl = imageUrl || "https://placehold.co/300x300?text=Sem+imagem";

                            return {
                                isBreed: true,
                                ...breed,
                                id: breed.id.toString(),
                                name: breed.name,
                                imageUrl: finalImageUrl,
                                translatedTemperament: translateTemperament(breed.temperament),
                                translatedLifeSpan: translateLifeSpan(breed.life_span),
                            };
                        })
                );

                setFavoriteBreeds(filteredBreedsWithImages);
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

    // Filtragem final baseada no filtro selecionado
    const filteredFavoriteItems = useMemo(() => {
        if (activeFilter === 'adoption') {
            return allFavoriteItems.filter(item => !item.isBreed);
        } else if (activeFilter === 'community') {
            return allFavoriteItems.filter(item => item.isBreed);
        }
        return allFavoriteItems;
    }, [allFavoriteItems, activeFilter]);


    // --- Renderização do Card ---
    const renderAnimalCard = ({ item }) => {
        const photoUrlSource = item.isBreed
            ? item.imageUrl
            : item.image?.url || item.photoUrl;

        // O photo será sempre um URL, seja da API ou do placeholder
        const photo = photoUrlSource || "https://placehold.co/300x200";

        const displayBreed = item.breed || item.name;

        const translatedTemperament = item.isBreed ? item.translatedTemperament : translateTemperament(item.temperament);
        const translatedLifeSpan = item.isBreed ? item.translatedLifeSpan : (item.life_span ? translateLifeSpan(item.life_span) : null);
        const displayName = item.name;
        const displaySubName = item.isBreed ? 'Raça Pura (Comunidade)' : (item.breed || 'Animal para Adoção');

        const renderRemoveButton = () => (
            <View style={styles.favoriteControlContainer}>
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => PetActions.toggleFavorite(item.id)}
                >
                    <Image
                        source={STAR_FILLED}
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
                {/* ⭐️ Renderização da Imagem ⭐️ */}
                <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                <View style={styles.info}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.name}>{displayName}</Text>
                        {renderRemoveButton()}
                    </View>

                    <Text style={styles.removeInstructionText}>
                        Para remover, toque na estrela "Favorito"
                    </Text>

                    <Text style={styles.breedText}>{displaySubName}</Text>

                    <View style={styles.separator} />

                    <View style={styles.detailsContainer}>
                        {!item.isBreed && item.age && (
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

    // Componente da Barra de Abas Inferior (Inalterada)
    const TabBar = () => (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabOptionsContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeFilter === 'adoption' && styles.tabButtonActive
                    ]}
                    onPress={() => setActiveFilter('adoption')}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeFilter === 'adoption' && styles.tabButtonTextActive
                    ]}>
                        Favoritos para Adoção
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeFilter === 'community' && styles.tabButtonActive
                    ]}
                    onPress={() => setActiveFilter('community')}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeFilter === 'community' && styles.tabButtonTextActive
                    ]}>
                        Favoritos da Comunidade
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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

            <View style={styles.topMessageContainer}>
                <Text style={styles.topMessageText}>
                    Esta na página dos favoritos, seleciona qual quer ver:
                </Text>
            </View>

            {/* Mensagem se a lista filtrada estiver vazia */}
            {filteredFavoriteItems.length === 0 ? (
                <View style={styles.emptyFilterContainer}>
                    <Text style={styles.emptyFilterText}>
                        Não tem favoritos na categoria "{activeFilter === 'adoption' ? 'Adoção' : 'Comunidade'}"
                    </Text>
                    <Text style={styles.emptyFilterSubText}>
                        Adicione alguns para que apareçam aqui!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredFavoriteItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderAnimalCard}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    style={{ flex: 1 }}
                />
            )}

            <TabBar />
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

    topMessageContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#FFB6C1',
        borderBottomWidth: 1,
        borderBottomColor: '#FF69B4',
    },
    topMessageText: {
        fontSize: 14,
        color: '#D81B60',
        textAlign: 'center',
        fontWeight: 'bold',
    },

    tabBarContainer: {
        backgroundColor: '#FFE4E1',
        borderTopWidth: 1,
        borderTopColor: '#FF69B4',
        paddingHorizontal: 5,
        paddingVertical: 8,
    },
    tabOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFE4E1',
        borderRadius: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    tabButtonActive: {
        backgroundColor: '#FF69B4',
    },
    tabButtonText: {
        color: '#D81B60',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    tabButtonTextActive: {
        color: '#FFFFFF',
    },

    emptyFilterContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyFilterText: {
        fontSize: 18,
        color: '#D81B60',
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    emptyFilterSubText: {
        fontSize: 16,
        color: '#D81B60',
        textAlign: 'center',
    },

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
    // O fundo rosa agora só aparece se a busca robusta e o placeholder falharem.
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
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