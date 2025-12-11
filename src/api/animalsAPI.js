const API_URL = "https://petmatch-afab.restdb.io/rest/animals";
const API_KEY = "a29c6a5e4f29c400c1ffac21c4c454f2af5a3";

export async function getAnimals() {
    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "x-apikey": API_KEY,
                "Content-Type": "application/json"
            }
        });

        // 1. Verificar se a resposta foi sucesso (Código 200-299)
        if (!response.ok) {
            console.error("Erro RestDB GET:", response.status, await response.text());
            return []; // Devolve lista vazia para não crashar o Feed
        }

        const data = await response.json();

        // 2. Garantir que devolvemos sempre um Array, mesmo que a API falhe
        if (Array.isArray(data)) {
            return data;
        } else {
            console.warn("A API não devolveu uma lista:", data);
            return [];
        }

    } catch (err) {
        console.error("Erro de rede ao buscar animais:", err);
        return [];
    }
}

export async function addAnimal(animalData) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "x-apikey": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(animalData)
        });

        if (!response.ok) {
            const erroTexto = await response.text();
            console.error("Erro RestDB POST:", response.status, erroTexto);
            return null; // Indica que falhou
        }

        return await response.json();
    } catch (err) {
        console.error("Erro de rede ao adicionar animal:", err);
        return null;
    }
}