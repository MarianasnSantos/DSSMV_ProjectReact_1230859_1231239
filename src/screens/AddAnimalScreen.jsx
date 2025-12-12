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
} from "react-native";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { Picker } from '@react-native-picker/picker';

// Importações FLUX necessárias
import AuthStore from "../stores/AuthStore";
import PetStore from "../stores/PetStore";
import { PetActions } from "../actions/PetActions";


// --- Hook para observar o AuthStore (para obter o ID do utilizador) ---
function useAuthStoreState() {
    const [state, setState] = useState(AuthStore.getState());
    useEffect(() => {
        const handleChange = () => setState(AuthStore.getState());
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeListener(handleChange);
    }, []);
    return state;
}

// --- Hook para observar o PetStore (para obter a lista de raças) ---
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

// ⭐️ Componente Principal ⭐️
// Adicionamos 'route' para ler os parâmetros de navegação (animalToEdit)
export default function AddAnimalScreen({ navigation, route }) {

    // ⭐️ LEITURA DE PARÂMETROS DE EDIÇÃO ⭐️
    const { animalToEdit } = route.params || {};
    const isEditMode = !!animalToEdit;
    const animalId = animalToEdit?.id;

    // --- Inicialização de Estados (usa dados de edição, se existirem) ---
    const [name, setName] = useState(animalToEdit?.name || "");
    const [breed, setBreed] = useState(animalToEdit?.breed || "Sem Raça");
    // Garantir que a idade é string, se vier da edição como número
    const [age, setAge] = useState(animalToEdit?.age ? String(animalToEdit.age) : "");
    const [temperament, setTemperament] = useState(animalToEdit?.temperament || "");
    const [contactNumber, setContactNumber] = useState(animalToEdit?.contactNumber || "");
    const [photo, setPhoto] = useState(animalToEdit?.photoUrl || null);
    const [location, setLocation] = useState(animalToEdit?.location || "");

    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingTemperament, setIsFetchingTemperament] = useState(false);

    const { user } = useAuthStoreState();
    const { breeds } = usePetStoreState();
    const userId = user?._id || user?.id;

    // ⭐️ EFEITO: Configurar Título da Página ⭐️
    useEffect(() => {
        navigation.setOptions({
            title: isEditMode ? 'Editar Animal' : 'Adicionar Animal',
        });

        // Carrega as raças se necessário
        if (breeds.length <= 1) {
            PetActions.loadAnimals();
        }
    }, [isEditMode, navigation, breeds.length]);


    // --- Lógica de Temperamento Automático (Inalterado) ---
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

    // Handler para a mudança de Raça
    const handleBreedChange = (itemValue) => {
        setBreed(itemValue);

        if (itemValue === "Sem Raça") {
            setTemperament("");
            return;
        }

        fetchTemperamentForBreed(itemValue);
    };


    // --- Permissões, Fotos, Localização (Inalterado) ---
    const requestLocationPermission = async () => { /* ... */ };
    const requestCameraPermission = async () => { /* ... */ };
    const tirarFoto = async () => { /* ... */ };
    const abrirGaleria = async () => { /* ... */ };
    const obterLocalizacao = async () => { /* ... */ };


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
            // ID é necessário apenas em MODO DE EDIÇÃO
            ...(isEditMode && animalId && { id: animalId }),

            name,
            breed: finalBreed,
            age: Number(age),
            temperament,
            contactNumber,
            photoUrl: photo,
            location,

            // Campos de Publicação (Apenas em MODO DE CRIAÇÃO)
            ...(!isEditMode && {
                addedBy: user?.username || user?.name || "Utilizador",
                addedById: userId,
                createdAt: new Date().toISOString(),
            }),
            // Campo de Atualização (Apenas em MODO DE EDIÇÃO)
            ...(isEditMode && { updatedAt: new Date().toISOString() })
        };

        try {
            let success;
            let message;

            if (isEditMode) {
                // ⭐️ MODO EDIÇÃO ⭐️
                success = await PetActions.updateAnimal(animalData);
                message = "Animal atualizado com sucesso!";
            } else {
                // ⭐️ MODO CRIAÇÃO ⭐️
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

    // Determina se o campo de Temperamento é editável
    const isTemperamentManualInput = breed === "Sem Raça" || !temperament;
    const isTemperamentEditable = isTemperamentManualInput;


    // --- UI ---
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{isEditMode ? 'Editar Dados do Animal' : 'Adicionar Animal'}</Text>

            <Text style={styles.label}>Nome do Animal</Text>
            <TextInput style={styles.input} placeholder="Ex: Boby" placeholderTextColor="#FFB6C1" value={name} onChangeText={setName} />

            <Text style={styles.label}>Raça</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={breed}
                    style={styles.pickerInput}
                    onValueChange={handleBreedChange}
                >
                    <Picker.Item key="SemRaça" label="Sem Raça" value="Sem Raça" />

                    {breeds?.filter(b => b !== 'Todos').map((b, index) => (
                        <Picker.Item key={index} label={b} value={b} />
                    ))}
                </Picker>
            </View>


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
                    // ⭐️ TEXTO DO BOTÃO ALTERADO ⭐️
                    <Text style={styles.saveButtonText}>{isEditMode ? 'Guardar Alterações' : 'Salvar Animal'}</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

// --- Estilos (Inalterado) ---
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
    pickerContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: "#FFB6C1",
        elevation: 3,
        shadowColor: "#FF69B4",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        overflow: 'hidden',
    },
    pickerInput: {
        color: "#880E4F",
    },
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