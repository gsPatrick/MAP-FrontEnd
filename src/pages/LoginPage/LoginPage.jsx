// src/pages/LoginPage/LoginPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Form, Input, Button, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import CustomModal from '../../components/CustomModal/CustomModal'; // Importa o modal customizado
import './LoginPage.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Estado unificado para controlar o modal
  const [modalState, setModalState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error',
    okText: 'Entendi',
    cancelText: null,
    onOk: () => setModalState({ ...modalState, visible: false }),
  });

  useEffect(() => {
    const loginCard = document.querySelector('.login-card-container');
    if (loginCard) loginCard.classList.add('visible');
    document.body.classList.add('login-page-active');
    return () => { document.body.classList.remove('login-page-active'); };
  }, []);

  const handleLoginSuccess = useCallback((token, userData, userRole, targetPath) => {
    localStorage.clear();
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userData', JSON.stringify(userData));

    if (userRole === 'client') {
      const accounts = userData.financialAccounts || [];
      if (accounts.length > 0) {
        const profile = accounts.find(a => a.isDefault) || accounts.find(a => a.accountType === 'PF') || accounts[0];
        localStorage.setItem('selectedProfileId', profile.id.toString());
        targetPath = '/painel';
      } else {
        targetPath = '/painel/meu-perfil';
      }
    }
    message.success(`Bem-vindo(a) de volta, ${userData.name || userData.email}!`);
    navigate(targetPath);
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;

    try {
      // Tenta login de admin
      const adminResponse = await apiClient.post('/users/login', { email, password });
      if (adminResponse.data?.data?.user?.role === 'admin') {
        const { token, user } = adminResponse.data.data;
        handleLoginSuccess(token, user, 'admin', '/admin/dashboard');
        return;
      }
    } catch (adminError) {
      if (adminError.response?.status !== 401) {
        setLoading(false);
        return; 
      }
    }

    try {
      // Tenta login de cliente
      const clientResponse = await apiClient.post('/auth/client/login', { identifier: email, password });
      const { token, client, financialAccounts } = clientResponse.data.data;
      handleLoginSuccess(token, { ...client, financialAccounts }, 'client', '/painel');
    } catch (clientError) {
      const errorData = clientError.response?.data;
      const errorMessage = errorData?.message || 'Falha no login. Verifique seus dados.';

      // Ativa o modal para todos os cenários de erro do cliente
      if (errorData?.status === 'fail_subscription') {
        setModalState({
          visible: true,
          title: 'Assinatura Expirada',
          message: 'Sua assinatura expirou. Para reativar o acesso, por favor, renove seu plano.',
          type: 'warning',
          okText: 'Renovar Plano',
          cancelText: 'Fechar',
          onOk: () => {
            setModalState({ ...modalState, visible: false });
            navigate('/planos');
          },
        });
      } else {
        // Para QUALQUER OUTRO ERRO (senha incorreta, usuário não existe, etc.)
        setModalState({
          visible: true,
          title: 'Falha no Login',
          message: errorMessage,
          type: 'error',
          okText: 'Tentar Novamente',
          cancelText: null,
          onOk: () => setModalState({ ...modalState, visible: false }),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = () => {
    message.error('Por favor, preencha todos os campos corretamente.');
  };

  return (
    <>
      <Layout className="login-page-layout">
        <HeaderLP />
        <Content className="login-page-content">
          <div className="login-card-container">
            <Title level={2} className="login-title">Bem-vindo de Volta!</Title>
            <Paragraph className="login-subtitle">Acesse sua conta para continuar no controle.</Paragraph>
            <Form name="login_form" className="login-form" onFinish={onFinish} onFinishFailed={onFinishFailed} layout="vertical">
              <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email', message: 'Por favor, insira um e-mail válido!' }]}>
                <Input prefix={<MailOutlined />} placeholder="seuemail@exemplo.com" size="large" autoComplete="email" />
              </Form.Item>
              <Form.Item name="password" label="Senha" rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Sua senha" size="large" autoComplete="current-password" />
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
          </div>
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

export default LoginPage;