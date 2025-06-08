// src/pages/AgendamentosPage/AgendamentosPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Modal, Form, Input, DatePicker, Select,
  Card, Space, Tooltip, Popconfirm, message, Tag, Row, Col,
  Empty, ConfigProvider, Avatar, InputNumber, Radio, Spin, FloatButton, Popover, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined, ShopOutlined, ProfileOutlined, LeftOutlined, RightOutlined,
  RedoOutlined, TeamOutlined, InfoCircleOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, DollarCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/pt-br';
import ptBR from 'antd/lib/locale/pt_BR';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import './AgendamentosPage.css';

moment.locale('pt-br');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const AgendamentosPage = () => {
  const { currentProfile, loadingProfiles, isAuthenticated } = useProfile();

  const [agendamentos, setAgendamentos] = useState([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState(null);
  const [form] = Form.useForm();
  
  const [businessClientsList, setBusinessClientsList] = useState([]);
  const [loadingBusinessClients, setLoadingBusinessClients] = useState(false);
  const isBusinessProfile = useMemo(() => ['PJ', 'MEI'].includes(currentProfile?.type), [currentProfile]);

  const [isClientDetailsModalVisible, setIsClientDetailsModalVisible] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);

  // --- ESTADOS DO CALENDÁRIO E POPOVER ---
  const [currentDate, setCurrentDate] = useState(moment());
  const [popoverVisibleFor, setPopoverVisibleFor] = useState(null);
  
  // <<< MUDANÇA: ESTADOS PARA O NOVO SELETOR DE MÊS/ANO >>>
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(moment().year());


  const fetchAgendamentos = useCallback(async () => {
    if (!currentProfile || !isAuthenticated) {
      setAgendamentos([]); setLoadingAgendamentos(false); return;
    }
    setLoadingAgendamentos(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments`, {
        params: { sortBy: 'eventDateTime', sortOrder: 'ASC', limit: 500 }
      });
      if (response.data?.status === 'success') {
        const mappedAgendamentos = response.data.data.map(app => ({
          id: app.id.toString(),
          titulo: app.title,
          prazo: app.eventDateTime,
          tipo: (app.associatedValue !== null && app.associatedValue !== undefined) ? 'Financeiro' : 'Geral',
          valor: app.associatedValue,
          tipoValorAssociado: app.associatedTransactionType,
          concluido: app.status === 'Completed',
          notas: app.description || app.notes,
          businessClients: (app.businessClients || []).map(bc => ({
            id: bc.id.toString(), name: bc.name, email: bc.email, phone: bc.phone, notes: bc.notes, photoUrl: bc.photoUrl
          })),
        }));
        setAgendamentos(mappedAgendamentos);
      } else {
        setAgendamentos([]); message.error(response.data?.message || "Falha ao carregar agendamentos.");
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error); setAgendamentos([]);
    } finally {
      setLoadingAgendamentos(false);
    }
  }, [currentProfile, isAuthenticated]);

  const fetchBusinessClientsForSelect = useCallback(async () => {
    if (!currentProfile || !isBusinessProfile) { setBusinessClientsList([]); return; }
    setLoadingBusinessClients(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`, { params: { isActive: true, limit: 500 } });
      if (response.data?.status === 'success') {
        setBusinessClientsList(response.data.data.map(client => ({ value: client.id.toString(), label: client.name, photoUrl: client.photoUrl })));
      } else { setBusinessClientsList([]); }
    } catch (error) { console.error("Erro ao carregar clientes:", error); setBusinessClientsList([]); } 
    finally { setLoadingBusinessClients(false); }
  }, [currentProfile, isBusinessProfile]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      fetchAgendamentos();
      if (isBusinessProfile) fetchBusinessClientsForSelect();
      else setBusinessClientsList([]);
    } else if (!isAuthenticated && !loadingProfiles) {
      setAgendamentos([]); setLoadingAgendamentos(false); setBusinessClientsList([]);
    }
  }, [currentProfile, isAuthenticated, loadingProfiles, isBusinessProfile, fetchAgendamentos, fetchBusinessClientsForSelect]);

  const showModal = (agendamento = null, date = null) => {
    setPopoverVisibleFor(null);
    setEditingAgendamento(agendamento);
    form.resetFields();
    if (agendamento) {
      form.setFieldsValue({
        titulo: agendamento.titulo,
        prazoPicker: agendamento.prazo ? moment(agendamento.prazo) : null,
        descricaoAgendamento: agendamento.notas,
        businessClientIds: agendamento.businessClients?.map(client => client.id.toString()) || [],
      });
    } else {
      form.setFieldsValue({ prazoPicker: date ? moment(date).hour(moment().hour()).minute(moment().minute()) : moment().add(1, 'hour'), businessClientIds: [] });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => { setIsModalVisible(false); setEditingAgendamento(null); form.resetFields(); };

  const onFinishModal = async (values) => {
    if (!currentProfile) return;
    const appointmentDataPayload = {
      title: values.titulo,
      eventDateTime: values.prazoPicker.toISOString(),
      description: values.descricaoAgendamento,
      businessClientIds: isBusinessProfile && values.businessClientIds ? values.businessClientIds.map(id => parseInt(id, 10)) : [],
    };
    try {
      if (editingAgendamento) {
        await apiClient.put(`/financial-accounts/${currentProfile.id}/appointments/${editingAgendamento.id}`, appointmentDataPayload);
        message.success("Agendamento atualizado!");
      } else {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, appointmentDataPayload);
        message.success("Agendamento criado!");
      }
      fetchAgendamentos(); handleCancel();
    } catch (error) { console.error("Erro ao salvar agendamento:", error); }
  };

  const handleDelete = async (id) => {
    if (!currentProfile) return;
    setPopoverVisibleFor(null);
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/appointments/${id}`);
      message.warn("Agendamento excluído!");
      fetchAgendamentos();
    } catch (error) { console.error("Erro ao excluir agendamento:", error); }
  };

  const toggleConcluido = async (agendamento) => {
    if (!currentProfile || !agendamento) return;
    const novoStatus = agendamento.concluido ? 'Scheduled' : 'Completed';
    const originalAgendamentos = [...agendamentos];
    setAgendamentos(agendamentos.map(a => a.id === agendamento.id ? { ...a, concluido: !a.concluido } : a));
    try {
      await apiClient.put(`/financial-accounts/${currentProfile.id}/appointments/${agendamento.id}`, { status: novoStatus });
      message.success(`Status alterado para ${novoStatus === 'Completed' ? 'Concluído' : 'Pendente'}.`);
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      setAgendamentos(originalAgendamentos);
    }
  };
  
  const showClientDetailsModal = (client) => {
    setPopoverVisibleFor(null);
    setSelectedClientForDetails(client);
    setIsClientDetailsModalVisible(true);
  };
  const handleClientDetailsModalCancel = () => { setIsClientDetailsModalVisible(false); setSelectedClientForDetails(null); };

  const renderPopoverContent = (app) => (
    <div className="popover-content-wrapper">
      <Title level={5} className="popover-title">
        {app.titulo}
        <Tag color={app.concluido ? "default" : "blue"} className="popover-status-tag">
            {app.concluido ? "Concluído" : "Pendente"}
        </Tag>
      </Title>
      <Text type="secondary" className="popover-time"><ClockCircleOutlined /> {moment(app.prazo).format('dddd, DD/MM/YYYY [às] HH:mm')}</Text>
      {app.notas && <Paragraph className="popover-notes"><InfoCircleOutlined /> {app.notas}</Paragraph>}
      {app.businessClients && app.businessClients.length > 0 && (
        <><Divider className="popover-divider" /><div className="popover-clients-section"><Text strong className="popover-section-title"><TeamOutlined /> Clientes Associados</Text><Avatar.Group maxCount={4} size="default" maxStyle={{ color: '#000', backgroundColor: 'var(--accent-gold)' }}>{app.businessClients.map(client => (<Tooltip title={`Ver detalhes de ${client.name}`} key={client.id}><Avatar src={client.photoUrl} icon={<UserOutlined />} onClick={() => showClientDetailsModal(client)} className="popover-client-avatar"/></Tooltip>))}</Avatar.Group></div></>
      )}
      <Divider className="popover-divider" />
      <Space className="popover-actions"><Button onClick={() => toggleConcluido(app)} icon={<CheckCircleOutlined />}>{app.concluido ? "Reabrir" : "Concluir"}</Button><Button onClick={() => showModal(app)} icon={<EditOutlined />}>Editar</Button><Popconfirm title="Tem certeza que quer excluir?" onConfirm={() => handleDelete(app.id)} okText="Sim, excluir" cancelText="Não"><Button danger icon={<DeleteOutlined />}>Excluir</Button></Popconfirm></Space>
    </div>
  );

  // <<< MUDANÇA: CONTEÚDO DO NOVO SELETOR DE MÊS/ANO >>>
  const renderMonthPickerContent = () => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return (
      <div className="month-picker-container">
        <div className="month-picker-header">
          <Button type="text" shape="circle" icon={<LeftOutlined />} onClick={() => setPickerYear(pickerYear - 1)} />
          <Text strong>{pickerYear}</Text>
          <Button type="text" shape="circle" icon={<RightOutlined />} onClick={() => setPickerYear(pickerYear + 1)} />
        </div>
        <div className="month-picker-grid">
          {meses.map((mes, index) => (
            <Button
              key={mes}
              type={currentDate.year() === pickerYear && currentDate.month() === index ? "primary" : "text"}
              className="month-picker-button"
              onClick={() => {
                setCurrentDate(moment({ year: pickerYear, month: index }));
                setIsMonthPickerVisible(false);
              }}
            >
              {mes.substring(0, 3)}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendarGrid = () => {
    const startDate = currentDate.clone().startOf('month').startOf('week');
    const days = [];
    let day = startDate.clone();
    for(let i = 0; i < 42; i++) {
      const dayAppointments = agendamentos.filter(a => moment(a.prazo).isSame(day, 'day')).sort((a, b) => moment(a.prazo).diff(moment(b.prazo)));
      days.push({ date: day.clone(), isCurrentMonth: day.isSame(currentDate, 'month'), isToday: day.isSame(moment(), 'day'), appointments: dayAppointments });
      day.add(1, 'day');
    }
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="calendar-container">
        <div className="calendar-header-days">{weekDays.map((wd, i) => <div key={i} className="calendar-weekday">{wd}</div>)}</div>
        <div className="calendar-grid">
          {days.map((d, i) => (
            <div key={i} className={`calendar-day ${!d.isCurrentMonth ? 'not-current-month' : ''} ${d.isToday ? 'today' : ''}`} onClick={(e) => { if (e.target.classList.contains('calendar-day') || e.target.classList.contains('day-number')) { showModal(null, d.date); }}}>
              <div className="day-number">{d.date.date()}</div>
              <div className="appointments-container">{d.appointments.map(app => (<Popover key={app.id} content={renderPopoverContent(app)} title={null} trigger="click" placement="right" open={popoverVisibleFor === app.id} onOpenChange={(visible) => setPopoverVisibleFor(visible ? app.id : null)} overlayClassName="calendar-popover" arrow={false}><div className={`appointment-pill ${app.concluido ? 'completed' : ''} type-${app.tipo.toLowerCase()}`}><Space size={4}>{app.valor != null && <DollarCircleOutlined />}{app.businessClients && app.businessClients.length > 0 && <TeamOutlined />}<span className="pill-title">{app.titulo}</span></Space></div></Popover>))}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  if (loadingProfiles) return (<div className="loading-container"><Spin size="large" /></div>);
  if (!isAuthenticated && !loadingProfiles) return (<Content className="dark-placeholder-content"><Title level={3}>Acesso Negado</Title><Paragraph>Você precisa estar logado para acessar esta página.</Paragraph></Content>);
  if (!currentProfile && isAuthenticated && !loadingProfiles) return (<Content className="dark-placeholder-content"><Title level={3}>Nenhum Perfil Selecionado</Title><Paragraph>Por favor, selecione um perfil para gerenciar agendamentos.</Paragraph></Content>);

  return (
    <ConfigProvider locale={ptBR}>
      <Content className="agendamentos-page-content">
        <Card bordered={false} className="agendamentos-calendar-card">
          <Row justify="space-between" align="middle" className="calendar-main-header">
            <Col><Title level={2} className="page-title-agendamentos">Calendário <Text className="profile-name-header">/ {currentProfile?.name}</Text></Title></Col>
            <Col>
              <Space>
                {/* <<< MUDANÇA: TÍTULO DO MÊS AGORA É UM POPOVER >>> */}
                <Popover
                  content={renderMonthPickerContent}
                  trigger="click"
                  placement="bottom"
                  open={isMonthPickerVisible}
                  onOpenChange={(visible) => {
                    if (visible) setPickerYear(currentDate.year());
                    setIsMonthPickerVisible(visible);
                  }}
                  overlayClassName="month-picker-popover"
                >
                  <Title level={4} className="clickable-month-title">{currentDate.format('MMMM [de] YYYY')}</Title>
                </Popover>
                <Tooltip title="Mês Anterior"><Button shape="circle" icon={<LeftOutlined />} onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))} /></Tooltip>
                <Tooltip title="Próximo Mês"><Button shape="circle" icon={<RightOutlined />} onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))} /></Tooltip>
                <Button onClick={() => setCurrentDate(moment())}>Hoje</Button>
              </Space>
            </Col>
          </Row>
          {loadingAgendamentos ? <div className="loading-container"><Spin size="large"/></div> : renderCalendarGrid()}
        </Card>
        <FloatButton icon={<PlusOutlined />} type="primary" tooltip="Novo Agendamento" onClick={() => showModal(null, moment())} />
      </Content>
      <Modal title={editingAgendamento ? "Editar Agendamento" : "Criar Novo Agendamento"} open={isModalVisible} onCancel={handleCancel} footer={null} className="agendamento-modal" destroyOnClose width={600}>
        <Form form={form} layout="vertical" onFinish={onFinishModal}><Form.Item name="titulo" label="Título" rules={[{ required: true, message: 'Insira um título!' }]}><Input placeholder="Ex: Reunião com equipe" /></Form.Item><Form.Item name="prazoPicker" label="Prazo" rules={[{ required: true, message: 'Selecione o prazo!' }]}><DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /></Form.Item>{isBusinessProfile && (<Form.Item name="businessClientIds" label={ <Space>Clientes Associados (Opcional) {loadingBusinessClients && <Spin size="small" />}</Space> }><Select mode="multiple" placeholder="Selecione clientes..." loading={loadingBusinessClients} allowClear filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} optionRender={(option) => (<Space><Avatar src={option.data.photoUrl} icon={<UserOutlined />} size="small" />{option.data.label}</Space>)}>{businessClientsList.map(client => (<Option key={client.value} value={client.value} label={client.label} data={client}>{client.label}</Option>))}</Select></Form.Item>)}<Form.Item name="descricaoAgendamento" label="Descrição/Notas (Opcional)"><Input.TextArea rows={3} /></Form.Item><Form.Item style={{ textAlign: 'right', marginTop: '24px' }}><Button onClick={handleCancel} style={{ marginRight: 8 }}>Cancelar</Button><Button type="primary" htmlType="submit" loading={loadingAgendamentos}>{editingAgendamento ? "Salvar Alterações" : "Criar"}</Button></Form.Item></Form>
      </Modal>
      <Modal title={<Space><ProfileOutlined />Detalhes do Cliente</Space>} open={isClientDetailsModalVisible} onCancel={handleClientDetailsModalCancel} footer={[<Button key="close" onClick={handleClientDetailsModalCancel}>Fechar</Button>]} className="client-details-modal">
          {selectedClientForDetails ? (<div className="client-details-content"><Avatar size={80} src={selectedClientForDetails.photoUrl} icon={<UserOutlined />} className="client-details-avatar" /><Title level={4} className="client-details-name">{selectedClientForDetails.name}</Title>{selectedClientForDetails.email && <Paragraph><MailOutlined /> {selectedClientForDetails.email}</Paragraph>}{selectedClientForDetails.phone && <Paragraph><PhoneOutlined /> {selectedClientForDetails.phone}</Paragraph>}{selectedClientForDetails.notes && <Paragraph className="client-details-notes"><InfoCircleOutlined /> {selectedClientForDetails.notes}</Paragraph>}</div>) : <div className="loading-container"><Spin/></div>}
      </Modal>
    </ConfigProvider>
  );
};

export default AgendamentosPage;