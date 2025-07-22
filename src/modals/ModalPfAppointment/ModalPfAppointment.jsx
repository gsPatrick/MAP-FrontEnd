// src/modals/ModalPfAppointment/ModalPfAppointment.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Checkbox, Button, Space, message } from 'antd';
import dayjs from 'dayjs'; // Use dayjs em vez de moment para consistência com Ant Design v5
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

const { TextArea } = Input;

const ModalPfAppointment = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentProfile } = useProfile(); // Obtém o perfil atual do contexto

  useEffect(() => {
    if (open) {
      form.resetFields(); // Reseta o formulário toda vez que o modal abre
      // Define valores padrão para novos agendamentos PF
      form.setFieldsValue({
        reminderEnabled: true,
        reminderLeadTimeMinutes: 60, // Padrão: lembrar 1 hora antes
        // Define a data/hora para a próxima hora cheia para conveniência
        eventDateTime: dayjs().add(1, 'hour').minute(0).second(0).millisecond(0),
      });
    }
  }, [open, form]);

  const handleFinish = async (values) => {
    if (!currentProfile?.id) {
      message.error("ID do perfil financeiro não disponível.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        eventDateTime: values.eventDateTime ? values.eventDateTime.toISOString() : null, // Converte dayjs para ISO string
        durationMinutes: values.durationMinutes,
        location: values.location,
        notes: values.notes,
        reminderEnabled: values.reminderEnabled,
        reminderLeadTimeMinutes: values.reminderEnabled ? values.reminderLeadTimeMinutes : null,
        origin: 'system_pf', // Define a origem como agendamento de Pessoa Física
      };

      // *** CORREÇÃO CRÍTICA AQUI: Requisição para CRIAR é sempre POST ***
      await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, payload);
      
      message.success("Agendamento criado com sucesso!");
      onSuccess(); // Chama a função para refetchar dados na página pai (ex: atualizar o calendário)
      onCancel(); // Fecha o modal
    } catch (error) {
      // O interceptor do apiClient já trata a exibição de mensagens de erro globais
      console.error("Erro ao criar agendamento PF:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Novo Agendamento Pessoal"
      open={open}
      onCancel={onCancel}
      footer={null} // Gerenciamos os botões de footer manualmente
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

        {/* Opção de ativar/desativar lembrete */}
        <Form.Item name="reminderEnabled" valuePropName="checked">
          <Checkbox>Ativar Lembrete</Checkbox>
        </Form.Item>

        {/* Campo para minutos de antecedência do lembrete, visível condicionalmente */}
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

        {/* Botões de Ação */}
        <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
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