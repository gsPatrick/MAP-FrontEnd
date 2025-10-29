// src/pages/AdminPage/components/EditUserModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import apiClient from '../../../services/api';

const EditUserModal = ({ client, visible, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (client) {
            form.setFieldsValue({
                name: client.name,
                email: client.email,
            });
        }
    }, [client, form]);

    const handleUpdate = async (values) => {
        setLoading(true);
        try {
            // A API de admin usa o PUT /admin/clients/:clientId para atualizar
            await apiClient.put(`/admin/clients/${client.id}`, values);
            message.success('Dados do usuário atualizados com sucesso!');
            onSuccess();
        } catch (error) {
            message.error(error.response?.data?.message || 'Erro ao atualizar o usuário.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={`Editar Dados de ${client?.name}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleUpdate} initialValues={client}>
                <Form.Item name="name" label="Nome Completo" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="email" label="E-mail" rules={[{ type: 'email' }]}>
                    <Input />
                </Form.Item>
                <p>O telefone do usuário só pode ser alterado via API por segurança.</p>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>Salvar Alterações</Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditUserModal;