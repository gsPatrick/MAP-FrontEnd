// src/pages/AdminPage/components/CreateUserModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import apiClient from '../../../services/api';

const { Option } = Select;

const CreateUserModal = ({ visible, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        if (visible) {
            apiClient.get('/admin/plans').then(response => {
                setPlans(response.data.data);
            }).catch(() => message.error('Não foi possível carregar os planos.'));
        }
    }, [visible]);

    const handleCreate = async (values) => {
        setLoading(true);
        try {
            await apiClient.post('/admin/clients/create-as-admin', values);
            message.success(`Usuário ${values.name} criado com sucesso!`);
            onSuccess();
            form.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Erro ao criar usuário.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Criar Novo Usuário"
            open={visible}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleCreate}>
                <Form.Item name="name" label="Nome Completo" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="phone" label="WhatsApp" rules={[{ required: true }]}><Input placeholder="55119..."/></Form.Item>
                <Form.Item name="email" label="E-mail" rules={[{ type: 'email' }]}><Input /></Form.Item>
                <Form.Item name="password" label="Senha" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
                <Form.Item name="planId" label="Plano Inicial" rules={[{ required: true }]}>
                    <Select placeholder="Escolha um plano">
                        {plans.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>Criar Usuário</Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateUserModal;