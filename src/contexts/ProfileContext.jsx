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
        const adminProfile = {
          id: 'admin_profile',
          name: userData.name || 'Administrador',
          type: 'ADMIN',
          icon: mapProfileTypeToIcon('ADMIN'),
        };
        setUserProfiles([adminProfile]);
        setSelectedProfileIdState(adminProfile.id);
        setCurrentProfile(adminProfile); 
      } else if (userRole === 'client') {
        const response = await apiClient.get('/auth/client/me');

        if (response.data && response.data.status === 'success') {
          const financialAccounts = response.data.data.financialAccounts || [];
          
          const fetchedProfiles = financialAccounts.map(acc => ({
            id: acc.id.toString(),
            name: acc.accountName,
            type: acc.accountType,
            icon: mapProfileTypeToIcon(acc.accountType),
            isDefault: acc.isDefault,
            documentNumber: acc.documentNumber // Adicionando para o modal de edição
          }));
          
          setUserProfiles(fetchedProfiles);

          let finalProfileId = null;
          if (fetchedProfiles.length > 0) {
              const savedProfileId = localStorage.getItem('selectedProfileId');
              const defaultProfile = fetchedProfiles.find(p => p.isDefault);
              
              // Prioridade: ID salvo, se ainda for válido. Senão, novo padrão. Senão, primeiro da lista.
              if (savedProfileId && fetchedProfiles.find(p => p.id === savedProfileId)) {
                  finalProfileId = savedProfileId;
              } else {
                  finalProfileId = defaultProfile ? defaultProfile.id : fetchedProfiles[0].id;
              }
          }
          
          setSelectedProfileIdState(finalProfileId);
          if (finalProfileId) {
            localStorage.setItem('selectedProfileId', finalProfileId);
            const newCurrentProfile = fetchedProfiles.find(p => p.id === finalProfileId);
            setCurrentProfile(newCurrentProfile);
          } else {
            localStorage.removeItem('selectedProfileId');
            setCurrentProfile(null);
          }
        } else {
          throw new Error(response.data?.message || "Falha ao buscar perfis do cliente.");
        }
      }
    } catch (error) {
      console.error("[ProfileContext] Erro fatal ao buscar perfis, limpando sessão:", error);
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
    } else if (!profileId) {
        localStorage.removeItem('selectedProfileId');
    }
    setSelectedProfileIdState(profileId);
    const newProfile = userProfiles.find(p => p.id === profileId);
    setCurrentProfile(newProfile || null);
  };
  
  const value = useMemo(() => ({
    userProfiles,
    selectedProfileId,
    setSelectedProfileId,
    currentProfile,
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