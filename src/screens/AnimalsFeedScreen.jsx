import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from "react-native";

const LIMIT = 10; // quantos cães carregar por vez

export default function ExploreScreen() {
    const [breeds, setBreeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0); // página atual
    const [hasMore, setHasMore] = useState(true); // se há mais para carregar

    async function loadBreeds(nextPage = 0) {
        if (!hasMore && nextPage !== 0) return;

        try {
            if (nextPage === 0) setLoading(true);

            const response = await fetch(
                `https://api.thedogapi.com/v1/images/search?limit=${LIMIT}&has_breeds=1&page=${nextPage}`
            );
            const data = await response.json();

            const breedsWithImages = data
                .filter(item => item.breeds && item.breeds.length > 0)
                .map(item => ({
                    id: item.breeds[0].id,
                    name: item.breeds[0].name,
                    temperament: item.breeds[0].temperament,
                    imageUrl: item.url,
                }));

            setBreeds(prev => nextPage === 0 ? breedsWithImages : [...prev, ...breedsWithImages]);

            if (breedsWithImages.length < LIMIT) setHasMore(false); // não há mais dados
        } catch (error) {
            console.log("Erro ao carregar raças:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBreeds(0);
    }, []);

    const handleLoadMore = () => {
        if (loading || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadBreeds(nextPage);
    };

    if (loading && page === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#D81B60" />
                <Text style={styles.loadingText}>Carregando raças...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={breeds}
                keyExtractor={(item, index) => item.id + "-" + index}
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
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5} // quando chegar a 50% do final, carrega mais
                ListFooterComponent={loading && hasMore ? (
                    <ActivityIndicator size="large" color="#D81B60" style={{ margin: 15 }} />
                ) : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF0F5", paddingHorizontal: 15, paddingTop: 10 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF0F5" },
    loadingText: { marginTop: 10, color: "#D81B60", fontSize: 16 },
    card: {
        backgroundColor: "#FFFFFF",
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
