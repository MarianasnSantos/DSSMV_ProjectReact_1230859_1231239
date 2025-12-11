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
    ActivityIndicator
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addAnimal } from "../api/animalsAPI";

export default function AddAnimalScreen({ navigation }) {

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [temperament, setTemperament] = useState("");
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState("");
    const [loadingLocation, setLoadingLocation] = useState(false);

    // --- FUNÇÃO DE FOTO (Corrigida para qualidade 0.1) ---
    const tirarFoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão negada", "Precisas de dar permissão para usar a câmara.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.1, // <--- CRÍTICO: 0.1 evita o erro 500 no RestDB
            base64: true,
        });
        if (!result.canceled) {
            setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    // --- FUNÇÃO DE GALERIA (Corrigida para qualidade 0.1) ---
    const abrirGaleria = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.1, // <--- CRÍTICO: 0.1 evita o erro 500 no RestDB
            base64: true,
        });
        if (!result.canceled) {
            setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    // --- OBTER LOCALIZAÇÃO ---
    const obterLocalizacao = async () => {
        setLoadingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permissão negada", "Precisamos de acesso à localização.");
                setLoadingLocation(false);
                return;
            }

            let locationResult = await Location.getCurrentPositionAsync({});
            let addressResult = await Location.reverseGeocodeAsync({
                latitude: locationResult.coords.latitude,
                longitude: locationResult.coords.longitude
            });

            if (addressResult.length > 0) {
                const item = addressResult[0];
                const moradaFormatada = `${item.city || item.region}, ${item.country}`;
                setLocation(moradaFormatada);
            }

        } catch (error) {
            Alert.alert("Erro", "Não foi possível obter a localização.");
        } finally {
            setLoadingLocation(false);
        }
    };

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
            Alert.alert("Erro", "Ocorreu um erro ao enviar. A foto pode ser muito pesada.");
            return;
        }

        Alert.alert("Sucesso", "Animal adicionado com sucesso!");
        navigation.goBack();
    }

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
                    placeholder="A localização aparecerá aqui..."
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
        backgroundColor: "#FFF5F8",
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