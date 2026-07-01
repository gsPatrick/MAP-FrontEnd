// src/pages/AdminPage/components/AffiliatesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Typography, Alert, Row, Col, Card, Statistic, Collapse, Empty } from 'antd';
import { DollarOutlined, TeamOutlined, TrophyOutlined, EyeOutlined, SolutionOutlined, ArrowLeftOutlined, HistoryOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Text, Title } = Typography;
const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const LEAD_STATUS = {
  aberto: { label: 'Abriu o link', color: 'blue' },
  cadastrou: { label: 'Criou a conta', color: 'gold' },
  pago: { label: 'Efetuou pagamento', color: 'green' },
  abandonado: { label: 'Abandonado', color: 'red' },
};
const dt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const dth = (d) => d ? new Date(d).toLocaleString('pt-BR') : '—';

const AffiliatesTab = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [view, setView] = useState('list'); // list | detail | history

  // detalhe
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailPayouts, setDetailPayouts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/dashboard/affiliates');
      setAffiliates(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { message.error('Falha ao carregar afiliados.'); }
    finally { setLoading(false); }
  }, []);

  const fetchPendingPayouts = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/affiliates/pending-payouts');
      setPendingPayouts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { setPendingPayouts([]); }
  }, []);

  useEffect(() => { fetchAffiliates(); fetchPendingPayouts(); }, [fetchAffiliates, fetchPendingPayouts]);

  const openDetail = async (record) => {
    setSelected(record);
    setView('detail');
    setDetail(null);
    setDetailPayouts([]);
    setDetailLoading(true);
    try {
      const [detRes, payRes] = await Promise.all([
        apiClient.get(`/admin/affiliates/${record.id}/detail`),
        apiClient.get(`/admin/affiliates/${record.id}/payouts`),
      ]);
      setDetail(detRes.data?.data || null);
      setDetailPayouts(Array.isArray(payRes.data?.data) ? payRes.data.data : []);
    } catch { message.error('Falha ao carregar detalhes do afiliado.'); }
    finally { setDetailLoading(false); }
  };

  const handlePayPayout = async (payoutId) => {
    try {
      await apiClient.post(`/admin/affiliates/payouts/${payoutId}/pay`);
      message.success('Saque marcado como pago!');
      fetchPendingPayouts();
      if (selected) openDetail(selected);
    } catch (e) { message.error(e.response?.data?.message || 'Erro ao marcar como pago.'); }
  };

  const handlePayBalance = async (clientId) => {
    try {
      await apiClient.put(`/admin/clients/${clientId}/clear-balance`);
      message.success('Saldo pago e registrado no histórico!');
      fetchAffiliates(); fetchPendingPayouts();
      if (selected) openDetail(selected);
    } catch (e) { message.error(e.response?.data?.message || 'Erro ao pagar saldo.'); }
  };

  // Afiliados com QUALQUER atividade: alguém abriu o link (clicks), indicou alguém
  // ou tem saldo. (Cliques antigos não eram rastreados, então indicados/saldo contam.)
  const activeAffiliates = affiliates.filter(a =>
    (a.totalClicks || 0) > 0 || (a.totalReferrals || 0) > 0 || parseFloat(a.balance || 0) > 0
  );

  const totals = affiliates.reduce((acc, c) => ({
    clicks: acc.clicks + (c.totalClicks || 0),
    referrals: acc.referrals + (c.totalReferrals || 0),
    active: acc.active + (c.activeReferrals || 0),
    balance: acc.balance + parseFloat(c.balance || 0),
  }), { clicks: 0, referrals: 0, active: 0, balance: 0 });

  // ===== DETALHE (nova "página") =====
  if (view === 'detail') {
    const af = detail?.affiliate || selected || {};
    const detailColumns = [
      { title: 'Horário que abriu', dataIndex: 'openedAt', render: (d) => dth(d) },
      { title: 'Possível cliente', dataIndex: 'clientName', render: (v) => v || <Text type="secondary">anônimo</Text> },
      { title: 'Plano', dataIndex: 'plano', render: (p) => p ? <Tag color="blue">{p}</Tag> : '—' },
      { title: 'Valor do plano', dataIndex: 'planValue', align: 'right', render: (v) => v != null ? money(v) : '—' },
      { title: 'Comissão do afiliado', dataIndex: 'commission', align: 'right', render: (v) => v != null ? <Text type="success" strong>{money(v)}</Text> : '—' },
      { title: 'Status', dataIndex: 'status', align: 'center', render: (s) => <Tag color={(LEAD_STATUS[s] || {}).color}>{(LEAD_STATUS[s] || {}).label || s}</Tag> },
    ];
    return (
      <div className="affiliates-tab-content">
        <Button icon={<ArrowLeftOutlined />} onClick={() => setView('list')} style={{ marginBottom: 16 }}>Voltar</Button>
        <Title level={4} style={{ marginTop: 0 }}>{af.name}</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Saldo atual (em aberto)" value={af.balance} precision={2} prefix="R$" valueStyle={{ color: '#3f8600' }} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Aberturas do link" value={af.affiliateLinkClicks || selected?.totalClicks || 0} prefix={<EyeOutlined />} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Indicados" value={selected?.totalReferrals} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Assinantes" value={selected?.activeReferrals} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        </Row>
        {parseFloat(af.balance || 0) > 0 && (
          <Popconfirm title="Registrar pagamento do saldo atual?" okText="Paguei" cancelText="Cancelar" onConfirm={() => handlePayBalance(af.id)}>
            <Button type="primary" icon={<DollarOutlined />} style={{ marginBottom: 16 }}>Pagar saldo atual ({money(af.balance)})</Button>
          </Popconfirm>
        )}

        <Card title="Possíveis clientes (aberturas do link)" size="small" style={{ marginBottom: 16 }}>
          <Table
            loading={detailLoading}
            columns={detailColumns}
            dataSource={detail?.rows || []}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="Ninguém abriu o link ainda." /> }}
          />
        </Card>

        <Card title="Saques deste afiliado" size="small">
          <Table
            loading={detailLoading}
            dataSource={detailPayouts}
            rowKey="id"
            pagination={{ pageSize: 6 }}
            columns={[
              { title: 'Data do pedido', dataIndex: 'createdAt', render: dt },
              { title: 'Valor', dataIndex: 'amount', align: 'right', render: money },
              { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Pago' ? 'green' : (s === 'Cancelado' ? 'red' : 'gold')}>{s}</Tag> },
              { title: 'Pago em', dataIndex: 'paidAt', render: dt },
              { title: 'Ação', key: 'a', render: (_, r) => r.status === 'Solicitado' ? <Popconfirm title="Confirmar pagamento?" okText="Paguei" cancelText="Cancelar" onConfirm={() => handlePayPayout(r.id)}><Button size="small" type="primary">Marcar pago</Button></Popconfirm> : null },
            ]}
            locale={{ emptyText: <Empty description="Nenhum saque." /> }}
          />
        </Card>
      </div>
    );
  }

  // ===== HISTÓRICO (saques fechados/pagos por dia) =====
  if (view === 'history') {
    // Junta todos os saques Pagos de todos os afiliados (via lista já carregada seria pouco;
    // então buscamos por afiliado com saldo/atividade). Simplif.: usa pending + reconsulta.
    return (
      <div className="affiliates-tab-content">
        <Button icon={<ArrowLeftOutlined />} onClick={() => setView('list')} style={{ marginBottom: 16 }}>Voltar</Button>
        <Title level={4} style={{ marginTop: 0 }}>Histórico de pagamentos (fechados)</Title>
        <HistoryPaid />
      </div>
    );
  }

  // ===== LISTA =====
  const columns = [
    { title: 'Afiliado', dataIndex: 'name', render: (t, r) => (<Space direction="vertical" size={0}><Text strong>{t}</Text><Text type="secondary" style={{ fontSize: 11 }}>{r.affiliateCode}{r.affiliateSlug ? ` · /${r.affiliateSlug}` : ''}</Text></Space>) },
    { title: 'Aberturas', dataIndex: 'totalClicks', align: 'center', render: (v) => <Text strong>{v || 0}</Text> },
    { title: 'Indicados', key: 'ref', align: 'center', render: (_, r) => <span><Text strong>{r.activeReferrals}</Text> <Text type="secondary">/ {r.totalReferrals}</Text></span> },
    { title: 'Saldo atual', dataIndex: 'balance', align: 'right', render: (v) => <Text type="success" strong>{money(v)}</Text> },
    { title: '', key: 'act', align: 'right', render: (_, r) => <Button icon={<SolutionOutlined />} onClick={() => openDetail(r)}>Ver detalhes</Button> },
  ];

  return (
    <div className="affiliates-tab-content">
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}><Card bordered={false} className="mini-stats-card"><Statistic title="Aberturas de links" value={totals.clicks} prefix={<EyeOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} className="mini-stats-card"><Statistic title="Indicados" value={totals.referrals} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} className="mini-stats-card"><Statistic title="Assinantes ativos" value={totals.active} valueStyle={{ color: '#3f8600' }} prefix={<TrophyOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} className="mini-stats-card"><Statistic title="Comissões em aberto" value={totals.balance} precision={2} prefix="R$" /></Card></Col>
      </Row>

      {pendingPayouts.length > 0 && (
        <Card title={<span><DollarOutlined /> Saques pendentes ({pendingPayouts.length})</span>} style={{ marginBottom: 20, borderColor: '#faad14' }} headStyle={{ background: '#fffbe6' }}>
          <Table dataSource={pendingPayouts} rowKey="id" pagination={false} columns={[
            { title: 'Data', dataIndex: 'createdAt', render: dt },
            { title: 'Afiliado', dataIndex: ['affiliate', 'name'], render: (v, r) => <><Text strong>{v}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.affiliate?.phone}</Text></> },
            { title: 'Valor', dataIndex: 'amount', align: 'right', render: money },
            { title: 'Chave PIX', dataIndex: 'pixKey', render: (v) => v || <Text type="secondary">não informada</Text> },
            { title: 'Ação', key: 'a', align: 'center', render: (_, r) => <Popconfirm title={`Confirmar pagamento de ${money(r.amount)}?`} okText="Paguei" cancelText="Cancelar" onConfirm={() => handlePayPayout(r.id)}><Button type="primary" size="small" icon={<DollarOutlined />}>Marcar pago</Button></Popconfirm> },
          ]} />
        </Card>
      )}

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>Afiliados com atividade</Title>
        <Button icon={<HistoryOutlined />} onClick={() => setView('history')}>Histórico de pagamentos</Button>
      </div>
      <Table
        columns={columns}
        dataSource={activeAffiliates}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        onRow={(r) => ({ onClick: () => openDetail(r), style: { cursor: 'pointer' } })}
        locale={{ emptyText: <Empty description="Nenhum afiliado com atividade ainda." /> }}
      />
    </div>
  );
};

