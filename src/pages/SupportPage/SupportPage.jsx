// src/pages/SupportPage/SupportPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Select, Button, message, Typography, List, Tag, Empty, Spin, Row, Col } from 'antd';
import {
  CustomerServiceOutlined, QuestionCircleOutlined, ToolOutlined,
  DollarCircleOutlined, BulbOutlined, SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import apiClient from '../../services/api';
import './SupportPage.css';

dayjs.locale('pt-br');

const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const typeLabels = {
  Tecnico: 'Problema Técnico',
  Financeiro: 'Questão Financeira',
  Duvida: 'Dúvida Geral',
  Sugestao: 'Sugestão ou Feedback',
};

const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('aberto') || s.includes('open')) return 'gold';
  if (s.includes('andamento') || s.includes('progress')) return 'blue';
  if (s.includes('resolv') || s.includes('fechad') || s.includes('closed')) return 'green';
  return 'default';
};

const SupportPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await apiClient.get('/support/my-tickets');
      const data = res.data?.data || res.data?.tickets || res.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await apiClient.post('/support/tickets', values);
      message.success('Chamado aberto com sucesso! Nossa equipe entrará em contato.');
      form.resetFields();
      fetchTickets();
    } catch (error) {
      message.error(error.response?.data?.message || 'Falha ao abrir chamado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="support-page">
      <header className="support-page-header">
        <Title level={3} style={{ marginBottom: 4 }}><CustomerServiceOutlined /> Suporte</Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Precisa de ajuda? Abra um chamado e acompanhe suas solicitações aqui.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={11}>
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
                <TextArea rows={5} placeholder="Conte-nos mais detalhes para que possamos te ajudar melhor..." />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />} block>
                  Enviar Solicitação
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={13}>
          <Card title="Meus chamados" className="support-card">
            {loadingTickets ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : tickets.length === 0 ? (
              <Empty description="Você ainda não abriu nenhum chamado." />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={tickets}
                renderItem={(t) => (
                  <List.Item
                    key={t.id}
                    extra={<Tag color={statusColor(t.status)}>{t.status || 'Aberto'}</Tag>}
                  >
                    <List.Item.Meta
                      title={t.subject || '(sem assunto)'}
                      description={`${typeLabels[t.type] || t.type || 'Chamado'} • ${t.createdAt ? dayjs(t.createdAt).format('DD/MM/YYYY HH:mm') : ''}`}
                    />
                    {t.description && <Paragraph style={{ marginBottom: 0, color: '#595959' }}>{t.description}</Paragraph>}
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </main>
  );
};

export default SupportPage;
