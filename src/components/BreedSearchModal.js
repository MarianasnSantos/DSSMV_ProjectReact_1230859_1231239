import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const BreedSearchModal = ({ isVisible, onClose, onSelect, allBreeds, selectedBreedName, showAllOption }) => {
    const [searchText, setSearchText] = useState('');

    const filteredBreeds = useMemo(() => {
        // Garante que allBreeds é um array antes de filtrar
        const safeBreeds = Array.isArray(allBreeds) ? allBreeds : [];

        // Filtra opções de sistema (como 'Todos') que não fazem sentido no cadastro
        let breedList = [...safeBreeds.filter(b => b !== 'Todos' && b !== 'Sem Raça')];

        if (showAllOption) {
            breedList = ['Todas', 'Sem Raça', ...breedList];
        } else {
            breedList = ['Sem Raça', ...breedList];
        }

        if (!searchText) return breedList.slice(0, 25);

        return breedList.filter(breed =>
            breed?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText, allBreeds,showAllOption]);

    return (
        <Modal animationType="slide" visible={isVisible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Escolher Raça</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeBtn}>Fechar</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar raça (ex: Poodle...)"
                    placeholderTextColor="#A0A0A0"
                    onChangeText={setSearchText}
                    autoFocus={true}
                />

                <FlatList
                    data={filteredBreeds}
                    keyExtractor={(item) => item}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.item, item === selectedBreedName && styles.itemSelected]}
                            onPress={() => {
                                onSelect(item);
                                setSearchText('');
                                onClose();
                            }}
                        >
                            <Text style={styles.itemText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, padding: 20, backgroundColor: '#FFF0F5', paddingTop: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#D81B60' },
    closeBtn: { color: '#FF69B4', fontWeight: 'bold', fontSize: 16 },
    searchInput: { height: 50, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#FFB6C1', color: '#333' },
    item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#FFC0CB', backgroundColor: '#fff' },
    itemSelected: { backgroundColor: '#FFC0CB' },
    itemText: { fontSize: 16, color: '#880E4F' }
});

export default BreedSearchModal;