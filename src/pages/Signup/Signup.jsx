// src/pages/SignupPage/SignupPage.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Typography, message, Spin, Card } from 'antd';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './SignupPage.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const plansInfo = {
  '1': { name: 'Básico Mensal', price: 'R$ 39,90' },
  '2': { name: 'Básico Anual', price: 'R$ 389,90' },
  '3': { name: 'Avançado Mensal', price: 'R$ 79,90' },
  '4': { name: 'Avançado Anual', price: 'R$ 789,90' },
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (plansInfo[planId]) {
      setPlan(plansInfo[planId]);
    } else {
      message.error("Plano inválido ou não encontrado. Redirecionando...");
      navigate('/planos');
    }
  }, [planId, navigate]);

  const affiliateCode = new URLSearchParams(location.search).get('ref');

  // <<< MUDANÇA PRINCIPAL AQUI: FLUXO DE CADASTRO SIMPLIFICADO >>>
  const onFinish = async (values) => {
    setLoading(true);
    message.loading({ content: 'Criando sua conta e preparando pagamento...', key: 'signup_process' });

    const registrationData = {
        ...values,
        affiliateCode: affiliateCode || null, // Envia o código de afiliado se existir
    };

    try {
      // ETAPA 1: Chamar o novo endpoint de registro que já cria o usuário com senha
      const registerResponse = await apiClient.post('/auth/client/register', registrationData);

      if (registerResponse.data?.status !== 'success' || !registerResponse.data.data?.token) {
        throw new Error('Falha ao registrar e obter token de autenticação.');
      }
      
      const { token } = registerResponse.data.data;
      localStorage.setItem('authToken', token); // Armazena o token para a próxima requisição
      message.success({ content: 'Conta criada! Gerando seu link de pagamento...', key: 'signup_process' });

      // ETAPA 2: Gerar o link de checkout do Mercado Pago (agora com o token obtido)
      const checkoutResponse = await apiClient.post('/mercado-pago/checkout', {
        planId: parseInt(planId, 10),
      });

      if (checkoutResponse.data?.status === 'success' && checkoutResponse.data.data?.checkoutUrl) {
        // ETAPA 3: Redirecionar para o pagamento
        window.location.href = checkoutResponse.data.data.checkoutUrl;
      } else {
        throw new Error('Não foi possível gerar o link de pagamento.');
      }

    } catch (error) {
      // O interceptor do apiClient já deve exibir uma mensagem de erro vinda do backend
      console.error("Erro no fluxo de cadastro e assinatura:", error);
      // Garante que a mensagem de "loading" seja removida em caso de erro
      message.error({ content: error.response?.data?.message || 'Ocorreu um erro no cadastro.', key: 'signup_process' });
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  return (
    <Layout className="signup-page-layout">
      <HeaderLP />
      <Content className="signup-page-content">
        <Card className="signup-card-container">
          <Title level={2} className="signup-title">Crie sua Conta</Title>
          <Paragraph className="signup-subtitle">
            Você está a um passo de assinar o plano <span className="plan-highlight">{plan.name}</span> por <span className="plan-highlight">{plan.price}</span>.
          </Paragraph>

          <Form name="signup_form" onFinish={onFinish} layout="vertical">
            <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'Por favor, insira seu nome!' }]}>
              <Input prefix={<UserOutlined />} placeholder="Seu nome completo" size="large" />
            </Form.Item>
            <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email', message: 'Por favor, insira um e-mail válido!' }]}>
              <Input prefix={<MailOutlined />} placeholder="seu.email@exemplo.com" size="large" />
            </Form.Item>
            <Form.Item name="phone" label="WhatsApp (com DDD)" rules={[{ required: true, message: 'Por favor, insira seu WhatsApp!' }]}>
              <Input prefix={<PhoneOutlined />} placeholder="11987654321" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Crie uma Senha" rules={[{ required: true, min: 6, message: 'A senha deve ter no mínimo 6 caracteres!' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Mínimo 6 caracteres" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="signup-form-button" size="large" block loading={loading}>
                {loading ? 'Processando...' : 'Finalizar Assinatura e Pagar'}
              </Button>
            </Form.Item>
            <Paragraph className="login-prompt">
              Já tem uma conta? <Link to="/login">Faça Login</Link>
            </Paragraph>
          </Form>
        </Card>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default SignupPage;