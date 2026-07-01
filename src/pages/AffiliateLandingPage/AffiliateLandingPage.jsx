// src/pages/AffiliateLandingPage/AffiliateLandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Card, Typography, Button, Spin, Result, Avatar, message } from 'antd';
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './AffiliateLandingPage.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const AffiliateLandingPage = () => {
  const navigate = useNavigate();
  const { affiliateCode } = useParams();
  const location = useLocation();
  const planId = new URLSearchParams(location.search).get('plano');
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!affiliateCode) {
      message.error("Link de indicação inválido.");
      navigate('/');
      return;
    }

    const fetchReferrerInfo = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/clients/affiliates/info/${affiliateCode}`);
        if (response.data.status === 'success') {
          setReferrerInfo(response.data.data);
          // Persiste o código para uso posterior no checkout
          localStorage.setItem('mapReferralCode', affiliateCode);

          // Registra o clique na API (Silenciosamente). Se for link de plano
          // específico, já registra o plano/etapa.
          apiClient.post(`/affiliates/click/${affiliateCode}`, planId ? { planId, stage: 'checkout' } : { stage: 'link' }).catch(err => {
            console.warn("Erro ao registrar clique:", err);
          });
        } else {
          setError('Não foi possível encontrar quem te indicou. O código pode ser inválido.');
        }
      } catch (err) {
        setError('O código de indicação fornecido é inválido ou expirou. Por favor, verifique o link.');
        console.error("Erro ao buscar informações do afiliado:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrerInfo();
  }, [affiliateCode, navigate, planId]);

  const handleProceed = () => {
    // Link de plano específico -> vai direto pro checkout desse plano; senão, planos.
    if (planId) {
      navigate(`/assinar/${planId}?ref=${affiliateCode}`);
    } else {
      navigate(`/planos?ref=${affiliateCode}`);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Spin size="large" />;
    }

    if (error) {
      return (
        <Result
          status="error"
          title="Link de Indicação Inválido"
          subTitle={error}
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              Voltar para a Página Inicial
            </Button>
          }
        />
      );
    }

    if (referrerInfo) {
      return (
        <Card className="affiliate-card-container">
          <Avatar size={80} icon={<UserOutlined />} className="affiliate-avatar" />
          <Title level={2} className="affiliate-title">Você foi convidado(a)!</Title>
          <Paragraph className="affiliate-description">
            Você recebeu um convite especial de <strong className="referrer-name">{referrerInfo.name}</strong> para conhecer o MAP no Controle.
          </Paragraph>
          <Paragraph className="affiliate-subtitle">
            Dê o próximo passo para organizar sua vida financeira e profissional.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            className="affiliate-cta-button"
            onClick={handleProceed}
            icon={<ArrowRightOutlined />}
          >
            {planId ? 'Continuar para a assinatura' : 'Ver Planos e Continuar'}
          </Button>
        </Card>
      );
    }

    return null; // Caso de fallback
  };

  return (
    <Layout className="affiliate-page-layout">
      <HeaderLP />
      <Content className="affiliate-page-content">
        {renderContent()}
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default AffiliateLandingPage;