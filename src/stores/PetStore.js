// src/stores/PetStore.js

import EventEmitter from 'eventemitter3';
import AppDispatcher from '../dispatchers/AppDispatcher';

let _state = {
    animals: [],
    loading: false,
    error: null,
    adoptionRequests: {},

    // ESTADO PARA FILTROS
    availableBreeds: [],
    filters: {
        breed: null,
        minAge: null, // Novo campo
        temperament: null, // Novo campo
    },
};

class PetStore extends EventEmitter {
    getState() { return _state; }
    emitChange() { this.emit('change'); }
    addChangeListener(callback) { this.on('change', callback); }
    removeChangeListener(callback) { this.removeListener('change', callback); }
}

const store = new PetStore();

// --- Registro no Dispatcher ---
AppDispatcher.register((action) => {
    switch (action.type) {
        // --- Fluxo de Carregamento ---
        case 'LOAD_ANIMALS_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'LOAD_ANIMALS_SUCCESS':
            // ⭐️ Popula availableBreeds ao carregar os dados
            const allBreeds = action.payload.animals
                .map(a => a.name)
                .filter((v, i, a) => a.indexOf(v) === i)
                .sort();

            _state = {
                ..._state,
                loading: false,
                animals: action.payload.animals,
                availableBreeds: ['Todos', ...allBreeds], // 'Todos' no topo
                error: null
            };
            store.emitChange();
            break;

        case 'LOAD_ANIMALS_FAIL':
            _state = { ..._state, loading: false, error: action.payload.error };
            store.emitChange();
            break;

        // ⭐️ AÇÃO PARA DEFINIR FILTRO ⭐️
        case 'SET_FILTER':
            const { filterType, value } = action.payload;
            const cleanedValue = (value === 'Todos' || !value) ? null : value;

            _state = {
                ..._state,
                filters: {
                    ..._state.filters,
                    [filterType]: cleanedValue,
                }
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