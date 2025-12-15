// src/screens/AddAnimalScreen.jsx

import React, { useState, useEffect } from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    View,
    ActivityIndicator,
    PermissionsAndroid,
    Platform,
    Modal, // ⭐️ Usado para o autocomplete ⭐️
    FlatList, // Usado para renderizar a lista de raças dentro do Modal
} from "react-native";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';

// Importações FLUX necessárias
import AuthStore from "../stores/AuthStore";
import PetStore from "../stores/PetStore";
import { PetActions } from "../actions/PetActions";


// --- Hooks ---
function useAuthStoreState() {
    const [state, setState] = useState(AuthStore.getState());
    useEffect(() => {
        const handleChange = () => setState(AuthStore.getState());
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeListener(handleChange);
    }, []);
    return state;
}

function usePetStoreState() {
    const [state, setState] = useState(PetStore.getState());
    useEffect(() => {
        const handleChange = () => setState(PetStore.getState());
        PetStore.addChangeListener(handleChange);
        return () => PetStore.removeListener(handleChange);
    }, []);
    return state;
}

const DOG_API_URL = "https://api.thedogapi.com/v1";


// --- Componente Auxiliar para Seleção de Raças (Modal) ---
const BreedSelectModal = ({ isVisible, breeds, onSelect, onClose, searchQuery, onSearchChange }) => {

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={modalStyles.container}>
                <View style={modalStyles.header}>
                    <Text style={modalStyles.title}>Pesquisar Raça</Text>
                    <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                        <Text style={modalStyles.closeButtonText}>Fechar</Text>
                    </TouchableOpacity>
                </View>

                {/* Campo de Pesquisa dentro do Modal */}
                <TextInput
                    style={modalStyles.input}
                    placeholder="Comece a digitar o nome da raça..."
                    placeholderTextColor="#A0A0A0"
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />

                {/* FLATLIST ISOLADA (Evita o warning de ScrollView aninhada) */}
                <FlatList
                    data={breeds}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={modalStyles.item}
                            onPress={() => onSelect(item)}
                        >
                            <Text>{item}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={modalStyles.emptyText}>Nenhuma raça encontrada.</Text>}
                />
            </View>
        </Modal>
    );
};


