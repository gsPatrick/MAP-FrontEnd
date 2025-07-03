// src/modals/ModalPfAppointment/ModalPfAppointment.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Checkbox, Button, Space, message } from 'antd';
import moment from 'moment';
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

const { TextArea } = Input;

const ModalPfAppointment = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentProfile } = useProfile();

  useEffect(() => {
    if (open) {
      form.resetFields();
      // Define valores padrão se necessário
      form.setFieldsValue({
        reminderEnabled: true,
        reminderLeadTimeMinutes: 60, // Padrão 1 hora antes
      });
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
        reminderEnabled: values.reminderEnabled,
        reminderLeadTimeMinutes: values.reminderEnabled ? values.reminderLeadTimeMinutes : null,
        origin: 'system_pf', // Definir a origem
      };

      await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, payload);
      message.success("Agendamento criado com sucesso!");
      onSuccess(); // Chama a função para refetchar dados na página pai
      onCancel(); // Fecha o modal
    } catch (error) {
      console.error("Erro ao criar agendamento PF:", error);
      // Mensagem de erro já é tratada pelo interceptor do apiClient
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Novo Agendamento Pessoal"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose // Garante que o formulário seja resetado ao fechar
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="title"
          label="Título do Compromisso"
          rules={[{ required: true, message: 'Por favor, insira um título!' }]}
        >
          <Input placeholder="Ex: Consulta com o Dr. Smith" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Descrição (Opcional)"
        >
          <TextArea rows={2} placeholder="Detalhes do compromisso..." />
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
          <Input placeholder="Ex: Consultório, Online" />
        </Form.Item>

         <Form.Item
          name="notes"
          label="Observações Internas (Opcional)"
        >
          <TextArea rows={2} placeholder="Notas adicionais..." />
        </Form.Item>

        <Form.Item name="reminderEnabled" valuePropName="checked" initialValue={true}>
          <Checkbox>Ativar Lembrete</Checkbox>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.reminderEnabled !== currentValues.reminderEnabled}
        >
          {({ getFieldValue }) =>
            getFieldValue('reminderEnabled') ? (
              <Form.Item
                name="reminderLeadTimeMinutes"
                label="Lembrar com (minutos de antecedência)"
                rules={[{ required: true, message: 'Defina a antecedência do lembrete!' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Ex: 60" />
              </Form.Item>
            ) : null
          }
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

export default ModalPfAppointment;