// src/componentsLP/ProductsStockSection/ProductsStockSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Typography, Card } from 'antd';
import {
  AppstoreAddOutlined, // Ícone principal
  DropboxOutlined, // Cadastro de Produtos
  StockOutlined, // Movimentação
  AlertOutlined, // Alertas de Estoque
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningFilled
} from '@ant-design/icons';
import './ProductsStockSection.css'; // Usaremos um CSS novo e mais detalhado

const { Title, Paragraph } = Typography;

const ProductsStockSection = () => {
  useEffect(() => {
    const elementsToAnimate = document.querySelectorAll('.products-stock-detailed-section .animate-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    elementsToAnimate.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div id="estoque" className="products-stock-detailed-section section-padding-large">
      <div className="background-grid-pattern-detailed"></div>

      <div className="section-container products-stock-detailed-container">
        <Row gutter={[48, 48]} align="middle">
          {/* --- COLUNA ESQUERDA: TEXTO E FEATURES --- */}
          <Col xs={24} lg={11} className="products-stock-text-col">
            <div className="products-stock-icon-container-detailed animate-on-scroll">
              <div className="products-stock-icon-glow-detailed"></div>
              <AppstoreAddOutlined className="products-stock-central-icon-detailed" />
            </div>
            <Title level={2} className="products-stock-main-title-detailed animate-on-scroll" style={{animationDelay: '0.1s'}}>
              Do cadastro ao balanço, seu inventário <span className="highlight-brand-orange">sem complicações.</span>
            </Title>
            <Paragraph className="products-stock-main-subtitle-detailed animate-on-scroll" style={{animationDelay: '0.2s'}}>
              Para seu negócio (MEI/PJ), oferecemos um controle de estoque preciso e integrado, projetado para ser simples, mas poderoso.
            </Paragraph>

            <div className="features-list-detailed">
              <div className="feature-item-detailed animate-on-scroll" style={{animationDelay: '0.3s'}}>
                <div className="feature-icon-wrapper-detailed"><DropboxOutlined /></div>
                <div>
                  <Title level={4} className="feature-title-detailed">Cadastro Rápido de Produtos</Title>
                  <Paragraph className="feature-text-detailed">Adicione produtos com informações essenciais como nome, preço de venda, código e unidade de medida.</Paragraph>
                </div>
              </div>
              <div className="feature-item-detailed animate-on-scroll" style={{animationDelay: '0.4s'}}>
                <div className="feature-icon-wrapper-detailed"><StockOutlined /></div>
                <div>
                  <Title level={4} className="feature-title-detailed">Histórico de Movimentações</Title>
                  <Paragraph className="feature-text-detailed">Cada entrada ou saída é registrada, criando um histórico confiável para você acompanhar o fluxo dos seus produtos.</Paragraph>
                </div>
              </div>
               <div className="feature-item-detailed animate-on-scroll" style={{animationDelay: '0.5s'}}>
                <div className="feature-icon-wrapper-detailed"><AlertOutlined /></div>
                <div>
                  <Title level={4} className="feature-title-detailed">Alertas Inteligentes</Title>
                  <Paragraph className="feature-text-detailed">Defina um estoque mínimo e receba notificações automáticas para não perder vendas por falta de mercadoria.</Paragraph>
                </div>
              </div>
            </div>
          </Col>

          {/* --- COLUNA DIREITA: MOCKUP VISUAL DETALHADO --- */}
          <Col xs={24} lg={13} className="products-stock-visual-col">
            <div className="visual-mockup-wrapper animate-on-scroll" style={{animationDelay: '0.25s'}}>
                {/* CARD DE PRODUTO 1 */}
                <Card className="mockup-product-card card-product-1">
                    <div className="product-card-header">
                        <Title level={5}>Bolo de Chocolate (Un)</Title>
                        <div className="product-card-stock good">15 em estoque</div>
                    </div>
                    <Paragraph className="product-card-price">Preço Venda: R$ 85,00</Paragraph>
                    <div className="product-card-movements">
                        <div className="movement-item in"><ArrowUpOutlined /> Compra de insumos (+5)</div>
                        <div className="movement-item out"><ArrowDownOutlined /> Venda balcão (-2)</div>
                    </div>
                </Card>

                {/* CARD DE PRODUTO 2 - ESTOQUE BAIXO */}
                 <Card className="mockup-product-card card-product-2">
                    <div className="product-card-header">
                        <Title level={5}>Café Especial (Pacote 250g)</Title>
                        <div className="product-card-stock low"><WarningFilled /> 3 em estoque</div>
                    </div>
                    <Paragraph className="product-card-price">Preço Venda: R$ 28,50</Paragraph>
                    <div className="product-card-movements">
                        <Paragraph className="movement-alert-text">Estoque mínimo: 5. Reposição recomendada!</Paragraph>
                    </div>
                </Card>

                 {/* CARD DE SERVIÇO */}
                 <Card className="mockup-product-card card-service-3">
                    <div className="product-card-header">
                        <Title level={5}>Consultoria (Hora)</Title>
                        <div className="product-card-stock service">Serviço</div>
                    </div>
                    <Paragraph className="product-card-price">Preço Venda: R$ 250,00</Paragraph>
                    <Paragraph className="product-card-desc">Não possui controle de estoque.</Paragraph>
                </Card>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProductsStockSection;