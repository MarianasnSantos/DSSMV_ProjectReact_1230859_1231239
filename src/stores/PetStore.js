// src/stores/PetStore.js

import EventEmitter from 'eventemitter3';
import AppDispatcher from '../dispatchers/AppDispatcher';

// Definição do estado inicial privado
let _state = {
    animals: [], // Usando 'animals' para evitar o erro TS2339 no IDE
    loading: false,
    error: null,
    // NOVO: Objeto para rastrear o estado de adoção por animalId: { animalId: 'pending' | 'success' | 'fail' }
    adoptionRequests: {},
};

// --- Store ---
class PetStore extends EventEmitter {
    getState() {
        return _state;
    }
    // ... (métodos emitChange, addChangeListener, removeChangeListener)
    emitChange() {
        this.emit('change');
    }

    addChangeListener(callback) {
        this.on('change', callback);
    }

    removeChangeListener(callback) {
        this.removeListener('change', callback);
    }
}

const store = new PetStore();

// --- Registro no Dispatcher (Lógica de Negócio) ---
AppDispatcher.register((action) => {
    switch (action.type) {
        // --- Fluxo de Carregamento (Existente) ---
        case 'LOAD_ANIMALS_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'LOAD_ANIMALS_SUCCESS':
            _state = {
                ..._state,
                loading: false,
                animals: action.payload.animals,
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

        // --- Fluxo de Adoção (NOVO) ---
        case 'ADOPTION_START':
            _state = {
                ..._state,
                adoptionRequests: {
                    ..._state.adoptionRequests,
                    [action.payload.animalId]: 'pending', // Marca como "pendente"
                }
            };
            store.emitChange();
            break;

        case 'ADOPTION_SUCCESS':
            _state = {
                ..._state,
                adoptionRequests: {
                    ..._state.adoptionRequests,
                    [action.payload.animalId]: 'success', // Marca como "sucesso"
                }
            };
            store.emitChange();
            break;

        case 'ADOPTION_FAIL':
            _state = {
                ..._state,
                adoptionRequests: {
                    ..._state.adoptionRequests,
                    [action.payload.animalId]: 'fail', // Marca como "falha"
                }
            };
            store.emitChange();
            break;

        default:
            return;
    }
});

export default store;