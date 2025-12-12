/// src/actions/PetActions.js

import AppDispatcher from '../dispatchers/AppDispatcher';
import AuthStore from '../stores/AuthStore';

// ----------------------------
// CONFIGURAÇÕES
// ----------------------------
const RESTDB_API_KEY = 'a29c6a5e4f29c400c1ffac21c4c454f2af5a3'; // A tua chave
const RESTDB_URL = 'https://petmatch-afab.restdb.io/rest/animals';

// ----------------------------
// Funções auxiliares (API)
// ----------------------------

// 1️⃣ Buscar dados completos da raça (TheDogAPI)
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
    } catch {
        return {};
    }
}

// 2️⃣ Buscar animais do RestDB
async function fetchAnimalsFromRestDB() {
    try {
        const res = await fetch(RESTDB_URL, {
            headers: {
                'x-apikey': RESTDB_API_KEY,
                'cache-control': 'no-cache'
            }
        });
        const data = await res.json();

        return Array.isArray(data)
            ? data.map(a => ({
                ...a,
                id: String(a._id), // O RestDB usa _id, nós usamos id na App
                // Mantemos os nomes originais para bater certo com o Feed:
                // addedBy, addedById, photoUrl, age, etc.
            }))
            : [];
    } catch (err) {
        console.error("Erro fetch RestDB:", err);
        return [];
    }
}

// 3️⃣ Buscar lista de raças (TheDogAPI)
async function fetchDogBreeds() {
    try {
        const res = await fetch('https://api.thedogapi.com/v1/breeds');
        const data = await res.json();
        return Array.isArray(data) ? data.map(b => b.name) : [];
    } catch {
        return [];
    }
}

// 4️⃣ Criar animal no RestDB
async function postAnimalToRestDB(animalData) {
    // Tenta complementar dados se a raça existir na API pública
    const breedInfo = await getBreedInfo(animalData.breed);

    const fullAnimal = {
        ...animalData,
        // Se o utilizador não preencheu, tenta usar o da API
        temperament: animalData.temperament || breedInfo.temperament,
        // O RestDB espera number no 'age', mas string no life_span da API
        // Mantemos o que veio do formulário prioritariamente
    };

    const res = await fetch(RESTDB_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-apikey': RESTDB_API_KEY
        },
        body: JSON.stringify(fullAnimal)
    });

    if (!res.ok) {
        throw new Error("Falha ao salvar no RestDB");
    }

    const created = await res.json();
    return { ...created, id: String(created._id) };
}

// 5️⃣ Apagar animal do RestDB
async function deleteAnimalFromRestDB(animalId) {
    const res = await fetch(
        `${RESTDB_URL}/${animalId}`,
        {
            method: 'DELETE',
            headers: { 'x-apikey': RESTDB_API_KEY }
        }
    );
    return res.ok;
}

// ===============================================================
// AÇÕES (Flux)
// ===============================================================
export class PetActions {

    // Carregar animais para o Feed
    static async loadAnimals() {
        AppDispatcher.dispatch({ type: 'LOAD_ANIMALS_START' });

        try {
            const [animals, breeds] = await Promise.all([
                fetchAnimalsFromRestDB(),
                fetchDogBreeds()
            ]);

            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_SUCCESS',
                payload: {
                    animals,
                    breeds: ['Todos', ...breeds]
                }
            });

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_FAIL',
                payload: { error: error.message }
            });
        }
    }

    // Adicionar Animal (Chamado pelo AddAnimalScreen)
    // ⚠️ Renomeado de createAnimal para addAnimal para bater certo com o ecrã
    static async addAnimal(animalData) {
        AppDispatcher.dispatch({ type: 'CREATE_ANIMAL_START' });

        const { user } = AuthStore.getState();

        if (!user) {
            AppDispatcher.dispatch({
                type: 'CREATE_ANIMAL_FAIL',
                payload: { error: 'Precisa estar logado para criar.' }
            });
            return false;
        }

        try {
            // O animalData já vem completo do AddAnimalScreen (com addedBy e addedById)
            // Não precisamos de sobrescrever aqui, apenas enviar.
            const newAnimal = await postAnimalToRestDB(animalData);

            AppDispatcher.dispatch({
                type: 'CREATE_ANIMAL_SUCCESS',
                payload: { animal: newAnimal }
            });

            // Recarrega a lista para aparecer logo no feed
            this.loadAnimals();
            return true;

        } catch (error) {
            console.error(error);
            AppDispatcher.dispatch({
                type: 'CREATE_ANIMAL_FAIL',
                payload: { error: error.message }
            });
            return false;
        }
    }

    // Apagar animal
    static async deleteAnimal(animalId, addedById) {
        const { user } = AuthStore.getState();
        const userId = user?._id || user?.id; // Garante que pega o ID

        if (!userId) {
            AppDispatcher.dispatch({
                type: 'DELETE_ANIMAL_FAIL',
                payload: { error: "Tem de estar logado para apagar." }
            });
            return false;
        }

        // Validação de segurança extra (embora o botão já esteja escondido na view)
        if (String(userId) !== String(addedById)) {
            AppDispatcher.dispatch({
                type: 'DELETE_ANIMAL_FAIL',
                payload: { error: "Só o dono pode apagar este animal." }
            });
            return false;
        }

        AppDispatcher.dispatch({ type: 'DELETE_ANIMAL_START' });

        try {
            const ok = await deleteAnimalFromRestDB(animalId);

            if (ok) {
                AppDispatcher.dispatch({
                    type: 'DELETE_ANIMAL_SUCCESS',
                    payload: { id: String(animalId) }
                });

                // Recarrega para garantir que a lista fica limpa
                this.loadAnimals();
                return true;
            } else {
                throw new Error("Falha ao apagar animal no servidor.");
            }

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'DELETE_ANIMAL_FAIL',
                payload: { error: error.message }
            });
            return false;
        }
    }

    // Filtros do Feed
    static setFilter(filterType, value) {
        AppDispatcher.dispatch({
            type: 'SET_FILTER',
            payload: { filterType, value }
        });
    }

    // Iniciar processo de Adoção
    static async startAdoption(animalId, userId) {
        const aId = String(animalId);

        AppDispatcher.dispatch({
            type: 'ADOPTION_START',
            payload: { animalId: aId }
        });

        try {
            // Simulação de tempo de rede
            await new Promise(resolve => setTimeout(resolve, 1000));

            AppDispatcher.dispatch({
                type: 'ADOPTION_SUCCESS',
                payload: { animalId: aId }
            });

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'ADOPTION_FAIL',
                payload: { animalId: aId, error: error.message }
            });
        }
    }

    // Favoritos
    static toggleFavorite(animalId) {
        // A lógica real de guardar favoritos geralmente é no AuthStore ou LocalStorage
        // Aqui apenas despachamos o evento
        AppDispatcher.dispatch({
            type: 'FAVORITE_SUCCESS',
            payload: { animalId: String(animalId) }
        });
    }
}
