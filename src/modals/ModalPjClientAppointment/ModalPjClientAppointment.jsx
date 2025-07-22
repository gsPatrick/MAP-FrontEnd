// src/modals/ModalPjClientAppointment/ModalPjClientAppointment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, DatePicker, Button, message, Select, Space } from 'antd';
import { CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const ModalPjClientAppointment = ({ 
    open, 
    onCancel, 
    onSuccess, 
    currentProfile, // Precisa do perfil para saber de onde buscar os clientes
    editingAppointment // Recebe o agendamento para modo de edição
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!currentProfile?.id) return;
    setLoadingClients(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`, { params: { isActive: true, limit: 500 } });
      setClients(response.data.data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes no modal:", error);
      message.error("Não foi possível carregar a lista de clientes.");
    } finally {
      setLoadingClients(false);
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    if (open) {
      fetchClients();
      if (editingAppointment) {
        form.setFieldsValue({
          title: editingAppointment.title,
          eventDateTime: dayjs(editingAppointment.eventDateTime),
          businessClientIds: editingAppointment.businessClients?.map(c => c.id.toString()) || [],
          location: editingAppointment.location,
          notes: editingAppointment.notes,
        });
      } else {
        form.resetFields();
        // Define a hora inicial para a próxima hora cheia
        form.setFieldsValue({ eventDateTime: dayjs().add(1, 'hour').minute(0).second(0).millisecond(0) });
      }
    }
  }, [open, editingAppointment, form, fetchClients]);

  const handleFinish = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      eventDateTime: values.eventDateTime.toISOString(), // Converte Moment/Dayjs para string ISO
      businessClientIds: values.businessClientIds.map(id => parseInt(id, 10)), // Garante que IDs sejam números
      origin: 'system_pj_mei', // Define a origem como agendamento PJ/MEI
    };

    // Define uma duração padrão se não for especificada ou se não for um número válido.
    // Para este modal, que não associa serviços, é importante ter uma duração.
    if (!payload.durationMinutes || isNaN(parseInt(payload.durationMinutes, 10))) {
        payload.durationMinutes = 60; // Duração padrão de 60 minutos
    } else {
        payload.durationMinutes = parseInt(payload.durationMinutes, 10);
    }

    try {
      const endpoint = editingAppointment
        ? `/financial-accounts/${currentProfile.id}/appointments/${editingAppointment.id}`
        : `/financial-accounts/${currentProfile.id}/appointments`;
      
      // *** CORREÇÃO CRÍTICA AQUI: Usar 'post' para criação e 'patch' para edição ***
      const method = editingAppointment ? 'patch' : 'post'; 

      await apiClient[method](endpoint, payload);
      message.success(`Agendamento ${editingAppointment ? 'atualizado' : 'criado'} com sucesso!`);
      onSuccess(); // Callback para atualizar a lista no componente pai
      onCancel(); // Fecha o modal
    } catch (error) {
       // O interceptor do apiClient já trata a exibição de mensagens de erro globais
       console.error('Erro ao salvar agendamento PJ Cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined style={{ color: 'var(--map-laranja)' }} />
          {editingAppointment ? 'Editar Agendamento com Cliente' : 'Novo Agendamento com Cliente'}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null} // Gerenciamos os botões de footer manualmente
      destroyOnClose // Garante que o formulário seja resetado ao fechar
      className="modal-novo-compromisso" // Classe CSS para estilização
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="title" label="Título do Agendamento" rules={[{ required: true, message: 'Insira o título!' }]}>
          <Input placeholder="Ex: Reunião de Alinhamento, Apresentação de Proposta" />
        </Form.Item>

        <Form.Item name="businessClientIds" label="Cliente(s)" rules={[{ required: true, message: 'Selecione ao menos um cliente!' }]}>
          <Select 
            mode="multiple" // Permite selecionar múltiplos clientes
            allowClear // Permite limpar a seleção
            placeholder="Selecione os clientes participantes" 
            loading={loadingClients}
            showSearch // Habilita busca dentro do select
            optionFilterProp="children" // Filtra pelo texto do Option
            filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {clients.map(client => (
                // O valor do Option deve ser o ID como string para evitar problemas de tipo no Ant Design
                <Option key={client.id} value={client.id.toString()}>{client.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="eventDateTime" label="Data e Hora" rules={[{ required: true, message: 'Insira a data e hora!' }]}>
          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" placeholder="Selecione data e hora" />
        </Form.Item>

        <Form.Item name="location" label="Local (Opcional)">
            <Input placeholder="Ex: Sala de Reunião, Google Meet" />
        </Form.Item>

        {/* Campo de duração em minutos (opcional) */}
        <Form.Item
            name="durationMinutes"
            label="Duração (minutos - Opcional)"
            rules={[{ type: 'number', min: 1, message: 'A duração deve ser um número positivo.' }]}
        >
            <Input type="number" placeholder="Ex: 60" />
        </Form.Item>

        <Form.Item name="notes" label="Observações Internas (Opcional)">
          <TextArea rows={3} placeholder="Detalhes importantes para você sobre este agendamento" />
        </Form.Item>

        {/* Botões de Ação */}
        <Form.Item style={{ textAlign: 'right', marginTop: '20px', marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} className="modal-btn-cancel">Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="modal-btn-submit neutral">
            {editingAppointment ? 'Salvar Alterações' : 'Criar Agendamento'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalPjClientAppointment;