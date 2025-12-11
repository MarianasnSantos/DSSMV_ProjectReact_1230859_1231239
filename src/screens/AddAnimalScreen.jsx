// src/screens/AddAnimalScreen.jsx

import React, { useState } from "react";
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
    Platform, // Usado para permissões específicas de Android/iOS
} from "react-native";

// ✅ Importações Corrigidas para React Native CLI
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { addAnimal } from "../api/animalsAPI"; // Assumindo que esta API existe

export default function AddAnimalScreen({ navigation }) {

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [temperament, setTemperament] = useState("");
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState("");
    const [loadingLocation, setLoadingLocation] = useState(false);

    // --- UTILITY: TRATAMENTO DE PERMISSÕES PARA LOCALIZAÇÃO (Android) ---
    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                // Solicita a permissão de localização fina (a mais precisa)
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Permissão de Localização",
                        message: "Precisamos de acesso à sua localização para registar o animal.",
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
        return true; // iOS lida com permissões de forma diferente (Info.plist)
    };


    // --- FUNÇÃO DE FOTO (RN Image Picker) ---
    const tirarFoto = async () => {
        if (Platform.OS === 'android' && !(await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA))) {
            Alert.alert("Permissão negada", "Precisas de dar permissão para usar a câmara.");
            return;
        }

        const options = {
            mediaType: 'photo',
            quality: 0.1, // CRÍTICO: Baixa qualidade para upload rápido ao RestDB
            includeBase64: true,
        };

        launchCamera(options, (response) => {
            if (response.didCancel) {
                console.log('Utilizador cancelou a foto');
            } else if (response.errorMessage) {
                Alert.alert("Erro da Câmara", response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
                setPhoto(`data:image/jpeg;base64,${response.assets[0].base64}`);
            }
        });
    };

    // --- FUNÇÃO DE GALERIA (RN Image Picker) ---
    const abrirGaleria = async () => {
        const options = {
            mediaType: 'photo',
            quality: 0.1,
            includeBase64: true,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('Utilizador cancelou a galeria');
            } else if (response.errorMessage) {
                Alert.alert("Erro da Galeria", response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
                setPhoto(`data:image/jpeg;base64,${response.assets[0].base64}`);
            }
        });
    };

    // ⭐️ LÓGICA CORRIGIDA E ROBUSTA ⭐️
    // --- OBTER LOCALIZAÇÃO (RN Geolocation Service) ---
    const obterLocalizacao = async () => {
        setLoadingLocation(true);

        // 1. Pedir permissão: Se não tiver, sai
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
            Alert.alert("Permissão negada", "Não podemos obter a localização sem a permissão do GPS.");
            setLoadingLocation(false);
            return;
        }

        // 2. Chamar o serviço de localização
        Geolocation.getCurrentPosition(
            (position) => {
                const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                setLocation(coords);
                setLoadingLocation(false);
                Alert.alert("Localização Obtida", `Coordenadas: ${coords}`);
            },
            (error) => {
                // Erro pode ser: GPS desligado, timeout, etc.
                Alert.alert("Erro de Localização", `Não foi possível obter a localização. Verifique o GPS. (${error.message})`);
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    // --- FUNÇÃO DE SUBMISSÃO ---
    async function handleSubmit() {
        if (!name || !breed) {
            Alert.alert("Erro", "O nome e a raça são obrigatórios.");
            return;
        }

        const newAnimal = {
            name,
            breed,
            age: Number(age),
            temperament,
            photoUrl: photo,
            location: location,
            addedBy: "user-app",
            createdAt: new Date().toISOString(),
        };

        const result = await addAnimal(newAnimal);

        if (!result) {
            Alert.alert("Erro", "Ocorreu um erro ao enviar. A foto pode ser muito pesada ou a API falhou.");
            return;
        }

        Alert.alert("Sucesso", "Animal adicionado com sucesso!");
        navigation.goBack();
    }


    // --- Renderização (UI) ---
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Adicionar Animal</Text>

            {/* BLOCO NOME */}
            <Text style={styles.label}>Nome do Animal</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Boby"
                placeholderTextColor="#FFB6C1"
                value={name}
                onChangeText={setName}
            />

            {/* BLOCO RAÇA */}
            <Text style={styles.label}>Raça</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Labrador"
                placeholderTextColor="#FFB6C1"
                value={breed}
                onChangeText={setBreed}
            />

            {/* BLOCO IDADE */}
            <Text style={styles.label}>Idade (anos)</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: 2"
                placeholderTextColor="#FFB6C1"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
            />

            {/* BLOCO TEMPERAMENTO */}
            <Text style={styles.label}>Temperamento</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Calmo, Brincalhão"
                placeholderTextColor="#FFB6C1"
                value={temperament}
                onChangeText={setTemperament}
            />

            {/* BLOCO LOCALIZAÇÃO */}
            <Text style={styles.label}>Localização Atual</Text>
            <View style={styles.locationContainer}>
                <TouchableOpacity style={styles.locationButton} onPress={obterLocalizacao}>
                    {loadingLocation ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.locationButtonText}>📍 Obter Localização</Text>
                    )}
                </TouchableOpacity>

                <TextInput
                    style={[styles.input, styles.locationInput]}
                    placeholder="Coordenadas aparecerão aqui..."
                    placeholderTextColor="#FFB6C1"
                    value={location}
                    onChangeText={setLocation}
                    editable={true}
                />
            </View>

            {/* BLOCO FOTO */}
            <Text style={styles.label}>Foto do Animal</Text>
            <View style={styles.photoButtonsContainer}>
                <TouchableOpacity style={styles.photoButton} onPress={tirarFoto}>
                    <Text style={styles.photoButtonText}>📷 Tirar Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoButtonOutline} onPress={abrirGaleria}>
                    <Text style={styles.photoButtonTextOutline}>🖼️ Galeria</Text>
                </TouchableOpacity>
            </View>

            {photo && (
                <Image source={{ uri: photo }} style={styles.previewImage} />
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>Salvar Animal</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 25,
        backgroundColor: "#FFF0F5",
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#D81B60",
        textAlign: "center",
        marginBottom: 10,
        marginTop: 10,
    },
    label: {
        fontSize: 18,
        fontWeight: "600",
        color: "#D81B60",
        marginLeft: 5,
        marginBottom: 8,
        marginTop: 20,
    },
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
        shadowOffset: { width: 0, height: 2 }
    },
    locationContainer: {
        gap: 10,
    },
    locationButton: {
        backgroundColor: "#FF69B4",
        padding: 12,
        borderRadius: 15,
        alignItems: "center",
        elevation: 2,
    },
    locationButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    locationInput: {
        backgroundColor: "#FFFFFF", // Fundo Branco Puro (Alto Contraste)
        color: "#880E4F",           // Cor de texto: Bordô Escuro (Alta Legibilidade)
        fontStyle: "italic",
    },
    photoButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    photoButton: {
        flex: 1,
        backgroundColor: "#FFB6C1",
        padding: 15,
        borderRadius: 15,
        alignItems: "center",
        elevation: 2,
    },
    photoButtonOutline: {
        flex: 1,
        backgroundColor: "transparent",
        padding: 15,
        borderRadius: 15,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFB6C1",
    },
    photoButtonText: {
        color: "#880E4F",
        fontWeight: "bold",
    },
    photoButtonTextOutline: {
        color: "#FF69B4",
        fontWeight: "bold",
    },
    previewImage: {
        width: "100%",
        height: 200,
        borderRadius: 15,
        marginTop: 15,
        borderWidth: 2,
        borderColor: "#D81B60",
    },
    saveButton: {
        backgroundColor: "#D81B60",
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: "center",
        marginTop: 40,
        marginBottom: 40,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        shadowOffset: { width: 0, height: 2 },
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
});