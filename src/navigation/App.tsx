import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_KEY;

type Animal = {
    id: number;
    attributes: {
        name: string;
        speciesName: string;
        sex: string;
        ageString: string;
    };
};

export default function App() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const res = await fetch(
                    'https://api.rescuegroups.org/v5/public/animals?limit=10',
                    {
                        headers: {
                            Authorization: `apikey ${API_KEY}`,
                            'Content-Type': 'application/vnd.api+json',
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                setAnimals(data.data);
                console.log(data.data);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            }
        };

        fetchAnimals();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Animais Disponíveis</Text>
            {error && <Text style={styles.error}>Erro: {error}</Text>}
            <FlatList
                data={animals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.name}>{item.attributes.name}</Text>
                        <Text>Espécie: {item.attributes.speciesName}</Text>
                        <Text>Sexo: {item.attributes.sex}</Text>
                        <Text>Idade: {item.attributes.ageString}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 10, marginBottom: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
    name: { fontSize: 18, fontWeight: 'bold' },
    error: { color: 'red', marginBottom: 10 },
});
