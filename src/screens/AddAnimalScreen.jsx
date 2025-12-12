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

// ⚠️ ATENÇÃO: Se estiveres a usar o sistema de Actions/Store, devias usar PetActions aqui também.
// Se preferires usar a API direta, certifica-te que o import está correto para o teu ficheiro 'restDB.js'
import { addAnimal } from "../api/animalsAPI"; // Ou "../API/restDB" se mudaste o nome
import AuthStore from "../stores/AuthStore";
import { PetActions } from "../actions/PetActions"; // Recomendado usar Actions para atualizar o Feed automático

// --- Hook para observar o AuthStore ---
function useAuthStoreState() {
    const [state, setState] = useState(AuthStore.getState());
    useEffect(() => {
        const handleChange = () => setState(AuthStore.getState());
        AuthStore.addChangeListener(handleChange);
        return () => AuthStore.removeListener(handleChange);
    }, []);
    return state;
}

export default function AddAnimalScreen({ navigation }) {

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [temperament, setTemperament] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState("");
    const [loadingLocation, setLoadingLocation] = useState(false);

    const { user } = useAuthStoreState();
    // Garante que apanha o ID, seja _id ou id
    const userId = user?._id || user?.id;

    // --- Permissões ---
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

    // --- Fotos ---
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
        if (!name || !breed || !contactNumber) {
            Alert.alert("Erro", "Nome, Raça e Contacto são obrigatórios.");
            return;
        }

        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para adicionar um animal.");
            return;
        }

        // --- CORREÇÃO PRINCIPAL AQUI ---
        const newAnimal = {
            name,
            breed,
            age: Number(age), // RestDB espera número
            temperament,
            contactNumber,
            photoUrl: photo, // Nome correto da coluna no RestDB
            location,

            // Nome para mostrar no Feed (Ex: "Publicado por: Ana")
            addedBy: user?.name || user?.email || "Utilizador",

            // ID CRÍTICO para o botão de apagar funcionar
            addedById: userId,

            createdAt: new Date().toISOString(),
        };

        try {
            // Se tiveres PetActions implementado, usa este:
            // const result = await PetActions.addAnimal(newAnimal);

            // Se estiveres a usar a API direta:
            const result = await addAnimal(newAnimal);

            if (!result) {
                Alert.alert("Erro", "Ocorreu um erro ao salvar. Verifique a foto ou a API.");
                return;
            }

            Alert.alert("Sucesso", "Animal adicionado com sucesso!");

            // Se usares Actions, isto não é preciso, mas mal não faz:
            PetActions.loadAnimals();

            navigation.goBack();

        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Falha ao enviar dados.");
        }
    };

    // --- UI ---
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Adicionar Animal</Text>

            <Text style={styles.label}>Nome do Animal</Text>
            <TextInput style={styles.input} placeholder="Ex: Boby" placeholderTextColor="#FFB6C1" value={name} onChangeText={setName} />

            <Text style={styles.label}>Raça</Text>
            <TextInput style={styles.input} placeholder="Ex: Labrador" placeholderTextColor="#FFB6C1" value={breed} onChangeText={setBreed} />

            <Text style={styles.label}>Idade (anos)</Text>
            <TextInput style={styles.input} placeholder="Ex: 2" placeholderTextColor="#FFB6C1" value={age} onChangeText={setAge} keyboardType="numeric" />

            <Text style={styles.label}>Temperamento</Text>
            <TextInput style={styles.input} placeholder="Ex: Calmo, Brincalhão" placeholderTextColor="#FFB6C1" value={temperament} onChangeText={setTemperament} />

            <Text style={styles.label}>Contacto (Telemóvel)</Text>
            <TextInput style={styles.input} placeholder="Ex: 912345678" placeholderTextColor="#FFB6C1" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

            <Text style={styles.label}>Localização Atual</Text>
            <View style={styles.locationContainer}>
                <TouchableOpacity style={styles.locationButton} onPress={obterLocalizacao}>
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

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>Salvar Animal</Text>
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