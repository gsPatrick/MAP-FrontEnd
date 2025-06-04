// --- START OF FILE ProfileContext.jsx ---

import React, { createContext, useState, useMemo, useContext, useEffect, useCallback } from 'react';
import apiClient from '../services/api'; // Importar o apiClient
import { CreditCardOutlined, DropboxOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons'; // Para ícones padrão
import { message } from 'antd'; // Para feedback

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [userProfiles, setUserProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileIdState] = useState(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true); // Estado de loading para perfis
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Para saber se o usuário está autenticado

  const mapProfileTypeToIcon = (type) => {
    switch (type) {
      case 'PF':
        return <CreditCardOutlined />;
      case 'PJ':
        return <ShopOutlined />;
      case 'MEI':
        return <DropboxOutlined />; // Ou UserOutlined se MEI for mais pessoal
      default:
        return <UserOutlined />;
    }
  };

  const fetchUserProfiles = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUserProfiles([]);
      setSelectedProfileIdState(null);
      setIsAuthenticated(false);
      setLoadingProfiles(false);
      return null; // Retorna null se não autenticado
    }

    setIsAuthenticated(true);
    setLoadingProfiles(true);
    try {
      // A rota /auth/client/me retorna o cliente e suas financialAccounts
      const response = await apiClient.get('/auth/client/me');
      if (response.data && response.data.status === 'success') {
        const clientData = response.data.data.client;
        const financialAccounts = response.data.data.financialAccounts || [];

        // Mapeia FinancialAccounts para o formato de userProfiles
        const fetchedProfiles = financialAccounts.map(acc => ({
          id: acc.id.toString(), // ID da FinancialAccount
          name: acc.accountName,
          type: acc.accountType, // PF, PJ, MEI
          icon: mapProfileTypeToIcon(acc.accountType),
          isDefault: acc.isDefault,
          // Outros dados da financialAccount podem ser adicionados aqui se necessário
        }));

        setUserProfiles(fetchedProfiles);

        // Lógica para definir o perfil selecionado
        const savedProfileId = localStorage.getItem('selectedProfileId');
        let currentSelection = null;

        if (savedProfileId && fetchedProfiles.find(p => p.id === savedProfileId)) {
          currentSelection = savedProfileId;
        } else if (fetchedProfiles.length > 0) {
          const defaultProfile = fetchedProfiles.find(p => p.isDefault);
          currentSelection = defaultProfile ? defaultProfile.id : fetchedProfiles[0].id;
        }
        
        setSelectedProfileIdState(currentSelection);
        if (currentSelection) {
            localStorage.setItem('selectedProfileId', currentSelection);
        } else {
            localStorage.removeItem('selectedProfileId');
        }
        
        console.log("Perfis carregados do contexto:", fetchedProfiles, "Selecionado:", currentSelection);
        return { client: clientData, profiles: fetchedProfiles }; // Retorna dados para uso se necessário
      } else {
        throw new Error(response.data?.message || "Falha ao buscar perfis do usuário.");
      }
    } catch (error) {
      console.error("Erro ao buscar perfis do usuário:", error);
      // Se der erro (ex: token inválido), limpa tudo
      localStorage.removeItem('authToken');
      localStorage.removeItem('selectedProfileId');
      setUserProfiles([]);
      setSelectedProfileIdState(null);
      setIsAuthenticated(false);
      // message.error("Sua sessão expirou. Faça login novamente."); // O interceptor do API já deve tratar isso
      return null;
    } finally {
      setLoadingProfiles(false);
    }
  }, []); // useCallback para estabilizar a função

  // Efeito para buscar perfis na montagem inicial se houver token
  useEffect(() => {
    fetchUserProfiles();
  }, [fetchUserProfiles]);
  
  // Função para setar o ID do perfil, atualizando o localStorage
  const setSelectedProfileId = (profileId) => {
    if (profileId) {
      localStorage.setItem('selectedProfileId', profileId);
    } else {
      localStorage.removeItem('selectedProfileId');
    }
    setSelectedProfileIdState(profileId);
  };


  const currentProfile = useMemo(() => {
    if (loadingProfiles || userProfiles.length === 0) {
        // Tenta pegar do localStorage como último recurso se ainda estiver carregando
        // ou se não houver perfis (ex: usuário novo sem perfis criados)
        // Esta lógica pode ser complexa se o nome/tipo não estiverem no localStorage.
        // É melhor esperar o loadingProfiles ser false.
        return null;
    }
    return userProfiles.find(p => p.id === selectedProfileId) || userProfiles[0] || null;
  }, [selectedProfileId, userProfiles, loadingProfiles]);


  const value = useMemo(() => ({
    userProfiles,
    selectedProfileId,
    setSelectedProfileId, // Função para mudar o perfil
    currentProfile,
    currentProfileType: currentProfile?.type,
    currentProfileName: currentProfile?.name,
    loadingProfiles,
    isAuthenticated,
    fetchUserProfiles // Expõe a função para ser chamada de fora (ex: após login)
  }), [userProfiles, selectedProfileId, currentProfile, loadingProfiles, isAuthenticated, fetchUserProfiles]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile deve ser usado dentro de um ProfileProvider');
  }
  return context;
};
// --- END OF FILE ProfileContext.jsx ---