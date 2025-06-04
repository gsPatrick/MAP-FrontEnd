// src/componentsLP/FeaturesSection/FeaturesSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Card, Typography, Tag } from 'antd';
import {
  WhatsAppOutlined,
  WalletOutlined,
  CreditCardOutlined,
  ScheduleOutlined,
  RetweetOutlined,
  AppstoreAddOutlined,
  BarChartOutlined,
  SlidersOutlined
} from '@ant-design/icons';
import './FeaturesSection.css'; // Certifique-se que o caminho está correto

const { Title, Paragraph } = Typography;

// Mantendo os dados, mas a cor será usada de forma diferente
const featuresData = [
  {
    icon: <WhatsAppOutlined />,
    title: 'Interação Inteligente via WhatsApp',
    description: 'Converse com seu assistente MAP como se fosse uma pessoa. Registre gastos, agende pagamentos e consulte saldos de forma natural e rápida.',
    // A cor pode ser usada para o ícone ou uma borda sutil
    highlightColor: 'var(--map-laranja)',
    tags: ['IA Conversacional', 'Praticidade', 'Agilidade']
  },
  {
    icon: <WalletOutlined />,
    title: 'Múltiplas Contas Financeiras',
    description: 'Organize suas finanças pessoais (PF), da sua empresa (PJ) ou MEI em perfis separados, mantendo tudo no seu devido lugar.',
    highlightColor: 'var(--map-dourado)',
    tags: ['Organização', 'Versatilidade', 'Controle PF/PJ']
  },
  {
    icon: <CreditCardOutlined />,
    title: 'Gestão Completa de Transações',
    description: 'Registre receitas, despesas, crie contas a pagar/receber e gerencie compras parceladas com geração automática de parcelas futuras.',
    highlightColor: 'var(--map-laranja-escuro)',
    tags: ['Detalhado', 'Parcelamentos', 'Categorização']
  },
  {
    icon: <ScheduleOutlined />,
    title: 'Agendamentos e Lembretes',
    description: 'Nunca mais esqueça um compromisso ou pagamento. Agende reuniões, consultas e receba lembretes automáticos de contas a vencer.',
    highlightColor: 'var(--map-dourado)',
    tags: ['Produtividade', 'Pontualidade', 'Automação']
  },
  {
    icon: <RetweetOutlined />,
    title: 'Recorrências Automatizadas',
    description: 'Configure despesas e receitas recorrentes. Escolha ser lembrado ou deixe o sistema criar a transação automaticamente.',
    highlightColor: 'var(--map-laranja)',
    tags: ['Conveniência', 'Previsibilidade', 'Economia de Tempo']
  },
  {
    icon: <AppstoreAddOutlined />,
    title: 'Produtos e Estoque (PJ/MEI)',
    description: 'Para seu negócio, cadastre produtos, controle entradas e saídas de estoque, defina estoque mínimo e receba alertas para reposição.',
    highlightColor: 'var(--map-laranja-escuro)',
    tags: ['Gestão de Negócios', 'Controle de Inventário', 'Eficiência']
  },
  // Vamos reduzir para 6 features para testar a poluição visual. Podem ser re-adicionadas depois.
  /*
  {
    icon: <BarChartOutlined />,
    title: 'Relatórios e Consultas Detalhadas',
    description: 'Acesse resumos financeiros, listagens de transações com filtros avançados e visualize o panorama completo da sua saúde financeira.',
    highlightColor: 'var(--map-dourado)',
    tags: ['Insights', 'Análise', 'Tomada de Decisão']
  },
  {
    icon: <SlidersOutlined />,
    title: 'Personalização e Inteligência',
    description: 'O MAP se adapta a você. Categorias personalizadas, IA que aprende suas preferências e um sistema que evolui com suas necessidades.',
    highlightColor: 'var(--map-laranja)',
    tags: ['Flexível', 'Inteligente', 'Adaptável']
  }
  */
];

const FeaturesSection = () => {
  useEffect(() => {
    const featureCards = document.querySelectorAll('.feature-card-item-refined');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Opcional: parar de observar após visível
        }
      });
    }, { threshold: 0.1 }); // 10% do item visível

    featureCards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.08}s`; // Reduzido o delay para ser mais rápido
      observer.observe(card);
    });

    // Para o título da seção
    const sectionTitle = document.querySelector('.features-main-title-refined');
    const sectionSubtitle = document.querySelector('.features-main-subtitle-refined');
    const titleObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('visible');
                titleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1});
    if(sectionTitle) titleObserver.observe(sectionTitle);
    if(sectionSubtitle) titleObserver.observe(sectionSubtitle);


    return () => { // Cleanup observer
      featureCards.forEach(card => observer.unobserve(card));
      if(sectionTitle) titleObserver.unobserve(sectionTitle);
      if(sectionSubtitle) titleObserver.unobserve(sectionSubtitle);
    };
  }, []);

  return (
    <div className="features-section-wrapper-refined">
      <div className="features-section-container-refined">
        <Title level={2} className="features-main-title-refined">
          Funcionalidades <span className="highlight-brand">Essenciais</span> para Seu Controle
        </Title>
        <Paragraph className="features-main-subtitle-refined" style={{transitionDelay: '0.1s'}}>
          Descubra como o MAP no Controle simplifica sua gestão com ferramentas inteligentes e intuitivas.
        </Paragraph>

        <Row gutter={[32, 32]} justify="center"> {/* Aumentado o gutter */}
          {featuresData.map((feature, index) => (
            <Col xs={24} sm={12} md={8} key={index} className="feature-card-item-refined">
              <Card
                hoverable
                className="feature-card-refined"
                bordered={false}
              >
                {/* Ícone agora diretamente no card, estilizado via CSS */}
                {React.cloneElement(feature.icon, {
                  className: 'feature-card-icon-refined',
                  style: { color: feature.highlightColor }
                })}
                <Title level={4} className="feature-card-title-refined">{feature.title}</Title>
                <Paragraph className="feature-card-description-refined">{feature.description}</Paragraph>
                <div className="feature-card-tags-refined">
                  {feature.tags.map(tag => <Tag key={tag} className="feature-tag-refined">{tag}</Tag>)}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default FeaturesSection;