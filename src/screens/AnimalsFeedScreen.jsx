import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity,
    Text, TextInput, KeyboardAvoidingView, Platform, RefreshControl, Alert
} from "react-native";
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";
import { translateTemperament } from "../utils/translations";

// IMPORTAÇÃO DO NOVO COMPONENTE
import PetCard from "../components/PetCard";
import BreedSearchModal from "../components/BreedSearchModal";

// Hook do Store (Inalterado)
function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => setState(PetStore.getState());
        PetStore.addChangeListener(handleChange);
        return () => PetStore.removeListener(handleChange);
    }, []);
    return state;
}

export default function AnimalsFeedScreen({ navigation }) {
    const { animals = [], loading = false, breeds = [], filters = {} } = usePetStoreState() || {};
    const { user, favorites, isLoggedIn } = AuthStore.getState();
    const userId = user?._id || user?.id ? String(user._id || user.id) : null;

    const [refreshing, setRefreshing] = useState(false);
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);
    const [optimisticChanges, setOptimisticChanges] = useState({});

    useEffect(() => { PetActions.loadAnimals(); }, []);

    // Limpeza de estado otimista (Tua lógica original)
    useEffect(() => {
        setOptimisticChanges(prev => {
            const next = { ...prev };
            Object.keys(prev).forEach(id => {
                if (favorites.includes(id) === prev[id]) delete next[id];
            });
            return next;
        });
    }, [favorites]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await PetActions.loadAnimals();
        setRefreshing(false);
    }, []);

    // TODA A TUA LÓGICA DE FILTROS (Recuperada)
    const getFilteredAnimals = () => {
        let filteredList = animals;
        if (filters.breed && filters.breed !== 'Todas' && filters.breed !== 'Todos') {
            if (filters.breed === 'Sem Raça') {
                filteredList = filteredList.filter(a => !a.breed || a.breed.trim() === '');
            } else {
                filteredList = filteredList.filter(a => (a.breed === filters.breed) || (a.name === filters.breed));
            }
        }
        const minAge = parseInt(filters.minAge);
        if (!isNaN(minAge) && minAge > 0) {
            filteredList = filteredList.filter(a => {
                let ageVal = a.age ? parseInt(a.age) : 0;
                return ageVal >= minAge;
            });
        }
        if (filters.temperament?.trim()) {
            const search = filters.temperament.toLowerCase().trim();
            filteredList = filteredList.filter(a =>
                translateTemperament(a.temperament).toLowerCase().includes(search)
            );
        }
        return filteredList;
    };

    const handleToggleFavorite = (id) => {
        const idString = id.toString();
        const isCurrentlyInStore = favorites.includes(idString);
        const isOptimistic = optimisticChanges[idString];
        const isFavBeforeClick = isOptimistic !== undefined ? isOptimistic : isCurrentlyInStore;

        setOptimisticChanges(prev => ({ ...prev, [idString]: !isFavBeforeClick }));
        PetActions.toggleFavorite(id);
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    if (loading && !refreshing) return <ActivityIndicator size="large" color="#FF69B4" style={styles.loader} />;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>

            {/* INPUTS DE FILTRO (Preservados) */}
            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.breedInputButton} onPress={() => setIsBreedModalVisible(true)}>
                    <Text style={styles.breedInputText}>{filters.breed && filters.breed !== 'Todos' ? filters.breed : 'Raça (Pesquisar)'}</Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.textInputStyle}
                    placeholder="Idade"
                    placeholderTextColor="#555555"
                    keyboardType="numeric"
                    value={filters.minAge}
                    onChangeText={(t) => PetActions.setFilter('minAge', t)}
                />
            </View>
            <TextInput
                style={styles.fullWidthSearchInput}
                placeholder="Pesquisar Temperamento"
                placeholderTextColor="#555555"
                value={filters.temperament}
                onChangeText={(t) => PetActions.setFilter('temperament', t)}
            />

            <FlatList
                data={getFilteredAnimals()}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF69B4"]} />}
                renderItem={({ item }) => {
                    const idString = item.id.toString();
                    const isCurrentlyInStore = favorites.includes(idString);
                    const optimisticState = optimisticChanges[idString];
                    const isFav = optimisticState !== undefined ? optimisticState : isCurrentlyInStore;

                    return (
                        <PetCard
                            item={item}
                            isFav={isFav}
                            isLoggedIn={isLoggedIn}
                            userId={userId}
                            onFavorite={handleToggleFavorite}
                            onAdopt={(id) => PetActions.startAdoption(id, userId)}
                            onEdit={(animal) => navigation.navigate('AddAnimal', { animalToEdit: animal })}
                            onDelete={(id, owner) => Alert.alert("Apagar", "Confirmas?", [{text: "Não"}, {text: "Sim", onPress: () => PetActions.deleteAnimal(id, owner)}])}
                            formatDate={formatDate}
                        />
                    );
                }}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAnimal')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <BreedSearchModal
                isVisible={isBreedModalVisible}
                onClose={() => setIsBreedModalVisible(false)}
                onSelect={(b) => PetActions.setFilter('breed', b)}
                allBreeds={breeds}
                selectedBreedName={filters.breed || 'Todos'}
                showAllOption={true}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    loader: { flex: 1, justifyContent: "center" },
    filterContainer: {
        flexDirection: 'row',
        padding: 10,
        gap: 10,
        alignItems: 'center' // Garante alinhamento vertical
    },

    breedInputButton: {
        flex: 1,
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        justifyContent: 'center',
        paddingLeft: 15,
        borderWidth: 1.5,
        borderColor: '#FFB6C1',
        elevation: 2 // Sombra para destacar do fundo rosa
    },

    breedInputText: {
        color: '#000000', // Preto absoluto para máximo contraste
        fontSize: 16,
        fontWeight: '600'
    },

    textInputStyle: {
        width: 100,
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#FFB6C1',
        paddingHorizontal: 15,
        color: '#000000', // Texto digitado em preto
        fontSize: 16,
        includeFontPadding: false, // Evita cortes no Android
        textAlignVertical: 'center'
    },

    fullWidthSearchInput: {
        marginHorizontal: 10,
        marginBottom: 10,
        height: 55, // Um pouco mais alto para não cortar letras
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#FFB6C1',
        paddingHorizontal: 15,
        color: '#000000', // Texto em preto
        fontSize: 16,
        includeFontPadding: false,
        textAlignVertical: 'center'
    },

    placeholderText: {
        color: '#555555' // Um cinza escuro nítido para o placeholder
    },

    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});