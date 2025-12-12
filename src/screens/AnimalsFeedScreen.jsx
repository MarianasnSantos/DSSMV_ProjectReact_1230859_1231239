// src/screens/AnimalsFeedScreen.jsx

import React, { useEffect, useState } from "react";
import {
    View, Text, FlatList, Image, ActivityIndicator, StyleSheet,
    TouchableOpacity, TextInput, Alert,
    // ⭐️ IMPORTAÇÕES ADICIONADAS ⭐️
    KeyboardAvoidingView, Platform
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";

const FAVORITE_ICON = require('../assets/favoritar.jpg'); // Caminho corrigido

// --- Hooks/Auxiliares (Inalterado) ---
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
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
};
export default function AnimalsFeedScreen({ navigation }) {
    const {
        animals = [],
        loading = false,
        error = null,
        adoptionRequests = {},
        breeds = [],
        filters = {}
    } = usePetStoreState() || {};

    const { favorites, isLoggedIn, userId } = getAuthData();
    const [feedbackMessage, setFeedbackMessage] = useState({ id: null, text: '' });

    useEffect(() => {
        PetActions.loadAnimals();
    }, []);

    // --- FILTROS (Inalterado) ---
    const getFilteredAnimals = () => {
        let filteredList = animals;

        // Filtro Raça
        if (filters.breed && filters.breed !== 'Todos') {

            // ⭐️ MUDANÇA AQUI: Usar "Sem Raça" ⭐️
            if (filters.breed === 'Sem Raça') {
                // Procura animais com o campo breed vazio ou nulo (o que foi salvo como "Sem Raça")
                filteredList = filteredList.filter(animal => !animal.breed || animal.breed.trim() === '');
            } else {
                // Lógica de filtro por raça específica (existente)
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

        // Filtro Temperamento
        if (filters.temperament?.trim()) {
            const search = filters.temperament.toLowerCase().trim();
            filteredList = filteredList.filter(a =>
                a.temperament && a.temperament.toLowerCase().includes(search)
            );
        }
        return filteredList;
    };

    const filteredAnimals = getFilteredAnimals();

    // --- FAVORITOS (Inalterado) ---
    const handleToggleFavorite = (id) => {
        PetActions.toggleFavorite(id);
        const isFav = favorites.includes(id);
        setFeedbackMessage({ id, text: isFav ? 'Removido!' : 'Guardado!' });
        setTimeout(() => setFeedbackMessage({ id: null, text: '' }), 1500);
    };

    // --- APAGAR ANIMAL (Inalterado) ---
    const handleDeleteAnimal = (animalId, ownerId) => {
        Alert.alert("Apagar", "Tens a certeza?", [
            { text: "Cancelar" },
            {
                text: "Sim, Apagar",
                onPress: () => PetActions.deleteAnimal(animalId, ownerId)
            }
        ]);
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
        // ⭐️ IMPLEMENTAÇÃO DO KEYBOARDAVOIDINGVIEW ⭐️
        <KeyboardAvoidingView
            style={styles.container}
            // Ajustar o comportamento consoante a plataforma
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            // O offset pode ser ajustado se o teclado ainda cobrir o input
            keyboardVerticalOffset={0}
        >
            {/* Filtros */}
            <View style={styles.filterContainer}>
                <Picker
                    selectedValue={filters.breed || 'Todos'}
                    style={styles.pickerStyle}
                    onValueChange={(val) => PetActions.setFilter('breed', val)}
                >
                    <Picker.Item label="Todos" value="Todos" />
                    <Picker.Item label="Sem Raça" value="Sem Raça" />
                    {breeds?.map((b, index) => (
                        <Picker.Item key={index} label={b} value={b} />
                    ))}
                </Picker>

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
                // ⭐️ USAR APENAS O ESTILO NOVO ⭐️
                style={styles.fullWidthSearchInput}
                placeholder="Pesquisar Temperamento (Ex: Corajoso, Leal)"
                placeholderTextColor="#000000"
                value={filters.temperament}
                onChangeText={(text) => PetActions.setFilter('temperament', text)}
                multiline={false}
            />

            {/* Lista */}
            <FlatList
                data={filteredAnimals}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                renderItem={({ item }) => {
                    const photo = item.photoUrl || item.image?.url || "https://placehold.co/300x200";
                    const isFav = favorites.includes(item.id);

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

                                <Text style={styles.breedText}>{item.breed || "Raça desconhecida"}</Text>

                                {item.createdAt && (
                                    <Text style={styles.dateText}>
                                        Publicado em: {formatDate(item.createdAt)}
                                    </Text>
                                )}
                                {item.addedBy && <Text style={styles.authorText}>Por: {item.addedBy}</Text>}

                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailValue}>{item.age ? item.age + " anos" : "Jovem"}</Text>
                                    <Text style={styles.detailValue}>{item.temperament}</Text>
                                    {item.contactNumber && (
                                        // Usamos o contactText para dar um estilo próprio
                                        <Text style={styles.contactText}>
                                            Contacto: {item.contactNumber}
                                        </Text>
                                    )}

                                </View>

                                {/* Botões de Ação */}
                                <TouchableOpacity
                                    style={styles.adoptButton}
                                    onPress={() => handleAdoption(item.id)}
                                >
                                    <Text style={styles.adoptButtonText}>ADOTAR</Text>
                                </TouchableOpacity>

                                {renderDeleteButton(item)}
                            </View>
                        </View>
                    );
                }}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAnimal')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    loader: { flex: 1, justifyContent: "center" },
    card: { margin: 15, backgroundColor: "#FFE4E1", borderRadius: 15, overflow: "hidden", elevation: 3 },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },
    breedText: { fontSize: 18, color: '#880E4F', marginBottom: 5 },
    dateText: { fontSize: 14, color: '#FF69B4', fontStyle: 'italic', marginBottom: 5 },
    authorText: { fontSize: 14, color: '#D81B60', fontStyle: 'italic', marginBottom: 10 },
    detailsContainer: { flexDirection: 'row', gap: 15, marginBottom: 10 },
    detailValue: { fontSize: 14, color: '#880E4F', fontWeight: 'bold' },
    contactText: {
        fontSize: 14,
        color: '#D81B60', // Rosa Escuro para destacar
        marginTop: 5,
        fontWeight: 'bold',
        width: '100%', // Para garantir que ocupa a largura total no container
    },
    adoptButton: { backgroundColor: '#FFB6C1', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 5 },
    adoptButtonText: { color: '#fff', fontWeight: 'bold' },
    deleteButton: { backgroundColor: '#D81B60', padding: 8, borderRadius: 8, marginTop: 10, alignItems: 'center' },
    deleteButtonText: { color: '#fff', fontWeight: 'bold' },
    filterContainer: {
        flexDirection: 'row',
        padding: 10,
        gap: 10
    },
    pickerStyle: {
        flex: 1,
        backgroundColor: '#fff',
        height: 50,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#FFB6C1',
        color: '#333333',
        fontSize: 16,
        paddingLeft: 10,
    },
    textInputStyle: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
        height: 50,
        borderWidth: 1,
        borderColor: '#FFB6C1',
        fontSize: 16,
        color: '#333333',
    },
    temperamentSearch: {

        marginHorizontal: 10,
        marginBottom: 5,

        // MANTER ALTURA FIXA E ESTILOS
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#FFB6C1',
        padding: 10,
        fontSize: 16,
        color: '#333333',
    },
    feedbackText: { color: '#FF1493', textAlign: 'right', fontWeight: 'bold' },
    customIcon: { width: 30, height: 30 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});