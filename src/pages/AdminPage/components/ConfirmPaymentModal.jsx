// src/pages/AdminPage/components/ConfirmPaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message, Alert, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Option } = Select;
const { Text } = Typography;

/**
 * Confirma o pagamento de um usuário (ativa a assinatura e LIBERA o acesso).
 * Reutiliza o endpoint /admin/clients/change-plan, que cria a assinatura como
 * 'Ativa', define a expiração e envia um WhatsApp avisando que o acesso foi liberado.
 */
const ConfirmPaymentModal = ({ client, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allPlans, setAllPlans] = useState([]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      apiClient.get('/admin/plans')
        .then((response) => setAllPlans(response.data.data || []))
        .catch(() => message.error('Falha ao carregar a lista de planos.'));
    }
  }, [visible, form]);

  const handleConfirm = async (values) => {
    setLoading(true);
    try {
      await apiClient.post('/admin/clients/change-plan', {
        clientId: client.id,
        planId: values.planId,
        // sem customMessage -> usa a mensagem padrão de "assinatura ativada / já pode usar"
      });
      message.success(`Pagamento de ${client.name || 'usuário'} confirmado! Acesso liberado.`);
      onSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao confirmar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span><CheckCircleOutlined style={{ color: '#16a34a', marginRight: 8 }} />Confirmar pagamento</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
    >
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        message="Liberar acesso"
        description={<>Confirma o pagamento de <strong>{client?.name || 'usuário'}</strong>, ativa a assinatura e libera o uso do sistema. O cliente recebe um WhatsApp avisando que o acesso foi liberado.</>}
      />
      <Form form={form} layout="vertical" onFinish={handleConfirm}>
        <Form.Item name="planId" label="Plano contratado" rules={[{ required: true, message: 'Selecione o plano pago.' }]}>
          <Select placeholder="Escolha o plano que o cliente pagou">
            {allPlans.map((plan) => (
              <Option key={plan.id} value={plan.id}>
                {`${plan.name} (R$ ${parseFloat(plan.price).toFixed(2)})`}
              </Option>
            ))}
          </Select>
        </Form.Item>
        {client?.accessLevel && (
          <Text type="secondary" style={{ display: 'block', marginTop: -8, marginBottom: 12 }}>
            Plano atual do cadastro: <strong>{client.accessLevel}</strong>
          </Text>
        )}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#16a34a', borderColor: '#16a34a' }}>
            Confirmar pagamento e liberar acesso
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfirmPaymentModal;
