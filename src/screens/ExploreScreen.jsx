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
                setBreeds(data);
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
                <ActivityIndicator size="large" color="#000" />
                <Text>Carregando raças...</Text>
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
                        {item.image?.url && (
                            <Image source={{ uri: item.image.url }} style={styles.image} />
                        )}
                        <Text style={styles.name}>{item.name}</Text>
                        {item.temperament && (
                            <Text style={styles.temperament}>{item.temperament}</Text>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 10,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: "#f2f2f2",
        marginVertical: 10,
        padding: 10,
        borderRadius: 10,
    },
    image: {
        width: "100%",
        height: 200,
        borderRadius: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 10,
    },
    temperament: {
        marginTop: 5,
        color: "#555",
    },
});
