import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

// IMPORTANTE: O caminho da pasta deve ser 'api' (minúsculo)
import { getAnimals } from "../api/animalsAPI";

export default function AnimalsFeedScreen({ navigation }) {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Função para carregar os dados
    const loadData = async () => {
        // Se já estivermos a carregar (refresh), não mostramos o spinner grande
        if (!refreshing) setLoading(true);

        const data = await getAnimals();
        setAnimals(data);

        setLoading(false);
        setRefreshing(false);
    };

    // useFocusEffect: Corre sempre que o ecrã ganha "foco" (quando voltas para aqui)
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Função para renderizar cada cartão de animal
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Foto do Animal (ou placeholder se não houver link) */}
            <Image
                source={{ uri: item.photoUrl ? item.photoUrl : 'https://placehold.co/400x300/png?text=Sem+Foto' }}
                style={styles.image}
                resizeMode="cover"
            />

            <div style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.age}>{item.age} anos</Text>
                </View>

                <Text style={styles.breed}>{item.breed}</Text>

                {/* Mostra temperamento apenas se existir */}
                {item.temperament ? (
                    <Text style={styles.temperament} numberOfLines={2}>
                        ❤️ {item.temperament}
                    </Text>
                ) : null}

                <TouchableOpacity style={styles.adoptButton}>
                    <Text style={styles.adoptButtonText}>Quero Adotar</Text>
                </TouchableOpacity>
            </div>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff8fb1" />
                <Text style={{ marginTop: 10, color: "#555" }}>A procurar patudos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={animals}
                keyExtractor={(item) => item._id || Math.random().toString()} // _id é gerado pelo RestDB
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        setRefreshing(true);
                        loadData();
                    }} colors={["#ff8fb1"]} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>Ainda não há animais para adoção.</Text>
                        <Text style={styles.emptySubText}>Sê o primeiro a adicionar um!</Text>
                    </View>
                }
            />

            {/* Botão Flutuante para Adicionar (+), se quiseres usar aqui */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("AddAnimal")} // Confirma se o nome da rota é "AddAnimal"
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff0f5", // Fundo rosa muito clarinho
    },
    listContent: {
        padding: 15,
        paddingBottom: 100, // Espaço extra para o botão flutuante não tapar o último item
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 15,
        marginBottom: 20,
        overflow: "hidden",
        elevation: 3, // Sombra no Android
        shadowColor: "#000", // Sombra no iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: "100%",
        height: 200,
    },
    infoContainer: {
        padding: 15,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    name: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
    },
    age: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ff8fb1",
        backgroundColor: "#fff0f5",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    breed: {
        fontSize: 16,
        color: "#666",
        marginBottom: 8,
        fontStyle: "italic",
    },
    temperament: {
        fontSize: 14,
        color: "#777",
        marginBottom: 15,
    },
    adoptButton: {
        backgroundColor: "#ff8fb1",
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    adoptButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    // Estilo do Botão Flutuante (+)
    fab: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#ff5c8d",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    fabText: {
        color: "#fff",
        fontSize: 32,
        marginTop: -4, // Pequeno ajuste visual
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#888",
    },
    emptySubText: {
        fontSize: 14,
        color: "#aaa",
        marginTop: 5,
    }
});