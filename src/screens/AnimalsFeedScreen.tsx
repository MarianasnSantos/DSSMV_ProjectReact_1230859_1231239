import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, StyleSheet } from 'react-native';

const AnimalsFeedScreen = () => {
    const [animals, setAnimals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const response = await fetch('https://api.rescuegroups.org/v5/public/animals/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'apiKey AQUI_TUA_CHAVE'
                    },
                    body: JSON.stringify({
                        data: {
                            type: "animals",
                            attributes: {
                                status: "Available",
                                species: "Dog"
                            }
                        }
                    })
                });

                const json = await response.json();
                setAnimals(json.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnimals();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>A carregar animais...</Text>
            </View>
        );
    }

    const renderItem = ({ item }: any) => {
        const name = item?.attributes?.name || "Sem nome";
        const photo = item?.attributes?.pictureThumbnailUrl;

        return (
            <View style={styles.card}>
                {photo && <Image source={{ uri: photo }} style={styles.image} />}
                <Text style={styles.name}>{name}</Text>
            </View>
        );
    };

    return (
        <FlatList
            data={animals}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 10 }}
        />
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    }
});

export default AnimalsFeedScreen;
