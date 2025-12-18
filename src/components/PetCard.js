import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { translateTemperament } from '../utils/translations';

const STAR_OUTLINE = require('../assets/favoritar.jpg');
const STAR_FILLED = require('../assets/favorito_preenchido.jpg');

const PetCard = ({
                     item,
                     isFav,
                     isLoggedIn,
                     userId,
                     onFavorite,
                     onAdopt,
                     onEdit,
                     onDelete,
                     formatDate
                 }) => {
    const photo = item.photoUrl || item.image?.url || "https://placehold.co/300x200";
    const translatedTemperament = translateTemperament(item.temperament);
    const isOwner = userId && item.addedById && String(item.addedById) === String(userId);

    return (
        <View style={styles.card}>
            <Image source={{ uri: photo }} style={styles.image} />

            <View style={styles.info}>
                <View style={styles.headerContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    {isLoggedIn && (
                        <View style={styles.favoriteControlContainer}>
                            <TouchableOpacity onPress={() => onFavorite(item.id)}>
                                <Image
                                    source={isFav ? STAR_FILLED : STAR_OUTLINE}
                                    style={[styles.customIcon, !isFav && { tintColor: '#FFC0CB' }]}
                                />
                            </TouchableOpacity>
                            {isFav && <Text style={styles.favoritePermanentText}>Favorito</Text>}
                        </View>
                    )}
                </View>

                <Text style={styles.breedText}>{item.breed || "Sem Raça"}</Text>

                <View style={styles.authorInfoContainer}>
                    {item.addedBy && <Text style={styles.authorText}>Por: {item.addedBy}</Text>}
                    {item.createdAt && (
                        <Text style={styles.dateText}>
                            Publicado em: {formatDate(item.createdAt)}
                        </Text>
                    )}
                </View>

                <View style={styles.separator} />

                <View style={styles.detailsContainer}>
                    <Text style={styles.detailValue}>🎂 {item.age ? item.age + " anos" : "Jovem"}</Text>
                    {item.location && <Text style={styles.locationText}>📍 Coordenadas: {item.location}</Text>}
                    {translatedTemperament && <Text style={styles.detailValueFull}>✨ {translatedTemperament}</Text>}
                    {item.contactNumber && <Text style={styles.contactText}>📞 Contacto: {item.contactNumber}</Text>}
                </View>

                <TouchableOpacity style={styles.adoptButton} onPress={() => onAdopt(item.id)}>
                    <Text style={styles.adoptButtonText}>ADOTAR</Text>
                </TouchableOpacity>

                {isOwner && (
                    <View style={styles.authorButtonsContainer}>
                        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
                            <Text style={styles.editButtonText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id, item.addedById)}>
                            <Text style={styles.deleteButtonText}>Apagar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { margin: 15, backgroundColor: "#FFE4E1", borderRadius: 15, overflow: "hidden", elevation: 3 },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },
    breedText: { fontSize: 18, color: '#880E4F', marginBottom: 5 },
    favoriteControlContainer: { alignItems: 'center', justifyContent: 'center' },
    favoritePermanentText: { color: '#FF69B4', fontWeight: 'bold', fontSize: 12, marginTop: 2 },
    customIcon: { width: 30, height: 30 },
    authorInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    dateText: { fontSize: 14, color: '#FF69B4', fontStyle: 'italic' },
    authorText: { fontSize: 14, color: '#D81B60', fontStyle: 'italic' },
    separator: { height: 1, backgroundColor: '#FFC0CB', marginVertical: 10 },
    detailsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    detailValue: { fontSize: 14, color: '#880E4F', fontWeight: 'bold' },
    detailValueFull: { fontSize: 14, color: '#880E4F', fontWeight: 'bold', width: '100%' },
    locationText: { fontSize: 14, color: '#880E4F', fontWeight: 'bold', width: '100%' },
    contactText: { fontSize: 14, color: '#D81B60', fontWeight: 'bold', width: '100%' },
    adoptButton: { backgroundColor: '#FFB6C1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    adoptButtonText: { color: '#fff', fontWeight: 'bold' },
    authorButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
    editButton: { flex: 1, backgroundColor: '#FF69B4', padding: 8, borderRadius: 8, alignItems: 'center' },
    editButtonText: { color: '#fff', fontWeight: 'bold' },
    deleteButton: { flex: 1, backgroundColor: '#D81B60', padding: 8, borderRadius: 8, alignItems: 'center' },
    deleteButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default PetCard;