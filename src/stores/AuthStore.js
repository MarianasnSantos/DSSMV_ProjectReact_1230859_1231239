

import EventEmitter from 'eventemitter3';
import AppDispatcher from '../dispatchers/AppDispatcher';

// Estado privado (a fonte de verdade para a autenticação)
let _state = {
    user: null, // Objeto User logado
    isLoggedIn: false,
    loading: false,
    error: null,
};

class AuthStore extends EventEmitter {
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
        // --- INÍCIO (Views mostram o loading) ---
        case 'USER_LOGIN_START':
        case 'USER_REGISTER_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange();
            break;

        // --- SUCESSO (Utilizador logado/registado com sucesso) ---
        case 'USER_LOGIN_SUCCESS':
        case 'USER_REGISTER_SUCCESS':
            _state = {
                ..._state,
                loading: false,
                isLoggedIn: true,
                user: action.payload.user, // O objeto User vem do payload
                error: null
            };
            store.emitChange();
            break;

        // --- FALHA (O Serviço falhou) ---
        case 'USER_LOGIN_FAIL':
        case 'USER_REGISTER_FAIL':
            _state = {
                ..._state,
                loading: false,
                error: action.payload.error
            };
            store.emitChange();
            break;

        // --- LOGOUT ---
        case 'USER_LOGOUT':
            _state = { ..._state, isLoggedIn: false, user: null, error: null };
            store.emitChange();
            break;

        default:
            return;
    }
});

export default store;