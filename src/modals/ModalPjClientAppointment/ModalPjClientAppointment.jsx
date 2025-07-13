// src/modals/ModalPjClientAppointment/ModalPjClientAppointment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, DatePicker, Button, message, Select, Space } from 'antd';
import { CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

// <<< MUDANÇA 1: Removendo as props desnecessárias e adicionando `currentProfile` que é essencial >>>
const ModalPjClientAppointment = ({ 
    open, 
    onCancel, 
    onSuccess, 
    currentProfile, // Precisa do perfil para saber de onde buscar os clientes
    editingAppointment 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // <<< MUDANÇA 2: Estados internos para clientes e seu carregamento >>>
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // <<< MUDANÇA 3: Função para buscar os clientes, agora DENTRO do modal >>>
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
      // <<< MUDANÇA 4: Chamar a busca de clientes quando o modal abre >>>
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
        form.setFieldsValue({ eventDateTime: dayjs().add(1, 'hour').minute(0) });
      }
    }
  }, [open, editingAppointment, form, fetchClients]);

  const handleFinish = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      eventDateTime: values.eventDateTime.toISOString(),
      businessClientIds: values.businessClientIds.map(id => parseInt(id, 10)),
      origin: 'system_pj_mei',
    };

    try {
      const endpoint = editingAppointment
        ? `/financial-accounts/${currentProfile.id}/appointments/${editingAppointment.id}`
        : `/financial-accounts/${currentProfile.id}/appointments`;
      const method = editingAppointment ? 'patch' : 'put';

      await apiClient[method](endpoint, payload);
      message.success(`Agendamento ${editingAppointment ? 'atualizado' : 'criado'} com sucesso!`);
      onSuccess();
      onCancel();
    } catch (error) {
       // Interceptor trata
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
      footer={null}
      destroyOnClose
      className="modal-novo-compromisso"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="title" label="Título do Agendamento" rules={[{ required: true, message: 'Insira o título!' }]}>
          <Input placeholder="Ex: Reunião de Alinhamento, Apresentação de Proposta" />
        </Form.Item>
        {/* <<< MUDANÇA 5: Usando os estados internos `clients` e `loadingClients` >>> */}
        <Form.Item name="businessClientIds" label="Cliente(s)" rules={[{ required: true, message: 'Selecione ao menos um cliente!' }]}>
          <Select 
            mode="multiple" 
            allowClear 
            placeholder="Selecione os clientes participantes" 
            loading={loadingClients}
            showSearch 
            optionFilterProp="children"
            filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {clients.map(client => <Option key={client.id} value={client.id.toString()}>{client.name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="eventDateTime" label="Data e Hora" rules={[{ required: true, message: 'Insira a data e hora!' }]}>
          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
        </Form.Item>
        <Form.Item name="location" label="Local (Opcional)">
            <Input placeholder="Ex: Sala de Reunião, Google Meet" />
        </Form.Item>
        <Form.Item name="notes" label="Observações Internas (Opcional)">
          <TextArea rows={3} placeholder="Detalhes importantes para você sobre este agendamento" />
        </Form.Item>
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