// src/pages/AdminPage/pages/SupportManagementPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tag, Button, Card, Typography, message, Select, Row, Col, Statistic, Empty, Spin, Input, Divider, Segmented, Descriptions } from 'antd';
import { CustomerServiceOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, MessageOutlined, SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLOR = { 'Aberto': 'gold', 'Em andamento': 'blue', 'Resolvido': 'green', 'Cancelado': 'red' };
const TYPE_COLOR = { Tecnico: 'red', Financeiro: 'gold', Duvida: 'blue', Sugestao: 'green' };
const STATUS_OPTIONS = ['Aberto', 'Em andamento', 'Resolvido', 'Cancelado'];

const SupportManagementPage = () => {
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  // Chat (página cheia)
  const [chatTicket, setChatTicket] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsRes, metricsRes] = await Promise.all([
        apiClient.get('/support/admin/tickets'),
        apiClient.get('/support/admin/metrics'),
      ]);
      setTickets(Array.isArray(ticketsRes.data?.data) ? ticketsRes.data.data : []);
      setMetrics(metricsRes.data?.data || null);
    } catch {
      message.error('Erro ao carregar chamados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (chatTicket?.messages) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [chatTicket?.messages]);

  const openChat = async (ticketId) => {
    setChatLoading(true);
    setChatTicket({ id: ticketId, messages: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await apiClient.get(`/support/admin/tickets/${ticketId}`);
      setChatTicket(res.data?.data || null);
    } catch {
      message.error('Erro ao abrir o chamado.');
      setChatTicket(null);
    } finally {
      setChatLoading(false);
    }
  };

  const reloadChat = async () => {
    if (!chatTicket) return;
    const res = await apiClient.get(`/support/admin/tickets/${chatTicket.id}`);
    setChatTicket(res.data?.data || null);
  };

  const sendMessage = async () => {
    if (!text.trim() || !chatTicket) return;
    setSending(true);
    try {
      await apiClient.post(`/support/admin/tickets/${chatTicket.id}/messages`, { message: text });
      setText('');
      await reloadChat();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (newStatus) => {
    if (!chatTicket) return;
    setStatusLoading(true);
    try {
      await apiClient.put(`/support/admin/tickets/${chatTicket.id}`, { status: newStatus });
      setChatTicket((prev) => ({ ...prev, status: newStatus }));
      fetchData();
      message.success(`Status alterado para "${newStatus}".`);
    } catch {
      message.error('Falha ao atualizar status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // ===== PÁGINA DE CHAT =====
  if (chatTicket) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setChatTicket(null)} style={{ marginBottom: 16 }}>Voltar aos chamados</Button>
        {chatLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={<span><MessageOutlined /> {chatTicket.subject}</span>}
                extra={
                  <Select value={chatTicket.status} onChange={changeStatus} loading={statusLoading} style={{ width: 170 }}>
                    {STATUS_OPTIONS.map(s => <Option key={s} value={s}>{s}</Option>)}
                  </Select>
                }
              >
                <div className="admin-chat-window">
                  {(chatTicket.messages || []).length === 0 ? (
                    <Empty description="Sem mensagens." />
                  ) : (chatTicket.messages || []).map((m) => {
                    const admin = m.senderType === 'admin';
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: admin ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                        <div style={{ maxWidth: '78%', background: admin ? '#d24d1e' : '#fff', color: admin ? '#fff' : '#000', border: admin ? 'none' : '1px solid #eee', borderRadius: 12, padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>{m.senderName || (admin ? 'Suporte' : 'Cliente')}</div>
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.message}</div>
                          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{m.createdAt ? dayjs(m.createdAt).format('DD/MM HH:mm') : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <TextArea value={text} onChange={(e) => setText(e.target.value)} autoSize={{ minRows: 1, maxRows: 4 }} placeholder="Responder ao cliente..." onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                  <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={sendMessage}>Enviar</Button>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Cliente / chamado">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Cliente">{chatTicket.client?.name || '—'}</Descriptions.Item>
                  <Descriptions.Item label="E-mail">{chatTicket.client?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Telefone">{chatTicket.client?.phone || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Tipo"><Tag color={TYPE_COLOR[chatTicket.type] || 'default'}>{chatTicket.type}</Tag></Descriptions.Item>
                  <Descriptions.Item label="Prioridade">{chatTicket.priority}</Descriptions.Item>
                  <Descriptions.Item label="Aberto em">{chatTicket.createdAt ? dayjs(chatTicket.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}
        <style>{`.admin-chat-window{max-height:55vh;min-height:320px;overflow-y:auto;padding:8px 4px;background:#fafafa;border-radius:10px;}`}</style>
      </div>
    );
  }

  // ===== LISTA =====
  const filtered = filter === 'Todos' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}><CustomerServiceOutlined /> Gerenciamento de Suporte</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}><Card bordered={false} className="metric-card"><Statistic title="Total de Chamados" value={metrics?.totalTickets || 0} prefix={<CustomerServiceOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card bordered={false} className="metric-card"><Statistic title="Tempo Médio de Resolução" value={metrics?.avgResolutionTime || 0} suffix=" dias" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col xs={24} sm={8}><Card bordered={false} className="metric-card"><Statistic title="Resolvidos" value={tickets.filter(t => t.status === 'Resolvido').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#096dd9' }} /></Card></Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Segmented value={filter} onChange={setFilter} options={['Todos', ...STATUS_OPTIONS]} />
        <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>Atualizar</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : filtered.length === 0 ? (
        <Empty description="Nenhum chamado." />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((t) => (
            <Col xs={24} md={12} xl={8} key={t.id}>
              <Card hoverable onClick={() => openChat(t.id)} style={{ borderTop: `3px solid var(--map-laranja, #d24d1e)`, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Text strong style={{ fontSize: 15 }}>{t.subject || '(sem assunto)'}</Text>
                  <Tag color={STATUS_COLOR[t.status] || 'default'}>{t.status}</Tag>
                </div>
                <div style={{ marginTop: 6 }}>
                  <Text>{t.client?.name || 'N/A'}</Text><br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.client?.email || t.client?.phone || ''}</Text>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Tag color={TYPE_COLOR[t.type] || 'default'}>{t.type}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.createdAt ? dayjs(t.createdAt).format('DD/MM/YYYY HH:mm') : ''}</Text>
                </div>
                <Button type="link" size="small" icon={<MessageOutlined />} style={{ padding: 0, marginTop: 8 }}>Abrir conversa</Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default SupportManagementPage;
