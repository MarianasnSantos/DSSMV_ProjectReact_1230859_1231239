// src/actions/PetActions.ts
import AppDispatcher from '../dispatchers/AppDispatcher';
import { buscarAnimais } from '../API/rescueGroups';

export class PetActions {
    static async loadAnimals() {
        // 1. Notificar os Stores que o loading começou
        AppDispatcher.dispatch({
            type: 'LOAD_ANIMALS_START',
        });

        try {
            // 2. Chamar a função de utilidade de rede
            const animals = await buscarAnimais();

            if (animals) {
                // 3. Sucesso: Envia os dados
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_SUCCESS',
                    payload: { animals },
                });
            } else {
                // 3. Falha: Trata o caso em que a API retorna null (erro interno já tratado)
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_FAIL',
                    payload: { error: "Não foi possível carregar animais (Resposta vazia)." },
                });
            }
        } catch (error: any) {
            // 3. Falha: Envia a mensagem de erro da API
            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_FAIL',
                payload: { error: error.message || "Erro desconhecido ao buscar animais." },
            });
        }
    }
}