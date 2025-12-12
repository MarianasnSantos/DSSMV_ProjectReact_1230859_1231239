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
import { Picker } from '@react-native-picker/picker'; // ⭐️ IMPORTAR PICKER ⭐️

// Importações FLUX necessárias
import AuthStore from "../stores/AuthStore";
import PetStore from "../stores/PetStore"; // ⭐️ IMPORTAR PETSTORE ⭐️
import { PetActions } from "../actions/PetActions";
// ❌ REMOVER: import { addAnimal } from "../api/animalsAPI";

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

export default function AddAnimalScreen({ navigation }) {

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("Sem Raça"); // ⭐️ Estado inicial para o Picker ⭐️
    const [age, setAge] = useState("");
    const [temperament, setTemperament] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState("");
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { user } = useAuthStoreState();
    const { breeds } = usePetStoreState(); // ⭐️ Obter lista de raças ⭐️

    const userId = user?._id || user?.id;

    // --- Efeito para carregar as raças se não estiverem disponíveis ---
    useEffect(() => {
        if (breeds.length <= 1) { // Verifica se só tem o valor padrão 'Todos'
            PetActions.loadAnimals(); // Isto carrega animais e raças
        }
    }, [breeds.length]);


    // --- Permissões (Inalterado) ---
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

    // --- Fotos (Inalterado) ---
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

    // --- Localização (Inalterado) ---
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
        if (!name || !breed || !contactNumber) {
            Alert.alert("Erro", "Nome, Raça e Contacto são obrigatórios.");
            return;
        }

        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para adicionar um animal.");
            return;
        }

        setIsSaving(true);

        // A Raça será o valor selecionado no Picker (breed)
        const finalBreed = breed === "Sem Raça" ? "" : breed;

        const newAnimal = {
            name,
            breed: finalBreed, // Usar o valor do Picker
            age: Number(age),
            temperament,
            contactNumber,
            photoUrl: photo,
            location,

            addedBy: user?.username || user?.name || "Utilizador",
            addedById: userId,
            createdAt: new Date().toISOString(),
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

    // --- UI ---
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Adicionar Animal</Text>

            <Text style={styles.label}>Nome do Animal</Text>
            <TextInput style={styles.input} placeholder="Ex: Boby" placeholderTextColor="#FFB6C1" value={name} onChangeText={setName} />

            <Text style={styles.label}>Raça</Text>
            {/* ⭐️ PICKER SUBSTITUI TEXTINPUT ⭐️ */}
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={breed}
                    style={styles.pickerInput}
                    onValueChange={(itemValue) => setBreed(itemValue)}
                >
                    <Picker.Item key="SemRaça" label="Sem Raça" value="Sem Raça" />

                    {/* Filtra o "Todos" que vem do PetStore */}
                    {breeds?.filter(b => b !== 'Todos').map((b, index) => (
                        <Picker.Item key={index} label={b} value={b} />
                    ))}
                </Picker>
            </View>
            {/* FIM PICKER */}


            <Text style={styles.label}>Idade (anos)</Text>
            <TextInput style={styles.input} placeholder="Ex: 2" placeholderTextColor="#FFB6C1" value={age} onChangeText={setAge} keyboardType="numeric" />

            <Text style={styles.label}>Temperamento</Text>
            <TextInput style={styles.input} placeholder="Ex: Calmo, Brincalhão" placeholderTextColor="#FFB6C1" value={temperament} onChangeText={setTemperament} />

            <Text style={styles.label}>Contacto (Telemóvel)</Text>
            <TextInput style={styles.input} placeholder="Ex: 912345678" placeholderTextColor="#FFB6C1" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

            <Text style={styles.label}>Localização Atual</Text>
            <View style={styles.locationContainer}>
                <TouchableOpacity style={styles.locationButton} onPress={obterLocalizacao} disabled={loadingLocation}>
                    {loadingLocation ? <ActivityIndicator color="#FFF" /> : <Text style={styles.locationButtonText}>📍 Obter Localização</Text>}
                </TouchableOpacity>
                <TextInput style={[styles.input, styles.locationInput]} placeholder="Coordenadas aparecerão aqui..." placeholderTextColor="#FFB6C1" value={location} onChangeText={setLocation} />
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
    // ⭐️ NOVO ESTILO PARA CONTAINER DO PICKER ⭐️
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
        overflow: 'hidden', // Importante para o Android
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
});