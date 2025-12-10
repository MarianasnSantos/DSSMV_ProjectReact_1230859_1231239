const API_URL = "https://petmatch-afab.restdb.io/rest/animals";
const API_KEY = "a29c6a5e4f29c400c1ffac21c4c454f2af5a3";

export async function addAnimal(animal) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-apikey": API_KEY,
                "Cache-Control": "no-cache"
            },
            body: JSON.stringify(animal)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erro RestDB:", errorText);
            return null;
        }

        return await response.json();

    } catch (error) {
        console.error("Erro geral ao adicionar:", error);
        return null;
    }
}
