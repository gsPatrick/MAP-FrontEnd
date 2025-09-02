// src/pages/SubscriptionSuccessPage/SubscriptionSuccessPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Card, Typography, Button, Spin, message } from 'antd';
import { CheckCircleOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './SubscriptionSuccessPage.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const SubscriptionSuccessPage = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const userJson = localStorage.getItem('userData');
        if (userJson) {
            setUserData(JSON.parse(userJson));
        } else {
            message.error("Sua sessão não foi encontrada. Por favor, faça login para continuar.");
            navigate('/login');
        }
        setLoading(false);
    }, [navigate]);

    const handleCheckout = useCallback(async () => {
        try {
            const checkoutResponse = await apiClient.post('/mercado-pago/checkout', { planId: parseInt(planId, 10) });
            
            // <<< CORREÇÃO PRINCIPAL AQUI >>>
            // Alterado de 'checkoutUrl' para 'init_point' para corresponder à resposta da API do Mercado Pago.
            if (checkoutResponse.data?.data?.init_point) {
                window.location.href = checkoutResponse.data.data.init_point;
            } else {
                throw new Error('Link de pagamento (init_point) não foi encontrado na resposta.');
            }
        } catch (error) {
            message.error('Falha ao redirecionar para o pagamento. Por favor, contate o suporte.', 10);
            console.error("Erro ao gerar checkout:", error);
        }
    }, [planId]);

    useEffect(() => {
        if (!loading && userData) {
            if (countdown === 0) {
                handleCheckout();
                return;
            }

            const timer = setInterval(() => {
                setCountdown((prevCountdown) => prevCountdown - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [loading, userData, countdown, handleCheckout]);

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
                    <Title level={2} className="success-title">Conta Criada com Sucesso!</Title>
                    <Paragraph className="success-subtitle">
                        Estamos preparando tudo para você.
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
                    
                    <Paragraph className="redirect-countdown">
                        Redirecionando para o pagamento em <strong>{countdown}...</strong>
                    </Paragraph>

                    <Paragraph className="whatsapp-prompt">
                        Enquanto isso, que tal já me dar um "oi" no WhatsApp para começarmos?
                    </Paragraph>
                    <Button 
                        type="primary" 
                        icon={<WhatsAppOutlined />} 
                        size="large" 
                        className="whatsapp-button"
                        href="https://wa.me/5571982862912"
                        target="_blank"
                    >
                        Iniciar Conversa
                    </Button>
                </Card>
            </Content>
            <FooterLP />
        </Layout>
    );
};

export default SubscriptionSuccessPage;