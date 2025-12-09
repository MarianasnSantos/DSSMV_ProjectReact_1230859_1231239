
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from "react-native";
// IMPORTANTE: Importar a Action para disparar o fluxo e o Store para obter dados
import { PetActions } from "../actions/PetActions";
import PetStore from "../stores/PetStore";
import { Animal } from "../API/rescueGroups"; // O tipo Animal continua sendo necessário

// Hook Customizado para integração com o Store
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
    // Usa o hook para obter o estado do Store (loading, error, animals)
    const { animals, loading, error } = usePetStoreState();

    useEffect(() => {
        // Dispara a AÇÃO para iniciar o fluxo de busca, uma única vez
        // A View NÃO espera um retorno de dados, ela espera que o Store mude.
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

    // A renderização abaixo permanece inalterada, pois usa o estado (animals)
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

// ... (styles permanecem os mesmos)
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