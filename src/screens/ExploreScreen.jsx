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

// --- ESTILOS NOVOS EM TONS DE ROSA BEBÉ ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF0F5", // Rosa Lavanda (Fundo muito clarinho)
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF0F5",
    },
    loadingText: {
        marginTop: 10,
        color: "#D81B60", // Rosa escuro
        fontSize: 16,
    },
    card: {
        backgroundColor: "#FFFFFF", // Branco para destacar do fundo rosa
        marginVertical: 12,
        borderRadius: 20, // Bordas bem redondas (estilo "fofo")
        overflow: "hidden", // Garante que a imagem respeita as bordas redondas

        // Sombra suave em rosa (efeito 3D leve)
        shadowColor: "#FF69B4",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5, // Sombra para Android
    },
    image: {
        width: "100%",
        height: 220,
        resizeMode: "cover",
    },
    textContainer: {
        padding: 15,
    },
    name: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#D81B60", // Rosa Forte (igual ao ícone)
        marginBottom: 5,
    },
    temperament: {
        fontSize: 14,
        color: "#880E4F", // Um tom bordeaux/rosa escuro para leitura fácil
        lineHeight: 20,
    },
});