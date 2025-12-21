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
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { translateTemperament } from "../utils/translations";

// --- Flux ---
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";

import {
    RESTDB_API_KEY,
    RESTDB_BASE_URL,
    DOG_API_URL,
    DOG_API_KEY
} from "../config/ApiKeys";

const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');

export default function ExploreScreen({ navigation }) {

    // --- ESTADOS GERAIS ---
    const [activeTab, setActiveTab] = useState('RACAS'); // 'RACAS' ou 'COMUNIDADE'
    const [favorites, setFavorites] = useState(AuthStore.getState().favorites || []);
    const [isLoggedIn, setIsLoggedIn] = useState(AuthStore.getState().isLoggedIn);

    // --- ESTADOS: RAÇAS ---
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

    // --- ESTADOS: COMENTÁRIOS ---
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [commentsList, setCommentsList] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [user, setUser] = useState(AuthStore.getState().user);

    // --- CICLO DE VIDA ---
    useEffect(() => {
        const onAuthChange = () => {
            const state = AuthStore.getState();
            setFavorites(state.favorites || []);
            setIsLoggedIn(state.isLoggedIn);
            setUser(state.user);
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

            const response = await fetch(`${DOG_API_URL}/breeds?limit=10&page=${pageNumber}`, {
                headers: { 'x-api-key': DOG_API_KEY }
            });
            const data = await response.json();

            const breedsWithImages = await Promise.all(
                data.map(async (breed) => {
                    let imageUrl = breed.image?.url;
                    if (!imageUrl && breed.reference_image_id) {
                        try {
                            const imgRes = await fetch(`${DOG_API_URL}/images/${breed.reference_image_id}`, {
                                headers: { 'x-api-key': DOG_API_KEY }
                            });
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
            const response = await fetch(`${RESTDB_BASE_URL}/posts`, {
                method: 'GET',
                headers: {
                    "content-type": "application/json",
                    "x-apikey": RESTDB_API_KEY,
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

    // --- FUNÇÃO PARA APAGAR POST ---
    const handleDeletePost = async (postId) => {
        Alert.alert(
            "Eliminar",
            "Tens a certeza que queres apagar esta partilha?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Apagar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // 👇 USA VARIÁVEIS SEGURAS
                            await fetch(`${RESTDB_BASE_URL}/posts/${postId}`, {
                                method: 'DELETE',
                                headers: {
                                    "content-type": "application/json",
                                    "x-apikey": RESTDB_API_KEY,
                                    "cache-control": "no-cache"
                                }
                            });
                            setPosts(prev => prev.filter(p => p._id !== postId));
                        } catch (error) {
                            console.log("Erro ao apagar:", error);
                        }
                    }
                }
            ]
        );
    };

    // --- APAGAR COMENTÁRIO ---
    const handleDeleteComment = async (commentId) => {
        Alert.alert("Eliminar", "Apagar este comentário?", [
            { text: "Cancelar" },
            { text: "Sim", style: "destructive", onPress: async () => {
                    try {
                        setCommentsList(prev => prev.filter(c => c._id !== commentId));

                        await fetch(`${RESTDB_BASE_URL}/comments/${commentId}`, {
                            method: 'DELETE',
                            headers: { "x-apikey": RESTDB_API_KEY }
                        });
                    } catch (e) { console.log(e); }
                }}
        ]);
    };

    const handleRefreshPosts = () => {
        setIsRefreshingPosts(true);
        fetchCommunityPosts();
    };

    // --- FUNÇÕES DE COMENTÁRIOS ---
    const openComments = async (post) => {
        setCurrentPostId(post._id);
        setModalVisible(true);
        setLoadingComments(true);
        setCommentsList([]);

        try {
            const query = JSON.stringify({ postId: post._id });
            // 👇 USA VARIÁVEIS SEGURAS
            const response = await fetch(`${RESTDB_BASE_URL}/comments?q=${query}`, {
                method: 'GET',
                headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY, "cache-control": "no-cache" }
            });
            const data = await response.json();
            setCommentsList(Array.isArray(data) ? data : []);
        } catch (error) { Alert.alert("Erro", "Não foi possível carregar comentários"); }
        finally { setLoadingComments(false); }
    };

    const handleSendComment = async () => {
        if (newComment.trim() === "") return;
        if (!user) return Alert.alert("Ops", "Precisas de estar logado.");

        const now = new Date();
        const dia = String(now.getDate()).padStart(2, '0');
        const mes = String(now.getMonth() + 1).padStart(2, '0');
        const hora = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const dataFormatada = `${dia}/${mes} às ${hora}:${min}`;

        const commentData = {
            postId: currentPostId,
            author: user.username || user.name || "Anónimo",
            userId: user._id || user.id,
            text: newComment,
            date: dataFormatada
        };

        setCommentsList(prev => [...prev, { ...commentData, _id: Math.random().toString() }]);
        setNewComment("");

        try {

            await fetch(`${RESTDB_BASE_URL}/comments`, {
                method: "POST",
                headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY },
                body: JSON.stringify(commentData)
            });
        } catch (error) { console.log("Erro ao enviar comentário"); }
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
    const renderCommunityPost = ({ item }) => {
        const user = AuthStore.getState().user;
        const currentUserId = user?._id || user?.id;
        const isOwner = String(currentUserId) === String(item.authorId);

        return (
            <View style={styles.cardCommunity}>
                <View style={styles.commHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        <View style={styles.avatarPlaceholder}><Text>👤</Text></View>
                        <View>
                            <Text style={styles.commAuthor}>{item.author}</Text>
                            <Text style={styles.commDate}>{item.date}</Text>
                        </View>
                    </View>
                    {isOwner && (
                        <TouchableOpacity onPress={() => handleDeletePost(item._id)}>
                            <Text style={{fontSize: 20}}>🗑️</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Image source={{ uri: item.image }} style={styles.commImage} resizeMode="cover" />

                <View style={styles.commFooter}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={{marginRight: 15}}><Text style={{fontSize: 22}}>❤️</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => openComments(item)}>
                            <Text style={{fontSize: 22}}>💬</Text>
                        </TouchableOpacity>
                    </View>

                    {item.description ? (
                        <Text style={styles.commDescription}>
                            <Text style={{fontWeight: 'bold'}}>{item.author}</Text> {item.description}
                        </Text>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'RACAS' && styles.tabButtonActive]} onPress={() => setActiveTab('RACAS')}>
                    <Text style={[styles.tabText, activeTab === 'RACAS' && styles.tabTextActive]}>🐕 Explorar Raças</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'COMUNIDADE' && styles.tabButtonActive]} onPress={() => setActiveTab('COMUNIDADE')}>
                    <Text style={[styles.tabText, activeTab === 'COMUNIDADE' && styles.tabTextActive]}>📸 Comunidade</Text>
                </TouchableOpacity>
            </View>

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

            {activeTab === 'COMUNIDADE' && (
                <>
                    <FlatList
                        data={posts}
                        keyExtractor={(item) => `post-${item._id || item.id || Math.random()}`}
                        renderItem={renderCommunityPost}
                        onRefresh={handleRefreshPosts}
                        refreshing={isRefreshingPosts}
                        ListEmptyComponent={loadingPosts ? <ActivityIndicator style={styles.centerLoader} color="#FF69B4" size="large" /> : <Text style={styles.emptyText}>Sem partilhas ainda. Sê o primeiro!</Text>}
                    />
                    <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
                        <Text style={styles.fabText}>+</Text>
                    </TouchableOpacity>
                </>
            )}

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Comentários 💬</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtn}>Fechar ✕</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingComments ? (
                            <ActivityIndicator color="#FF69B4" style={{marginTop: 20}} />
                        ) : (
                            <FlatList
                                data={commentsList}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => {
                                    const isMyComment = String(user?._id || user?.id) === String(item.userId);
                                    return (
                                        <View style={styles.commentItem}>
                                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                                <Text style={styles.commentAuthor}>{item.author}</Text>
                                                <Text style={styles.commentDate}>{item.date}</Text>
                                            </View>
                                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                                <Text style={styles.commentText}>{item.text}</Text>
                                                {isMyComment && (
                                                    <TouchableOpacity onPress={() => handleDeleteComment(item._id)}>
                                                        <Text style={{fontSize: 14, color: '#FF0000'}}>🗑️</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    );
                                }}
                                ListEmptyComponent={<Text style={styles.emptyComments}>Sê o primeiro a comentar!</Text>}
                            />
                        )}

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input} placeholder="Escreve um comentário..."
                                value={newComment} onChangeText={setNewComment}
                            />
                            <TouchableOpacity onPress={handleSendComment}>
                                <Text style={styles.sendBtn}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderColor: '#EEE', paddingBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#D81B60' },
    closeBtn: { fontSize: 16, color: '#888' },
    commentItem: { marginBottom: 15, borderBottomWidth: 1, borderColor: '#f0f0f0', paddingBottom: 5 },
    commentAuthor: { fontWeight: 'bold', fontSize: 13, color: '#333' },
    commentText: { fontSize: 14, color: '#555', marginVertical: 2 },
    commentDate: { fontSize: 10, color: '#999' },
    emptyComments: { textAlign: 'center', marginTop: 20, color: '#aaa' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderColor: '#EEE', paddingTop: 10 },
    input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 15, height: 40, marginRight: 10 },
    sendBtn: { color: '#FF69B4', fontWeight: 'bold' }
});