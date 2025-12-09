// src/dispatchers/AppDispatcher.js

// ⚠️ CORREÇÃO: Importar Dispatcher como o export default do módulo 'flux'
import Dispatcher from 'flux';

const AppDispatcher = new Dispatcher();

export default AppDispatcher;