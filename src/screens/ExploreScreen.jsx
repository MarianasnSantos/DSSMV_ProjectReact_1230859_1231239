import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from "react-native";

export default function ExploreScreen() {
    const [breeds, setBreeds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadBreeds() {
            try {
                const response = await fetch("https://api.thedogapi.com/v1/breeds");
                const data = await response.json();

                // Mapear cada raça para adicionar a URL da imagem real
                const breedsWithImages = await Promise.all(
                    data.map(async (breed) => {
                        let imageUrl = breed.image?.url || null;

                        // Se não tiver image.url, buscar pela reference_image_id
                        if (!imageUrl && breed.reference_image_id) {
                            try {
                                const imgResponse = await fetch(`https://api.thedogapi.com/v1/images/${breed.reference_image_id}`);
                                const imgData = await imgResponse.json();
                                imageUrl = imgData.url;
                            } catch {
                                imageUrl = "https://placehold.co/300x200?text=Sem+imagem";
                            }
                        }

                        return { ...breed, imageUrl: imageUrl || "https://placehold.co/300x200?text=Sem+imagem" };
                    })
                );

                setBreeds(breedsWithImages);
            } catch (error) {
                console.log("Erro ao carregar raças:", error);
            } finally {
                setLoading(false);
            }
        }

        loadBreeds();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#D81B60" />
                <Text style={styles.loadingText}>Carregando cães...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={breeds}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.imageUrl }} style={styles.image} />
                        <View style={styles.textContainer}>
                            <Text style={styles.name}>{item.name}</Text>
                            {item.temperament && (
                                <Text style={styles.temperament}>{item.temperament}</Text>
                            )}
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

// --- ESTILOS ROSA BEBÊ ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5", paddingHorizontal: 15, paddingTop: 10 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF0F5" },
    loadingText: { marginTop: 10, color: "#D81B60", fontSize: 16 },
    card: {
        backgroundColor: "#FFE4E1",
        marginVertical: 12,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#FF69B4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    image: { width: "100%", height: 220, resizeMode: "cover" },
    textContainer: { padding: 15 },
    name: { fontSize: 22, fontWeight: "bold", color: "#D81B60", marginBottom: 5 },
    temperament: { fontSize: 14, color: "#880E4F", lineHeight: 20 },
});
