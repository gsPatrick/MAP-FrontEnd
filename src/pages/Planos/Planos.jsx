import React from 'react';
import { Layout } from 'antd';
import Header from '../../componentsLP/Header/Header';
import PricingSection from '../../componentsLP/PricingSection/PricingSection';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './Planos.css';

const { Content } = Layout;

const PlanosPage = () => {
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