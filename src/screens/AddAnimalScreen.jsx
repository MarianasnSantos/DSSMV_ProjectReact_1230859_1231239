import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView
} from "react-native";

import { addAnimal } from "../api/animalsAPI";

export default function AddAnimalScreen({ navigation }) {

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [temperament, setTemperament] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");

    async function handleSubmit() {
        if (!name || !breed) {
            Alert.alert("Erro", "O nome e a raça são obrigatórios.");
            return;
        }

        const newAnimal = {
            name,
            breed,
            age,
            temperament,
            photoUrl,
            createdAt: new Date().toISOString(),
        };

        const result = await addAnimal(newAnimal);

        if (!result) {
            Alert.alert("Erro", "Ocorreu um erro ao adicionar o animal.");
            return;
        }

        Alert.alert("Sucesso", "Animal adicionado com sucesso!");
        navigation.goBack(); // Voltar ao feed após salvar
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Adicionar Animal</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                placeholder="Raça"
                value={breed}
                onChangeText={setBreed}
            />

            <TextInput
                style={styles.input}
                placeholder="Idade"
                value={age}
                onChangeText={setAge}
            />

            <TextInput
                style={styles.input}
                placeholder="Temperamento"
                value={temperament}
                onChangeText={setTemperament}
            />

            <TextInput
                style={styles.input}
                placeholder="URL da Foto"
                value={photoUrl}
                onChangeText={setPhotoUrl}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Salvar Animal</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#ffe6f0",
        flexGrow: 1
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#b30059",
        textAlign: "center",
        marginBottom: 20,
    },
    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#ffb3c6",
    },
    button: {
        backgroundColor: "#ff8fb1",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});
