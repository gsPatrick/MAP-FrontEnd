// src/pages/AffiliateDashboardPage/AffiliateDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Button, message, Space, Alert, Tooltip, Empty, Divider, Modal, Form, Input } from 'antd';
import { TeamOutlined, DollarOutlined, LinkOutlined, TrophyOutlined, EyeOutlined, PercentageOutlined, SolutionOutlined, EditOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import './AffiliateDashboardPage.css';

const { Title, Text, Paragraph } = Typography;

const AffiliateDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [referrals, setReferrals] = useState([]);
    const [isSlugModalVisible, setIsSlugModalVisible] = useState(false);
    const [slugLoading, setSlugLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, referralsRes] = await Promise.all([
                apiClient.get('/affiliates/dashboard'),
                apiClient.get('/affiliates/referrals')
            ]);
            setDashboardData(dashboardRes.data.data);
            setReferrals(referralsRes.data.data);
        } catch (error) {
            message.error('Erro ao carregar dados de afiliado.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const copyAffiliateLink = () => {
        const identifier = dashboardData?.summary?.affiliateSlug || dashboardData?.summary?.affiliateCode;
        const link = `https://www.map-nocontrole.com.br/indicacao/${identifier}`;
        navigator.clipboard.writeText(link);
        message.success('Link de afiliado copiado!');
    };

    const handleUpdateSlug = async (values) => {
        try {
            setSlugLoading(true);
            await apiClient.put('/affiliates/update-slug', { slug: values.slug });
            message.success('Seu link personalizado foi atualizado!');
            setIsSlugModalVisible(false);
            fetchDashboardData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Erro ao atualizar o link.');
        } finally {
            setSlugLoading(false);
        }
    };

    const referralColumns = [
        {
            title: 'Data',
            dataIndex: 'joinDate',
            render: (date) => new Date(date).toLocaleDateString('pt-BR')
        },
        {
            title: 'Indicado',
            dataIndex: 'name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status) => (
                <Tag color={status === 'Ativo' ? 'green' : 'blue'}>
                    {status === 'Ativo' ? 'Assinante' : 'Cadastro'}
                </Tag>
            )
        },
        {
            title: 'Comissão',
            dataIndex: 'subscription',
            align: 'right',
            render: (sub) => sub ? (
                <Text type="success" strong>
                    {sub.commissionEarned.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
            ) : '-'
        }
    ];

    if (loading) return <Card loading={true} style={{ minHeight: '400px' }} />;

    const { metrics, summary } = dashboardData || {};

    return (
        <div className="affiliate-dashboard-container">
            <Title level={3}>Programa de Afiliados</Title>
            <Paragraph>
                Indique o MAP no Controle e ganhe comissões por cada assinatura realizada através do seu link.
            </Paragraph>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card className="affiliate-main-card premium-card-shadow">
                        <Title level={4}>Seu Compartilhamento</Title>
                        <div className="affiliate-link-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text strong>Link de Convite:</Text>
                                <Button size="small" type="link" icon={<EditOutlined />} onClick={() => {
                                    form.setFieldsValue({ slug: summary?.affiliateSlug });
                                    setIsSlugModalVisible(true);
                                }}>
                                    Personalizar Link
                                </Button>
                            </div>
                            <div className="link-copy-box">
                                <Text code ellipsis style={{ flex: 1, color: '#b24a0a', fontWeight: 'bold' }}>
                                    {`map.com.br/p/${summary?.affiliateSlug || summary?.affiliateCode || summary?.name?.toLowerCase().replace(/\s+/g, '-') || 'parceiro'}`}
                                </Text>
                                <Button type="primary" icon={<LinkOutlined />} onClick={copyAffiliateLink}>
                                    Copiar
                                </Button>
                            </div>
                            <Paragraph type="secondary" style={{ marginTop: 12, fontSize: '12px' }}>
                                <small>* O link acima redireciona para sua página de convite personalizada.</small>
                            </Paragraph>
                        </div>

                        <Divider />

                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={6}>
                                <Statistic title="Cliques" value={metrics?.totalClicks} prefix={<EyeOutlined />} />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic title="Indicações" value={metrics?.totalReferrals} prefix={<TeamOutlined />} />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Taxa Conv."
                                    value={metrics?.conversionRate}
                                    suffix="%"
                                    prefix={<PercentageOutlined />}
                                    valueStyle={{ color: metrics?.conversionRate > 5 ? '#3f8600' : '#cf1322' }}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Saldo"
                                    value={metrics?.totalEarned}
                                    precision={2}
                                    prefix="R$"
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                            <Col xs={24} sm={12}>
                                <Card size="small" className="metric-box bg-light-blue">
                                    <Statistic
                                        title="Assinantes Ativos"
                                        value={metrics?.activeReferrals}
                                        prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Card size="small" className="metric-box bg-light-green">
                                    <Statistic
                                        title="Receita Gerada"
                                        value={metrics?.totalRevenueGenerated}
                                        precision={2}
                                        prefix="R$"
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title={<span><DollarOutlined /> Financeiro Afiliado</span>} className="balance-card premium-card-shadow">
                        <Statistic
                            title="Saldo Disponível"
                            value={summary?.balance}
                            precision={2}
                            prefix="R$"
                            valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#3f8600' }}
                        />
                        <Divider />
                        <div className="pix-info">
                            <Text type="secondary">Sua Chave PIX:</Text>
                            <Paragraph strong style={{ fontSize: '15px' }}>{summary?.asaasPayoutPixKey || 'Não configurada'}</Paragraph>
                            <Button type="link" style={{ padding: 0 }}>Configurar Recebimento</Button>
                        </div>
                        <Alert
                            message="Os pagamentos são processados após o fechamento do ciclo mensal."
                            type="info"
                            showIcon
                            style={{ marginTop: 16, fontSize: '11px' }}
                        />
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title={<span><SolutionOutlined /> Seus Convidados</span>} className="premium-card-shadow">
                        {referrals.length > 0 ? (
                            <Table
                                columns={referralColumns}
                                dataSource={referrals}
                                rowKey="referredClientId"
                                pagination={{ pageSize: 5 }}
                            />
                        ) : (
                            <Empty description="Nenhuma indicação ainda. Envie seu link para começar!" />
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Personalizar seu Link"
                open={isSlugModalVisible}
                onCancel={() => setIsSlugModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleUpdateSlug}>
                    <Form.Item
                        name="slug"
                        label="Novo Final do Link"
                        rules={[
                            { required: true, message: 'Digite o final do seu link!' },
                            { pattern: /^[a-z0-9-]+$/, message: 'Use apenas letras minúsculas, números e hifens.' }
                        ]}
                    >
                        <Input
                            prefix="map.com.br/p/"
                            placeholder="meu-nome-parceiro"
                            maxLength={30}
                        />
                    </Form.Item>
                    <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                        Isso criará um link amigável como: <strong>map.com.br/p/meu-nome</strong>
                    </Paragraph>
                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                        <Button onClick={() => setIsSlugModalVisible(false)} style={{ marginRight: 8 }}>
                            Cancelar
                        </Button>
                        <Button type="primary" htmlType="submit" loading={slugLoading}>
                            Salvar Alterações
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default AffiliateDashboardPage;
