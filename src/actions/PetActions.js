import AppDispatcher from '../dispatchers/AppDispatcher';
import AuthStore from '../stores/AuthStore';

// ----------------------------
// CONFIGURAÇÕES
// ----------------------------
const RESTDB_API_KEY = 'a29c6a5e4f29c400c1ffac21c4c454f2af5a3';
const RESTDB_URL = 'https://petmatch-afab.restdb.io/rest/animals';
// Ajuste a URL abaixo para a sua coleção de utilizadores
const RESTDB_USERS_URL = 'https://petmatch-afab.restdb.io/rest/appusers';

// ----------------------------
// Funções auxiliares (API)
// ----------------------------

async function getBreedInfo(breedName) {
    try {
        const res = await fetch('https://api.thedogapi.com/v1/breeds');
        const data = await res.json();
        if (!Array.isArray(data)) return {};
        const breed = data.find(b => b.name.toLowerCase() === (breedName || "").toLowerCase());
        if (!breed) return {};
        return {
            temperament: breed.temperament || "Desconhecido",
            life_span: breed.life_span || "Sem dados"
        };
    } catch { return {}; }
}

async function fetchAnimalsFromRestDB() {
    try {
        const res = await fetch(RESTDB_URL, {
            headers: { 'x-apikey': RESTDB_API_KEY, 'cache-control': 'no-cache' }
        });
        const data = await res.json();
        return Array.isArray(data) ? data.map(a => ({ ...a, id: String(a._id) })) : [];
    } catch (err) {
        console.error("Erro fetch RestDB:", err);
        return [];
    }
}

async function fetchDogBreeds() {
    try {
        const res = await fetch('https://api.thedogapi.com/v1/breeds');
        const data = await res.json();
        return Array.isArray(data) ? data.map(b => b.name) : [];
    } catch { return []; }
}

async function postAnimalToRestDB(animalData) {
    const breedInfo = await getBreedInfo(animalData.breed);
    const fullAnimal = {
        ...animalData,
        temperament: animalData.temperament || breedInfo.temperament,
    };
    const res = await fetch(RESTDB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-apikey': RESTDB_API_KEY },
        body: JSON.stringify(fullAnimal)
    });
    if (!res.ok) throw new Error("Falha ao salvar no RestDB");
    const created = await res.json();
    return { ...created, id: String(created._id) };
}

async function deleteAnimalFromRestDB(animalId) {
    const res = await fetch(`${RESTDB_URL}/${animalId}`, {
        method: 'DELETE',
        headers: { 'x-apikey': RESTDB_API_KEY }
    });
    return res.ok;
}

async function putAnimalToRestDB(animalData) {
    const res = await fetch(`${RESTDB_URL}/${animalData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-apikey': RESTDB_API_KEY, 'Cache-Control': 'no-cache' },
        body: JSON.stringify(animalData)
    });
    if (!res.ok) throw new Error("Falha ao atualizar no RestDB");
    const updated = await res.json();
    return { ...updated, id: String(updated._id) };
}

// ⭐️ Função para salvar favoritos no perfil do utilizador na Nuvem
async function syncUserFavoritesToRestDB(userId, favoritesArray) {
    try {
        await fetch(`${RESTDB_USERS_URL}/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': RESTDB_API_KEY
            },
            body: JSON.stringify({ favorites: favoritesArray })
        });
    } catch (err) {
        console.error("Erro ao sincronizar favoritos na nuvem:", err);
    }
}

// ===============================================================
// AÇÕES (Flux)
// ===============================================================
export class PetActions {

    static async loadAnimals() {
        AppDispatcher.dispatch({ type: 'LOAD_ANIMALS_START' });
        try {
            const [animals, breeds] = await Promise.all([fetchAnimalsFromRestDB(), fetchDogBreeds()]);
            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_SUCCESS',
                payload: { animals, breeds: ['Todos', ...breeds] }
            });
        } catch (error) {
            AppDispatcher.dispatch({ type: 'LOAD_ANIMALS_FAIL', payload: { error: error.message } });
        }
    }

    static async addAnimal(animalData) {
        AppDispatcher.dispatch({ type: 'CREATE_ANIMAL_START' });
        const { user } = AuthStore.getState();
        if (!user) {
            AppDispatcher.dispatch({ type: 'CREATE_ANIMAL_FAIL', payload: { error: 'Precisa estar logado.' } });
            return false;
        }
        try {
            const newAnimal = await postAnimalToRestDB(animalData);
            AppDispatcher.dispatch({ type: 'CREATE_ANIMAL_SUCCESS', payload: { animal: newAnimal } });
            this.loadAnimals();
            return true;
        } catch (error) {
            AppDispatcher.dispatch({ type: 'CREATE_ANIMAL_FAIL', payload: { error: error.message } });
            return false;
        }
    }

    static async updateAnimal(animalData) {
        if (!animalData.id) return false;
        AppDispatcher.dispatch({ type: 'UPDATE_ANIMAL_START' });
        try {
            const updatedAnimal = await putAnimalToRestDB(animalData);
            AppDispatcher.dispatch({ type: 'UPDATE_ANIMAL_SUCCESS', payload: { animal: updatedAnimal } });
            this.loadAnimals();
            return true;
        } catch (error) {
            AppDispatcher.dispatch({ type: 'UPDATE_ANIMAL_FAIL', payload: { error: error.message } });
            return false;
        }
    }

    static async deleteAnimal(animalId, addedById) {
        const { user } = AuthStore.getState();
        const userId = user?._id || user?.id;
        if (!userId || String(userId) !== String(addedById)) {
            AppDispatcher.dispatch({ type: 'DELETE_ANIMAL_FAIL', payload: { error: "Sem permissão." } });
            return false;
        }
        AppDispatcher.dispatch({ type: 'DELETE_ANIMAL_START' });
        try {
            const ok = await deleteAnimalFromRestDB(animalId);
            if (ok) {
                AppDispatcher.dispatch({ type: 'DELETE_ANIMAL_SUCCESS', payload: { id: String(animalId) } });
                this.loadAnimals();
                return true;
            }
            throw new Error("Falha no servidor.");
        } catch (error) {
            AppDispatcher.dispatch({ type: 'DELETE_ANIMAL_FAIL', payload: { error: error.message } });
            return false;
        }
    }

    static setFilter(filterType, value) {
        AppDispatcher.dispatch({ type: 'SET_FILTER', payload: { filterType, value } });
    }

    static async startAdoption(animalId, userId) {
        const aId = String(animalId);
        AppDispatcher.dispatch({ type: 'ADOPTION_START', payload: { animalId: aId } });
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            AppDispatcher.dispatch({ type: 'ADOPTION_SUCCESS', payload: { animalId: aId } });
        } catch (error) {
            AppDispatcher.dispatch({ type: 'ADOPTION_FAIL', payload: { animalId: aId, error: error.message } });
        }
    }

    // ⭐️ Favoritos sincronizados com Memória, Disco e Nuvem
    static toggleFavorite(animalId) {
        const idString = String(animalId);

        // 1. Dispatch para atualizar a UI imediatamente (via Store)
        AppDispatcher.dispatch({
            type: 'FAVORITE_SUCCESS',
            payload: { animalId: idString }
        });

        // 2. Sincronizar com RestDB para persistência entre dispositivos
        const { user, favorites } = AuthStore.getState();
        const userId = user?._id || user?.id;

        if (userId) {
            // favorites aqui já contém a lista atualizada pelo dispatch acima
            syncUserFavoritesToRestDB(userId, favorites);
        }
    }
}