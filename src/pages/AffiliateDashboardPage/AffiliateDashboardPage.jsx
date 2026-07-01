// src/pages/AffiliateDashboardPage/AffiliateDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Typography, Table, Tag, Button, message, Empty,
  Divider, Modal, Form, Input, Tabs, Select, Space, Alert, Collapse
} from 'antd';
import {
  TeamOutlined, DollarOutlined, LinkOutlined, TrophyOutlined, EyeOutlined,
  PercentageOutlined, EditOutlined, CopyOutlined
} from '@ant-design/icons';
import apiClient from '../../services/api';
import { getSocket } from '../../services/socket';
import './AffiliateDashboardPage.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const SITE = 'https://www.map-nocontrole.com.br';
// Planos (ids consistentes com o restante do sistema).
const PLANS = [
  { id: 7, name: 'Básico Mensal' },
  { id: 8, name: 'Básico Anual' },
  { id: 9, name: 'Avançado Mensal' },
  { id: 10, name: 'Avançado Anual' },
];
const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const LEAD_STATUS = {
  aberto: { label: 'Abriu o link', color: 'blue' },
  cadastrou: { label: 'Criou a conta', color: 'gold' },
  abandonado: { label: 'Abandonado', color: 'red' },
};
const PAYMENT_STATUS = {
  pendente: { label: 'Pendente', color: 'orange' },
  pago: { label: 'Pagamento efetuado', color: 'green' },
};

const AffiliateDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [openComm, setOpenComm] = useState({ total: 0, commissions: [] });
  const [leads, setLeads] = useState([]);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [isSlugModalVisible, setIsSlugModalVisible] = useState(false);
  const [slugLoading, setSlugLoading] = useState(false);
  const [linkPlanId, setLinkPlanId] = useState(null);
  const [form] = Form.useForm();

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [dash, refs, pays, open, lds] = await Promise.all([
        apiClient.get('/affiliate/dashboard'),
        apiClient.get('/affiliate/referrals'),
        apiClient.get('/affiliate/payouts'),
        apiClient.get('/affiliate/open-commissions'),
        apiClient.get('/affiliate/leads'),
      ]);
      setDashboardData(dash.data?.data || null);
      setReferrals(Array.isArray(refs.data?.data) ? refs.data.data : []);
      setPayouts(Array.isArray(pays.data?.data) ? pays.data.data : []);
      setOpenComm(open.data?.data || { total: 0, commissions: [] });
      setLeads(Array.isArray(lds.data?.data) ? lds.data.data : []);
    } catch {
      if (!silent) message.error('Erro ao carregar dados de afiliado.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Tempo real via WebSocket: quando algo muda, recarrega na hora.
    const socket = getSocket();
    if (socket) socket.on('affiliate:update', () => fetchAll(true));
    // Fallback: refetch silencioso a cada 60s (caso o socket caia).
    const t = setInterval(() => fetchAll(true), 60000);
    return () => {
      clearInterval(t);
      if (socket) socket.off('affiliate:update');
    };
  }, []);

  const summary = dashboardData?.summary || {};
  const metrics = dashboardData?.metrics || {};
  const identifier = summary.affiliateSlug || summary.affiliateCode || '';
  const generalLink = `${SITE}/indicacao/${identifier}`;
  const planLink = linkPlanId ? `${SITE}/assinar/${linkPlanId}?ref=${identifier}` : '';

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copiado!`);
  };

  const handleRequestPayout = async () => {
    if (parseFloat(summary.balance || 0) < 50) { message.warning('Saldo mínimo para saque é R$ 50,00.'); return; }
    try {
      setRequestingPayout(true);
      await apiClient.post('/affiliate/request-payout');
      message.success('Saque solicitado! O saldo foi para o histórico e o pagamento será processado pela equipe.');
      fetchAll();
    } catch (e) {
      message.error(e.response?.data?.message || 'Não foi possível solicitar o saque.');
    } finally { setRequestingPayout(false); }
  };

  const handleUpdateSlug = async (values) => {
    try {
      setSlugLoading(true);
      await apiClient.put('/affiliate/update-slug', { slug: values.slug });
      message.success('Link personalizado atualizado!');
      setIsSlugModalVisible(false);
      fetchAll();
    } catch (e) {
      message.error(e.response?.data?.message || 'Erro ao atualizar o link.');
    } finally { setSlugLoading(false); }
  };

  const pendingPayouts = payouts.filter(p => p.status === 'Solicitado');

  const referralColumns = [
    { title: 'Data', dataIndex: 'joinDate', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
    { title: 'Indicado', dataIndex: 'name', render: (t) => <Text strong>{t}</Text> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Ativo' ? 'green' : 'blue'}>{s === 'Ativo' ? 'Assinante' : 'Cadastro'}</Tag> },
    { title: 'Plano', dataIndex: 'subscription', render: (sub) => sub ? <Tag color="geekblue">{sub.planName}</Tag> : '—' },
    { title: 'Comissão', dataIndex: 'subscription', align: 'right', render: (sub) => sub ? <Text type="success" strong>{money(sub.commissionEarned)}</Text> : '—' },
  ];

  const commissionColumns = [
    { title: 'Data', dataIndex: 'date', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
    { title: 'Indicado', dataIndex: 'referredName', render: (t) => <Text strong>{t}</Text> },
    { title: 'Plano', dataIndex: 'planName', render: (p) => p || '—' },
    { title: 'Comissão', dataIndex: 'amount', align: 'right', render: (v) => <Text type="success" strong>{money(v)}</Text> },
  ];

  const payoutColumns = [
    { title: 'Data do pedido', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
    { title: 'Valor', dataIndex: 'amount', align: 'right', render: (v) => <Text strong>{money(v)}</Text> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Pago' ? 'green' : (s === 'Cancelado' ? 'red' : 'gold')}>{s}</Tag> },
    { title: 'Pago em', dataIndex: 'paidAt', render: (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—' },
  ];

  if (loading) return <Card loading style={{ minHeight: 400, margin: 24 }} />;

  return (
    <div className="affiliate-dashboard-container" style={{ padding: 24 }}>
      <Title level={3}>Programa de Afiliados</Title>
      <Paragraph type="secondary">Indique o MAP no Controle e ganhe comissão por cada assinatura feita pelo seu link.</Paragraph>

      {/* Resumo */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Saldo disponível (em aberto)" value={summary.balance} precision={2} prefix="R$" valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Total ganho (histórico)" value={metrics.totalEarned} precision={2} prefix="R$" /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Indicados" value={metrics.totalReferrals} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Assinantes ativos" value={metrics.activeReferrals} prefix={<TrophyOutlined style={{ color: '#faad14' }} />} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Cliques" value={metrics.totalClicks} prefix={<EyeOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Conversão" value={metrics.conversionRate} suffix="%" prefix={<PercentageOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Receita gerada" value={metrics.totalRevenueGenerated} precision={2} prefix="R$" /></Card></Col>
      </Row>

      {/* Meus Links */}
      <Card
        title={<span><LinkOutlined /> Meus Links</span>}
        style={{ marginTop: 16 }}
        extra={<Button size="small" type="link" icon={<EditOutlined />} onClick={() => { form.setFieldsValue({ slug: summary.affiliateSlug }); setIsSlugModalVisible(true); }}>Personalizar</Button>}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text strong>Link geral (a pessoa escolhe o plano)</Text>
            <div className="link-copy-box" style={{ marginTop: 8 }}>
              <Text code ellipsis style={{ flex: 1 }}>{generalLink}</Text>
              <Button type="primary" icon={<CopyOutlined />} onClick={() => copy(generalLink, 'Link geral')}>Copiar</Button>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>Link para um plano específico</Text>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Select placeholder="Escolha o plano" style={{ width: 200 }} value={linkPlanId} onChange={setLinkPlanId}>
                {PLANS.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
              </Select>
              <Button type="primary" icon={<CopyOutlined />} disabled={!linkPlanId} onClick={() => copy(planLink, 'Link do plano')}>Copiar</Button>
            </div>
            {planLink && <Text code style={{ display: 'block', marginTop: 8, wordBreak: 'break-all' }}>{planLink}</Text>}
          </Col>
        </Row>
      </Card>

      {/* Tabs: Em aberto | Histórico | Indicados */}
      <Card style={{ marginTop: 16 }}>
        <Tabs
          defaultActiveKey="aberto"
          items={[
            {
              key: 'aberto',
              label: 'Em aberto',
              children: (
                <>
                  <Row gutter={16} align="middle">
                    <Col flex="auto">
                      <Statistic title="Saldo disponível para saque" value={summary.balance} precision={2} prefix="R$" valueStyle={{ color: '#3f8600', fontSize: 28, fontWeight: 700 }} />
                      <Text type="secondary">Sua chave PIX: {summary.asaasPayoutPixKey || 'não configurada'}</Text>
                    </Col>
                    <Col>
                      <Button type="primary" size="large" icon={<DollarOutlined />} loading={requestingPayout} disabled={parseFloat(summary.balance || 0) < 50} onClick={handleRequestPayout}>
                        Solicitar Saque
                      </Button>
                    </Col>
                  </Row>
                  <Alert style={{ marginTop: 12 }} type="info" showIcon message="Saque mínimo de R$ 50,00. Ao solicitar, todas as comissões em aberto viram um saque no histórico e o pagamento é feito manualmente pela equipe." />
                  <Divider>Comissões em aberto (compõem o saldo)</Divider>
                  <Table columns={commissionColumns} dataSource={openComm.commissions || []} rowKey="id" pagination={{ pageSize: 6 }} locale={{ emptyText: <Empty description="Nenhuma comissão em aberto." /> }} />
                  {pendingPayouts.length > 0 && <>
                    <Divider>Saques aguardando pagamento</Divider>
                    <Table columns={payoutColumns} dataSource={pendingPayouts} rowKey="id" pagination={false} />
                  </>}
                  <Divider>Acompanhamento das aberturas do link (comprou ou não)</Divider>
                  <Table
                    dataSource={leads}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: 'Horário que abriu', dataIndex: 'openedAt', render: (d) => new Date(d).toLocaleString('pt-BR') },
                      { title: 'Possível cliente', dataIndex: 'clientName', render: (v) => v ? <Text strong>{v}</Text> : <Text type="secondary">anônimo</Text> },
                      {
                        title: 'Contato', key: 'contato',
                        render: (_, r) => (r.clientEmail || r.clientPhone) ? (
                          <Space direction="vertical" size={0}>
                            {r.clientEmail && <Text style={{ fontSize: 12 }}>{r.clientEmail}</Text>}
                            {r.clientPhone && <Text style={{ fontSize: 12 }}>{r.clientPhone}</Text>}
                          </Space>
                        ) : '—'
                      },
                      { title: 'Plano', dataIndex: 'plano', render: (p) => p ? <Tag color="geekblue">{p}</Tag> : '—' },
                      { title: 'Valor do plano', dataIndex: 'planValue', align: 'right', render: (v) => v != null ? money(v) : '—' },
                      { title: 'Comissão', dataIndex: 'commission', align: 'right', render: (v) => v != null ? <Text type="success" strong>{money(v)}</Text> : '—' },
                      { title: 'Status', dataIndex: 'leadStatus', render: (s) => <Tag color={(LEAD_STATUS[s] || {}).color}>{(LEAD_STATUS[s] || {}).label || s}</Tag> },
                      { title: 'Criou link de pagamento', dataIndex: 'createdPaymentLink', align: 'center', render: (v) => v ? <Tag color="green">Sim</Tag> : <Tag>Não</Tag> },
                      { title: 'Pagamento', dataIndex: 'paymentStatus', render: (s) => s ? <Tag color={(PAYMENT_STATUS[s] || {}).color}>{(PAYMENT_STATUS[s] || {}).label || s}</Tag> : '—' },
                    ]}
                    locale={{ emptyText: <Empty description="Ninguém abriu seu link ainda." /> }}
                  />
                </>
              ),
            },
            {
              key: 'historico',
              label: 'Histórico',
              children: (
                payouts.length === 0
                  ? <Empty description="Nenhum saque ainda. Quando você solicitar um saque, ele aparece aqui como um fechamento." />
                  : (
                    <Collapse
                      accordion
                      items={payouts.map(p => ({
                        key: String(p.id),
                        label: (
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                            <span><strong>Dia: {new Date(p.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{' '}
                              <Tag color={p.status === 'Pago' ? 'green' : (p.status === 'Cancelado' ? 'red' : 'gold')}>{p.status}</Tag></span>
                            <strong>{money(p.amount)}</strong>
                          </div>
                        ),
                        children: (
                          <>
                            {p.paidAt && <Text type="secondary">Pago em {new Date(p.paidAt).toLocaleDateString('pt-BR')}</Text>}
                            <Table size="small" style={{ marginTop: 8 }} columns={commissionColumns} dataSource={p.commissions || []} rowKey="id" pagination={false} locale={{ emptyText: <Empty description="Sem comissões neste saque." /> }} />
                          </>
                        ),
                      }))}
                    />
                  )
              ),
            },
            {
              key: 'indicados',
              label: 'Meus indicados',
              children: (
                <Table columns={referralColumns} dataSource={referrals} rowKey="referredClientId" pagination={{ pageSize: 8 }} locale={{ emptyText: <Empty description="Nenhuma indicação ainda. Envie seu link para começar!" /> }} />
              ),
            },
          ]}
        />
      </Card>

      <Modal title="Personalizar seu link" open={isSlugModalVisible} onCancel={() => setIsSlugModalVisible(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleUpdateSlug}>
          <Form.Item name="slug" label="Final do link" rules={[
            { required: true, message: 'Digite o final do seu link!' },
            { pattern: /^[a-z0-9-]+$/, message: 'Use apenas letras minúsculas, números e hifens.' }
          ]}>
            <Input prefix="/indicacao/" placeholder="meu-nome-parceiro" maxLength={30} />
          </Form.Item>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>Ex.: <strong>map-nocontrole.com.br/indicacao/meu-nome</strong></Paragraph>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setIsSlugModalVisible(false)} style={{ marginRight: 8 }}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={slugLoading}>Salvar</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AffiliateDashboardPage;
