// src/API/theDogAPI.ts

export type Dog = {
    id: number;
    name: string;
    temperament?: string;
    life_span?: string;
    image?: {
        url: string;
    };
};

// Substitui pelo teu API key da TheDog API
const API_KEY = "live_HFWDmoFTpPNthL3vABnNtUWxJ4zMGzg1qLRfa9Xt8hjTAkrc2DhrTkj9kUL5c0vz";

export const buscarCachorros = async (): Promise<Dog[] | null> => {
    try {
        const response = await fetch("https://api.thedogapi.com/v1/breeds", {
            headers: {
                'x-api-key': API_KEY
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Erro na API (${response.status}): ${text}`);
        }

        const data = await response.json();
        console.log("Sucesso! Cachorros encontrados:", data.length);

        return data as Dog[];
    } catch (error) {
        console.error("Falha ao buscar cachorros:", error);
        return null;
    }
};