// ⭐️ Componente Principal ⭐️
export default function AddAnimalScreen({ navigation, route }) {

    const { animalToEdit } = route.params || {};
    const isEditMode = !!animalToEdit;
    const animalId = animalToEdit?.id;

    // --- Inicialização de Estados ---
    const [name, setName] = useState(animalToEdit?.name || "");
    const [breed, setBreed] = useState(animalToEdit?.breed || "Sem Raça");
    const [age, setAge] = useState(animalToEdit?.age ? String(animalToEdit.age) : "");
    const [temperament, setTemperament] = useState(animalToEdit?.temperament || "");
    const [contactNumber, setContactNumber] = useState(animalToEdit?.contactNumber || "");
    const [photo, setPhoto] = useState(animalToEdit?.photoUrl || null);
    const [location, setLocation] = useState(animalToEdit?.location || "");

    const [breedSearchQuery, setBreedSearchQuery] = useState(animalToEdit?.breed || "");
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);

    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingTemperament, setIsFetchingTemperament] = useState(false);

    const { user } = useAuthStoreState();
    const { breeds } = usePetStoreState();
    const userId = user?._id || user?.id;

    // ⭐️ EFEITO: Configurar Título e Carregar Raças ⭐️
    useEffect(() => {
        navigation.setOptions({
            title: isEditMode ? 'Editar Animal' : 'Adicionar Animal',
        });

        if (breeds.length <= 1) {
            PetActions.loadAnimals();
        }
    }, [isEditMode, navigation, breeds.length]);


    // --- Lógica de Temperamento Automático ---
    const fetchTemperamentForBreed = async (selectedBreed) => {
        setIsFetchingTemperament(true);
        setTemperament("");

        try {
            const response = await fetch(`${DOG_API_URL}/breeds/search?q=${selectedBreed}`);
            const data = await response.json();

            if (data && data.length > 0 && data[0].temperament) {
                setTemperament(data[0].temperament);
            } else {
                Alert.alert("Aviso", `Temperamento para "${selectedBreed}" não encontrado na API. Por favor, escreva manualmente.`);
            }
        } catch (error) {
            console.error("Erro ao obter temperamento da API:", error);
            Alert.alert("Erro", "Falha na comunicação com a API de raças.");
        } finally {
            setIsFetchingTemperament(false);
        }
    };

    // ⭐️ Handler de Seleção de Raça (usado pelo Modal) ⭐️
    const handleBreedSelect = (selectedBreed) => {
        setBreed(selectedBreed);
        setBreedSearchQuery(selectedBreed);
        setIsBreedModalVisible(false); // Fecha o Modal

        if (selectedBreed === "Sem Raça") {
            setTemperament("");
            return;
        }
        fetchTemperamentForBreed(selectedBreed);
    };

    // Handler de Mudança no TextInput de Pesquisa (dentro do Modal)
    const handleBreedSearchChange = (text) => {
        setBreedSearchQuery(text);
        // Não atualizamos 'breed' aqui, só quando o utilizador selecionar.
    };


    // ⭐️ Lógica de Filtro para o Modal ⭐️
    const getFilteredBreeds = () => {
        const breedList = ["Sem Raça", ...breeds.filter(b => b !== 'Todos')];

        const query = breedSearchQuery.trim().toLowerCase();
        if (query === "") {
            return breedList;
        }

        return breedList.filter(b => b.toLowerCase().includes(query));
    };

    const filteredBreeds = getFilteredBreeds();


    // -------------------------------------------------------------
    // ⭐️ FUNÇÕES DE PERMISSÃO E LOCALIZAÇÃO (COMPLETAS) ⭐️
    // -------------------------------------------------------------
    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Permissão de Localização",
                        message: "Precisamos de acessar sua localização para registrar o animal.",
                        buttonNeutral: "Perguntar Depois",
                        buttonNegative: "Cancelar",
                        buttonPositive: "OK"
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const tirarFoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert("Permissão negada", "Necessário permissão para usar a câmera.");
            return;
        }
        launchCamera({ mediaType: 'photo', quality: 0.1, includeBase64: true }, (response) => {
            if (response.didCancel) return;
            if (response.errorMessage) return Alert.alert("Erro da Câmera", response.errorMessage);
            if (response.assets && response.assets.length > 0) {
                setPhoto(`data:image/jpeg;base64,${response.assets[0].base64}`);
            }
        });
    };

    const abrirGaleria = async () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.1, includeBase64: true }, (response) => {
            if (response.didCancel) return;
            if (response.errorMessage) return Alert.alert("Erro da Galeria", response.errorMessage);
            if (response.assets && response.assets.length > 0) {
                setPhoto(`data:image/jpeg;base64,${response.assets[0].base64}`);
            }
        });
    };

    const obterLocalizacao = async () => {
        setLoadingLocation(true);
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
            Alert.alert("Permissão negada", "Não podemos obter a localização sem permissão.");
            setLoadingLocation(false);
            return;
        }

        Geolocation.getCurrentPosition(
            (position) => {
                const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                setLocation(coords);
                setLoadingLocation(false);
            },
            (error) => {
                console.error("Erro Geolocation:", error);
                Alert.alert("Erro de Localização", `Não foi possível obter a localização: ${error.message}. Tente novamente.`);
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };
    // -------------------------------------------------------------


    // --- Submissão (Lógica de Edição/Criação) ---
    const handleSubmit = async () => {

        if (!name || !contactNumber || (breed === "Sem Raça" && !temperament)) {
            Alert.alert("Erro", "Nome, Contacto e Temperamento (se não houver raça) são obrigatórios.");
            return;
        }

        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para adicionar ou editar um animal.");
            return;
        }

        setIsSaving(true);
        const finalBreed = breed === "Sem Raça" ? "" : breed;

        const animalData = {
            ...(isEditMode && animalId && { id: animalId }),
            name,
            breed: finalBreed,
            age: Number(age),
            temperament,
            contactNumber,
            photoUrl: photo,
            location,

            ...(!isEditMode && {
                addedBy: user?.username || user?.name || "Utilizador",
                addedById: userId,
                createdAt: new Date().toISOString(),
            }),
            ...(isEditMode && { updatedAt: new Date().toISOString() })
        };

        try {
            let success;
            let message;

            if (isEditMode) {
                success = await PetActions.updateAnimal(animalData);
                message = "Animal atualizado com sucesso!";
            } else {
                success = await PetActions.addAnimal(animalData);
                message = "Animal adicionado com sucesso e visível no Feed!";
            }

            if (!success) {
                Alert.alert("Erro", `Ocorreu um erro ao ${isEditMode ? 'atualizar' : 'salvar'} o animal.`);
                return;
            }

            Alert.alert("Sucesso", message);
            navigation.goBack();

        } catch (error) {
            console.error("Erro na submissão:", error);
            Alert.alert("Erro", "Falha ao enviar dados.");
        } finally {
            setIsSaving(false);
        }
    };

    const isTemperamentManualInput = breed === "Sem Raça" || !temperament;
    const isTemperamentEditable = isTemperamentManualInput;


    // --- UI ---
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{isEditMode ? 'Editar Dados do Animal' : 'Adicionar Animal'}</Text>

            <Text style={styles.label}>Nome do Animal</Text>
            <TextInput style={styles.input} placeholder="Ex: Boby" placeholderTextColor="#FFB6C1" value={name} onChangeText={setName} />

            {/* ⭐️ SEÇÃO DE SELEÇÃO DE RAÇA COM MODAL ⭐️ */}
            <Text style={styles.label}>Raça</Text>
            <TouchableOpacity
                style={[styles.input, styles.pickerContainer]}
                onPress={() => setIsBreedModalVisible(true)}
            >
                <Text style={styles.breedDisplayText}>{breed}</Text>
                <Text style={styles.openModalText}>PESQUISAR</Text>
            </TouchableOpacity>
            {/* ⭐️ FIM DA SEÇÃO DE SELEÇÃO DE RAÇA COM MODAL ⭐️ */}


            <Text style={styles.label}>Idade (anos)</Text>
            <TextInput style={styles.input} placeholder="Ex: 2" placeholderTextColor="#FFB6C1" value={age} onChangeText={setAge} keyboardType="numeric" />

            <Text style={styles.label}>Temperamento</Text>
            {/* INPUT DE TEMPERAMENTO COM LÓGICA DE AUTO-PREENCHIMENTO */}
            <View style={styles.inputContainerWithStatus}>
                <TextInput
                    style={[styles.input, !isTemperamentEditable && styles.disabledInput]}
                    placeholder={isFetchingTemperament ? "A obter Temperamento..." : "Ex: Calmo, Brincalhão"}
                    placeholderTextColor={isFetchingTemperament ? "#FF69B4" : "#FFB6C1"}
                    value={temperament}
                    onChangeText={setTemperament}
                    editable={isTemperamentEditable}
                />
                {isFetchingTemperament && (
                    <ActivityIndicator style={styles.statusIndicator} size="small" color="#D81B60" />
                )}
            </View>

            <Text style={styles.label}>Contacto (Telemóvel)</Text>
            <TextInput style={styles.input} placeholder="Ex: 912345678" placeholderTextColor="#FFB6C1" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

            <Text style={styles.label}>Localização Atual</Text>
            <View style={styles.locationContainer}>
                <TouchableOpacity style={styles.locationButton} onPress={obterLocalizacao} disabled={loadingLocation}>
                    {loadingLocation ? <ActivityIndicator color="#FFF" /> : <Text style={styles.locationButtonText}>📍 Obter Localização</Text>}
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, styles.locationInput]}
                    placeholder="Coordenadas aparecerão aqui..."
                    placeholderTextColor="#FFB6C1"
                    value={location}
                    onChangeText={setLocation}
                    editable={!loadingLocation}
                />
            </View>

            <Text style={styles.label}>Foto do Animal</Text>
            <View style={styles.photoButtonsContainer}>
                <TouchableOpacity style={styles.photoButton} onPress={tirarFoto}><Text style={styles.photoButtonText}>📷 Tirar Foto</Text></TouchableOpacity>
                <TouchableOpacity style={styles.photoButtonOutline} onPress={abrirGaleria}><Text style={styles.photoButtonTextOutline}>🖼️ Galeria</Text></TouchableOpacity>
            </View>

            {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <Text style={styles.saveButtonText}>{isEditMode ? 'Guardar Alterações' : 'Salvar Animal'}</Text>
                )}
            </TouchableOpacity>

            {/* ⭐️ MODAL DE SELEÇÃO DE RAÇAS ⭐️ */}
            <BreedSelectModal
                isVisible={isBreedModalVisible}
                breeds={filteredBreeds}
                onSelect={handleBreedSelect}
                onClose={() => setIsBreedModalVisible(false)}
                searchQuery={breedSearchQuery}
                onSearchChange={handleBreedSearchChange}
            />
        </ScrollView>
    );
}

