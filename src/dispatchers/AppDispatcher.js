// src/dispatchers/AppDispatcher.js

// 🚨 ALTERAÇÃO CRÍTICA AQUI 🚨
// Em vez de import Dispatcher from 'flux', importe explicitamente a propriedade Dispatcher:
import { Dispatcher } from 'flux';

// CUIDADO: Se isto falhar, o pacote 'flux' pode estar desatualizado ou mal instalado.
// Neste caso, a alternativa é usar 'eventemitter3' diretamente e replicar a funcionalidade.

const AppDispatcher = new Dispatcher(); // CRIA uma instância

export default AppDispatcher; // EXPORTA a instância