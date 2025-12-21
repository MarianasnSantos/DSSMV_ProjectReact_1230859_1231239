import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Text,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    Alert,
    Linking
} from "react-native";
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";
import { translateTemperament } from "../utils/translations";

import PetCard from "../components/PetCard";
import BreedSearchModal from "../components/BreedSearchModal";

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
    // 1. ESTADOS DO FLUX
    const { animals = [], loading = false, breeds = [], filters = {} } = usePetStoreState() || {};
    const { user, favorites, isLoggedIn } = AuthStore.getState();
    const userId = user?._id || user?.id ? String(user._id || user.id) : null;

    // 2. ESTADOS LOCAIS
    const [refreshing, setRefreshing] = useState(false);
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);
    const [optimisticChanges, setOptimisticChanges] = useState({});

    // Estado para alternar entre "Disponíveis" e "Adotados"
    const [showAdopted, setShowAdopted] = useState(false);

    // 3. CARREGAMENTO INICIAL
    useEffect(() => { PetActions.loadAnimals(); }, []);

    // 4. LÓGICA DE FAVORITOS
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

    // 5. FILTROS
    const getFilteredAnimals = () => {
        let filteredList = animals;

        // A. Filtro Principal: Adotado vs Disponível
        filteredList = filteredList.filter(pet => {
            return showAdopted ? pet.adopted === true : !pet.adopted;
        });

        // B. Filtro de Raça
        if (filters.breed && filters.breed !== 'Todas' && filters.breed !== 'Todos') {
            if (filters.breed === 'Sem Raça') {
                filteredList = filteredList.filter(a => !a.breed || a.breed.trim() === '');
            } else {
                filteredList = filteredList.filter(a => (a.breed === filters.breed) || (a.name === filters.breed));
            }
        }

        // C. Filtro de Idade
        const minAge = parseInt(filters.minAge);
        if (!isNaN(minAge) && minAge > 0) {
            filteredList = filteredList.filter(a => {
                let ageVal = a.age ? parseInt(a.age) : 0;
                return ageVal >= minAge;
            });
        }

        // D. Filtro de Temperamento
        if (filters.temperament?.trim()) {
            const search = filters.temperament.toLowerCase().trim();
            filteredList = filteredList.filter(a =>
                translateTemperament(a.temperament).toLowerCase().includes(search)
            );
        }
        return filteredList;
    };

    // 6. AÇÕES

    const handleToggleFavorite = (id) => {
        const idString = id.toString();
        const isCurrentlyInStore = favorites.includes(idString);
        const isOptimistic = optimisticChanges[idString];
        const isFavBeforeClick = isOptimistic !== undefined ? isOptimistic : isCurrentlyInStore;

        setOptimisticChanges(prev => ({ ...prev, [idString]: !isFavBeforeClick }));
        PetActions.toggleFavorite(id);
    };

    const handleAdoptCall = (contactNumber) => {
        if (!contactNumber) {
            Alert.alert("Aviso", "Este animal não tem contacto associado.");
            return;
        }
        const cleanNumber = contactNumber.replace(/[^0-9]/g, '');
        Linking.openURL(`tel:${cleanNumber}`);
    };

    const handleToggleStatus = async (animal) => {
        // (_id é o correto para o RestDB)
        const idAnimal = animal._id || animal.id;

        if (!idAnimal) {
            Alert.alert("Erro", "Não foi possível encontrar o ID deste animal.");
            return;
        }

        const novoEstado = !animal.adopted;

        console.log(`A atualizar animal ${idAnimal} para estado: ${novoEstado}`);

        try {
            // URL com o ID correto e usando PATCH
            const response = await fetch(`https://petmatch-afab.restdb.io/rest/animals/${idAnimal}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-apikey': 'a29c6a5e4f29c400c1ffac21c4c454f2af5a3',
                    'cache-control': 'no-cache'
                },
                body: JSON.stringify({ adopted: novoEstado }),
            });

            if (!response.ok) {
                throw new Error(`Erro API: ${response.status}`);
            }

            // Atualiza a lista completa chamando o Action
            await PetActions.loadAnimals();

            Alert.alert("Sucesso", novoEstado ? "Marcado como Adotado! 🏠" : "Disponível para adoção! 🐶");

        } catch (error) {
            console.error("Erro no toggle:", error);
            Alert.alert("Erro", "Falha ao atualizar. Verifica a API Key e o URL.");
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    if (loading && !refreshing) return <ActivityIndicator size="large" color="#FF69B4" style={styles.loader} />;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>

            {/* ABAS TOPO */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, !showAdopted && styles.tabButtonActive]}
                    onPress={() => setShowAdopted(false)}
                >
                    <Text style={[styles.tabText, !showAdopted && styles.tabTextActive]}>🐶 Disponíveis</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, showAdopted && styles.tabButtonActive]}
                    onPress={() => setShowAdopted(true)}
                >
                    <Text style={[styles.tabText, showAdopted && styles.tabTextActive]}>🏠 Já Adotados</Text>
                </TouchableOpacity>
            </View>

            {/* FILTROS */}
            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.breedInputButton} onPress={() => setIsBreedModalVisible(true)}>
                    <Text style={styles.breedInputText}>
                        {filters.breed && filters.breed !== 'Todos' ? filters.breed : 'Raça (Pesquisar)'}
                    </Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.textInputStyle}
                    placeholder="Idade Min"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                    value={filters.minAge}
                    onChangeText={(t) => PetActions.setFilter('minAge', t)}
                />
            </View>
            <TextInput
                style={styles.fullWidthSearchInput}
                placeholder="Pesquisar Temperamento"
                placeholderTextColor="#555"
                value={filters.temperament}
                onChangeText={(t) => PetActions.setFilter('temperament', t)}
            />

            {/* LISTA */}
            <FlatList
                data={getFilteredAnimals()}
                keyExtractor={(item) => String(item.id || item._id)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF69B4"]} />}
                renderItem={({ item }) => {
                    const idString = String(item.id || item._id);
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
                            onAdopt={handleAdoptCall}
                            onToggleStatus={handleToggleStatus}
                            onEdit={(animal) => navigation.navigate('AddAnimal', { animalToEdit: animal })}
                            onDelete={(id, owner) => Alert.alert("Apagar", "Tens a certeza?", [
                                {text: "Não"},
                                {text: "Sim", onPress: () => PetActions.deleteAnimal(id, owner)}
                            ])}
                            formatDate={formatDate}
                        />
                    );
                }}
                ListEmptyComponent={
                    <Text style={{textAlign: 'center', marginTop: 50, color: '#888'}}>
                        {showAdopted ? "Ainda não há adoções." : "Não foram encontrados animais."}
                    </Text>
                }
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
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        elevation: 3,
        marginBottom: 5
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent'
    },
    tabButtonActive: {
        borderBottomColor: '#FF69B4',
        backgroundColor: '#FFF0F5'
    },
    tabText: { fontSize: 16, fontWeight: 'bold', color: '#999' },
    tabTextActive: { color: '#FF69B4' },
    filterContainer: {
        flexDirection: 'row',
        padding: 10,
        gap: 10,
        alignItems: 'center'
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
        elevation: 2
    },
    breedInputText: { color: '#000', fontSize: 16, fontWeight: '600' },
    textInputStyle: {
        width: 100,
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#FFB6C1',
        paddingHorizontal: 15,
        color: '#000',
        fontSize: 16
    },
    fullWidthSearchInput: {
        marginHorizontal: 10,
        marginBottom: 10,
        height: 55,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#FFB6C1',
        paddingHorizontal: 15,
        color: '#000',
        fontSize: 16
    },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});