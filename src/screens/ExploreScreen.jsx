import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl
} from "react-native";
import { translateTemperament } from "../utils/translations";

// --- Flux ---
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";

const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');

export default function ExploreScreen({ navigation }) {

    // --- ESTADOS GERAIS ---
    const [activeTab, setActiveTab] = useState('RACAS'); // 'RACAS' ou 'COMUNIDADE'
    const [favorites, setFavorites] = useState(AuthStore.getState().favorites || []);
    const [isLoggedIn, setIsLoggedIn] = useState(AuthStore.getState().isLoggedIn);

    // --- ESTADOS: RAÇAS (Lógica Antiga) ---
    const [breeds, setBreeds] = useState([]);
    const [loadingBreeds, setLoadingBreeds] = useState(true);
    const [loadingMoreBreeds, setLoadingMoreBreeds] = useState(false);
    const [page, setPage] = useState(0);
    const [isRefreshingBreeds, setIsRefreshingBreeds] = useState(false);
    const [optimisticChanges, setOptimisticChanges] = useState({});

    // --- ESTADOS: COMUNIDADE ---
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [isRefreshingPosts, setIsRefreshingPosts] = useState(false);

    // --- CICLO DE VIDA ---
    useEffect(() => {
        const onAuthChange = () => {
            const state = AuthStore.getState();
            setFavorites(state.favorites || []);
            setIsLoggedIn(state.isLoggedIn);
        };
        AuthStore.addChangeListener(onAuthChange);

        fetchBreeds(0);
        fetchCommunityPosts();

        return () => AuthStore.removeChangeListener(onAuthChange);
    }, []);

    // Limpeza otimista favoritos
    useEffect(() => {
        setOptimisticChanges(prev => {
            const next = { ...prev };
            Object.keys(prev).forEach(id => {
                if (favorites.includes(id) === prev[id]) delete next[id];
            });
            return next;
        });
    }, [favorites]);


    // ============================================================
    // 1. LÓGICA DA ABA "RAÇAS"
    // ============================================================
    const fetchBreeds = async (pageNumber, shouldRefresh = false) => {
        try {
            if (pageNumber === 0 && !shouldRefresh) setLoadingBreeds(true);
            else if (!shouldRefresh) setLoadingMoreBreeds(true);

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
            console.log("Erro API Raças:", error);
        } finally {
            setLoadingBreeds(false);
            setLoadingMoreBreeds(false);
            setIsRefreshingBreeds(false);
        }
    };

    const handleLoadMoreBreeds = () => {
        if (!loadingMoreBreeds && breeds.length > 0) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchBreeds(nextPage);
        }
    };

    const handleRefreshBreeds = () => {
        setIsRefreshingBreeds(true);
        setPage(0);
        fetchBreeds(0, true);
    };

    const handleGoToFeed = (item) => {
        navigation.navigate('AnimalsFeed', { smartTemperament: item.temperament || "" });
    };

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
            <TouchableOpacity onPress={toggle}>
                <Image
                    source={isFav ? STAR_FILLED : STAR_OUTLINE}
                    style={[styles.customIcon, !isFav && { tintColor: '#FFC0CB' }]}
                />
            </TouchableOpacity>
        );
    };


    // ============================================================
    // 2. LÓGICA DA ABA "COMUNIDADE"
    // ============================================================
    const fetchCommunityPosts = async () => {
        setLoadingPosts(true);

        try {
            const response = await fetch("https://petmatch-afab.restdb.io/rest/posts", {
                method: 'GET',
                headers: {
                    "content-type": "application/json",
                    "x-apikey": "a29c6a5e4f29c400c1ffac21c4c454f2af5a3",
                    "cache-control": "no-cache"
                }
            });

            const data = await response.json();

            setPosts(Array.isArray(data) ? data.reverse() : []);

        } catch (error) {
            console.log("Erro ao carregar posts:", error);
        } finally {
            setLoadingPosts(false);
            setIsRefreshingPosts(false);
        }
    };

    const handleRefreshPosts = () => {
        setIsRefreshingPosts(true);
        fetchCommunityPosts();
    };

    // ============================================================
    // (UI)
    // ============================================================

    // UI: Cartão de Raça
    const renderBreedItem = ({ item }) => (
        <TouchableOpacity style={styles.cardBreed} onPress={() => handleGoToFeed(item)} activeOpacity={0.9}>
            <Image source={{ uri: item.imageUrl }} style={styles.imageBreed} />
            <View style={styles.textContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.nameBreed}>{item.name}</Text>
                    {renderFavoriteIcon(item)}
                </View>
                <Text style={styles.temperament}>
                    {item.translatedTemperament || "Temperamento calmo"}
                </Text>
                <View style={styles.ctaContainer}>
                    <Text style={styles.ctaText}>🔍 Ver animais parecidos</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // UI: Cartão de Comunidade
    const renderCommunityPost = ({ item }) => (
        <View style={styles.cardCommunity}>
            {/* Cabeçalho: Autor e Data */}
            <View style={styles.commHeader}>
                <View style={styles.avatarPlaceholder}><Text>👤</Text></View>
                <View>
                    <Text style={styles.commAuthor}>{item.author}</Text>
                    <Text style={styles.commDate}>{item.date}</Text>
                </View>
            </View>

            {/* Imagem Grande */}
            <Image source={{ uri: item.image }} style={styles.commImage} resizeMode="cover" />

            {/* Rodapé: Ações + Descrição */}
            <View style={styles.commFooter}>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={{marginRight: 15}}><Text style={{fontSize: 22}}>❤️</Text></TouchableOpacity>
                    <TouchableOpacity><Text style={{fontSize: 22}}>💬</Text></TouchableOpacity>
                </View>

                {item.description ? (
                    <Text style={styles.commDescription}>
                        <Text style={{fontWeight: 'bold'}}>{item.author}</Text> {item.description}
                    </Text>
                ) : null}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>

            {/* --- ABAS DE NAVEGAÇÃO --- */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'RACAS' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('RACAS')}
                >
                    <Text style={[styles.tabText, activeTab === 'RACAS' && styles.tabTextActive]}>🐕 Explorar Raças</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'COMUNIDADE' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('COMUNIDADE')}
                >
                    <Text style={[styles.tabText, activeTab === 'COMUNIDADE' && styles.tabTextActive]}>📸 Comunidade</Text>
                </TouchableOpacity>
            </View>

            {/* --- CONTEÚDO: RAÇAS --- */}
            {activeTab === 'RACAS' && (
                <FlatList
                    data={breeds}
                    keyExtractor={(item, index) => `breed-${item.id}-${index}`}
                    renderItem={renderBreedItem}
                    onRefresh={handleRefreshBreeds}
                    refreshing={isRefreshingBreeds}
                    onEndReached={handleLoadMoreBreeds}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={loadingBreeds && <ActivityIndicator style={styles.centerLoader} color="#D81B60" />}
                    ListFooterComponent={loadingMoreBreeds && <ActivityIndicator style={{padding: 20}} color="#D81B60" />}
                />
            )}

            {/* --- CONTEÚDO: COMUNIDADE --- */}
            {activeTab === 'COMUNIDADE' && (
                <>
                    <FlatList
                        data={posts}
                        keyExtractor={(item) => `post-${item.id}`}
                        renderItem={renderCommunityPost}
                        onRefresh={handleRefreshPosts}
                        refreshing={isRefreshingPosts}
                        ListEmptyComponent={
                            loadingPosts
                                ? <ActivityIndicator style={styles.centerLoader} color="#FF69B4" size="large" />
                                : <Text style={styles.emptyText}>Sem partilhas ainda. Sê o primeiro!</Text>
                        }
                    />

                    {/* Botão flutuante só aparece na aba Comunidade */}
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => navigation.navigate('CreatePost')}
                    >
                        <Text style={styles.fabText}>+</Text>
                    </TouchableOpacity>
                </>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },

    tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 3, marginBottom: 5 },
    tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabButtonActive: { borderBottomColor: '#FF69B4', backgroundColor: '#FFF0F5' },
    tabText: { fontSize: 15, fontWeight: 'bold', color: '#999' },
    tabTextActive: { color: '#FF69B4' },

    centerLoader: { marginTop: 50 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },

    cardBreed: { backgroundColor: "#FFE4E1", margin: 15, borderRadius: 20, overflow: "hidden", elevation: 4 },
    imageBreed: { width: "100%", height: 220 },
    textContainer: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    nameBreed: { fontSize: 22, fontWeight: "bold", color: "#D81B60", flex: 1 },
    customIcon: { width: 30, height: 30, resizeMode: 'contain' },
    temperament: { fontSize: 14, color: "#880E4F", marginTop: 5 },
    ctaContainer: { marginTop: 15, backgroundColor: '#FF69B4', padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
    ctaText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    cardCommunity: { backgroundColor: '#FFF', marginBottom: 15, marginHorizontal: 0, elevation: 2 },

    commHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    avatarPlaceholder: { width: 35, height: 35, borderRadius: 20, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    commAuthor: { fontWeight: 'bold', color: '#000', fontSize: 14 },
    commDate: { color: '#888', fontSize: 11 },

    commImage: { width: '100%', height: 350, backgroundColor: '#f0f0f0' },

    commFooter: { padding: 10 },
    actionRow: { flexDirection: 'row', marginBottom: 8 },
    commDescription: { color: '#333', fontSize: 14, lineHeight: 20 },

    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});