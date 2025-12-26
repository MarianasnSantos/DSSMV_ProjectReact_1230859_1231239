import React, { useEffect, useState, useCallback } from "react";
import {
    View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity,
    SafeAreaView, RefreshControl, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
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
    const [activeTab, setActiveTab] = useState('RACAS');
    const [favorites, setFavorites] = useState(AuthStore.getState().favorites || []);
    const [isLoggedIn, setIsLoggedIn] = useState(AuthStore.getState().isLoggedIn);
    const [user, setUser] = useState(AuthStore.getState().user);

    // --- ESTADOS: RAÇAS ---
    const [breeds, setBreeds] = useState([]);
    const [loadingBreeds, setLoadingBreeds] = useState(true);
    const [loadingMoreBreeds, setLoadingMoreBreeds] = useState(false);
    const [page, setPage] = useState(0);
    const [isRefreshingBreeds, setIsRefreshingBreeds] = useState(false);

    // --- ESTADOS: COMUNIDADE ---
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [isRefreshingPosts, setIsRefreshingPosts] = useState(false);

    // --- ESTADOS: COMENTÁRIOS & EDIÇÃO ---
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [commentsList, setCommentsList] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);

    // Função auxiliar para datas
    const formatCommentDate = (dateVal) => {
        if (!dateVal) return "Agora";
        if (typeof dateVal === 'string' && dateVal.includes(' às ')) return dateVal;
        if (typeof dateVal === 'string' && dateVal.includes('/2025')) return dateVal.replace('/2025', '');

        const date = new Date(dateVal);
        if (isNaN(date.getTime()) || date.getFullYear() <= 1970) {
            return typeof dateVal === 'string' ? dateVal : "Recentemente";
        }
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        return `${dia}/${mes}`;
    };

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
        } catch (error) { console.log("Erro API Raças:", error); }
        finally { setLoadingBreeds(false); setLoadingMoreBreeds(false); setIsRefreshingBreeds(false); }
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
        const isFav = favorites.includes(favId);
        return (
            <TouchableOpacity onPress={() => PetActions.toggleFavorite(favId)}>
                <Image
                    source={isFav ? STAR_FILLED : STAR_OUTLINE}
                    style={[styles.customIcon, !isFav && { tintColor: '#FFC0CB' }]}
                />
            </TouchableOpacity>
        );
    };

    const renderBreedItem = ({ item }) => (
        <TouchableOpacity style={styles.cardBreed} onPress={() => handleGoToFeed(item)} activeOpacity={0.9}>
            <Image source={{ uri: item.imageUrl }} style={styles.imageBreed} />
            <View style={styles.textContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.nameBreed}>{item.name}</Text>
                    {renderFavoriteIcon(item)}
                </View>
                <Text style={styles.temperament}>{item.translatedTemperament || "Temperamento calmo"}</Text>
                <View style={styles.ctaContainer}><Text style={styles.ctaText}>🔍 Ver animais parecidos</Text></View>
            </View>
        </TouchableOpacity>
    );

    // ============================================================
    // 2. LÓGICA DA ABA "COMUNIDADE"
    // ============================================================
    const fetchCommunityPosts = async () => {
        setLoadingPosts(true);
        try {
            const response = await fetch(`${RESTDB_BASE_URL}/posts`, {
                method: 'GET',
                headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY, "cache-control": "no-cache" }
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

    const handleDeletePost = async (postId) => {
        Alert.alert("Eliminar", "Apagar esta partilha?", [
            { text: "Cancelar" },
            { text: "Apagar", style: "destructive", onPress: async () => {
                    try {
                        await fetch(`${RESTDB_BASE_URL}/posts/${postId}`, {
                            method: 'DELETE',
                            headers: { "x-apikey": RESTDB_API_KEY }
                        });
                        setPosts(prev => prev.filter(p => p._id !== postId));
                    } catch (e) { console.log(e); }
                }}
        ]);
    };

    // ============================================================
    // 3. LÓGICA DE COMENTÁRIOS
    // ============================================================
    const openComments = async (post) => {
        setCurrentPostId(post._id);
        setModalVisible(true);
        setLoadingComments(true);
        setEditingCommentId(null);
        setNewComment("");
        try {
            const query = JSON.stringify({ postId: post._id });
            const response = await fetch(`${RESTDB_BASE_URL}/comments?q=${query}`, {
                headers: { "x-apikey": RESTDB_API_KEY, "cache-control": "no-cache" }
            });
            const data = await response.json();
            setCommentsList(Array.isArray(data) ? data : []);
        } catch (e) { console.log(e); }
        finally { setLoadingComments(false); }
    };

    const handleSendComment = async () => {
        if (newComment.trim() === "" || !user) return;
        const now = new Date();
        const dataString = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (editingCommentId) {
            try {
                await fetch(`${RESTDB_BASE_URL}/comments/${editingCommentId}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY },
                    body: JSON.stringify({ text: newComment, date: dataString + " (editado)" })
                });
                setCommentsList(prev => prev.map(c =>
                    c._id === editingCommentId ? { ...c, text: newComment, date: dataString + " (editado)" } : c
                ));
                setEditingCommentId(null);
                setNewComment("");
            } catch (e) { Alert.alert("Erro", "Falha ao editar."); }
        } else {
            const commentData = {
                postId: currentPostId,
                author: user.username || user.name,
                userId: user._id || user.id,
                text: newComment,
                date: dataString
            };
            try {
                const res = await fetch(`${RESTDB_BASE_URL}/comments`, {
                    method: "POST",
                    headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY },
                    body: JSON.stringify(commentData)
                });
                const saved = await res.json();
                setCommentsList(prev => [...prev, saved]);
                setNewComment("");
            } catch (e) { console.log(e); }
        }
    };

    const handleDeleteComment = async (commentId) => {
        Alert.alert("Eliminar", "Apagar comentário?", [
            { text: "Não" },
            { text: "Sim", style: "destructive", onPress: async () => {
                    setCommentsList(prev => prev.filter(c => c._id !== commentId));
                    await fetch(`${RESTDB_BASE_URL}/comments/${commentId}`, { method: 'DELETE', headers: { "x-apikey": RESTDB_API_KEY } });
                }}
        ]);
    };

    const renderCommunityPost = ({ item }) => {
        const isOwner = String(user?._id || user?.id) === String(item.authorId);
        return (
            <View style={styles.cardCommunity}>
                <View style={styles.commHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={styles.avatarPlaceholder}><Text>👤</Text></View>
                        <View>
                            <Text style={styles.commAuthor}>{item.author}</Text>
                            <Text style={styles.commDate}>{formatCommentDate(item.date)}</Text>
                        </View>
                    </View>
                    {isOwner && <TouchableOpacity onPress={() => handleDeletePost(item._id)}><Text style={{ fontSize: 20 }}>🗑️</Text></TouchableOpacity>}
                </View>
                <Image source={{ uri: item.image }} style={styles.commImage} resizeMode="cover" />
                <View style={styles.commFooter}>

                    {}
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => openComments(item)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 22 }}>💬 <Text style={{fontSize: 14, color: '#555'}}>Comentar</Text></Text>
                        </TouchableOpacity>
                    </View>

                    {item.description ? (
                        <Text style={styles.commDescription}><Text style={{ fontWeight: 'bold' }}>{item.author}</Text> {item.description}</Text>
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

            {activeTab === 'RACAS' ? (
                <FlatList data={breeds} keyExtractor={(item) => item.id.toString()} renderItem={renderBreedItem} onRefresh={handleRefreshBreeds} refreshing={isRefreshingBreeds} onEndReached={handleLoadMoreBreeds} />
            ) : (
                <>
                    <FlatList
                        data={posts}
                        // 👇 Mantém a correção do _id para não dar erro vermelho
                        keyExtractor={(item) => `post-${item._id || item.id || Math.random()}`}
                        renderItem={renderCommunityPost}
                        onRefresh={fetchCommunityPosts}
                        refreshing={isRefreshingPosts}
                    />
                    <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')}><Text style={styles.fabText}>+</Text></TouchableOpacity>
                </>
            )}

            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingCommentId ? "Editar Comentário ✏️" : "Comentários 💬"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeBtn}>Fechar ✕</Text></TouchableOpacity>
                        </View>
                        <FlatList data={commentsList} keyExtractor={(item, index) => index.toString()} renderItem={({ item }) => {
                            const isMyComment = String(user?._id || user?.id) === String(item.userId);
                            return (
                                <View style={styles.commentItem}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={styles.commentAuthor}>{item.author}</Text>
                                        <Text style={styles.commentDate}>{formatCommentDate(item.date)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.commentText}>{item.text}</Text>
                                        {isMyComment && (
                                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                                <TouchableOpacity onPress={() => {setNewComment(item.text); setEditingCommentId(item._id);}}><Text>✏️</Text></TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteComment(item._id)}><Text>🗑️</Text></TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        }} />
                        <View style={[styles.inputContainer, editingCommentId && { borderColor: '#FF69B4', borderWidth: 1 }]}>
                            <TextInput style={styles.input} placeholder="Escreve algo..." value={newComment} onChangeText={setNewComment} />
                            <TouchableOpacity onPress={handleSendComment}><Text style={styles.sendBtn}>{editingCommentId ? "GUARDAR" : "Enviar"}</Text></TouchableOpacity>
                            {editingCommentId && <TouchableOpacity onPress={() => {setEditingCommentId(null); setNewComment("");}}><Text style={{marginLeft: 10, color: 'red'}}>✕</Text></TouchableOpacity>}
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
    cardBreed: { backgroundColor: "#FFE4E1", margin: 15, borderRadius: 20, overflow: "hidden", elevation: 4 },
    imageBreed: { width: "100%", height: 220 },
    textContainer: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    nameBreed: { fontSize: 22, fontWeight: "bold", color: "#D81B60", flex: 1 },
    customIcon: { width: 30, height: 30, resizeMode: 'contain' },
    temperament: { fontSize: 14, color: "#880E4F", marginTop: 5 },
    ctaContainer: { marginTop: 15, backgroundColor: '#FF69B4', padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
    ctaText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    cardCommunity: { backgroundColor: '#FFF', marginBottom: 15, elevation: 2 },
    commHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    avatarPlaceholder: { width: 35, height: 35, borderRadius: 20, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    commAuthor: { fontWeight: 'bold', fontSize: 14 },
    commDate: { color: '#888', fontSize: 11 },
    commImage: { width: '100%', height: 350 },
    commFooter: { padding: 10 },
    actionRow: { flexDirection: 'row', marginBottom: 8 },
    commDescription: { color: '#333', fontSize: 14 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '75%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#D81B60' },
    closeBtn: { color: '#888' },
    commentItem: { marginBottom: 15, borderBottomWidth: 1, borderColor: '#f0f0f0', paddingBottom: 5 },
    commentAuthor: { fontWeight: 'bold', fontSize: 13 },
    commentText: { fontSize: 14, color: '#555', marginTop: 2 },
    commentDate: { fontSize: 10, color: '#999' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderColor: '#EEE', paddingTop: 10 },
    input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 15, height: 40, marginRight: 10 },
    sendBtn: { color: '#FF69B4', fontWeight: 'bold' }
});