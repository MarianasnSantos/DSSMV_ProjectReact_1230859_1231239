import EventEmitter from 'eventemitter3'; // 1. Corrigido: Uso de eventemitter3 para React Native
import AppDispatcher from '../dispatchers/AppDispatcher';
import { Animal } from '../API/rescueGroups';
import { FluxAction } from '../types/ActionType';


// --- Tipos ---
interface PetStoreState {
    animals: Animal[];
    loading: boolean;
    error: string | null;
}

// Definição do estado inicial privado
let _state: PetStoreState = {
    animals: [],
    loading: false,
    error: null,
};

// --- Store ---
class PetStore extends EventEmitter {
    // Método para obter o estado atual (getter)
    getState(): PetStoreState {
        return _state;
    }

    // Métodos para Views se registrarem e desregistrarem
    emitChange() {
        this.emit('change');
    }

    addChangeListener(callback: () => void) {
        this.on('change', callback);
    }

    removeChangeListener(callback: () => void) {
        this.removeListener('change', callback);
    }
}

const store = new PetStore();

// --- Registro no Dispatcher (Lógica de Negócio) ---
// 3. Tipagem explícita da action resolve o erro TS7006
AppDispatcher.register((action: FluxAction) => {
    switch (action.type) {
        case 'LOAD_ANIMALS_START':
            _state = { ..._state, loading: true, error: null };
            store.emitChange(); // Notifica as Views para mostrar o ActivityIndicator
            break;

        case 'LOAD_ANIMALS_SUCCESS':
            _state = {
                ..._state,
                loading: false,
                animals: action.payload.animals, // Assume que 'animals' está no payload
                error: null
            };
            store.emitChange(); // Notifica as Views com os novos dados
            break;

        case 'LOAD_ANIMALS_FAIL':
            _state = {
                ..._state,
                loading: false,
                error: action.payload.error // Assume que 'error' está no payload
            };
            store.emitChange(); // Notifica as Views com a mensagem de erro
            break;

        default:
            return; // Ignora ações não relacionadas
    }
});

export default store;