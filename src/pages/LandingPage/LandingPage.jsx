// src/pages/LandingPage/LandingPage.jsx
import React from 'react';
import { Layout } from 'antd';
import Header from '../../componentsLP/Header/Header';
import HeroSection from '../../componentsLP/HeroSection/HeroSection';
import FeaturesSection from '../../componentsLP/FeaturesSection/FeaturesSection';
import HowItWorksSection from '../../componentsLP/HowItWorksSection/HowItWorksSection';
import PricingSection from '../../componentsLP/PricingSection/PricingSection';
import FaqSection from '../../componentsLP/FaqSection/FaqSection'; // Importar
import ContactPromptSection from '../../componentsLP/ContactPromptSection/ContactPromptSection'; // Importar a nova seção
import BenefitsSection from '../../componentsLP/BenefitsSection/BenefitsSection'; // Importar a nova seção
import TargetAudienceSection from '../../componentsLP/TargetAudienceSection/TargetAudienceSection';
import GoogleCalendarSection from '../../componentsLP/GoogleCalendarSection/GoogleCalendarSection';
import WhatsAppIntegrationSection from '../../componentsLP/WhatsAppIntegrationSection/WhatsAppIntegrationSection';
import FooterLP from '../../componentsLP/FooterLP/FooterLP'; // Importar o FooterLP
import './LandingPage.css';

const { Content } = Layout;

const LandingPage = () => {
  return (
    <Layout className="landing-page-layout">
      <Header />
      <Content className="landing-page-main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <BenefitsSection /> {/* Adicionar a nova seção de benefícios aqui */}
        <TargetAudienceSection />
        < GoogleCalendarSection/>
        < WhatsAppIntegrationSection />
        {/* Outras seções da Landing Page virão aqui abaixo (ex: Depoimentos) */}
        <FaqSection /> {/* Adicionar a FaqSection aqui */}
        <ContactPromptSection /> {/* Adicionar a nova seção de contato aqui */}
        {/* Outras seções da Landing Page virão aqui abaixo (ex: Footer) */}
        <div>
        </div>
      </Content>
      <FooterLP /> {/* Adicionar o FooterLP aqui, fora do Content principal */}
    </Layout>
  );
};

export default LandingPage;