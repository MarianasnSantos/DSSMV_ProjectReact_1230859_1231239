// src/stores/AuthStore.js

import EventEmitter from 'eventemitter3';
import AppDispatcher from '../dispatchers/AppDispatcher';

// Estado privado (a fonte de verdade para a autenticação)
let _state = {
    user: null, // Objeto User logado
    isLoggedIn: false,
    loading: false,
    error: null,
    favorites: [], // ⭐️ NOVO: Array para guardar IDs de animais favoritos
};

class AuthStore extends EventEmitter {
    // ... (Métodos getState, emitChange, addChangeListener, removeChangeListener)
    getState() {
        return _state;
    }

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

const store = new AuthStore();

// --- Registro no Dispatcher (Lógica de Negócio de Autenticação) ---
AppDispatcher.register((action) => {
    switch (action.type) {
        // --- SUCESSO DE LOGIN/REGISTO (Atualiza o estado e os Favoritos) ---
        case 'USER_LOGIN_SUCCESS':
        case 'USER_REGISTER_SUCCESS':
            // ⚠️ Assumimos que o objeto 'user' do RestDB.io tem uma propriedade 'favorites'
            // (Se o campo não existir, ele será um array vazio [ ])
            const fetchedFavorites = action.payload.user.favorites || [];

            _state = {
                ..._state,
                loading: false,
                isLoggedIn: true,
                user: action.payload.user,
                favorites: fetchedFavorites, // ⭐️ Carrega os favoritos do usuário
                error: null
            };
            store.emitChange();
            break;

        // --- AÇÃO FLUX DOS FAVORITOS (Vinda do PetActions) ---
        case 'FAVORITE_SUCCESS':
            // Esta ação é disparada após o sucesso do PATCH/PUT no RestDB.io
            const animalId = action.payload.animalId;
            let newFavorites = [..._state.favorites];

            if (newFavorites.includes(animalId)) {
                // Remove dos favoritos (Toggle OFF)
                newFavorites = newFavorites.filter(id => id !== animalId);
            } else {
                // Adiciona aos favoritos (Toggle ON)
                newFavorites.push(animalId);
            }

            _state = {
                ..._state,
                favorites: newFavorites, // ⭐️ Atualiza o array no Store
            };
            store.emitChange();
            break;

        // --- OUTRAS AÇÕES (LOGOUT/LOADING/FAIL) ---
        case 'USER_LOGOUT':
            _state = { ..._state, isLoggedIn: false, user: null, favorites: [], error: null };
            store.emitChange();
            break;

        case 'USER_LOGIN_START':
        case 'USER_REGISTER_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        case 'USER_LOGIN_FAIL':
        case 'USER_REGISTER_FAIL':
            _state = { ..._state, loading: false, error: action.payload.error };
            store.emitChange();
            break;

        default:
            return;
    }
});

export default store;