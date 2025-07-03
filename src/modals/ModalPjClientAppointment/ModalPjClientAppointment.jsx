// src/modals/ModalPjClientAppointment/ModalPjClientAppointment.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Button, Space, message, Select, Spin, Empty, Typography } from 'antd';
import moment from 'moment';
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const ModalPjClientAppointment = ({ open, onCancel, onSuccess, businessClientsList, loadingBusinessClients }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentProfile } = useProfile();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values) => {
    if (!currentProfile?.id) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        eventDateTime: values.eventDateTime ? values.eventDateTime.toISOString() : null,
        durationMinutes: values.durationMinutes,
        location: values.location,
        notes: values.notes,
        businessClientIds: values.businessClientIds ? values.businessClientIds.map(id => parseInt(id, 10)) : [],
        // Não envia campos de serviço nem lembrete PF neste modal
        origin: 'system_pj_mei', // Definir a origem
      };

      await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, payload);
      message.success("Agendamento criado com sucesso!");
      onSuccess(); // Chama a função para refetchar dados na página pai
      onCancel(); // Fecha o modal
    } catch (error) {
      console.error("Erro ao criar agendamento PJ Cliente:", error);
      // Mensagem de erro já é tratada pelo interceptor do apiClient
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Novo Agendamento com Cliente"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="title"
          label="Título do Compromisso"
          rules={[{ required: true, message: 'Por favor, insira um título!' }]}
        >
          <Input placeholder="Ex: Reunião com o cliente X" />
        </Form.Item>

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

        <Form.Item
          name="eventDateTime"
          label="Data e Hora"
          rules={[{ required: true, message: 'Por favor, selecione a data e hora!' }]}
        >
          <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} placeholder="Selecione a data e hora" />
        </Form.Item>

        <Form.Item
          name="durationMinutes"
          label="Duração (minutos - Opcional)"
        >
          <InputNumber min={5} step={5} style={{ width: '100%' }} placeholder="Ex: 60" />
        </Form.Item>

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

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Agendar
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalPjClientAppointment;