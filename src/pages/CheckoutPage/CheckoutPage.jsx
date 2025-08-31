// src/pages/CheckoutPage/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { Layout, message, Spin, Card, Typography, Alert, Button, Input } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { CopyOutlined, QrcodeOutlined } from '@ant-design/icons';
import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './CheckoutPage.css';

const MERCADO_PAGO_PUBLIC_KEY =  'APP_USR-f75019f4-211d-4726-bd58-aa287194a3ee';


const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const plansInfo = {
  '1': { name: 'Básico Mensal', price: 39.90 },
  '2': { name: 'Básico Anual', price: 389.90 },
  '3': { name: 'Avançado Mensal', price: 79.90 },
  '4': { name: 'Avançado Anual', price: 789.90 },
};

const CheckoutPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Começa carregando
  const [plan, setPlan] = useState(null);
  const [pixData, setPixData] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
      message.error("Você precisa estar logado para acessar esta página.");
      navigate('/login');
      return;
    }

    if (plansInfo[planId]) {
      setPlan(plansInfo[planId]);
    } else {
      message.error("Plano inválido.");
      navigate('/planos');
    }
  }, [planId, navigate]);
  
  useEffect(() => {
    const createPixPayment = async () => {
      if (plan) {
        try {
          const response = await apiClient.post('/mercado-pago/create-pix-payment', { planId: parseInt(planId, 10) });
          setPixData(response.data.data);
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Falha ao gerar o código PIX.';
          message.error(errorMessage, 5);
          navigate('/planos');
        } finally {
          setLoading(false);
        }
      }
    };
    createPixPayment();
  }, [plan, planId, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.qrCode);
    message.success('Código PIX copiado para a área de transferência!');
  };

  return (
    <Layout className="checkout-page-layout">
      <HeaderLP />
      <Content className="checkout-page-content">
        <Card className="checkout-card-container">
          {loading && <div className="spinner-container"><Spin size="large" tip="Gerando seu PIX..." /></div>}
          
          {!loading && pixData && (
            <>
              <Title level={3} className="checkout-title">Pague com PIX para Ativar</Title>
              <div className="plan-summary">
                <Text className="plan-name">{plan.name}</Text>
                <Text className="plan-price">R$ {plan.price.toFixed(2).replace('.', ',')}</Text>
              </div>

              <div className="pix-instructions">
                <QrcodeOutlined style={{ fontSize: '24px', color: '#00bdae' }} />
                <Paragraph>1. Abra o app do seu banco e escolha a opção PIX.</Paragraph>
                <Paragraph>2. Escaneie o QR Code abaixo ou use o "Copia e Cola".</Paragraph>
              </div>

              <div className="qr-code-container">
                <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="PIX QR Code" />
              </div>
              
              <Input.Group compact style={{ marginTop: '20px' }}>
                <Input style={{ width: 'calc(100% - 130px)' }} defaultValue={pixData.qrCode} readOnly />
                <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy} style={{ width: '130px' }}>
                  Copiar Código
                </Button>
              </Input.Group>

              <Alert
                message="Aguardando Pagamento"
                description="Após o pagamento, seu acesso será liberado automaticamente. Você será redirecionado em breve."
                type="info"
                showIcon
                style={{ marginTop: '25px' }}
              />
            </>
          )}
        </Card>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default CheckoutPage;