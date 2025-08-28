// src/services/api.js
import axios from 'axios';
import { message } from 'antd';

const VITE_API_URL = 'https://geral-agentewhatsappapi.r954jc.easypanel.host/api';

const apiClient = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// <<< INTERCEPTOR SIMPLIFICADO E CORRIGIDO >>>
apiClient.interceptors.response.use(
  // Se a resposta for bem-sucedida (status 2xx), apenas a retorna.
  (response) => response,

  // Se a resposta for um erro...
  (error) => {
    // 1. Verifica se o erro é de rede (sem resposta do servidor)
    if (!error.response) {
      message.error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
    }
    
    // 2. Se o erro veio da API (com uma resposta), nós NÃO FAZEMOS NADA AQUI.
    // Apenas rejeitamos a promise. Isso FORÇA o erro a ser tratado
    // no bloco .catch() do componente que fez a chamada (LoginPage, SignupPage, etc.).
    // Isso garante que a lógica de modais e mensagens específicas de cada página funcione.
    return Promise.reject(error);
  }
);

export default apiClient;