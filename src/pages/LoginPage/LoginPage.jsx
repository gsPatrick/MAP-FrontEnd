// src/pages/LoginPage/LoginPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
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
    if (loginCard) loginCard.classList.add('visible');
    document.body.classList.add('login-page-active');
    return () => { document.body.classList.remove('login-page-active'); };
  }, []);
  
  const handleLoginSuccess = useCallback((loginData) => {
    const { token, client, financialAccounts, subscriptionStatus, user, role } = loginData;

    localStorage.clear();

    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userData', JSON.stringify(role === 'admin' ? user : client));
    localStorage.setItem('subscriptionStatus', subscriptionStatus || 'active');

    let targetPath;
    
    if (role === 'admin') {
        targetPath = '/admin/dashboard';
        message.success(`Login de administrador bem-sucedido! Bem-vindo(a), ${user.name}!`);
    } else {
      if (financialAccounts && financialAccounts.length > 0) {
        const profile = financialAccounts.find(a => a.isDefault) || financialAccounts.find(a => a.accountType === 'PF') || financialAccounts[0];
        localStorage.setItem('selectedProfileId', profile.id.toString());
      }
      
      // <<< LÓGICA DE REDIRECIONAMENTO CORRIGIDA >>>
      if (subscriptionStatus === 'expired' || subscriptionStatus === 'free_tier') {
        message.warning('Sua assinatura não está ativa! Por favor, renove para ter acesso completo.');
        targetPath = '/#planos'; // Redireciona para a seção de planos na landing page
      } else {
        message.success(`Bem-vindo(a) de volta, ${client.name || client.email}!`);
        targetPath = '/painel';
      }
    }
    
    navigate(targetPath);
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;

    try {
      const adminResponse = await apiClient.post('/users/login', { email, password });
      const { token, user } = adminResponse.data.data;
      handleLoginSuccess({ token, user, role: 'admin' });
      return;
    } catch (adminError) {
      if (adminError.response?.status !== 401 && adminError.response?.status !== 404) {
        setLoading(false);
        return; 
      }
    }

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
            <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email' }]}>
              <Input prefix={<MailOutlined />} placeholder="seuemail@exemplo.com" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Senha" rules={[{ required: true }]}>
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