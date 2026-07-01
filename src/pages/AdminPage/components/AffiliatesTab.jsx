// src/pages/AdminPage/components/AffiliatesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Typography, Alert, Row, Col, Card, Statistic, Collapse, Empty, Tabs, Select, Divider } from 'antd';
import { DollarOutlined, EyeOutlined, SolutionOutlined, ArrowLeftOutlined, LinkOutlined, CopyOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';
import { getSocket } from '../../../services/socket';

const { Text, Title } = Typography;
const { Option } = Select;
const SITE = 'https://www.map-nocontrole.com.br';
const PLANS = [
  { id: 7, name: 'Básico Mensal' },
  { id: 8, name: 'Básico Anual' },
  { id: 9, name: 'Avançado Mensal' },
  { id: 10, name: 'Avançado Anual' },
];
const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const dth = (d) => d ? new Date(d).toLocaleString('pt-BR') : '—';
const LEAD_STATUS = {
  aberto: { label: 'Abriu o link', color: 'blue' },
  cadastrou: { label: 'Criou a conta', color: 'gold' },
  abandonado: { label: 'Abandonado', color: 'red' },
};
const PAYMENT_STATUS = {
  pendente: { label: 'Pendente', color: 'orange' },
  pago: { label: 'Pagamento efetuado', color: 'green' },
};

const AffiliatesTab = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // list | detail
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linkPlanId, setLinkPlanId] = useState(null);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/dashboard/affiliates');
      setAffiliates(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { message.error('Falha ao carregar afiliados.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAffiliates(); }, [fetchAffiliates]);

  // Tempo real: enquanto o detalhe está aberto, observa a sala do afiliado via
  // WebSocket e recarrega na hora; fallback de 60s caso o socket caia.
  useEffect(() => {
    if (view !== 'detail' || !selected) return;
    const reload = async () => {
      try {
        const res = await apiClient.get(`/admin/affiliates/${selected.id}/full`);
        setDetail(res.data?.data || null);
      } catch { /* silencioso */ }
    };
    const socket = getSocket();
    if (socket) {
      socket.emit('watch-affiliate', selected.id);
      socket.on('affiliate:update', reload);
    }
    const t = setInterval(reload, 60000);
    return () => {
      clearInterval(t);
      if (socket) {
        socket.emit('unwatch-affiliate', selected.id);
        socket.off('affiliate:update', reload);
      }
    };
  }, [view, selected]);

  const openDetail = async (record) => {
    setSelected(record);
    setView('detail');
    setDetail(null);
    setLinkPlanId(null);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/admin/affiliates/${record.id}/full`);
      setDetail(res.data?.data || null);
    } catch { message.error('Falha ao carregar detalhes do afiliado.'); }
    finally { setDetailLoading(false); }
  };

  const refreshDetail = () => { if (selected) openDetail(selected); fetchAffiliates(); };

  const handlePayPayout = async (payoutId) => {
    try {
      await apiClient.post(`/admin/affiliates/payouts/${payoutId}/pay`);
      message.success('Saque marcado como pago!');
      refreshDetail();
    } catch (e) { message.error(e.response?.data?.message || 'Erro ao marcar como pago.'); }
  };

  const handlePayBalance = async (clientId) => {
    try {
      await apiClient.put(`/admin/clients/${clientId}/clear-balance`);
      message.success('Saldo pago e registrado no histórico!');
      refreshDetail();
    } catch (e) { message.error(e.response?.data?.message || 'Erro ao pagar saldo.'); }
  };

  const copy = (text, label) => { navigator.clipboard.writeText(text); message.success(`${label} copiado!`); };

  const activeAffiliates = affiliates.filter(a =>
    (a.totalClicks || 0) > 0 || (a.totalReferrals || 0) > 0 || parseFloat(a.balance || 0) > 0
  );

  // ============ COLUNAS REUTILIZÁVEIS ============
  const commissionColumns = [
    { title: 'Data', dataIndex: 'date', render: dt },
    { title: 'Indicado', dataIndex: 'referredName', render: (t) => <Text strong>{t}</Text> },
    { title: 'Plano', dataIndex: 'planName', render: (p) => p || '—' },
    { title: 'Comissão', dataIndex: 'amount', align: 'right', render: (v) => <Text type="success" strong>{money(v)}</Text> },
  ];
  const payoutColumns = [
    { title: 'Data do pedido', dataIndex: 'createdAt', render: dt },
    { title: 'Valor', dataIndex: 'amount', align: 'right', render: money },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Pago' ? 'green' : (s === 'Cancelado' ? 'red' : 'gold')}>{s}</Tag> },
    { title: 'Pago em', dataIndex: 'paidAt', render: dt },
    { title: 'Ação', key: 'a', render: (_, r) => r.status === 'Solicitado' ? <Popconfirm title="Confirmar pagamento?" okText="Paguei" cancelText="Cancelar" onConfirm={() => handlePayPayout(r.id)}><Button size="small" type="primary">Marcar pago</Button></Popconfirm> : null },
  ];
  const referralColumns = [
    { title: 'Data', dataIndex: 'joinDate', render: dt },
    { title: 'Indicado', dataIndex: 'name', render: (t) => <Text strong>{t}</Text> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Ativo' ? 'green' : 'blue'}>{s === 'Ativo' ? 'Assinante' : 'Cadastro'}</Tag> },
    { title: 'Plano', dataIndex: 'subscription', render: (sub) => sub ? <Tag color="geekblue">{sub.planName}</Tag> : '—' },
    { title: 'Comissão', dataIndex: 'subscription', align: 'right', render: (sub) => sub ? <Text type="success" strong>{money(sub.commissionEarned)}</Text> : '—' },
  ];
  const leadColumns = [
    { title: 'Horário que abriu', dataIndex: 'openedAt', render: dth },
    { title: 'Nome do cliente', dataIndex: 'clientName', render: (v) => v ? <Text strong>{v}</Text> : <Text type="secondary">anônimo</Text> },
    { title: 'Email', dataIndex: 'clientEmail', render: (v) => v || '—' },
    { title: 'Telefone', dataIndex: 'clientPhone', render: (v) => v || '—' },
    { title: 'Plano', dataIndex: 'plano', render: (p) => p ? <Tag color="geekblue">{p}</Tag> : '—' },
    { title: 'Valor do plano', dataIndex: 'planValue', align: 'right', render: (v) => v != null ? money(v) : '—' },
    { title: 'Comissão', dataIndex: 'commission', align: 'right', render: (v) => v != null ? <Text type="success" strong>{money(v)}</Text> : '—' },
    { title: 'Status', dataIndex: 'leadStatus', align: 'center', render: (s) => <Tag color={(LEAD_STATUS[s] || {}).color}>{(LEAD_STATUS[s] || {}).label || s}</Tag> },
    { title: 'Criou link de pagamento', dataIndex: 'createdPaymentLink', align: 'center', render: (v) => v ? <Tag color="green">Sim</Tag> : <Tag>Não</Tag> },
    { title: 'Pagamento', dataIndex: 'paymentStatus', align: 'center', render: (s) => s ? <Tag color={(PAYMENT_STATUS[s] || {}).color}>{(PAYMENT_STATUS[s] || {}).label || s}</Tag> : '—' },
  ];

  // ============ DETALHE (clone da página do usuário) ============
  if (view === 'detail') {
    const summary = detail?.summary || {};
    const metrics = detail?.metrics || {};
    const identifier = summary.affiliateSlug || summary.affiliateCode || '';
    const generalLink = `${SITE}/indicacao/${identifier}`;
    const planLink = linkPlanId ? `${SITE}/assinar/${linkPlanId}?ref=${identifier}` : '';
    const openComm = detail?.openCommissions || { total: 0, commissions: [] };
    const payouts = detail?.payouts || [];
    const pendingPayouts = payouts.filter(p => p.status === 'Solicitado');
    const referrals = detail?.referrals || [];
    const leads = detail?.leads || [];

    return (
      <div className="affiliates-tab-content">
        <Button icon={<ArrowLeftOutlined />} onClick={() => setView('list')} style={{ marginBottom: 16 }}>Voltar</Button>
        <Title level={3} style={{ marginTop: 0 }}>{summary.name || selected?.name}</Title>

        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Saldo disponível (em aberto)" value={summary.balance} precision={2} prefix="R$" valueStyle={{ color: '#3f8600' }} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Total ganho (histórico)" value={metrics.totalEarned} precision={2} prefix="R$" /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Indicados" value={metrics.totalReferrals} prefix={<TeamOutlined />} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Assinantes ativos" value={metrics.activeReferrals} prefix={<TrophyOutlined style={{ color: '#faad14' }} />} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Aberturas" value={metrics.totalClicks} prefix={<EyeOutlined />} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Conversão" value={metrics.conversionRate} suffix="%" /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Receita gerada" value={metrics.totalRevenueGenerated} precision={2} prefix="R$" /></Card></Col>
        </Row>

        <Card title={<span><LinkOutlined /> Links do afiliado</span>} style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong>Link geral</Text>
              <div className="link-copy-box" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Text code ellipsis style={{ flex: 1 }}>{generalLink}</Text>
                <Button icon={<CopyOutlined />} onClick={() => copy(generalLink, 'Link geral')}>Copiar</Button>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Text strong>Link para um plano específico</Text>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Select placeholder="Escolha o plano" style={{ width: 200 }} value={linkPlanId} onChange={setLinkPlanId}>
                  {PLANS.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
                <Button icon={<CopyOutlined />} disabled={!linkPlanId} onClick={() => copy(planLink, 'Link do plano')}>Copiar</Button>
              </div>
            </Col>
          </Row>
        </Card>

        <Card style={{ marginTop: 16 }} loading={detailLoading}>
          <Tabs
            defaultActiveKey="aberto"
            items={[
              {
                key: 'aberto', label: 'Em aberto',
                children: (
                  <>
                    <Row gutter={16} align="middle">
                      <Col flex="auto">
                        <Statistic title="Saldo disponível para saque" value={summary.balance} precision={2} prefix="R$" valueStyle={{ color: '#3f8600', fontSize: 28, fontWeight: 700 }} />
                        <Text type="secondary">Chave PIX: {summary.asaasPayoutPixKey || 'não configurada'}</Text>
                      </Col>
                      <Col>
                        <Popconfirm title={`Registrar pagamento de ${money(summary.balance)}?`} okText="Paguei" cancelText="Cancelar" onConfirm={() => handlePayBalance(summary.id)} disabled={parseFloat(summary.balance || 0) <= 0}>
                          <Button type="primary" size="large" icon={<DollarOutlined />} disabled={parseFloat(summary.balance || 0) <= 0}>Pagar saldo</Button>
                        </Popconfirm>
                      </Col>
                    </Row>
                    <Divider>Comissões em aberto (compõem o saldo)</Divider>
                    <Table columns={commissionColumns} dataSource={openComm.commissions || []} rowKey="id" pagination={{ pageSize: 6 }} locale={{ emptyText: <Empty description="Nenhuma comissão em aberto." /> }} />
                    {pendingPayouts.length > 0 && <>
                      <Divider>Saques aguardando pagamento</Divider>
                      <Table columns={payoutColumns} dataSource={pendingPayouts} rowKey="id" pagination={false} />
                    </>}
                    <Divider>Acompanhamento das aberturas do link (comprou ou não)</Divider>
                    <Table columns={leadColumns} dataSource={leads} rowKey="id" pagination={{ pageSize: 8 }} locale={{ emptyText: <Empty description="Ninguém abriu o link ainda." /> }} />
                  </>
                ),
              },
              {
                key: 'historico', label: 'Histórico',
                children: (
                  payouts.length === 0
                    ? <Empty description="Nenhum saque ainda." />
                    : <Collapse accordion items={payouts.map(p => ({
                        key: String(p.id),
                        label: (
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                            <span><strong>Dia: {new Date(p.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{' '}
                              <Tag color={p.status === 'Pago' ? 'green' : (p.status === 'Cancelado' ? 'red' : 'gold')}>{p.status}</Tag></span>
                            <strong>{money(p.amount)}</strong>
                          </div>
                        ),
                        children: (<>
                          {p.paidAt && <Text type="secondary">Pago em {dt(p.paidAt)}</Text>}
                          <Table size="small" style={{ marginTop: 8 }} columns={commissionColumns} dataSource={p.commissions || []} rowKey="id" pagination={false} locale={{ emptyText: <Empty description="Sem comissões neste saque." /> }} />
                        </>),
                      }))} />
                ),
              },
              {
                key: 'indicados', label: 'Indicados',
                children: <Table columns={referralColumns} dataSource={referrals} rowKey="referredClientId" pagination={{ pageSize: 8 }} locale={{ emptyText: <Empty description="Nenhuma indicação." /> }} />,
              },
            ]}
          />
        </Card>
      </div>
    );
  }

  // ============ LISTA (só a listagem, sem cards de dados) ============
  const columns = [
    { title: 'Afiliado', dataIndex: 'name', render: (t, r) => (<Space direction="vertical" size={0}><Text strong>{t}</Text><Text type="secondary" style={{ fontSize: 11 }}>{r.affiliateCode}{r.affiliateSlug ? ` · /${r.affiliateSlug}` : ''}</Text></Space>) },
    { title: 'Aberturas', dataIndex: 'totalClicks', align: 'center', render: (v) => <Text strong>{v || 0}</Text> },
    { title: 'Indicados', key: 'ref', align: 'center', render: (_, r) => <span><Text strong>{r.activeReferrals}</Text> <Text type="secondary">/ {r.totalReferrals}</Text></span> },
    { title: 'Saldo atual', dataIndex: 'balance', align: 'right', render: (v) => <Text type="success" strong>{money(v)}</Text> },
    { title: '', key: 'act', align: 'right', render: (_, r) => <Button icon={<SolutionOutlined />} onClick={(e) => { e.stopPropagation(); openDetail(r); }}>Ver detalhes</Button> },
  ];

  return (
    <div className="affiliates-tab-content">
      <Title level={3} style={{ marginBottom: 16 }}>Gerenciamento de Afiliados</Title>
      <Table
        columns={columns}
        dataSource={activeAffiliates}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 12 }}
        onRow={(r) => ({ onClick: () => openDetail(r), style: { cursor: 'pointer' } })}
        locale={{ emptyText: <Empty description="Nenhum afiliado com atividade ainda." /> }}
      />
    </div>
  );
};

export default AffiliatesTab;
