// src/services/AnimalService.js

// Função para buscar dados da raça no TheDogAPI
export async function getBreedInfo(breedName) {
    try {
        const res = await fetch('https://api.thedogapi.com/v1/breeds');
        const data = await res.json();
        const breed = data.find(b => b.name.toLowerCase() === breedName.toLowerCase());
        if (!breed) return {};
        return {
            temperament: breed.temperament || "Desconhecido",
            life_span: breed.life_span || "Sem dados"
        };
    } catch (error) {
        console.error("Erro ao buscar info da raça:", error);
        return {};
    }
}

// Função para criar novo animal no RestDB
export async function createAnimal(animalData, apiKey) {
    // animalData: { name, breed, age, photo, ... }

    // Buscar temperamento
    const breedInfo = await getBreedInfo(animalData.breed);

    // Criar o objeto completo
    const fullAnimal = {
        ...animalData,
        temperament: animalData.temperament || breedInfo.temperament,
        life_span: animalData.life_span || breedInfo.life_span
    };

    // Enviar para RestDB
    const res = await fetch('https://petmatch-afab.restdb.io/rest/animals', {


        //POST
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-apikey': apiKey
        },
        body: JSON.stringify(fullAnimal)
    });

    if (!res.ok) throw new Error("Falha ao criar animal");
    return await res.json();
}
