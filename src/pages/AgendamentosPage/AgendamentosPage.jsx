import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Modal, Form, DatePicker, Select,
  Card, Space, Tooltip, Popconfirm, message, Tag, Row, Col,
  Empty, ConfigProvider, Avatar, Spin, FloatButton, Popover, Divider, List, Statistic, Steps, Result, Calendar, Dropdown, Menu, Input
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined, TeamOutlined, LeftOutlined, RightOutlined,
  InfoCircleOutlined, MailOutlined, PhoneOutlined, CalendarOutlined as CalendarIcon, DollarCircleOutlined,
  CarryOutOutlined, LikeOutlined, StopOutlined, ShoppingOutlined, AppstoreAddOutlined,
  CalendarOutlined, UserAddOutlined
} from '@ant-design/icons';
import moment from 'moment-timezone';
import 'moment/locale/pt-br';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import ptBR from 'antd/lib/locale/pt_BR';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import ModalPfAppointment from '../../modals/ModalPfAppointment/ModalPfAppointment';
import ModalPjClientAppointment from '../../modals/ModalPjClientAppointment/ModalPjClientAppointment';
import ModalPjServiceAppointment from '../../modals/ModalPjServiceAppointment/ModalPjServiceAppointment';

import './AgendamentosPage.css';

