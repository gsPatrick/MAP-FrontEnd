// src/pages/AdminPage/components/AffiliatesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, Modal, message, Popconfirm, Tooltip, Typography, Alert, Row, Col, Card, Statistic, Divider, Tabs, Empty } from 'antd';
import { DollarOutlined, HistoryOutlined, TeamOutlined, TrophyOutlined, EyeOutlined, PercentageOutlined, SolutionOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Text, Title } = Typography;

const AffiliatesTab = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [rankingModalVisible, setRankingModalVisible] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [detailPayouts, setDetailPayouts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const openAffiliateDetails = async (record) => {
    setSelectedAffiliate(record);
    setHistoryModalVisible(true);
    setDetailPayouts([]);
    try {
      setDetailLoading(true);
      const res = await apiClient.get(`/admin/affiliates/${record.id}/payouts`);
      setDetailPayouts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { setDetailPayouts([]); }
    finally { setDetailLoading(false); }
  };

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

  const fetchPendingPayouts = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/affiliates/pending-payouts');
      setPendingPayouts(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setPendingPayouts([]);
    }
  }, []);

  const handlePayPayout = async (payoutId) => {
    try {
      await apiClient.post(`/admin/affiliates/payouts/${payoutId}/pay`);
      message.success('Saque marcado como pago!');
      fetchPendingPayouts();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao marcar saque como pago.');
    }
  };

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
    fetchPendingPayouts();
  }, [fetchAffiliates, fetchPendingPayouts]);

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
          <Button icon={<SolutionOutlined />} onClick={() => openAffiliateDetails(record)}>
            Ver detalhes
          </Button>
          <Popconfirm
            title="Registrar pagamento do saldo?"
            description={`Marca o saldo de ${parseFloat(record.balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} como pago (vai pro histórico). Os indicados são preservados.`}
            onConfirm={() => handleClearBalance(record.id)}
            okText="Paguei"
            cancelText="Cancelar"
            disabled={parseFloat(record.balance || 0) <= 0}
          >
            <Button type="primary" icon={<DollarOutlined />} size="small" disabled={parseFloat(record.balance || 0) <= 0}>
              Pagar saldo
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

      {pendingPayouts.length > 0 && (
        <Card
          title={<span><DollarOutlined /> Saques pendentes ({pendingPayouts.length})</span>}
          style={{ marginBottom: 20, borderColor: '#faad14' }}
          headStyle={{ background: '#fffbe6' }}
        >
          <Table
            dataSource={pendingPayouts}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'Data do pedido', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
              { title: 'Afiliado', dataIndex: ['affiliate', 'name'], render: (v, r) => <><Text strong>{v}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.affiliate?.phone}</Text></> },
              { title: 'Valor', dataIndex: 'amount', align: 'right', render: (v) => <Text strong>R$ {parseFloat(v).toFixed(2)}</Text> },
              { title: 'Chave PIX', dataIndex: 'pixKey', render: (v) => v || <Text type="secondary">não informada</Text> },
              {
                title: 'Ação', key: 'acao', align: 'center',
                render: (_, r) => (
                  <Popconfirm title={`Confirmar pagamento de R$ ${parseFloat(r.amount).toFixed(2)}?`} okText="Sim, paguei" cancelText="Cancelar" onConfirm={() => handlePayPayout(r.id)}>
                    <Button type="primary" size="small" icon={<DollarOutlined />}>Marcar como pago</Button>
                  </Popconfirm>
                )
              },
            ]}
          />
        </Card>
      )}

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Parceiros Afiliados</Title>
        <Button type="primary" icon={<TrophyOutlined />} onClick={fetchRanking} ghost>
          Ver Ranking Geral
        </Button>
      </div>

      <Table
        columns={affiliateColumns}
        dataSource={affiliates.filter(a => (a.totalReferrals || 0) > 0 || (a.totalClicks || 0) > 0 || parseFloat(a.balance || 0) > 0)}
        rowKey="id"
        loading={loading}
        className="affiliates-table-custom"
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({ onClick: () => openAffiliateDetails(record), style: { cursor: 'pointer' } })}
        locale={{ emptyText: <Empty description="Nenhum afiliado com atividade ainda." /> }}
      />

      <Modal
        title={<span><SolutionOutlined /> {selectedAffiliate?.name} — detalhes de afiliado</span>}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={820}
      >
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col xs={12} md={6}><Statistic title="Saldo atual (em aberto)" value={selectedAffiliate?.balance} precision={2} prefix="R$" valueStyle={{ color: '#3f8600' }} /></Col>
          <Col xs={12} md={6}><Statistic title="Indicados" value={selectedAffiliate?.totalReferrals} /></Col>
          <Col xs={12} md={6}><Statistic title="Ativos" value={selectedAffiliate?.activeReferrals} /></Col>
          <Col xs={12} md={6}><Statistic title="Cliques" value={selectedAffiliate?.totalClicks} /></Col>
        </Row>
        {parseFloat(selectedAffiliate?.balance || 0) > 0 && (
          <Popconfirm
            title="Registrar pagamento do saldo?"
            description="Marca o saldo atual como pago (vai pro histórico)."
            okText="Paguei" cancelText="Cancelar"
            onConfirm={() => { handleClearBalance(selectedAffiliate.id); setHistoryModalVisible(false); }}
          >
            <Button type="primary" icon={<DollarOutlined />} style={{ marginBottom: 12 }}>Pagar saldo atual</Button>
          </Popconfirm>
        )}
        <Tabs
          defaultActiveKey="indicados"
          items={[
            {
              key: 'indicados',
              label: 'Indicados / Comissões',
              children: (
                <Table
                  dataSource={selectedAffiliate?.referrals || []}
                  rowKey={(r, i) => `${r.referredClientId || i}`}
                  columns={[
                    { title: 'Data', dataIndex: 'createdAt', render: (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—' },
                    { title: 'Indicado', dataIndex: ['referred', 'name'], render: (v, r) => v || r.name || '—' },
                    { title: 'Plano', dataIndex: ['plan', 'name'], render: (p) => p ? <Tag color="blue">{p}</Tag> : '—' },
                    { title: 'Comissão', dataIndex: 'commissionAmount', align: 'right', render: (v) => v != null ? `R$ ${parseFloat(v).toFixed(2)}` : '—' },
                  ]}
                  pagination={{ pageSize: 6 }}
                  locale={{ emptyText: <Empty description="Sem indicados." /> }}
                />
              ),
            },
            {
              key: 'saques',
              label: 'Saques',
              children: (
                <Table
                  loading={detailLoading}
                  dataSource={detailPayouts}
                  rowKey="id"
                  columns={[
                    { title: 'Data do pedido', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
                    { title: 'Valor', dataIndex: 'amount', align: 'right', render: (v) => `R$ ${parseFloat(v).toFixed(2)}` },
                    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Pago' ? 'green' : (s === 'Cancelado' ? 'red' : 'gold')}>{s}</Tag> },
                    { title: 'Pago em', dataIndex: 'paidAt', render: (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—' },
                    {
                      title: 'Ação', key: 'acao', render: (_, r) => r.status === 'Solicitado'
                        ? <Popconfirm title="Confirmar pagamento?" okText="Paguei" cancelText="Cancelar" onConfirm={() => handlePayPayout(r.id).then(() => openAffiliateDetails(selectedAffiliate))}><Button size="small" type="primary">Marcar pago</Button></Popconfirm>
                        : null
                    },
                  ]}
                  pagination={{ pageSize: 6 }}
                  locale={{ emptyText: <Empty description="Nenhum saque." /> }}
                />
              ),
            },
          ]}
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