// src/pages/AgendaCRMPage/AgendaCRMPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Row, Col, Card, List, Modal, Form, Input,
  Spin, Empty, Tag, message, Statistic, Tooltip, Input as AntdInput,
  Select, DatePicker, Steps, Space
} from 'antd';
import {
  PlusOutlined, AppstoreAddOutlined, UserAddOutlined, CalendarOutlined,
  TeamOutlined, ShareAltOutlined, CopyOutlined, WhatsAppOutlined, SettingOutlined,
  ClockCircleOutlined, CheckCircleOutlined, LoadingOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useProfile } from '../../contexts/ProfileContext';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import ptBR from 'antd/lib/locale/pt_BR';
import apiClient from '../../services/api';
import './AgendaCRMPage.css';
import { Link } from 'react-router-dom';
import ModalBusinessClientForm from '../../modals/ModalBusinessClientForm/ModalBusinessClientForm';
// Supondo que você tenha um modal para serviços também
// import ModalServiceForm from '../../modals/ModalServiceForm/ModalServiceForm';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const AgendaCRMPage = () => {
  const { currentProfile, currentProfileType } = useProfile();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    availabilityRules: [],
  });

  // Estados dos Modais
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [isAppointmentModalVisible, setIsAppointmentModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!currentProfile?.id || (currentProfileType !== 'PJ' && currentProfileType !== 'MEI')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [appointmentsRes, availabilityRes] = await Promise.all([
        apiClient.get(`/financial-accounts/${currentProfile.id}/appointments`, {
          params: { status: 'Scheduled,Confirmed', limit: 5, sortBy: 'eventDateTime', sortOrder: 'ASC' }
        }),
        apiClient.get(`/availability/${currentProfile.id}`)
      ]);
      
      setDashboardData({
        upcomingAppointments: appointmentsRes.data.data || [],
        availabilityRules: availabilityRes.data.data || [],
      });
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      message.error("Não foi possível carregar os dados do painel.");
    } finally {
      setLoading(false);
    }
  }, [currentProfile, currentProfileType]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const workRule = useMemo(() => dashboardData.availabilityRules.find(r => r.type === 'work'), [dashboardData.availabilityRules]);
  const breakRule = useMemo(() => dashboardData.availabilityRules.find(r => r.type === 'break'), [dashboardData.availabilityRules]);
  const daysOff = useMemo(() => dashboardData.availabilityRules.filter(r => r.type === 'day_off'), [dashboardData.availabilityRules]);

  const publicBookingLink = useMemo(() => {
    if (!currentProfile?.id) return '';
    return `${window.location.origin}/agendar/${currentProfile.id}`;
  }, [currentProfile?.id]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(publicBookingLink);
    message.success('Link copiado!');
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (loading) {
    return (
      <Content className="agenda-crm-loading-container">
        <Spin size="large" tip="Carregando seu Centro de Comando..." />
      </Content>
    );
  }

  if (currentProfileType !== 'PJ' && currentProfileType !== 'MEI') {
    return (
      <Content className="agenda-crm-page-wrapper">
        <Result
          status="warning"
          title="Funcionalidade Exclusiva para Perfis de Negócio"
          subTitle="O Centro de Comando de Agendamentos está disponível apenas para perfis PJ ou MEI."
        />
      </Content>
    );
  }

  return (
    <Content className="agenda-crm-page-wrapper">
      <motion.div variants={pageVariants} initial="initial" animate="animate">
        <div className="page-header-agenda-crm">
          <Title level={2} className="page-title-agenda-crm"><CalendarOutlined /> Centro de Comando</Title>
          <Paragraph className="page-subtitle-agenda-crm">Sua central de agendamentos, clientes e serviços.</Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {/* Coluna Principal */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="Atalhos Rápidos" className="quick-actions-card">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}><Button type="primary" icon={<PlusOutlined />} size="large" block onClick={() => setIsAppointmentModalVisible(true)}>Novo Agendamento</Button></Col>
                  <Col xs={24} sm={8}><Button icon={<UserAddOutlined />} size="large" block onClick={() => setIsClientModalVisible(true)}>Novo Cliente</Button></Col>
                  <Col xs={24} sm={8}><Button icon={<AppstoreAddOutlined />} size="large" block onClick={() => setIsServiceModalVisible(true)}>Novo Serviço</Button></Col>
                </Row>
              </Card>

              <Card title="Próximos Agendamentos">
                <List
                  itemLayout="horizontal"
                  dataSource={dashboardData.upcomingAppointments}
                  locale={{ emptyText: <Empty description="Nenhum agendamento futuro." /> }}
                  renderItem={item => {
                    const clientName = item.businessClients?.[0]?.name || 'Cliente';
                    return (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={<Link to="/painel/agenda-crm">{clientName} - {item.title}</Link>}
                          description={dayjs(item.eventDateTime).format('dddd, DD/MM/YYYY [às] HH:mm')}
                        />
                        <Tag color={item.status === 'Confirmed' ? 'success' : 'gold'}>{item.status}</Tag>
                      </List.Item>
                    )
                  }}
                />
              </Card>
            </Space>
          </Col>

          {/* Coluna Lateral */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="Minha Disponibilidade" bordered={false} className="availability-summary-card" extra={<Link to="/painel/configuracoes"><Button type="text" size="small" icon={<SettingOutlined/>}>Editar</Button></Link>}>
                {workRule ? (
                  <>
                    <Paragraph><ClockCircleOutlined /> <strong>Expediente:</strong> {workRule.startTime} - {workRule.endTime}</Paragraph>
                    {breakRule && <Paragraph><CoffeeOutlined /> <strong>Pausa:</strong> {breakRule.startTime} - {breakRule.endTime}</Paragraph>}
                    <Paragraph><CheckCircleOutlined /> <strong>Dias de Trabalho:</strong></Paragraph>
                    <Text>{workRule.rrule.replace('RRULE:FREQ=WEEKLY;BYDAY=', '')}</Text>
                  </>
                ) : <Empty description="Horários não configurados." />}
              </Card>

              <Card title="Divulgação" bordered={false} className="share-card">
                <Paragraph>Compartilhe sua página para receber agendamentos.</Paragraph>
                <Input.Group compact>
                    <Input style={{ width: 'calc(100% - 40px)' }} value={publicBookingLink} readOnly />
                    <Tooltip title="Copiar Link"><Button icon={<CopyOutlined />} onClick={handleCopyToClipboard} /></Tooltip>
                </Input.Group>
                <Button type="primary" icon={<WhatsAppOutlined />} block style={{marginTop: 12, backgroundColor: '#25D366', borderColor: '#25D366'}} href={`https://wa.me/?text=${encodeURIComponent(`Agende um horário comigo: ${publicBookingLink}`)}`} target="_blank">Compartilhar no WhatsApp</Button>
              </Card>
            </Space>
          </Col>
        </Row>
      </motion.div>

      {/* Modais */}
      <ModalBusinessClientForm open={isClientModalVisible} onCancel={() => setIsClientModalVisible(false)} onFinish={() => {setIsClientModalVisible(false); fetchDashboardData();}} />
      {/* Você precisará criar um ModalServiceForm similar ao de clientes */}
      <Modal title="Novo Serviço" open={isServiceModalVisible} onCancel={() => setIsServiceModalVisible(false)} footer={null}><Empty description="Modal de criação de serviço a ser implementado."/></Modal>
      <Modal title="Novo Agendamento" open={isAppointmentModalVisible} onCancel={() => setIsAppointmentModalVisible(false)} footer={null}><Empty description="Modal de agendamento em etapas a ser implementado."/></Modal>

    </Content>
  );
};

export default AgendaCRMPage;