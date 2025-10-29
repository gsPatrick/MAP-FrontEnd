// src/pages/AdminPage/components/ChangePlanModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message, Input } from 'antd';
import apiClient from '../../../services/api';

const { Option } = Select;

const ChangePlanModal = ({ client, visible, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [allPlans, setAllPlans] = useState([]);

    useEffect(() => {
        if (visible) {
            apiClient.get('/admin/plans').then(response => {
                setAllPlans(response.data.data);
            }).catch(() => message.error('Falha ao carregar a lista de planos.'));
        }
    }, [visible]);

    const handlePlanChange = async (values) => {
        setLoading(true);
        try {
            await apiClient.post('/admin/clients/change-plan', {
                clientId: client.id,
                planId: values.planId,
                customMessage: values.customMessage
            });
            message.success(`Plano de ${client.name} atualizado!`);
            onSuccess();
        } catch (error) {
            message.error(error.response?.data?.message || 'Erro ao atualizar o plano.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={`Alterar Plano de ${client?.name}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handlePlanChange}>
                <Form.Item name="planId" label="Selecione o Novo Plano" rules={[{ required: true }]}>
                    <Select placeholder="Escolha um plano">
                        {allPlans.map(plan => (
                            <Option key={plan.id} value={plan.id}>
                                {`${plan.name} (R$ ${parseFloat(plan.price).toFixed(2)})`}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="customMessage" label="Mensagem de Ativação (Opcional)">
                    <Input.TextArea rows={3} placeholder="Deixe em branco para usar a mensagem padrão." />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>Salvar Alteração</Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ChangePlanModal;