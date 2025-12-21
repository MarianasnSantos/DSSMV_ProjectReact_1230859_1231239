import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput } from "react-native";

import { TEMPERAMENT_TRANSLATIONS } from "../utils/translations";

export default function TemperamentModal({ isVisible, onClose, onApply, initialSelected = [] }) {
    const [selected, setSelected] = useState(initialSelected);
    const [availableTemps, setAvailableTemps] = useState([]);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (isVisible) {
            // 1. Extrair apenas os valores (Português) do teu ficheiro de traduções
            const allValues = Object.values(TEMPERAMENT_TRANSLATIONS);

            // 2. Remover duplicados e ordenar
            const uniqueSorted = [...new Set(allValues)].sort((a, b) => a.localeCompare(b));

            setAvailableTemps(uniqueSorted);
            setSelected(initialSelected);
        }

        // CORREÇÃO AQUI EM BAIXO: Adicionei 'initialSelected' à lista 👇
    }, [isVisible, initialSelected]);

    const toggleSelection = (temp) => {
        if (selected.includes(temp)) {
            setSelected(selected.filter(t => t !== temp));
        } else {
            setSelected([...selected, temp]);
        }
    };

    const handleApply = () => {
        onApply(selected);
        onClose();
    };

    // Filtragem local
    const filteredList = availableTemps.filter(t =>
        t.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>

                    <View style={styles.header}>
                        <Text style={styles.title}>Filtrar por Personalidade</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.search}
                        placeholder="🔍 Pesquisar (ex: Calmo, Leal...)"
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />

                    <FlatList
                        data={filteredList}
                        keyExtractor={item => item}
                        numColumns={2}
                        columnWrapperStyle={{ gap: 10 }}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => {
                            const isSelected = selected.includes(item);
                            return (
                                <TouchableOpacity
                                    style={[styles.chip, isSelected && styles.chipSelected]}
                                    onPress={() => toggleSelection(item)}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                        {isSelected ? "✓ " : ""}{item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.clearBtn} onPress={() => setSelected([])}>
                            <Text style={styles.clearText}>Limpar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                            <Text style={styles.applyText}>
                                {selected.length > 0 ? `Aplicar (${selected.length})` : "Aplicar"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', height: '80%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    closeBtn: { padding: 5 },
    closeText: { fontSize: 24, color: '#888' },

    search: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 15, fontSize: 16, color: '#333' },

    chip: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 20,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chipSelected: { backgroundColor: '#FFF0F5', borderColor: '#D81B60' },
    chipText: { color: '#666', fontWeight: '500', fontSize: 14, textAlign: 'center' },
    chipTextSelected: { color: '#D81B60', fontWeight: 'bold' },

    footer: { flexDirection: 'row', gap: 15, marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderColor: '#eee' },
    clearBtn: { flex: 1, padding: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#ccc' },
    clearText: { color: '#666', fontWeight: 'bold' },
    applyBtn: { flex: 2, backgroundColor: '#D81B60', borderRadius: 12, padding: 15, alignItems: 'center', justifyContent: 'center' },
    applyText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});