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
import { theme } from "../styles/theme";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}



//CALCULO DISTANCIA
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
    const R = 6371; const dLat = (lat2 - lat1) * (Math.PI / 180); const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c;
};

function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => setState(PetStore.getState());

        //atualizar lista
        PetStore.addChangeListener(handleChange);
        return () => { if (PetStore.removeChangeListener) { PetStore.removeChangeListener(handleChange); } else { PetStore.removeListener(handleChange); } };
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
    const [sortByDistance, setSortByDistance] = useState(false);
    const [myLocation, setMyLocation] = useState(null);
    const [loadingGPS, setLoadingGPS] = useState(false);
    const [showFilters, setShowFilters] = useState(false);


    //logica filtros
    useEffect(() => {
        PetActions.loadAnimals();
        if (route.params?.smartTemperament) {
            setSmartMatchTarget(route.params.smartTemperament); PetActions.setFilter('breed', 'Todos'); PetActions.setFilter('minAge', ''); PetActions.setFilter('temperament', '');
            setLocationSearch(""); setSortByDistance(false); setShowAdopted(false); setShowFilters(false);
            navigation.setParams({ smartTemperament: null }); Alert.alert("Filtro Inteligente 🧠", "A mostrar animais com personalidade parecida!");
        }
    }, [route.params, navigation]);


    //alterar botao favorito
    useEffect(() => {
        setOptimisticChanges(prev => { const next = { ...prev }; Object.keys(prev).forEach(id => { if (favorites.includes(id) === prev[id]) delete next[id]; }); return next; });
    }, [favorites]);


    //atualizar ecra
    const onRefresh = useCallback(async () => { setRefreshing(true); await PetActions.loadAnimals(); setRefreshing(false); }, []);

    const toggleDistanceSort = async () => {
        if (sortByDistance) { setSortByDistance(false); return; }
        setLoadingGPS(true);
        try {
            if (Platform.OS === 'android') { const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION); if (granted !== PermissionsAndroid.RESULTS.GRANTED) { Alert.alert("Erro", "Precisas de autorizar o GPS."); setLoadingGPS(false); return; } }
            Geolocation.getCurrentPosition((pos) => { setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSortByDistance(true); setLoadingGPS(false); }, (err) => { Alert.alert("Erro GPS", "Não consegui obter a tua localização."); setLoadingGPS(false); }, { enableHighAccuracy: true, timeout: 15000, showLocationDialog: true });
        } catch (e) { setLoadingGPS(false); }
    };

    const toggleFilters = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowFilters(!showFilters); };



    const getFilteredAnimals = () => {
        let filteredList = [...animals];
        filteredList.sort((a, b) => { const dateA = new Date(a.createdAt || 0); const dateB = new Date(b.createdAt || 0); return dateB - dateA; });
        filteredList = filteredList.filter(pet => { const isAdopted = pet.adopted === true || pet.adopted === "true"; return showAdopted ? isAdopted : !isAdopted; });

        if (smartMatchTarget) {

            //confirmar minúsculas


        //filtro temperamento
            const targetWords = smartMatchTarget.split(',').map(t => t.trim().toLowerCase());
            filteredList = filteredList.filter(animal => { if (!animal.temperament) return false;
                const animalWords = animal.temperament.split(',').map(t => t.trim().toLowerCase());
                let matches = 0; targetWords.forEach(target => {
                    if (animalWords.some(w => w.includes(target) || target.includes(w))) matches++; });
                return matches >= 2; });
            return filteredList;
        }

        //filtrar por RAÇA
        if (filters.breed && filters.breed !== 'Todas' && filters.breed !== 'Todos') { if (filters.breed === 'Sem Raça') filteredList = filteredList.filter(a => !a.breed || a.breed.trim() === ''); else filteredList = filteredList.filter(a => (a.breed === filters.breed) || (a.name === filters.breed)); }
        const minAge = parseInt(filters.minAge);

        //filtrar por idade
        if (!isNaN(minAge) && minAge > 0) { filteredList = filteredList.filter(a => (a.age ? parseInt(a.age) : 0) >= minAge); }

        //filtrar por temperamento
        if (selectedTemps.length > 0) { filteredList = filteredList.filter(animal => {
            const animalTempPT = translateTemperament(animal.temperament).toLowerCase();
            return selectedTemps.some(selected => animalTempPT.includes(selected.toLowerCase())); }); }

        //filtrar por LOCALIZAÇÃO
        if (locationSearch.trim()) { const loc = locationSearch.toLowerCase().trim(); filteredList = filteredList.filter(a => a.location && a.location.toLowerCase().includes(loc)); }
        if (sortByDistance && myLocation) { filteredList.sort((a, b) => { if (!a.lat || !a.lng) return 1;
            if (!b.lat || !b.lng) return -1;
            const distA = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, a.lat, a.lng);
            const distB = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, b.lat, b.lng);
            return distA - distB; }); }
        return filteredList;
    };


    //alterar favoritos
    const handleToggleFavorite = (id) => { const idString = id.toString();
        const isCurrentlyInStore = favorites.includes(idString);
        const isOptimistic = optimisticChanges[idString]; const isFavBeforeClick = isOptimistic !== undefined ? isOptimistic : isCurrentlyInStore;
        setOptimisticChanges(prev => ({ ...prev, [idString]: !isFavBeforeClick })); PetActions.toggleFavorite(id); };


    //ligar para adotar
    const handleAdoptCall = (contactNumber) => { if (!contactNumber) return Alert.alert("Aviso", "Sem contacto.");
        Linking.openURL(`tel:${contactNumber.replace(/[^0-9]/g, '')}`); };

    //marcar como adotado/disponivel
    const handleToggleStatus = async (animal) => { const idAnimal = animal._id || animal.id; const estadoAtual = animal.adopted === true || animal.adopted === "true"; const novoEstado = !estadoAtual; try {
        await PetActions.updateAnimal({ id: idAnimal, _id: idAnimal, adopted: novoEstado });
        Alert.alert("Sucesso", novoEstado ? "Marcado como Adotado! 🏠" : "Disponível! 🐶"); } catch (error) { console.log("Erro ao atualizar status:", error); Alert.alert("Erro", "Não foi possível atualizar o estado."); } };


    const formatDate = (isoString) => { if (!isoString) return ''; const date = new Date(isoString); return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`; };

    if (loading && !refreshing) return <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />;


    //FILTROS
    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.header}>
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tabButton, !showAdopted && styles.tabButtonActive]} onPress={() => setShowAdopted(false)}>
                        <Text style={[styles.tabText, !showAdopted && styles.tabTextActive]}>🐶 Disponíveis</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabButton, showAdopted && styles.tabButtonActive]} onPress={() => setShowAdopted(true)}>
                        <Text style={[styles.tabText, showAdopted && styles.tabTextActive]}>🏠 Adotados</Text>
                    </TouchableOpacity>
                </View>

                {!smartMatchTarget && (
                    <View style={styles.mainSearchRow}>
                        <TouchableOpacity style={styles.temperamentSelector} onPress={() => setIsTempModalVisible(true)}>
                            <Text style={styles.temperamentText} numberOfLines={1}>{selectedTemps.length > 0 ? `🧠 ${selectedTemps.length} selecionados` : "🔍 Selecionar Temperamentos"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]} onPress={toggleFilters}>
                            <Text style={[styles.filterToggleText, showFilters && {color: theme.colors.white}]}>⚙️ Filtros</Text>
                        </TouchableOpacity>
                    </View>
                )}


                {showFilters && !smartMatchTarget && (
                    <View style={styles.advancedFiltersContainer}>
                        <View style={styles.filterRow}>

                            <TouchableOpacity style={styles.breedSelector} onPress={() => setIsBreedModalVisible(true)}>
                                <Text style={styles.breedText} numberOfLines={1}>{filters.breed && filters.breed !== 'Todos' ? filters.breed : '🐕 Todas as Raças'}</Text>
                            </TouchableOpacity>
                            <TextInput style={styles.ageInput} placeholder="Idade Min" placeholderTextColor={theme.colors.textPlaceholder} keyboardType="numeric" value={filters.minAge} onChangeText={(t) => PetActions.setFilter('minAge', t)} />
                        </View>
                        <View style={styles.filterRow}>
                            <TextInput style={styles.cityInput} placeholder="📍 Filtrar por Cidade" placeholderTextColor={theme.colors.textPlaceholder} value={locationSearch} onChangeText={setLocationSearch} />
                        </View>
                        <TouchableOpacity style={[styles.gpsButton, sortByDistance && styles.gpsButtonActive]} onPress={toggleDistanceSort} disabled={loadingGPS}>
                            {loadingGPS ? <ActivityIndicator color={theme.colors.white} size="small"/> : <Text style={styles.gpsButtonText}>{sortByDistance ? "✅ Ordenado por Proximidade" : "🌍 Ordenar: Perto de Mim"}</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {smartMatchTarget && (
                    <View style={styles.smartFilterBadge}>
                        <Text style={styles.smartFilterText}>✨ Modo Compatibilidade</Text>
                        <TouchableOpacity onPress={() => {setSmartMatchTarget(null);
                            PetActions.loadAnimals();}} style={styles.clearButton}><Text style={styles.clearButtonText}>Limpar ✕</Text></TouchableOpacity>
                    </View>
                )}
            </View>


            <FlatList
                data={getFilteredAnimals()} extraData={[animals, showAdopted]} keyExtractor={(item) => String(item.id || item._id)}
                refreshControl={<RefreshControl
                    refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 10 }}
                renderItem={({ item }) => {
                    const idString = String(item.id || item._id); const isCurrentlyInStore = favorites.includes(idString); const isFav = optimisticChanges[idString] !== undefined ? optimisticChanges[idString] : isCurrentlyInStore;



                    let distanceText = ""; if (sortByDistance && myLocation && item.lat && item.lng) { const dist = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, item.lat, item.lng); distanceText = `${dist.toFixed(1)} km`; }
                    return (
                        <View style={{position: 'relative'}}>
                            {distanceText !== "" && <View style={styles.distanceBadge}><Text style={styles.distanceText}>📍 {distanceText}</Text></View>}
                            <PetCard item={item} isFav={isFav} isLoggedIn={isLoggedIn} userId={userId}
                                     onFavorite={handleToggleFavorite}
                                     onAdopt={handleAdoptCall}
                                     onToggleStatus={handleToggleStatus}
                                     onEdit={(animal) => navigation.navigate('AddAnimal', { animalToEdit: animal })}
                                     onDelete={(id, owner) => Alert.alert("Apagar", "Confirmas?", [{ text: "Não" }, { text: "Sim",
                                         onPress: () => PetActions.deleteAnimal(id, owner) }])} formatDate={formatDate} />
                        </View>
                    );
                }}
                ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 50, padding: 20 }}><Text style={{ textAlign: 'center', color: theme.colors.textSecondary, fontSize: 16 }}>Nenhum animal encontrado.</Text></View>}
            />
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAnimal')}><Text style={styles.fabText}>+</Text></TouchableOpacity>
            <BreedSearchModal isVisible={isBreedModalVisible} onClose={() => setIsBreedModalVisible(false)} onSelect={(b) => PetActions.setFilter('breed', b)} allBreeds={breeds} selectedBreedName={filters.breed || 'Todos'} showAllOption={true} />
            <TemperamentModal isVisible={isTempModalVisible} onClose={() => setIsTempModalVisible(false)} onApply={(selected) => setSelectedTemps(selected)} initialSelected={selectedTemps} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loader: { flex: 1, justifyContent: "center" },

    header: { backgroundColor: theme.colors.card, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 4, paddingBottom: 10, marginBottom: 10, shadowColor: theme.colors.shadow, shadowOpacity: 0.1, shadowRadius: 4 },
    tabsContainer: { flexDirection: 'row', marginBottom: 10 },
    tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabButtonActive: { borderBottomColor: theme.colors.primary },
    tabText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textSecondary },
    tabTextActive: { color: theme.colors.primary },

    mainSearchRow: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, alignItems: 'center' },
    filterToggleButton: { padding: 10, backgroundColor: theme.colors.primary, borderRadius: 12 },
    filterToggleButtonActive: { backgroundColor: theme.colors.primary },
    filterToggleText: { fontWeight: 'bold', color: theme.colors.white, fontSize: 12 },

    advancedFiltersContainer: { marginTop: 15, paddingHorizontal: 15, gap: 10 },
    filterRow: { flexDirection: 'row', gap: 10 },
    breedSelector: { flex: 1, height: 45, backgroundColor: theme.colors.inputBackground, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: theme.colors.border },
    breedText: { color: theme.colors.textPrimary },
    ageInput: { width: 120, height: 45, backgroundColor: theme.colors.inputBackground, borderRadius: 10, paddingHorizontal: 10, color: theme.colors.textPrimary, textAlign: 'center', borderWidth: 1, borderColor: theme.colors.border },
    cityInput: { flex: 1, height: 45, backgroundColor: theme.colors.inputBackground, borderRadius: 10, paddingHorizontal: 15, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border },

    gpsButton: { backgroundColor: theme.colors.secondary, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    gpsButtonActive: { backgroundColor: theme.colors.primary },
    gpsButtonText: { color: theme.colors.white, fontWeight: 'bold' },

    smartFilterBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.card, padding: 10, margin: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.primary },
    smartFilterText: { color: theme.colors.primary, fontWeight: 'bold' },
    clearButton: { backgroundColor: theme.colors.textSecondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
    clearButtonText: { color: theme.colors.white, fontSize: 12 },

    distanceBadge: { position: 'absolute', zIndex: 10, top: 30, right: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    distanceText: { color: theme.colors.white, fontSize: 12, fontWeight: 'bold' },

    fab: { position: 'absolute', bottom: 30, right: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: theme.colors.shadow },
    fabText: { color: theme.colors.white, fontSize: 30, fontWeight: 'bold', marginTop: -2 },

    temperamentSelector: { flex: 1, height: 45, backgroundColor: theme.colors.inputBackground, borderRadius: 25, justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1, borderColor: theme.colors.border },
    temperamentText: { color: theme.colors.textPrimary },
});