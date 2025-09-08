// src/pages/ActivateAccountPage/ActivateAccountPage.jsx
import React, { useState } from 'react';
import { Layout, Form, Input, Button, Typography, message, Spin, Card, Steps } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { WhatsAppOutlined, KeyOutlined, CheckCircleOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './ActivateAccountPage.css'; // Criaremos este arquivo a seguir

const { Content } = Layout;
const { Title, Paragraph } = Typography;
const { Step } = Steps;

const ActivateAccountPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [phone, setPhone] = useState('');

  // Função para a primeira etapa: solicitar o código
  const handleRequestCode = async (values) => {
    setLoading(true);
    try {
      await apiClient.post('/auth/client/request-activation-code', { phone: values.phone });
      message.success('Código de ativação enviado para o seu WhatsApp! Verifique suas mensagens.');
      setPhone(values.phone); // Armazena o telefone para a próxima etapa
      setCurrentStep(1); // Avança para a etapa de verificação
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Falha ao solicitar o código. Verifique o número e tente novamente.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para a segunda etapa: verificar o código e definir a senha
  const handleSetPassword = async (values) => {
    setLoading(true);
    try {
      const payload = {
        phone: phone,
        code: values.code,
        newPassword: values.password,
        email: values.email, // Envia o email se o usuário preencher
        name: values.name,   // Envia o nome se o usuário preencher
      };
      
      const response = await clientAuthService.verifyCodeAndSetPassword(payload); // <<< CORREÇÃO AQUI
      
      const { token, client, message: successMessage } = response.data.data;

      // Salva o token e dados do usuário para fazer o login automático
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(client));
      localStorage.setItem('subscriptionStatus', 'active'); // Assume ativo, pois só usuários existentes usam isso

      message.success(successMessage || 'Conta ativada com sucesso! Redirecionando...');
      setCurrentStep(2); // Avança para a etapa de sucesso
      
      setTimeout(() => {
        navigate('/painel'); // Redireciona para o painel após o sucesso
      }, 2000);

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Falha ao ativar a conta. Verifique os dados e tente novamente.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form form={form} name="request_code_form" onFinish={handleRequestCode} layout="vertical">
            <Paragraph>Digite o número do WhatsApp que você usa com o nosso assistente. Enviaremos um código de 6 dígitos para confirmar sua identidade.</Paragraph>
            <Form.Item name="phone" label="Seu WhatsApp (com DDD)" rules={[{ required: true, message: 'Por favor, insira seu número de WhatsApp!' }]}>
              <Input prefix={<WhatsAppOutlined />} placeholder="Ex: 11987654321" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="activate-form-button" size="large" block loading={loading}>
                Enviar Código
              </Button>
            </Form.Item>
          </Form>
        );
      case 1:
        return (
          <Form form={form} name="set_password_form" onFinish={handleSetPassword} layout="vertical">
            <Paragraph>Ótimo! Agora, insira o código que enviamos para o seu WhatsApp e crie uma senha para acessar o painel.</Paragraph>
            <Form.Item name="code" label="Código de Verificação" rules={[{ required: true, message: 'Por favor, insira o código de 6 dígitos!' }]}>
              <Input prefix={<KeyOutlined />} placeholder="Código de 6 dígitos" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Crie uma Nova Senha" rules={[{ required: true, min: 6, message: 'A senha deve ter no mínimo 6 caracteres!' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Mínimo 6 caracteres" size="large" />
            </Form.Item>
            <Paragraph className="optional-fields-info">Os campos abaixo são opcionais. Se você já os cadastrou, não precisa preencher novamente.</Paragraph>
            <Form.Item name="email" label="Seu E-mail (Opcional)" rules={[{ type: 'email', message: 'Insira um e-mail válido!' }]}>
              <Input prefix={<MailOutlined />} placeholder="seu.email@exemplo.com" size="large" />
            </Form.Item>
            <Form.Item name="name" label="Seu Nome Completo (Opcional)">
              <Input prefix={<UserOutlined />} placeholder="Seu nome completo" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="activate-form-button" size="large" block loading={loading}>
                Ativar Conta e Entrar
              </Button>
            </Form.Item>
          </Form>
        );
      case 2:
        return (
          <div className="success-step">
            <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
            <Title level={3} style={{ marginTop: '24px' }}>Conta Ativada!</Title>
            <Paragraph>Tudo pronto! Estamos redirecionando você para o seu painel.</Paragraph>
            <Spin />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout className="activate-page-layout">
      <HeaderLP />
      <Content className="activate-page-content">
        <Card className="activate-card-container">
          <Title level={2} className="activate-title">Ativação de Conta</Title>
          <Steps current={currentStep} className="activate-steps">
            <Step title="Verificar WhatsApp" />
            <Step title="Definir Senha" />
            <Step title="Sucesso" />
          </Steps>
          <div className="step-content">
            {renderStepContent()}
          </div>
          <Paragraph className="login-prompt-activate">
            Já ativou sua conta? <Link to="/login">Faça Login</Link>
          </Paragraph>
        </Card>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default ActivateAccountPage;