import React, { useState, useEffect } from "react";
import {
    Text, TouchableOpacity, StyleSheet, Alert,
    ScrollView, Image, View, ActivityIndicator, PermissionsAndroid, Platform
} from "react-native";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// 1. IMPORTAR AS BIBLIOTECAS DE LOCALIZAÇÃO
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';

// --- Flux ---
import AuthStore from "../stores/AuthStore";
import PetStore from "../stores/PetStore";
import { PetActions } from "../actions/PetActions";

// --- Componentes ---
import BreedSearchModal from "../components/BreedSearchModal";
import { AppInput } from "../components/AppInput";

const DOG_API_URL = "https://api.thedogapi.com/v1";

export default function AddAnimalScreen({ navigation, route }) {
    const { animalToEdit } = route.params || {};
    const isEditMode = !!animalToEdit;
    const animalId = animalToEdit?.id;

    // --- Estados do Formulário ---
    const [name, setName] = useState(animalToEdit?.name || "");
    const [breed, setBreed] = useState(animalToEdit?.breed || "Sem Raça");
    const [age, setAge] = useState(animalToEdit?.age ? String(animalToEdit.age) : "");
    const [temperament, setTemperament] = useState(animalToEdit?.temperament || "");
    const [contactNumber, setContactNumber] = useState(animalToEdit?.contactNumber || "");
    const [photo, setPhoto] = useState(animalToEdit?.photoUrl || null);
    const [location, setLocation] = useState(animalToEdit?.location || "");

    // NOVO: Estado para guardar as coordenadas GPS invisíveis
    const [coords, setCoords] = useState({
        lat: animalToEdit?.lat || null,
        lng: animalToEdit?.lng || null
    });

    // Estados de UI
    const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingTemperament, setIsFetchingTemperament] = useState(false);

    // Dados dos Stores
    const [user, setUser] = useState(AuthStore.getState().user);
    const [allBreeds, setAllBreeds] = useState(PetStore.getState().breeds || []);

    useEffect(() => {
        navigation.setOptions({ title: isEditMode ? 'Editar Animal' : 'Novo Animal' });

        // INICIALIZAR O GEOCODER
        Geocoder.init("AIzaSyBMWu-iiiQz4mhftlcYzFe84Ecl8IshLoU", { language : "pt" });

        const onAuthChange = () => setUser(AuthStore.getState().user);
        const onPetChange = () => setAllBreeds(PetStore.getState().breeds || []);

        AuthStore.addChangeListener(onAuthChange);
        PetStore.addChangeListener(onPetChange);

        return () => {
            AuthStore.removeChangeListener(onAuthChange);
            PetStore.removeChangeListener(onPetChange);
        };
    }, [isEditMode, navigation]);

    // --- LÓGICA DE LOCALIZAÇÃO (GPS + GOOGLE API) ---
    const obterLocalizacao = async () => {
        setLoadingLocation(true);
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert("Erro", "Autorize o GPS nas definições.");
                    setLoadingLocation(false);
                    return;
                }
            }

            Geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;

                    // NOVO: Guardar as coordenadas exatas
                    setCoords({ lat: latitude, lng: longitude });

                    try {
                        const json = await Geocoder.from(latitude, longitude);
                        const addressComponent = json.results[0].address_components;
                        let city = "";

                        for (let component of addressComponent) {
                            if (component.types.includes('locality')) {
                                city = component.long_name;
                                break;
                            }
                            if (component.types.includes('administrative_area_level_2') && !city) {
                                city = component.long_name;
                            }
                        }

                        if (!city) {
                            const formatted = json.results[0].formatted_address.split(',')[1];
                            city = formatted || "Localização Detetada";
                        }

                        setLocation(city);
                        Alert.alert("Sucesso", `📍 Localização definida: ${city}`);

                    } catch (geoError) {
                        console.log("Erro Geocoder:", geoError);
                        Alert.alert("Erro Google", "Não foi possível obter o nome da cidade, mas guardámos o GPS.");
                        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    } finally {
                        setLoadingLocation(false);
                    }
                },
                (err) => {
                    Alert.alert("Erro GPS", err.message);
                    setLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 15000, showLocationDialog: true }
            );
        } catch (err) {
            setLoadingLocation(false);
        }
    };

    // --- Media ---
    const tirarFoto = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) return Alert.alert("Erro", "Sem câmara.");
        }
        launchCamera({ mediaType: 'photo', quality: 0.5, includeBase64: true }, (res) => {
            if (res.assets) setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
        });
    };

    const abrirGaleria = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.5, includeBase64: true }, (res) => {
            if (res.assets) setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
        });
    };

    // --- Submissão ---
    const handleSubmit = async () => {
        if (!name || !contactNumber || !location) return Alert.alert("Erro", "Nome, Contacto e Localização são obrigatórios.");

        setIsSaving(true);
        const animalData = {
            ...(isEditMode && { id: animalId }),
            name, breed, age: Number(age), temperament, contactNumber, photoUrl: photo, location,
            // NOVO: Enviar coordenadas para a BD
            lat: coords.lat,
            lng: coords.lng,

            addedBy: user?.username || "Utilizador",
            addedById: user?._id || user?.id,
            ...(isEditMode ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() })
        };

        const success = isEditMode ? await PetActions.updateAnimal(animalData) : await PetActions.addAnimal(animalData);

        setIsSaving(false);
        if (success) {
            Alert.alert("Sucesso", "Dados guardados!");
            navigation.goBack();
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{isEditMode ? 'Editar Animal' : 'Novo Animal'}</Text>
            <Text style={styles.label}>Nome *</Text>
            <AppInput value={name} onChangeText={setName} placeholder="Ex: Boby" />

            <Text style={styles.label}>Raça</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setIsBreedModalVisible(true)}>
                <Text style={styles.inputText}>{breed}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Idade (anos)</Text>
            <AppInput value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Ex: 5" />

            <Text style={styles.label}>Temperamento</Text>
            <View style={{ justifyContent: 'center' }}>
                <AppInput
                    style={isFetchingTemperament && { backgroundColor: '#f0f0f0' }}
                    value={temperament}
                    onChangeText={setTemperament}
                    editable={!isFetchingTemperament}
                    placeholder="Ex: Calmo, Leal"
                />
                {isFetchingTemperament && <ActivityIndicator style={styles.absLoader} color="#D81B60" />}
            </View>

            <Text style={styles.label}>Contacto *</Text>
            <AppInput value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" placeholder="9xxxxxxxx" />

            <Text style={styles.label}>Localização *</Text>
            <View style={styles.locRow}>
                <AppInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Cidade (ou use o botão)"
                    style={{ flex: 1, marginBottom: 0 }}
                />
                <TouchableOpacity style={styles.locBtnSmall} onPress={obterLocalizacao} disabled={loadingLocation}>
                    {loadingLocation ? <ActivityIndicator color="#fff" size="small"/> : <Text style={styles.whiteBtnText}>Google📍</Text>}
                </TouchableOpacity>
            </View>
            <Text style={styles.hint}>O botão usa o GPS e a Google API para preencher a cidade.</Text>

            <Text style={styles.label}>Foto</Text>
            <View style={styles.row}>
                <TouchableOpacity style={styles.photoBtn} onPress={tirarFoto}><Text style={styles.photoBtnText}>📷 Câmara</Text></TouchableOpacity>
                <TouchableOpacity style={styles.photoBtnOutline} onPress={abrirGaleria}><Text style={styles.photoBtnText}>🖼️ Galeria</Text></TouchableOpacity>
            </View>
            {photo && <Image source={{ uri: photo }} style={styles.preview} />}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveBtnText}>GUARDAR</Text>}
            </TouchableOpacity>

            <BreedSearchModal
                isVisible={isBreedModalVisible}
                allBreeds={allBreeds}
                onSelect={(b) => {
                    setBreed(b);
                    setIsBreedModalVisible(false);
                    if (b !== "Sem Raça") {
                        setIsFetchingTemperament(true);
                        fetch(`${DOG_API_URL}/breeds/search?q=${b}`).then(r => r.json()).then(d => {
                            if(d[0]?.temperament) setTemperament(d[0].temperament);
                        }).finally(() => setIsFetchingTemperament(false));
                    }
                }}
                onClose={() => setIsBreedModalVisible(false)}
                selectedBreedName={breed}
                showAllOption={false}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 25, backgroundColor: "#FFF0F5" },
    title: { fontSize: 26, fontWeight: "bold", color: "#D81B60", textAlign: "center", marginBottom: 20 },
    label: { fontSize: 16, fontWeight: "600", color: "#D81B60", marginTop: 5, marginBottom: 5 },
    inputBox: { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: "#FFB6C1", marginBottom: 15 },
    inputText: { color: "#000", fontSize: 16 },
    locRow: { flexDirection: 'row', gap: 10, marginBottom: 5, alignItems: 'center' },
    locBtnSmall: { backgroundColor: "#DB4437", paddingHorizontal: 15, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    whiteBtnText: { color: "#fff", fontWeight: "bold" },
    hint: { fontSize: 12, color: '#888', marginBottom: 15, fontStyle: 'italic' },
    row: { flexDirection: 'row', gap: 10, marginTop: 5 },
    photoBtn: { flex: 1, backgroundColor: "#FFB6C1", padding: 12, borderRadius: 10, alignItems: 'center' },
    photoBtnOutline: { flex: 1, borderWidth: 1.5, borderColor: "#FFB6C1", padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff' },
    photoBtnText: { color: "#880E4F", fontWeight: "500" },
    preview: { width: "100%", height: 200, borderRadius: 10, marginTop: 15, borderWidth: 1, borderColor: "#D81B60" },
    saveBtn: { backgroundColor: "#D81B60", padding: 18, borderRadius: 30, marginTop: 30, marginBottom: 50, alignItems: 'center' },
    saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
    absLoader: { position: 'absolute', right: 15, top: 12 }
});