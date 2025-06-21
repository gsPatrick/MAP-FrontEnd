// src/pages/BusinessClientsPage/BusinessClientsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, List, Card, Space, Tooltip, Popconfirm, message,
  Row, Col, Empty, Spin, Avatar, Result, Timeline, Tag, Statistic, Divider, Dropdown, Menu, Modal, Input
} from 'antd';
import {
  UserOutlined, PhoneOutlined, MailOutlined, EditOutlined, DeleteOutlined,
  UserAddOutlined, TeamOutlined, WhatsAppOutlined, CalendarOutlined,
  DollarCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined,
  StopOutlined, DownOutlined, MessageOutlined, SendOutlined, LikeOutlined, CloseCircleOutlined, AppstoreOutlined
} from '@ant-design/icons';
import ptBR from 'antd/lib/locale/pt_BR';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';
import ModalBusinessClientForm from '../../modals/ModalBusinessClientForm/ModalBusinessClientForm';

import './BusinessClientsPage.css';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const NextAppointmentCard = ({ appointment, onAction, onWhatsAppClick }) => {
  if (!appointment) return null;

  const totalValue = appointment.services.reduce((sum, s) => sum + parseFloat(s.price), 0);
  const formattedDate = dayjs(appointment.eventDateTime).format('ddd, DD/MM/YYYY [às] HH:mm');
  
  const statusMap = {
    Scheduled: { text: 'Aguardando Confirmação', color: 'processing', icon: <ClockCircleOutlined /> },
    Confirmed: { text: 'Confirmado', color: 'success', icon: <CheckCircleOutlined /> },
  };
  const currentStatus = statusMap[appointment.status] || { text: appointment.status, color: 'default' };

  return (
    <Card bordered className="next-appointment-card">
      <div className="next-appointment-content">
        <div className="appointment-info-section">
          <Text type="secondary" style={{ fontWeight: 500, display: 'block' }}>PRÓXIMO AGENDAMENTO</Text>
          <Title level={4} style={{ marginTop: 4, marginBottom: 8 }}>
            <CalendarOutlined /> {formattedDate}
          </Title>
          <Tag icon={currentStatus.icon} color={currentStatus.color} style={{ marginBottom: 16 }}>
            {currentStatus.text}
          </Tag>
          <List
            size="small"
            dataSource={appointment.services}
            renderItem={service => (
              <List.Item style={{ padding: '4px 0', border: 'none' }}>
                <Text><AppstoreOutlined style={{ marginRight: 8, color: 'var(--map-dourado)' }} />{service.name}</Text>
                <Text type="secondary">R$ {parseFloat(service.price).toFixed(2).replace('.', ',')}</Text>
              </List.Item>
            )}
            footer={
              <div style={{ textAlign: 'right', paddingTop: 8, borderTop: '1px solid #e8e8e8' }}>
                <Text strong>Total: R$ {totalValue.toFixed(2).replace('.', ',')}</Text>
              </div>
            }
          />
        </div>
        <div className="appointment-actions-section">
            {appointment.status === 'Scheduled' && (
                <Button icon={<LikeOutlined />} onClick={() => onAction('confirm', appointment.id)} block>
                    Confirmar Agendamento
                </Button>
            )}
            {appointment.status === 'Confirmed' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onAction('complete', appointment.id)} block>
                    Concluir Atendimento
                </Button>
            )}
            <Popconfirm
                title="Deseja cancelar este agendamento?"
                onConfirm={() => onAction('cancel', appointment.id)}
                okText="Sim, Cancelar"
                cancelText="Não"
            >
                <Button danger icon={<CloseCircleOutlined />} block>
                    Cancelar Agendamento
                </Button>
            </Popconfirm>
            <Button 
                icon={<WhatsAppOutlined />} 
                onClick={onWhatsAppClick}
                block
            >
                Contato via WhatsApp
            </Button>
        </div>
      </div>
    </Card>
  );
};


