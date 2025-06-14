// src/contexts/ProfileContext.jsx

import React, { createContext, useState, useMemo, useContext, useEffect, useCallback } from 'react';
import apiClient from '../services/api'; 
import { CreditCardOutlined, DropboxOutlined, UserOutlined, ShopOutlined, CrownOutlined } from '@ant-design/icons';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [userProfiles, setUserProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileIdState] = useState(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // <<< MUDANÇA 1: currentProfile agora é um estado explícito
  const [currentProfile, setCurrentProfile] = useState(null); 

  const mapProfileTypeToIcon = (type) => {
    switch (type) {
      case 'PF': return <CreditCardOutlined />;
      case 'PJ': return <ShopOutlined />;
      case 'MEI': return <DropboxOutlined />;
      case 'ADMIN': return <CrownOutlined />;
      default: return <UserOutlined />;
    }
  };

  const fetchUserProfiles = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const userDataString = localStorage.getItem('userData');

    if (!token || !userRole || !userDataString) {
      // Limpa todos os estados se não houver dados de login
      setUserProfiles([]);
      setSelectedProfileIdState(null);
      setCurrentProfile(null);
      setIsAuthenticated(false);
      setLoadingProfiles(false);
      return;
    }

    const userData = JSON.parse(userDataString);
    setIsAuthenticated(true);
    setLoadingProfiles(true);

    try {
      if (userRole === 'admin') {
        console.log("[ProfileContext] Detectado userRole 'admin'. Configurando perfil de admin.");
        
        const adminProfile = {
          id: 'admin_profile',
          name: userData.name || 'Administrador',
          type: 'ADMIN',
          icon: mapProfileTypeToIcon('ADMIN'),
        };

        setUserProfiles([adminProfile]);
        setSelectedProfileIdState(adminProfile.id);
        // <<< MUDANÇA 2: Seta o perfil atual de forma explícita e garantida
        setCurrentProfile(adminProfile); 
        
      } else if (userRole === 'client') {
        console.log("[ProfileContext] Detectado userRole 'client'. Buscando perfis da API.");
        const response = await apiClient.get('/auth/client/me');

        if (response.data && response.data.status === 'success') {
          const financialAccounts = response.data.data.financialAccounts || [];
          const fetchedProfiles = financialAccounts.map(acc => ({
            id: acc.id.toString(),
            name: acc.accountName,
            type: acc.accountType,
            icon: mapProfileTypeToIcon(acc.accountType),
            isDefault: acc.isDefault,
          }));

          setUserProfiles(fetchedProfiles);

          let finalProfileId = null;
          if (fetchedProfiles.length > 0) {
              const savedProfileId = localStorage.getItem('selectedProfileId');
              const defaultProfile = fetchedProfiles.find(p => p.isDefault);
              
              if (savedProfileId && fetchedProfiles.find(p => p.id === savedProfileId)) {
                  finalProfileId = savedProfileId;
              } else {
                  finalProfileId = defaultProfile ? defaultProfile.id : fetchedProfiles[0].id;
              }
          }
          
          setSelectedProfileIdState(finalProfileId);
          if (finalProfileId) {
            localStorage.setItem('selectedProfileId', finalProfileId);
            // <<< MUDANÇA 3: Seta o perfil atual de forma explícita e garantida
            setCurrentProfile(fetchedProfiles.find(p => p.id === finalProfileId));
          } else {
            localStorage.removeItem('selectedProfileId');
            setCurrentProfile(null);
          }
        } else {
          throw new Error(response.data?.message || "Falha ao buscar perfis do cliente.");
        }
      }
    } catch (error) {
      console.error("Erro fatal ao buscar perfis, limpando sessão:", error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('selectedProfileId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      setUserProfiles([]);
      setSelectedProfileIdState(null);
      setCurrentProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfiles();
  }, [fetchUserProfiles]);
  
  const setSelectedProfileId = (profileId) => {
    if (profileId && profileId !== 'admin_profile') {
      localStorage.setItem('selectedProfileId', profileId);
    }
    setSelectedProfileIdState(profileId);
    // Atualiza o currentProfile quando o ID selecionado muda
    const newProfile = userProfiles.find(p => p.id === profileId);
    setCurrentProfile(newProfile || null);
  };
  
  // <<< MUDANÇA 4: O useMemo agora apenas agrupa os valores, sem calcular o perfil
  const value = useMemo(() => ({
    userProfiles,
    selectedProfileId,
    setSelectedProfileId,
    currentProfile, // Usa o estado diretamente
    // Derivados simples são seguros aqui
    currentProfileType: currentProfile?.type, 
    currentProfileName: currentProfile?.name,
    loadingProfiles,
    isAuthenticated,
    fetchUserProfiles
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