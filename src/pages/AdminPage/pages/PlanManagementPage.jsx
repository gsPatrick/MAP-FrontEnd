// src/pages/AdminPage/pages/PlanManagementPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Row, Col, Form, Input, InputNumber, Select, Button, message, Table, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Title } = Typography;
const { Option } = Select;

const PlanManagementPage = () => {
    const [customPlans, setCustomPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchCustomPlans = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/plans', { params: { isCustom: 'true' } });
            setCustomPlans(response.data.data);
        } catch (error) {
            message.error('Falha ao carregar planos customizados.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomPlans();
    }, [fetchCustomPlans]);

    const handleCreatePlan = async (values) => {
        try {
            await apiClient.post('/admin/plans/custom', values);
            message.success(`Plano "${values.name}" criado com sucesso!`);
            form.resetFields();
            fetchCustomPlans();
        } catch (error) {
            message.error(error.response?.data?.message || 'Erro ao criar o plano.');
        }
    };

    const customPlanColumns = [
        { title: 'Nome do Plano', dataIndex: 'name', key: 'name' },
        { title: 'Preço', dataIndex: 'price', key: 'price', render: (price) => `R$ ${parseFloat(price).toFixed(2)}` },
        { title: 'Duração', dataIndex: 'durationDays', key: 'durationDays', render: (days) => `${days} dias` },
        { title: 'Nível', dataIndex: 'tier', key: 'tier', render: (tier) => <Tag>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Tag> },
    ];

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
                <Card>
                    <Title level={4}>Criar Plano Customizado</Title>
                    <p>Crie planos especiais para parcerias, promoções ou casos específicos.</p>
                    <Form form={form} layout="vertical" onFinish={handleCreatePlan} initialValues={{ durationDays: 365, tier: 'avancado', price: 0 }}>
                        <Form.Item name="name" label="Nome do Plano" rules={[{ required: true }]}><Input placeholder="Ex: Parceria - Blog da Maria" /></Form.Item>
                        <Form.Item name="price" label="Preço" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} formatter={value => `R$ ${value}`} parser={value => value.replace('R$ ', '')} /></Form.Item>
                        <Form.Item name="durationDays" label="Duração (dias)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="tier" label="Nível de Acesso (Tier)" rules={[{ required: true }]}>
                            <Select>
                                <Option value="basico">Básico</Option>
                                <Option value="avancado">Avançado</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Criar Plano</Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
            <Col xs={24} lg={14}>
                <Card>
                    <Title level={4}>Planos Customizados Existentes</Title>
                    <Table
                        columns={customPlanColumns}
                        dataSource={customPlans}
                        rowKey="id"
                        pagination={false}
                        loading={loading}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default PlanManagementPage;