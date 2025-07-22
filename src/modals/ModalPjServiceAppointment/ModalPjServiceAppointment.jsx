import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Select, Button, message, Steps, Calendar, Divider, Spin, Empty, Input } from 'antd';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const ModalPjServiceAppointment = ({ open, onCancel, onSuccess, currentProfile }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(0); // Controla a etapa atual do modal (0, 1, 2)
    const [formData, setFormData] = useState({}); // Estado para acumular dados do formulário entre as etapas

    // Estados para dados dos dropdowns
    const [servicesList, setServicesList] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    const [businessClientsList, setBusinessClientsList] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);

    // Estados para seleção de data e hora
    const [selectedDateForSlots, setSelectedDateForSlots] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null); // Slot de hora selecionado

    // Função para buscar dados iniciais (serviços e clientes)
    const fetchDropdownData = useCallback(async () => {
        if (!currentProfile?.id) return;
        setLoadingServices(true);
        setLoadingClients(true);
        try {
            const [servicesRes, clientsRes] = await Promise.all([
                apiClient.get(`/services/${currentProfile.id}`, { params: { isActive: true, limit: 500 } }),
                apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`, { params: { isActive: true, limit: 500 } })
            ]);
            // CORREÇÃO: Mapeia para o formato { value: id (NUMBER), label: name } para o Select
            // Isso garante que o Select retorne IDs como números, não strings.
            setServicesList(servicesRes.data.data.services.map(s => ({ ...s, value: s.id, label: s.name })) || []);
            setBusinessClientsList(clientsRes.data.data.map(c => ({ ...c, value: c.id, label: c.name })) || []);
        } catch (error) {
            console.error("Erro ao buscar dados para modal:", error);
            message.error("Não foi possível carregar a lista de serviços ou clientes.");
        } finally {
            setLoadingServices(false);
            setLoadingClients(false);
        }
    }, [currentProfile?.id]);
    
    // Efeito para resetar o estado do modal ao abrir/fechar
    useEffect(() => {
        if(open) {
            fetchDropdownData();
            // Define a data inicial do calendário para hoje
            setSelectedDateForSlots(dayjs());
            form.setFieldsValue({
              eventDateTime: dayjs().add(1, 'hour').minute(0).second(0).millisecond(0)
            });
            setFormData({}); // Resetar formData ao abrir
        } else {
            // Reset state on close
            setStep(0);
            form.resetFields();
            setSelectedDateForSlots(null);
            setSelectedSlot(null);
            setAvailableSlots([]);
            setFormData({}); // Resetar formData ao fechar
        }
    }, [open, fetchDropdownData, form]);

    // Função para buscar horários disponíveis com base na data e serviços selecionados
    const fetchAvailableSlots = useCallback(async (date, serviceIds) => {
        if (!date || !serviceIds || serviceIds.length === 0 || !currentProfile?.id) {
            setAvailableSlots([]);
            return;
        }
        setSlotsLoading(true);
        try {
            // serviceIds.join(',') converterá um array de números como [1, 2] para "1,2"
            const response = await apiClient.get(`/public/booking/${currentProfile.id}/availability`, {
                params: { date: date.format('YYYY-MM-DD'), serviceIds: serviceIds.join(',') }, 
            });
            setAvailableSlots(response.data.data.availableSlots || []);
        } catch (error) {
            setAvailableSlots([]);
            message.error("Erro ao buscar horários disponíveis.");
            console.error("Erro ao buscar horários disponíveis:", error);
        } finally {
            setSlotsLoading(false);
        }
    }, [currentProfile?.id]);

    // Lógica para avançar para a próxima etapa do formulário
    const handleNext = async () => {
        try {
            if (step === 0) {
                const step0Values = await form.validateFields(['serviceIds']);
                setFormData(prev => ({ ...prev, ...step0Values })); // Salva os valores no estado `formData`

                if (selectedDateForSlots && step0Values.serviceIds && step0Values.serviceIds.length > 0) {
                    fetchAvailableSlots(selectedDateForSlots, step0Values.serviceIds);
                }
                setStep(1);
            } else if (step === 1) {
                if (!selectedDateForSlots || !selectedSlot) {
                    message.error('Por favor, selecione uma data e um horário.');
                    return;
                }
                setStep(2);
            }
        } catch (errorInfo) {
            console.log('Falha na validação ao tentar avançar:', errorInfo);
        }
    };

    // Lógica para retornar à etapa anterior
    const handlePrev = () => setStep(s => s - 1);
    
    // Callback quando uma data é selecionada no calendário (na Etapa 2)
    const onDateChangeInModal = (date) => {
        setSelectedDateForSlots(date);
        setSelectedSlot(null);
        // Usa os serviceIds do formData, pois o Form.Item de serviceIds não está montado no step 1
        const { serviceIds } = formData; 
        if (date && serviceIds && serviceIds.length > 0) {
          fetchAvailableSlots(date, serviceIds);
        } else {
          setAvailableSlots([]);
        }
    };
    
    // Lógica final de submissão do formulário (executada no último passo)
    const onFinish = async (currentStepValues) => {
        console.log("Botão 'Finalizar' pressionado. Iniciando onFinish.");
        console.log("Valores do formulário da etapa final (step 2):", currentStepValues);
        console.log("Dados acumulados das etapas anteriores (formData):", formData);
        console.log("Data selecionada para slots:", selectedDateForSlots?.format('YYYY-MM-DD'));
        console.log("Slot de hora selecionado:", selectedSlot);

        if (!selectedDateForSlots || !selectedSlot) {
            message.error('Data ou horário não selecionados.');
            return;
        }
        setSubmitting(true);
        try {
            // Combina todos os valores do formulário (dos steps 0 e 2)
            const finalValues = {
                ...formData, // Contém serviceIds do step 0
                ...currentStepValues, // Contém businessClientIds, location, notes do step 2
            };

            // CORREÇÃO: A comparação agora é entre numbers, pois s.id é number e finalValues.serviceIds também
            const serviceDetails = servicesList.filter(s => finalValues.serviceIds.includes(s.id));
            
            // Verifica se serviceDetails está vazio antes de tentar acessar propriedades
            if (serviceDetails.length === 0) {
                message.error("Nenhum serviço válido encontrado para o agendamento.");
                setSubmitting(false);
                return;
            }

            const title = serviceDetails.map(s => s.name).join(' + ');
            const durationMinutes = serviceDetails.reduce((sum, s) => sum + s.durationMinutes, 0);

            const payload = {
                title,
                durationMinutes,
                eventDateTime: dayjs(`${selectedDateForSlots.format('YYYY-MM-DD')}T${selectedSlot}`).toISOString(),
                businessClientIds: finalValues.businessClientIds.map(id => parseInt(id, 10)),
                serviceIds: finalValues.serviceIds.map(id => parseInt(id, 10)),
                location: finalValues.location,
                notes: finalValues.notes,
                origin: 'system_pj_mei',
            };
            
            console.log("Payload a ser enviado:", payload);

            await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, payload);
            
            message.success("Agendamento criado com sucesso!");
            onSuccess();
            onCancel();
        } catch (error) {
            console.error('Erro ao criar agendamento PJ Serviço:', error);
            message.error(`Falha ao criar agendamento: ${error.response?.data?.message || 'Erro desconhecido.'}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Renderiza o conteúdo de cada etapa do formulário
    const renderStepContent = () => {
        switch (step) {
            case 0: // Seleção de Serviços
                return (
                    <Form.Item 
                        name="serviceIds" 
                        label="Selecione o(s) serviço(s)" 
                        rules={[{ required: true, message: 'Por favor, selecione ao menos um serviço!' }]}
                    >
                        <Select 
                            mode="multiple" 
                            allowClear 
                            loading={loadingServices} 
                            placeholder="Selecione os serviços prestados"
                            onChange={() => {
                                setSelectedDateForSlots(dayjs()); // Volta para a data atual
                                setSelectedSlot(null); // Limpa o slot
                                setAvailableSlots([]); // Limpa os slots disponíveis
                            }}
                        >
                            {/* CORREÇÃO: O value aqui já é o número do s.id, conforme fetchDropdownData */}
                            {servicesList.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                        </Select>
                    </Form.Item>
                );
            case 1: // Seleção de Data e Hora
                return (
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {/* Calendário para seleção da data */}
                        <div style={{ flex: 0.8 }}>
                            <Calendar 
                                fullscreen={false} 
                                onSelect={onDateChangeInModal} 
                                value={selectedDateForSlots} 
                                className="modal-calendar-view"
                            />
                        </div>
                        <Divider type="vertical" style={{ height: 'auto', alignSelf: 'stretch' }} />
                        {/* Seção de slots de horário disponíveis */}
                        <div style={{ flex: 1, maxHeight: '350px', overflowY: 'auto', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                            {slotsLoading ? (
                                <Spin tip="Buscando horários..." />
                            ) : availableSlots.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px'}}>
                                    {availableSlots.map(slot => (
                                        <Button 
                                            key={slot} 
                                            type={selectedSlot === slot ? 'primary' : 'default'} 
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            {slot}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <Empty description="Nenhum horário disponível para a data e serviços selecionados." />
                            )}
                        </div>
                    </div>
                );
            case 2: // Seleção de Clientes e Detalhes Finais
                return (
                    <>
                        <Form.Item 
                            name="businessClientIds" 
                            label="Selecione o(s) cliente(s)" 
                            rules={[{ required: true, message: 'Por favor, selecione ao menos um cliente!' }]}
                        >
                            <Select 
                                mode="multiple" 
                                allowClear 
                                loading={loadingClients} 
                                placeholder="Selecione os clientes participantes"
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                            >
                                {/* CORREÇÃO: O value aqui já é o número do c.id, conforme fetchDropdownData */}
                                {businessClientsList.map(c => <Option key={c.id} value={c.id}>{c.label}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="location" label="Local (Opcional)">
                            <Input placeholder="Ex: Online (Zoom), Consultório" />
                        </Form.Item>
                        <Form.Item name="notes" label="Observações Internas (Opcional)">
                            <TextArea rows={3} placeholder="Detalhes importantes para você sobre este agendamento" />
                        </Form.Item>
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
            destroyOnClose
            width={step === 1 ? 800 : 600}
        >
            <Steps current={step} items={[{ title: 'Serviços' }, { title: 'Data/Hora' }, { title: 'Cliente(s)' }]} style={{ marginBottom: 24 }} />
            <Form form={form} layout="vertical" onFinish={onFinish}>
                {renderStepContent()}
            </Form>
        </Modal>
    );
};

export default ModalPjServiceAppointment;