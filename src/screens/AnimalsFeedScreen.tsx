import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from "react-native";
import { buscarAnimais, Animal } from "../API/rescueGroups";

export default function AnimalsFeedScreen() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await buscarAnimais();
                if (result && result.length > 0) setAnimals(result);
                else setError("Não foi possível carregar os animais.");
            } catch (err) {
                console.error("Erro no feed:", err);
                setError("Erro ao buscar animais.");
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
                data={animals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const photo =
                        item?.attributes?.pictures?.[0]?.original?.url ||
                        "https://placehold.co/300x200";

                    return (
                        <View style={styles.card}>
                            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.attributes.name}</Text>
                                <Text style={styles.breed}>{item.attributes.speciesName}</Text>
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
        elevation: 3, // sombra Android
        shadowColor: "#000", // sombra iOS
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
    },
    image: { width: "100%", height: 250 },
    info: { padding: 15 },
    name: { fontSize: 22, fontWeight: "bold", color: "#333" },
    breed: { fontSize: 16, color: "#666", marginTop: 5 },
});
