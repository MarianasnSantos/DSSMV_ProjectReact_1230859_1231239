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

// Variável para URL da API de Raças (Pode precisar de uma chave API no seu projeto real)
const DOG_API_URL = "https://api.thedogapi.com/v1";

export default function AddAnimalScreen({ navigation }) {

    const [name, setName] = useState("");
    // Estado inicial com a opção "Sem Raça"
    const [breed, setBreed] = useState("Sem Raça");
    const [age, setAge] = useState("");
    const [temperament, setTemperament] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState("");
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingTemperament, setIsFetchingTemperament] = useState(false); // Estado de loading para o temperamento

    const { user } = useAuthStoreState();
    const { breeds } = usePetStoreState();

    const userId = user?._id || user?.id;

    // --- Efeito para carregar as raças se não estiverem disponíveis ---
    useEffect(() => {
        // Assume que 'Todos' é sempre o primeiro item se a lista for carregada
        if (breeds.length <= 1) {
            PetActions.loadAnimals();
        }
    }, [breeds.length]);

    // --- Lógica de Temperamento Automático ---
    const fetchTemperamentForBreed = async (selectedBreed) => {
        setIsFetchingTemperament(true);
        setTemperament(""); // Limpa enquanto procura

        try {
            // Busca o temperamento usando o nome da raça
            const response = await fetch(`${DOG_API_URL}/breeds/search?q=${selectedBreed}`);
            const data = await response.json();

            if (data && data.length > 0 && data[0].temperament) {
                // Se encontrar, define o temperamento automaticamente
                setTemperament(data[0].temperament);
            } else {
                // Se não encontrar, avisa e deixa para escrita manual
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
            setTemperament(""); // Limpa para escrita manual
            return;
        }

        // Se for uma raça, tenta obter o temperamento automaticamente
        fetchTemperamentForBreed(itemValue);
    };


    // --- Permissões e UI para Câmera/Galeria (Inalterado) ---
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

    // --- Localização ---
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
                Alert.alert("Erro de Localização", `Não foi possível obter a localização: ${error.message}`);
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    // --- Submissão ---
    const handleSubmit = async () => {
        // Validação adicional: Se for "Sem Raça", o Temperamento deve ser obrigatório
        if (!name || !breed || !contactNumber || (breed === "Sem Raça" && !temperament)) {
            Alert.alert("Erro", "Nome, Raça, Contacto são obrigatórios. Se não houver raça, o Temperamento é obrigatório.");
            return;
        }

        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para adicionar um animal.");
            return;
        }

        setIsSaving(true);

        // Se a raça for "Sem Raça", enviamos string vazia para o servidor
        const finalBreed = breed === "Sem Raça" ? "" : breed;

        const newAnimal = {
            name,
            breed: finalBreed,
            age: Number(age),
            temperament,
            contactNumber,
            photoUrl: photo,
            location,

            addedBy: user?.username || user?.name || "Utilizador",
            addedById: userId,
            createdAt: new Date().toISOString(), // Grava a data de publicação
        };

        try {
            const success = await PetActions.addAnimal(newAnimal);

            if (!success) {
                Alert.alert("Erro", "Ocorreu um erro ao salvar o animal.");
                return;
            }

            Alert.alert("Sucesso", "Animal adicionado com sucesso e visível no Feed!");
            navigation.goBack();

        } catch (error) {
            console.error("Erro na submissão:", error);
            Alert.alert("Erro", "Falha ao enviar dados.");
        } finally {
            setIsSaving(false);
        }
    };

    // Determina se o campo de Temperamento deve ser manual (habilitado)
    // É manual se: 1) for "Sem Raça" OU 2) estiver a carregar OU 3) o valor automático veio vazio
    const isTemperamentManualInput = breed === "Sem Raça" || !temperament;
    const isTemperamentEditable = isTemperamentManualInput;


    // --- UI ---
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Adicionar Animal</Text>

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
                    <Text style={styles.saveButtonText}>Salvar Animal</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

// --- Estilos ---
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
        backgroundColor: '#F0F0F0', // Cor de fundo para indicar que está desabilitado
        borderColor: '#E0E0E0',
        color: '#A0A0A0',
    },
    statusIndicator: {
        position: 'absolute',
        right: 15,
    },
});