// Histórico de saques PAGOS (fechados), agrupados por dia. Busca por afiliado ativo.
const HistoryPaid = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const affRes = await apiClient.get('/admin/dashboard/affiliates');
        const affs = (affRes.data?.data || []).filter(a => (a.totalReferrals || 0) > 0 || parseFloat(a.balance || 0) > 0 || (a.totalClicks || 0) > 0);
        const all = [];
        for (const a of affs) {
          try {
            const pr = await apiClient.get(`/admin/affiliates/${a.id}/payouts`);
            (pr.data?.data || []).filter(p => p.status === 'Pago').forEach(p => all.push({ ...p, affiliateName: a.name }));
          } catch { /* ignora */ }
        }
        // agrupa por dia (paidAt ou createdAt)
        const byDay = {};
        all.forEach(p => {
          const day = new Date(p.paidAt || p.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
          (byDay[day] = byDay[day] || []).push(p);
        });
        setGroups(Object.entries(byDay).map(([day, items]) => ({ day, items, total: items.reduce((s, i) => s + parseFloat(i.amount || 0), 0) })));
      } catch { setGroups([]); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Card loading />;
  if (groups.length === 0) return <Empty description="Nenhum pagamento fechado ainda." />;
  return (
    <Collapse accordion items={groups.map((g, i) => ({
      key: String(i),
      label: <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><strong>Dia: {g.day}</strong><strong>{money(g.total)}</strong></div>,
      children: (
        <Table
          size="small"
          dataSource={g.items}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Afiliado', dataIndex: 'affiliateName' },
            { title: 'Valor', dataIndex: 'amount', align: 'right', render: money },
            { title: 'Pedido em', dataIndex: 'createdAt', render: dt },
            { title: 'Pago em', dataIndex: 'paidAt', render: dt },
          ]}
        />
      ),
    }))} />
  );
};

export default AffiliatesTab;
