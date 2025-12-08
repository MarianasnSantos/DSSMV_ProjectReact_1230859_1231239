// src/services/UserService.ts

import { User } from '../model/User';
import { API_KEY, BASE_URL, DATABASE_NAME } from './ApiConfig';

// A função agora recebe APENAS o username
export async function loginUser(username: string): Promise<User | null> {
    const url = `${BASE_URL}/${DATABASE_NAME}?q={"username": "${username}"}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': API_KEY, // Chave de autenticação
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            // Se a resposta HTTP não for bem-sucedida (ex: 401, 404)
            console.error('Erro na resposta da API:', response.status);
            return null;
        }

        const data = await response.json();

        // restdb.io retorna um array de resultados
        if (data.length > 0) {
            // Se encontrou pelo menos um usuário, o login é bem-sucedido.
            const loggedInUser: User = data[0];
            console.log('Login bem-sucedido para:', loggedInUser.username);
            return loggedInUser;
        } else {
            // Nenhum usuário encontrado com esse username
            console.log('Utilizador não encontrado.');
            return null;
        }

    } catch (error) {
        console.error('Erro de conexão ou durante o fetch:', error);
        return null;
    }
}