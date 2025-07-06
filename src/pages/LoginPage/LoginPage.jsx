// src/pages/LoginPage/LoginPage.jsx

import React, { useEffect, useState } from 'react';
import { Layout, Form, Input, Button, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './LoginPage.css';

import apiClient from '../../services/api';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loginCard = document.querySelector('.login-card-container');
    if (loginCard) {
      loginCard.classList.add('visible');
    }
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []);

  const handleLoginSuccess = (token, userData, userRole, targetPath) => {
    console.log(`[handleLoginSuccess] Salvando dados para role: ${userRole}`);
    
    // --- ADIÇÃO: Limpar completamente o localStorage antes de salvar a nova sessão ---
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('selectedProfileId'); // Limpa sempre qualquer ID de perfil selecionado anterior

    // Salva os dados de autenticação no localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userData', JSON.stringify(userData));

    // Lógica específica para clientes (perfis financeiros)
    if (userRole === 'client' && targetPath === '/painel') {
      const financialAccounts = userData.financialAccounts || [];
      if (financialAccounts.length > 0) {
          const defaultAccount = financialAccounts.find(acc => acc.isDefault) || financialAccounts[0];
          const initialProfileId = defaultAccount.id.toString(); // Garante consistência (string vs number)
          localStorage.setItem('selectedProfileId', initialProfileId);
      }
    }
    // Para ADMIN, o selectedProfileId já foi removido na limpeza inicial

    message.success(`Login bem-sucedido! Bem-vindo(a), ${userData.name || userData.email}!`);
    navigate(targetPath);
  };

  const onFinish = async (values) => {
    setLoading(true);

    // TENTATIVA 1: LOGIN COMO ADMINISTRADOR
    try {
      const adminResponse = await apiClient.post('/users/login', {
        email: values.email,
        password: values.password,
      });

      console.log('[Admin Login Attempt] Resposta da API:', adminResponse.data);

      // CORREÇÃO PRINCIPAL: Verificação mais direta e robusta (já estava boa)
      const responseData = adminResponse.data?.data;
      if (adminResponse.data?.status === 'success' && responseData?.user?.role === 'admin') {
        
        console.log('[Admin Login Attempt] Sucesso! Role "admin" detectada.');
        const { token, user } = responseData;

        // Chama a função de sucesso com os parâmetros corretos
        handleLoginSuccess(token, user, 'admin', '/admin/dashboard');
        setLoading(false);
        return; // ESSENCIAL: Impede a execução da tentativa de login de cliente
      }
      
    } catch (adminError) {
      // Se o erro NÃO for 401 ou 404, ele é um erro inesperado.
      // Se for 401/404, simplesmente ignoramos e deixamos o código continuar para a tentativa de cliente.
      if (!adminError.response || (adminError.response.status !== 401 && adminError.response.status !== 404)) {
        console.error('Erro inesperado no login de administrador:', adminError);
        message.error('Ocorreu um erro inesperado. Tente novamente.');
        setLoading(false);
        return;
      }
      console.log('[Admin Login Attempt] Falhou (401/404). Tentando como cliente...');
    }

    // TENTATIVA 2: LOGIN COMO CLIENTE
    try {
      const clientResponse = await apiClient.post('/auth/client/login', {
        identifier: values.email,
        password: values.password,
      });

      console.log('[Client Login Attempt] Resposta da API:', clientResponse.data);

      if (clientResponse.data?.status === 'success' && clientResponse.data?.data?.token) {
        console.log('[Client Login Attempt] Sucesso!');
        const { token, client, financialAccounts } = clientResponse.data.data;
        const clientData = { ...client, financialAccounts };
        handleLoginSuccess(token, clientData, 'client', '/painel');
      } else {
        // Se chegou aqui após a tentativa de admin falhar, a senha está errada para ambos.
        message.error(clientResponse.data?.message || 'E-mail ou senha inválidos.');
      }
    } catch (clientError) {
      console.error('Erro no login de cliente:', clientError);
      message.error('E-mail ou senha inválidos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    message.error('Por favor, preencha todos os campos corretamente.');
  };

  return (
    <Layout className="login-page-layout">
      <HeaderLP />
      <Content className="login-page-content">
        <div className="login-card-container">
          <Title level={2} className="login-title">
            Bem-vindo de Volta!
          </Title>
          <Paragraph className="login-subtitle">
            Acesse sua conta para continuar gerenciando tudo com o MAP no Controle.
          </Paragraph>

          <Form name="login_form" className="login-form" onFinish={onFinish} onFinishFailed={onFinishFailed} layout="vertical">
            <Form.Item name="email" label="E-mail" rules={[{ required: true, message: 'Por favor, insira seu e-mail!' }]}>
              <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="seuemail@exemplo.com" size="large" />
            </Form.Item>

            <Form.Item name="password" label="Senha" rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}>
              <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Sua senha" size="large" />
            </Form.Item>

            <Form.Item className="login-form-options-simplified">
              <Link className="login-form-forgot" to="/esqueci-senha">
                Esqueceu sua senha?
              </Link>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button" size="large" block loading={loading}>
                Entrar
              </Button>
            </Form.Item>

            <Paragraph className="login-register-prompt">
              Ainda não tem uma conta? <Link to="/planos">Conheça nossos planos!</Link>
            </Paragraph>
          </Form>
        </div>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default LoginPage;