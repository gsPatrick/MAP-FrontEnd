// src/pages/AdminPage/components/AffiliatesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, Modal, message, Popconfirm, Tooltip, Typography, Alert, Row, Col, Card, Statistic, Divider } from 'antd';
import { DollarOutlined, HistoryOutlined, TeamOutlined, TrophyOutlined, EyeOutlined, PercentageOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Text, Title } = Typography;

const AffiliatesTab = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [rankingModalVisible, setRankingModalVisible] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/dashboard/affiliates');
      setAffiliates(response.data.data);
    } catch (error) {
      message.error('Falha ao carregar dados dos afiliados.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRanking = async () => {
    try {
      const response = await apiClient.get('/affiliates/ranking');
      setRanking(response.data.data);
      setRankingModalVisible(true);
    } catch (error) {
      message.error('Erro ao buscar o ranking.');
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const handleClearBalance = async (clientId) => {
    try {
      await apiClient.put(`/admin/clients/${clientId}/clear-balance`);
      message.success('Saldo zerado com sucesso! (Pagamento manual registrado)');
      fetchAffiliates();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao zerar o saldo.');
    }
  };

  const affiliateColumns = [
    {
      title: 'Afiliado',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.affiliateCode}</Text>
          {record.affiliateSlug && <Tag color="purple" style={{ fontSize: '10px' }}>/{record.affiliateSlug}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Cliques',
      dataIndex: 'totalClicks',
      key: 'totalClicks',
      align: 'center',
      render: (val) => <Text strong>{val || 0}</Text>
    },
    {
      title: 'Indicados',
      key: 'referrals',
      align: 'center',
      render: (_, record) => (
        <Tooltip title={`${record.totalReferrals} totais / ${record.activeReferrals} ativos`}>
          <Space>
            <Text strong>{record.activeReferrals}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>/ {record.totalReferrals}</Text>
          </Space>
        </Tooltip>
      )
    },
    {
      title: 'Conversão',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      align: 'center',
      render: (val) => <Tag color={val > 5 ? 'green' : 'orange'}>{val}%</Tag>
    },
    {
      title: 'Saldo Atual',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      render: (value) => (
        <Text type="success" strong>
          {parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Text>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver Histórico">
            <Button
              icon={<HistoryOutlined />}
              onClick={() => {
                setSelectedAffiliate(record);
                setHistoryModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Zerar Saldo e Reiniciar Ciclo?"
            description="Isso marcará o saldo como pago e zerará o contador de indicados."
            onConfirm={() => handleClearBalance(record.id)}
            okText="Paguei"
            cancelText="Cancelar"
          >
            <Button type="primary" danger icon={<DollarOutlined />} size="small">
              Pagar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rankingColumns = [
    { title: 'Posição', key: 'pos', align: 'center', render: (_, __, index) => <Text strong>#{index + 1}</Text> },
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Indicados', dataIndex: 'referralsCount', key: 'referrals', align: 'center' },
    {
      title: 'Receita Gerada',
      dataIndex: 'revenueGenerated',
      key: 'revenue',
      align: 'right',
      render: (val) => <Text strong type="success">{parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
    }
  ];

  const totalMetrics = affiliates.reduce((acc, curr) => ({
    clicks: acc.clicks + (curr.totalClicks || 0),
    referrals: acc.referrals + (curr.totalReferrals || 0),
    active: acc.active + (curr.activeReferrals || 0),
    balance: acc.balance + parseFloat(curr.balance || 0)
  }), { clicks: 0, referrals: 0, active: 0, balance: 0 });

  return (
    <div className="affiliates-tab-content">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="mini-stats-card">
            <Statistic title="Total de Cliques" value={totalMetrics.clicks} prefix={<EyeOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="mini-stats-card">
            <Statistic title="Total de Indicados" value={totalMetrics.referrals} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="mini-stats-card">
            <Statistic title="Usuários Ativos" value={totalMetrics.active} valueStyle={{ color: '#3f8600' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="mini-stats-card">
            <Statistic title="Comissões Pendentes" value={totalMetrics.balance} precision={2} prefix="R$" />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Parceiros Afiliados</Title>
        <Button type="primary" icon={<TrophyOutlined />} onClick={fetchRanking} ghost>
          Ver Ranking Geral
        </Button>
      </div>

      <Table
        columns={affiliateColumns}
        dataSource={affiliates}
        rowKey="id"
        loading={loading}
        className="affiliates-table-custom"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`Histórico - ${selectedAffiliate?.name}`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={selectedAffiliate?.referrals}
          columns={[
            { title: 'Data', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
            { title: 'Indicado', dataIndex: ['referred', 'name'] },
            { title: 'Plano', dataIndex: ['plan', 'name'], render: (p) => <Tag color="blue">{p}</Tag> },
            { title: 'Comissão', dataIndex: 'commissionAmount', render: (v) => `R$ ${parseFloat(v).toFixed(2)}` }
          ]}
          pagination={{ pageSize: 5 }}
        />
      </Modal>

      <Modal
        title={<span><TrophyOutlined style={{ color: '#faad14' }} /> Ranking de Afiliados</span>}
        open={rankingModalVisible}
        onCancel={() => setRankingModalVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          columns={rankingColumns}
          dataSource={ranking}
          rowKey="id"
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default AffiliatesTab;