
const API_KEY = "live_HFWDmoFTpPNthL3vABnNtUWxJ4zMGzg1qLRfa9Xt8hjTAkrc2DhrTkj9kUL5c0vz";


// Removendo a tipagem: export const buscarCachorros = async () => { ... }
export const buscarCachorros = async () => {
    try {
        const response = await fetch("https://api.thedogapi.com/v1/breeds", {
            headers: {
                'x-api-key': API_KEY
            },
        });

        if (!response.ok) {
            const text = await response.text();
            // Removendo a tipagem e o 'throw new Error' em JS puro
            throw new Error(`Erro na API (${response.status}): ${text}`);
        }

        const data = await response.json();
        console.log("Sucesso! Cachorros encontrados:", data.length);

        // Retorna o array de dados (sem tipagem 'as Dog[]')
        return data;
    } catch (error) {
        console.error("Falha ao buscar cachorros:", error);
        return null;
    }
};

// Removendo a classe vazia sem propósito no JS puro,
// a menos que você queira usá-la.
// export class buscarAnimais {}