// src/pages/SubscriptionSuccessPage/SubscriptionSuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Spin, Button, message, Result } from 'antd';
import { WhatsAppOutlined, CheckCircleOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './SubscriptionSuccessPage.css'; // Crie também um arquivo CSS para estilização

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const SubscriptionSuccessPage = () => {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("Sessão não encontrada. Por favor, faça login para verificar sua assinatura.");
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/client/me');
        if (response.data?.status === 'success' && response.data.data?.client) {
          setClientData(response.data.data.client);
        } else {
          throw new Error("Não foi possível carregar os dados do seu perfil.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Ocorreu um erro ao buscar seus dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const whatsAppNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '5571982862912';

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Verificando sua assinatura..." />
      </Layout>
    );
  }

  return (
    <Layout className="success-page-layout">
      <HeaderLP />
      <Content className="success-page-content">
        {error ? (
          <Result
            status="error"
            title="Falha na Verificação"
            subTitle={error}
            extra={[
              <Button type="primary" key="console" href="/login">
                Ir para o Login
              </Button>,
            ]}
          />
        ) : (
          <Card className="success-card-container">
            <CheckCircleOutlined className="success-icon" />
            <Title level={2} className="success-title">Assinatura Ativada!</Title>
            <Paragraph className="success-subtitle">
              Parabéns, {clientData?.name?.split(' ')[0] || 'Cliente'}! Sua jornada para o controle total começou.
            </Paragraph>

            <div className="affiliate-code-box">
              <Paragraph className="affiliate-label">Seu Código de Afiliado:</Paragraph>
              <Paragraph className="affiliate-code" copyable>{clientData?.affiliateCode || 'N/A'}</Paragraph>
              <Paragraph className="affiliate-description">
                Compartilhe este código com amigos e ganhe comissões a cada nova assinatura! 💰
              </Paragraph>
            </div>

            <Button
              type="primary"
              icon={<WhatsAppOutlined />}
              size="large"
              block
              className="whatsapp-button"
              href={`https://wa.me/${whatsAppNumber}?text=Oi!%20Acabei%20de%20ativar%20meu%20plano.`}
              target="_blank"
            >
              Iniciar Conversa no WhatsApp
            </Button>
            <Paragraph className="whatsapp-prompt">
              Clique no botão acima para me dar um "oi" e começar a usar o sistema agora mesmo!
            </Paragraph>
          </Card>
        )}
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default SubscriptionSuccessPage;