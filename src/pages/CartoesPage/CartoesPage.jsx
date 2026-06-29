import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Row, Col, Card, Avatar, Select, DatePicker,
  List, Tag, Statistic, Progress, Empty, Tooltip, Modal, Form, Input,
  InputNumber, Checkbox, Dropdown, Menu, Space, message, Spin, Timeline, Alert, ColorPicker
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CreditCardOutlined,
  InfoCircleOutlined, MoreOutlined,
  ShoppingCartOutlined, PieChartOutlined, WalletOutlined,
  ScanOutlined, HistoryOutlined, CheckCircleOutlined,
  BankOutlined, ArrowRightOutlined, CalendarOutlined,
  ArrowDownOutlined, ArrowUpOutlined, CloseCircleOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';
import VisualCard from '../../components/VisualCard/VisualCard';

import './CartoesPage.css';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { useModal } = Modal;
const { useWatch } = Form;

const CardPreview = ({ form, currentProfile }) => {
  const color = useWatch('corDominante', form);
  const icon = useWatch('iconeBandeira', form);
  const lastFour = useWatch('numeroCartao', form);

  const previewCard = {
    dominantColor: color,
    lastFourDigits: lastFour,
    flagIconUrl: icon
  };

  return <VisualCard card={previewCard} currentProfile={currentProfile} scale={0.9} />;
};


