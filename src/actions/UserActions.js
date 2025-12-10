// src/actions/UserActions.js

import AppDispatcher from '../dispatchers/AppDispatcher';
// Importa as funções do seu serviço de autenticação
import { authenticateUser, registerUser } from '../services/AuthService';

export class UserActions {
    // -----------------------------------------------------------------
    // 1. AÇÃO DE LOGIN
    // -----------------------------------------------------------------
    static async login(credentials) {
        AppDispatcher.dispatch({ type: 'USER_LOGIN_START' });

        try {
            // Chama a função de serviço que interage com o RestDB.io
            const user = await authenticateUser(credentials.username);

            if (user) {
                AppDispatcher.dispatch({
                    type: 'USER_LOGIN_SUCCESS',
                    payload: { user: user }
                });
            } else {
                // Se authenticateUser retornou null, o username não existe
                throw new Error("Nome de utilizador não encontrado.");
            }

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'USER_LOGIN_FAIL',
                payload: { error: error.message || 'Falha na autenticação.' }
            });
        }
    }

    // -----------------------------------------------------------------
    // 2. AÇÃO DE REGISTO
    // -----------------------------------------------------------------
    static async register(credentials) {
        AppDispatcher.dispatch({ type: 'USER_REGISTER_START' });

        try {
            // Chama a função de serviço para registar o novo utilizador
            const user = await registerUser(credentials.username);

            // O registo é um sucesso! No nosso fluxo, assumimos que o registo
            // também loga o utilizador.
            AppDispatcher.dispatch({
                type: 'USER_REGISTER_SUCCESS',
                payload: { user: user }
            });

        } catch (error) {
            AppDispatcher.dispatch({
                type: 'USER_REGISTER_FAIL',
                payload: { error: error.message || 'Falha no registo.' }
            });
        }
    }

    // -----------------------------------------------------------------
    // 3. AÇÃO DE LOGOUT
    // -----------------------------------------------------------------
    static logout() {
        AppDispatcher.dispatch({ type: 'USER_LOGOUT' });
    }
}