// src/API/theDogAPI.js

const API_KEY = "live_HFWDmoFTpPNthL3vABnNtUWxJ4zMGzg1qLRfa9Xt8hjTAkrc2DhrTkj9kUL5c0vz";


// função assíncrona para procurar dados de cães na API
export const buscarCães = async () => {
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
        console.log("Sucesso! Cães encontrados:", data.length);


        return data;
    } catch (error) {

        console.error("Falha ao procurar cães:", error);
        return null;
    }
};