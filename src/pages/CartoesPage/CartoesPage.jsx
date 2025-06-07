
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Row, Col, Card, Avatar, Select, DatePicker,
  List, Tag, Statistic, Progress, Empty, Tooltip, Modal, Form, Input,
  InputNumber, Checkbox, Dropdown, Menu, Space, message, Spin
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CreditCardOutlined,
  InfoCircleOutlined, MoreOutlined, // PercentageOutlined, CalendarOutlined,
  ShoppingCartOutlined, PieChartOutlined, WalletOutlined 
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// HeaderPanel e SidebarPanel não são mais importados aqui
// import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
// import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';

import './CartoesPage.css';

dayjs.locale('pt-br');

const { Content } = Layout; // Content ainda é usado
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const mockCategoriasDespesaCartao = [
  { id: 'ali_c', nome: 'Alimentação (Cartão)' }, { id: 'com_c', nome: 'Compras Online' },
  { id: 'ser_c', nome: 'Serviços Assinatura' }, { id: 'via_c', nome: 'Viagens (Cartão)' },
  { id: 'laz_c', nome: 'Lazer (Cartão)' }, { id: 'out_c', nome: 'Outras Despesas (Cartão)' },
];


const CartoesPage = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  // O estado sidebarCollapsed foi removido
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // A variável userNameForHeader foi removida pois o Header não está mais aqui

  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardDetails, setSelectedCardDetails] = useState(null);
  const [selectedMonthYearForInvoice, setSelectedMonthYearForInvoice] = useState(dayjs());
  const [availableInvoicePeriods, setAvailableInvoicePeriods] = useState([]);
  const [invoiceExpenses, setInvoiceExpenses] = useState([]);
  
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

  const [categoriasDespesaModal, setCategoriasDespesaModal] = useState(mockCategoriasDespesaCartao);


  const fetchCreditCards = useCallback(async () => {
    if (!currentProfile?.id) {
        setCards([]); // Limpa cartões se não houver perfil
        setLoadingCards(false);
        return;
    }
    setLoadingCards(true);
    setSelectedCard(null); 
    setSelectedCardDetails(null);
    setInvoiceExpenses([]);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards`, {
        params: { isActive: true, includeSummary: true } 
      });
      if (response.data && response.data.status === 'success') {
        setCards(response.data.data || []); 
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error("Erro ao buscar cartões:", error);
      setCards([]);
    } finally {
      setLoadingCards(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      fetchCreditCards();
    } else if (!loadingProfiles && !isAuthenticated) {
      setLoadingCards(false);
      setCards([]);
      setSelectedCard(null); // Garante que nenhum cartão fique selecionado ao deslogar
    }
  }, [currentProfile, loadingProfiles, isAuthenticated, fetchCreditCards]);

  const fetchInvoiceDetails = useCallback(async (cardId, periodType = 'aberta', month, year) => {
    if (!currentProfile?.id || !cardId) return;
    setLoadingInvoice(true);
    setInvoiceExpenses([]);
    try {
      const params = { type: periodType };
      if (periodType === 'especifico' && month !== undefined && year !== undefined) {
        params.month = month;
        params.year = year;
      }
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards/${cardId}/invoice`, { params });
      if (response.data && response.data.status === 'success') {
        setSelectedCardDetails(prev => ({...prev, ...response.data.data}));
        setInvoiceExpenses(response.data.data.transactions || []);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes da fatura:", error);
      setSelectedCardDetails(prev => ({...(prev || selectedCard), totalAmount: 0})); // Zera total se erro
      setInvoiceExpenses([]);
    } finally {
      setLoadingInvoice(false);
    }
  }, [currentProfile, selectedCard]); // Adicionado selectedCard como dependência

  const fetchAvailablePeriods = useCallback(async (cardId) => {
    if (!currentProfile?.id || !cardId) return;
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards/${cardId}/available-periods`);
      if (response.data && response.data.status === 'success') {
        setAvailableInvoicePeriods(response.data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar períodos de fatura:", error);
      setAvailableInvoicePeriods([]);
    }
  }, [currentProfile]);
  
  const fetchAvailableLimit = useCallback(async (cardId) => {
    if (!currentProfile?.id || !cardId) return;
    setLoadingInvoice(true); 
    try {
        const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards/${cardId}/available-limit`);
        if (response.data && response.data.status === 'success') {
            setSelectedCardDetails(prev => ({
                ...(prev || selectedCard), 
                totalLimit: response.data.data.totalLimit,
                availableLimit: response.data.data.availableLimit,
                netUsedInOpenInvoice: response.data.data.netUsedInOpenInvoice,
            }));
        }
    } catch (error) {
        console.error("Erro ao buscar limite disponível:", error);
         setSelectedCardDetails(prev => ({ // Fallback se der erro
            ...(prev || selectedCard),
            totalLimit: selectedCard?.limit || 0,
            availableLimit: selectedCard?.availableLimit || 0,
            netUsedInOpenInvoice: (selectedCard?.limit || 0) - (selectedCard?.availableLimit || 0),
        }));
    } finally {
        setLoadingInvoice(false);
    }
  }, [currentProfile, selectedCard]);


  useEffect(() => {
    if (selectedCard?.id) {
      fetchInvoiceDetails(selectedCard.id, 'aberta');
      fetchAvailablePeriods(selectedCard.id);
      if (selectedCard.availableLimit === undefined || selectedCard.availableLimit === null) {
          fetchAvailableLimit(selectedCard.id);
      } else {
          setSelectedCardDetails(prev => ({
              ...(prev || {}), 
              ...selectedCard, 
              totalLimit: selectedCard.limit, 
              netUsedInOpenInvoice: parseFloat(selectedCard.limit) - parseFloat(selectedCard.availableLimit) 
          }));
      }
      setSelectedMonthYearForInvoice(dayjs()); 
    } else {
      setSelectedCardDetails(null);
      setInvoiceExpenses([]);
      setAvailableInvoicePeriods([]);
    }
  }, [selectedCard, fetchInvoiceDetails, fetchAvailablePeriods, fetchAvailableLimit]);
  
  const handleInvoicePeriodChange = (value) => {
    if (selectedCard?.id && value) {
      let year, month;
      if (typeof value === 'string') {
        const parts = value.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10); 
        setSelectedMonthYearForInvoice(dayjs().year(year).month(month - 1));
        fetchInvoiceDetails(selectedCard.id, 'especifico', month, year);
      } else { 
        year = value.year();
        month = value.month() + 1; 
        setSelectedMonthYearForInvoice(value);
        fetchInvoiceDetails(selectedCard.id, 'especifico', month, year);
      }
    } else if (selectedCard?.id && !value) { 
      setSelectedMonthYearForInvoice(dayjs());
      fetchInvoiceDetails(selectedCard.id, 'aberta');
    }
  };

  const handleCardSelect = (card) => {
    setSelectedCard(card);
  };

  const handleAddOrEditCard = async (values) => {
    if (!currentProfile?.id) return;
    const cardPayload = {
      name: values.name,
      limit: parseFloat(values.limitTotal), 
      closingDay: parseInt(values.closingDay),
      paymentDay: parseInt(values.paymentDay),
      lastFourDigits: values.numeroCartao ? String(values.numeroCartao).slice(-4) : null,
      flag: values.bandeira,
      dominantColor: values.corDominante,
      flagIconUrl: values.iconeBandeira,
      isActive: values.isActive === undefined ? true : values.isActive,
      isDefault: values.isDefault === undefined ? false : values.isDefault,
    };

    try {
      if (editingCard) {
        await apiClient.put(`/financial-accounts/${currentProfile.id}/credit-cards/${editingCard.id}`, cardPayload);
        message.success(`Cartão "${cardPayload.name}" atualizado!`);
      } else {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/credit-cards`, cardPayload);
        message.success(`Cartão "${cardPayload.name}" adicionado!`);
      }
      setIsAddCardModalVisible(false);
      setEditingCard(null);
      cardForm.resetFields();
      fetchCreditCards(); 
    } catch (error) {
      console.error("Erro ao salvar cartão:", error);
    }
  };

  const handleAddExpenseToSelectedCard = async (values) => {
    if(!selectedCard || !currentProfile?.id) {
        message.error("Nenhum cartão selecionado.");
        return;
    }
    
    const expensePayload = {
        description: values.description,
        value: parseFloat(values.value),
        transactionDate: dayjs(values.data).format('YYYY-MM-DD'),
        financialCategoryName: values.categoria,
        type: 'Saída',
        creditCardId: selectedCard.id,
        notes: values.notes,
        isParcel: values.isParceladaCheck,
        numberOfParcels: values.isParceladaCheck ? parseInt(values.numeroParcelas) : 1,
        totalValue: values.isParceladaCheck ? parseFloat(values.value) : parseFloat(values.value),
        initialDueDate: values.isParceladaCheck ? dayjs(values.data).format('YYYY-MM-DD') : null,
    };

    const endpoint = values.isParceladaCheck 
        ? `/financial-accounts/${currentProfile.id}/transactions/parcelled`
        : `/financial-accounts/${currentProfile.id}/transactions`;
    
    if (values.isParceladaCheck) { // Para o endpoint parcelled, o campo 'value' é o valor da parcela, não o total da compra
        expensePayload.value = undefined; // O backend irá calcular a parcela
    }

    try {
        await apiClient.post(endpoint, expensePayload);
        message.success(`Despesa adicionada ao cartão ${selectedCard.name}.`);
        setIsAddExpenseToCardModalVisible(false);
        addExpenseToCardForm.resetFields();
        
        let periodTypeToReload = 'aberta';
        let monthToReload, yearToReload;
        const currentSelectedPeriodString = `${selectedMonthYearForInvoice.year()}-${selectedMonthYearForInvoice.month() + 1}`;
        if (availableInvoicePeriods.some(p => `${p.year}-${p.month}` === currentSelectedPeriodString)) {
            periodTypeToReload = 'especifico';
            monthToReload = selectedMonthYearForInvoice.month() + 1;
            yearToReload = selectedMonthYearForInvoice.year();
        }
        fetchInvoiceDetails(selectedCard.id, periodTypeToReload, monthToReload, yearToReload);
        fetchAvailableLimit(selectedCard.id);
    } catch (error) {
        console.error("Erro ao adicionar despesa no cartão:", error);
    }
  };
  
  const handleDeleteCard = async (cardIdToDelete) => {
    if(!currentProfile?.id) return;
    const cardName = cards.find(c => c.id === cardIdToDelete)?.name || "este cartão";
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/credit-cards/${cardIdToDelete}`);
      message.warn(`Cartão "${cardName}" excluído.`);
      if (selectedCard?.id === cardIdToDelete) {
          setSelectedCard(null);
      }
      fetchCreditCards(); 
    } catch (error) {
      console.error(`Erro ao excluir cartão ${cardName}:`, error);
    }
  }

  const handlePayInvoice = async (values) => {
    if (!payingInvoiceCard || !currentProfile?.id) return;
    const payload = {
        paymentAmount: parseFloat(values.paymentAmount),
        paymentDate: dayjs(values.paymentDate).format('YYYY-MM-DD'),
        originatingAccountDescription: values.originatingAccountDescription,
        // Se quiser passar categoria: financialCategoryId: values.financialCategoryId (precisa adicionar no form)
    };
    try {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/credit-cards/${payingInvoiceCard.id}/pay-invoice`, payload);
        message.success(`Pagamento da fatura do cartão "${payingInvoiceCard.name}" registrado!`);
        setIsPayInvoiceModalVisible(false);
        payInvoiceForm.resetFields();

        let periodTypeToReload = 'aberta';
        let monthToReload, yearToReload;
        const currentSelectedPeriodString = `${selectedMonthYearForInvoice.year()}-${selectedMonthYearForInvoice.month() + 1}`;
        if (availableInvoicePeriods.some(p => `${p.year}-${p.month}` === currentSelectedPeriodString)) {
            periodTypeToReload = 'especifico';
            monthToReload = selectedMonthYearForInvoice.month() + 1;
            yearToReload = selectedMonthYearForInvoice.year();
        }
        fetchInvoiceDetails(payingInvoiceCard.id, periodTypeToReload, monthToReload, yearToReload);
        fetchAvailableLimit(payingInvoiceCard.id);
    } catch (error) {
        console.error("Erro ao pagar fatura:", error);
    }
  };

  const limiteDisponivel = selectedCardDetails?.availableLimit !== undefined ? selectedCardDetails.availableLimit : (selectedCard?.availableLimit || 0);
  const limiteTotalCard = selectedCardDetails?.totalLimit !== undefined ? selectedCardDetails.totalLimit : (selectedCard?.limit || 0);
  const utilizadoNaVisaoGeral = parseFloat(limiteTotalCard) - parseFloat(limiteDisponivel);
  const percentualUsado = limiteTotalCard > 0 ? (utilizadoNaVisaoGeral / limiteTotalCard) * 100 : 0;

  const expensePieConfig = useMemo(() => {
    const categoryData = invoiceExpenses.reduce((acc, expense) => {
      const categoryName = expense.category?.name || 'Outras';
      const existing = acc.find(item => item.type === categoryName);
      if (existing) {
        existing.value += parseFloat(expense.value);
      } else {
        acc.push({ type: categoryName, value: parseFloat(expense.value) });
      }
      return acc;
    }, []).sort((a,b) => b.value - a.value).slice(0,6);

    return {
      data: categoryData.length > 0 ? categoryData : [{type: "Sem dados", value: 1, isPlaceholder: true}],
      angleField: 'value', colorField: 'type', radius: 0.82, innerRadius: 0.65,
      label: categoryData.length > 0 && !categoryData[0].isPlaceholder ? { type: 'spider', labelHeight: 28, content: '{name}\n{percentage}', style: { fontSize: 11, fill: 'var(--header-text-secondary)'}} : false,
      interactions: [{ type: 'element-selected' }, { type: 'element-active' }, {type: 'tooltip'}],
      legend: false,
      tooltip: { formatter: (datum) => datum.isPlaceholder ? null : ({ name: datum.type, value: `R$ ${datum.value.toFixed(2).replace('.',',')}` }) },
      theme: 'light',
      color: categoryData.length > 0 && !categoryData[0].isPlaceholder ? ['#CC6633', '#E0BC63', '#994C00', '#5F6C7F', '#7A869A', '#A0AEC0'] : ['#E8E8E8'],
    };
  }, [invoiceExpenses]);

  const cardOptionsMenu = (card) => (
    <Menu onClick={(e) => e.domEvent.stopPropagation()} className="card-action-menu">
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => { setEditingCard(card); cardForm.setFieldsValue({...card, limitTotal: card.limit, numeroCartao: card.lastFourDigits, iconeBandeira: card.flagIconUrl, corDominante: card.dominantColor, bandeira: card.flag, isActive: card.isActive === undefined ? true : card.isActive, isDefault: card.isDefault === undefined ? false : card.isDefault }); setIsAddCardModalVisible(true); }}>
        Editar
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => Modal.confirm({title: "Confirmar Exclusão", content:`Deseja realmente excluir o cartão ${card.name}?`, okText:"Excluir", cancelText:"Cancelar", onOk: () => handleDeleteCard(card.id)}) }>
        Excluir
      </Menu.Item>
    </Menu>
  );
  
  if (loadingProfiles || (isAuthenticated && !currentProfile)) {
    return (
        <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
            <Spin indicator={<CreditCardOutlined style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>}/>
        </Content>
    );
  }
  if (!isAuthenticated) {
    return <Content style={{ padding: 50, textAlign: 'center' }}><Title level={3}>Por favor, faça login para acessar esta página.</Title></Content>;
  }


  return (
    <Content className="panel-content-area cartoes-content">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8} lg={7} className="cards-list-col">
          <div className="cards-list-header">
            <Title level={4} style={{ margin: 0 }}>Meus Cartões ({currentProfile?.name || 'N/D'})</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCard(null); cardForm.resetFields(); cardForm.setFieldsValue({ isActive: true, isDefault: cards.length === 0 }); setIsAddCardModalVisible(true); }} className="add-card-btn">
              Novo Cartão
            </Button>
          </div>
          <div className="cards-scrollable-list">
            {loadingCards ? <div style={{textAlign:'center', marginTop: 20}}><Spin /></div> :
            cards.length > 0 ? cards.map(card => (
              <Card 
                key={card.id} 
                hoverable 
                className={`cartao-item-card ${selectedCard?.id === card.id ? 'selected' : ''}`}
                onClick={() => handleCardSelect(card)}
                style={{ '--card-accent-color': card.dominantColor || 'var(--map-laranja)' }}
              >
                <div className="cartao-item-content">
                    <Avatar size={40} src={card.flagIconUrl} icon={<CreditCardOutlined />} className="cartao-bandeira-icon" />
                    <div className="cartao-info">
                        <Text strong className="cartao-nome">{card.name} {card.isDefault && <Tag color="gold" style={{marginLeft: 5, fontSize: 10}}>Padrão</Tag>}</Text>
                        <Text type="secondary" className="cartao-final">Final •••• {card.lastFourDigits || '????'}</Text>
                    </div>
                    <Dropdown
                        overlay={cardOptionsMenu(card)}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button type="text" icon={<MoreOutlined />} shape="circle" className="cartao-actions-btn" onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                </div>
              </Card>
            )) : (
              <Empty description={`Nenhum cartão cadastrado para ${currentProfile?.name || 'este perfil'}.`} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{marginTop: '30px'}}/>
            )}
          </div>
        </Col>

        <Col xs={24} md={16} lg={17} className="card-details-col">
          {!selectedCard ? (
            <Card className="select-card-prompt">
              <CreditCardOutlined style={{fontSize: '48px', color: 'var(--map-cinza-texto)', marginBottom: '20px'}}/>
              <Title level={4} style={{color: 'var(--map-cinza-texto)'}}>Selecione um cartão</Title>
              <Paragraph type="secondary">Escolha um cartão da lista ao lado para ver os detalhes e a fatura.</Paragraph>
            </Card>
          ) : (
            <Spin spinning={loadingInvoice || loadingCards}>
            <div className="selected-card-details-wrapper">
              <Card className="card-overview-panel" style={{'--selected-card-color': selectedCard.dominantColor || 'var(--map-laranja-escuro)'}}>
                <Row align="middle" gutter={16}>
                    <Col flex="none">
                       <Avatar size={64} src={selectedCard.flagIconUrl} icon={<CreditCardOutlined />} className="selected-card-avatar"/>
                    </Col>
                    <Col flex="auto">
                        <Title level={3} className="selected-card-name">{selectedCard.name}</Title>
                        <Text type="secondary" style={{color: 'rgba(255,255,255,0.8)'}}>Final •••• {selectedCard.lastFourDigits || '????'} ({selectedCard.flag || 'N/A'})</Text>
                    </Col>
                    <Col flex="none">
                         <Button type="primary" icon={<ShoppingCartOutlined />} className="add-expense-main-btn" onClick={() => { 
                            addExpenseToCardForm.resetFields(); 
                            addExpenseToCardForm.setFieldsValue({data: dayjs(), numeroParcelas: 1, categoria: categoriasDespesaModal[0]?.nome });
                            setIsParceladaExpense(false);
                            setIsAddExpenseToCardModalVisible(true);
                          }}>
                            Nova Despesa
                        </Button>
                    </Col>
                </Row>
                <Row gutter={[24,16]} style={{marginTop: '25px'}} justify="space-around" className="limit-stats-row">
                    <Col xs={24} sm={8}>
                        <Statistic title="Limite Total" value={limiteTotalCard} prefix="R$" precision={2} groupSeparator="." decimalSeparator="," />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Statistic title="Disponível" value={limiteDisponivel} prefix="R$" precision={2} groupSeparator="." decimalSeparator="," valueStyle={{color: 'var(--map-verde-claro)'}}/>
                    </Col>
                     <Col xs={24} sm={8}>
                        <Statistic title="Utilizado (Visão Geral)" value={utilizadoNaVisaoGeral < 0 ? 0 : utilizadoNaVisaoGeral} prefix="R$" precision={2} groupSeparator="." decimalSeparator="," valueStyle={{color: 'var(--map-vermelho-claro)'}}/>
                    </Col>
                </Row>
                <Progress percent={parseFloat(percentualUsado.toFixed(1))} strokeColor={{ from: 'var(--map-laranja-claro, #FFE7BA)', to: 'var(--map-laranja, #FA8C16)' }} trailColor="rgba(255,255,255,0.2)" className="limit-progress-bar" />
              </Card>

              <Card title="Fatura" bordered={false} className="invoice-panel"
                extra={
                  <Space>
                    <Text type="secondary">Período da Fatura:</Text>
                    { availableInvoicePeriods.length > 0 ? (
                        <Select
                            value={`${selectedMonthYearForInvoice.year()}-${String(selectedMonthYearForInvoice.month() + 1).padStart(2, '0')}`}
                            onChange={handleInvoicePeriodChange}
                            style={{width: '200px'}} // Aumentado um pouco
                            popupClassName="custom-datepicker-popup"
                        >
                            {availableInvoicePeriods.map(p => (
                                <Option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>{p.label}</Option>
                            ))}
                        </Select>
                    ) : (
                        <DatePicker 
                            picker="month" 
                            value={selectedMonthYearForInvoice} 
                            onChange={handleInvoicePeriodChange}
                            format="MMMM/YYYY"
                            allowClear={false}
                            inputReadOnly
                            style={{width: '180px'}}
                            popupClassName="custom-datepicker-popup"
                        />
                    )}
                  </Space>
                }
              >
                {invoiceExpenses.length > 0 || loadingInvoice ? (
                  <Spin spinning={loadingInvoice}>
                  <Row gutter={[24,24]}>
                      <Col xs={24} lg={14} className="invoice-list-col">
                         <Title level={5} style={{marginBottom: '15px'}}>Lançamentos na Fatura</Title>
                        <List
                            dataSource={invoiceExpenses}
                            renderItem={item => (
                            <List.Item className="invoice-expense-item">
                                <List.Item.Meta
                                title={<Text strong>{item.description}</Text>}
                                description={`${dayjs(item.transactionDate).format('DD/MM/YYYY')} ${item.isParcel ? `(Pcl. ${item.parcelNumber}/${item.totalParcels || '?'})` : ''} - Cat: ${item.category?.name || 'N/A'}`}
                                />
                                <Text strong type="danger" className="expense-value">
                                    R$ {parseFloat(item.value).toFixed(2).replace('.',',')}
                                </Text>
                            </List.Item>
                            )}
                            className="invoice-expenses-list"
                        />
                        <div className="invoice-total">
                            <Text strong>Total da Fatura:</Text>
                            <Text strong style={{fontSize: '18px', color: 'var(--map-laranja)'}}>
                                R$ {(selectedCardDetails?.totalAmount || 0).toFixed(2).replace('.',',')}
                            </Text>
                        </div>
                        <Button type="primary" block className="pay-invoice-btn" icon={<WalletOutlined/>} onClick={() => { setPayingInvoiceCard(selectedCard); payInvoiceForm.setFieldsValue({paymentAmount: selectedCardDetails?.totalAmount || 0, paymentDate: dayjs()}); setIsPayInvoiceModalVisible(true);}} disabled={!selectedCardDetails?.totalAmount || selectedCardDetails?.totalAmount <= 0}>Pagar/Registrar Pagamento</Button>
                      </Col>
                      <Col xs={24} lg={10} className="invoice-chart-col">
                        <Title level={5} style={{marginBottom: '15px'}}>Gastos por Categoria (Fatura)</Title>
                        {invoiceExpenses.length > 0 ? (
                            <Pie {...expensePieConfig} style={{ height: '280px' }} />
                        ) : (
                            <Empty description="Sem dados para o gráfico." image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                        )}
                      </Col>
                  </Row>
                  </Spin>
                ) : (
                  <Empty description={`Nenhuma despesa encontrada para ${selectedCardDetails?.invoicePeriodDescription || selectedMonthYearForInvoice.format('MMMM/YYYY')}.`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </div>
            </Spin>
          )}
        </Col>
      </Row>

      <Modal
        title={editingCard ? "Editar Cartão" : "Adicionar Novo Cartão"}
        open={isAddCardModalVisible}
        onCancel={() => { setIsAddCardModalVisible(false); setEditingCard(null); cardForm.resetFields(); }}
        footer={null}
        destroyOnClose
        className="add-card-modal modal-style-map"
      >
        <Form form={cardForm} layout="vertical" onFinish={handleAddOrEditCard} 
              initialValues={editingCard 
                ? {...editingCard, limitTotal: editingCard.limit, numeroCartao: editingCard.lastFourDigits, iconeBandeira: editingCard.flagIconUrl, corDominante: editingCard.dominantColor, bandeira: editingCard.flag, isActive: editingCard.isActive === undefined ? true : editingCard.isActive, isDefault: editingCard.isDefault === undefined ? false : editingCard.isDefault} 
                : {limitTotal: 1000, bandeira: 'Mastercard', corDominante: '#6A0DAD', closingDay: 20, paymentDay: 10, isActive: true, isDefault: cards.length === 0 }
              }>
          <Form.Item name="name" label="Nome do Cartão" rules={[{ required: true, message: 'Nome é obrigatório' }]}>
            <Input placeholder="Ex: Cartão Principal Nubank" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
                <Form.Item name="bandeira" label="Bandeira (Flag)" rules={[{ required: true, message: 'Bandeira é obrigatória' }]}>
                    <Select placeholder="Selecione">
                        <Option value="Mastercard">Mastercard</Option>
                        <Option value="Visa">Visa</Option>
                        <Option value="Elo">Elo</Option>
                        <Option value="Amex">American Express</Option>
                        <Option value="Hipercard">Hipercard</Option>
                        <Option value="Outra">Outra</Option>
                    </Select>
                </Form.Item>
            </Col>
             <Col xs={24} sm={12}>
                <Form.Item name="numeroCartao" label="Últimos 4 dígitos" rules={[{ required: true, message: 'Obrigatório' },{ len:4, message: 'Deve ter 4 dígitos'},{ pattern: /^\d{4}$/, message: 'Apenas números' }]}>
                    <Input placeholder="1234" maxLength={4}/>
                </Form.Item>
            </Col>
          </Row>
           <Row gutter={16}>
            <Col xs={24} sm={12}>
                <Form.Item name="closingDay" label="Dia de Fechamento da Fatura" rules={[{ required: true, message: 'Obrigatório' }, {type:'integer', min:1, max:28, message:'Dia entre 1 e 28'}]}>
                    <InputNumber min={1} max={28} style={{ width: '100%' }} placeholder="1 a 28"/>
                </Form.Item>
            </Col>
             <Col xs={24} sm={12}>
                <Form.Item name="paymentDay" label="Dia de Pagamento da Fatura" rules={[{ required: true, message: 'Obrigatório' }, {type:'integer', min:1, max:28, message:'Dia entre 1 e 28'}]}>
                     <InputNumber min={1} max={28} style={{ width: '100%' }} placeholder="1 a 28"/>
                </Form.Item>
            </Col>
          </Row>
          <Form.Item name="limitTotal" label="Limite Total (R$)" rules={[{ required: true, message: 'Limite é obrigatório' }, {type: 'number', min:0, message:'Limite deve ser >= 0'}]}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={value => String(value).replace(/\$\s?|(\.*)/g, '')} />
          </Form.Item>
           <Form.Item name="corDominante" label="Cor de Destaque (Hex Opcional)">
            <Input placeholder="#6A0DAD" />
          </Form.Item>
           <Form.Item name="iconeBandeira" label="URL do Ícone da Bandeira (Opcional)">
            <Input placeholder="https://exemplo.com/imagem.png" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
                <Form.Item name="isActive" label="Status" valuePropName="checked">
                    <Checkbox>Cartão Ativo?</Checkbox>
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="isDefault" label="Padrão" valuePropName="checked">
                    <Checkbox>Tornar cartão padrão?</Checkbox>
                </Form.Item>
            </Col>
          </Row>
          <Form.Item className="form-action-buttons">
             <Button onClick={() => { setIsAddCardModalVisible(false); setEditingCard(null); cardForm.resetFields(); }} className="cancel-btn-form" style={{marginRight: 8}}>Cancelar</Button>
            <Button type="primary" htmlType="submit" className="submit-btn-form">
              {editingCard ? "Salvar Alterações" : "Adicionar Cartão"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

        {/* Modal Adicionar Despesa ao Cartão (INTERNO) */}
        <Modal
            title={`Nova Despesa no Cartão: ${selectedCard?.name || ''}`}
            open={isAddExpenseToCardModalVisible}
            onCancel={() => {
                setIsAddExpenseToCardModalVisible(false);
                addExpenseToCardForm.resetFields();
                setIsParceladaExpense(false);
            }}
            footer={null}
            destroyOnClose
            className="add-expense-to-card-modal modal-style-map"
            width={600}
        >
            <Form 
                form={addExpenseToCardForm} 
                layout="vertical" 
                onFinish={handleAddExpenseToSelectedCard}
                initialValues={{ data: dayjs(), numeroParcelas: 1, categoria: categoriasDespesaModal[0]?.nome }}
            >
                <Form.Item
                    name="description"
                    label="Descrição da Despesa"
                    rules={[{ required: true, message: 'Descrição é obrigatória!' }]}
                >
                    <Input placeholder="Ex: Compra online Amazon, Jantar no restaurante X" />
                </Form.Item>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="value"
                            label={isParceladaExpense ? "Valor Total da Compra (R$)" : "Valor da Despesa (R$)"}
                            rules={[{ required: true, message: 'Valor é obrigatório!' }, { type: 'number', min: 0.01, message: 'Valor deve ser positivo.'}]}
                        >
                            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} decimalSeparator="," addonBefore="R$" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="data"
                            label="Data da Compra"
                            rules={[{ required: true, message: 'Data é obrigatória!' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item
                    name="categoria"
                    label="Categoria"
                    rules={[{ required: true, message: 'Categoria é obrigatória!' }]}
                >
                    <Select placeholder="Selecione uma categoria" showSearch optionFilterProp="children">
                        {categoriasDespesaModal.map(cat => (
                            <Option key={cat.id} value={cat.nome}>{cat.nome}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="isParceladaCheck" valuePropName="checked" style={{ marginBottom: isParceladaExpense ? '8px' : '24px' }}>
                    <Checkbox checked={isParceladaExpense} onChange={(e) => {
                        setIsParceladaExpense(e.target.checked);
                        if (!e.target.checked) addExpenseToCardForm.setFieldsValue({ numeroParcelas: 1 });
                        else if(addExpenseToCardForm.getFieldValue('numeroParcelas') < 2) addExpenseToCardForm.setFieldsValue({ numeroParcelas: 2 });
                    }}>
                        Compra Parcelada?
                    </Checkbox>
                </Form.Item>
                {isParceladaExpense && (
                    <Form.Item
                        name="numeroParcelas"
                        label="Número de Parcelas"
                        rules={[
                            { required: isParceladaExpense, message: 'Informe o número de parcelas!' },
                            { type: 'number', min: 2, message: 'Mínimo de 2 parcelas.' }
                        ]}
                    >
                        <InputNumber style={{ width: '100%' }} min={2} max={48} placeholder="Ex: 2, 3, 10, 12" />
                    </Form.Item>
                )}
                <Form.Item name="notes" label="Observações (Opcional)">
                    <Input.TextArea rows={2} placeholder="Algum detalhe adicional?" />
                </Form.Item>
                 <Form.Item className="form-action-buttons">
                    <Button onClick={() => { setIsAddExpenseToCardModalVisible(false); addExpenseToCardForm.resetFields(); setIsParceladaExpense(false); }} className="cancel-btn-form" style={{marginRight: 8}}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" className="submit-btn-form">Adicionar Despesa ao Cartão</Button>
                </Form.Item>
            </Form>
        </Modal>

        <Modal
            title={`Registrar Pagamento da Fatura - ${payingInvoiceCard?.name || ''}`}
            open={isPayInvoiceModalVisible}
            onCancel={() => { setIsPayInvoiceModalVisible(false); setPayingInvoiceCard(null); payInvoiceForm.resetFields();}}
            footer={null}
            destroyOnClose
            className="pay-invoice-modal modal-style-map"
        >
            <Form form={payInvoiceForm} layout="vertical" onFinish={handlePayInvoice}>
                <Form.Item name="paymentAmount" label="Valor do Pagamento (R$)" rules={[{required: true, message:"Valor é obrigatório"}, {type: 'number', min:0.01, message:"Valor deve ser positivo"}]}>
                    <InputNumber style={{width: '100%'}} min={0.01} precision={2} addonBefore="R$"/>
                </Form.Item>
                <Form.Item name="paymentDate" label="Data do Pagamento" rules={[{required: true, message:"Data é obrigatória"}]}>
                    <DatePicker style={{width: '100%'}} format="DD/MM/YYYY"/>
                </Form.Item>
                <Form.Item name="originatingAccountDescription" label="Conta de Origem do Pagamento (Opcional)">
                    <Input placeholder="Ex: Conta Corrente BB, Carteira Digital"/>
                </Form.Item>
                <Form.Item className="form-action-buttons">
                    <Button onClick={() => { setIsPayInvoiceModalVisible(false); setPayingInvoiceCard(null); payInvoiceForm.resetFields();}} className="cancel-btn-form" style={{marginRight: 8}}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" className="submit-btn-form">Registrar Pagamento</Button>
                </Form.Item>
            </Form>
        </Modal>

    </Content>
  );
};

export default CartoesPage;
