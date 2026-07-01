// src/pages/SupportPage/SupportPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Form, Input, Select, Button, message, Typography, Tag, Empty, Spin, Row, Col, Modal, Divider } from 'antd';
import {
  CustomerServiceOutlined, QuestionCircleOutlined, ToolOutlined,
  DollarCircleOutlined, BulbOutlined, SendOutlined, MessageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import apiClient from '../../services/api';
import './SupportPage.css';

dayjs.locale('pt-br');

const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const typeLabels = {
  Tecnico: 'Problema Técnico',
  Financeiro: 'Questão Financeira',
  Duvida: 'Dúvida Geral',
  Sugestao: 'Sugestão ou Feedback',
};
const STATUS_COLOR = { 'Aberto': 'gold', 'Em andamento': 'blue', 'Resolvido': 'green', 'Cancelado': 'red' };

const SupportPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Chat
  const [chatTicket, setChatTicket] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await apiClient.get('/support/my-tickets');
      const data = res.data?.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (chatTicket) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [chatTicket]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await apiClient.post('/support/tickets', values);
      message.success('Chamado aberto com sucesso! Nossa equipe vai responder por aqui.');
      form.resetFields();
      fetchTickets();
    } catch (error) {
      message.error(error.response?.data?.message || 'Falha ao abrir chamado.');
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (ticketId) => {
    setChatLoading(true);
    setChatTicket({ id: ticketId, messages: [] });
    try {
      const res = await apiClient.get(`/support/tickets/${ticketId}`);
      setChatTicket(res.data?.data || null);
    } catch {
      message.error('Erro ao abrir o chamado.');
      setChatTicket(null);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !chatTicket) return;
    setSending(true);
    try {
      await apiClient.post(`/support/tickets/${chatTicket.id}/messages`, { message: text });
      setText('');
      const res = await apiClient.get(`/support/tickets/${chatTicket.id}`);
      setChatTicket(res.data?.data || null);
      fetchTickets();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="support-page" style={{ padding: 24 }}>
      <header className="support-page-header">
        <Title level={3} style={{ marginBottom: 4 }}><CustomerServiceOutlined /> Suporte</Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Abra um chamado e converse com nossa equipe por aqui.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="Abrir novo chamado" className="support-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="type" label="Que tipo de questão você tem?" rules={[{ required: true, message: 'Selecione o tipo de ajuda.' }]}>
                <Select placeholder="Selecione o tipo de ajuda">
                  <Option value="Tecnico"><ToolOutlined /> Problema Técnico</Option>
                  <Option value="Financeiro"><DollarCircleOutlined /> Questão Financeira</Option>
                  <Option value="Duvida"><QuestionCircleOutlined /> Dúvida Geral</Option>
                  <Option value="Sugestao"><BulbOutlined /> Sugestão ou Feedback</Option>
                </Select>
              </Form.Item>
              <Form.Item name="subject" label="Assunto" rules={[{ required: true, message: 'Insira um assunto.' }]}>
                <Input placeholder="Ex: Não consigo acessar meu perfil PJ" />
              </Form.Item>
              <Form.Item name="description" label="Descreva o problema ou dúvida" rules={[{ required: true, message: 'Descreva sua solicitação.' }]}>
                <TextArea rows={5} placeholder="Conte-nos mais detalhes..." />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />} block>Enviar Solicitação</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Meus chamados" className="support-card">
            {loadingTickets ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : tickets.length === 0 ? (
              <Empty description="Você ainda não abriu nenhum chamado." />
            ) : (
              <Row gutter={[12, 12]}>
                {tickets.map((t) => (
                  <Col xs={24} key={t.id}>
                    <Card hoverable size="small" onClick={() => openChat(t.id)} style={{ borderLeft: `4px solid var(--ant-color-${STATUS_COLOR[t.status] || 'default'}, #d9d9d9)` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <Text strong>{t.subject || '(sem assunto)'}</Text>
                          <div><Text type="secondary" style={{ fontSize: 12 }}>{typeLabels[t.type] || t.type} • {t.createdAt ? dayjs(t.createdAt).format('DD/MM/YYYY HH:mm') : ''}</Text></div>
                        </div>
                        <Tag color={STATUS_COLOR[t.status] || 'default'}>{t.status || 'Aberto'}</Tag>
                      </div>
                      <Button type="link" size="small" icon={<MessageOutlined />} style={{ padding: 0, marginTop: 4 }}>Abrir conversa</Button>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal de chat */}
      <Modal
        open={!!chatTicket}
        onCancel={() => setChatTicket(null)}
        footer={null}
        width={640}
        title={chatTicket ? <span><MessageOutlined /> {chatTicket.subject || 'Chamado'} {chatTicket.status && <Tag color={STATUS_COLOR[chatTicket.status] || 'default'} style={{ marginLeft: 8 }}>{chatTicket.status}</Tag>}</span> : 'Chamado'}
      >
        {chatLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <>
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 4px', background: '#fafafa', borderRadius: 8 }}>
              {(chatTicket?.messages || []).length === 0 ? (
                <Empty description="Sem mensagens ainda." />
              ) : (chatTicket.messages || []).map((m) => {
                const mine = m.senderType === 'client';
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <div style={{ maxWidth: '75%', background: mine ? '#d24d1e' : '#fff', color: mine ? '#fff' : '#000', border: mine ? 'none' : '1px solid #eee', borderRadius: 10, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>{m.senderName || (mine ? 'Você' : 'Suporte')}</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{m.createdAt ? dayjs(m.createdAt).format('DD/MM HH:mm') : ''}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <TextArea value={text} onChange={(e) => setText(e.target.value)} autoSize={{ minRows: 1, maxRows: 4 }} placeholder="Escreva uma mensagem..." onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
              <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={sendMessage}>Enviar</Button>
            </div>
          </>
        )}
      </Modal>
    </main>
  );
};

export default SupportPage;
