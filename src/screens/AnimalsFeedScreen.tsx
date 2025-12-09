// src/screens/AnimalsFeedScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from "react-native";
import { buscarCachorros, Dog } from "../API/theDogAPI";

export default function AnimalsFeedScreen() {
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await buscarCachorros();
                if (result) setDogs(result);
                else setError("Não foi possível carregar os cachorros.");
            } catch (err) {
                console.error("Erro no feed:", err);
                setError("Erro ao buscar cachorros.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

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
                data={dogs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const photo = item.image?.url || "https://placehold.co/300x200";
                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.name}</Text>
                                {item.temperament && <Text style={styles.breed}>{item.temperament}</Text>}
                                {item.life_span && <Text style={styles.breed}>Vida: {item.life_span}</Text>}
                            </View>
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

