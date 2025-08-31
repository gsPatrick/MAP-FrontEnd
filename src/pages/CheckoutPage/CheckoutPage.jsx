// src/pages/CheckoutPage/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { Layout, message, Spin, Card, Typography, Alert } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './CheckoutPage.css'; // Vamos criar este arquivo de estilo a seguir

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

// Coloque sua Public Key de PRODUÇÃO aqui, vinda do .env
const MERCADO_PAGO_PUBLIC_KEY =  'APP_USR-f75019f4-211d-4726-bd58-aa287194a3ee';

const plansInfo = {
  '1': { name: 'Básico Mensal', price: 39.90 },
  '2': { name: 'Básico Anual', price: 389.90 },
  '3': { name: 'Avançado Mensal', price: 79.90 },
  '4': { name: 'Avançado Anual', price: 789.90 },
};

const CheckoutPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [mp, setMp] = useState(null);
  const [isBrickReady, setIsBrickReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
        message.error("Você precisa estar logado para acessar esta página.");
        navigate('/login');
        return;
    }

    if (plansInfo[planId]) {
      setPlan(plansInfo[planId]);
      if (window.MercadoPago) {
        const mercadoPago = new window.MercadoPago(MERCADO_PAGO_PUBLIC_KEY);
        setMp(mercadoPago);
      } else {
        message.error("Não foi possível carregar o SDK de pagamento. Tente recarregar a página.");
      }
    } else {
      message.error("Plano inválido.");
      navigate('/planos');
    }
  }, [planId, navigate]);
  
  useEffect(() => {
    if (mp && plan) {
      const renderCardPaymentBrick = async () => {
        // Garante que o container está limpo antes de renderizar
        const container = document.getElementById('cardPaymentBrick_container');
        if (container) container.innerHTML = '';
        
        const bricksBuilder = mp.bricks();
        await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', {
          initialization: {
            amount: plan.price,
            payer: {
              // Você pode pré-preencher o email do usuário logado aqui
              email: JSON.parse(localStorage.getItem('userData'))?.email || '',
            },
          },
          customization: {
            visual: {
              style: {
                theme: 'bootstrap',
              }
            }
          },
          callbacks: {
            onReady: () => {
              setIsBrickReady(true);
            },
            onSubmit: async (cardFormData) => {
              setLoading(true);
              message.loading({ content: 'Processando seu pagamento...', key: 'payment_process' });
              
              try {
                const finalPayload = { ...cardFormData, planId: parseInt(planId, 10) };
                
                const response = await apiClient.post('/mercado-pago/process-payment', finalPayload);
                
                if (response.data.status === 'success') {
                  message.success({ content: 'Pagamento aprovado! Redirecionando...', key: 'payment_process' });
                  // Limpa o status da assinatura para forçar a revalidação no ProtectedRoute
                  localStorage.removeItem('subscriptionStatus');
                  navigate('/assinatura/sucesso');
                }
              } catch (error) {
                const errorMessage = error.response?.data?.message || 'Falha no pagamento. Verifique os dados e tente novamente.';
                message.error({ content: errorMessage, key: 'payment_process', duration: 5 });
                setLoading(false);
              }
            },
            onError: (error) => {
              console.error("Erro no Brick:", error);
              message.error('Ocorreu um erro. Verifique os dados do seu cartão.');
            },
          },
        });
      };
      renderCardPaymentBrick();
    }
  }, [mp, plan, planId, navigate]);

  if (!plan) return <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></Layout>;

  return (
    <Layout className="checkout-page-layout">
      <HeaderLP />
      <Content className="checkout-page-content">
        <Card className="checkout-card-container">
          <Spin spinning={loading} tip="Finalizando...">
            <Title level={3} className="checkout-title">Finalizar Assinatura</Title>
            <div className="plan-summary">
              <Text className="plan-name">{plan.name}</Text>
              <Text className="plan-price">R$ {plan.price.toFixed(2).replace('.', ',')}</Text>
            </div>
            
            {!isBrickReady && <Spin tip="Carregando formulário de pagamento..."/>}

            {/* O Brick do Mercado Pago será renderizado aqui */}
            <div id="cardPaymentBrick_container" style={{ opacity: isBrickReady ? 1 : 0, transition: 'opacity 0.5s ease-in' }}></div>

            <Alert
              message="Ambiente 100% Seguro"
              description="Seus dados são criptografados e processados diretamente pelo Mercado Pago."
              type="success"
              showIcon
              style={{ marginTop: '20px' }}
            />
          </Spin>
        </Card>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default CheckoutPage;s