import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Modal, Form, DatePicker, Select,
  Card, Space, Tooltip, Popconfirm, message, Tag, Row, Col,
  Empty, ConfigProvider, Avatar, Spin, FloatButton, Popover, Divider, List, Statistic, Steps, Result, Calendar
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined, TeamOutlined, LeftOutlined, RightOutlined,
  InfoCircleOutlined, MailOutlined, PhoneOutlined, CalendarOutlined as CalendarIcon, DollarCircleOutlined,
  CarryOutOutlined, LikeOutlined, StopOutlined, ShoppingOutlined, AppstoreAddOutlined
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

// Função helper para escurecer cores para a borda
const darkenColor = (colorStr, amount) => {
  if (!colorStr || !colorStr.startsWith('#')) return '#333';
  let usePound = true;
  let color = colorStr.slice(1);
  const num = parseInt(color, 16);
  let r = (num >> 16) * (1 - amount);
  let g = ((num >> 8) & 0x00FF) * (1 - amount);
  let b = (num & 0x0000FF) * (1 - amount);
  r = Math.max(0, Math.floor(r));
  g = Math.max(0, Math.floor(g));
  b = Math.max(0, Math.floor(b));
  return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
};

const AgendamentosPage = () => {
  const { currentProfile, loadingProfiles, isAuthenticated } = useProfile();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentDate, setCurrentDate] = useState(moment());
  const [popoverVisibleFor, setPopoverVisibleFor] = useState(null);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(moment().year());
  
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [businessClientsList, setBusinessClientsList] = useState([]);
  const [loadingBusinessClients, setLoadingBusinessClients] = useState(false);
  const [isClientDetailsModalVisible, setIsClientDetailsModalVisible] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  const [servicesList, setServicesList] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [agendamentos, setAgendamentos] = useState([]);
  
  // --- Estados do Modal de Agendamento ---
  const [modalStep, setModalStep] = useState(0);
  const [modalData, setModalData] = useState({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDateForSlots, setSelectedDateForSlots] = useState(null);

  const isBusinessProfile = useMemo(() => ['PJ', 'MEI'].includes(currentProfile?.type), [currentProfile]);

  // --- Funções de Fetch de Dados ---
  const fetchAgendamentosClassic = useCallback(async () => {
    if (!currentProfile || !isAuthenticated) { setAgendamentos([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments`, { params: { sortBy: 'eventDateTime', sortOrder: 'ASC', limit: 500 } });
      const mapped = response.data.data.appointments.map(app => ({
        id: app.id.toString(), titulo: app.title, prazo: app.eventDateTime,
        tipo: (app.associatedValue != null) ? 'Financeiro' : 'Geral',
        valor: app.associatedValue, concluido: app.status === 'Completed',
        notas: app.description || app.notes,
      }));
      setAgendamentos(mapped);
    } catch (error) { console.error("Erro ao carregar agendamentos (PF):", error); setAgendamentos([]); } 
    finally { setIsLoading(false); }
  }, [currentProfile, isAuthenticated]);

  const fetchCalendarEventsBusiness = useCallback(async (start, end) => {
    if (!currentProfile || !isAuthenticated) { setCalendarEvents([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments/agenda-view`, { params: { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') } });
      setCalendarEvents(response.data.data || []);
    } catch (error) { console.error("Erro ao carregar eventos da agenda (PJ):", error); setCalendarEvents([]); } 
    finally { setIsLoading(false); }
  }, [currentProfile, isAuthenticated]);

  const fetchBusinessClientsForSelect = useCallback(async () => {
    if (!currentProfile || !isBusinessProfile) { setBusinessClientsList([]); return; }
    setLoadingBusinessClients(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`, { params: { isActive: true, limit: 500 } });
      setBusinessClientsList(response.data.data.map(c => ({ ...c, value: c.id.toString(), label: c.name })));
    } catch (error) { console.error("Erro ao carregar clientes:", error); setBusinessClientsList([]); } 
    finally { setLoadingBusinessClients(false); }
  }, [currentProfile, isBusinessProfile]);

  const fetchServicesForSelect = useCallback(async () => {
    if (!currentProfile || !isBusinessProfile) { setServicesList([]); return; }
    setLoadingServices(true);
    try {
      const response = await apiClient.get(`/services/${currentProfile.id}`, { params: { isActive: true, limit: 500 } });
      setServicesList(response.data.data.services.map(s => ({ ...s, value: s.id.toString(), label: s.name })));
    } catch (error) { console.error("Erro ao carregar serviços:", error); setServicesList([]); }
    finally { setLoadingServices(false); }
  }, [currentProfile, isBusinessProfile]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      if (isBusinessProfile) {
        const start = currentDate.clone().startOf('month').startOf('week');
        const end = currentDate.clone().endOf('month').endOf('week');
        fetchCalendarEventsBusiness(start, end);
        fetchBusinessClientsForSelect();
        fetchServicesForSelect();
      } else {
        fetchAgendamentosClassic();
        setBusinessClientsList([]);
        setServicesList([]);
      }
    } else if (!isAuthenticated && !loadingProfiles) {
      setIsLoading(false); 
      setAgendamentos([]); 
      setCalendarEvents([]);
    }
  }, [currentProfile, isAuthenticated, loadingProfiles, isBusinessProfile, currentDate, fetchAgendamentosClassic, fetchCalendarEventsBusiness, fetchBusinessClientsForSelect, fetchServicesForSelect]);

  const fetchAvailableSlots = useCallback(async (date, serviceIds) => {
    if (!date || !serviceIds || serviceIds.length === 0 || !currentProfile?.id) return;
    setSlotsLoading(true);
    setAvailableSlots([]);
    try {
      const response = await apiClient.get(`/public/booking/${currentProfile.id}/availability`, {
        params: {
          date: date.format('YYYY-MM-DD'),
          serviceIds: serviceIds.join(','),
        },
      });
      setAvailableSlots(response.data.data.availableSlots || []);
    } catch (error) {
      message.error("Erro ao buscar horários disponíveis.");
    } finally {
      setSlotsLoading(false);
    }
  }, [currentProfile?.id]);

  // --- Funções de Manipulação do Modal ---
  const showModal = () => {
    setModalStep(0);
    setModalData({});
    setSelectedDateForSlots(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleModalNext = async () => {
    try {
      if (modalStep === 0) { // Validar serviços
        const values = await form.validateFields(['serviceIds']);
        setModalData(prev => ({ ...prev, ...values }));
        setSelectedDateForSlots(null); // Resetar data ao mudar serviços
        setSelectedSlot(null);
        setAvailableSlots([]);
      } else if (modalStep === 1) { // Validar data/hora
        if (!selectedSlot) {
            message.error('Por favor, selecione um horário.');
            return;
        }
      }
      setModalStep(prev => prev + 1);
    } catch (errorInfo) {
      console.log('Falha na validação:', errorInfo);
    }
  };

  const handleModalPrev = () => {
    setModalStep(prev => prev - 1);
  };

  const onDateChangeInModal = (date) => {
    setSelectedDateForSlots(date);
    setSelectedSlot(null);
    const { serviceIds } = form.getFieldsValue(['serviceIds']);
    if (date && serviceIds) {
      fetchAvailableSlots(date, serviceIds);
    } else {
      setAvailableSlots([]);
    }
  };

  const onFinishModal = async () => {
    if (!currentProfile) return;
    try {
        const values = await form.validateFields(['businessClientIds']);
        const finalModalData = { ...modalData, ...values };

        const finalEventDateTime = moment(`${selectedDateForSlots.format('YYYY-MM-DD')}T${selectedSlot}`).toISOString();
        const serviceDetails = servicesList.filter(s => finalModalData.serviceIds.includes(s.id.toString()));
        const title = serviceDetails.map(s => s.name).join(' + ');

        const payload = {
          title: title, 
          eventDateTime: finalEventDateTime,
          businessClientIds: finalModalData.businessClientIds.map(id => parseInt(id, 10)),
          serviceIds: finalModalData.serviceIds.map(id => parseInt(id, 10)),
        };

        await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, payload);
        message.success("Agendamento criado com sucesso!");
        const start = currentDate.clone().startOf('month');
        const end = currentDate.clone().endOf('month');
        fetchCalendarEventsBusiness(start, end);
        handleCancel();
    } catch (error) { 
        console.log('Erro ao finalizar:', error);
        // Interceptor já deve tratar a mensagem de erro da API
    }
  };
  
  // --- Funções de Ações (Excluir, Confirmar, etc.) ---
  const handleLifecycleAction = async (action, event) => {
    if (!currentProfile || !event) return;
    setPopoverVisibleFor(null);
    try {
      const endpoint = `/financial-accounts/${currentProfile.id}/appointments/${event.appointmentId}/${action}`;
      await apiClient.post(endpoint);
      message.success(`Agendamento ${action === 'confirm' ? 'confirmado' : 'concluído'}!`);
      const start = currentDate.clone().startOf('month');
      const end = currentDate.clone().endOf('month');
      fetchCalendarEventsBusiness(start, end);
    } catch (error) { /* O interceptor da API trata a exibição de erros */ }
  };

  const handleDelete = async (id) => {
    if (!currentProfile) return;
    setPopoverVisibleFor(null);
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/appointments/${id}`);
      message.warn("Agendamento excluído!");
      if (isBusinessProfile) {
        const start = currentDate.clone().startOf('month');
        const end = currentDate.clone().endOf('month');
        fetchCalendarEventsBusiness(start, end);
      } else {
        fetchAgendamentosClassic();
      }
    } catch (error) { /* O interceptor da API trata a exibição de erros */ }
  };

  const toggleConcluidoClassic = async (app) => {
    if (!currentProfile || !app) return;
    setPopoverVisibleFor(null);
    try {
      await apiClient.put(`/financial-accounts/${currentProfile.id}/appointments/${app.id}`, { 
        status: app.concluido ? 'Scheduled' : 'Completed'
      });
      message.success(`Status alterado!`);
      fetchAgendamentosClassic();
    } catch (error) { /* O interceptor da API trata a exibição de erros */ }
  };

  const showClientDetailsModal = async (client) => {
    if (!currentProfile || !client) return;
    setPopoverVisibleFor(null); 
    setIsClientDetailsModalVisible(true); 
    setLoadingClientDetails(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients/${client.id}/details`);
      setSelectedClientForDetails(response.data.data);
    } catch (error) { 
      handleClientDetailsModalCancel(); 
    } finally { 
      setLoadingClientDetails(false); 
    }
  };
  const handleClientDetailsModalCancel = () => { setIsClientDetailsModalVisible(false); setSelectedClientForDetails(null); };

  // --- Componentes de Renderização ---
  const renderMonthPickerContent = () => (
      <div className="month-picker-container">
        <div className="month-picker-header">
          <Button type="text" shape="circle" icon={<LeftOutlined />} onClick={() => setPickerYear(pickerYear - 1)} />
          <Text strong>{pickerYear}</Text>
          <Button type="text" shape="circle" icon={<RightOutlined />} onClick={() => setPickerYear(pickerYear + 1)} />
        </div>
        <div className="month-picker-grid">
          {moment.months().map((mes, index) => (
            <Button 
              key={mes} 
              type={currentDate.year() === pickerYear && currentDate.month() === index ? "primary" : "text"} 
              className="month-picker-button" 
              onClick={() => { 
                setCurrentDate(moment({ year: pickerYear, month: index })); 
                setIsMonthPickerVisible(false); 
              }}>
              {moment.monthsShort()[index]}
            </Button>
          ))}
        </div>
      </div>
  );

  const renderClassicPopoverContent = (app) => (
    <div className="popover-content-wrapper">
      <Title level={5} className="popover-title">{app.titulo}
        <Tag color={app.concluido ? "default" : "blue"} className="popover-status-tag">
          {app.concluido ? "Concluído" : "Pendente"}
        </Tag>
      </Title>
      <Text type="secondary" className="popover-time">
        <ClockCircleOutlined /> {moment(app.prazo).format('dddd, DD/MM/YYYY [às] HH:mm')}
      </Text>
      {app.notas && <Paragraph className="popover-notes"><InfoCircleOutlined /> {app.notas}</Paragraph>}
      <Divider className="popover-divider" />
      <Space className="popover-actions">
        <Button onClick={() => toggleConcluidoClassic(app)} icon={<CheckCircleOutlined />}>
          {app.concluido ? "Reabrir" : "Concluir"}
        </Button>
        <Popconfirm title="Tem certeza?" onConfirm={() => handleDelete(app.id)} okText="Sim">
          <Button danger icon={<DeleteOutlined />}>Excluir</Button>
        </Popconfirm>
      </Space>
    </div>
  );

  const renderBusinessPopoverContent = (event) => (
    <div className="popover-content-wrapper">
      <Title level={5} className="popover-title">{event.title}
        <Tag color={event.status === 'Completed' ? "default" : (event.status === 'Confirmed' ? 'cyan' : 'blue')} className="popover-status-tag">
          {event.status}
        </Tag>
      </Title>
      <Text type="secondary" className="popover-time">
        <ClockCircleOutlined /> {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
      </Text>
      {event.description && <Paragraph className="popover-notes"><InfoCircleOutlined /> {event.description}</Paragraph>}
      
      {event.services?.length > 0 && (
        <>
          <Divider className="popover-divider" />
          <div className="popover-clients-section">
            <Text strong className="popover-section-title"><AppstoreAddOutlined /> Serviços</Text>
            <div>{event.services.map(s => <Tag key={s.id}>{s.name}</Tag>)}</div>
          </div>
        </>
      )}

      {event.businessClients?.length > 0 && (
        <>
          <Divider className="popover-divider" />
          <div className="popover-clients-section">
            <Text strong className="popover-section-title"><TeamOutlined /> Clientes</Text>
            <Avatar.Group maxCount={4}>
              {event.businessClients.filter(Boolean).map(c => (
                <Tooltip title={c.name} key={c.id}>
                  <Avatar src={c.photoUrl} icon={<UserOutlined />} onClick={() => showClientDetailsModal(c)} className="popover-client-avatar"/>
                </Tooltip>
              ))}
            </Avatar.Group>
          </div>
        </>
      )}
      <Divider className="popover-divider" />
      <Space className="popover-actions">
        {event.status === 'Scheduled' && <Button onClick={() => handleLifecycleAction('confirm', event)} icon={<LikeOutlined />}>Confirmar</Button>}
        {event.status === 'Confirmed' && <Button onClick={() => handleLifecycleAction('complete', event)} icon={<CheckCircleOutlined />}>Concluir</Button>}
        <Popconfirm title="Excluir este agendamento?" onConfirm={() => handleDelete(event.appointmentId)}>
          <Button danger icon={<DeleteOutlined />}>Excluir</Button>
        </Popconfirm>
      </Space>
    </div>
  );

  const renderClassicCalendar = () => {
    const startDate = currentDate.clone().startOf('month').startOf('week'); 
    const days = Array.from({ length: 42 }).map((_, i) => {
        const day = startDate.clone().add(i, 'days');
        return {
            date: day,
            isCurrentMonth: day.isSame(currentDate, 'month'),
            isToday: day.isSame(moment(), 'day'),
            apps: agendamentos.filter(a => moment(a.prazo).isSame(day, 'day'))
        };
    });
    return (
        <div className="calendar-grid">
            {days.map((d, i) => (
                <div key={i} className={`calendar-day ${!d.isCurrentMonth ? 'not-current-month' : ''} ${d.isToday ? 'today' : ''}`}>
                    <div className="day-number">{d.date.date()}</div>
                    <div className="appointments-container">
                        {d.apps.map(app => (
                            <Popover key={app.id} content={renderClassicPopoverContent(app)} trigger="click" open={popoverVisibleFor === app.id} onOpenChange={v => setPopoverVisibleFor(v ? app.id : null)} overlayClassName="calendar-popover">
                                <div className={`appointment-pill ${app.concluido ? 'completed' : ''} type-${app.tipo.toLowerCase()}`}>
                                    <Space size={4}>
                                        {app.valor != null && <DollarCircleOutlined/>}
                                        <span className="pill-title">{app.titulo}</span>
                                    </Space>
                                </div>
                            </Popover>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
  };
  
  const renderBusinessCalendar = () => {
    const startDate = currentDate.clone().startOf('month').startOf('week'); 
    const days = Array.from({ length: 42 }).map((_, i) => {
        const day = startDate.clone().add(i, 'days');
        return {
            date: day,
            isCurrentMonth: day.isSame(currentDate, 'month'),
            isToday: day.isSame(moment(), 'day'),
            events: calendarEvents.filter(e => moment(e.start).isSame(day, 'day'))
        };
    });
    return (
        <div className="calendar-grid">
            {days.map((d, i) => (
                <div key={i} className={`calendar-day ${!d.isCurrentMonth ? 'not-current-month' : ''} ${d.isToday ? 'today' : ''}`}>
                    <div className="day-number">{d.date.date()}</div>
                    <div className="events-wrapper">
                        {d.events.filter(e => e.display === 'background').map(evt => (
                            <div key={evt.id} className="background-event-block" style={{ backgroundColor: evt.backgroundColor }}>
                                <Tooltip title={evt.title}><span>{evt.title}</span></Tooltip>
                            </div>
                        ))}
                        <div className="appointments-container">
                            {d.events.filter(e => e.type === 'appointment').map(evt => (
                                <Popover key={evt.id} content={renderBusinessPopoverContent(evt)} trigger="click" open={popoverVisibleFor === evt.id} onOpenChange={v => setPopoverVisibleFor(v ? evt.id : null)} overlayClassName="calendar-popover">
                                    <div className="appointment-pill" style={{ backgroundColor: evt.backgroundColor, borderLeftColor: darkenColor(evt.backgroundColor, 0.2) }}>
                                        <Space size={4}>
                                            <span className="pill-time">{moment(evt.start).format('HH:mm')}</span>
                                            <span className="pill-title">{evt.title}</span>
                                        </Space>
                                    </div>
                                </Popover>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const modalSteps = [
    {
      title: 'Serviços',
      content: (
        <Form.Item
          name="serviceIds"
          label="Selecione o(s) serviço(s) desejado(s)"
          rules={[{ required: true, message: 'Por favor, selecione pelo menos um serviço!' }]}
        >
          <Select
            mode="multiple"
            allowClear
            loading={loadingServices}
            placeholder="Ex: Corte de Cabelo, Manicure"
            options={servicesList}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            notFoundContent={loadingServices ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhum serviço encontrado" />}
          />
        </Form.Item>
      ),
    },
    {
      title: 'Data e Hora',
      content: (
        <div className="modal-step-container">
            <div className="modal-calendar-wrapper">
                <Calendar fullscreen={false} onSelect={onDateChangeInModal} value={selectedDateForSlots} />
            </div>
            <div className="modal-slots-wrapper">
                <Text strong>{selectedDateForSlots ? selectedDateForSlots.format('dddd, DD [de] MMMM') : 'Selecione um dia no calendário'}</Text>
                <Divider style={{margin: '12px 0'}}/>
                {slotsLoading ? (
                    <div className="centered-content"><Spin tip="Buscando horários..." /></div>
                ) : (
                    <>
                    {selectedDateForSlots && availableSlots.length > 0 && (
                        <div className="available-slots-grid">
                        {availableSlots.map(slot => (
                            <Button key={slot} type={selectedSlot === slot ? 'primary' : 'default'} onClick={() => setSelectedSlot(slot)}>
                            {slot}
                            </Button>
                        ))}
                        </div>
                    )}
                    {selectedDateForSlots && !slotsLoading && availableSlots.length === 0 && (
                        <div className="centered-content">
                            <Empty description="Nenhum horário disponível para esta data." />
                        </div>
                    )}
                    {!selectedDateForSlots && (
                        <div className="centered-content">
                            <Empty description="Selecione uma data para ver os horários." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
      ),
    },
    {
      title: 'Cliente(s)',
      content: (
        <Form.Item
          name="businessClientIds"
          label="Selecione o(s) cliente(s) para o agendamento"
          rules={[{ required: true, message: 'Por favor, selecione pelo menos um cliente!' }]}
        >
          <Select
            mode="multiple"
            allowClear
            loading={loadingBusinessClients}
            placeholder="Selecione os clientes"
            options={businessClientsList}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            notFoundContent={loadingBusinessClients ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhum cliente encontrado" />}
          />
        </Form.Item>
      ),
    },
  ];

  if (loadingProfiles) return (<div className="loading-container"><Spin size="large" /></div>);
  if (!isAuthenticated && !loadingProfiles) return (<Content className="dark-placeholder-content"><Title level={3}>Acesso Negado</Title></Content>);
  if (!currentProfile && isAuthenticated && !loadingProfiles) return (<Content className="dark-placeholder-content"><Title level={3}>Nenhum Perfil Selecionado</Title></Content>);

  return (
    <ConfigProvider locale={ptBR}>
      <Content className="agendamentos-page-content">
        <Card bordered={false} className="agendamentos-calendar-card">
          <Row justify="space-between" align="middle" className="calendar-main-header">
            <Col>
                <Title level={2} className="page-title-agendamentos">
                    {isBusinessProfile ? 'Agenda' : 'Calendário'}
                    <Text className="profile-name-header"> / {currentProfile?.name}</Text>
                </Title>
            </Col>
            <Col>
                <Space>
                    <Popover content={renderMonthPickerContent} trigger="click" placement="bottom" open={isMonthPickerVisible} onOpenChange={setIsMonthPickerVisible} overlayClassName="month-picker-popover">
                        <Title level={4} className="clickable-month-title">{currentDate.format('MMMM [de] YYYY')}</Title>
                    </Popover>
                    <Tooltip title="Mês Anterior"><Button shape="circle" icon={<LeftOutlined />} onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))} /></Tooltip>
                    <Tooltip title="Próximo Mês"><Button shape="circle" icon={<RightOutlined />} onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))} /></Tooltip>
                    <Button onClick={() => setCurrentDate(moment())}>Hoje</Button>
                </Space>
            </Col>
          </Row>
          <div className="calendar-container">
            <div className="calendar-header-days">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(wd => <div key={wd} className="calendar-weekday">{wd}</div>)}</div>
            {isLoading ? <div className="loading-container" style={{height: '50vh'}}><Spin size="large"/></div> : ( isBusinessProfile ? renderBusinessCalendar() : renderClassicCalendar() )}
          </div>
        </Card>
        <FloatButton icon={<PlusOutlined />} type="primary" tooltip="Novo Agendamento" onClick={showModal} />
      </Content>
      
      <Modal 
        title="Novo Agendamento" 
        open={isModalVisible} 
        onCancel={handleCancel} 
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button onClick={handleModalPrev} disabled={modalStep === 0}>
              Anterior
            </Button>
            {modalStep < modalSteps.length - 1 ? (
              <Button type="primary" onClick={handleModalNext} disabled={modalStep === 1 && !selectedSlot}>
                Próximo
              </Button>
            ) : (
              <Button type="primary" onClick={onFinishModal}>
                Finalizar Agendamento
              </Button>
            )}
          </div>
        } 
        destroyOnClose 
        width={modalStep === 1 ? 800 : 600} // Modal maior no passo do calendário
        className="agendamento-modal"
      >
        <Steps current={modalStep} style={{ marginBottom: 24 }} items={modalSteps.map(item => ({ key: item.title, title: item.title }))} />
        <Form form={form} layout="vertical" initialValues={{ serviceIds: [], businessClientIds: [] }}>
          <div className="steps-content" style={{ marginTop: 16 }}>
            {modalSteps[modalStep].content}
          </div>
        </Form>
      </Modal>

      {isBusinessProfile && 
        <Modal title={<Space><TeamOutlined />Detalhes do Cliente</Space>} open={isClientDetailsModalVisible} onCancel={handleClientDetailsModalCancel} footer={[<Button key="close" onClick={handleClientDetailsModalCancel}>Fechar</Button>]} className="client-details-modal" width={600}>
            {loadingClientDetails || !selectedClientForDetails ? <div className="loading-container" style={{height: 300}}><Spin/></div> : (
              <div className="client-details-content">
                  <Avatar size={80} src={selectedClientForDetails.photoUrl} icon={<UserOutlined />} className="client-details-avatar" />
                  <Title level={4} className="client-details-name">{selectedClientForDetails.name}</Title>
                  <Space size="large" wrap style={{justifyContent: 'center', marginBottom: 24}}>
                    {selectedClientForDetails.email && <Text copyable><MailOutlined /> {selectedClientForDetails.email}</Text>}
                    {selectedClientForDetails.phone && <Text copyable><PhoneOutlined /> {selectedClientForDetails.phone}</Text>}
                  </Space>
                  {selectedClientForDetails.notes && <Paragraph className="client-details-notes" type='secondary'><InfoCircleOutlined /> {selectedClientForDetails.notes}</Paragraph>}
                  
                  <Divider>Atividade do Cliente</Divider>
                  <Row gutter={16} style={{textAlign: 'left'}}>
                    <Col xs={24} md={12}>
                        <Title level={5}><DollarCircleOutlined /> Faturamento</Title>
                        <Statistic title="Total Gasto" value={selectedClientForDetails.totalFaturado || 0} precision={2} prefix="R$" />
                    </Col>
                    <Col xs={24} md={12}>
                        <Title level={5}><CarryOutOutlined /> Histórico Recente</Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={selectedClientForDetails.appointmentHistory || []}
                            size="small"
                            className="client-history-list"
                            locale={{emptyText: "Nenhum histórico encontrado."}}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<ShoppingOutlined />}
                                        title={<Text>{item.title}</Text>}
                                        description={`${moment(item.eventDateTime).format('DD/MM/YYYY')} - R$ ${item.services.reduce((acc, s) => acc + parseFloat(s.price), 0).toFixed(2)}`}
                                    />
                                </List.Item>
                            )}
                        />
                    </Col>
                  </Row>
              </div>
          )}
        </Modal>
      }
    </ConfigProvider>
  );
};

export default AgendamentosPage;