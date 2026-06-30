// src/pages/AdminPage/components/ConfirmPaymentModal.jsx
import React, { useState } from 'react';
import { Modal, Button, message, Alert, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Paragraph } = Typography;

/**
 * Confirma o pagamento de um usuário ATIVANDO o plano que ele JÁ escolheu no
 * cadastro (assinatura 'Pendente'). Não há seleção de plano — o backend usa o
 * plano pendente do cliente. Reutiliza o fluxo de ativação (libera acesso +
 * WhatsApp + onboarding).
 */
const ConfirmPaymentModal = ({ client, visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/admin/clients/${client.id}/confirm-payment`);
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
      centered
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="ok" type="primary" loading={loading} onClick={handleConfirm} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
          Confirmar e liberar acesso
        </Button>,
      ]}
    >
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 12 }}
        message="Liberar acesso"
        description={<>Confirma o pagamento de <strong>{client?.name || 'usuário'}</strong> no <strong>plano que ele escolheu no cadastro</strong>. A assinatura é ativada, o acesso é liberado e o cliente recebe um WhatsApp avisando.</>}
      />
      <Paragraph type="secondary" style={{ margin: 0 }}>
        Se o cliente não tiver um plano pendente, use a opção <strong>"Alterar plano"</strong> para definir um manualmente.
      </Paragraph>
    </Modal>
  );
};

export default ConfirmPaymentModal;
