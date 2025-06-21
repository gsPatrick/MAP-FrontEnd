// src/pages/PublicBookingPage/PublicBookingPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Input, ConfigProvider, Result, Spin, Button, Typography, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import ptBR from 'antd/lib/locale/pt_BR';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { RRule } from 'rrule';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
  LeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GoldOutlined,
  CalendarOutlined as StepCalendarIcon,
  ShoppingOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

import apiClient from '../../services/api';
import './PublicBookingPage.css';

dayjs.locale('pt-br');

const StepIndicator = ({ currentStep }) => (
  <div className="step-indicator">
    {[1, 2, 3].map(step => (
      <React.Fragment key={step}>
        <div className={`step-node ${currentStep >= step ? 'active' : ''}`}>
          {currentStep > step ? <CheckCircleOutlined /> : step}
        </div>
        {step < 3 && <div className={`step-connector ${currentStep > step ? 'active' : ''}`} />}
      </React.Fragment>
    ))}
  </div>
);

const PublicBookingPage = () => {
  const { financialAccountId } = useParams();
  
  const [step, setStep] = useState(1);
  const [providerInfo, setProviderInfo] = useState({ providerName: '', services: [] });
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  
  const [selectedServices, setSelectedServices] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [clientDetails, setClientDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [form] = Form.useForm();

  const [availabilityRules, setAvailabilityRules] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!financialAccountId) {
        setPageError("Página de agendamento não encontrada. O link parece estar inválido.");
        setPageLoading(false);
        return;
      }
      try {
        const [providerResponse, rulesResponse] = await Promise.all([
          apiClient.get(`/public/booking/${financialAccountId}`),
          apiClient.get(`/availability/${financialAccountId}`)
        ]);
        
        setProviderInfo(providerResponse.data.data || { providerName: 'Serviço Indisponível', services: [] });
        setAvailabilityRules(rulesResponse.data.data || []);

      } catch (error) {
        setPageError(error.response?.data?.message || "Não foi possível carregar as informações desta página. Verifique o link e tente novamente.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchInitialData();
  }, [financialAccountId]);

  const fetchAvailableSlots = useCallback(async (date) => {
    if (!date || selectedServices.length === 0) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    setAvailableSlots([]);
    try {
      const response = await apiClient.get(`/public/booking/${financialAccountId}/availability`, {
        params: {
          date: date.format('YYYY-MM-DD'),
          serviceIds: selectedServices.join(','),
        },
      });
      setAvailableSlots(response.data.data.availableSlots || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Erro ao buscar horários.");
    } finally {
      setSlotsLoading(false);
    }
  }, [financialAccountId, selectedServices]);

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
    setSelectedDate(null);
    setSelectedSlot(null);
  };
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchAvailableSlots(date);
  };

  const handleDetailsSubmit = async (values) => {
    setIsSubmitting(true);
    setClientDetails(values);

    const payload = {
      clientDetails: values,
      serviceIds: selectedServices,
      eventDateTime: dayjs(`${selectedDate.format('YYYY-MM-DD')}T${selectedSlot}`).toISOString(),
    };

    try {
      await apiClient.post(`/public/booking/${financialAccountId}/schedule`, payload);
      setBookingResult('success');
    } catch (error) {
      if (error.response?.status === 409) {
        setBookingResult('error_conflict');
      } else {
        setBookingResult('error_generic');
      }
    } finally {
      setIsSubmitting(false);
      setStep(4);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedServices([]);
    setSelectedDate(null);
    setSelectedSlot(null);
    setClientDetails(null);
    setBookingResult(null);
    form.resetFields();
  };

  const isDateAvailable = useCallback((date) => {
    if (date.isBefore(dayjs().startOf('day'))) return false;

    const dayOff = availabilityRules.find(rule => 
      rule.type === 'day_off' && dayjs(rule.specificDate).isSame(date, 'day')
    );
    if (dayOff) return false;

    const workRule = availabilityRules.find(rule => rule.type === 'work');
    if (!workRule || !workRule.rrule) return false;

    try {
      const rrule = RRule.fromString(workRule.rrule);
      const occurrences = rrule.between(date.startOf('day').toDate(), date.endOf('day').toDate(), true);
      return occurrences.length > 0;
    } catch (e) {
      console.error("Erro ao processar RRULE:", e);
      return false;
    }
  }, [availabilityRules]);

  const generateCalendarDays = (month) => {
    const startOfMonth = month.startOf('month');
    const firstDayOfWeek = startOfMonth.day();
    const daysInMonth = month.daysInMonth();
    
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ key: `empty-start-${i}`, isEmpty: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const day = startOfMonth.date(i);
        days.push({
            key: day.format('YYYY-MM-DD'),
            date: day,
            isAvailable: isDateAvailable(day),
            isEmpty: false,
        });
    }
    return days;
  };

  // <<< MUDANÇA: Adicionada verificação de segurança
  const { totalPrice, totalDuration } = useMemo(() => {
    if (!providerInfo || !providerInfo.services) {
      return { totalPrice: 0, totalDuration: 0 };
    }
    const selected = providerInfo.services.filter(s => selectedServices.includes(s.id));
    const price = selected.reduce((sum, s) => sum + parseFloat(s.price), 0);
    const duration = selected.reduce((sum, s) => sum + s.durationMinutes, 0);
    return { totalPrice: price, totalDuration: duration };
  }, [selectedServices, providerInfo]);

  const SummaryPanel = () => (
    <div className="booking-summary-panel">
      <h3 className="summary-title">Resumo do Agendamento</h3>
      <div className="summary-provider-name">{providerInfo.providerName}</div>
      <div className="summary-divider" />
      
      <div className="summary-section">
        <h4 className="summary-section-title">Serviços Selecionados</h4>
        {selectedServices.length > 0 ? (
          <ul className="summary-services-list">
            {providerInfo.services.filter(s => selectedServices.includes(s.id)).map(s => (
              <li key={s.id}>
                <span>{s.name}</span>
                <span>R$ {parseFloat(s.price).toFixed(2).replace('.', ',')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="summary-placeholder">Selecione um ou mais serviços.</p>
        )}
      </div>

      {totalPrice > 0 && (
        <>
          <div className="summary-divider" />
          <div className="summary-total">
            <span>Duração Total:</span>
            <strong>{totalDuration} min</strong>
          </div>
          <div className="summary-total">
            <span>Valor Total:</span>
            <strong className="price-highlight">R$ {totalPrice.toFixed(2).replace('.', ',')}</strong>
          </div>
        </>
      )}

      {selectedDate && selectedSlot && (
         <>
          <div className="summary-divider" />
          <div className="summary-section">
            <h4 className="summary-section-title">Data e Hora</h4>
            <p className="summary-datetime-info">
              <StepCalendarIcon /> {dayjs(selectedDate).format('dddd, DD [de] MMMM')}
            </p>
             <p className="summary-datetime-info">
              <ClockCircleOutlined /> {selectedSlot}
            </p>
          </div>
        </>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="step-content-wrapper">
            <h2 className="step-title">Escolha os Serviços</h2>
            <p className="step-subtitle">Selecione um ou mais serviços para iniciar seu agendamento.</p>
            <div className="services-container-scrollable">
              <div className="services-grid">
                {providerInfo.services.map(service => (
                  <motion.div
                    key={service.id}
                    className={`service-card ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                    onClick={() => handleServiceToggle(service.id)}
                    whileHover={{ scale: 1.03, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <div className="service-card-check"><CheckCircleOutlined /></div>
                    <div className="service-card-icon"><GoldOutlined /></div>
                    <h4 className="service-card-title">{service.name}</h4>
                    <p className="service-card-duration">{service.durationMinutes} min</p>
                    <div className="service-card-price">R$ {parseFloat(service.price).toFixed(2).replace('.', ',')}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="step-content-wrapper">
            <h2 className="step-title">Selecione a Data e o Horário</h2>
            <p className="step-subtitle">Escolha o melhor dia e horário para você.</p>
            <div className="date-time-selector">
              <div className="month-navigator">
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))} disabled={currentMonth.isSame(dayjs(), 'month')} />
                <span className="month-name">{currentMonth.format('MMMM [de] YYYY')}</span>
                <Button type="text" icon={<ArrowRightOutlined />} onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))} />
              </div>
              <div className="days-grid">
                {generateCalendarDays(currentMonth).map((day) => 
                  day.isEmpty ? (
                    <div key={day.key} className="day-card-empty" />
                  ) : (
                    <motion.div
                      key={day.key}
                      className={`day-card ${selectedDate?.isSame(day.date, 'day') ? 'selected' : ''}`}
                      onClick={() => day.isAvailable && handleDateSelect(day.date)}
                      style={{ 
                        cursor: day.isAvailable ? 'pointer' : 'not-allowed', 
                        opacity: day.isAvailable ? 1 : 0.4 
                      }}
                      whileHover={day.isAvailable ? { scale: 1.05 } : {}}
                      whileTap={day.isAvailable ? { scale: 0.95 } : {}}
                    >
                      <div className="day-card-weekday">{day.date.format('ddd')}</div>
                      <div className="day-card-day">{day.date.format('DD')}</div>
                    </motion.div>
                  )
                )}
              </div>
            </div>

            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  className="slots-container"
                  initial={{ opacity: 0, height: 0, y: 20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } }}
                  exit={{ opacity: 0, height: 0, y: 20, transition: { duration: 0.3 } }}
                >
                  <h3 className="slots-title">Horários disponíveis para {dayjs(selectedDate).format('DD/MM')}</h3>
                  {slotsLoading ? (
                    <div className="slots-loading">
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: 'var(--color-gold)'}} spin />} />
                      <span>Buscando horários...</span>
                    </div>
                  ) : (
                    <div className="slots-grid">
                      {availableSlots.length > 0 ? availableSlots.map(slot => (
                        <motion.button
                          key={slot}
                          className={`slot-button ${selectedSlot === slot ? 'active' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {slot}
                        </motion.button>
                      )) : <Typography.Text type="secondary">Nenhum horário disponível para esta data com os serviços selecionados.</Typography.Text>}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="step-content-wrapper">
            <h2 className="step-title">Seus Dados</h2>
            <p className="step-subtitle">Falta pouco! Preencha seus dados para confirmarmos o agendamento.</p>
            <Form form={form} layout="vertical" onFinish={handleDetailsSubmit} className="details-form">
              <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'Por favor, insira seu nome.' }]}>
                <Input prefix={<UserOutlined />} size="large" placeholder="Seu nome" />
              </Form.Item>
              <Form.Item name="email" label="E-mail" rules={[{ required: true, message: 'Insira um e-mail válido.' }, { type: 'email', message: 'O e-mail não é válido.' }]}>
                <Input prefix={<MailOutlined />} size="large" placeholder="seu.email@exemplo.com" />
              </Form.Item>
              <Form.Item name="phone" label="Telefone (WhatsApp)" rules={[{ required: true, message: 'Insira seu telefone.' }]}>
                <Input prefix={<PhoneOutlined />} size="large" placeholder="(XX) 9XXXX-XXXX" />
              </Form.Item>
            </Form>
          </motion.div>
        );
      case 4:
        return (
           <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="step-content-wrapper">
            {bookingResult === 'success' ? (
              <Result
                className="booking-result success"
                icon={<div className="success-icon-wrapper"><CheckCircleOutlined /></div>}
                title="Agendamento Solicitado com Sucesso!"
                subTitle={`Obrigado, ${clientDetails?.name}! Seu agendamento no ${providerInfo.providerName} para ${dayjs(selectedDate).format('DD/MM')} às ${selectedSlot} foi recebido. Você receberá uma confirmação em breve.`}
                extra={[<Button key="new" type="primary" size="large" className="result-button" onClick={handleReset}>Agendar Outro Horário</Button>]}
              />
            ) : (
               <Result
                className="booking-result error"
                icon={<div className="error-icon-wrapper"><ExclamationCircleOutlined /></div>}
                title={bookingResult === 'error_conflict' ? "Ops! Horário Indisponível" : "Erro ao Agendar"}
                subTitle={bookingResult === 'error_conflict' ? `Lamentamos, ${clientDetails?.name}. O horário das ${selectedSlot} foi preenchido enquanto você finalizava. Por favor, escolha outro horário.` : "Ocorreu um erro inesperado. Por favor, tente novamente."}
                extra={[<Button key="back" type="primary" size="large" className="result-button" onClick={() => setStep(2)}>Escolher Outro Horário</Button>]}
              />
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (pageLoading) {
    return (
      <div className="public-booking-wrapper">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'var(--color-gold)'}} spin />} />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="public-booking-wrapper">
        <Result
          status="error"
          title="Página Indisponível"
          subTitle={pageError}
        />
      </div>
    );
  }

  return (
    <ConfigProvider locale={ptBR}>
      <div className="public-booking-wrapper">
        <div className="booking-container">
          <div className="booking-main-content">
            <div className="booking-header">
              <h1 className="provider-title"><ShoppingOutlined /> {providerInfo.providerName}</h1>
              {step < 4 && <StepIndicator currentStep={step} />}
            </div>
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
            
            {step < 4 && (
              <div className="step-navigation">
                {step > 1 ? (
                  <Button size="large" icon={<LeftOutlined />} className="nav-button prev" onClick={() => setStep(s => s - 1)}>
                    Voltar
                  </Button>
                ) : <div />}
                {step < 3 ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<RightOutlined />}
                    className="nav-button next"
                    onClick={() => setStep(s => s + 1)}
                    disabled={
                      (step === 1 && selectedServices.length === 0) ||
                      (step === 2 && (!selectedDate || !selectedSlot))
                    }
                  >
                    Avançar
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    icon={isSubmitting ? <LoadingOutlined /> : <CheckCircleOutlined />}
                    className="nav-button confirm"
                    onClick={() => form.submit()}
                    loading={isSubmitting}
                  >
                    Confirmar Agendamento
                  </Button>
                )}
              </div>
            )}
          </div>
          {step < 4 && <SummaryPanel />}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default PublicBookingPage;