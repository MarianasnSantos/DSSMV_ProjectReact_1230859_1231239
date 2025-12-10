const API_URL = "https://petmatch-afab.restdb.io/rest/animals";
const API_KEY = "A_TUA_API_KEY_AQUI"; // coloca a tua chave do RestDB

export async function getAnimals() {
    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "x-apikey": API_KEY,
                "Content-Type": "application/json"
            }
        });

        return await response.json();
    } catch (err) {
        console.error("Erro ao buscar animais:", err);
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

        return await response.json();
    } catch (err) {
        console.error("Erro ao adicionar animal:", err);
        return null;
    }
}
