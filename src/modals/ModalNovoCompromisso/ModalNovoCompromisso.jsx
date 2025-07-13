// src/modals/ModalNovoCompromisso/ModalNovoCompromisso.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button, message, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { TextArea } = Input;

const ModalNovoCompromisso = ({ open, onCancel, onSuccess, currentProfile, editingAppointment }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        form.setFieldsValue({
          title: editingAppointment.title,
          eventDateTime: dayjs(editingAppointment.eventDateTime),
          description: editingAppointment.description,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ eventDateTime: dayjs().add(1, 'hour').minute(0) });
      }
    }
  }, [open, editingAppointment, form]);

  const handleFinish = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      eventDateTime: values.eventDateTime.toISOString(),
      origin: 'system_pf'
    };

    try {
      const endpoint = editingAppointment
        ? `/financial-accounts/${currentProfile.id}/appointments/${editingAppointment.id}`
        : `/financial-accounts/${currentProfile.id}/appointments`;
      const method = editingAppointment ? 'put' : 'post';

      await apiClient[method](endpoint, payload);
      message.success(`Compromisso ${editingAppointment ? 'atualizado' : 'criado'} com sucesso!`);
      onSuccess();
      onCancel();
    } catch (error) {
       // Interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined style={{ color: 'var(--map-laranja)' }} />
          {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      className="modal-novo-compromisso"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="title" label="Título do Compromisso" rules={[{ required: true, message: 'Insira o título!' }]}>
          <Input placeholder="Ex: Reunião com gerente, Pagar conta de luz" />
        </Form.Item>
        <Form.Item name="eventDateTime" label="Data e Hora" rules={[{ required: true, message: 'Insira a data e hora!' }]}>
          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
        </Form.Item>
        <Form.Item name="description" label="Observações (Opcional)">
          <TextArea rows={3} placeholder="Detalhes, links, lembretes..." />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right', marginTop: '20px', marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} className="modal-btn-cancel">Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="modal-btn-submit neutral">
            {editingAppointment ? 'Salvar Alterações' : 'Criar Compromisso'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalNovoCompromisso;