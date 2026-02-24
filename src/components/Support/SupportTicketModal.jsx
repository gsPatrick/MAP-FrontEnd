// d:/daniatualagrvai/MAP-FrontEnd/src/components/Support/SupportTicketModal.jsx
import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { QuestionCircleOutlined, ToolOutlined, DollarCircleOutlined, BulbOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const SupportTicketModal = ({ visible, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await apiClient.post('/support/tickets', values);
            message.success('Chamado aberto com sucesso! Nossa equipe entrará em contato.');
            form.resetFields();
            onCancel();
        } catch (error) {
            console.error('Erro ao abrir chamado:', error);
            message.error(error.response?.data?.message || 'Falha ao abrir chamado. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Preciso de Ajuda"
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="type"
                    label="Que tipo de questão você tem?"
                    rules={[{ required: true, message: 'Por favor, selecione o tipo de ajuda.' }]}
                >
                    <Select placeholder="Selecione o tipo de ajuda">
                        <Option value="Tecnico"><ToolOutlined /> Problema Técnico</Option>
                        <Option value="Financeiro"><DollarCircleOutlined /> Questão Financeira</Option>
                        <Option value="Duvida"><QuestionCircleOutlined /> Dúvida Geral</Option>
                        <Option value="Sugestao"><BulbOutlined /> Sugestão ou Feedback</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="subject"
                    label="Assunto"
                    rules={[{ required: true, message: 'Por favor, insira um assunto.' }]}
                >
                    <Input placeholder="Ex: Não consigo acessar meu perfil PJ" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Descreva o problema ou dúvida"
                    rules={[{ required: true, message: 'Por favor, descreva sua solicitação.' }]}
                >
                    <TextArea rows={4} placeholder="Conte-nos mais detalhes para que possamos te ajudar melhor..." />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        Cancelar
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Enviar Solicitação
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SupportTicketModal;
