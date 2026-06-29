// src/components/ProtectedRoute/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, role: requiredRole }) => {
  const location = useLocation();
  const token = localStorage.getItem('authToken');

  console.log(`[ProtectedRoute] Verificando rota: ${location.pathname}`);
  
  if (!token) {
    console.log('[ProtectedRoute] Redirecionando: Sem token.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    console.log('[ProtectedRoute] Token decodificado:', decodedToken);

    const currentTime = Date.now() / 1000;
    if (decodedToken.exp < currentTime) {
      console.log('[ProtectedRoute] Redirecionando: Token expirado.');
      localStorage.removeItem('authToken');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // O papel é derivado do 'role' (admins) ou do 'type' do token.
    // Tokens de cliente não têm 'role', mas têm type 'client'/'client_shared_access'.
    const userRole =
      decodedToken.role ||
      (decodedToken.type === 'user_admin' ? 'admin' : 'client');
    console.log(`[ProtectedRoute] Role requerida: '${requiredRole}'. Role do usuário: '${userRole}'.`);

    if (requiredRole && userRole !== requiredRole) {
      console.log('[ProtectedRoute] Redirecionando: papel não autorizado para esta rota.');
      // Manda cada usuário para a sua área correta, evitando loop de redirecionamento.
      const home = userRole === 'admin' ? '/admin/dashboard' : '/painel';
      return <Navigate to={home} replace />;
    }

    console.log('[ProtectedRoute] Acesso concedido.');
    return children;

  } catch (error) {
    console.error('[ProtectedRoute] Redirecionando: Token inválido ou erro ao decodificar.', error);
    localStorage.removeItem('authToken');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default ProtectedRoute;