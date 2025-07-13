// src/modals/ModalNovoAgendamentoPJ/ModalNovoAgendamentoPJ.jsx
import React from 'react';
import { Modal, Typography, Card, Space, Row, Col } from 'antd';
import { TeamOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import './ModalNovoAgendamentoPJ.css';

const { Title, Paragraph } = Typography;

const ModalNovoAgendamentoPJ = ({ open, onCancel, onSelectClientFlow, onSelectServiceFlow }) => {
  return (
    <Modal
      title="Criar Novo Agendamento"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      className="modal-agendamento-pj-chooser"
    >
      <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: '30px' }}>
        Para qual finalidade é este agendamento? Escolha uma das opções abaixo para continuar.
      </Paragraph>
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Card hoverable className="chooser-card" onClick={onSelectClientFlow}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <TeamOutlined className="chooser-icon" />
              <Title level={4} className="chooser-title">Agendamento com Cliente</Title>
              <Paragraph className="chooser-description">
                Ideal para reuniões, consultas ou qualquer compromisso direto com um de seus clientes de negócio.
              </Paragraph>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card hoverable className="chooser-card" onClick={onSelectServiceFlow}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <AppstoreAddOutlined className="chooser-icon" />
              <Title level={4} className="chooser-title">Agendamento com Serviço</Title>
              <Paragraph className="chooser-description">
                Utilize para agendar a prestação de um ou mais serviços do seu catálogo para um cliente.
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default ModalNovoAgendamentoPJ;