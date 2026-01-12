

import { API_KEY, BASE_URL, DATABASE_NAME } from './ApiConfig';
import { User } from '../model/User';

// URL base para a coleção de utilizadores
const RESTDB_USERS_URL = `${BASE_URL}/${DATABASE_NAME}`;

export async function updateUserFavorites(userId, newFavoritesArray) {
    if (!userId) {
        throw new Error("ID de utilizador necessário para atualizar favoritos.");
    }

    // Constrói a URL para o recurso específico do utilizador
    const fullUrl = `${RESTDB_USERS_URL}/${userId}`;

    try {
        const response = await fetch(fullUrl, {
            method: 'PATCH', // Usamos PATCH para atualizar apenas o campo 'favorites'
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': API_KEY,
            },
            body: JSON.stringify({ favorites: newFavoritesArray }), // Envia apenas o array de favoritos
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro HTTP ao atualizar favoritos:', response.status, errorText);
            throw new Error(`Falha ao salvar favoritos. Código: ${response.status}`);
        }

        const updatedUser = await response.json();

        // Retorna o objeto completo do utilizador atualizado
        return updatedUser;

    } catch (error) {
        console.error('Falha de rede ao atualizar favoritos:', error);
        throw error;
    }
}