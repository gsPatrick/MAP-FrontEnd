// src/pages/LoginPage/LoginPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Form, Input, Button, Typography, message, Card, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MailOutlined, LockOutlined, CreditCardOutlined, ArrowRightOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './LoginPage.css';
import apiClient from '../../services/api';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState(null);
  const [clientName, setClientName] = useState('');

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

    if (redirectPath) {
      navigate(redirectPath);
      message.success('Login bem-sucedido! Redirecionando...');
      return;
    }

    if (role === 'admin') {
      navigate('/admin/dashboard');
      message.success(`Login de administrador bem-sucedido! Bem-vindo(a), ${user.name}!`);
      return;
    }

    // Lógica para clientes
    if (subscriptionStatus === 'expired' || subscriptionStatus === 'free_tier' || client.status === 'Aguardando Pagamento') {
      if (latestPendingPlanId) {
        // Se tem um plano pendente, mostra a tela de pagamento obrigatório
        setPendingPlanId(latestPendingPlanId);
        setClientName(client.name || client.email);
        setPaymentPending(true);
        return;
      } else {
        // Se não tem plano pendente, redireciona para escolher um plano
        message.warning('Sua conta precisa de um plano ativo. Escolha um para continuar.');
        navigate('/planos'); // Redireciona para a página de planos dedicada
        return;
      }
    }

    // Se está tudo ok
    message.success(`Bem-vindo(a) de volta, ${client.name || client.email}!`);

    if (financialAccounts && financialAccounts.length > 0) {
      const profile = financialAccounts.find(a => a.isDefault) || financialAccounts.find(a => a.accountType === 'PF') || financialAccounts[0];
      localStorage.setItem('selectedProfileId', profile.id.toString());
    }

    navigate('/painel');

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

  const handleProceedToPayment = () => {
    if (pendingPlanId) {
      navigate(`/checkout/${pendingPlanId}`);
    } else {
      navigate('/planos');
    }
  };

  return (
    <Layout className="login-page-layout">
      <HeaderLP />
      <Content className="login-page-content">
        <div className="login-card-container">

          {!paymentPending ? (
            <>
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
                  Ainda não tem uma conta? <Link to="/planos">Conheça nossos planos!</Link>
                </Paragraph>
              </Form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CreditCardOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={3}>Pagamento Pendente</Title>
              <Paragraph>
                Olá, <strong>{clientName}</strong>! Identificamos que sua conta foi criada, mas o pagamento do seu plano ainda não foi confirmado.
              </Paragraph>
              <Paragraph type="secondary">
                Para liberar seu acesso completo ao painel, finalize sua assinatura agora mesmo.
              </Paragraph>

              <Space direction="vertical" style={{ width: '100%', marginTop: '20px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={handleProceedToPayment}
                  block
                  style={{ backgroundColor: '#389e0d', borderColor: '#389e0d' }}
                >
                  Realizar Pagamento Agora
                </Button>
                <Button type="link" onClick={() => setPaymentPending(false)}>
                  Voltar para Login
                </Button>
              </Space>
            </div>
          )}

        </div>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default LoginPage;