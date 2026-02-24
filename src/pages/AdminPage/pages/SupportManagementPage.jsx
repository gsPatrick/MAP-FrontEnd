// d:/daniatualagrvai/MAP-FrontEnd/src/pages/AdminPage/pages/SupportManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Card, Typography, message, Modal, Select, Row, Col, Statistic } from 'antd';
import { CustomerServiceOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const SupportManagementPage = () => {
    const [tickets, setTickets] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketsRes, metricsRes] = await Promise.all([
                apiClient.get('/support/admin/tickets'),
                apiClient.get('/support/admin/metrics'),
            ]);
            setTickets(ticketsRes.data.data);
            setMetrics(metricsRes.data.data);
        } catch (error) {
            console.error('Erro ao buscar dados de suporte:', error);
            message.error('Erro ao carregar chamados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusChange = async (ticketId, newStatus) => {
        setUpdateLoading(true);
        try {
            await apiClient.put(`/support/admin/tickets/${ticketId}`, { status: newStatus });
            message.success('Status atualizado com sucesso!');
            fetchData();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            message.error('Falha ao atualizar status.');
        } finally {
            setUpdateLoading(false);
        }
    };

    const columns = [
        {
            title: 'Data',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('pt-BR'),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Cliente',
            dataIndex: 'client',
            key: 'client',
            render: (client) => (
                <div>
                    <Text strong>{client?.name || 'N/A'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>{client?.email || client?.phone}</Text>
                </div>
            ),
        },
        {
            title: 'Tipo',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                let color = 'blue';
                if (type === 'Tecnico') color = 'red';
                if (type === 'Financeiro') color = 'gold';
                if (type === 'Sugestao') color = 'green';
                return <Tag color={color}>{type}</Tag>;
            },
        },
        {
            title: 'Assunto',
            dataIndex: 'subject',
            key: 'subject',
            render: (subject, record) => (
                <Tooltip title={record.description}>
                    <Text strong>{subject}</Text>
                </Tooltip>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(val) => handleStatusChange(record.id, val)}
                    style={{ width: 140 }}
                    loading={updateLoading}
                >
                    <Option value="Aberto">Aberto</Option>
                    <Option value="Em andamento">Em andamento</Option>
                    <Option value="Resolvido">Resolvido</Option>
                </Select>
            ),
        },
        {
            title: 'Prioridade',
            dataIndex: 'priority',
            key: 'priority',
            render: (prio) => {
                let color = 'default';
                if (prio === 'Alta') color = 'error';
                if (prio === 'Media') color = 'warning';
                return <Tag color={color}>{prio}</Tag>;
            },
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}><CustomerServiceOutlined /> Gerenciamento de Suporte</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="metric-card">
                        <Statistic
                            title="Total de Chamados"
                            value={metrics?.totalTickets || 0}
                            prefix={<CustomerServiceOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="metric-card">
                        <Statistic
                            title="Tempo Médio de Resolução"
                            value={metrics?.avgResolutionTime ? metrics.avgResolutionTime.toFixed(1) : 0}
                            suffix=" dias"
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="metric-card">
                        <Statistic
                            title="Resolvidos"
                            value={tickets.filter(t => t.status === 'Resolvido').length}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#096dd9' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>Atualizar</Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={tickets}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

// Tooltip helper if not imported
const Tooltip = ({ title, children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <>
            <div onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
                {children}
            </div>
            <Modal
                title="Detalhes do Chamado"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <p>{title}</p>
            </Modal>
        </>
    );
}

export default SupportManagementPage;
