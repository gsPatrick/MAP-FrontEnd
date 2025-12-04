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
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loginCard = document.querySelector('.login-card-container');
    if (loginCard) loginCard.classList.add('visible');
    document.body.classList.add('login-page-active');
    return () => { document.body.classList.remove('login-page-active'); };
  }, []);

  const handleLoginSuccess = useCallback((loginData) => {
    const { token, client, financialAccounts, subscriptionStatus, user, role, latestPendingPlanId } = loginData;

    localStorage.clear();
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userData', JSON.stringify(role === 'admin' ? user : client));
    localStorage.setItem('subscriptionStatus', subscriptionStatus || 'active');

    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect');
    let targetPath;

    if (redirectPath) {
      targetPath = redirectPath;
      message.success(`Login bem-sucedido! Redirecionando...`);
    } else if (role === 'admin') {
      targetPath = '/admin/dashboard';
      message.success(`Login de administrador bem-sucedido! Bem-vindo(a), ${user.name}!`);
    } else {
      if (subscriptionStatus === 'expired' || subscriptionStatus === 'free_tier') {
        if (latestPendingPlanId) {
          message.warning('Pagamento pendente identificado. Redirecionando para o pagamento...');
          targetPath = `/checkout/${latestPendingPlanId}`;
        } else {
          message.warning('Sua assinatura não está ativa! Por favor, renove para ter acesso completo.');
          targetPath = '/#planos';
        }
      } else if (client.status === 'Aguardando Pagamento') {
        if (latestPendingPlanId) {
          message.warning('Pagamento pendente identificado. Redirecionando para o pagamento...');
          targetPath = `/checkout/${latestPendingPlanId}`;
        } else {
          message.warning('Sua conta está aguardando pagamento. Escolha um plano para ativar.');
          targetPath = '/#planos';
        }
      } else {
        message.success(`Bem-vindo(a) de volta, ${client.name || client.email}!`);
        targetPath = '/painel';
      }
    }

    if (financialAccounts && financialAccounts.length > 0) {
      const profile = financialAccounts.find(a => a.isDefault) || financialAccounts.find(a => a.accountType === 'PF') || financialAccounts[0];
      localStorage.setItem('selectedProfileId', profile.id.toString());
    }

    navigate(targetPath);
  }, [navigate, location.search]);

  const onFinish = async (values) => {
    setLoading(true);
    const { identifier, password } = values;

    // Tenta primeiro o login de administrador (sempre com e-mail)
    try {
      const adminResponse = await apiClient.post('/users/login', { email: identifier, password });
      const { token, user } = adminResponse.data.data;
      handleLoginSuccess({ token, user, role: 'admin' });
      return;
    } catch (adminError) {
      if (adminError.response?.status !== 401 && adminError.response?.status !== 404) {
        console.error("Erro inesperado na tentativa de login de admin:", adminError);
        message.error("Ocorreu um erro no servidor. Tente novamente mais tarde.");
        setLoading(false);
        return;
      }
    }

    // Se o login de admin falhou, tenta o login de cliente
    try {
      // A API de cliente espera um 'identifier', que pode ser e-mail ou telefone.
      const clientResponse = await apiClient.post('/auth/client/login', { identifier, password });
      const { token, client, financialAccounts, subscriptionStatus, latestPendingPlanId } = clientResponse.data.data;
      handleLoginSuccess({ token, client, financialAccounts, subscriptionStatus, latestPendingPlanId, role: 'client' });
    } catch (clientError) {
      const errorMessage = clientError.response?.data?.message || 'Falha no login. Verifique seus dados.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

            <Form.Item name="identifier" label="E-mail ou Telefone" rules={[{ required: true, message: 'Por favor, insira seu e-mail ou telefone!' }]}>
              <Input prefix={<MailOutlined />} placeholder="seuemail@exemplo.com ou 5571..." size="large" />
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