// src/pages/RenewSubscriptionPage/RenewSubscriptionPage.jsx
import React from 'react';
import { Typography } from 'antd';
import PricingSection from '../../componentsLP/PricingSection/PricingSection'; // Reutiliza a seção de planos da Landing Page
import './RenewSubscriptionPage.css';

const { Title, Paragraph } = Typography;

const RenewSubscriptionPage = () => {
  return (
    <div className="renew-subscription-container">
      <div className="renew-header">
        <Title level={2} className="renew-title">Sua Assinatura Expirou</Title>
        <Paragraph className="renew-subtitle">
          Para continuar acessando todas as funcionalidades e manter suas finanças no controle,
          por favor, escolha um dos planos abaixo para renovar sua assinatura.
        </Paragraph>
      </div>
      
      {/* Reutilizamos o componente de preços da Landing Page, que já tem a lógica de renovação */}
      <div className="pricing-section-in-panel">
        <PricingSection />
      </div>
    </div>
  );
};

export default RenewSubscriptionPage;