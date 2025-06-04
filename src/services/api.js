import axios from 'axios';
import { message } from 'antd'; // Para exibir mensagens de erro globais

// Define a URL base da sua API.
// Em um ambiente de produção, você usaria process.env.REACT_APP_API_URL ou similar.
const VITE_API_URL ='https://geral-agentewhatsappapi.r954jc.easypanel.host/api';

const apiClient = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT a todas as requisições
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Ou onde você armazenar o token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas de erro globalmente
apiClient.interceptors.response.use(
  (response) => {
    // Qualquer código de status que esteja dentro do intervalo de 2xx faz com que esta função seja acionada
    return response;
  },
  (error) => {
    // Qualquer código de status que caia fora do intervalo de 2xx faz com que esta função seja acionada
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um código de status
      // que cai fora do intervalo de 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        // Ex: Token inválido ou expirado, redirecionar para login
        message.error(data?.message || 'Sessão expirada ou inválida. Faça login novamente.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('selectedProfileId');
        // A navegação será tratada pelo componente que fez a chamada ou um listener global
        // window.location.href = '/login'; // Comentado para permitir tratamento mais granular
      } else if (status === 403) {
        // Ex: Usuário não tem permissão
        message.error(data?.message || 'Você não tem permissão para realizar esta ação.');
      } else if (status === 404) {
        // Não mostra mensagem global para 404, pois pode ser tratado especificamente
        // message.error(data?.message || 'Recurso não encontrado.');
        console.warn('API Error 404:', data?.message || 'Recurso não encontrado.');
      } else if (status >= 500) {
        // Erro de servidor
        message.error(data?.message || 'Ocorreu um erro no servidor. Tente novamente mais tarde.');
      } else if (data?.message) {
        // Outros erros com mensagem da API
        message.error(data.message);
      } else {
        // Erro genérico da requisição
        message.error('Ocorreu um erro ao processar sua solicitação.');
      }
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      // `error.request` é uma instância do XMLHttpRequest no browser e uma instância de
      // http.ClientRequest no node.js
      message.error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
    } else {
      // Algo aconteceu na configuração da requisição que acionou um erro
      message.error('Erro ao configurar a requisição: ' + error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;