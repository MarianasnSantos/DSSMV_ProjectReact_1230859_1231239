// src/stores/PetStore.js

import EventEmitter from 'eventemitter3';
import AppDispatcher from '../dispatchers/AppDispatcher';

let _state = {
    animals: [],
    loading: false,
    error: null,
    adoptionRequests: {},
    breeds: ['Todos'],
    filters: {
        breed: null,
        minAge: null,
        temperament: null,
    },
};

class PetStore extends EventEmitter {
    getState() { return _state; }
    emitChange() { this.emit('change'); }
    addChangeListener(callback) { this.on('change', callback); }
    removeChangeListener(callback) { this.removeListener('change', callback); }
}

const store = new PetStore();



AppDispatcher.register((action) => {
    switch (action.type) {

        case 'LOAD_ANIMALS_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'LOAD_ANIMALS_SUCCESS':
            const animals = action.payload?.animals || [];
            const breeds = action.payload?.breeds || ['Todos'];

            _state = {
                ..._state,
                loading: false,
                animals,
                breeds,
                error: null
            };
            store.emitChange();
            break;

        case 'LOAD_ANIMALS_FAIL':
            _state = { ..._state, loading: false, error: action.payload.error };
            store.emitChange();
            break;


        case 'CREATE_ANIMAL_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'CREATE_ANIMAL_SUCCESS':
            _state = {
                ..._state,
                loading: false,
                animals: [..._state.animals, action.payload.animal],
                error: null
            };
            store.emitChange();
            break;

        case 'CREATE_ANIMAL_FAIL':
            _state = { ..._state, loading: false, error: action.payload.error };
            store.emitChange();
            break;


        case 'UPDATE_ANIMAL_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'UPDATE_ANIMAL_SUCCESS':
            const incomingData = action.payload.animal;
            const newList = _state.animals.map(animal => {
                // Compara IDs garantindo que são strings
                const isMatch = String(animal._id || animal.id) === String(incomingData._id || incomingData.id);

                if (isMatch) {
                    return { ...animal, ...incomingData };
                }
                return animal;
            });

            _state = {
                ..._state,
                loading: false,
                animals: newList,
                error: null
            };
            store.emitChange();
            break;

        case 'UPDATE_ANIMAL_FAIL':
            _state = { ..._state, loading: false, error: action.payload.error };
            store.emitChange();
            break;

        case 'DELETE_ANIMAL_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'DELETE_ANIMAL_SUCCESS':
            _state = {
                ..._state,
                loading: false,
                // Compara ambos os tipos de ID para garantir a remoção
                animals: _state.animals.filter(a =>
                    String(a.id || a._id) !== String(action.payload.id)
                ),
                error: null
            };
            store.emitChange();
            break;

        case 'DELETE_ANIMAL_FAIL':
            _state = { ..._state, loading: false, error: action.payload.error };
            store.emitChange();
            break;



        case 'SET_FILTER':
            const { filterType, value } = action.payload;
            const cleanedValue = (value === 'Todos' || !value) ? null : value;

            _state = {
                ..._state,
                filters: { ..._state.filters, [filterType]: cleanedValue }
            };
            store.emitChange();
            break;



        case 'ADOPTION_START':
            _state = {
                ..._state,
                adoptionRequests: {
                    ..._state.adoptionRequests,
                    [action.payload.animalId]: 'pending',
                }
            };
            store.emitChange();
            break;

        case 'ADOPTION_SUCCESS':
            _state = {
                ..._state,
                adoptionRequests: {
                    ..._state.adoptionRequests,
                    [action.payload.animalId]: 'success',
                }
            };
            store.emitChange();
            break;

        case 'ADOPTION_FAIL':
            _state = {
                ..._state,
                adoptionRequests: {
                    ..._state.adoptionRequests,
                    [action.payload.animalId]: 'fail',
                }
            };
            store.emitChange();
            break;


        case 'FAVORITE_SUCCESS':
        case 'FAVORITE_FAIL':
            // O AuthStore é que lida com o estado dos favoritos, o PetStore apenas re-emite se for necessário
            store.emitChange();
            break;

        default:
            return;
    }
});

export default store;