// src/screens/AnimalsFeedScreen.jsx

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from "react-native";
// Importações Flux
import { PetActions } from "../actions/PetActions"; // Para iniciar o fluxo
import PetStore from "../stores/PetStore"; // Para ler o estado

// --- Hook Customizado para integração com o Store ---
function usePetStoreState() {
    // Inicializa o estado local com o estado atual do Store
    const [state, setState] = useState(PetStore.getState());

    useEffect(() => {
        const handleChange = () => {
            // Quando o Store muda, atualiza o estado do componente
            setState(PetStore.getState());
        };

        // Assina o evento 'change' do Store
        PetStore.addChangeListener(handleChange);

        // Função de limpeza: Desassina o evento ao desmontar o componente
        return () => {
            PetStore.removeChangeListener(handleChange);
        };
    }, []);

    return state;
}

export default function AnimalsFeedScreen() {
    // Usa o hook para obter o estado centralizado (dogs, loading, error)
    const { dogs, loading, error } = usePetStoreState();

    useEffect(() => {
        // Dispara a AÇÃO para iniciar o fluxo de busca, uma única vez
        PetActions.loadAnimals();
    }, []); // Array vazio garante que só roda na montagem

    if (loading) {
        return <ActivityIndicator size="large" color="#e91e63" style={styles.loader} />;
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: "red", fontSize: 16 }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                // Usa o estado 'dogs' vindo do Store
                data={dogs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    // Acessa as propriedades do item (já sem tipagem TS)
                    const photo = item.image?.url || "https://placehold.co/300x200";
                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.name}</Text>
                                {item.temperament && <Text style={styles.breed}>{item.temperament}</Text>}
                                {item.life_span && <Text style={styles.breed}>Vida: {item.life_span}</Text>}
                            </View>
                            {/* Adicionar aqui um botão para PetActions.likePet(item.id) */}
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f2f2" },
    loader: { flex: 1, justifyContent: "center" },
    card: {
        margin: 15,
        backgroundColor: "#fff",
        borderRadius: 15,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
    },
    image: { width: "100%", height: 250 },
    info: { padding: 15 },
    name: { fontSize: 22, fontWeight: "bold", color: "#333" },
    breed: { fontSize: 16, color: "#666", marginTop: 5 },
});