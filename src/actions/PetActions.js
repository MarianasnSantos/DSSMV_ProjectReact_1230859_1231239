// src/actions/PetActions.js

import AppDispatcher from '../dispatchers/AppDispatcher';
import { buscarCães } from '../API/theDogAPI';
// Importa o serviço para atualizar favoritos no RestDB.io
import { updateUserFavorites } from '../services/UserService';
// Importa o Store de Autenticação para obter o ID do usuário e a lista de favoritos
import AuthStore from '../stores/AuthStore';

// ⚠️ Simulação: Função dummy para o Serviço de Adoção (substituir por código real se necessário)
const registerAdoptionInterest = async (animalId, userId) => {
    // Simula uma chamada API demorada
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Interesse de adoção registado para Animal ID: ${animalId} pelo Usuário ID: ${userId}`);
    return true; // Simula o sucesso
};


export class PetActions {

    static async loadAnimals() {
        AppDispatcher.dispatch({ type: 'LOAD_ANIMALS_START' });

        try {
            // ⭐️ Chama o Serviço de API
            const animals = await buscarCães();

            if (animals && animals.length > 0) {
                // SUCESSO
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_SUCCESS',
                    payload: { animals },
                });
            } else {
                // DADOS VAZIOS
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_FAIL',
                    payload: { error: "API retornou dados vazios ou nulos." },
                });
            }
        } catch (error) {
            // FALHA DE REDE/CATCH (Tratamento de Erros)
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
            // 2. Chama a função de serviço simulada
            const success = await registerAdoptionInterest(animalId, userId);

            if (success) {
                // 3. Sucesso: Notifica os Stores
                AppDispatcher.dispatch({
                    type: 'ADOPTION_SUCCESS',
                    payload: { animalId }
                });
            } else {
                throw new Error("O servidor rejeitou o pedido de adoção.");
            }

        } catch (error) {
            // 3. Falha: Notifica os Stores
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
        // 1. Obter estado atual do AuthStore
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

        // Define o NOVO array de favoritos
        if (isCurrentlyFavorite) {
            newFavorites = favorites.filter(id => id !== animalId);
        } else {
            newFavorites = [...favorites, animalId];
        }

        try {
            // 2. Chama o Serviço: Atualiza o RestDB.io com o novo array
            await updateUserFavorites(userId, newFavorites);

            // 3. Sucesso: Notifica o AuthStore para atualizar o estado local
            AppDispatcher.dispatch({
                type: 'FAVORITE_SUCCESS',
                payload: { animalId }
            });

        } catch (error) {
            // 3. Falha: Notifica o Store
            AppDispatcher.dispatch({
                type: 'FAVORITE_FAIL',
                payload: { error: error.message || "Falha ao comunicar com o servidor de perfil." },
            });
        }
    }
}