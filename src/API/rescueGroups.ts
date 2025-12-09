// src/API/rescueGroups.ts

const API_KEY = "WH97xX1z"; // só para testes

// Tipo para os animais retornados pela API
export type Animal = {
    id: number;
    attributes: {
        name: string;
        speciesName: string;
        sex: string;
        ageString: string;
        pictures?: {
            original?: {
                url: string;
            };
        }[];
    };
};

// Função para buscar animais
export const buscarAnimais = async (): Promise<Animal[] | null> => {
    try {
        const url = 'https://api.rescuegroups.org/v5/public/animals?limit=10';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                Authorization: `apikey ${API_KEY}`,
            },
        });

        if (!response.ok) {
            const textoErro = await response.text();
            throw new Error(`Erro na API (${response.status}): ${textoErro}`);
        }

        const json = await response.json();

        console.log("Sucesso! Animais encontrados:", json.data.length);

        return json.data as Animal[];
    } catch (error) {
        console.error("Falha ao buscar animais:", error);
        return null;
    }
};
