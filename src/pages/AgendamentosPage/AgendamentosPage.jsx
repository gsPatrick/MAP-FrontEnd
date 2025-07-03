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
import moment from 'moment';
import 'moment/locale/pt-br';
import ptBR from 'antd/lib/locale/pt_BR';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import ModalPfAppointment from '../../modals/ModalPfAppointment/ModalPfAppointment'; // Importar novo modal PF
import ModalPjClientAppointment from '../../modals/ModalPjClientAppointment/ModalPjClientAppointment'; // Importar novo modal PJ Cliente

import './AgendamentosPage.css';

moment.locale('pt-br');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para submissão do modal PJ Serviço
  
  // --- Estados dos Modais ---
  const [isPfModalVisible, setIsPfModalVisible] = useState(false); // Novo estado para modal PF
  const [isPjClientModalVisible, setIsPjClientModalVisible] = useState(false); // Novo estado para modal PJ Cliente
  const [isPjServiceModalVisible, setIsPjServiceModalVisible] = useState(false); // Estado existente para modal PJ Serviço
  
  const [formPjService] = Form.useForm(); // Renomeado o form para PJ Service
  const [modalStepPjService, setModalStepPjService] = useState(0); // Renomeado step para PJ Service
  const [modalDataPjService, setModalDataPjService] = useState({}); // Renomeado data para PJ Service
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDateForSlots, setSelectedDateForSlots] = useState(null);

  const [currentDate, setCurrentDate] = useState(moment());
  const [popoverVisibleFor, setPopoverVisibleFor] = useState(null);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(moment().year());

  const [calendarEvents, setCalendarEvents] = useState([]); // Eventos para visualização PJ
  const [agendamentosPf, setAgendamentosPf] = useState([]); // Agendamentos para visualização PF
  
  const [businessClientsList, setBusinessClientsList] = useState([]);
  const [loadingBusinessClients, setLoadingBusinessClients] = useState(false);
  const [isClientDetailsModalVisible, setIsClientDetailsModalVisible] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  const [servicesList, setServicesList] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const isBusinessProfile = useMemo(() => ['PJ', 'MEI'].includes(currentProfile?.type), [currentProfile]);

  // --- Funções de Fetch de Dados ---
  const fetchAgendamentosClassic = useCallback(async () => {
    if (!currentProfile || !isAuthenticated || isBusinessProfile) { setAgendamentosPf([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments`, { params: { sortBy: 'eventDateTime', sortOrder: 'ASC', limit: 500 } });
      const mapped = response.data.data.map(app => ({
        id: app.id.toString(), titulo: app.title, prazo: app.eventDateTime,
        tipo: (app.associatedValue != null) ? 'Financeiro' : 'Geral',
        valor: app.associatedValue, concluido: app.status === 'Completed',
        notas: app.description || app.notes,
      }));
      setAgendamentosPf(mapped);
    } catch (error) { console.error("Erro ao carregar agendamentos (PF):", error); setAgendamentosPf([]); }
    finally { setIsLoading(false); }
  }, [currentProfile, isAuthenticated, isBusinessProfile]);

  const fetchCalendarEventsBusiness = useCallback(async () => {
    if (!currentProfile || !isAuthenticated || !isBusinessProfile) { setCalendarEvents([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const start = currentDate.clone().startOf('month').startOf('week');
      const end = currentDate.clone().endOf('month').endOf('week');
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments/agenda-view`, { params: { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') } });
      
      // Mapeia os eventos para garantir que os status e outros campos estejam em português
      const translatedEvents = response.data.data.map(event => ({
        ...event,
        status: translateStatus(event.status), // Traduz o status
        // Traduz o dia da semana e o mês se a API retornar em inglês
        start: moment.tz(event.start, 'UTC').locale('pt-br').toDate(), // Converte para data local e define locale
        end: moment.tz(event.end, 'UTC').locale('pt-br').toDate(),
      }));
      setCalendarEvents(translatedEvents);
    } catch (error) { console.error("Erro ao carregar eventos da agenda (PJ):", error); setCalendarEvents([]); }
    finally { setIsLoading(false); }
  }, [currentProfile, isAuthenticated, isBusinessProfile, currentDate]);

  // Função para traduzir status (exemplo)
  const translateStatus = (status) => {
    switch (status) {
      case 'Scheduled': return 'Pendente';
      case 'Confirmed': return 'Confirmado';
      case 'Completed': return 'Concluído';
      case 'Cancelled': return 'Cancelado';
      default: return status;
    }
  };

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

  // Efeito para carregar dados ao mudar de perfil ou carregar a página
  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      if (isBusinessProfile) {
        fetchCalendarEventsBusiness();
        fetchBusinessClientsForSelect();
        fetchServicesForSelect();
      } else {
        fetchAgendamentosClassic();
        setBusinessClientsList([]);
        setServicesList([]);
      }
    } else if (!isAuthenticated && !loadingProfiles) {
      setIsLoading(false);
      setAgendamentosPf([]);
      setCalendarEvents([]);
    }
  }, [currentProfile, isAuthenticated, loadingProfiles, isBusinessProfile, fetchAgendamentosClassic, fetchCalendarEventsBusiness, fetchBusinessClientsForSelect, fetchServicesForSelect]);

  // Efeito para refetchar dados PJ/MEI ao mudar o mês no calendário
   useEffect(() => {
        if (isBusinessProfile && currentProfile?.id && !loadingProfiles && isAuthenticated) {
             fetchCalendarEventsBusiness();
        }
   }, [currentDate, isBusinessProfile, currentProfile?.id, loadingProfiles, isAuthenticated, fetchCalendarEventsBusiness]);


const fetchAvailableSlots = useCallback(async (date, serviceIdsParam) => {
  if (!date || !serviceIdsParam || serviceIdsParam.length === 0 || !currentProfile?.id) {
    setAvailableSlots([]);
    setSlotsLoading(false);
    return;
  }

  setSlotsLoading(true);

  try {
    const response = await apiClient.get(`/public/booking/${currentProfile.id}/availability`, {
      params: {
        date: date.format('YYYY-MM-DD'),
        serviceIds: serviceIdsParam.join(','),
      },
    });
    setAvailableSlots(response.data.data.availableSlots || []);
  } catch (error) {
    setAvailableSlots([]);
  } finally {
    setSlotsLoading(false);
  }
}, [currentProfile?.id]);


  // --- Funções para Abrir Modais ---
  const handleShowPfModal = () => {
    setIsPfModalVisible(true);
  };

  const handleShowPjClientModal = () => {
    setIsPjClientModalVisible(true);
  };

  const handleShowPjServiceModal = () => {
    setModalStepPjService(0); // Reinicia os passos
    setModalDataPjService({}); // Reinicia os dados
    setSelectedDateForSlots(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    formPjService.resetFields();
    setIsPjServiceModalVisible(true);
  };

  // --- Funções de Cancelamento ---
  const handleCancelAllModals = () => {
    setIsPfModalVisible(false);
    setIsPjClientModalVisible(false);
    setIsPjServiceModalVisible(false);
    formPjService.resetFields(); // Resetar o formulário do modal de serviço
  };

  // --- Funções de Conclusão de Modal (Chamadas pelos modais filhos e pelo modal de serviço) ---
  const handleAppointmentCreationSuccess = () => {
    // Refetchar os dados de agendamento relevantes com base no tipo de perfil
    if (isBusinessProfile) {
      fetchCalendarEventsBusiness();
    } else {
      fetchAgendamentosClassic();
    }
  };


  // --- Funções de Manipulação do Modal PJ Serviço (Multi-step) ---
  const handlePjServiceModalNext = async () => {
    try {
      if (modalStepPjService === 0) { // Validar serviços
        const values = await formPjService.validateFields(['serviceIds']);
        setModalDataPjService(prev => ({ ...prev, ...values }));
        setSelectedDateForSlots(null); // Resetar data ao mudar serviços
        setSelectedSlot(null);
        setAvailableSlots([]);
        // Não avança de step aqui, a validação da data/hora acontece no step 1
        setModalStepPjService(prev => prev + 1);
      } else if (modalStepPjService === 1) { // Validar data/hora
        if (!selectedDateForSlots || !selectedSlot) {
            message.error('Por favor, selecione uma data e um horário.');
            return;
        }
        // Valida apenas se a data/slot foram selecionados, sem validar o form ainda
         setModalStepPjService(prev => prev + 1);
      } else if (modalStepPjService === 2) { // Validar clientes
         await formPjService.validateFields(['businessClientIds']);
         // Se chegou aqui, validação ok, pode ir para a submissão
         // A submissão acontece no onFinishModal, que é chamado pelo botão "Finalizar"
      }

    } catch (errorInfo) {
      console.log('Falha na validação PJ Service:', errorInfo);
    }
  };

  const handlePjServiceModalPrev = () => {
    setModalStepPjService(prev => prev - 1);
  };

  const onDateChangeInPjServiceModal = (date) => {
    setSelectedDateForSlots(date);
    setSelectedSlot(null);
    const { serviceIds } = formPjService.getFieldsValue(['serviceIds']);
    if (date && serviceIds && serviceIds.length > 0) {
      fetchAvailableSlots(date, serviceIds);
    } else {
      setAvailableSlots([]);
    }
  };
  
  const onFinishPjServiceModal = async () => {
    if (!currentProfile) return;
    setIsSubmitting(true); // Estado de submissão para o modal de serviço
    try {
        // Validar todos os campos do formulário de uma vez no final
        const values = await formPjService.validateFields();
        const finalModalData = { ...modalDataPjService, ...values };

        // A API retorna eventDateTime em UTC (com Z no final).
        // Para exibir corretamente no formato local e traduzido, vamos usar o moment.
        const eventDateTimeUTC = moment(finalModalData.eventDateTime); // Já deve vir como objeto moment se o modal estiver correto
        const finalEventDateTime = eventDateTimeUTC.toISOString();
        
        // Buscar detalhes dos serviços selecionados para calcular duração e título
        const serviceDetails = servicesList.filter(s => finalModalData.serviceIds.includes(s.id.toString()));
        // Traduzir os nomes dos serviços se a API retornar em inglês
        const translatedServiceNames = serviceDetails.map(s => s.name); // Assumindo que a API já retorna em português ou que servicesList já está traduzido
        const title = translatedServiceNames.join(' + ');
        const durationMinutes = serviceDetails.reduce((sum, s) => sum + s.durationMinutes, 0);

        const payload = {
          title: title,
          eventDateTime: finalEventDateTime,
          durationMinutes: durationMinutes > 0 ? durationMinutes : null, // Envia duração calculada
          businessClientIds: finalModalData.businessClientIds ? finalModalData.businessClientIds.map(id => parseInt(id, 10)) : [],
          serviceIds: finalModalData.serviceIds ? finalModalData.serviceIds.map(id => parseInt(id, 10)) : [],
          // Campos gerais opcionais que podem ser adicionados ao formulário do modal se necessário
          description: values.description, // Adicionar campo description se necessário
          location: values.location, // Adicionar campo location se necessário
          notes: values.notes, // Adicionar campo notes se necessário
          origin: 'system_pj_mei', // Definir a origem
        };
        
        // Validação final antes de enviar
        if (!payload.title || !payload.eventDateTime || payload.businessClientIds.length === 0 || payload.serviceIds.length === 0) {
             throw new Error("Dados incompletos para o agendamento de serviço.");
        }


        await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, payload);
        message.success("Agendamento criado com sucesso!");
        handleAppointmentCreationSuccess(); // Refetch
        handleCancelAllModals(); // Fecha o modal de serviço
    } catch (errorInfo) {
        console.log('Falha na submissão PJ Service:', errorInfo);
         if (errorInfo.errorFields) {
            // Mensagem de validação do Ant Design
         } else {
            // Outros erros (API, lógica)
            // Mensagem de erro já é tratada pelo interceptor do apiClient
         }
    } finally {
        setIsSubmitting(false); // Finaliza estado de submissão
    }
  };

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
          {translateStatus(event.status)} {/* Usando a função de tradução */}
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
            apps: agendamentosPf.filter(a => moment(a.prazo).isSame(day, 'day'))
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

  // --- Renderização dos Steps do Modal PJ Serviço ---
  const renderPjServiceModalContent = () => {
      switch (modalStepPjService) {
          case 0: // Selecionar Serviços
              return (
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
                          onChange={(selectedIds) => {
                            // Opcional: Calcular duração total e exibir para o usuário
                             const selectedSvcDetails = servicesList.filter(s => selectedIds.includes(s.id.toString()));
                             const calculatedDuration = selectedSvcDetails.reduce((sum, s) => sum + s.durationMinutes, 0);
                            // Você pode usar um estado para exibir a duração calculada na UI
                          }}
                      />
                  </Form.Item>
              );
          case 1: // Selecionar Data e Hora
              return (
                  <div className="modal-step-container">
                      <div className="modal-calendar-wrapper">
                          <Calendar fullscreen={false} onSelect={onDateChangeInPjServiceModal} value={selectedDateForSlots} />
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
              );
          case 2: // Selecionar Clientes e Detalhes Gerais
              return (
                  <>
                    <Form.Item
                        name="businessClientIds"
                        label="Selecione o(s) cliente(s) associado(s)"
                        rules={[{ required: true, message: 'Por favor, associe pelo menos um cliente!' }]}
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
                    {/* Adicionar campos gerais opcionais */}
                     <Form.Item
                        name="location"
                        label="Local (Opcional)"
                     >
                        <Input placeholder="Ex: Sala de Reunião, Videoconferência" />
                     </Form.Item>
                      <Form.Item
                        name="notes"
                        label="Observações Internas (Opcional)"
                      >
                        <TextArea rows={2} placeholder="Notas adicionais..." />
                      </Form.Item>
                  </>
              );
          default:
              return null;
      }
  };


  // --- Funções de Ações (Excluir, Confirmar, etc.) ---
  const handleLifecycleAction = async (action, event) => {
    if (!currentProfile || !event) return;
    setPopoverVisibleFor(null);
    message.loading({ content: 'Processando...', key: `appt-action-${event.appointmentId}` });
    try {
      const endpoint = `/financial-accounts/${currentProfile.id}/appointments/${event.appointmentId}/${action}`;
      await apiClient.post(endpoint);
      message.success({ content: `Agendamento ${action === 'confirm' ? 'confirmado' : 'concluído'}!`, key: `appt-action-${event.appointmentId}` });
      fetchCalendarEventsBusiness(); // Refetcha para atualizar o status no calendário
    } catch (error) {
      // O interceptor da API trata a exibição de erros
      message.error({ content: `Falha ao ${action} agendamento.`, key: `appt-action-${event.appointmentId}` });
    }
  };

  const handleDelete = async (id) => {
    if (!currentProfile) return;
    setPopoverVisibleFor(null);
    message.loading({ content: 'Excluindo...', key: `delete-appt-${id}` });
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/appointments/${id}`);
      message.success({ content: "Agendamento excluído!", key: `delete-appt-${id}`, duration: 2 });
      if (isBusinessProfile) {
        fetchCalendarEventsBusiness();
      } else {
        fetchAgendamentosClassic();
      }
    } catch (error) {
        message.error({ content: `Falha ao excluir agendamento.`, key: `delete-appt-${id}` });
    }
  };

  const toggleConcluidoClassic = async (app) => {
    if (!currentProfile || !app) return;
    setPopoverVisibleFor(null);
    message.loading({ content: 'Atualizando...', key: `update-appt-${app.id}` });
    try {
      await apiClient.put(`/financial-accounts/${currentProfile.id}/appointments/${app.id}`, {
        status: app.concluido ? 'Scheduled' : 'Completed'
      });
      message.success({ content: `Status alterado!`, key: `update-appt-${app.id}` });
      fetchAgendamentosClassic();
    } catch (error) {
        message.error({ content: `Falha ao atualizar status.`, key: `update-appt-${app.id}` });
    }
  };

  const showClientDetailsModal = async (client) => {
    if (!currentProfile || !client) return;
    setPopoverVisibleFor(null); // Fecha o popover antes de abrir o modal
    setIsClientDetailsModalVisible(true);
    setLoadingClientDetails(true);
    setSelectedClientForDetails(null); // Limpa detalhes anteriores
    try {
      // Verifica se o client.id é válido antes de fazer a requisição
      if (client.id) {
        const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients/${client.id}/details`);
        setSelectedClientForDetails(response.data.data);
      } else {
        // Trata o caso onde client.id pode não estar disponível ou ser inválido
        message.error("ID do cliente inválido.");
        handleClientDetailsModalCancel(); // Fecha o modal se o ID for inválido
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do cliente:", error);
      // Tenta exibir uma mensagem de erro mais específica se disponível
      if (error.response && error.response.data && error.response.data.message) {
        message.error(`Erro ao carregar detalhes: ${error.response.data.message}`);
      } else {
        message.error("Não foi possível carregar os detalhes deste cliente.");
      }
      handleClientDetailsModalCancel(); // Fecha o modal em caso de erro
    } finally {
      setLoadingClientDetails(false);
    }
  };
  const handleClientDetailsModalCancel = () => { setIsClientDetailsModalVisible(false); setSelectedClientForDetails(null); };


  // --- Conteúdo do Dropdown do Botão '+' ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const menu = (
    <Menu
      onClick={({ key }) => {
        if (key === 'pj_client') {
          handleShowPjClientModal();
        } else if (key === 'pj_service') {
          handleShowPjServiceModal();
        }
        // Fechar o dropdown após a seleção de um item
        setIsDropdownOpen(false);
      }}
    >
      <Menu.Item key="pj_client" icon={<UserOutlined />}>
        Agendamento com Cliente
      </Menu.Item>
      <Menu.Item key="pj_service" icon={<AppstoreAddOutlined />}>
        Agendamento com Serviço
      </Menu.Item>
    </Menu>
  );


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
                        {/* Formata o título do mês e ano para Português */}
                        <Title level={4} className="clickable-month-title">{moment(currentDate).format('MMMM [de] YYYY')}</Title>
                    </Popover>
                    <Tooltip title="Mês Anterior"><Button shape="circle" icon={<LeftOutlined />} onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))} /></Tooltip>
                    <Tooltip title="Próximo Mês"><Button shape="circle" icon={<RightOutlined />} onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))} /></Tooltip>
                    <Button onClick={() => setCurrentDate(moment())}>Hoje</Button>
                </Space>
            </Col>
          </Row>
          <div className="calendar-container">
            {/* Dias da semana em Português */}
            <div className="calendar-header-days">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(wd => <div key={wd} className="calendar-weekday">{wd}</div>)}</div>
            {isLoading ? <div className="loading-container" style={{height: '50vh'}}><Spin size="large"/></div> : ( isBusinessProfile ? renderBusinessCalendar() : renderClassicCalendar() )}
          </div>
        </Card>

        {/* FloatButton com Dropdown ou Direto */}
        {isBusinessProfile ? (
            <Dropdown
              overlay={menu}
              placement="topRight" // Ajustado para aparecer acima do botão
              arrow={{ pointAtCenter: true }}
              open={isDropdownOpen} // Controla a abertura do dropdown
              onOpenChange={(open) => setIsDropdownOpen(open)} // Atualiza o estado quando o dropdown é aberto/fechado
              trigger={['click']} // O dropdown só abre ao clicar no FloatButton
            >
                <FloatButton
                    icon={<PlusOutlined />}
                    type="primary"
                    tooltip="Novo Agendamento"
                    onClick={() => setIsDropdownOpen(true)} // Ao clicar, abre o dropdown
                />
            </Dropdown>
        ) : (
            <FloatButton icon={<PlusOutlined />} type="primary" tooltip="Novo Agendamento" onClick={handleShowPfModal} />
        )}

      </Content>

      {/* Modal de Agendamento PF */}
      <ModalPfAppointment
        open={isPfModalVisible}
        onCancel={handleCancelAllModals}
        onSuccess={handleAppointmentCreationSuccess}
      />

      {/* Modal de Agendamento PJ Cliente */}
       <ModalPjClientAppointment
        open={isPjClientModalVisible}
        onCancel={handleCancelAllModals}
        onSuccess={handleAppointmentCreationSuccess}
        businessClientsList={businessClientsList}
        loadingBusinessClients={loadingBusinessClients}
      />

      {/* Modal de Agendamento PJ Serviço (Multi-step) */}
      <Modal
        title="Novo Agendamento com Serviço"
        open={isPjServiceModalVisible}
        onCancel={handleCancelAllModals}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button onClick={handlePjServiceModalPrev} disabled={modalStepPjService === 0}>
              Anterior
            </Button>
            {modalStepPjService < 2 ? ( // Último step é o 2 (Clientes/Geral)
              <Button type="primary" onClick={handlePjServiceModalNext} disabled={modalStepPjService === 1 && (!selectedDateForSlots || !selectedSlot)}>
                Próximo
              </Button>
            ) : (
              <Button type="primary" onClick={onFinishPjServiceModal} loading={isSubmitting}>
                Finalizar Agendamento
              </Button>
            )}
          </div>
        }
        destroyOnClose
        width={modalStepPjService === 1 ? 800 : 600} // Modal maior no passo do calendário
        className="agendamento-modal"
      >
        <Steps current={modalStepPjService} style={{ marginBottom: 24 }} items={[
            { title: 'Serviços' },
            { title: 'Data e Hora' },
            { title: 'Cliente(s) e Detalhes' } // Renomeado o último passo
        ]} />
        <Form form={formPjService} layout="vertical" initialValues={{ serviceIds: [], businessClientIds: [] }}>
          <div className="steps-content" style={{ marginTop: 16 }}>
            {renderPjServiceModalContent()} {/* Renderiza o conteúdo do step atual */}
          </div>
        </Form>
      </Modal>


      {isBusinessProfile &&
        <Modal title={<Space><TeamOutlined />Detalhes do Cliente</Space>} open={isClientDetailsModalVisible} onCancel={handleClientDetailsModalCancel} footer={[<Button key="close" onClick={handleClientDetailsModalCancel}> Fechar</Button>]} className="client-details-modal" width={600}>
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
                                        description={`${moment(item.eventDateTime).format('DD/MM/YY')} - R$ ${item.services.reduce((acc, s) => acc + parseFloat(s.price), 0).toFixed(2)}`}
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