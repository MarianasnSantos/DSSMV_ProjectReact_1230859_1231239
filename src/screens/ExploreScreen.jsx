import React, { useEffect, useState, useCallback } from "react";
import {
    View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity,
    SafeAreaView, RefreshControl, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from "react-native";
import { translateTemperament } from "../utils/translations";
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions";
import { RESTDB_API_KEY, RESTDB_BASE_URL, DOG_API_URL, DOG_API_KEY } from "../config/ApiKeys";
import { theme } from "../styles/theme";

const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');

export default function ExploreScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('RACAS');
    const [favorites, setFavorites] = useState(AuthStore.getState().favorites || []);
    const [isLoggedIn, setIsLoggedIn] = useState(AuthStore.getState().isLoggedIn);
    const [user, setUser] = useState(AuthStore.getState().user);
    const [breeds, setBreeds] = useState([]);
    const [loadingBreeds, setLoadingBreeds] = useState(true);
    const [loadingMoreBreeds, setLoadingMoreBreeds] = useState(false);
    const [page, setPage] = useState(0);
    const [isRefreshingBreeds, setIsRefreshingBreeds] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [isRefreshingPosts, setIsRefreshingPosts] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [commentsList, setCommentsList] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);

    const formatCommentDate = (dateVal) => {
        if (!dateVal) return "Agora";
        if (typeof dateVal === 'string' && dateVal.includes(' às ')) return dateVal;
        const date = new Date(dateVal);
        if (isNaN(date.getTime()) || date.getFullYear() <= 1970) return typeof dateVal === 'string' ? dateVal : "Recentemente";
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

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

    const fetchBreeds = async (pageNumber, shouldRefresh = false) => {
        try {
            if (pageNumber === 0 && !shouldRefresh) setLoadingBreeds(true);
            else if (!shouldRefresh) setLoadingMoreBreeds(true);
            const response = await fetch(`${DOG_API_URL}/breeds?limit=10&page=${pageNumber}`, { headers: { 'x-api-key': DOG_API_KEY } });
            const data = await response.json();
            const breedsWithImages = await Promise.all(
                data.map(async (breed) => {
                    let imageUrl = breed.image?.url;
                    if (!imageUrl && breed.reference_image_id) {
                        try {
                            const imgRes = await fetch(`${DOG_API_URL}/images/${breed.reference_image_id}`, { headers: { 'x-api-key': DOG_API_KEY } });
                            const imgData = await imgRes.json();
                            imageUrl = imgData.url;
                        } catch { imageUrl = "https://placehold.co/300x200?text=Sem+imagem"; }
                    }
                    return { ...breed, id: breed.id.toString(), imageUrl: imageUrl || "https://placehold.co/300x200?text=Sem+imagem", translatedTemperament: translateTemperament(breed.temperament) };
                })
            );
            setBreeds(prev => shouldRefresh ? breedsWithImages : [...prev, ...breedsWithImages]);
        } catch (error) { console.log("Erro API Raças:", error); }
        finally { setLoadingBreeds(false); setLoadingMoreBreeds(false); setIsRefreshingBreeds(false); }
    };

    const handleLoadMoreBreeds = () => { if (!loadingMoreBreeds && breeds.length > 0) { const nextPage = page + 1; setPage(nextPage); fetchBreeds(nextPage); } };
    const handleRefreshBreeds = () => { setIsRefreshingBreeds(true); setPage(0); fetchBreeds(0, true); };

    const fetchCommunityPosts = async () => {
        setLoadingPosts(true);
        try {
            const response = await fetch(`${RESTDB_BASE_URL}/posts`, { method: 'GET', headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY, "cache-control": "no-cache" } });
            const data = await response.json();
            setPosts(Array.isArray(data) ? data.reverse() : []);
        } catch (error) { console.log("Erro posts:", error); } finally { setLoadingPosts(false); setIsRefreshingPosts(false); }
    };

    const getOrderedPosts = () => {
        if (!posts || posts.length === 0) return [];
        // Ordena pelo campo createdAt criado no ecrã de publicação
        return [...posts].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA; // Mais recente no topo
        });
    };

    const handleDeletePost = async (postId) => {
        Alert.alert("Eliminar", "Apagar esta partilha?", [{ text: "Cancelar" }, { text: "Apagar", style: "destructive", onPress: async () => {
                try { await fetch(`${RESTDB_BASE_URL}/posts/${postId}`, { method: 'DELETE', headers: { "x-apikey": RESTDB_API_KEY } }); setPosts(prev => prev.filter(p => p._id !== postId)); } catch (e) { console.log(e); }
            }}]);
    };

    const openComments = async (post) => {
        setCurrentPostId(post._id); setModalVisible(true); setLoadingComments(true); setEditingCommentId(null); setNewComment("");
        try {
            const res = await fetch(`${RESTDB_BASE_URL}/comments?q=${JSON.stringify({ postId: post._id })}`, { headers: { "x-apikey": RESTDB_API_KEY, "cache-control": "no-cache" } });
            const data = await res.json(); setCommentsList(Array.isArray(data) ? data : []);
        } catch (e) { console.log(e); } finally { setLoadingComments(false); }
    };

    const handleSendComment = async () => {
        if (newComment.trim() === "" || !user) return;
        const now = new Date();
        const dataStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (editingCommentId) {
            try {
                await fetch(`${RESTDB_BASE_URL}/comments/${editingCommentId}`, { method: "PUT", headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY }, body: JSON.stringify({ text: newComment, date: dataStr + " (editado)" }) });
                setCommentsList(prev => prev.map(c => c._id === editingCommentId ? { ...c, text: newComment, date: dataStr + " (editado)" } : c));
                setEditingCommentId(null); setNewComment("");
            } catch (e) { Alert.alert("Erro", "Falha ao editar."); }
        } else {
            try {
                const res = await fetch(`${RESTDB_BASE_URL}/comments`, { method: "POST", headers: { "content-type": "application/json", "x-apikey": RESTDB_API_KEY }, body: JSON.stringify({ postId: currentPostId, author: user.username || user.name, userId: user._id || user.id, text: newComment, date: dataStr }) });
                const saved = await res.json(); setCommentsList(prev => [...prev, saved]); setNewComment("");
            } catch (e) { console.log(e); }
        }
    };

    const handleDeleteComment = async (commentId) => {
        Alert.alert("Eliminar", "Apagar comentário?", [{ text: "Não" }, { text: "Sim", style: "destructive", onPress: async () => {
                setCommentsList(prev => prev.filter(c => c._id !== commentId));
                await fetch(`${RESTDB_BASE_URL}/comments/${commentId}`, { method: 'DELETE', headers: { "x-apikey": RESTDB_API_KEY } });
            }}]);
    };

    const renderFavoriteIcon = (item) => {
        if (!isLoggedIn) return null;
        const isFav = favorites.includes(item.id.toString());
        return (
            <TouchableOpacity onPress={() => PetActions.toggleFavorite(item.id.toString())}>
                <Image source={isFav ? STAR_FILLED : STAR_OUTLINE} style={[styles.customIcon, { tintColor: theme.colors.primary }]} />
            </TouchableOpacity>
        );
    };

    const renderBreedItem = ({ item }) => (
        <TouchableOpacity style={styles.cardBreed} onPress={() => navigation.navigate('AnimalsFeed', { smartTemperament: item.temperament || "" })} activeOpacity={0.9}>
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


    //APAGAR POST SE FOR O AUTOR
    const renderCommunityPost = ({ item }) => {
        const isOwner = String(user?._id || user?.id) === String(item.authorId);
        return (
            <View style={styles.cardCommunity}>
                <View style={styles.commHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={styles.avatarPlaceholder}><Text style={{color: theme.colors.textPrimary}}>👤</Text></View>
                        <View>
                            <Text style={styles.commAuthor}>{item.author}</Text>
                            <Text style={styles.commDate}>{formatCommentDate(item.date)}</Text>
                        </View>
                    </View>



                    {
                        /* Botões de editar/apagar apenas se for o meu post */
                    }

                    {isOwner && <TouchableOpacity onPress={() => handleDeletePost(item._id)}><Text style={{ fontSize: 20, color: theme.colors.primary }}>🗑️</Text></TouchableOpacity>}
                </View>
                <Image source={{ uri: item.image }} style={styles.commImage} resizeMode="cover" />
                <View style={styles.commFooter}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => openComments(item)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 22, color: theme.colors.primary }}>💬 <Text style={{fontSize: 14, color: theme.colors.textSecondary}}>Comentar</Text></Text>
                        </TouchableOpacity>
                    </View>
                    {item.description ? <Text style={styles.commDescription}><Text style={{ fontWeight: 'bold' }}>{item.author}</Text> {item.description}</Text> : null}
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
                <FlatList data={breeds} keyExtractor={(item) => item.id.toString()} renderItem={renderBreedItem} onRefresh={handleRefreshBreeds} refreshing={isRefreshingBreeds} onEndReached={handleLoadMoreBreeds}
                          ListEmptyComponent={loadingBreeds && <ActivityIndicator style={styles.centerLoader} color={theme.colors.primary} />}
                          ListFooterComponent={loadingMoreBreeds && <ActivityIndicator style={{padding: 20}} color={theme.colors.primary} />}
                />
            ) : (
                <>
                    <FlatList
                        data={getOrderedPosts()}
                        keyExtractor={(item) => `post-${item._id || item.id || Math.random()}`}
                        renderItem={renderCommunityPost}
                        onRefresh={fetchCommunityPosts}
                        refreshing={isRefreshingPosts}
                        extraData={posts}
                              ListEmptyComponent={loadingPosts ? <ActivityIndicator style={styles.centerLoader} color={theme.colors.primary} size="large" /> : <Text style={styles.emptyText}>Sem partilhas ainda.</Text>}
                    />
                    <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')}><Text style={styles.fabText}>+</Text></TouchableOpacity>
                </>
            )}


            {
                /* Botões de editar/apagar apenas se for o meu comentario */
            }

            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingCommentId ? "Editar ✏️" : "Comentários 💬"}</Text>
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
                        <View style={[styles.inputContainer, editingCommentId && { borderColor: theme.colors.primary }]}>
                            <TextInput style={styles.input} placeholder="Escreve algo..." value={newComment} onChangeText={setNewComment} placeholderTextColor={theme.colors.textPlaceholder} />
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
    container: { flex: 1, backgroundColor: theme.colors.background },
    tabsContainer: { flexDirection: 'row', backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border, elevation: 2 },
    tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabButtonActive: { borderBottomColor: theme.colors.primary },
    tabText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textSecondary },
    tabTextActive: { color: theme.colors.primary },


    cardBreed: {
        backgroundColor: theme.colors.card,
        margin: 15, borderRadius: 16, overflow: "hidden",
        // Apenas sombra rosa, sem borda sólida
        elevation: 4, shadowColor: theme.colors.shadow, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }
    },
    imageBreed: { width: "100%", height: 220 },
    textContainer: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    nameBreed: { fontSize: 22, fontWeight: "bold", color: theme.colors.primary, flex: 1 },
    customIcon: { width: 30, height: 30, resizeMode: 'contain' },
    temperament: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 5 },
    ctaContainer: { marginTop: 15, backgroundColor: theme.colors.primary, padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
    ctaText: { color: theme.colors.white, fontWeight: 'bold', fontSize: 12 },

    cardCommunity: { backgroundColor: theme.colors.card, marginBottom: 15, elevation: 2, borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginHorizontal: 10, borderRadius: 15 },
    commHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    avatarPlaceholder: { width: 35, height: 35, borderRadius: 20, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: theme.colors.border },
    commAuthor: { fontWeight: 'bold', fontSize: 14, color: theme.colors.textPrimary },
    commDate: { color: theme.colors.textSecondary, fontSize: 11 },
    commImage: { width: '100%', height: 350, backgroundColor: theme.colors.background },
    commFooter: { padding: 10 },
    actionRow: { flexDirection: 'row', marginBottom: 8 },
    commDescription: { color: theme.colors.textPrimary, fontSize: 14 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: theme.colors.shadow },
    fabText: { color: theme.colors.white, fontSize: 30, fontWeight: 'bold', marginTop: -2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(93, 58, 70, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '75%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderColor: theme.colors.border, borderBottomWidth: 1, paddingBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
    closeBtn: { color: theme.colors.textSecondary },
    commentItem: { marginBottom: 15, borderBottomWidth: 1, borderColor: theme.colors.border, paddingBottom: 5 },
    commentAuthor: { fontWeight: 'bold', fontSize: 13, color: theme.colors.textPrimary },
    commentText: { fontSize: 14, color: theme.colors.textPrimary, marginTop: 2 },
    commentDate: { fontSize: 10, color: theme.colors.textSecondary },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 10 },
    input: { flex: 1, backgroundColor: theme.colors.inputBackground, borderRadius: 20, paddingHorizontal: 15, height: 40, marginRight: 10, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border },
    sendBtn: { color: theme.colors.primary, fontWeight: 'bold' },
    centerLoader: { marginTop: 50 },
    emptyText: { textAlign: 'center', marginTop: 50, color: theme.colors.textSecondary, fontSize: 16 },
});