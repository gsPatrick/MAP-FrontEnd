// src/pages/LoginPage/LoginPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Form, Input, Button, Typography, message } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './LoginPage.css';
import apiClient from '../../services/api';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para ler os parâmetros da URL
  const [loading, setLoading] = useState(false);

  // Efeito para a animação do card de login
  useEffect(() => {
    const loginCard = document.querySelector('.login-card-container');
    if (loginCard) loginCard.classList.add('visible');
    document.body.classList.add('login-page-active');
    return () => { document.body.classList.remove('login-page-active'); };
  }, []);
  
  // Função centralizada para lidar com o sucesso do login e redirecionamento
  const handleLoginSuccess = useCallback((loginData) => {
    const { token, client, financialAccounts, subscriptionStatus, user, role } = loginData;

    // Limpa qualquer dado de sessão anterior para garantir um login limpo
    localStorage.clear();

    // Salva os novos dados no localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userData', JSON.stringify(role === 'admin' ? user : client));
    localStorage.setItem('subscriptionStatus', subscriptionStatus || 'active');

    // Lê o parâmetro 'redirect' da URL para saber se o usuário veio de uma tentativa de compra
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect');

    let targetPath;

    // LÓGICA DE REDIRECIONAMENTO COM PRIORIDADES
    if (redirectPath) {
        // 1ª PRIORIDADE: Se o usuário foi forçado a logar para concluir uma ação (como pagar),
        // ele é enviado diretamente para essa ação.
        targetPath = redirectPath;
        message.success(`Login bem-sucedido! Redirecionando para o checkout...`);

    } else if (role === 'admin') {
        // 2ª PRIORIDADE: Se for um administrador, ele sempre vai para o dashboard de admin.
        targetPath = '/admin/dashboard';
        message.success(`Login de administrador bem-sucedido! Bem-vindo(a), ${user.name}!`);

    } else {
        // 3ª PRIORIDADE: Lógica padrão para clientes
        if (subscriptionStatus === 'expired' || subscriptionStatus === 'free_tier') {
            // Se o plano está expirado ou é gratuito, o destino é a página de planos para que ele possa assinar/renovar.
            message.warning('Sua assinatura não está ativa! Por favor, renove para ter acesso completo.');
            targetPath = '/#planos';
        } else {
            // Se o plano está ativo, o destino é o painel principal.
            message.success(`Bem-vindo(a) de volta, ${client.name || client.email}!`);
            targetPath = '/painel';
        }
    }
    
    // Define o perfil financeiro padrão para o cliente
    if (financialAccounts && financialAccounts.length > 0) {
      const profile = financialAccounts.find(a => a.isDefault) || financialAccounts.find(a => a.accountType === 'PF') || financialAccounts[0];
      localStorage.setItem('selectedProfileId', profile.id.toString());
    }
    
    // Navega para o destino final definido pela lógica acima
    navigate(targetPath);
  }, [navigate, location.search]); // Depende da navegação e dos parâmetros da URL

  // Função chamada quando o formulário é submetido com sucesso
  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;

    // Tenta primeiro o login de administrador
    try {
      const adminResponse = await apiClient.post('/users/login', { email, password });
      const { token, user } = adminResponse.data.data;
      handleLoginSuccess({ token, user, role: 'admin' });
      return; // Para a execução se o login de admin for bem-sucedido
    } catch (adminError) {
      // Se não for um erro de "não autorizado", pode ser um erro de servidor.
      // Se for 401 ou 404, simplesmente ignora e tenta o login de cliente.
      if (adminError.response?.status !== 401 && adminError.response?.status !== 404) {
        console.error("Erro inesperado na tentativa de login de admin:", adminError);
        setLoading(false);
        return; 
      }
    }

    // Se o login de admin falhou, tenta o login de cliente
    try {
      const clientResponse = await apiClient.post('/auth/client/login', { identifier: email, password });
      const { token, client, financialAccounts, subscriptionStatus } = clientResponse.data.data;
      handleLoginSuccess({ token, client, financialAccounts, subscriptionStatus, role: 'client' });
    } catch (clientError) {
      const errorMessage = clientError.response?.data?.message || 'Falha no login. Verifique seus dados.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função chamada se a validação do formulário falhar
  const onFinishFailed = () => {
    message.error('Por favor, preencha todos os campos corretamente.');
  };

  return (
    <Layout className="login-page-layout">
      <HeaderLP />
      <Content className="login-page-content">
        <div className="login-card-container">
          <Title level={2} className="login-title">Bem-vindo de Volta!</Title>
          <Paragraph className="login-subtitle">Acesse sua conta para continuar no controle.</Paragraph>
          <Form name="login_form" onFinish={onFinish} onFinishFailed={onFinishFailed} layout="vertical">
            <Form.Item name="email" label="E-mail" rules={[{ required: true, message: 'Por favor, insira um e-mail válido!', type: 'email' }]}>
              <Input prefix={<MailOutlined />} placeholder="seuemail@exemplo.com" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Senha" rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Sua senha" size="large" />
            </Form.Item>
            <Form.Item className="login-form-options-simplified">
              <Link className="login-form-forgot" to="/esqueci-senha">Esqueceu sua senha?</Link>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button" size="large" block loading={loading}>Entrar</Button>
            </Form.Item>
            <Paragraph className="login-register-prompt">
              Ainda não tem uma conta? <Link to="/#planos">Conheça nossos planos!</Link>
            </Paragraph>
          </Form>
        </div>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default LoginPage;