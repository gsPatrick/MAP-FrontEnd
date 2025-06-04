// src/pages/LandingPage/LandingPage.jsx
import React from 'react';
import { Layout } from 'antd';
import Header from '../../componentsLP/Header/Header';
import HeroSection from '../../componentsLP/HeroSection/HeroSection';
import FeaturesSection from '../../componentsLP/FeaturesSection/FeaturesSection';
import HowItWorksSection from '../../componentsLP/HowItWorksSection/HowItWorksSection';
import PricingSection from '../../componentsLP/PricingSection/PricingSection';
import FaqSection from '../../componentsLP/FaqSection/FaqSection';
import ContactPromptSection from '../../componentsLP/ContactPromptSection/ContactPromptSection';
import BenefitsSection from '../../componentsLP/BenefitsSection/BenefitsSection';
import TargetAudienceSection from '../../componentsLP/TargetAudienceSection/TargetAudienceSection';
import GoogleCalendarSection from '../../componentsLP/GoogleCalendarSection/GoogleCalendarSection';
import WhatsAppIntegrationSection from '../../componentsLP/WhatsAppIntegrationSection/WhatsAppIntegrationSection';
import AboutCreatorSection from '../../componentsLP/AboutCreatorSection/AboutCreatorSection';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './LandingPage.css';

const { Content } = Layout;

const LandingPage = () => {
  return (
    <Layout className="landing-page-layout">
      <Header />
      <Content className="landing-page-main-content">
        {/* O HeroSection geralmente é o topo, não precisa de ID para navegação do menu, a menos que haja um link "Home" */}
        <HeroSection /> 
        
        <GoogleCalendarSection/>
        
        {/* Adicionando IDs para navegação do menu */}
        <div id="funcionalidades">
          <FeaturesSection />
        </div>
        
        <HowItWorksSection />


          <div id="sobre">
              <AboutCreatorSection />
          </div>
        
        <div id="beneficios">
          <BenefitsSection />
        </div>
        
        <TargetAudienceSection />
        <WhatsAppIntegrationSection />
        
        <div id="planos">
          <PricingSection />
        </div>

        {/* 
          Para o item de menu "Depoimentos" funcionar, 
          você precisaria de uma seção como a abaixo:
          <div id="depoimentos">
            <TestimonialsSection />  // Componente de depoimentos a ser criado
          </div>
        */}
        
        <div id="faq"> {/* Adicionado ID para a seção FAQ, caso queira linkar a ela */}
          <FaqSection />
        </div>
        
        <ContactPromptSection />
        
        {/* Espaço vazio mantido do original */}
        <div>
        </div>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default LandingPage;