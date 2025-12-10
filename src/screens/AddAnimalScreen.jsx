import React, { useState } from "react";
import {
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
            age: Number(age), // Converte para número
            temperament,
            photoUrl,
            addedBy: "user-app",
            createdAt: new Date().toISOString(),
        };

        const result = await addAnimal(newAnimal);

        if (!result) {
            Alert.alert("Erro", "Ocorreu um erro ao adicionar o animal.");
            return;
        }

        Alert.alert("Sucesso", "Animal adicionado com sucesso!");
        navigation.goBack();
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Adicionar Animal</Text>

            {/* --- BLOCO 1: NOME --- */}
            <Text style={styles.label}>Nome do Animal</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Boby"
                placeholderTextColor="#FFB6C1" // Um rosa clarinho para a dica
                value={name}
                onChangeText={setName}
            />

            {/* --- BLOCO 2: RAÇA --- */}
            <Text style={styles.label}>Raça</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Labrador"
                placeholderTextColor="#FFB6C1"
                value={breed}
                onChangeText={setBreed}
            />

            {/* --- BLOCO 3: IDADE --- */}
            <Text style={styles.label}>Idade (anos)</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: 2"
                placeholderTextColor="#FFB6C1"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric" // Teclado numérico
            />

            {/* --- BLOCO 4: TEMPERAMENTO --- */}
            <Text style={styles.label}>Temperamento</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Calmo, Brincalhão"
                placeholderTextColor="#FFB6C1"
                value={temperament}
                onChangeText={setTemperament}
            />

            {/* --- BLOCO 5: FOTO --- */}
            <Text style={styles.label}>Link da Foto</Text>
            <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#FFB6C1"
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
        flexGrow: 1,
        padding: 25, // Aumentei um pouco o padding geral
        backgroundColor: "#FFF0F5", // Fundo Rosa Bebé (LavenderBlush)
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#D81B60", // Rosa Forte
        textAlign: "center",
        marginBottom: 10,
        marginTop: 10,
    },
    // O estilo do Texto que fica EM CIMA da caixa
    label: {
        fontSize: 18,
        fontWeight: "600",
        color: "#D81B60", // Rosa Forte (mesmo do título para combinar)
        marginLeft: 5,
        marginBottom: 8,  // Espaço entre o texto e a caixa
        marginTop: 20,    // <--- AQUI ESTÁ O TRUQUE: Espaço grande antes de cada novo bloco
    },
    // O estilo da Caixa de Texto
    input: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 15,
        fontSize: 16,
        color: "#880E4F", // Cor do texto que escreves (Rosa muito escuro para ler bem)

        // Borda e Sombra
        borderWidth: 1.5, // Borda um pouco mais grossa
        borderColor: "#FFB6C1", // Rosa claro na borda
        elevation: 3, // Sombra no Android
        shadowColor: "#FF69B4", // Sombra rosa
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    },
    button: {
        backgroundColor: "#FF69B4", // Hot Pink
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: "center",
        marginTop: 40, // Mais espaço antes do botão
        marginBottom: 40,

        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        shadowOffset: { width: 0, height: 2 },
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
});