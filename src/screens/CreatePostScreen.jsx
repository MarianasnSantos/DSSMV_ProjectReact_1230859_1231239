import React, { useState, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Image, ScrollView, ActivityIndicator, Alert, Platform, PermissionsAndroid
} from "react-native";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// Stores
import AuthStore from "../stores/AuthStore";

export default function CreatePostScreen({ navigation }) {

    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(AuthStore.getState().user);

    // --- ESCOLHER FOTO (Igual ao AddAnimal) ---
    const abrirGaleria = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.5, includeBase64: true }, (res) => {
            if (res.didCancel) return;
            if (res.errorMessage) return Alert.alert("Erro", res.errorMessage);
            if (res.assets) setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
        });
    };

    const tirarFoto = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) return Alert.alert("Erro", "Sem permissão de câmara.");
        }
        launchCamera({ mediaType: 'photo', quality: 0.5, includeBase64: true }, (res) => {
            if (res.didCancel) return;
            if (res.assets) setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
        });
    };

    // --- ENVIAR PARA A BASE DE DADOS ---
    const handlePost = async () => {
        if (!photo) return Alert.alert("Falta a foto", "Uma partilha precisa de uma imagem bonita! 📸");
        if (!user) return Alert.alert("Erro", "Precisas de estar logado.");

        setLoading(true);

        const newPost = {
            author: user.username || user.name || "Utilizador",
            authorId: user._id || user.id,
            description: description,
            image: photo,
            date: new Date().toLocaleDateString('pt-PT'),
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: 0
        };

        try {
            const response = await fetch("https://petmatch-afab.restdb.io/rest/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-apikey": "a29c6a5e4f29c400c1ffac21c4c454f2af5a3",
                    "cache-control": "no-cache"
                },
                body: JSON.stringify(newPost)
            });

            if (!response.ok) throw new Error("Erro ao guardar");

            Alert.alert("Sucesso!", "A tua partilha foi publicada.");
            navigation.goBack(); // Volta para o feed

        } catch (error) {
            Alert.alert("Erro", "Não foi possível publicar. Tenta novamente.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Nova Partilha 📸</Text>

            {/* SELEÇÃO DE FOTO */}
            <View style={styles.photoContainer}>
                {photo ? (
                    <Image source={{ uri: photo }} style={styles.preview} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={{color: '#aaa'}}>Nenhuma foto selecionada</Text>
                    </View>
                )}

                <View style={styles.row}>
                    <TouchableOpacity style={styles.photoBtn} onPress={tirarFoto}>
                        <Text style={styles.btnText}>📷 Câmara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoBtnOutline} onPress={abrirGaleria}>
                        <Text style={styles.btnTextOutline}>🖼️ Galeria</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* DESCRIÇÃO */}
            <Text style={styles.label}>Legenda (Opcional)</Text>
            <TextInput
                style={styles.input}
                placeholder="Escreve algo sobre este momento..."
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
            />

            {/* BOTÃO PUBLICAR */}
            <TouchableOpacity style={styles.publishBtn} onPress={handlePost} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishText}>PUBLICAR</Text>}
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#FFF0F5', flexGrow: 1 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#D81B60', textAlign: 'center', marginBottom: 20 },

    photoContainer: { alignItems: 'center', marginBottom: 20 },
    preview: { width: '100%', height: 300, borderRadius: 15, marginBottom: 15 },
    placeholder: { width: '100%', height: 200, backgroundColor: '#EEE', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },

    row: { flexDirection: 'row', gap: 10, width: '100%' },
    photoBtn: { flex: 1, backgroundColor: '#FF69B4', padding: 12, borderRadius: 10, alignItems: 'center' },
    photoBtnOutline: { flex: 1, borderWidth: 1, borderColor: '#FF69B4', padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff' },

    btnText: { color: '#FFF', fontWeight: 'bold' },
    btnTextOutline: { color: '#FF69B4', fontWeight: 'bold' },

    label: { fontSize: 16, fontWeight: 'bold', color: '#D81B60', marginBottom: 5 },
    input: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#FFC0CB', fontSize: 16 },

    publishBtn: { backgroundColor: '#D81B60', padding: 15, borderRadius: 30, marginTop: 30, alignItems: 'center', elevation: 3 },
    publishText: { color: '#FFF', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }
});