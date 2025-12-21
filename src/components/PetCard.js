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
                     onToggleStatus,
                     onEdit,
                     onDelete,
                     formatDate
                 }) => {

    const photo = item.photoUrl || item.image?.url || "https://placehold.co/300x200";
    const translatedTemperament = translateTemperament(item.temperament);

    // Verificação de dono
    const isOwner = userId && (String(item.addedById) === String(userId) || String(item._by) === String(userId));

    // Verificação de contacto
    const contactPhone = item.contactNumber || item.contact_number || item.phone || "";

    return (
        <View style={[styles.card, item.adopted && styles.cardAdopted]}>
            <View>
                <Image
                    source={{ uri: photo }}
                    style={[styles.image, item.adopted && { opacity: 0.6 }]}
                />
                {item.adopted && (
                    <View style={styles.overlayLabel}>
                        <Text style={styles.overlayText}>JÁ ADOTADO 🏠</Text>
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <View style={styles.headerContainer}>
                    <Text style={styles.name}>
                        {item.name} {item.adopted && "🔒"}
                    </Text>
                    {isLoggedIn && (
                        <TouchableOpacity onPress={() => onFavorite(item.id)}>
                            <Image
                                source={isFav ? STAR_FILLED : STAR_OUTLINE}
                                style={[styles.customIcon, !isFav && { tintColor: '#FFC0CB' }]}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.breedText}>{item.breed || "Sem Raça"}</Text>

                <View style={styles.detailsContainer}>
                    <Text style={styles.detailValue}>🎂 {item.age ? item.age + " anos" : "Jovem"}</Text>
                    {item.location && <Text style={styles.locationText}>📍 {item.location}</Text>}

                    {/* --- AQUI ESTÁ O TEMPERAMENTO DE VOLTA --- */}
                    {translatedTemperament && (
                        <Text style={styles.detailValueFull}>✨ {translatedTemperament}</Text>
                    )}
                </View>

                {isOwner ? (
                    <View>
                        <TouchableOpacity
                            style={[styles.statusButton, item.adopted ? styles.btnMakeAvailable : styles.btnMakeAdopted]}
                            onPress={() => onToggleStatus(item)}
                        >
                            <Text style={styles.statusButtonText}>
                                {item.adopted ? "↻ Tornar Disponível" : "✓ Marcar como Adotado"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.authorButtonsContainer}>
                            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
                                <Text style={styles.editButtonText}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id || item._id, userId)}>
                                <Text style={styles.deleteButtonText}>Apagar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    item.adopted ? (
                        <View style={styles.adoptedTagContainer}>
                            <Text style={styles.adoptedTagText}>⛔ Este animal já foi adotado!</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.adoptButton}
                            onPress={() => onAdopt(contactPhone)}
                        >
                            <Text style={styles.adoptButtonText}>QUERO ADOTAR 📞</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { margin: 15, backgroundColor: "#FFE4E1", borderRadius: 15, overflow: "hidden", elevation: 3 },
    cardAdopted: { backgroundColor: "#F0F0F0" },
    image: { width: "100%", height: 250, backgroundColor: "#FFC0CB" },
    overlayLabel: { position: 'absolute', top: 15, right: 15, backgroundColor: '#D32F2F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 5 },
    overlayText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    info: { padding: 15 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 24, fontWeight: "bold", color: '#FF69B4' },
    breedText: { fontSize: 18, color: '#880E4F', marginBottom: 5 },
    customIcon: { width: 30, height: 30 },

    detailsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    detailValue: { fontSize: 14, color: '#880E4F', fontWeight: 'bold' },

    // --- ESTILO QUE FALTAVA ---
    detailValueFull: { fontSize: 14, color: '#880E4F', fontWeight: 'bold', width: '100%', marginTop: 5 },

    locationText: { fontSize: 14, color: '#880E4F', fontWeight: 'bold' },

    adoptButton: { backgroundColor: '#FFB6C1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    adoptButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    adoptedTagContainer: { backgroundColor: '#A9A9A9', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    adoptedTagText: { color: 'white', fontWeight: 'bold' },

    statusButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15, borderWidth: 2 },
    btnMakeAdopted: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
    btnMakeAvailable: { borderColor: '#FF9800', backgroundColor: '#FFF3E0' },
    statusButtonText: { color: '#333', fontWeight: 'bold' },

    authorButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
    editButton: { flex: 1, backgroundColor: '#FF69B4', padding: 8, borderRadius: 8, alignItems: 'center' },
    editButtonText: { color: '#fff', fontWeight: 'bold' },
    deleteButton: { flex: 1, backgroundColor: '#D81B60', padding: 8, borderRadius: 8, alignItems: 'center' },
    deleteButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default PetCard;