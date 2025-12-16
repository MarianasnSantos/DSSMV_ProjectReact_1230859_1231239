// src/screens/AnimalsFeedScreen.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    View, Text, FlatList, Image, ActivityIndicator, StyleSheet,
    TouchableOpacity, TextInput, Alert,
    KeyboardAvoidingView, Platform,
    Modal,
    SafeAreaView
} from "react-native";
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";
import { translateTemperament } from "../utils/translations";

// Carregamos os dois ficheiros para a estrela
const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');


// --- Hooks/Auxiliares (Inalterados) ---
function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => setState(PetStore.getState());
        PetStore.addChangeListener(handleChange);
        return () => PetStore.removeListener(handleChange);
    }, []);
    return state;
}

const getAuthData = () => {
    const { user, favorites, isLoggedIn } = AuthStore.getState();
    return {
        userId: user?._id || user?.id ? String(user._id || user.id) : null,
        favorites: favorites || [],
        isLoggedIn
    };
};

const handleAdoption = (animalId) => {
    const { userId } = getAuthData();
    if (!userId) {
        Alert.alert("Erro", "Login necessário.");
        return;
    }
    PetActions.startAdoption(animalId, userId);
};

const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
};

// ----------------------------------------------------------------------
// COMPONENTE MODAL DE PESQUISA DE RAÇA (Inalterado)
// ----------------------------------------------------------------------
const BreedSearchModal = React.memo(({ isVisible, onClose, onSelect, allBreeds, selectedBreedName, modalStyles }) => {
    const [searchText, setSearchText] = useState('');

    const filteredBreeds = useMemo(() => {
        const breedList = ['Todos', 'Sem Raça', ...allBreeds.filter(b => b !== 'Todos')];

        if (!searchText) {
            return breedList.slice(0, 20);
        }

        const lowerSearch = searchText.toLowerCase();

        return breedList.filter(breed => breed.toLowerCase().includes(lowerSearch));
    }, [searchText, allBreeds]);

    const handleSelect = (breed) => {
        onSelect(breed);
        setSearchText('');
        onClose();
    };

    const renderBreedItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={[modalStyles.modalItem, item === selectedBreedName && modalStyles.modalItemSelected]}
            onPress={() => handleSelect(item)}
        >
            <Text style={modalStyles.modalItemText}>{item}</Text>
        </TouchableOpacity>
    ), [selectedBreedName, modalStyles, handleSelect]);

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={modalStyles.modalContainer}>
                    <View style={modalStyles.modalHeader}>
                        <Text style={modalStyles.modalTitle}>Pesquisar Raça</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Text style={modalStyles.closeButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={modalStyles.modalSearchInput}
                        placeholder="Digite o nome da raça (ex: Poodle)"
                        value={searchText}
                        onChangeText={setSearchText}
                        autoFocus={true}
                    />
                    <FlatList
                        data={filteredBreeds}
                        renderItem={renderBreedItem}
                        keyExtractor={(item) => item}
                        initialNumToRender={10}
                        windowSize={5}
                        ListEmptyComponent={() => (
                            <Text style={modalStyles.emptyListText}>Nenhuma raça encontrada.</Text>
                        )}
                        ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
                        keyboardShouldPersistTaps='handled'
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
});


