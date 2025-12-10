// src/stores/PetStore.js

import EventEmitter from 'eventemitter3'; // Usamos eventemitter3 (polyfill para RN)
import AppDispatcher from '../dispatchers/AppDispatcher';
// ⚠️ Nota: A importação de tipos como { Animal } e { FluxAction } é removida no JS puro.

// Definição do estado inicial privado
// Removemos a interface PetStoreState e a tipagem do estado
let _state = {
    // Renomeando para 'dogs' para consistência com theDogAPI
    dogs: [],
    loading: false,
    error: null,
    // (Opcional) Adicione likedDogs/swipedDogs se já tiver essa lógica:
    // likedDogs: [],
};

// --- Store ---
class PetStore extends EventEmitter {
    // Método para obter o estado atual (getter)
    // Removemos a tipagem de retorno
    getState() {
        return _state;
    }

    // Métodos para Views se registrarem e desregistrarem
    emitChange() {
        this.emit('change');
    }

    // Removemos a tipagem ': () => void'
    addChangeListener(callback) {
        this.on('change', callback);
    }

    removeChangeListener(callback) {
        this.removeListener('change', callback);
    }
}

const store = new PetStore();

// --- Registro no Dispatcher (Lógica de Negócio) ---
// Removemos a tipagem explícita da action ': FluxAction'
AppDispatcher.register((action) => {
    switch (action.type) {
        case 'LOAD_ANIMALS_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'LOAD_ANIMALS_SUCCESS':
            _state = {
                ..._state,
                loading: false,
                // Assume que o payload contém os dados sob a chave 'animals'
                dogs: action.payload.animals,
                error: null
            };
            store.emitChange();
            break;

        case 'LOAD_ANIMALS_FAIL':
            _state = {
                ..._state,
                loading: false,
                error: action.payload.error
            };
            store.emitChange();
            break;

        default:
            return;
    }
});

export default store;