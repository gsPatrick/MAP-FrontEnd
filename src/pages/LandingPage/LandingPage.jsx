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
import AppointmentsSection from '../../componentsLP/AppointmentsSection/AppointmentsSection';
import ProductsStockSection from '../../componentsLP/ProductsStockSection/ProductsStockSection';
import MotivationalMessageSection from '../../componentsLP/MotivationalMessageSection/MotivationalMessageSection';
import WaterReminderSection from '../../componentsLP/WaterReminderSection/WaterReminderSection';

import TechSecuritySection from '../../componentsLP/TechSecuritySection/TechSecuritySection';
import WhyChooseMapSection from '../../componentsLP/WhyChooseMapSection/WhyChooseMapSection'; // <<< NOVO IMPORT
import BrandValuesSection from '../../componentsLP/BrandValuesSection/BrandValuesSection';
import DashboardSection from '../../componentsLP/DashboardSection/DashboardSection';
import AccountTypesSection from '../../componentsLP/AccountTypesSection/AccountTypesSection'; // <<< NOVO IMPORT
import ChecklistSection from '../../componentsLP/ChecklistSection/ChecklistSection'; // <<< ADICIONE ESTA LINHA
import DedicatedSupportSection from '../../componentsLP/DedicatedSupportSection/DedicatedSupportSection'; // <<< ADICIONE ESTA LINHA
import CreditCardSection from '../../componentsLP/CreditCardSection/CreditCardSection'; // <<< ADICIONE ESTA LINHA
import AffiliateSection from '../../componentsLP/AffiliateSection/AffiliateSection'; // <<< ADICIONE ESTA LINHA




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
        <AppointmentsSection />
        
        {/* Adicionando IDs para navegação do menu */}
        <div id="funcionalidades">
          <FeaturesSection />
        </div>
                <CreditCardSection /> {/* <<< ADICIONADO AQUI >>> */}

                          <TechSecuritySection />

        <HowItWorksSection />
                <ProductsStockSection /> 

        
        <div id="beneficios">
          <BenefitsSection />
        </div>

        <WhyChooseMapSection />


          <div id="sobre">
              <AboutCreatorSection />
          </div>


        
        <TargetAudienceSection />
                <AccountTypesSection /> {/* <<< ADICIONE A NOVA SEÇÃO AQUI >>> */}
        <ChecklistSection /> {/* <<< ADICIONADO A SEÇÃO CHECKLIST AQUI >>> */}

        <WhatsAppIntegrationSection />
                <DashboardSection />


        <div id="planos">
          <PricingSection />
        </div>
                <MotivationalMessageSection />

        <WaterReminderSection />
        <AffiliateSection /> {/* <<< ADICIONADO AQUI >>> */}


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
        <DedicatedSupportSection /> {/* <<< ADICIONADO AQUI, ENTRE FAQ E CONTATO */}
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