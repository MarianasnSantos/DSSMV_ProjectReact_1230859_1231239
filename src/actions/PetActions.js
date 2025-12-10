
import AppDispatcher from '../dispatchers/AppDispatcher';
import { buscarCães } from '../API/theDogAPI';

export class PetActions {
    static async loadAnimals() {
        // 1. Notificar os Stores que o loading começou
        AppDispatcher.dispatch({
            type: 'LOAD_ANIMALS_START',
        });

        try {
            // 2. Chamar a função de utilidade de rede
            // Assumindo que buscarAnimais é uma função assíncrona, e não uma classe que precisa de 'new'
            const animals = await buscarCães();
            // Se buscarAnimais realmente for uma classe, use: const animals = await new buscarAnimais().algumMetodo();


            if (animals) {
                // 3. Sucesso: Envia os dados
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_SUCCESS',
                    payload: { animals },
                });
            } else {
                // 3. Falha: Trata o caso em que a API retorna null
                AppDispatcher.dispatch({
                    type: 'LOAD_ANIMALS_FAIL',
                    payload: { error: "Não foi possível carregar animais (Resposta vazia)." },
                });
            }
        } catch (error) {
            // 3. Falha: Bloco catch simples (JS puro, removemos o ': any')
            AppDispatcher.dispatch({
                type: 'LOAD_ANIMALS_FAIL',
                payload: { error: error.message || "Erro desconhecido ao buscar animais." },
            });
        }
    }
}