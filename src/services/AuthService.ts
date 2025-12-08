import { User } from '../model/User';
// ✅ Importa as constantes reais do seu ficheiro de configuração (ApiConfig.ts)
import { API_KEY, BASE_URL, DATABASE_NAME } from './ApiConfig';

// Constrói a URL final para a coleção 'Appusers'
const RESTDB_USERS_URL = `${BASE_URL}/${DATABASE_NAME}`;

/**
 * Autentica/verifica se o utilizador existe na base de dados (GET).
 */
export async function authenticateUser(username: string): Promise<User | null> {
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

        const data: User[] = await response.json();

        if (data.length === 1) {
            return data[0];
        } else {
            return null; // Username não encontrado
        }

    } catch (error: any) {
        console.error("Erro ao tentar autenticar:", error);
        throw new Error(`Falha na comunicação com a API de autenticação. ${error.message}`);
    }
}


/**
 * Regista um novo utilizador (POST).
 */
export async function registerUser(username: string): Promise<User | null> {

    // 1. Verifica se já existe antes de tentar registar
    const existingUser = await authenticateUser(username);
    if (existingUser) {
        // Lança um erro específico que o RegisterScreen pode capturar
        throw new Error("Utilizador já existe.");
    }

    // 2. Cria o objeto JSON para POST
    const newUser = {
        username: username,
        // Adicione aqui outros campos OBRIGATÓRIOS que a sua coleção Appusers possa ter!
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
            // Tenta obter o erro detalhado do restdb.io
            const errorData = await response.json();
            console.error("Erro de Registo Detalhado:", errorData);
            // Lança um erro detalhado para o frontend
            throw new Error(`Falha no registo. Detalhe: ${errorData.message || response.status}`);
        }

        const registeredUser: User = await response.json();
        return registeredUser;

    } catch (error: any) {
        console.error("Erro ao tentar registar:", error);
        throw error;
    }
}