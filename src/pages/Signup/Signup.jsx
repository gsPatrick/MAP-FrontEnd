// src/pages/Signup/Signup.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Typography, message, Spin, Card, Alert } from 'antd';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, GiftOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './SignupPage.css';
// <<< 1. IMPORTE A FUNÇÃO DE NORMALIZAÇÃO >>>
import { normalizePhoneNumberToCanonical } from '../../utils/phoneUtils';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const plansInfo = {
  '7': { name: 'Básico Mensal' },
  '8': { name: 'Básico Anual' },
  '9': { name: 'Avançado Mensal' },
  '10': { name: 'Avançado Anual' },
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [referrerInfo, setReferrerInfo] = useState(null);

  const affiliateCode = new URLSearchParams(location.search).get('ref');

  useEffect(() => {
    if (plansInfo[planId]) {
      setPlan(plansInfo[planId]);
    } else {
      message.error("Plano inválido ou não encontrado. Redirecionando...");
      navigate('/#planos');
    }

    const fetchReferrerInfo = async () => {
      if (affiliateCode) {
        try {
          const response = await apiClient.get(`/clients/affiliates/info/${affiliateCode}`);
          if (response.data.status === 'success') {
            setReferrerInfo(response.data.data);
          }
        } catch (error) {
          console.warn(`Código de afiliado "${affiliateCode}" não encontrado.`);
        }
      }
    };
    fetchReferrerInfo();

  }, [planId, navigate, affiliateCode]);

  const onFinish = async (values) => {
    setLoading(true);
    message.loading({ content: 'Criando sua conta...', key: 'signup_process', duration: 15 });

    try {
      // <<< 2. APLIQUE A FORMATAÇÃO ANTES DE ENVIAR >>>
      const formattedPhone = normalizePhoneNumberToCanonical(values.phone);
      if (!formattedPhone) {
        throw new Error('O número de telefone fornecido é inválido.');
      }
      
      const submissionData = {
        ...values,
        phone: formattedPhone, // Substitui o número original pelo formatado
      };

      // Envia os dados já formatados para a API
      const registerResponse = await apiClient.post('/auth/client/register', { ...submissionData, affiliateCode });
      
      const { token, client } = registerResponse.data.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(client));
      
      message.success({ content: 'Conta criada com sucesso!', key: 'signup_process' });

      navigate(`/cadastro-sucesso/${planId}`);

    } catch (error) {
      message.destroy('signup_process');
      const errorMessage = error.response?.data?.message || error.message || 'Ocorreu uma falha no cadastro. Por favor, tente novamente.';
      message.error(errorMessage, 5);
      console.error("Erro no fluxo de cadastro:", error);
    } finally {
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
    <>
      <Layout className="signup-page-layout">
        <HeaderLP />
        <Content className="signup-page-content">
          <Card className="signup-card-container">
            <Title level={2} className="signup-title">Crie sua Conta</Title>
            <Paragraph className="signup-subtitle">
              Você está a um passo de assinar o plano <span className="plan-highlight">{plan.name}</span>.
            </Paragraph>

            {referrerInfo && (
              <Alert
                message={<span>Você foi indicado(a) por <strong>{referrerInfo.name}</strong>!</span>}
                type="success"
                icon={<GiftOutlined />}
                showIcon
                className="referrer-alert"
              />
            )}

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
                  {loading ? 'Processando...' : 'Criar Conta e Ir para Pagamento'}
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
    </>
  );
};

export default SignupPage;