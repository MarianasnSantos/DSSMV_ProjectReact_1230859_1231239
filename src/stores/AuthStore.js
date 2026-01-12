

import EventEmitter from 'eventemitter3';
import AppDispatcher from '../dispatchers/AppDispatcher';
import AsyncStorage from '@react-native-async-storage/async-storage';


const AUTH_STORE_KEY = 'AuthStoreData';

// Estado privado
let _state = {
    user: null,
    isLoggedIn: false,
    loading: false,
    error: null,
    favorites: [],
};

const saveState = async () => {
    try {
        const stateToPersist = {
            user: _state.user,
            isLoggedIn: _state.isLoggedIn,
            favorites: _state.favorites,
        };
        const serializedState = JSON.stringify(stateToPersist);
        await AsyncStorage.setItem(AUTH_STORE_KEY, serializedState);
    } catch (e) {
        console.warn("Falha ao guardar estado do AuthStore:", e);
    }
};

const loadState = async () => {
    try {
        const serializedState = await AsyncStorage.getItem(AUTH_STORE_KEY);
        if (serializedState === null) {
            return;
        }

        const storedData = JSON.parse(serializedState);

        // aplica o estado carregado (login e favoritos)
        _state = {
            ..._state,
            user: storedData.user || null,
            favorites: storedData.favorites || [],
            isLoggedIn: storedData.isLoggedIn || false,
        };

        store.emitChange();

    } catch (e) {
        console.warn("Falha ao carregar estado do AuthStore:", e);
    }
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

    initialize() {
        loadState(); // CHAMA A FUNÇÃO loadState DEFINIDA ACIMA
    }
}

const store = new AuthStore();


AppDispatcher.register((action) => {
    switch (action.type) {

        case 'USER_LOGIN_SUCCESS':
        case 'USER_REGISTER_SUCCESS':
            const fetchedFavorites = action.payload.user.favorites || [];

            _state = {
                ..._state,
                loading: false,
                isLoggedIn: true,
                user: action.payload.user,
                favorites: fetchedFavorites,
                error: null
            };
            store.emitChange();
            saveState();
            break;

        case 'FAVORITE_SUCCESS':
            const animalId = action.payload.animalId;
            let newFavorites = [..._state.favorites];

            if (newFavorites.includes(animalId)) {
                newFavorites = newFavorites.filter(id => id !== animalId);
            } else {
                newFavorites.push(animalId);
            }

            _state = {
                ..._state,
                favorites: newFavorites,
            };
            store.emitChange();
            saveState();
            break;

        case 'USER_LOGOUT':
            _state = { ..._state, isLoggedIn: false, user: null, favorites: [], error: null };
            store.emitChange();
            saveState();
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