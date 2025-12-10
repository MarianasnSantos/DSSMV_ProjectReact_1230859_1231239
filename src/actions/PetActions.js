// src/actions/PetActions.js

import AppDispatcher from '../dispatchers/AppDispatcher';
import { buscarCães } from '../API/theDogAPI';
// ⭐️ Importa a função de tradução que definimos
import {translateLifeSpan, translateTemperament} from '../utils/translations';
// Importa o serviço para atualizar favoritos no RestDB.io
import { updateUserFavorites } from '../services/UserService';
// Importa o Store de Autenticação para obter o ID do usuário e a lista de favoritos
import AuthStore from '../stores/AuthStore';

// ⚠️ Simulação: Função dummy para o Serviço de Adoção
const registerAdoptionInterest = async (animalId, userId) => {
    // Simula uma chamada API demorada
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Interesse de adoção registado para Animal ID: ${animalId} pelo Usuário ID: ${userId}`);
    return true; // Simula o sucesso
};


export class PetActions {
    // -----------------------------------------------------------------
    // AÇÃO 1: PROCURAR ANIMAIS (Lógica COMPLETA com Tradução)
    // -----------------------------------------------------------------
    static async loadAnimals() {
        AppDispatcher.dispatch({ type: 'LOAD_ANIMALS_START' });

        try {
            // 1. Chama o Serviço de API
            const rawAnimals = await buscarCães();

            if (rawAnimals && rawAnimals.length > 0) {

                // 2. PROCESSAMENTO E TRADUÇÃO DOS DADOS:
                const processedAnimals = rawAnimals.map(animal => ({
                    ...animal,
                    // Aplica a tradução ao campo temperament
                    temperament: translateTemperament(animal.temperament),
                    life_span: translateLifeSpan(animal.life_span),
                }));

                // 3. SUCESSO: Envia os dados traduzidos para o Store
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_SUCCESS',
                    payload: { animals: processedAnimals },
                });
            } else {
                // 3. DADOS VAZIOS
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_FAIL',
                    payload: { error: "API retornou dados vazios ou nulos." },
                });
            }
        } catch (error) {
            // 3. FALHA DE REDE/CATCH
            console.error("Erro na Action ao carregar animais:", error);
            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_FAIL',
                payload: { error: error.message || "Erro desconhecido ao procurar animais." },
            });
        }
    }

    // -----------------------------------------------------------------
    // AÇÃO 2: INICIAR PROCESSO DE ADOÇÃO
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
    // AÇÃO 3: ADICIONAR/REMOVER DOS FAVORITOS (Comunicação Dupla API)
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