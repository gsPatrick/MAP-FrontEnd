// src/componentsLP/DualAccountSection/DualAccountSection.jsx - VERSÃO BRANCA E ARQUITETÔNICA
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  HomeOutlined,
  HeartOutlined,
  WalletOutlined,
  LineChartOutlined,
  TeamOutlined,
  DropboxOutlined,
  CheckCircleOutlined,
  SwapOutlined
} from '@ant-design/icons';
import './AccountTypesSection.css'; // Usará o novo CSS

const { Title, Paragraph } = Typography;

const DualAccountSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const currentSection = sectionRef.current;
    if (!currentSection) return;

    // Observer para animar elementos ao entrar na tela
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          currentSection.classList.add('in-view');
        }
      });
    }, { threshold: 0.25 });

    observer.observe(currentSection);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} id="dual-accounts" className="dual-arch-section-wrapper section-padding-large">
      <div className="section-container dual-arch-container">
        {/* --- Header da Seção --- */}
        <Row justify="center" className="dual-arch-header-row">
          <Col xs={24} md={20} lg={18} className="dual-arch-header-content">
            <div className="dual-arch-title-wrapper">
                <Title level={2} className="dual-arch-main-title">
                Projetado para <span className="highlight-arch-text">Sua Vida</span>.
                </Title>
                <Title level={2} className="dual-arch-main-title">
                Estruturado para <span className="highlight-arch-text">Seu Negócio</span>.
                </Title>
            </div>
            <Paragraph className="dual-arch-main-subtitle">
              O MAP constrói a ponte entre seus objetivos pessoais e o sucesso empresarial, oferecendo ferramentas dedicadas para cada faceta da sua vida, com a clareza e o controle que você merece.
            </Paragraph>
          </Col>
        </Row>

        {/* --- Elemento Visual Central --- */}
        <div className="dual-arch-centerpiece">
            <div className="central-core-wrapper">
                <div className="core-node personal-core">
                    <UserOutlined />
                    <span>PESSOAL</span>
                </div>
                <div className="core-connector">
                    <SwapOutlined className="connector-icon"/>
                </div>
                <div className="core-node business-core">
                    <ShopOutlined />
                    <span>NEGÓCIO</span>
                </div>
            </div>

            {/* --- Painel Pessoal (PF) --- */}
            <div className="glass-panel-wrapper personal-panel-pos">
                <div className="glass-panel personal-panel">
                    <div className="panel-header">
                        <Title level={4} className="panel-title">Seu Universo Pessoal</Title>
                        <Paragraph className="panel-subtitle">Organização e bem-estar para o seu dia a dia.</Paragraph>
                    </div>
                    <div className="panel-content">
                        <div className="panel-feature-item">
                            <HomeOutlined className="panel-feature-icon" />
                            <div>
                                <strong>Orçamento Familiar Inteligente</strong>
                                <p>Controle contas de casa, assinaturas e despesas variáveis com categorias personalizadas.</p>
                            </div>
                        </div>
                         <div className="panel-feature-item">
                            <WalletOutlined className="panel-feature-icon" />
                            <div>
                                <strong>Gestão de Cartões e Contas</strong>
                                <p>Visualize todos os seus saldos e faturas em um só lugar, evitando surpresas no fim do mês.</p>
                            </div>
                        </div>
                         <div className="panel-feature-item">
                            <HeartOutlined className="panel-feature-icon" />
                            <div>
                                <strong>Planejamento de Metas</strong>
                                <p>Defina objetivos, como uma viagem ou a compra de um bem, e acompanhe seu progresso.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Painel Empresarial (PJ) --- */}
            <div className="glass-panel-wrapper business-panel-pos">
                <div className="glass-panel business-panel">
                     <div className="panel-header">
                        <Title level={4} className="panel-title">Sua Central de Negócios</Title>
                        <Paragraph className="panel-subtitle">Ferramentas de gestão para impulsionar seus resultados.</Paragraph>
                    </div>
                    <div className="panel-content">
                        <div className="panel-feature-item">
                            <LineChartOutlined className="panel-feature-icon" />
                            <div>
                                <strong>Fluxo de Caixa e Projeções</strong>
                                <p>Acompanhe entradas, saídas e visualize a saúde financeira da sua empresa com relatórios claros.</p>
                            </div>
                        </div>
                         <div className="panel-feature-item">
                            <TeamOutlined className="panel-feature-icon" />
                            <div>
                                <strong>Base de Clientes (CRM)</strong>
                                <p>Cadastre seus clientes, associe-os a agendamentos e mantenha um histórico de interações.</p>
                            </div>
                        </div>
                         <div className="panel-feature-item">
                            <DropboxOutlined className="panel-feature-icon" />
                            <div>
                                <strong>Controle de Estoque Preciso</strong>
                                <p>Gerencie produtos, registre movimentações e receba alertas para nunca perder uma venda.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DualAccountSection;