import React, { useEffect, useState, useCallback } from "react";
import {
    View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Text, TextInput,
    KeyboardAvoidingView, Platform, RefreshControl, Alert, Linking, PermissionsAndroid, LayoutAnimation, UIManager
} from "react-native";
import Geolocation from 'react-native-geolocation-service';

import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import AuthStore from "../stores/AuthStore";
import { translateTemperament } from "../utils/translations";

import PetCard from "../components/PetCard";
import BreedSearchModal from "../components/BreedSearchModal";
import TemperamentModal from "../components/TemperamentModal";


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- FUNÇÃO MATEMÁTICA PARA DISTÂNCIA ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => setState(PetStore.getState());

        // Adiciona o ouvinte
        PetStore.addChangeListener(handleChange);

        // Remove usando EXATAMENTE o mesmo padrão de nome da biblioteca EventEmitter
        return () => {
            if (PetStore.removeChangeListener) {
                PetStore.removeChangeListener(handleChange);
            } else {
                PetStore.removeListener(handleChange);
            }
        };
    }, []);
    return state;
}

export default function AnimalsFeedScreen({ navigation, route }) {
    const { animals = [], loading = false, breeds = [], filters = {} } = usePetStoreState() || {};
    const { user, favorites, isLoggedIn } = AuthStore.getState();
    const userId = user?._id || user?.id ? String(user._id || user.id) : null;

    const [refreshing, setRefreshing] = useState(false);
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);
    const [isTempModalVisible, setIsTempModalVisible] = useState(false);
    const [selectedTemps, setSelectedTemps] = useState([]);
    const [optimisticChanges, setOptimisticChanges] = useState({});
    const [showAdopted, setShowAdopted] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [smartMatchTarget, setSmartMatchTarget] = useState(null);

    // Estados para Filtro de Proximidade e UI
    const [sortByDistance, setSortByDistance] = useState(false);
    const [myLocation, setMyLocation] = useState(null);
    const [loadingGPS, setLoadingGPS] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        PetActions.loadAnimals();

        if (route.params?.smartTemperament) {
            setSmartMatchTarget(route.params.smartTemperament);
            PetActions.setFilter('breed', 'Todos');
            PetActions.setFilter('minAge', '');
            PetActions.setFilter('temperament', '');
            setLocationSearch("");
            setSortByDistance(false);
            setShowAdopted(false);
            setShowFilters(false); // Fecha filtros se vier do Smart Match
            navigation.setParams({ smartTemperament: null });
            Alert.alert("Filtro Inteligente 🧠", "A mostrar animais com personalidade parecida!");
        }
    }, [route.params, navigation]);

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

    const toggleDistanceSort = async () => {
        if (sortByDistance) {
            setSortByDistance(false);
            return;
        }
        setLoadingGPS(true);
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert("Erro", "Precisas de autorizar o GPS.");
                    setLoadingGPS(false);
                    return;
                }
            }
            Geolocation.getCurrentPosition(
                (pos) => {
                    setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setSortByDistance(true);
                    setLoadingGPS(false);
                },
                (err) => {
                    Alert.alert("Erro GPS", "Não consegui obter a tua localização.");
                    setLoadingGPS(false);
                },
                { enableHighAccuracy: true, timeout: 15000, showLocationDialog: true }
            );
        } catch (e) { setLoadingGPS(false); }
    };

    const toggleFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowFilters(!showFilters);
    };

    // --- FILTRAGEM E ORDENAÇÃO ---
    const getFilteredAnimals = () => {
        // 1. Vai buscar a lista original ao Store
        let filteredList = [...animals];

        filteredList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // 3. Filtro de Adotados vs Disponíveis
        filteredList = filteredList.filter(pet => {
            const isAdopted = pet.adopted === true || pet.adopted === "true";
            return showAdopted ? isAdopted : !isAdopted;
        });

        // 4. Smart Match
        if (smartMatchTarget) {
            const targetWords = smartMatchTarget.split(',').map(t => t.trim().toLowerCase());
            filteredList = filteredList.filter(animal => {
                if (!animal.temperament) return false;
                const animalWords = animal.temperament.split(',').map(t => t.trim().toLowerCase());
                let matches = 0;
                targetWords.forEach(target => {
                    if (animalWords.some(w => w.includes(target) || target.includes(w))) matches++;
                });
                return matches >= 2;
            });
            return filteredList;
        }

        // 5. Filtros de Raça
        if (filters.breed && filters.breed !== 'Todas' && filters.breed !== 'Todos') {
            if (filters.breed === 'Sem Raça') filteredList = filteredList.filter(a => !a.breed || a.breed.trim() === '');
            else filteredList = filteredList.filter(a => (a.breed === filters.breed) || (a.name === filters.breed));
        }

        // 6. Filtro de Idade
        const minAge = parseInt(filters.minAge);
        if (!isNaN(minAge) && minAge > 0) {
            filteredList = filteredList.filter(a => (a.age ? parseInt(a.age) : 0) >= minAge);
        }

        // 7. Filtro de Temperamento
        if (selectedTemps.length > 0) {
            filteredList = filteredList.filter(animal => {
                const animalTempPT = translateTemperament(animal.temperament).toLowerCase();
                return selectedTemps.some(selected => animalTempPT.includes(selected.toLowerCase()));
            });
        }

        // 8. Filtro de Cidade
        if (locationSearch.trim()) {
            const loc = locationSearch.toLowerCase().trim();
            filteredList = filteredList.filter(a => a.location && a.location.toLowerCase().includes(loc));
        }

        // 9. Ordenação por Distância
        if (sortByDistance && myLocation) {
            filteredList.sort((a, b) => {
                if (!a.lat || !a.lng) return 1;
                if (!b.lat || !b.lng) return -1;
                const distA = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, a.lat, a.lng);
                const distB = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, b.lat, b.lng);
                return distA - distB;
            });
        }

        return filteredList;
    };

    // Ações do Cartão
    const handleToggleFavorite = (id) => {
        const idString = id.toString();
        const isCurrentlyInStore = favorites.includes(idString);
        const isOptimistic = optimisticChanges[idString];
        const isFavBeforeClick = isOptimistic !== undefined ? isOptimistic : isCurrentlyInStore;
        setOptimisticChanges(prev => ({ ...prev, [idString]: !isFavBeforeClick }));
        PetActions.toggleFavorite(id);
    };

    const handleAdoptCall = (contactNumber) => {
        if (!contactNumber) return Alert.alert("Aviso", "Sem contacto.");
        Linking.openURL(`tel:${contactNumber.replace(/[^0-9]/g, '')}`);
    };

    const handleToggleStatus = async (animal) => {
        const idAnimal = animal._id || animal.id;
        const estadoAtual = animal.adopted === true || animal.adopted === "true";
        const novoEstado = !estadoAtual;

        try {
            await PetActions.updateAnimal({ id: idAnimal, _id: idAnimal, adopted: novoEstado });
            Alert.alert("Sucesso", novoEstado ? "Marcado como Adotado! 🏠" : "Disponível! 🐶");
        } catch (error) {
            console.log("Erro ao atualizar status:", error);
            Alert.alert("Erro", "Não foi possível atualizar o estado.");
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

            {/* --- CABEÇALHO LIMPO --- */}
            <View style={styles.header}>
                {/* 1. Abas de Navegação (Disponíveis / Adotados) */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tabButton, !showAdopted && styles.tabButtonActive]} onPress={() => setShowAdopted(false)}>
                        <Text style={[styles.tabText, !showAdopted && styles.tabTextActive]}>🐶 Disponíveis</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabButton, showAdopted && styles.tabButtonActive]} onPress={() => setShowAdopted(true)}>
                        <Text style={[styles.tabText, showAdopted && styles.tabTextActive]}>🏠 Adotados</Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Barra de Pesquisa Principal + Botão Filtros */}
                {!smartMatchTarget && (
                    <View style={styles.mainSearchRow}>
                        <TouchableOpacity style={styles.temperamentSelector} onPress={() => setIsTempModalVisible(true)}>
                            <Text style={styles.temperamentText} numberOfLines={1}>
                                {selectedTemps.length > 0
                                    ? `🧠 ${selectedTemps.length} selecionados`
                                    : "🔍 Selecionar Temperamentos"}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]} onPress={toggleFilters}>
                            <Text style={[styles.filterToggleText, showFilters && {color: '#fff'}]}>⚙️ Filtros</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 3. Área de Filtros Avançados (Escondida por defeito) */}
                {showFilters && !smartMatchTarget && (
                    <View style={styles.advancedFiltersContainer}>
                        <View style={styles.filterRow}>
                            {/* Raça */}
                            <TouchableOpacity style={styles.breedSelector} onPress={() => setIsBreedModalVisible(true)}>
                                <Text style={styles.breedText} numberOfLines={1}>
                                    {filters.breed && filters.breed !== 'Todos' ? filters.breed : '🐕 Todas as Raças'}
                                </Text>
                            </TouchableOpacity>
                            {/* Idade */}
                            <TextInput
                                style={styles.ageInput} placeholder="Idade Min" placeholderTextColor="#888" keyboardType="numeric"
                                value={filters.minAge} onChangeText={(t) => PetActions.setFilter('minAge', t)}
                            />
                        </View>

                        <View style={styles.filterRow}>
                            {/* Cidade */}
                            <TextInput
                                style={styles.cityInput} placeholder="📍 Filtrar por Cidade" placeholderTextColor="#888"
                                value={locationSearch} onChangeText={setLocationSearch}
                            />
                        </View>

                        {/* Botão Perto de Mim */}
                        <TouchableOpacity
                            style={[styles.gpsButton, sortByDistance && styles.gpsButtonActive]}
                            onPress={toggleDistanceSort}
                            disabled={loadingGPS}
                        >
                            {loadingGPS ? <ActivityIndicator color="#fff" size="small"/> : (
                                <Text style={styles.gpsButtonText}>
                                    {sortByDistance ? "✅ Ordenado por Proximidade" : "🌍 Ordenar: Perto de Mim"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Smart Match Badge */}
                {smartMatchTarget && (
                    <View style={styles.smartFilterBadge}>
                        <Text style={styles.smartFilterText}>✨ Modo Compatibilidade</Text>
                        <TouchableOpacity onPress={() => {setSmartMatchTarget(null); PetActions.loadAnimals();}} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Limpar ✕</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* LISTA */}
            <FlatList
                data={getFilteredAnimals()}
                extraData={[animals, showAdopted]}
                keyExtractor={(item) => String(item.id || item._id)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF69B4"]} />}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => {
                    const idString = String(item.id || item._id);
                    const isCurrentlyInStore = favorites.includes(idString);
                    const isFav = optimisticChanges[idString] !== undefined ? optimisticChanges[idString] : isCurrentlyInStore;

                    let distanceText = "";
                    if (sortByDistance && myLocation && item.lat && item.lng) {
                        const dist = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, item.lat, item.lng);
                        distanceText = `${dist.toFixed(1)} km`;
                    }

                    return (
                        <View style={{position: 'relative'}}>
                            {distanceText !== "" && (
                                <View style={styles.distanceBadge}>
                                    <Text style={styles.distanceText}>📍 {distanceText}</Text>
                                </View>
                            )}
                            <PetCard
                                item={item} isFav={isFav} isLoggedIn={isLoggedIn} userId={userId}
                                onFavorite={handleToggleFavorite} onAdopt={handleAdoptCall} onToggleStatus={handleToggleStatus}
                                onEdit={(animal) => navigation.navigate('AddAnimal', { animalToEdit: animal })}
                                onDelete={(id, owner) => Alert.alert("Apagar", "Confirmas?", [{ text: "Não" }, { text: "Sim", onPress: () => PetActions.deleteAnimal(id, owner) }])}
                                formatDate={formatDate}
                            />
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50, padding: 20 }}>
                        <Text style={{ textAlign: 'center', color: '#888', fontSize: 16 }}>Nenhum animal encontrado.</Text>
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAnimal')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <BreedSearchModal
                isVisible={isBreedModalVisible} onClose={() => setIsBreedModalVisible(false)}
                onSelect={(b) => PetActions.setFilter('breed', b)} allBreeds={breeds}
                selectedBreedName={filters.breed || 'Todos'} showAllOption={true}
            />

            <TemperamentModal
                isVisible={isTempModalVisible}
                onClose={() => setIsTempModalVisible(false)}
                onApply={(selected) => setSelectedTemps(selected)}
                initialSelected={selectedTemps}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    loader: { flex: 1, justifyContent: "center" },

    // CABEÇALHO
    header: { backgroundColor: '#fff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 4, paddingBottom: 10, marginBottom: 10 },

    // ABAS
    tabsContainer: { flexDirection: 'row', marginBottom: 10 },
    tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabButtonActive: { borderBottomColor: '#FF69B4' },
    tabText: { fontSize: 16, fontWeight: 'bold', color: '#999' },
    tabTextActive: { color: '#FF69B4' },

    // PESQUISA PRINCIPAL
    mainSearchRow: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, alignItems: 'center' },
    mainSearchInput: { flex: 1, height: 45, backgroundColor: '#F0F0F0', borderRadius: 25, paddingHorizontal: 20, color: '#333' },
    filterToggleButton: { padding: 10, backgroundColor: '#F0F0F0', borderRadius: 12 },
    filterToggleButtonActive: { backgroundColor: '#FF69B4' },
    filterToggleText: { fontWeight: 'bold', color: '#555', fontSize: 12 },

    // FILTROS AVANÇADOS (ESCONDIDOS)
    advancedFiltersContainer: { marginTop: 15, paddingHorizontal: 15, gap: 10 },
    filterRow: { flexDirection: 'row', gap: 10 },

    breedSelector: { flex: 1, height: 45, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, justifyContent: 'center', paddingHorizontal: 15 },
    breedText: { color: '#555' },

    ageInput: { width: 120, height: 45, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 10, color: '#333', textAlign: 'center' },
    cityInput: { flex: 1, height: 45, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 15, color: '#333' },

    gpsButton: { backgroundColor: '#2196F3', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    gpsButtonActive: { backgroundColor: '#4CAF50' },
    gpsButtonText: { color: '#fff', fontWeight: 'bold' },

    // BADGES E FAB
    smartFilterBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E1F5FE', padding: 10, margin: 15, borderRadius: 10 },
    smartFilterText: { color: '#0277BD', fontWeight: 'bold' },
    clearButton: { backgroundColor: '#FF5252', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
    clearButtonText: { color: 'white', fontSize: 12 },

    distanceBadge: { position: 'absolute', zIndex: 10, top: 30, right: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    distanceText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },

    temperamentSelector: { flex: 1, height: 45, backgroundColor: '#F0F0F0', borderRadius: 25, justifyContent: 'center', paddingHorizontal: 20 },
    temperamentText: { color: '#555' },
});