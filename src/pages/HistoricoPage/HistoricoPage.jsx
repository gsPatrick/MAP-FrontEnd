// src/pages/HistoricoPage/HistoricoPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Tag, Button, Select, Card, Typography, message, Space, Empty, Spin } from 'antd';
import {
  LeftOutlined, RightOutlined, CheckOutlined, RetweetOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';
import './HistoricoPage.css';

dayjs.locale('pt-br');
const { Title, Text } = Typography;
const { Option } = Select;

const fmt = (v) => (parseFloat(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const HistoricoPage = () => {
  const { currentProfile } = useProfile();
  const [month, setMonth] = useState(dayjs().startOf('month'));
  const [typeFilter, setTypeFilter] = useState('todos'); // todos | Entrada | Saída
  const [rows, setRows] = useState([]);
  const [recurrences, setRecurrences] = useState([]);
  const [loading, setLoading] = useState(false);

  const dateStart = month.startOf('month').format('YYYY-MM-DD');
  const dateEnd = month.endOf('month').format('YYYY-MM-DD');

  const fetchData = useCallback(async () => {
    if (!currentProfile?.id) return;
    setLoading(true);
    try {
      const params = { dateStart, dateEnd, sortBy: 'transactionDate', sortOrder: 'DESC', limit: 500 };
      if (typeFilter !== 'todos') params.type = typeFilter;
      const [txRes, recRes] = await Promise.all([
        apiClient.get(`/financial-accounts/${currentProfile.id}/transactions`, { params }),
        apiClient.get(`/financial-accounts/${currentProfile.id}/recurring-rules`, { params: { isActive: true, sortBy: 'nextDueDate', sortOrder: 'ASC' } }),
      ]);
      setRows(txRes.data?.transactions || []);
      setRecurrences((recRes.data?.data?.rules || []).filter(r => r.nextDueDate));
    } catch (e) {
      message.error('Não foi possível carregar o histórico.');
      setRows([]); setRecurrences([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile, dateStart, dateEnd, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkPaid = async (record) => {
    try {
      await apiClient.post(`/financial-accounts/${currentProfile.id}/transactions/${record.id}/settle`);
      message.success('Marcado como pago/recebido!');
      fetchData();
    } catch (e) { message.error(e.response?.data?.message || 'Falha ao marcar.'); }
  };

  const handlePayAdvance = async (rule) => {
    try {
      await apiClient.post(`/financial-accounts/${currentProfile.id}/recurring-rules/${rule.id}/pay-advance`);
      message.success('Recorrência paga adiantado!');
      fetchData();
    } catch (e) { message.error(e.response?.data?.message || 'Falha ao adiantar.'); }
  };

  const totals = useMemo(() => {
    let receitas = 0, despesas = 0;
    rows.forEach(t => { if (t.type === 'Entrada') receitas += parseFloat(t.value || 0); else despesas += parseFloat(t.value || 0); });
    return { receitas, despesas, saldo: receitas - despesas };
  }, [rows]);

  const statusTag = (t) => {
    if (!t.isPayableOrReceivable) return <Tag color="default">—</Tag>;
    if (t.isPaidOrReceived) return <Tag color="green">{t.type === 'Entrada' ? 'Recebido' : 'Pago'}</Tag>;
    const overdue = t.dueDate && dayjs(t.dueDate).endOf('day').isBefore(dayjs());
    return <Tag color={overdue ? 'red' : 'gold'}>{overdue ? 'Atrasado' : 'Pendente'}</Tag>;
  };

  const columns = [
    { title: 'Data', dataIndex: 'transactionDate', width: 110, render: (d) => dayjs(d).format('DD/MM/YYYY') },
    {
      title: 'Descrição', dataIndex: 'description', render: (v, r) => (
        <span>{v} {r.recurringTransactionRuleId ? <RetweetOutlined title="Recorrente" style={{ color: '#2563eb' }} /> : null}</span>
      )
    },
    { title: 'Categoria', dataIndex: ['category', 'name'], width: 150, render: (v) => v || <Text type="secondary">Sem categoria</Text> },
    {
      title: 'Tipo', dataIndex: 'type', width: 110,
      render: (t) => t === 'Entrada'
        ? <Tag color="green"><ArrowUpOutlined /> Receita</Tag>
        : <Tag color="red"><ArrowDownOutlined /> Despesa</Tag>
    },
    {
      title: 'Valor', dataIndex: 'value', width: 130, align: 'right',
      render: (v, r) => <b style={{ color: r.type === 'Entrada' ? '#16a34a' : '#cf1322' }}>{r.type === 'Entrada' ? '+' : '-'} {fmt(v)}</b>
    },
    { title: 'Status', key: 'status', width: 120, render: (_, r) => statusTag(r) },
    {
      title: 'Ações', key: 'actions', width: 140, align: 'center',
      render: (_, r) => (r.isPayableOrReceivable && !r.isPaidOrReceived)
        ? <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={() => handleMarkPaid(r)}>Marcar pago</Button>
        : null
    },
  ];

  return (
    <main className="historico-page">
      <header className="historico-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>Histórico</Title>
          <Text type="secondary">Pagamentos, recorrências, receitas e despesas — por mês</Text>
        </div>
        <Space wrap>
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 150 }}>
            <Option value="todos">Tudo</Option>
            <Option value="Entrada">Receitas</Option>
            <Option value="Saída">Despesas</Option>
          </Select>
          <Space.Compact className="month-nav">
            <Button icon={<LeftOutlined />} onClick={() => setMonth(m => m.subtract(1, 'month'))} />
            <Button className="month-label">{month.format('MMMM [de] YYYY')}</Button>
            <Button icon={<RightOutlined />} onClick={() => setMonth(m => m.add(1, 'month'))} />
          </Space.Compact>
          <Button onClick={() => setMonth(dayjs().startOf('month'))}>Mês atual</Button>
        </Space>
      </header>

      <div className="historico-summary">
        <Card size="small"><Text type="secondary">Receitas</Text><div className="sum ok">{fmt(totals.receitas)}</div></Card>
        <Card size="small"><Text type="secondary">Despesas</Text><div className="sum bad">{fmt(totals.despesas)}</div></Card>
        <Card size="small"><Text type="secondary">Saldo</Text><div className={`sum ${totals.saldo >= 0 ? 'ok' : 'bad'}`}>{fmt(totals.saldo)}</div></Card>
      </div>

      {recurrences.length > 0 && (
        <Card className="historico-recurrences" title={<span><RetweetOutlined /> Recorrências ativas</span>} size="small">
          <div className="rec-list">
            {recurrences.map(r => {
              // Só adianta a ocorrência do mês atual (ou atrasada). Se a próxima já é
              // de mês futuro, a deste mês já foi paga -> mostra "Em dia".
              const dueThisCycle = !dayjs(r.nextDueDate).isAfter(dayjs().endOf('month'));
              return (
                <div key={r.id} className="rec-item">
                  <div className="rec-info">
                    <b>{r.description}</b>
                    <span className="rec-meta">{r.type === 'Entrada' ? 'Receita' : 'Despesa'} • {fmt(r.value)} • próx. {dayjs(r.nextDueDate).format('DD/MM/YY')}</span>
                  </div>
                  {dueThisCycle ? (
                    <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handlePayAdvance(r)}>
                      {r.type === 'Entrada' ? 'Receber adiantado' : 'Adiantar pagamento'}
                    </Button>
                  ) : (
                    <Tag color="green"><CheckOutlined /> {r.lastPaidDate ? `Pago ${dayjs(r.lastPaidDate).format('DD/MM')}` : 'Em dia'}</Tag>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="historico-table-card" size="small">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={rows}
            size="middle"
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `${t} lançamento(s)` }}
            locale={{ emptyText: <Empty description="Nenhum lançamento neste mês." /> }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </main>
  );
};

export default HistoricoPage;
