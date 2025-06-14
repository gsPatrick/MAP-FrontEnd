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

    // A verificação de 'role' agora é mais robusta
    const userRole = decodedToken.role;
    console.log(`[ProtectedRoute] Role requerida: '${requiredRole}'. Role do usuário: '${userRole}'.`);

    if (requiredRole && userRole !== requiredRole) {
      console.log('[ProtectedRoute] Redirecionando: Role do usuário não autorizada.');
      // Se um cliente tentar acessar /admin, jogue-o para o painel dele.
      // Se um usuário sem role definida tentar acessar uma rota de admin, jogue-o para o login.
      return <Navigate to={userRole ? "/painel" : "/login"} replace />;
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