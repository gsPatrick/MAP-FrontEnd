// src/pages/AdminPage/pages/BroadcastPage.jsx
import React, { useState } from 'react';
import { Card, Typography, Form, Radio, Input, Button, message, Alert } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Title, Paragraph } = Typography;

const BroadcastPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSendBroadcast = async (values) => {
        const { message: broadcastMessage, targetGroup } = values;
        setLoading(true);
        try {
            const response = await apiClient.post('/admin/broadcast', { message: broadcastMessage, targetGroup });
            const { sentCount, failedCount } = response.data.data;
            message.success(`Transmissão enviada! Sucessos: ${sentCount}, Falhas: ${failedCount}.`);
            form.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Erro ao enviar a transmissão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <Title level={3}>Comunicação em Massa</Title>
            <Paragraph>
                Envie mensagens via WhatsApp para grupos específicos de usuários. Use com responsabilidade.
            </Paragraph>
            <Alert
                message="Atenção"
                description="O envio em massa pode levar alguns minutos para ser concluído. A mensagem de sucesso indica que o processo foi iniciado."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Form form={form} layout="vertical" onFinish={handleSendBroadcast} initialValues={{ targetGroup: 'all_active' }}>
                <Form.Item name="targetGroup" label="Selecione o Público-Alvo" rules={[{ required: true }]}>
                    <Radio.Group>
                        <Radio value="all_active">Todos os Usuários Ativos</Radio>
                        <Radio value="expiring_soon">Planos Expirando (próximos 7 dias)</Radio>
                        <Radio value="expired">Planos Expirados / Inativos</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item name="message" label="Mensagem a ser Enviada" rules={[{ required: true }]}>
                    <Input.TextArea
                        rows={6}
                        placeholder="Digite sua mensagem aqui... Dica: use quebras de linha para formatar. Você pode usar *texto* para negrito."
                    />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                        {loading ? 'Enviando...' : 'Enviar Transmissão'}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default BroadcastPage;