// src/screens/AnimalsFeedScreen.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    View, Text, FlatList, Image, ActivityIndicator, StyleSheet,
    TouchableOpacity, TextInput, Alert,
    KeyboardAvoidingView, Platform,
    Modal,
    SafeAreaView // Adicionado para o Modal
} from "react-native";
// import { Picker } from '@react-native-picker/picker'; // Já não é necessário
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";

// ⭐️ Funções externas necessárias ⭐️
import { translateTemperament } from "../utils/translations";

const FAVORITE_ICON = require('../assets/favoritar.jpg');

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
// ⭐️ COMPONENTE MODAL DE PESQUISA DE RAÇA ⭐️
// ----------------------------------------------------------------------
// Este componente usa React.memo para otimizar
const BreedSearchModal = React.memo(({ isVisible, onClose, onSelect, allBreeds, selectedBreedName, modalStyles }) => {
    const [searchText, setSearchText] = useState('');

    const filteredBreeds = useMemo(() => {
        // Incluir "Todos" e "Sem Raça" no topo da lista
        const breedList = ['Todos', 'Sem Raça', ...allBreeds.filter(b => b !== 'Todos')];

        if (!searchText) {
            return breedList.slice(0, 20);
        }

        const lowerSearch = searchText.toLowerCase();

        return breedList.filter(breed =>
            breed.toLowerCase().includes(lowerSearch)
        );
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
    const [feedbackMessage, setFeedbackMessage] = useState({ id: null, text: '' });

    // ⭐️ ESTADOS PARA O MODAL DE PESQUISA DE RAÇA ⭐️
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);


    useEffect(() => {
        PetActions.loadAnimals();
    }, []);

    // -----------------------------------------------------------
    // LÓGICA DE FILTROS E PESQUISA CORRIGIDA
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

        // Filtro Temperamento ⭐️ CORRIGIDO: Pesquisa na versão traduzida ⭐️
        if (filters.temperament?.trim()) {
            const search = filters.temperament.toLowerCase().trim();
            filteredList = filteredList.filter(a =>
                // Pesquisa o termo digitado dentro do temperamento traduzido
                translateTemperament(a.temperament).toLowerCase().includes(search)
            );
        }
        return filteredList;
    };

    const filteredAnimals = getFilteredAnimals();

    // ⭐️ HANDLER PARA SELEÇÃO DE RAÇA DO MODAL ⭐️
    const handleSelectBreed = (breed) => {
        PetActions.setFilter('breed', breed);
        setIsBreedModalVisible(false);
    };

    // --- FAVORITOS / BOTÕES DE AUTOR (Inalterados) ---
    const handleToggleFavorite = (id) => {
        PetActions.toggleFavorite(id);
        const isFav = favorites.includes(id);
        setFeedbackMessage({ id, text: isFav ? 'Removido!' : 'Guardado!' });
        setTimeout(() => setFeedbackMessage({ id: null, text: '' }), 1500);
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

                {/* ⭐️ 1. BOTÃO DE RAÇA (Abre o Modal de Pesquisa) ⭐️ */}
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

                {/* 2. FILTRO IDADE (Inalterado) */}
                <TextInput
                    style={styles.textInputStyle}
                    placeholder="Idade (Anos)"
                    keyboardType="numeric"
                    placeholderTextColor="#000000"
                    value={filters.minAge}
                    onChangeText={(text) => PetActions.setFilter('minAge', text)}
                />

            </View>
            {/* 3. FILTRO TEMPERAMENTO (MANTÉM O PROBLEMA DO TECLADO) */}
            <TextInput
                style={styles.fullWidthSearchInput}
                placeholder="Pesquisar Temperamento"
                placeholderTextColor="#000000"
                value={filters.temperament}
                onChangeText={(text) => PetActions.setFilter('temperament', text)}
                multiline={false}
                // Isto pode não resolver o problema do teclado com a atualização do Store
                keyboardShouldPersistTaps='handled'
            />

            {/* Lista */}
            <FlatList
                data={filteredAnimals}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                renderItem={({ item }) => {
                    const photo = item.photoUrl || item.image?.url || "https://placehold.co/300x200";
                    const isFav = favorites.includes(item.id);

                    const locationDisplay = item.location;
                    const translatedTemperament = translateTemperament(item.temperament);

                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} />

                            <View style={styles.info}>
                                <View style={styles.headerContainer}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    {isLoggedIn && (
                                        <TouchableOpacity onPress={() => handleToggleFavorite(item.id)}>
                                            <Image
                                                source={FAVORITE_ICON}
                                                style={[styles.customIcon, { tintColor: isFav ? '#FF69B4' : '#FFC0CB' }]}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {feedbackMessage.id === item.id && <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>}

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

            {/* ⭐️ MODAL DE PESQUISA DE RAÇAS RENDERIZADO ⭐️ */}
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
// ESTILOS: ADICIONADO ESTILOS DO MODAL E DO NOVO BOTÃO DE RAÇA
// ----------------------------------------------------------------------

// ESTILOS DO MODAL
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

    // Estilos de Filtros e UI
    filterContainer: { flexDirection: 'row', padding: 10, gap: 10 },

    // NOVO: Estilo para o botão que abre o Modal de Raça
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
    placeholderText: { color: '#A0A0A0' }, // Para o texto "Raça (Pesquisar)"

    // Os restantes estilos de input
    textInputStyle: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 5, height: 50, borderWidth: 1, borderColor: '#FFB6C1', fontSize: 16, color: '#333333', },
    fullWidthSearchInput: { marginHorizontal: 10, marginBottom: 5, height: 50, backgroundColor: '#fff', borderRadius: 5, borderWidth: 1, borderColor: '#FFB6C1', padding: 10, fontSize: 16, color: '#333333', },

    // Restantes estilos (Inalterados)
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
    feedbackText: { color: '#FF1493', textAlign: 'right', fontWeight: 'bold' },
    customIcon: { width: 30, height: 30 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});