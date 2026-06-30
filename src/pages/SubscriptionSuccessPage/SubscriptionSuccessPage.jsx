// src/pages/SubscriptionSuccessPage/SubscriptionSuccessPage.jsx
// Tela exibida APÓS o pagamento: boas-vindas + link de afiliado + WhatsApp.
import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Button, Spin, message } from 'antd';
import { CheckCircleOutlined, WhatsAppOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './SubscriptionSuccessPage.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const SubscriptionSuccessPage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userJson = localStorage.getItem('userData');
        if (userJson) {
            setUserData(JSON.parse(userJson));
        } else {
            message.error("Sua sessão não foi encontrada. Por favor, faça login para continuar.");
            navigate('/login');
        }
        // Já passou pelo pagamento — limpa o plano pendente.
        localStorage.removeItem('pendingPlanId');
        setLoading(false);
    }, [navigate]);

    const affiliateLink = userData ? `${window.location.origin}/#planos?ref=${userData.affiliateCode}` : '';

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
            </Layout>
        );
    }

    return (
        <Layout className="success-page-layout">
            <HeaderLP />
            <Content className="success-page-content">
                <Card className="success-card-container">
                    <CheckCircleOutlined className="success-icon" />
                    <Title level={2} className="success-title">Pagamento confirmado! 🎉</Title>
                    <Paragraph className="success-subtitle">
                        Seu acesso está liberado. Bem-vindo(a) ao MAP no Controle!
                    </Paragraph>

                    {userData && userData.affiliateCode && (
                        <div className="affiliate-code-box">
                            <Paragraph className="affiliate-label">Seu Link de Afiliado:</Paragraph>
                            <Title level={4} className="affiliate-code" copyable={{ text: affiliateLink }}>
                                {userData.affiliateCode}
                            </Title>
                            <Paragraph className="affiliate-description">
                                Compartilhe este link e ganhe comissões a cada novo assinante!
                            </Paragraph>
                        </div>
                    )}

                    <Paragraph className="whatsapp-prompt">
                        Para começar a usar, me dá um "oi" no WhatsApp que eu te guio na configuração da sua conta! 👇
                    </Paragraph>
                    <Button
                        type="primary"
                        icon={<WhatsAppOutlined />}
                        size="large"
                        className="whatsapp-button"
                        href="https://wa.me/5521998597002"
                        target="_blank"
                    >
                        Iniciar Conversa no WhatsApp
                    </Button>

                    <div style={{ marginTop: 16 }}>
                        <Button
                            type="default"
                            icon={<DashboardOutlined />}
                            size="large"
                            onClick={() => navigate('/painel')}
                        >
                            Ir para o Painel
                        </Button>
                    </div>
                </Card>
            </Content>
            <FooterLP />
        </Layout>
    );
};

export default SubscriptionSuccessPage;
