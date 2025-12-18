import EventEmitter from 'eventemitter3';
import AppDispatcher from '../dispatchers/AppDispatcher';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORE_KEY = 'AuthStoreData';

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
        await AsyncStorage.setItem(AUTH_STORE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
        console.warn("Falha ao guardar estado:", e);
    }
};

const loadState = async () => {
    try {
        const serializedState = await AsyncStorage.getItem(AUTH_STORE_KEY);
        if (serializedState === null) return;

        const storedData = JSON.parse(serializedState);
        _state = {
            ..._state,
            user: storedData.user || null,
            isLoggedIn: storedData.isLoggedIn || false,
            favorites: Array.isArray(storedData.favorites) ? storedData.favorites : [],
        };
        store.emitChange();
    } catch (e) {
        console.warn("Falha ao carregar estado:", e);
    }
};

class AuthStore extends EventEmitter {
    getState() { return _state; }
    emitChange() { this.emit('change'); }
    addChangeListener(callback) { this.on('change', callback); }
    removeChangeListener(callback) { this.removeListener('change', callback); }

    // ⭐️ O 'return' permite que o App.jsx aguarde o carregamento
    initialize() {
        return loadState();
    }
}

const store = new AuthStore();

AppDispatcher.register((action) => {
    switch (action.type) {
        case 'USER_LOGIN_SUCCESS':
        case 'USER_REGISTER_SUCCESS':
            _state = {
                ..._state,
                loading: false,
                isLoggedIn: true,
                user: action.payload.user,
                favorites: action.payload.user.favorites || [],
                error: null
            };
            store.emitChange();
            saveState();
            break;

        case 'FAVORITE_SUCCESS':
            const animalId = String(action.payload.animalId);
            let newFavorites = [..._state.favorites];

            if (newFavorites.includes(animalId)) {
                newFavorites = newFavorites.filter(id => id !== animalId);
            } else {
                newFavorites.push(animalId);
            }

            _state.favorites = newFavorites;
            store.emitChange();
            saveState(); // Guarda no telemóvel
            break;

        case 'USER_LOGOUT':
            _state = { user: null, isLoggedIn: false, favorites: [], loading: false, error: null };
            store.emitChange();
            saveState();
            break;

        default:
            return;
    }
});

export default store;