moment.locale('pt-br');
dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const mesesEmPortugues = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isPfModalVisible, setIsPfModalVisible] = useState(false);
    const [isPjClientModalVisible, setIsPjClientModalVisible] = useState(false);
    const [isPjServiceModalVisible, setIsPjServiceModalVisible] = useState(false);
    
    const [formPjService] = Form.useForm();
    const [modalStepPjService, setModalStepPjService] = useState(0);
    const [modalDataPjService, setModalDataPjService] = useState({});
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDateForSlots, setSelectedDateForSlots] = useState(null);
  
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
  
    const isBusinessProfile = useMemo(() => ['PJ', 'MEI'].includes(currentProfile?.type), [currentProfile]);

    const getFormattedMonthTitle = (date) => {
        const mesIndex = date.month();
        const ano = date.year();
        const nomeDoMes = mesesEmPortugues[mesIndex] || '';
        return `${nomeDoMes} de ${ano}`;
    };

    const translateStatus = (status) => {
        const statusMap = {
            Scheduled: 'Pendente', Confirmed: 'Confirmado', Completed: 'Concluído', Cancelled: 'Cancelado',
        };
        return statusMap[status] || status;
    };

    const fetchAgendamentosClassic = useCallback(async () => {
        if (!currentProfile || !isAuthenticated) { setCalendarEvents([]); setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments`, { params: { sortBy: 'eventDateTime', sortOrder: 'ASC', limit: 500 } });
            const normalizedEvents = (response.data.data || []).map(app => ({
                id: `appt_${app.id}`,
                appointmentId: app.id,
                type: 'appointment',
                title: app.title,
                start: moment.tz(app.eventDateTime, 'UTC').local().toDate(),
                end: moment.tz(app.eventDateTime, 'UTC').add(app.durationMinutes || 60, 'minutes').local().toDate(),
                status: translateStatus(app.status),
                description: app.description || app.notes,
                backgroundColor: '#3788d8',
                borderColor: '#3788d8',
                businessClients: [],
                services: [],
                isPf: true,
                associatedValue: app.associatedValue,
            }));
            setCalendarEvents(normalizedEvents);
        } catch (error) { console.error("Erro ao carregar agendamentos (PF):", error); setCalendarEvents([]); }
        finally { setIsLoading(false); }
    }, [currentProfile, isAuthenticated]);

    const fetchCalendarEventsBusiness = useCallback(async () => {
        if (!currentProfile || !isAuthenticated) { setCalendarEvents([]); setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const start = currentDate.clone().startOf('month').startOf('week');
            const end = currentDate.clone().endOf('month').endOf('week');
            const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments/agenda-view`, { params: { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') } });
            
            const normalizedEvents = (response.data.data || []).map(event => ({
                id: event.id, appointmentId: event.appointmentId, type: event.type, display: event.display,
                title: event.title, description: event.description,
                start: moment.tz(event.start, 'UTC').local().toDate(),
                end: moment.tz(event.end, 'UTC').local().toDate(),
                status: translateStatus(event.status),
                backgroundColor: event.backgroundColor, borderColor: event.borderColor,
                businessClients: event.businessClients || [], services: event.services || [],
                isPf: false,
            }));
            setCalendarEvents(normalizedEvents);
        } catch (error) { console.error("Erro ao carregar eventos da agenda (PJ):", error); setCalendarEvents([]); }
        finally { setIsLoading(false); }
    }, [currentProfile, isAuthenticated, isBusinessProfile, currentDate]);

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
          setServicesList(response.data.data.services.map(s => ({ ...s, value: s.id.toString(), label: s.name, durationMinutes: s.durationMinutes })));
        } catch (error) { console.error("Erro ao carregar serviços:", error); setServicesList([]); }
        finally { setLoadingServices(false); }
      }, [currentProfile, isBusinessProfile]);

    useEffect(() => {
        if (!loadingProfiles && isAuthenticated && currentProfile) {
          if (isBusinessProfile) {
            fetchCalendarEventsBusiness();
            fetchBusinessClientsForSelect();
            fetchServicesForSelect();
          } else {
            fetchAgendamentosClassic();
          }
        } else if (!isAuthenticated && !loadingProfiles) {
          setIsLoading(false);
          setCalendarEvents([]);
        }
    }, [currentProfile, isAuthenticated, loadingProfiles, isBusinessProfile, fetchAgendamentosClassic, fetchCalendarEventsBusiness, fetchBusinessClientsForSelect, fetchServicesForSelect]);
    
    useEffect(() => {
        if (currentProfile?.id && !loadingProfiles && isAuthenticated) {
            if (isBusinessProfile) {
                fetchCalendarEventsBusiness();
            } else {
                fetchAgendamentosClassic();
            }
        }
    }, [currentDate, isBusinessProfile, currentProfile?.id, loadingProfiles, isAuthenticated, fetchCalendarEventsBusiness, fetchAgendamentosClassic]);

    const fetchAvailableSlots = useCallback(async (date, serviceIdsParam) => {
        if (!date || !serviceIdsParam || serviceIdsParam.length === 0 || !currentProfile?.id) { setAvailableSlots([]); setSlotsLoading(false); return; }
        setSlotsLoading(true);
        try {
            const response = await apiClient.get(`/public/booking/${currentProfile.id}/availability`, {
            params: { date: date.format('YYYY-MM-DD'), serviceIds: serviceIdsParam.join(',') },
            });
            setAvailableSlots(response.data.data.availableSlots || []);
        } catch (error) { setAvailableSlots([]); } finally { setSlotsLoading(false); }
    }, [currentProfile?.id]);

    const handleAppointmentCreationSuccess = () => {
        if (isBusinessProfile) { fetchCalendarEventsBusiness(); } else { fetchAgendamentosClassic(); }
    };
    
    const handleShowPfModal = () => { setIsPfModalVisible(true); };
    const handleShowPjClientModal = () => { setIsPjClientModalVisible(true); };
    const handleShowPjServiceModal = () => {
        setModalStepPjService(0); setModalDataPjService({}); setSelectedDateForSlots(null);
        setSelectedSlot(null); setAvailableSlots([]); formPjService.resetFields();
        setIsPjServiceModalVisible(true);
    };
    const handleCancelAllModals = () => {
        setIsPfModalVisible(false); setIsPjClientModalVisible(false); setIsPjServiceModalVisible(false);
        formPjService.resetFields();
    };

    const renderMonthPickerContent = () => (
        <div className="month-picker-container">
            <div className="month-picker-header">
                <Button type="text" shape="circle" icon={<LeftOutlined />} onClick={() => setPickerYear(pickerYear - 1)} />
                <Text strong>{pickerYear}</Text>
                <Button type="text" shape="circle" icon={<RightOutlined />} onClick={() => setPickerYear(pickerYear + 1)} />
            </div>
            <div className="month-picker-grid">
            {moment.months().map((_, index) => (
                <Button
                key={index} type={currentDate.year() === pickerYear && currentDate.month() === index ? "primary" : "text"} className="month-picker-button"
                onClick={() => { setCurrentDate(moment({ year: pickerYear, month: index })); setIsMonthPickerVisible(false); }}>
                {mesesEmPortugues[index].substring(0, 3)}
                </Button>
            ))}
            </div>
        </div>
    );

    const renderPopoverContent = (event) => {
        if (event.isPf) {
            const isCompleted = event.status === 'Concluído';
            return (
                <div className="popover-content-wrapper">
                    <Title level={5} className="popover-title">{event.title}<Tag color={isCompleted ? "default" : "blue"}>{event.status}</Tag></Title>
                    <Text type="secondary" className="popover-time"><ClockCircleOutlined /> {moment(event.start).format('DD/MM/YYYY [às] HH:mm')}</Text>
                    {event.description && <Paragraph className="popover-notes"><InfoCircleOutlined /> {event.description}</Paragraph>}
                    <Divider className="popover-divider" />
                    <Space className="popover-actions">
                        <Button onClick={() => handleLifecycleAction(isCompleted ? 'schedule' : 'complete', event)} icon={<CheckCircleOutlined />}>{isCompleted ? "Reabrir" : "Concluir"}</Button>
                        <Popconfirm title="Tem certeza?" onConfirm={() => handleDelete(event.appointmentId)} okText="Sim"><Button danger icon={<DeleteOutlined />}>Excluir</Button></Popconfirm>
                    </Space>
                </div>
            );
        }
        return (
            <div className="popover-content-wrapper">
                <Title level={5} className="popover-title">{event.title}<Tag color={event.status === 'Concluído' ? "default" : (event.status === 'Confirmado' ? 'cyan' : 'blue')}>{event.status}</Tag></Title>
                <Text type="secondary" className="popover-time"><ClockCircleOutlined /> {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</Text>
                {event.description && <Paragraph className="popover-notes"><InfoCircleOutlined /> {event.description}</Paragraph>}
                {event.services?.length > 0 && (<><Divider /><div className="popover-clients-section"><Text strong><AppstoreAddOutlined /> Serviços</Text><div>{event.services.map(s => <Tag key={s.id}>{s.name}</Tag>)}</div></div></>)}
                {event.businessClients?.length > 0 && (<><Divider /><div className="popover-clients-section"><Text strong><TeamOutlined /> Clientes</Text><Avatar.Group maxCount={4}>{event.businessClients.filter(Boolean).map(c => (<Tooltip title={c.name} key={c.id}><Avatar src={c.photoUrl} icon={<UserOutlined />} onClick={() => showClientDetailsModal(c)} className="popover-client-avatar"/></Tooltip>))}</Avatar.Group></div></>)}
                <Divider className="popover-divider" />
                <Space className="popover-actions">
                    {event.status === 'Pendente' && <Button onClick={() => handleLifecycleAction('confirm', event)} icon={<LikeOutlined />}>Confirmar</Button>}
                    {event.status === 'Confirmado' && <Button onClick={() => handleLifecycleAction('complete', event)} icon={<CheckCircleOutlined />}>Concluir</Button>}
                    <Popconfirm title="Excluir este agendamento?" onConfirm={() => handleDelete(event.appointmentId)}><Button danger icon={<DeleteOutlined />}>Excluir</Button></Popconfirm>
                </Space>
            </div>
        );
    };

    const renderCalendarGrid = () => {
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
                            {d.events.filter(e => e.display === 'background').map(evt => (<div key={evt.id} className="background-event-block" style={{ backgroundColor: evt.backgroundColor }}><Tooltip title={evt.title}><span>{evt.title}</span></Tooltip></div>))}
                            <div className="appointments-container">{d.events.filter(e => e.type === 'appointment').map(evt => (<Popover key={evt.id} content={renderPopoverContent(evt)} trigger="click" open={popoverVisibleFor === evt.id} onOpenChange={v => setPopoverVisibleFor(v ? evt.id : null)}><div className="appointment-pill" style={{ backgroundColor: evt.backgroundColor, borderLeftColor: darkenColor(evt.backgroundColor, 0.2) }}><Space size={4}><span className="pill-time">{moment(evt.start).format('HH:mm')}</span><span className="pill-title">{evt.title}</span></Space></div></Popover>))}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    const handleLifecycleAction = async (action, event) => {
        if (!currentProfile || !event) return;
        const appointmentId = event.appointmentId;
        setPopoverVisibleFor(null);
        message.loading({ content: 'Processando...', key: `appt-action-${appointmentId}` });
        try {
            if (action === 'schedule' && event.isPf) {
                await apiClient.put(`/financial-accounts/${currentProfile.id}/appointments/${appointmentId}`, { status: 'Scheduled' });
            } else {
                await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments/${appointmentId}/${action}`);
            }
            message.success({ content: `Agendamento atualizado!`, key: `appt-action-${appointmentId}` });
            handleAppointmentCreationSuccess();
        } catch (error) { message.error({ content: `Falha ao atualizar agendamento.`, key: `appt-action-${appointmentId}` }); }
      };
    
    const handleDelete = async (id) => {
        if (!currentProfile) return;
        setPopoverVisibleFor(null);
        message.loading({ content: 'Excluindo...', key: `delete-appt-${id}` });
        try {
          await apiClient.delete(`/financial-accounts/${currentProfile.id}/appointments/${id}`);
          message.success({ content: "Agendamento excluído!", key: `delete-appt-${id}`, duration: 2 });
          handleAppointmentCreationSuccess();
        } catch (error) { message.error({ content: `Falha ao excluir agendamento.`, key: `delete-appt-${id}` }); }
    };

    const showClientDetailsModal = async (client) => {
        if (!currentProfile || !client) return;
        setPopoverVisibleFor(null);
        setIsClientDetailsModalVisible(true);
        setLoadingClientDetails(true);
        setSelectedClientForDetails(null);
        try {
          if (client.id) {
            const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients/${client.id}/details`);
            setSelectedClientForDetails(response.data.data);
          }
        } catch (error) { console.error("Erro ao buscar detalhes do cliente:", error); handleClientDetailsModalCancel(); } finally { setLoadingClientDetails(false); }
    };
    const handleClientDetailsModalCancel = () => { setIsClientDetailsModalVisible(false); setSelectedClientForDetails(null); };
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const menu = (<Menu onClick={({ key }) => { if (key === 'pj_client') handleShowPjClientModal(); else if (key === 'pj_service') handleShowPjServiceModal(); setIsDropdownOpen(false); }}><Menu.Item key="pj_client" icon={<UserOutlined />}>Agendamento com Cliente</Menu.Item><Menu.Item key="pj_service" icon={<AppstoreAddOutlined />}>Agendamento com Serviço</Menu.Item></Menu>);

    if (loadingProfiles) return (<div className="loading-container"><Spin size="large" /></div>);
    if (!isAuthenticated && !loadingProfiles) return (<Content className="dark-placeholder-content"><Title level={3}>Acesso Negado</Title></Content>);
    if (!currentProfile && isAuthenticated && !loadingProfiles) return (<Content className="dark-placeholder-content"><Title level={3}>Nenhum Perfil Selecionado</Title></Content>);

    return (
        <ConfigProvider locale={ptBR}>
            <Content className="agendamentos-page-content">
                <Card bordered={false} className="agendamentos-calendar-card">
                    <Row justify="space-between" align="middle" className="calendar-main-header">
                        <Col><Title level={2} className="page-title-agendamentos">{isBusinessProfile ? 'Agenda' : 'Calendário'}<Text className="profile-name-header"> / {currentProfile?.name}</Text></Title></Col>
                        <Col><Space><Popover content={renderMonthPickerContent} trigger="click" open={isMonthPickerVisible} onOpenChange={setIsMonthPickerVisible}><Title level={4} className="clickable-month-title">{getFormattedMonthTitle(currentDate)}</Title></Popover><Tooltip title="Mês Anterior"><Button shape="circle" icon={<LeftOutlined />} onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))} /></Tooltip><Tooltip title="Próximo Mês"><Button shape="circle" icon={<RightOutlined />} onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))} /></Tooltip><Button onClick={() => setCurrentDate(moment())}>Hoje</Button></Space></Col>
                    </Row>
                    <div className="calendar-container">
                        <div className="calendar-header-days">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(wd => <div key={wd} className="calendar-weekday">{wd}</div>)}</div>
                        {isLoading ? <div className="loading-container" style={{height: '50vh'}}><Spin size="large"/></div> : renderCalendarGrid()}
                    </div>
                </Card>

                {isBusinessProfile ? (<Dropdown overlay={menu} placement="topRight" arrow={{ pointAtCenter: true }} open={isDropdownOpen} onOpenChange={setIsDropdownOpen} trigger={['click']}><FloatButton icon={<PlusOutlined />} type="primary" tooltip="Novo Agendamento" onClick={() => setIsDropdownOpen(true)} /></Dropdown>) : (<FloatButton icon={<PlusOutlined />} type="primary" tooltip="Novo Agendamento" onClick={handleShowPfModal} />)}
            </Content>

            <ModalPfAppointment open={isPfModalVisible} onCancel={handleCancelAllModals} onSuccess={handleAppointmentCreationSuccess} currentProfile={currentProfile} />
            <ModalPjClientAppointment open={isPjClientModalVisible} onCancel={handleCancelAllModals} onSuccess={handleAppointmentCreationSuccess} businessClientsList={businessClientsList} loadingBusinessClients={loadingBusinessClients} currentProfile={currentProfile} />
            <ModalPjServiceAppointment open={isPjServiceModalVisible} onCancel={handleCancelAllModals} onSuccess={handleAppointmentCreationSuccess} currentProfile={currentProfile} />
        
            {isBusinessProfile && <Modal title={<Space><TeamOutlined />Detalhes do Cliente</Space>} open={isClientDetailsModalVisible} onCancel={handleClientDetailsModalCancel} footer={[<Button key="close" onClick={handleClientDetailsModalCancel}> Fechar</Button>]} className="client-details-modal" width={600}>{loadingClientDetails || !selectedClientForDetails ? <div className="loading-container" style={{height: 300}}><Spin/></div> : (<div className="client-details-content"><Avatar size={80} src={selectedClientForDetails.photoUrl} icon={<UserOutlined />} className="client-details-avatar" /><Title level={4} className="client-details-name">{selectedClientForDetails.name}</Title><Space size="large" wrap style={{justifyContent: 'center', marginBottom: 24}}>{selectedClientForDetails.email && <Text copyable><MailOutlined /> {selectedClientForDetails.email}</Text>}{selectedClientForDetails.phone && <Text copyable><PhoneOutlined /> {selectedClientForDetails.phone}</Text>}</Space>{selectedClientForDetails.notes && <Paragraph className="client-details-notes" type='secondary'><InfoCircleOutlined /> {selectedClientForDetails.notes}</Paragraph>}<Divider>Atividade do Cliente</Divider><Row gutter={16} style={{textAlign: 'left'}}><Col xs={24} md={12}><Title level={5}><DollarCircleOutlined /> Faturamento</Title><Statistic title="Total Gasto" value={selectedClientForDetails.totalFaturado || 0} precision={2} prefix="R$" /></Col><Col xs={24} md={12}><Title level={5}><CarryOutOutlined /> Histórico Recente</Title><List itemLayout="horizontal" dataSource={selectedClientForDetails.appointmentHistory || []} size="small" className="client-history-list" locale={{emptyText: "Nenhum histórico encontrado."}} renderItem={item => (<List.Item><List.Item.Meta avatar={<ShoppingOutlined />} title={<Text>{item.title}</Text>} description={`${moment(item.eventDateTime).format('DD/MM/YY')} - R$ ${item.services.reduce((acc, s) => acc + parseFloat(s.price || 0), 0).toFixed(2)}`} /></List.Item>)} /></Col></Row></div>)}</Modal>}
        </ConfigProvider>
    );
};

export default AgendamentosPage;