
import { API_KEY, BASE_URL, DATABASE_NAME } from './ApiConfig';


const RESTDB_USERS_URL = `${BASE_URL}/${DATABASE_NAME}`;

export async function authenticateUser(username) {
    // A query para buscar o usuário
    const query = { username: username };
    const filterQuery = encodeURIComponent(JSON.stringify(query));
    const fullUrl = `${RESTDB_USERS_URL}?q=${filterQuery}`;

    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'x-apikey': API_KEY,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}. Detalhes: ${await response.text()}`);
        }

        // Remove a tipagem no 'await response.json()'
        const data = await response.json();

        if (data.length === 1) {
            // Retorna o objeto User encontrado
            return data[0];
        } else {
            return null; // Username não encontrado
        }

    } catch (error) { // Remove a tipagem ': any'
        console.error("Erro ao tentar autenticar:", error);
        throw new Error(`Falha na comunicação com a API de autenticação. ${error.message}`);
    }
}


export async function registerUser(username) {

    // 1. Verifica se já existe antes de tentar registar
    const existingUser = await authenticateUser(username);
    if (existingUser) {
        throw new Error("Utilizador já existe.");
    }

    // 2. Cria o objeto JSON para POST
    const newUser = {
        username: username,
    };

    try {
        const response = await fetch(RESTDB_USERS_URL, {
            method: 'POST',
            headers: {
                'x-apikey': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erro de Registo Detalhado:", errorData);
            throw new Error(`Falha no registo. Detalhe: ${errorData.message || response.status}`);
        }

        // Remove a tipagem
        const registeredUser = await response.json();
        return registeredUser;

    } catch (error) { // Remove a tipagem ': any'
        console.error("Erro ao tentar registar:", error);
        throw error;
    }
}