const CartoesPage = () => {
  const {
    currentProfile, loadingProfiles, isAuthenticated
  } = useProfile();

  const [modal, contextHolder] = useModal();

  const [cards, setCards] = useState([]);
  const [view, setView] = useState('list'); // 'list' (galeria de cartões) | 'detail' (fatura)
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardDetails, setSelectedCardDetails] = useState(null);
  const [selectedMonthYearForInvoice, setSelectedMonthYearForInvoice] = useState(dayjs());
  const [availableInvoicePeriods, setAvailableInvoicePeriods] = useState([]);
  const [invoiceExpenses, setInvoiceExpenses] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [isAddCardModalVisible, setIsAddCardModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm] = Form.useForm();
  const [isAddExpenseToCardModalVisible, setIsAddExpenseToCardModalVisible] = useState(false);
  const [addExpenseToCardForm] = Form.useForm();
  const [isParceladaExpense, setIsParceladaExpense] = useState(false);
  const [isPayInvoiceModalVisible, setIsPayInvoiceModalVisible] = useState(false);
  const [payInvoiceForm] = Form.useForm();
  const [payingInvoiceCard, setPayingInvoiceCard] = useState(null);

  const fetchCategories = useCallback(async () => {
    if (!currentProfile?.id) { setCategorias([]); return; }
    setLoadingCategories(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/categories`);
      if (response.data && response.data.status === 'success') {
        setCategorias(response.data.data || []);
      }
    } catch (error) { console.error("Erro ao buscar categorias:", error); }
    finally { setLoadingCategories(false); }
  }, [currentProfile]);

  const fetchCreditCards = useCallback(async () => {
    if (!currentProfile?.id) { setCards([]); setLoadingCards(false); return; }
    setLoadingCards(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards`, { params: { isActive: true, includeSummary: true } });
      const cardsData = response.data.data || [];
      setCards(cardsData);
      if (cardsData.length > 0 && !selectedCard) {
        setSelectedCard(cardsData[0]);
      }
    } catch (error) { console.error("Erro ao buscar cartões:", error); }
    finally { setLoadingCards(false); }
  }, [currentProfile, selectedCard]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      fetchCreditCards();
      fetchCategories();
    }
  }, [currentProfile, loadingProfiles, isAuthenticated, fetchCreditCards, fetchCategories]);

  const fetchInvoiceDetails = useCallback(async (cardId, periodType = 'aberta', month, year) => {
    if (!currentProfile?.id || !cardId) return;
    setLoadingInvoice(true);
    try {
      const params = { type: periodType };
      if (periodType === 'especifico' && month !== undefined && year !== undefined) { params.month = month; params.year = year; }
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards/${cardId}/invoice`, { params });
      if (response.data && response.data.status === 'success') {
        setSelectedCardDetails(prev => ({ ...prev, ...response.data.data }));
        setInvoiceExpenses(response.data.data.transactions || []);
      }
    } catch (error) { console.error("Erro ao buscar detalhes da fatura:", error); }
    finally { setLoadingInvoice(false); }
  }, [currentProfile]);

  const fetchAvailablePeriods = useCallback(async (cardId) => {
    if (!currentProfile?.id || !cardId) return;
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards/${cardId}/available-periods`);
      setAvailableInvoicePeriods(response.data.data || []);
    }
    catch (error) { console.error("Erro ao buscar períodos de fatura:", error); }
  }, [currentProfile]);

  const fetchAvailableLimit = useCallback(async (cardId) => {
    if (!currentProfile?.id || !cardId) return;
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards/${cardId}/available-limit`);
      if (response.data && response.data.status === 'success') {
        setSelectedCardDetails(prev => ({ ...(prev || selectedCard), ...response.data.data }));
      }
    }
    catch (error) { console.error("Erro ao buscar limite disponível:", error); }
  }, [currentProfile, selectedCard]);

  useEffect(() => {
    if (selectedCard?.id) {
      fetchInvoiceDetails(selectedCard.id, 'aberta');
      fetchAvailablePeriods(selectedCard.id);
      fetchAvailableLimit(selectedCard.id);
      setSelectedMonthYearForInvoice(dayjs());
    }
  }, [selectedCard, fetchInvoiceDetails, fetchAvailablePeriods, fetchAvailableLimit]);

  const handleInvoicePeriodChange = (value) => {
    if (selectedCard?.id && value) {
      let year, month;
      if (typeof value === 'string') {
        const parts = value.split('-'); year = parseInt(parts[0], 10); month = parseInt(parts[1], 10); setSelectedMonthYearForInvoice(dayjs().year(year).month(month - 1)); fetchInvoiceDetails(selectedCard.id, 'especifico', month, year);
      }
      else { year = value.year(); month = value.month() + 1; setSelectedMonthYearForInvoice(value); fetchInvoiceDetails(selectedCard.id, 'especifico', month, year); }
    }
  };

  const handleAddOrEditCard = async (values) => {
    if (!currentProfile?.id) return;
    const cardPayload = {
      name: values.name,
      limit: parseFloat(values.limitTotal),
      blockedLimit: values.limiteBloqueado ? parseFloat(values.limiteBloqueado) : 0,
      closingDay: parseInt(values.closingDay),
      paymentDay: parseInt(values.paymentDay),
      lastFourDigits: values.numeroCartao ? String(values.numeroCartao).slice(-4) : null,
      flag: values.bandeira,
      dominantColor: values.corDominante,
      flagIconUrl: values.iconeBandeira,
      isActive: true,
      isDefault: values.isDefault || false,
    };
    try {
      if (editingCard) {
        await apiClient.put(`/financial-accounts/${currentProfile.id}/credit-cards/${editingCard.id}`, cardPayload);
        message.success("Cartão atualizado!");
      } else {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/credit-cards`, cardPayload);
        message.success("Cartão adicionado!");
      }
      setIsAddCardModalVisible(false);
      fetchCreditCards();
    } catch (error) {
      message.error("Erro ao salvar o cartão.");
    }
  };

  const handleDeleteCard = async (cardId) => {
    modal.confirm({
      title: 'Excluir Cartão',
      content: 'Tem certeza que deseja remover este cartão? As despesas cadastradas continuarão no sistema.',
      centered: true,
      okText: 'Excluir',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiClient.delete(`/financial-accounts/${currentProfile.id}/credit-cards/${cardId}`);
          message.success("Cartão removido!");
          if (selectedCard?.id === cardId) setSelectedCard(null);
          fetchCreditCards();
        } catch (error) { message.error("Erro ao excluir o cartão."); }
      }
    });
  };

  const handlePayInvoice = async (values) => {
    if (!selectedCard || !currentProfile?.id) return;
    const payload = {
      paymentAmount: parseFloat(values.paymentAmount),
      paymentDate: dayjs(values.paymentDate).format('YYYY-MM-DD'),
      originatingAccountDescription: values.originatingAccountDescription,
      invoiceReferenceMonthYear: selectedCardDetails?.invoiceReferenceMonthYear,
    };
    try {
      await apiClient.post(`/financial-accounts/${currentProfile.id}/credit-cards/${selectedCard.id}/pay-invoice`, payload);
      message.success("Pagamento registrado!");
      setIsPayInvoiceModalVisible(false);
      fetchInvoiceDetails(selectedCard.id, 'aberta');
      fetchAvailableLimit(selectedCard.id);
    } catch (error) { message.error("Erro ao registrar pagamento."); }
  };

  const handleAddExpense = async (values) => {
    if (!selectedCard || !currentProfile?.id) return;
    const dateStr = dayjs(values.data || dayjs()).format('YYYY-MM-DD');
    try {
      if (values.isParceladaCheck) {
        // Compra parcelada no cartão -> endpoint de parcelamento.
        await apiClient.post(`/financial-accounts/${currentProfile.id}/transactions/parcelled`, {
          description: values.description,
          type: 'Saída',
          totalValue: parseFloat(values.value),
          numberOfParcels: parseInt(values.numeroParcelas, 10),
          initialDueDate: dateStr,
          transactionDate: dateStr,
          paymentMethod: 'Cartão de Crédito',
          creditCardId: selectedCard.id,
          financialCategoryId: values.categoria,
        });
      } else {
        // Compra à vista no cartão.
        await apiClient.post(`/financial-accounts/${currentProfile.id}/transactions`, {
          description: values.description,
          type: 'Saída',
          value: parseFloat(values.value),
          transactionDate: dateStr,
          paymentMethod: 'Cartão de Crédito',
          creditCardId: selectedCard.id,
          financialCategoryId: values.categoria,
        });
      }
      message.success("Despesa adicionada!");
      setIsAddExpenseToCardModalVisible(false);
      addExpenseToCardForm.resetFields();
      setIsParceladaExpense(false);
      fetchInvoiceDetails(selectedCard.id, 'aberta');
      fetchAvailableLimit(selectedCard.id);
    } catch (error) {
      message.error(error.response?.data?.message || "Erro ao adicionar despesa.");
    }
  };

  const limiteTotalCard = parseFloat(selectedCard?.limit ?? selectedCardDetails?.totalLimit ?? 0);
  const limiteBloqueado = parseFloat(selectedCard?.blockedLimit ?? selectedCardDetails?.blockedLimit ?? 0);
  const limiteDisponivel = parseFloat(selectedCardDetails?.availableLimit ?? selectedCard?.availableLimit ?? Math.max(0, limiteTotalCard - limiteBloqueado));
  const limiteUsado = parseFloat(selectedCard?.usedLimit ?? selectedCardDetails?.usedLimit ?? Math.max(0, limiteTotalCard - limiteDisponivel - limiteBloqueado));
  const fmtBRL = (v) => parseFloat(v || 0).toLocaleString('pt-br', { minimumFractionDigits: 2 });
  // Barra: parte usada + parte bloqueada (success/verde) sobre o total.
  const percentualUsado = limiteTotalCard > 0 ? (limiteUsado / limiteTotalCard) * 100 : 0;
  const percentualBloqueado = limiteTotalCard > 0 ? (limiteBloqueado / limiteTotalCard) * 100 : 0;

  // Separa os lançamentos da fatura entre PAGOS e EM ABERTO. Como o pagamento é
  // por fatura (e adiantamentos abatem do total), marcamos como pagos os mais
  // antigos até cobrir o valor já pago (FIFO).
  const { abertosTx, pagosTx } = useMemo(() => {
    const paidAmount = parseFloat(selectedCardDetails?.totalPaidForThisInvoice || 0);
    let acc = 0;
    const abertosTx = [], pagosTx = [];
    (invoiceExpenses || []).forEach((tx) => {
      acc += parseFloat(tx.value || 0);
      if (acc <= paidAmount + 0.001) pagosTx.push(tx); else abertosTx.push(tx);
    });
    return { abertosTx, pagosTx };
  }, [invoiceExpenses, selectedCardDetails]);

  const renderInvoiceTx = (tx, idx, paid = false) => (
    <div key={`${paid ? 'p' : 'a'}-${tx.id || idx}`} className={`banking-transaction-item${paid ? ' paid' : ''}`}>
      <div className="transaction-icon">
        {tx.type === 'Saída' ? <ArrowUpOutlined style={{ color: '#f43f5e' }} /> : <ArrowDownOutlined style={{ color: '#10b981' }} />}
      </div>
      <div className="transaction-main">
        <span className="transaction-desc">{tx.description}</span>
        <span className="transaction-meta">
          {dayjs(tx.transactionDate).format('DD MMM')} • {tx.category?.name || 'Geral'}
        </span>
      </div>
      <div className="transaction-value">
        <span className={`transaction-value ${tx.type === 'Saída' ? 'out' : 'in'}`}>
          {tx.type === 'Saída' ? '-' : '+'} R$ {parseFloat(tx.value).toLocaleString('pt-br', { minimumFractionDigits: 2 })}
        </span>
        {tx.isParcel && <span className="transaction-parcel">{tx.parcelNumber}/{tx.totalParcels}</span>}
      </div>
    </div>
  );

  const cardEditValues = (c) => ({
    ...c,
    limitTotal: c.limit,
    limiteBloqueado: c.blockedLimit || 0,
    numeroCartao: c.lastFourDigits,
    bandeira: c.flag,
    corDominante: c.dominantColor || '#6A0DAD',
  });

  const openCard = (card) => {
    setSelectedCard(card);
    setSelectedMonthYearForInvoice(dayjs());
    setView('detail');
  };

  const cardOptionsMenu = (card) => (
    <Menu onClick={(e) => e.domEvent.stopPropagation()}>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => {
        setEditingCard(card);
        cardForm.setFieldsValue(cardEditValues(card));
        setIsAddCardModalVisible(true);
      }}>Editar</Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDeleteCard(card.id)}>Excluir</Menu.Item>
    </Menu>
  );

  if (loadingProfiles || (isAuthenticated && !currentProfile)) {
    return (<Content className="cartoes-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></Content>);
  }

  return (
    <Content className="cartoes-content">
      {view === 'list' ? (
        <>
          {/* ETAPA 1: galeria de cartões personalizados */}
          <div className="cartoes-top-header">
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>Cartões</Typography.Title>
              <Typography.Text type="secondary">Gerencie seus cartões e gastos no crédito</Typography.Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCard(null); cardForm.resetFields(); setIsAddCardModalVisible(true); }} className="add-card-btn">Novo Cartão</Button>
          </div>
          {loadingCards ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
          ) : (
            <div className="cartoes-grid">
              {cards.map(card => {
                const disp = card.availableLimit ?? 0;
                const blo = parseFloat(card.blockedLimit || 0);
                const usado = card.usedLimit ?? Math.max(0, parseFloat(card.limit || 0) - disp - blo);
                return (
                  <div key={card.id} className="cartao-grid-cell" onClick={() => openCard(card)}>
                    <VisualCard card={card} currentProfile={currentProfile} showDetails />
                    <div className="cartao-grid-summary">
                      <div className="cg-row"><span>Limite Total</span><b>R$ {fmtBRL(card.limit)}</b></div>
                      <div className="cg-row"><span>Disponível</span><b className="ok">R$ {fmtBRL(disp)}</b></div>
                      <div className="cg-row"><span>Bloqueado</span><b className="warn">R$ {fmtBRL(blo)}</b></div>
                      <div className="cg-row"><span>Utilizado</span><b>R$ {fmtBRL(usado)}</b></div>
                      <div className="cartao-grid-actions" onClick={e => e.stopPropagation()}>
                        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingCard(card); cardForm.setFieldsValue(cardEditValues(card)); setIsAddCardModalVisible(true); }}>Editar</Button>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCard(card.id)}>Apagar</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="cartao-grid-cell add-placeholder" onClick={() => { setEditingCard(null); cardForm.resetFields(); setIsAddCardModalVisible(true); }}>
                <div className="add-card-placeholder"><PlusOutlined style={{ fontSize: 30 }} /><span>Adicionar cartão</span></div>
              </div>
            </div>
          )}
        </>
      ) : (
      <Row gutter={[24, 24]} className="cartoes-page-row">
        {/* ETAPA 2 — coluna esquerda: cartão + métricas + ações */}
        <Col xs={24} lg={8} className="cards-list-col">
          <div className="cartoes-top-header" style={{ marginBottom: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => setView('list')}>Voltar</Button>
          </div>
          {selectedCard && <VisualCard card={selectedCard} currentProfile={currentProfile} showDetails />}
          <div className="detail-metrics">
            <div className="dm-item"><span>Limite Total</span><b>R$ {fmtBRL(limiteTotalCard)}</b></div>
            <div className="dm-item"><span>Disponível</span><b className="ok">R$ {fmtBRL(limiteDisponivel)}</b></div>
            <div className="dm-item"><span>Bloqueado</span><b className="warn">R$ {fmtBRL(limiteBloqueado)}</b></div>
            <div className="dm-item"><span>Utilizado</span><b>R$ {fmtBRL(limiteUsado)}</b></div>
          </div>
          <div className="detail-actions">
            <Button block icon={<EditOutlined />} onClick={() => { setEditingCard(selectedCard); cardForm.setFieldsValue(cardEditValues(selectedCard)); setIsAddCardModalVisible(true); }}>Editar</Button>
            <Button block danger icon={<DeleteOutlined />} onClick={() => handleDeleteCard(selectedCard.id)}>Apagar</Button>
          </div>
        </Col>

        {/* ETAPA 2 — coluna direita: fatura */}
        <Col xs={24} lg={16} className="card-details-col">
          {selectedCard && (
            <div className="selected-card-details-wrapper animated-details">
              <Spin spinning={loadingInvoice}>
                {/* Header: Financial Totals */}
                <div className="invoice-banking-header">
                  <div className="invoice-header-top">
                    <div className="invoice-amount-section">
                      <span className="label">Fatura {selectedCardDetails?.invoicePeriodDescription || "Aberta"}</span>
                      <span className="amount">
                        <Text type="secondary" style={{ fontSize: '1.2rem', marginRight: 4 }}>R$</Text>
                        {(selectedCardDetails?.totalAmount || 0).toLocaleString('pt-br', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Tag
                      color={selectedCardDetails?.isPaid ? 'success' : 'processing'}
                      className="header-status-badge"
                    >
                      {selectedCardDetails?.isPaid ? 'FATURA PAGA' : 'FATURA ABERTA'}
                    </Tag>
                  </div>

                  <div className="invoice-dates-grid">
                    <div className="date-item">
                      <span className="label">Fechamento</span>
                      <span className="value">{selectedCard.closingDay || '--'} de cada mês</span>
                    </div>
                    <div className="date-item">
                      <span className="label">Vencimento</span>
                      <span className="value">
                        {selectedCardDetails?.dueDate ? dayjs(selectedCardDetails.dueDate).format('DD MMM YYYY') : `${selectedCard.paymentDay || '--'} de cada mês`}
                      </span>
                    </div>
                    <div className="date-item" style={{ flexGrow: 1 }}>
                      <Select
                        value={`${selectedMonthYearForInvoice.year()}-${String(selectedMonthYearForInvoice.month() + 1).padStart(2, '0')}`}
                        onChange={handleInvoicePeriodChange}
                        bordered={false}
                        style={{ width: '100%', fontWeight: 700 }}
                        className="banking-period-select"
                        suffixIcon={<CalendarOutlined />}
                      >
                        {availableInvoicePeriods.map(p => (<Option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>{p.label}</Option>))}
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Limit Progress */}
                <div className="banking-limit-section">
                  <div className="banking-limit-info">
                    <span className="available">Disponível: R$ {fmtBRL(limiteDisponivel)}</span>
                    <span className="used">Limite total: R$ {fmtBRL(limiteTotalCard)}</span>
                  </div>
                  <Progress
                    percent={Math.min(100, percentualUsado + percentualBloqueado)}
                    success={{ percent: Math.min(100, percentualBloqueado), strokeColor: '#f59e0b' }}
                    showInfo={false}
                    strokeColor={(percentualUsado + percentualBloqueado) > 90 ? '#f43f5e' : '#1e293b'}
                    trailColor="#f1f5f9"
                    strokeWidth={8}
                    strokeLinecap="round"
                  />
                  <div className="banking-limit-legend">
                    <span><i className="dot dot-used" /> Usado: R$ {fmtBRL(limiteUsado)}</span>
                    <span><i className="dot dot-blocked" /> Bloqueado: R$ {fmtBRL(limiteBloqueado)}</span>
                    <span><i className="dot dot-available" /> Disponível: R$ {fmtBRL(limiteDisponivel)}</span>
                  </div>

                  <div className="banking-actions-bar">
                    <Button
                      type="primary"
                      className="banking-btn"
                      style={{ background: '#0f172a', border: 'none', flex: 1 }}
                      icon={<PlusOutlined />}
                      onClick={() => setIsAddExpenseToCardModalVisible(true)}
                    >
                      Nova Despesa
                    </Button>
                    <Button
                      disabled={selectedCardDetails?.totalAmount <= 0}
                      className="banking-btn"
                      style={{ flex: 1 }}
                      icon={<WalletOutlined />}
                      onClick={() => {
                        payInvoiceForm.setFieldsValue({ paymentAmount: selectedCardDetails?.totalAmount, paymentDate: dayjs() });
                        setIsPayInvoiceModalVisible(true);
                      }}
                    >
                      Pagar Fatura
                    </Button>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="banking-transactions-section">
                  <h3 className="banking-section-title">
                    <HistoryOutlined /> Histórico de Lançamentos
                  </h3>
                  {invoiceExpenses.length === 0 ? (
                    <Empty description="Nenhum lançamento neste período" />
                  ) : (
                    <>
                      {abertosTx.length > 0 && (
                        <>
                          <div className="banking-subgroup-title">Em aberto</div>
                          {abertosTx.map((tx, idx) => renderInvoiceTx(tx, idx, false))}
                        </>
                      )}
                      {pagosTx.length > 0 && (
                        <>
                          <div className="banking-subgroup-title paid">✅ Fatura paga (adiantamento)</div>
                          {pagosTx.map((tx, idx) => renderInvoiceTx(tx, idx, true))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </Spin>
            </div>
          )}
        </Col>
      </Row>
      )}

      {/* MODALS (Simplified for the banking theme) */}
      <Modal
        title={editingCard ? "Editar Cartão" : "Novo Cartão"}
        open={isAddCardModalVisible}
        onCancel={() => setIsAddCardModalVisible(false)}
        footer={null}
        width={400}
        className="modal-style-map"
      >
        <Form form={cardForm} layout="vertical" onFinish={handleAddOrEditCard}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <CardPreview form={cardForm} currentProfile={currentProfile} />
          </div>
          <Form.Item name="name" label="Nome do Cartão" rules={[{ required: true }]}><Input placeholder="Ex: Nubank" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="bandeira" label="Bandeira"><Select><Option value="Mastercard">Mastercard</Option><Option value="Visa">Visa</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="numeroCartao" label="Final (4 dígitos)"><Input maxLength={4} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="closingDay" label="Fechamento"><InputNumber min={1} max={31} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="paymentDay" label="Vencimento"><InputNumber min={1} max={31} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="limitTotal" label="Limite Total (R$)"><InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => v.replace(/\./g, '')} /></Form.Item>
          <Form.Item name="limiteBloqueado" label="Limite Bloqueado (R$)" tooltip="Valor do limite que você quer reservar e NÃO gastar (economizar). Fica indisponível para compras.">
            <InputNumber min={0} style={{ width: '100%' }} precision={2} placeholder="0,00" />
          </Form.Item>
          <Form.Item
            name="corDominante"
            label="Cor do cartão"
            tooltip="Cor de fundo do cartão exibido na galeria."
            getValueFromEvent={(color) => (typeof color === 'string' ? color : color?.toHexString?.() || '#6A0DAD')}
          >
            <ColorPicker
              showText
              format="hex"
              presets={[{
                label: 'Sugestões',
                colors: ['#820AD1', '#EC7000', '#CC092F', '#003399', '#0F172A', '#16A34A', '#0EA5E9', '#DB2777', '#475569', '#F59E0B'],
              }]}
            />
          </Form.Item>
          <Button type="primary" block htmlType="submit" style={{ background: '#0f172a' }}>Salvar</Button>
        </Form>
      </Modal>

      <Modal
        title="Nova Despesa"
        open={isAddExpenseToCardModalVisible}
        onCancel={() => setIsAddExpenseToCardModalVisible(false)}
        footer={null}
        width={400}
        className="modal-style-map"
      >
        <Form form={addExpenseToCardForm} layout="vertical" onFinish={handleAddExpense} initialValues={{ data: dayjs() }}>
          <Form.Item name="description" label="Descrição" rules={[{ required: true }]}><Input placeholder="Onde você comprou?" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="value" label="Valor (R$)" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: '100%' }} precision={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="data" label="Data"><DatePicker format="DD/MM" style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="categoria" label="Categoria" rules={[{ required: true }]}><Select placeholder="Selecione">{categorias.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}</Select></Form.Item>
          <Form.Item name="isParceladaCheck" valuePropName="checked"><Checkbox onChange={e => setIsParceladaExpense(e.target.checked)}>Compra Parcelada?</Checkbox></Form.Item>
          {isParceladaExpense && <Form.Item name="numeroParcelas" label="Parcelas"><InputNumber min={2} max={48} style={{ width: '100%' }} /></Form.Item>}
          <Button type="primary" block htmlType="submit" style={{ background: '#0f172a' }}>Adicionar</Button>
        </Form>
      </Modal>

      <Modal
        title="Registrar Pagamento"
        open={isPayInvoiceModalVisible}
        onCancel={() => setIsPayInvoiceModalVisible(false)}
        footer={null}
        width={400}
        className="modal-style-map"
      >
        <Form form={payInvoiceForm} layout="vertical" onFinish={handlePayInvoice}>
          <Form.Item name="paymentAmount" label="Valor do Pagamento" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: '100%' }} precision={2} /></Form.Item>
          <Form.Item name="paymentDate" label="Data"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Button type="primary" block htmlType="submit" style={{ background: '#0f172a' }}>Confirmar Pagamento</Button>
        </Form>
      </Modal>

      {contextHolder}
    </Content>
  );
};

export default CartoesPage;