// ⭐️ Componente Principal ⭐️
export default function AnimalsFeedScreen({ navigation }) {
    const {
        animals = [],
        loading = false,
        breeds = [],
        filters = {}
    } = usePetStoreState() || {};

    const { favorites, isLoggedIn, userId } = getAuthData();
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);

    // ⭐️ ESTADO OTIMISTA: Rastreia cliques de favorito pendentes ⭐️
    const [optimisticChanges, setOptimisticChanges] = useState({});


    useEffect(() => {
        PetActions.loadAnimals();
    }, []);

    // EFEITO PARA LIMPAR ESTADO OTIMISTA
    useEffect(() => {
        setOptimisticChanges(prev => {
            const next = { ...prev };
            Object.keys(prev).forEach(id => {
                // Se o novo estado do Store for igual ao estado otimista, limpamos o override local.
                if (favorites.includes(id) === prev[id]) {
                    delete next[id];
                }
            });
            return next;
        });
    }, [favorites]);


    // -----------------------------------------------------------
    // LÓGICA DE FILTROS (Temperamento Corrigido)
    // -----------------------------------------------------------

    const getFilteredAnimals = () => {
        let filteredList = animals;

        // Filtro Raça
        if (filters.breed && filters.breed !== 'Todos') {
            if (filters.breed === 'Sem Raça') {
                filteredList = filteredList.filter(animal => !animal.breed || animal.breed.trim() === '');
            } else {
                filteredList = filteredList.filter(animal =>
                    (animal.breed === filters.breed) || (animal.name === filters.breed)
                );
            }
        }

        // Filtro Idade
        const minAge = parseInt(filters.minAge);
        if (!isNaN(minAge) && minAge > 0) {
            filteredList = filteredList.filter(animal => {
                let ageVal = animal.age ? parseInt(animal.age) : 0;
                if (!ageVal && animal.life_span) {
                    ageVal = parseInt(animal.life_span.replace(/\D/g, ""));
                }
                return ageVal >= minAge;
            });
        }

        // Filtro Temperamento (Pesquisa na versão traduzida)
        if (filters.temperament?.trim()) {
            const search = filters.temperament.toLowerCase().trim();
            filteredList = filteredList.filter(a =>
                translateTemperament(a.temperament).toLowerCase().includes(search)
            );
        }
        return filteredList;
    };

    const filteredAnimals = getFilteredAnimals();

    // HANDLER PARA SELEÇÃO DE RAÇA DO MODAL
    const handleSelectBreed = (breed) => {
        PetActions.setFilter('breed', breed);
        setIsBreedModalVisible(false);
    };

    // --- FAVORITOS / BOTÕES DE AUTOR ---
    const handleToggleFavorite = (id) => {
        const idString = id.toString();

        // Determina o estado de favorito ATUAL (otimista ou real)
        const isCurrentlyInStore = favorites.includes(idString);
        const isOptimistic = optimisticChanges[idString];

        const isFavBeforeClick = isOptimistic !== undefined ? isOptimistic : isCurrentlyInStore;
        const newFavState = !isFavBeforeClick;

        // Optimistic Update (Feedback visual imediato)
        setOptimisticChanges(prev => ({
            ...prev,
            [idString]: newFavState,
        }));

        // Dispara a ação (assíncrona)
        PetActions.toggleFavorite(id);
    };

    const handleEditAnimal = (animal) => {
        navigation.navigate('AddAnimal', { animalToEdit: animal });
    };

    const handleDeleteAnimal = (animalId, ownerId) => {
        Alert.alert("Apagar", "Tens a certeza?", [
            { text: "Cancelar" },
            {
                text: "Sim, Apagar",
                onPress: () => PetActions.deleteAnimal(animalId, ownerId)
            }
        ]);
    };

    const renderEditButton = (item) => {
        if (!userId) return null;
        if (!item.addedById || String(item.addedById) !== String(userId)) return null;

        return (
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditAnimal(item)}>
                <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
        );
    };

    const renderDeleteButton = (item) => {
        if (!userId) return null;
        if (!item.addedById || String(item.addedById) !== String(userId)) return null;

        return (
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAnimal(item.id, item.addedById)}>
                <Text style={styles.deleteButtonText}>Apagar</Text>
            </TouchableOpacity>
        );
    };

    // --- RENDER ---
    if (loading) return <ActivityIndicator size="large" color="#FF69B4" style={styles.loader} />;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            {/* Filtros */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={styles.breedInputButton}
                    onPress={() => setIsBreedModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.breedInputText,
                            (filters.breed === 'Todos' || !filters.breed) && styles.placeholderText
                        ]}
                        numberOfLines={1}
                    >
                        {filters.breed && filters.breed !== 'Todos' ? filters.breed : 'Raça (Pesquisar)'}
                    </Text>
                </TouchableOpacity>

                <TextInput
                    style={styles.textInputStyle}
                    placeholder="Idade (Anos)"
                    keyboardType="numeric"
                    placeholderTextColor="#000000"
                    value={filters.minAge}
                    onChangeText={(text) => PetActions.setFilter('minAge', text)}
                />
            </View>

            <TextInput
                style={styles.fullWidthSearchInput}
                placeholder="Pesquisar Temperamento"
                placeholderTextColor="#000000"
                value={filters.temperament}
                onChangeText={(text) => PetActions.setFilter('temperament', text)}
                multiline={false}
                keyboardShouldPersistTaps='handled'
            />

            {/* Lista */}
            <FlatList
                data={filteredAnimals}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                renderItem={({ item }) => {
                    const photo = item.photoUrl || item.image?.url || "https://placehold.co/300x200";
                    const idString = item.id.toString();

                    // CÁLCULO OTIMISTA DO ESTADO DO FAVORITO
                    const isCurrentlyInStore = favorites.includes(idString);
                    const optimisticState = optimisticChanges[idString];
                    const isFav = optimisticState !== undefined ? optimisticState : isCurrentlyInStore;


                    const locationDisplay = item.location;
                    const translatedTemperament = translateTemperament(item.temperament);

                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} />

                            <View style={styles.info}>
                                <View style={styles.headerContainer}>
                                    <Text style={styles.name}>{item.name}</Text>

                                    {isLoggedIn && (
                                        // ⭐️ Ícone de Favorito Permanente ⭐️
                                        <View style={styles.favoriteControlContainer}>
                                            <TouchableOpacity onPress={() => handleToggleFavorite(item.id)}>
                                                <Image
                                                    source={isFav ? STAR_FILLED : STAR_OUTLINE}
                                                    style={[
                                                        styles.customIcon,
                                                        // 1. Pinta a estrela vazia de rosa claro
                                                        !isFav && { tintColor: '#FFC0CB' },
                                                        // 2. ⭐️ REMOVIDO: favoriteIconBorder. Usamos apenas customIcon sem bordas por padrão. ⭐️
                                                    ]}
                                                />
                                            </TouchableOpacity>

                                            {/* ⭐️ Mensagem "Favorito" se o item estiver nos favoritos ⭐️ */}
                                            {isFav && (
                                                <Text style={styles.favoritePermanentText}>
                                                    Favorito
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.breedText}>{item.breed || "Sem Raça"}</Text>

                                <View style={styles.authorInfoContainer}>
                                    {item.addedBy && <Text style={styles.authorText}>Por: {item.addedBy}</Text>}
                                    {item.createdAt && (
                                        <Text style={styles.dateText}>
                                            Publicado em: {formatDate(item.createdAt)}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.separator} />

                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailValue}>🎂 {item.age ? item.age + " anos" : "Jovem"}</Text>

                                    {locationDisplay && (
                                        <Text style={styles.locationText}>
                                            📍 Coordenadas: {locationDisplay}
                                        </Text>
                                    )}

                                    {translatedTemperament && (
                                        <Text style={styles.detailValueFull}>
                                            ✨ {translatedTemperament}
                                        </Text>
                                    )}

                                    {item.contactNumber && (
                                        <Text style={styles.contactText}>
                                            📞 Contacto: {item.contactNumber}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={styles.adoptButton}
                                    onPress={() => handleAdoption(item.id)}
                                >
                                    <Text style={styles.adoptButtonText}>ADOTAR</Text>
                                </TouchableOpacity>

                                <View style={styles.authorButtonsContainer}>
                                    {renderEditButton(item)}
                                    {renderDeleteButton(item)}
                                </View>
                            </View>
                        </View>
                    );
                }}
                keyboardShouldPersistTaps='handled'
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAnimal')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <BreedSearchModal
                isVisible={isBreedModalVisible}
                onClose={() => setIsBreedModalVisible(false)}
                onSelect={handleSelectBreed}
                allBreeds={breeds}
                selectedBreedName={filters.breed || 'Todos'}
                modalStyles={modalStyles}
            />
        </KeyboardAvoidingView>
    );
}

// ----------------------------------------------------------------------
// ESTILOS
// ----------------------------------------------------------------------

const modalStyles = StyleSheet.create({
    modalContainer: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#FFF0F5' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#FFC0CB' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#D81B60' },
    closeButton: { padding: 10 },
    closeButtonText: { fontSize: 16, color: '#FF69B4', fontWeight: 'bold' },
    modalSearchInput: {
        height: 50, borderColor: '#FFB6C1', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 15,
        marginBottom: 15, fontSize: 16, backgroundColor: '#FFFFFF', color: '#880E4F'
    },
    modalItem: { paddingVertical: 15, paddingHorizontal: 5, backgroundColor: '#fff' },
    modalItemSelected: { backgroundColor: '#FFC0CB' },
    modalItemText: { fontSize: 16, color: '#333' },
    separator: { height: 1, backgroundColor: '#f0f0f0' },
    emptyListText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#aaa' }
});


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    loader: { flex: 1, justifyContent: "center" },
    card: { margin: 15, backgroundColor: "#FFE4E1", borderRadius: 15, overflow: "hidden", elevation: 3 },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },
    breedText: { fontSize: 18, color: '#880E4F', marginBottom: 5 },

    // ⭐️ ESTILOS DE FAVORITO ⭐️
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
    customIcon: {
        width: 30,
        height: 30
        // ❌ Borda removida daqui ❌
    },
    // ❌ REMOVIDO: Não precisamos deste estilo separado ❌
    // favoriteIconBorder: {
    //     borderWidth: 1.5,
    //     borderColor: '#FF69B4',
    //     borderRadius: 5,
    // },
    // FIM ESTILOS DE FAVORITO

    // Estilos de Filtros e UI
    filterContainer: { flexDirection: 'row', padding: 10, gap: 10 },
    breedInputButton: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#FFB6C1',
        height: 50,
        justifyContent: 'center',
    },
    breedInputText: { fontSize: 16, color: '#333333' },
    placeholderText: { color: '#A0A0A0' },
    textInputStyle: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 5, height: 50, borderWidth: 1, borderColor: '#FFB6C1', fontSize: 16, color: '#333333', },
    fullWidthSearchInput: { marginHorizontal: 10, marginBottom: 5, height: 50, backgroundColor: '#fff', borderRadius: 5, borderWidth: 1, borderColor: '#FFB6C1', padding: 10, fontSize: 16, color: '#333333', },

    // Restantes estilos
    authorInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    dateText: { fontSize: 14, color: '#FF69B4', fontStyle: 'italic' },
    authorText: { fontSize: 14, color: '#D81B60', fontStyle: 'italic' },
    separator: { height: 1, backgroundColor: '#FFC0CB', marginVertical: 10 },
    detailsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10, marginBottom: 10, marginTop: 10 },
    detailValue: { fontSize: 14, color: '#880E4F', fontWeight: 'bold' },
    detailValueFull: {
        fontSize: 14,
        color: '#880E4F',
        fontWeight: 'bold',
        width: '100%',
        marginTop: 5,
        marginBottom: 5,
    },
    locationText: {
        fontSize: 14,
        color: '#880E4F',
        marginTop: 5,
        fontWeight: 'bold',
        width: '100%',
    },
    contactText: {
        fontSize: 14,
        color: '#D81B60',
        marginTop: 5,
        fontWeight: 'bold',
        width: '100%',
    },
    adoptButton: { backgroundColor: '#FFB6C1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    adoptButtonText: { color: '#fff', fontWeight: 'bold' },
    authorButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 10,
        marginBottom: 5,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#FF69B4',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#D81B60',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    deleteButtonText: { color: '#fff', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});