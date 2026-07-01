import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import Header from '../../componentsLP/Header/Header';
import PricingSection from '../../componentsLP/PricingSection/PricingSection';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import apiClient from '../../services/api';
import './Planos.css';

const { Content } = Layout;

const PlanosPage = () => {
  const location = useLocation();

  useEffect(() => {
    // Rastreia que o visitante chegou na página de planos (etapa do funil do afiliado).
    const ref = new URLSearchParams(location.search).get('ref') || localStorage.getItem('mapReferralCode');
    if (ref) {
      apiClient.post(`/affiliates/click/${ref}`, { stage: 'planos' }).catch(() => {});
    }
  }, [location.search]);

  return (
    <Layout className="planos-page-layout">
      <Header />
      <Content className="planos-page-main-content">
        {/* O único conteúdo desta página é a seção de planos */}
        <PricingSection />
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default PlanosPage;