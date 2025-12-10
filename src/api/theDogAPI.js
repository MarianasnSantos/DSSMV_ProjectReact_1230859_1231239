// src/API/theDogAPI.js

const API_KEY = "live_HFWDmoFTpPNthL3vABnNtUWxJ4zMGzg1qLRfa9Xt8hjTAkrc2DhrTkj9kUL5c0vz";


// Função assíncrona para procurar dados de cães na API.
export const buscarCães = async () => {
    try {
        const response = await fetch("https://api.thedogapi.com/v1/breeds", {
            headers: {
                'x-api-key': API_KEY
            },
        });

        // O método fetch não lança erro para códigos HTTP 4xx ou 5xx.
        // Por isso, verificamos response.ok e forçamos o erro para cair no bloco catch.
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Erro na API (${response.status}): ${text}`);
        }

        const data = await response.json();
        console.log("Sucesso! Cães encontrados:", data.length);

        // Retorna o array de dados.
        return data;
    } catch (error) {
        // Captura erros de rede ou o erro forçado acima (HTTP 4xx/5xx).
        console.error("Falha ao procurar cães:", error);
        return null;
    }
};