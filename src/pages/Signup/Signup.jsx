// src/pages/Signup/Signup.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Typography, message, Spin, Card } from 'antd';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import CustomModal from '../../components/CustomModal/CustomModal'; // Importa o modal customizado
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

  // Estado para controlar o modal customizado
  const [modalState, setModalState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error',
    onOk: () => setModalState({ ...modalState, visible: false }),
    okText: 'Entendi',
    cancelText: null
  });

  useEffect(() => {
    if (plansInfo[planId]) {
      setPlan(plansInfo[planId]);
    } else {
      message.error("Plano inválido ou não encontrado. Redirecionando...");
      navigate('/planos');
    }
  }, [planId, navigate]);

  const affiliateCode = new URLSearchParams(location.search).get('ref');

  const onFinish = async (values) => {
    setLoading(true);
    message.loading({ content: 'Criando sua conta...', key: 'signup_process', duration: 15 });

    try {
      const registerResponse = await apiClient.post('/auth/client/register', { ...values, affiliateCode });
      
      const { token } = registerResponse.data.data;
      localStorage.setItem('authToken', token);
      
      message.success({ content: 'Conta criada! Gerando link de pagamento...', key: 'signup_process' });

      const checkoutResponse = await apiClient.post('/mercado-pago/checkout', { planId: parseInt(planId, 10) });
      
      if (checkoutResponse.data?.data?.checkoutUrl) {
        window.location.href = checkoutResponse.data.data.checkoutUrl;
      } else {
        throw new Error('Não foi possível gerar o link de pagamento.');
      }

    } catch (error) {
      message.destroy('signup_process'); // Remove a mensagem de loading
      const errorMessage = error.response?.data?.message || 'Ocorreu uma falha no cadastro. Por favor, tente novamente.';
      
      // Ativa o modal customizado com a mensagem de erro da API
      setModalState({
        visible: true,
        title: 'Erro no Cadastro',
        message: `${errorMessage}`,
        type: 'error',
        okText: 'Tentar Novamente',
        onOk: () => setModalState({ ...modalState, visible: false }),
      });
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

      <CustomModal
        visible={modalState.visible}
        onClose={() => setModalState({ ...modalState, visible: false })}
        onOk={modalState.onOk}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        okText={modalState.okText}
        cancelText={modalState.cancelText}
      />
    </>
  );
};

export default SignupPage;