// src/modals/ModalPjServiceAppointment/ModalPjServiceAppointment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Select, Button, message, Steps, Calendar, Divider, Spin, Empty, Input } from 'antd';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const ModalPjServiceAppointment = ({ open, onCancel, onSuccess, currentProfile }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(0);

    const [servicesList, setServicesList] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    const [businessClientsList, setBusinessClientsList] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);

    const [selectedDateForSlots, setSelectedDateForSlots] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const fetchDropdownData = useCallback(async () => {
        if (!currentProfile?.id) return;
        setLoadingServices(true);
        setLoadingClients(true);
        try {
            const [servicesRes, clientsRes] = await Promise.all([
                apiClient.get(`/services/${currentProfile.id}`, { params: { isActive: true, limit: 500 } }),
                apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`, { params: { isActive: true, limit: 500 } })
            ]);
            setServicesList(servicesRes.data.data.services.map(s => ({ ...s, value: s.id.toString(), label: s.name })) || []);
            setBusinessClientsList(clientsRes.data.data.map(c => ({ ...c, value: c.id.toString(), label: c.name })) || []);
        } catch (error) {
            console.error("Erro ao buscar dados para modal:", error);
        } finally {
            setLoadingServices(false);
            setLoadingClients(false);
        }
    }, [currentProfile?.id]);
    
    useEffect(() => {
        if(open) {
            fetchDropdownData();
        } else {
            // Reset state on close
            setStep(0);
            form.resetFields();
            setSelectedDateForSlots(null);
            setSelectedSlot(null);
            setAvailableSlots([]);
        }
    }, [open, fetchDropdownData, form]);

    const fetchAvailableSlots = useCallback(async (date, serviceIds) => {
        if (!date || !serviceIds || serviceIds.length === 0 || !currentProfile?.id) {
            setAvailableSlots([]);
            return;
        }
        setSlotsLoading(true);
        try {
            const response = await apiClient.get(`/public/booking/${currentProfile.id}/availability`, {
                params: { date: date.format('YYYY-MM-DD'), serviceIds: serviceIds.join(',') },
            });
            setAvailableSlots(response.data.data.availableSlots || []);
        } catch (error) {
            setAvailableSlots([]);
            message.error("Erro ao buscar horários disponíveis.");
        } finally {
            setSlotsLoading(false);
        }
    }, [currentProfile?.id]);

    const handleNext = async () => {
        try {
            if (step === 0) {
                await form.validateFields(['serviceIds']);
                setStep(1);
            } else if (step === 1) {
                if (!selectedDateForSlots || !selectedSlot) {
                    message.error('Por favor, selecione uma data e um horário.');
                    return;
                }
                setStep(2);
            }
        } catch (errorInfo) {
            console.log('Falha na validação:', errorInfo);
        }
    };

    const handlePrev = () => setStep(s => s - 1);
    
    const onDateChangeInModal = (date) => {
        setSelectedDateForSlots(date);
        setSelectedSlot(null);
        const { serviceIds } = form.getFieldsValue(['serviceIds']);
        if (date && serviceIds && serviceIds.length > 0) {
          fetchAvailableSlots(date, serviceIds);
        } else {
          setAvailableSlots([]);
        }
    };
    
    const onFinish = async (values) => {
        if (!selectedDateForSlots || !selectedSlot) {
            message.error('Data ou horário não selecionados.');
            return;
        }
        setSubmitting(true);
        try {
            const serviceDetails = servicesList.filter(s => values.serviceIds.includes(s.id.toString()));
            const title = serviceDetails.map(s => s.name).join(' + ');
            const durationMinutes = serviceDetails.reduce((sum, s) => sum + s.durationMinutes, 0);

            const payload = {
                title,
                durationMinutes,
                eventDateTime: dayjs(`${selectedDateForSlots.format('YYYY-MM-DD')}T${selectedSlot}`).toISOString(),
                businessClientIds: values.businessClientIds.map(id => parseInt(id, 10)),
                serviceIds: values.serviceIds.map(id => parseInt(id, 10)),
                location: values.location,
                notes: values.notes,
                origin: 'system_pj_mei',
            };
            
            await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, payload);
            message.success("Agendamento criado com sucesso!");
            onSuccess();
            onCancel();
        } catch (error) {
            // Interceptor trata
        } finally {
            setSubmitting(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <Form.Item name="serviceIds" label="Selecione o(s) serviço(s)" rules={[{ required: true }]}>
                        <Select mode="multiple" allowClear loading={loadingServices} placeholder="Selecione os serviços prestados">
                            {servicesList.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                        </Select>
                    </Form.Item>
                );
            case 1:
                return (
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div><Calendar fullscreen={false} onSelect={onDateChangeInModal} value={selectedDateForSlots} /></div>
                        <div style={{ flex: 1 }}>
                            {slotsLoading ? <Spin /> : 
                             availableSlots.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px'}}>
                                    {availableSlots.map(slot => (
                                        <Button key={slot} type={selectedSlot === slot ? 'primary' : 'default'} onClick={() => setSelectedSlot(slot)}>{slot}</Button>
                                    ))}
                                </div>
                             ) : <Empty description="Nenhum horário disponível." />}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <>
                        <Form.Item name="businessClientIds" label="Selecione o(s) cliente(s)" rules={[{ required: true }]}>
                            <Select mode="multiple" allowClear loading={loadingClients} placeholder="Selecione os clientes">
                                {businessClientsList.map(c => <Option key={c.id} value={c.id}>{c.label}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="location" label="Local (Opcional)"><Input placeholder="Ex: Sala de Reunião" /></Form.Item>
                        <Form.Item name="notes" label="Observações Internas (Opcional)"><TextArea rows={2} /></Form.Item>
                    </>
                );
            default: return null;
        }
    };

    return (
        <Modal
            title="Novo Agendamento com Serviço"
            open={open}
            onCancel={onCancel}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={handlePrev} disabled={step === 0}>Anterior</Button>
                    <div>
                        {step < 2 ? (
                            <Button type="primary" onClick={handleNext}>Próximo</Button>
                        ) : (
                            <Button type="primary" onClick={() => form.submit()} loading={submitting}>Finalizar</Button>
                        )}
                    </div>
                </div>
            }
            destroyOnClose width={step === 1 ? 800 : 600}
        >
            <Steps current={step} items={[{ title: 'Serviços' }, { title: 'Data/Hora' }, { title: 'Cliente(s)' }]} style={{ marginBottom: 24 }} />
            <Form form={form} layout="vertical" onFinish={onFinish}>
                {renderStepContent()}
            </Form>
        </Modal>
    );
};

export default ModalPjServiceAppointment;