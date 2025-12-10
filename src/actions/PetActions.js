// src/actions/PetActions.js

import AppDispatcher from '../dispatchers/AppDispatcher';
import { buscarCães } from '../API/theDogAPI';
import { translateTemperament, translateLifeSpan } from '../utils/translations';
import { updateUserFavorites } from '../services/UserService';
import AuthStore from '../stores/AuthStore';

// ⚠️ Simulação: Função dummy para o Serviço de Adoção
const registerAdoptionInterest = async (animalId, userId) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Interesse de adoção registado para Animal ID: ${animalId} pelo Usuário ID: ${userId}`);
    return true;
};


export class PetActions {
    // -----------------------------------------------------------------
    // AÇÃO 1: PROCURAR ANIMAIS (COM TRADUÇÃO)
    // -----------------------------------------------------------------
    static async loadAnimals() {
        AppDispatcher.dispatch({ type: 'LOAD_ANIMALS_START' });

        try {
            const rawAnimals = await buscarCães();

            if (rawAnimals && rawAnimals.length > 0) {

                // PROCESSAMENTO E TRADUÇÃO DOS DADOS:
                const processedAnimals = rawAnimals.map(animal => ({
                    ...animal,
                    temperament: translateTemperament(animal.temperament),
                    life_span: translateLifeSpan(animal.life_span),
                }));

                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_SUCCESS',
                    payload: { animals: processedAnimals },
                });
            } else {
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_FAIL',
                    payload: { error: "API retornou dados vazios ou nulos." },
                });
            }
        } catch (error) {
            console.error("Erro na Action ao carregar animais:", error);
            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_FAIL',
                payload: { error: error.message || "Erro desconhecido ao procurar animais." },
            });
        }
    }

    // -----------------------------------------------------------------
    // AÇÃO 2: DEFINIR FILTRO (Para Raça, Idade Mínima, Temperamento)
    // -----------------------------------------------------------------
    static setFilter(filterType, value) {
        AppDispatcher.dispatch({
            type: 'SET_FILTER',
            payload: { filterType, value }
        });
    }

    // -----------------------------------------------------------------
    // AÇÃO 3: INICIAR PROCESSO DE ADOÇÃO
    // -----------------------------------------------------------------
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
                payload: { animalId, error: error.message || "Falha de rede ao enviar pedido." },
            });
        }
    }

    // -----------------------------------------------------------------
    // AÇÃO 4: ADICIONAR/REMOVER DOS FAVORITOS
    // -----------------------------------------------------------------
    static async toggleFavorite(animalId) {
        const { user, favorites } = AuthStore.getState();

        if (!user || !user._id) {
            AppDispatcher.dispatch({
                type: 'FAVORITE_FAIL',
                payload: { error: "Utilizador não autenticado." },
            });
            return;
        }

        const userId = user._id;
        let newFavorites;
        const isCurrentlyFavorite = favorites.includes(animalId);

        if (isCurrentlyFavorite) {
            newFavorites = favorites.filter(id => id !== animalId);
        } else {
            newFavorites = [...favorites, animalId];
        }

        try {
            await updateUserFavorites(userId, newFavorites);

            AppDispatcher.dispatch({
                type: 'FAVORITE_SUCCESS',
                payload: { animalId }
            });

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'FAVORITE_FAIL',
                payload: { error: error.message || "Falha ao comunicar com o servidor de perfil." },
            });
        }
    }
}