const BusinessClientsPage = () => {
  const { currentProfile, isAuthenticated } = useProfile();
  
  const [businessClients, setBusinessClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isWhatsAppModalVisible, setIsWhatsAppModalVisible] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const isBusinessProfile = useMemo(() => currentProfile && ['PJ', 'MEI'].includes(currentProfile.type), [currentProfile]);

  const fetchBusinessClients = useCallback(async () => {
    if (!currentProfile || !isBusinessProfile) {
        setBusinessClients([]); setLoadingClients(false); return;
    }
    setLoadingClients(true);
    try {
        const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`);
        setBusinessClients(response.data.data || []);
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        message.error("Não foi possível carregar a lista de clientes.");
    } finally {
        setLoadingClients(false);
    }
  }, [currentProfile, isBusinessProfile]);

  useEffect(() => {
    if (isAuthenticated && currentProfile) {
      fetchBusinessClients();
    } else {
      setLoadingClients(false); setBusinessClients([]);
    }
    setSelectedClientId(null);
    setSelectedClientDetails(null);
  }, [currentProfile, isAuthenticated, fetchBusinessClients]);

  const handleSelectClient = useCallback(async (clientId) => {
    if (!currentProfile) return;
    setSelectedClientId(clientId);
    setLoadingDetails(true);
    setSelectedClientDetails(null);
    try {
        const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients/${clientId}/details`);
        const details = response.data.data;
        const nextAppointment = details.appointmentHistory?.find(app => app.status !== 'Completed' && app.status !== 'Cancelled');
        setSelectedClientDetails({ ...details, nextAppointment });
    } catch (error) {
        console.error("Erro ao buscar detalhes do cliente:", error);
        message.error("Não foi possível carregar os detalhes deste cliente.");
    } finally {
        setLoadingDetails(false);
    }
  }, [currentProfile]);
  
  const showModal = (client = null) => {
    setEditingClient(client);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingClient(null);
  };

  const handleModalFinish = async (values) => {
    if (!currentProfile) return;
    setIsSubmitting(true);
    try {
        if (editingClient) {
            await apiClient.put(`/financial-accounts/${currentProfile.id}/business-clients/${editingClient.id}`, values);
            message.success(`Cliente "${values.name}" atualizado!`);
        } else {
            await apiClient.post(`/financial-accounts/${currentProfile.id}/business-clients`, values);
            message.success(`Cliente "${values.name}" criado!`);
        }
        fetchBusinessClients();
        if (editingClient && selectedClientId === editingClient.id) {
            handleSelectClient(editingClient.id);
        }
    } catch (error) {
        // O interceptor do apiClient já deve mostrar o erro
    } finally {
        setIsSubmitting(false);
        handleModalCancel();
    }
  };

  const handleDelete = async (clientToDelete) => {
    if (!currentProfile) return;
    setIsSubmitting(true);
    try {
        await apiClient.delete(`/financial-accounts/${currentProfile.id}/business-clients/${clientToDelete.id}`);
        message.warning(`Cliente "${clientToDelete.name}" excluído!`);
        fetchBusinessClients();
        if (selectedClientId === clientToDelete.id) {
            setSelectedClientId(null);
            setSelectedClientDetails(null);
        }
    } catch (error) {
        // O interceptor do apiClient já deve mostrar o erro
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAppointmentAction = async (action, appointmentId) => {
    if (!currentProfile || !appointmentId) return;
    setLoadingDetails(true);
    try {
        if (action === 'cancel') {
            await apiClient.patch(`/financial-accounts/${currentProfile.id}/appointments/${appointmentId}/cancel`);
            message.warning(`Agendamento cancelado.`);
        } else {
            await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments/${appointmentId}/${action}`);
            message.success(`Agendamento ${action === 'confirm' ? 'confirmado' : 'concluído'} com sucesso!`);
        }
        handleSelectClient(selectedClientId);
    } catch (error) {
        console.error(`Erro ao ${action} agendamento:`, error);
        setLoadingDetails(false);
    }
  };
  
  const generateWhatsAppLink = (client, messageText) => {
    if (!client?.phone) return '#';
    const phone = client.phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(messageText || `Olá, ${client.name}! `);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  const handleSendCustomMessage = () => {
    if (!customMessage.trim()) {
        message.error("A mensagem não pode estar vazia.");
        return;
    }
    const link = generateWhatsAppLink(selectedClientDetails, customMessage);
    window.open(link, '_blank', 'noopener,noreferrer');
    setIsWhatsAppModalVisible(false);
    setCustomMessage('');
  };

  if (loadingClients && !businessClients.length) {
    return ( <div className="crm-loading-container"> <Spin indicator={<TeamOutlined spin style={{ fontSize: 48, color: 'var(--map-laranja)'}} />} /> <p>Carregando seus clientes...</p> </div> );
  }

  if (!isBusinessProfile && currentProfile) {
    return ( <Content className="page-content-wrapper"> <Result icon={<StopOutlined />} status="warning" title="Funcionalidade para Perfis de Negócio" subTitle="Esta área é exclusiva para perfis PJ ou MEI."/> </Content> );
  }

  return (
    <Content className="business-clients-page-content crm-page-wrapper">
      <Row justify="space-between" align="center" className="page-header-clients">
        <Col>
          <Title level={2} className="page-title-clients">Central de Clientes (CRM)</Title>
          <Paragraph className="page-subtitle-clients">Selecione um cliente para ver detalhes e histórico.</Paragraph>
        </Col>
        <Col>
          <Button type="primary" icon={<UserAddOutlined />} size="large" onClick={() => showModal()} className="btn-create-client">Novo Cliente</Button>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} md={8} lg={7} className="master-panel-col">
          <Card bordered={false} className="clients-master-card" bodyStyle={{ padding: '0' }}>
            {businessClients.length > 0 ? (
              <List
                className="business-clients-list"
                dataSource={businessClients}
                renderItem={item => (
                  <List.Item
                    onClick={() => handleSelectClient(item.id)}
                    className={`client-list-item-selectable ${selectedClientId === item.id ? 'active' : ''}`}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.photoUrl} icon={<UserOutlined />}>{!item.photoUrl && item.name ? item.name.charAt(0).toUpperCase() : null}</Avatar>}
                      title={<Text className="client-name">{item.name}</Text>}
                      description={<Text type="secondary">{item.phone || item.email}</Text>}
                    />
                  </List.Item>
                )}
              />
            ) : ( <div style={{padding: '24px'}}><Empty description="Nenhum cliente cadastrado."/></div> )}
          </Card>
        </Col>
        
        <Col xs={24} md={16} lg={17} className="detail-panel-col">
          {loadingDetails ? (
            <div className="detail-panel-placeholder"><Spin size="large" /></div>
          ) : selectedClientDetails ? (
            <Card bordered={false} className="client-detail-card" loading={isSubmitting}>
              <div className="client-detail-header">
                <Space align="center" size="middle">
                  <Avatar size={64} src={selectedClientDetails.photoUrl} icon={<UserOutlined />}>{!selectedClientDetails.photoUrl && selectedClientDetails.name ? selectedClientDetails.name.charAt(0).toUpperCase() : null}</Avatar>
                  <div>
                    <Title level={3} style={{ marginBottom: 0 }}>{selectedClientDetails.name}</Title>
                    <Text copyable={{ tooltips: ['Copiar Email', 'Copiado!'] }} type="secondary"><MailOutlined /> {selectedClientDetails.email}</Text><br/>
                    <Text copyable={{ tooltips: ['Copiar Telefone', 'Copiado!'] }} type="secondary"><PhoneOutlined /> {selectedClientDetails.phone}</Text>
                  </div>
                </Space>
                <Space>
                    <Button
                        type="primary"
                        icon={<WhatsAppOutlined />}
                        className="whatsapp-main-button"
                        onClick={() => setIsWhatsAppModalVisible(true)}
                    >
                        Contato
                    </Button>
                  <Tooltip title="Editar Cliente"><Button icon={<EditOutlined />} onClick={() => showModal(selectedClientDetails)}/></Tooltip>
                  <Popconfirm title="Excluir este cliente?" onConfirm={() => handleDelete(selectedClientDetails)} okText="Sim" cancelText="Não"><Tooltip title="Excluir"><Button danger icon={<DeleteOutlined />}/></Tooltip></Popconfirm>
                </Space>
              </div>
              <Divider/>

              <NextAppointmentCard 
                appointment={selectedClientDetails.nextAppointment}
                onAction={handleAppointmentAction}
                client={selectedClientDetails}
                onWhatsAppClick={() => setIsWhatsAppModalVisible(true)}
              />
              
              <Row gutter={[16, 16]} className="client-stats-row">
                <Col xs={24} sm={8}><Statistic title="Última Visita" value={selectedClientDetails.appointmentHistory?.find(app => app.status === 'Completed') ? dayjs(selectedClientDetails.appointmentHistory.find(app => app.status === 'Completed').eventDateTime).format('DD/MM/YY') : 'N/A'} /></Col>
                <Col xs={24} sm={8}><Statistic title="Total Gasto" prefix="R$" value={selectedClientDetails.totalFaturado} precision={2} /></Col>
                <Col xs={24} sm={8}><Statistic title="Nº de Agendamentos" value={selectedClientDetails.appointmentHistory?.length || 0} /></Col>
              </Row>
              
              <Title level={4} style={{marginTop: '24px'}}>Histórico de Atendimentos</Title>
              <Timeline className="history-timeline">
                {selectedClientDetails.appointmentHistory?.map(app => {
                    const isCompleted = app.status === 'Completed';
                    const isCancelled = app.status === 'Cancelled';
                    
                    if (!isCompleted && !isCancelled) {
                        return null;
                    }

                    const timelineIcon = isCompleted 
                        ? <CheckCircleOutlined style={{color: '#52c41a'}}/> // <<< MUDANÇA: Cor verde para concluído
                        : <CloseCircleOutlined style={{color: '#ff4d4f'}}/>;

                    const totalValue = app.services.reduce((sum, s) => sum + parseFloat(s.price), 0);
return (
  <Timeline.Item key={app.id} dot={timelineIcon}>
    <div style={{ opacity: isCancelled ? 0.6 : 1 }}>
      <Space>
        <Text strong>
          {dayjs(app.eventDateTime).format('DD [de] MMMM, YYYY')}
        </Text>
        {isCancelled && <Tag color="error">CANCELADO</Tag>}
        {isCompleted && <Tag color="success">CONCLUÍDO</Tag>}
      </Space>

      <Card
        size="small"
        className="history-service-card"
        style={{ marginTop: 8 }}
      >
        <List
          className="service-history-list"
          dataSource={app.services}
          renderItem={(service) => (
            <List.Item>
              <Text
                style={{
                  textDecoration: isCancelled ? 'line-through' : 'none',
                }}
              >
                {service.name}
              </Text>
              <Text
                type="secondary"
                style={{
                  textDecoration: isCancelled ? 'line-through' : 'none',
                }}
              >
                R$ {parseFloat(service.price).toFixed(2).replace('.', ',')}
              </Text>
            </List.Item>
          )}
          footer={
            isCompleted && (
              <Text strong>
                Total: R$ {totalValue.toFixed(2).replace('.', ',')}
              </Text>
            )
          }
        />
      </Card>
    </div>
  </Timeline.Item>
);

                })}
              </Timeline>
            </Card>
          ) : (
            <div className="detail-panel-placeholder">
              <Empty description={<><Title level={5}>Nenhum cliente selecionado</Title><Text type="secondary">Clique em um cliente na lista ao lado para ver seus detalhes.</Text></>} />
            </div>
          )}
        </Col>
      </Row>
      <ModalBusinessClientForm open={isModalVisible} onCancel={handleModalCancel} onFinish={handleModalFinish} initialValues={editingClient} loading={isSubmitting}/>
      <Modal
        title="Mensagem Personalizada para WhatsApp"
        open={isWhatsAppModalVisible}
        onCancel={() => setIsWhatsAppModalVisible(false)}
        onOk={handleSendCustomMessage}
        okText="Abrir no WhatsApp"
        okButtonProps={{ icon: <SendOutlined /> }}
      >
        <TextArea
          rows={4}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Digite sua mensagem aqui..."
        />
      </Modal>
    </Content>
  );
};

export default BusinessClientsPage;