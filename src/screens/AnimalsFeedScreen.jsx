import React, { useEffect, useState, useCallback } from "react";
import {
    View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Text, TextInput,
    KeyboardAvoidingView, Platform, RefreshControl, Alert, Linking, PermissionsAndroid
} from "react-native";

import Geolocation from 'react-native-geolocation-service';

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

// --- CALCULAR DISTÂNCIA ---
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

export default function AnimalsFeedScreen({ navigation, route }) {
    const { animals = [], loading = false, breeds = [], filters = {} } = usePetStoreState() || {};
    const { user, favorites, isLoggedIn } = AuthStore.getState();
    const userId = user?._id || user?.id ? String(user._id || user.id) : null;

    const [refreshing, setRefreshing] = useState(false);
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);
    const [optimisticChanges, setOptimisticChanges] = useState({});
    const [showAdopted, setShowAdopted] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [smartMatchTarget, setSmartMatchTarget] = useState(null);

    //Filtro de Proximidade
    const [sortByDistance, setSortByDistance] = useState(false);
    const [myLocation, setMyLocation] = useState(null);
    const [loadingGPS, setLoadingGPS] = useState(false);

    useEffect(() => { PetActions.loadAnimals(); }, []);

    useEffect(() => {
        if (route.params?.smartTemperament) {
            setSmartMatchTarget(route.params.smartTemperament);
            PetActions.setFilter('breed', 'Todos');
            PetActions.setFilter('minAge', '');
            PetActions.setFilter('temperament', '');
            setLocationSearch("");
            setSortByDistance(false);
            setShowAdopted(false);
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

    // --- ATIVAR O MODO "PERTO DE MIM" ---
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
        } catch (e) {
            setLoadingGPS(false);
        }
    };

    // --- FILTRAGEM E ORDENAÇÃO ---
    const getFilteredAnimals = () => {
        let filteredList = [...animals];

        filteredList = filteredList.filter(pet => showAdopted ? pet.adopted === true : !pet.adopted);

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

        // 3. Filtros Normais
        if (filters.breed && filters.breed !== 'Todas' && filters.breed !== 'Todos') {
            if (filters.breed === 'Sem Raça') filteredList = filteredList.filter(a => !a.breed || a.breed.trim() === '');
            else filteredList = filteredList.filter(a => (a.breed === filters.breed) || (a.name === filters.breed));
        }

        const minAge = parseInt(filters.minAge);
        if (!isNaN(minAge) && minAge > 0) {
            filteredList = filteredList.filter(a => (a.age ? parseInt(a.age) : 0) >= minAge);
        }

        if (filters.temperament?.trim()) {
            const search = filters.temperament.toLowerCase().trim();
            filteredList = filteredList.filter(a => translateTemperament(a.temperament).toLowerCase().includes(search));
        }

        if (locationSearch.trim()) {
            const loc = locationSearch.toLowerCase().trim();
            filteredList = filteredList.filter(a => a.location && a.location.toLowerCase().includes(loc));
        }

        // 4. ORDENAÇÃO POR DISTÂNCIA (NOVO)
        if (sortByDistance && myLocation) {
            filteredList.sort((a, b) => {
                // Se o animal não tiver GPS (animais antigos), vai para o fim da lista
                if (!a.lat || !a.lng) return 1;
                if (!b.lat || !b.lng) return -1;

                const distA = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, a.lat, a.lng);
                const distB = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, b.lat, b.lng);
                return distA - distB;
            });
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

    const handleAdoptCall = (contactNumber) => {
        if (!contactNumber) return Alert.alert("Aviso", "Sem contacto.");
        Linking.openURL(`tel:${contactNumber.replace(/[^0-9]/g, '')}`);
    };

    const handleToggleStatus = async (animal) => {
        const idAnimal = animal._id || animal.id;
        const novoEstado = !animal.adopted;
        try {
            await PetActions.updateAnimal({ id: idAnimal, _id: idAnimal, adopted: novoEstado });
            Alert.alert("Sucesso", novoEstado ? "Marcado como Adotado!" : "Disponível!");
        } catch (error) { console.log(error); }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    const clearSmartFilter = () => { setSmartMatchTarget(null); PetActions.loadAnimals(); };

    if (loading && !refreshing) return <ActivityIndicator size="large" color="#FF69B4" style={styles.loader} />;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>

            {/* ABAS */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tabButton, !showAdopted && styles.tabButtonActive]} onPress={() => setShowAdopted(false)}>
                    <Text style={[styles.tabText, !showAdopted && styles.tabTextActive]}>🐶 Disponíveis</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, showAdopted && styles.tabButtonActive]} onPress={() => setShowAdopted(true)}>
                    <Text style={[styles.tabText, showAdopted && styles.tabTextActive]}>🏠 Já Adotados</Text>
                </TouchableOpacity>
            </View>

            {/* SMART MATCH BADGE */}
            {smartMatchTarget && (
                <View style={styles.smartFilterBadge}>
                    <Text style={styles.smartFilterText}>✨ Modo Compatibilidade Ativo</Text>
                    <TouchableOpacity onPress={clearSmartFilter} style={styles.clearButton}><Text style={styles.clearButtonText}>Limpar ✕</Text></TouchableOpacity>
                </View>
            )}

            {/* FILTROS */}
            {!smartMatchTarget && (
                <>
                    <View style={styles.filterContainer}>
                        <TouchableOpacity style={styles.breedInputButton} onPress={() => setIsBreedModalVisible(true)}>
                            <Text style={styles.breedInputText}>{filters.breed && filters.breed !== 'Todos' ? filters.breed : 'Raça (Pesquisar)'}</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.textInputStyle} placeholder="Idade Min" placeholderTextColor="#555" keyboardType="numeric"
                            value={filters.minAge} onChangeText={(t) => PetActions.setFilter('minAge', t)}
                        />
                    </View>

                    {/* FILTROS DE TEXTO E BOTÃO GPS */}
                    <View style={styles.searchRow}>
                        <TextInput
                            style={[styles.fullWidthSearchInput, { flex: 1, marginRight: 5 }]}
                            placeholder="🔍 Temperamento..." placeholderTextColor="#555"
                            value={filters.temperament} onChangeText={(t) => PetActions.setFilter('temperament', t)}
                        />
                        <TextInput
                            style={[styles.fullWidthSearchInput, { flex: 1, marginLeft: 5 }]}
                            placeholder="📍 Cidade..." placeholderTextColor="#555"
                            value={locationSearch} onChangeText={setLocationSearch}
                        />
                    </View>

                    {/* BOTÃO MÁGICO DE PROXIMIDADE */}
                    <TouchableOpacity
                        style={[styles.gpsButton, sortByDistance && styles.gpsButtonActive]}
                        onPress={toggleDistanceSort}
                        disabled={loadingGPS}
                    >
                        {loadingGPS ? <ActivityIndicator color="#fff" size="small"/> : (
                            <Text style={styles.gpsButtonText}>
                                {sortByDistance ? "✅ Ordenar: Perto de Mim" : "📍 Ordenar: Perto de Mim"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

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

                    // Calcular distância para mostrar no cartão (Opcional)
                    let distanceText = "";
                    if (sortByDistance && myLocation && item.lat && item.lng) {
                        const dist = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, item.lat, item.lng);
                        distanceText = `(${dist.toFixed(1)} km)`;
                    }

                    return (
                        <View>
                            {/* Se quiseres mostrar a distância no topo do cartão, podes descomentar isto:
                            {distanceText !== "" && <Text style={{textAlign: 'center', color: '#D81B60', fontWeight: 'bold'}}>{distanceText}</Text>}
                            */}
                            <PetCard
                                item={item}
                                isFav={isFav}
                                isLoggedIn={isLoggedIn}
                                userId={userId}
                                onFavorite={handleToggleFavorite}
                                onAdopt={handleAdoptCall}
                                onToggleStatus={handleToggleStatus}
                                onEdit={(animal) => navigation.navigate('AddAnimal', { animalToEdit: animal })}
                                onDelete={(id, owner) => Alert.alert("Apagar", "Confirmas?", [{ text: "Não" }, { text: "Sim", onPress: () => PetActions.deleteAnimal(id, owner) }])}
                                formatDate={formatDate}
                            />
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50, padding: 20 }}>
                        <Text style={{ textAlign: 'center', color: '#888', fontSize: 16 }}>
                            {smartMatchTarget ? "Nenhum animal compatível." : "Nenhum animal encontrado."}
                        </Text>
                        {smartMatchTarget && (
                            <TouchableOpacity onPress={clearSmartFilter} style={[styles.clearButton, { marginTop: 20, backgroundColor: '#FF69B4' }]}>
                                <Text style={styles.clearButtonText}>Ver Todos</Text>
                            </TouchableOpacity>
                        )}
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
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5" },
    loader: { flex: 1, justifyContent: "center" },
    tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 3, marginBottom: 5 },
    tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabButtonActive: { borderBottomColor: '#FF69B4', backgroundColor: '#FFF0F5' },
    tabText: { fontSize: 16, fontWeight: 'bold', color: '#999' },
    tabTextActive: { color: '#FF69B4' },
    smartFilterBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E1F5FE', padding: 15, margin: 10, borderRadius: 10, borderWidth: 1, borderColor: '#0288D1' },
    smartFilterText: { color: '#0277BD', fontWeight: 'bold', fontSize: 14, flex: 1 },
    clearButton: { backgroundColor: '#FF5252', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
    clearButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    filterContainer: { flexDirection: 'row', padding: 10, gap: 10, alignItems: 'center' },
    searchRow: { flexDirection: 'row', paddingHorizontal: 10, marginBottom: 10 },
    breedInputButton: { flex: 1, height: 50, backgroundColor: '#ffffff', borderRadius: 8, justifyContent: 'center', paddingLeft: 15, borderWidth: 1.5, borderColor: '#FFB6C1', elevation: 2 },
    breedInputText: { color: '#000', fontSize: 16, fontWeight: '600' },
    textInputStyle: { width: 100, height: 50, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1.5, borderColor: '#FFB6C1', paddingHorizontal: 15, color: '#000', fontSize: 16 },
    fullWidthSearchInput: { height: 50, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1.5, borderColor: '#FFB6C1', paddingHorizontal: 15, color: '#000', fontSize: 14 },

    // ESTILOS DO BOTÃO GPS
    gpsButton: { marginHorizontal: 10, marginBottom: 10, backgroundColor: '#2196F3', padding: 12, borderRadius: 8, alignItems: 'center', elevation: 2 },
    gpsButtonActive: { backgroundColor: '#4CAF50' },
    gpsButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});