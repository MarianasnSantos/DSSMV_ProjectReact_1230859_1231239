// src/actions/PetActions.js

import AppDispatcher from '../dispatchers/AppDispatcher';
import AuthStore from '../stores/AuthStore';

// ----------------------------
// Funções auxiliares
// ----------------------------

// 1️⃣ Buscar dados completos da raça no TheDogAPI
async function getBreedInfo(breedName) {
    try {
        const res = await fetch('https://api.thedogapi.com/v1/breeds');
        const data = await res.json();
        if (!Array.isArray(data)) return {};
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

// 2️⃣ Buscar animais do RestDB
async function fetchAnimalsFromRestDB() {
    try {
        const res = await fetch('https://petmatch-afab.restdb.io/rest/animals', {
            headers: { 'x-apikey': 'a29c6a5e4f29c400c1ffac21c4c454f2af5a3' }
        });
        const data = await res.json();
        return Array.isArray(data) ? data.map(a => ({ ...a, id: a._id })) : [];
    } catch (error) {
        console.error("Erro ao buscar animais do RestDB:", error);
        return [];
    }
}

// 3️⃣ Buscar raças do TheDogAPI
async function fetchDogBreeds() {
    try {
        const res = await fetch('https://api.thedogapi.com/v1/breeds');
        const data = await res.json();
        return Array.isArray(data) ? data.map(b => b.name) : [];
    } catch (error) {
        console.error("Erro ao buscar raças do TheDogAPI:", error);
        return [];
    }
}

// 4️⃣ Simulação de registro de adoção
async function registerAdoptionInterest(animalId, userId) {
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Interesse de adoção registado para Animal ID: ${animalId} pelo Usuário ID: ${userId}`);
    return true;
}

// 5️⃣ Criar novo animal no RestDB
async function postAnimalToRestDB(animalData) {
    const breedInfo = await getBreedInfo(animalData.breed);

    const fullAnimal = {
        ...animalData,
        temperament: animalData.temperament || breedInfo.temperament,
        life_span: animalData.life_span || breedInfo.life_span
    };

    const res = await fetch('https://petmatch-afab.restdb.io/rest/animals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-apikey': 'a29c6a5e4f29c400c1ffac21c4c454f2af5a3'
        },
        body: JSON.stringify(fullAnimal)
    });

    if (!res.ok) throw new Error("Falha ao criar animal");
    const created = await res.json();
    return { ...created, id: created._id };
}

// ----------------------------
// Classe de Actions
// ----------------------------

export class PetActions {

    // Carregar animais e raças
    static async loadAnimals() {
        AppDispatcher.dispatch({ type: 'LOAD_ANIMALS_START' });

        try {
            const [animals, breeds] = await Promise.all([
                fetchAnimalsFromRestDB(),
                fetchDogBreeds()
            ]);

            const breedList = ['Todos', ...breeds];

            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_SUCCESS',
                payload: { animals, breeds: breedList }
            });

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_FAIL',
                payload: { error: error.message || "Erro desconhecido ao carregar animais" }
            });
        }
    }

    // Criar novo animal (preenche automaticamente temperament e life_span)
    static async createAnimal(animalData) {
        AppDispatcher.dispatch({ type: 'CREATE_ANIMAL_START' });

        try {
            const newAnimal = await postAnimalToRestDB(animalData);

            AppDispatcher.dispatch({
                type: 'CREATE_ANIMAL_SUCCESS',
                payload: { animal: newAnimal }
            });

            // Recarrega lista de animais
            this.loadAnimals();

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'CREATE_ANIMAL_FAIL',
                payload: { error: error.message }
            });
        }
    }

    // Definir filtro
    static setFilter(filterType, value) {
        AppDispatcher.dispatch({
            type: 'SET_FILTER',
            payload: { filterType, value }
        });
    }

    // Iniciar adoção
    static async startAdoption(animalId, userId) {
        AppDispatcher.dispatch({
            type: 'ADOPTION_START',
            payload: { animalId }
        });

        try {
            const success = await registerAdoptionInterest(animalId, userId);

            if (success) {
                AppDispatcher.dispatch({
                    type: 'ADOPTION_SUCCESS',
                    payload: { animalId }
                });
            } else {
                throw new Error("O servidor rejeitou o pedido de adoção.");
            }

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'ADOPTION_FAIL',
                payload: { animalId, error: error.message || "Falha de rede ao enviar pedido." }
            });
        }
    }

    // Adicionar/Remover favorito
    static async toggleFavorite(animalId) {
        const { user, favorites } = AuthStore.getState();
        if (!user || !user._id) return;

        const newFavorites = favorites.includes(animalId)
            ? favorites.filter(id => id !== animalId)
            : [...favorites, animalId];

        try {
            // Atualiza favoritos no backend (simulação)
            AppDispatcher.dispatch({
                type: 'FAVORITE_SUCCESS',
                payload: { animalId }
            });
        } catch (error) {
            AppDispatcher.dispatch({
                type: 'FAVORITE_FAIL',
                payload: { error: error.message }
            });
        }
    }
}