// -----------------------------------------------------------------
// ⭐️ ESTILOS DO MODAL ⭐️
// -----------------------------------------------------------------
const modalStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#FFF0F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D81B60',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#FF69B4',
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 15,
        fontSize: 16,
        color: "#880E4F",
        borderWidth: 1.5,
        borderColor: "#FFB6C1",
        marginBottom: 20,
    },
    item: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#A0A0A0',
    },
});

// -----------------------------------------------------------------
// ⭐️ ESTILOS DO COMPONENTE PRINCIPAL (ADICIONAR) ⭐️
// -----------------------------------------------------------------
const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 25, backgroundColor: "#FFF0F5" },
    title: { fontSize: 30, fontWeight: "bold", color: "#D81B60", textAlign: "center", marginBottom: 10, marginTop: 10 },
    label: { fontSize: 18, fontWeight: "600", color: "#D81B60", marginLeft: 5, marginBottom: 8, marginTop: 20 },
    input: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 15,
        fontSize: 16,
        color: "#880E4F",
        borderWidth: 1.5,
        borderColor: "#FFB6C1",
        elevation: 3,
        shadowColor: "#FF69B4",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    // ⭐️ ESTILOS DO NOVO SELETOR DE RAÇAS ⭐️
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15, // Ajusta o padding para ficar parecido com o input
    },
    breedDisplayText: {
        fontSize: 16,
        color: '#880E4F',
    },
    openModalText: {
        fontSize: 14,
        color: '#D81B60',
        fontWeight: 'bold',
    },
    // ⭐️ FIM DOS ESTILOS DO NOVO SELETOR DE RAÇAS ⭐️

    locationContainer: { gap: 10 },
    locationButton: { backgroundColor: "#FF69B4", padding: 12, borderRadius: 15, alignItems: "center", elevation: 2 },
    locationButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    locationInput: { backgroundColor: "#FFFFFF", color: "#880E4F", fontStyle: "italic" },
    photoButtonsContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    photoButton: { flex: 1, backgroundColor: "#FFB6C1", padding: 15, borderRadius: 15, alignItems: "center", elevation: 2 },
    photoButtonOutline: { flex: 1, backgroundColor: "transparent", padding: 15, borderRadius: 15, alignItems: "center", borderWidth: 2, borderColor: "#FFB6C1" },
    photoButtonText: { color: "#880E4F", fontWeight: "bold" },
    photoButtonTextOutline: { color: "#FF69B4", fontWeight: "bold" },
    previewImage: { width: "100%", height: 200, borderRadius: 15, marginTop: 15, borderWidth: 2, borderColor: "#D81B60" },
    saveButton: { backgroundColor: "#D81B60", paddingVertical: 18, borderRadius: 30, alignItems: "center", marginTop: 40, marginBottom: 40, elevation: 5, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 3.84, shadowOffset: { width: 0, height: 2 }, },
    saveButtonText: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold", letterSpacing: 0.5 },

    // Estilos para o input de temperamento e loading
    inputContainerWithStatus: {
        position: 'relative',
        justifyContent: 'center',
    },
    disabledInput: {
        backgroundColor: '#F0F0F0',
        borderColor: '#E0E0E0',
        color: '#A0A0A0',
    },
    statusIndicator: {
        position: 'absolute',
        right: 15,
    },
});