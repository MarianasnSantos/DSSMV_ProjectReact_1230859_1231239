

import { API_KEY, BASE_URL, DATABASE_NAME } from './ApiConfig';
import { User } from '../model/User';


const RESTDB_USERS_URL = `${BASE_URL}/${DATABASE_NAME}`;

export async function updateUserFavorites(userId, newFavoritesArray) {
    if (!userId) {
        throw new Error("ID de utilizador necessário para atualizar favoritos.");
    }

    const fullUrl = `${RESTDB_USERS_URL}/${userId}`;

    try {
        const response = await fetch(fullUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': API_KEY,
            },
            body: JSON.stringify({ favorites: newFavoritesArray }), // envia apenas o array de favoritos
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro HTTP ao atualizar favoritos:', response.status, errorText);
            throw new Error(`Falha ao salvar favoritos. Código: ${response.status}`);
        }

        const updatedUser = await response.json();

        return updatedUser;

    } catch (error) {
        console.error('Falha de rede ao atualizar favoritos:', error);
        throw error;
    }
}