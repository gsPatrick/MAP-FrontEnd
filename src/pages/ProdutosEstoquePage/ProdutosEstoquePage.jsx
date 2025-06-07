// src/pages/ProdutosEstoquePage/ProdutosEstoquePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tooltip,
  Popconfirm, Typography, Divider, Empty, message, Tag, Result, Row, Col, Radio, DatePicker, Switch, Card
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, SwapOutlined,
  DropboxOutlined, DollarCircleOutlined, WarningOutlined, CheckCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SettingOutlined, FilterOutlined, StopOutlined, HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

// Contexto
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// Componentes do Painel REMOVIDOS: HeaderPanel, SidebarPanel
import './ProdutosEstoquePage.css';

const { Content } = Layout; // Layout ainda é importado para usar Content
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ProdutosEstoquePage = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  // Estado do sidebar REMOVIDO
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // const userNameForHeader = "Gestor de Estoque"; // REMOVIDO

  const [products, setProducts] = useState([]);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForStockMove, setProductForStockMove] = useState(null);
  
  const [searchText, setSearchText] = useState('');
  const [filterIsActive, setFilterIsActive] = useState(null);
  const [filterLowStock, setFilterLowStock] = useState(false);

  const [productForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [pageLoading, setPageLoading] = useState(true);
  const [tablePagination, setTablePagination] = useState({ current: 1, pageSize: 8, total: 0 });
  const [tableSorter, setTableSorter] = useState({ field: 'name', order: 'ascend' });

  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [productForHistory, setProductForHistory] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const isUserAllowed = useMemo(() => {
    return currentProfile && (currentProfile.type === 'PJ' || currentProfile.type === 'MEI');
  }, [currentProfile]);

  const fetchProducts = useCallback(async (pagination = tablePagination, sorter = tableSorter, filters = { searchText, filterIsActive, filterLowStock }) => {
    if (!currentProfile || !isUserAllowed) {
      setProducts([]);
      setPageLoading(false);
      setTablePagination(prev => ({ ...prev, current: 1, total: 0 }));
      return;
    }
    setPageLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: sorter.field || 'name',
        sortOrder: sorter.order === 'descend' ? 'DESC' : 'ASC',
        search: filters.searchText || undefined,
        isActive: filters.filterIsActive !== null ? filters.filterIsActive : undefined,
        lowStock: filters.filterLowStock ? true : undefined,
      };

      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/products`, { params });
      
      if (response.data && response.data.status === 'success') {
        setProducts(response.data.products || []);
        setTablePagination(prev => ({
            ...prev,
            current: response.data.currentPage,
            pageSize: pagination.pageSize, 
            total: response.data.totalItems,
        }));
      } else {
        message.warn(response.data?.message || "Não foi possível carregar os produtos.");
        setProducts([]);
        setTablePagination(prev => ({...prev, total: 0, current: 1}));
      }
    } catch (error) {
      console.error("Erro ao buscar produtos (catch):", error);
      setProducts([]);
      setTablePagination(prev => ({...prev, total: 0, current: 1}));
    } finally {
      setPageLoading(false);
    }
  }, [currentProfile, isUserAllowed, tablePagination.pageSize]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated) {
      if (currentProfile && isUserAllowed) {
        fetchProducts(tablePagination, tableSorter, { searchText, filterIsActive, filterLowStock });
      } else if (currentProfile && !isUserAllowed) {
        setPageLoading(false);
        setProducts([]);
        setTablePagination(prev => ({ ...prev, current: 1, total: 0 }));
      } else if (!currentProfile) {
         setPageLoading(false);
         setProducts([]);
         setTablePagination(prev => ({ ...prev, current: 1, total: 0 }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile, loadingProfiles, isAuthenticated, isUserAllowed, fetchProducts]);

  const handleTableChange = (pagination, tableFilters, sorter) => {
      const newSorter = {
        field: sorter.field || 'name',
        order: sorter.order || 'ascend',
      };
      setTableSorter(newSorter);
      setTablePagination(prev => ({ ...prev, current: pagination.current, pageSize: pagination.pageSize }));
      fetchProducts(
        { current: pagination.current, pageSize: pagination.pageSize, total: tablePagination.total },
        newSorter,
        { searchText, filterIsActive, filterLowStock }
      );
  };

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile && isUserAllowed) {
        const newPagination = { ...tablePagination, current: 1 };
        fetchProducts(newPagination, tableSorter, { searchText, filterIsActive, filterLowStock });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterIsActive, filterLowStock]);

  const showProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
        productForm.setFieldsValue({
            ...product,
            salePrice: product.salePrice,
            costPrice: product.costPrice,
            quantity: product.quantity,
            minimumStock: product.minimumStock,
            isActive: product.isActive === undefined ? true : product.isActive,
        });
    } else {
        productForm.setFieldsValue({
            unit: 'UN', quantity: 0, minimumStock: 0, salePrice: null, costPrice: null, isActive: true
        });
    }
    setIsProductModalVisible(true);
  };

  const handleProductModalCancel = () => {
    setIsProductModalVisible(false);
    setEditingProduct(null);
    productForm.resetFields();
  };

  const onProductFormFinish = async (values) => {
    if (!currentProfile) return;
    const productData = { ...values };
    try {
      if (editingProduct) {
        await apiClient.put(`/financial-accounts/${currentProfile.id}/products/${editingProduct.id}`, productData);
        message.success(`Produto "${values.name}" atualizado!`);
      } else {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/products`, productData);
        message.success(`Produto "${values.name}" criado!`);
      }
      fetchProducts({ ...tablePagination, current: editingProduct ? tablePagination.current : 1 }, tableSorter, { searchText, filterIsActive, filterLowStock });
      handleProductModalCancel();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const showStockModal = (product) => {
    setProductForStockMove(product);
    stockForm.setFieldsValue({ type: 'Entrada', quantity: 1, movementDate: dayjs(), reason: '' });
    setIsStockModalVisible(true);
  };

  const handleStockModalCancel = () => {
    setIsStockModalVisible(false);
    setProductForStockMove(null);
    stockForm.resetFields();
  };

  const onStockFormFinish = async (values) => {
    if (!currentProfile || !productForStockMove) return;
    const movementData = {
      ...values,
      movementDate: values.movementDate ? values.movementDate.toISOString() : dayjs().toISOString(),
    };
    try {
      await apiClient.post(`/financial-accounts/${currentProfile.id}/products/${productForStockMove.id}/stock`, movementData);
      message.success(`Estoque de "${productForStockMove.name}" atualizado!`);
      fetchProducts(tablePagination, tableSorter, { searchText, filterIsActive, filterLowStock });
      handleStockModalCancel();
    } catch (error) {
      console.error("Erro ao movimentar estoque:", error);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!currentProfile) return;
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/products/${productId}`);
      message.warn(`Produto "${productName}" excluído.`);
      fetchProducts(tablePagination, tableSorter, { searchText, filterIsActive, filterLowStock });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  const fetchStockHistory = useCallback(async (productId, pagination = { current: 1, pageSize: 5 }) => {
    if (!currentProfile || !productId) return;
    setHistoryLoading(true);
    try {
        const response = await apiClient.get(`/stock/movements`, { 
            params: {
                productId: productId,
                financialAccountId: currentProfile.id,
                page: pagination.current,
                limit: pagination.pageSize,
                sortBy: 'movementDate',
                sortOrder: 'DESC'
            }
        });
        if (response.data && response.data.status === 'success') {
            setStockHistory(response.data.movements || []);
            setHistoryPagination({
                current: response.data.currentPage,
                pageSize: pagination.pageSize,
                total: response.data.totalItems,
            });
        } else {
            setStockHistory([]);
            setHistoryPagination(prev => ({ ...prev, total: 0, current: 1 }));
        }
    } catch (error) {
        console.error("Erro ao buscar histórico de estoque:", error);
        message.error("Falha ao carregar histórico de estoque.");
        setStockHistory([]);
        setHistoryPagination(prev => ({ ...prev, total: 0, current: 1 }));
    } finally {
        setHistoryLoading(false);
    }
  }, [currentProfile]);

  const showHistoryModal = (product) => {
    setProductForHistory(product);
    fetchStockHistory(product.id, { current: 1, pageSize: 5 });
    setIsHistoryModalVisible(true);
  };

  const handleHistoryModalCancel = () => {
    setIsHistoryModalVisible(false);
    setProductForHistory(null);
    setStockHistory([]);
    setHistoryPagination({ current: 1, pageSize: 5, total: 0 });
  };

  const handleHistoryTableChange = (pagination) => {
    if (productForHistory) {
        fetchStockHistory(productForHistory.id, pagination);
    }
  };

  const productTableColumns = [
    {
      title: 'Produto/Serviço', dataIndex: 'name', key: 'name', width: 250, fixed: 'left',
      sorter: true,
      render: (text) => <Text strong className="product-name-table">{text}</Text>,
    },
    { title: 'Código', dataIndex: 'code', key: 'code', width: 120, responsive: ['md'], sorter: true },
    {
      title: 'Preço Venda', dataIndex: 'salePrice', key: 'salePrice', align: 'right', width: 130,
      sorter: true,
      render: val => <Text className="price-sell">{`R$ ${parseFloat(val || 0).toFixed(2)}`}</Text>,
    },
    {
      title: 'Estoque', dataIndex: 'quantity', key: 'quantity', align: 'center', width: 120,
      sorter: true,
      render: (val, record) => {
        if (record.unit === 'SRV' || record.unit === 'HR') return <Tag className="stock-tag service-stock">N/A (Serviço)</Tag>;
        const currentStock = parseInt(val || 0);
        const minStock = parseInt(record.minimumStock || 0);
        const isLow = currentStock < minStock && currentStock !== 0 && minStock > 0;
        const isOut = currentStock === 0 && minStock > 0;
        let color = 'success';
        if (isLow) color = 'warning';
        if (isOut) color = 'error';
        return <Tag className={`stock-tag ${color}-stock`} icon={isLow || isOut ? <WarningOutlined /> : <CheckCircleOutlined />}>{currentStock} {record.unit}</Tag>;
      },
    },
    { title: 'Est. Mín.', dataIndex: 'minimumStock', key: 'minimumStock', align: 'center', width: 100, responsive: ['md'], sorter: true },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', align: 'center', width:100,
        render: isActive => isActive ? <Tag color="success">Ativo</Tag> : <Tag color="default">Inativo</Tag>,
    },
    {
      title: 'Ações', key: 'actions', align: 'center', width: 180, fixed: 'right',
      render: (_, record) => (
        <Space size="small" className="action-buttons-container">
          <Tooltip title="Ver Histórico">
            <Button icon={<HistoryOutlined />} onClick={() => showHistoryModal(record)} className="action-btn history-btn" />
          </Tooltip>
          { (record.unit !== 'SRV' && record.unit !== 'HR') &&
            <Tooltip title="Movimentar Estoque">
                <Button icon={<SwapOutlined />} onClick={() => showStockModal(record)} className="action-btn move-stock-btn" />
            </Tooltip>
          }
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => showProductModal(record)} className="action-btn edit-btn" />
          </Tooltip>
          <Popconfirm
            title={<Text>Excluir <Text strong className="delete-confirm-product-name">"{record.name}"</Text>?</Text>}
            description="Esta ação não pode ser desfeita."
            onConfirm={() => handleDeleteProduct(record.id, record.name)}
            okText="Sim, Excluir"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, className: 'delete-confirm-ok-btn' }}
            cancelButtonProps={{ className: 'delete-confirm-cancel-btn'}}
            overlayClassName="delete-popconfirm"
          >
            <Tooltip title="Excluir">
              <Button icon={<DeleteOutlined />} danger className="action-btn delete-btn" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loadingProfiles || (!isAuthenticated && !currentProfile)) {
     return (
        <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
            <DropboxOutlined style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>
            <Paragraph style={{marginLeft: 10}}>Carregando informações...</Paragraph>
        </Content>
     );
  }

  if (!isUserAllowed) {
    return (
        <Content className="restricted-access-content">
            <Result
              icon={<StopOutlined style={{color: 'var(--map-vermelho-escuro)'}}/>}
              status="error"
              title="Acesso Restrito"
              subTitle={`O perfil "${currentProfile?.name || 'Atual'}" (${currentProfile?.type}) não tem permissão para Produtos e Estoque. Funcionalidade para perfis PJ/MEI.`}
            />
        </Content>
    );
  }

  return (
    <Content className="page-content-wrapper">
      <div className="page-header-custom product-page-header">
        <Title level={2} className="page-title-custom">
          <DropboxOutlined className="title-icon-products" /> Produtos e Estoque 
          {currentProfile && <Text style={{fontSize: '16px', color: 'var(--map-dourado)', fontWeight: 500, marginLeft: 8}}>({currentProfile.name})</Text>}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showProductModal()} size="large" className="add-new-button-custom">
          Novo Produto/Serviço
        </Button>
      </div>

      <Card bordered={false} className="table-actions-card">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={10} lg={8}>
            <Input 
                prefix={<SearchOutlined className="search-input-icon"/>} 
                placeholder="Buscar por nome, código..." 
                value={searchText} 
                onChange={e => setSearchText(e.target.value)} 
                allowClear size="large" className="search-input-products" 
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
             <Select 
                value={filterIsActive} 
                onChange={(value) => setFilterIsActive(value)} 
                style={{ width: '100%' }} 
                size="large"
                placeholder="Status"
                allowClear
             >
                <Option value={null}>Todos Status</Option>
                <Option value={true}>Ativos</Option>
                <Option value={false}>Inativos</Option>
             </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
             <Select 
                value={filterLowStock ? 'low' : null} 
                onChange={(value) => setFilterLowStock(value === 'low')} 
                style={{ width: '100%' }} 
                size="large"
                placeholder="Estoque"
                allowClear
             >
                <Option value={null}>Todo Estoque</Option>
                <Option value={'low'}>Estoque Baixo</Option>
             </Select>
          </Col>
          <Col xs={24} md={6} lg={{span: 6, offset: 4}} style={{textAlign: 'right', alignSelf: 'center'}}>
              <Space>
                <Text className="total-products-info">
                    Exibindo: <Text strong>{products.length}</Text> de <Text strong>{tablePagination.total}</Text>
                </Text>
              </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={productTableColumns}
        dataSource={products}
        rowKey="id"
        pagination={tablePagination}
        loading={pageLoading}
        onChange={handleTableChange}
        className="products-main-table"
        scroll={{ x: 1000 }}
        rowClassName={(record) => {
            if (record.unit === 'SRV' || record.unit === 'HR') return '';
            const currentStock = parseInt(record.quantity || 0);
            const minStock = parseInt(record.minimumStock || 0);
            if (currentStock === 0 && minStock > 0) return 'out-of-stock-row';
            if (currentStock < minStock && minStock > 0) return 'low-stock-row';
            return '';
        }}
        locale={{ emptyText: pageLoading ? "Carregando produtos..." : <Empty description={`Nenhum produto/serviço encontrado para "${currentProfile?.name || 'este perfil'}".`} /> }}
      />

      {/* Modal de Produto */}
      <Modal
        title={<Space><DropboxOutlined /> {editingProduct ? "Editar Produto/Serviço" : "Novo Produto/Serviço"}</Space>}
        open={isProductModalVisible}
        onCancel={handleProductModalCancel}
        footer={null}
        destroyOnClose
        width={720}
        className="product-form-modal modal-style-map"
      >
        <Form form={productForm} layout="vertical" onFinish={onProductFormFinish} className="product-modal-form">
          <Row gutter={20}>
            <Col xs={24} sm={16}><Form.Item name="name" label="Nome do Produto/Serviço" rules={[{ required: true, message: 'Insira o nome!' }]}><Input placeholder="Ex: Camiseta Premium MAP" /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="code" label="Código (SKU)"><Input placeholder="Opcional" /></Form.Item></Col>
          </Row>
          <Row gutter={20}>
            <Col xs={12} sm={8}><Form.Item name="unit" label="Unidade" initialValue="UN"><Select><Option value="UN">Unidade</Option><Option value="PC">Peça</Option><Option value="CX">Caixa</Option><Option value="KG">Kg</Option><Option value="LT">Litro</Option><Option value="M">Metro</Option><Option value="HR">Hora (Serviço)</Option><Option value="SRV">Serviço (Unidade)</Option></Select></Form.Item></Col>
            <Col xs={12} sm={8}><Form.Item name="salePrice" label="Preço Venda (R$)" rules={[{ required: true, message: 'Insira o preço!' }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="R$" /></Form.Item></Col>
            <Col xs={12} sm={8}><Form.Item name="costPrice" label="Custo (R$)"><InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="R$"/></Form.Item></Col>
          </Row>
          <Row gutter={20}>
            <Col xs={12} sm={8}><Form.Item name="quantity" label="Estoque Inicial/Ajuste" rules={[{ type: 'number', message: 'Deve ser um número' }]}><InputNumber style={{ width: '100%' }} placeholder="N/A para serviço"/></Form.Item></Col>
            <Col xs={12} sm={8}><Form.Item name="minimumStock" label="Estoque Mínimo"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} sm={8}>
              <Form.Item name="isActive" label="Status do Produto" valuePropName="checked" initialValue={true}>
                  <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Descrição Detalhada (Opcional)">
              <Input.TextArea rows={2} placeholder="Mais detalhes sobre o produto ou serviço..." />
          </Form.Item>
          <Divider className="form-divider" />
          <Form.Item className="form-action-buttons">
            <Button onClick={handleProductModalCancel} className="cancel-btn-form">Cancelar</Button>
            <Button type="primary" htmlType="submit" className="submit-btn-form">{editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Estoque */}
      <Modal
        title={<Space><SwapOutlined /> Movimentar Estoque: <Text strong className="product-name-stock-modal">{productForStockMove?.name}</Text></Space>}
        open={isStockModalVisible}
        onCancel={handleStockModalCancel}
        footer={null}
        destroyOnClose
        width={500}
        className="stock-movement-modal modal-style-map"
      >
        <Form form={stockForm} layout="vertical" onFinish={onStockFormFinish} className="stock-modal-form">
          <Form.Item name="type" label="Tipo de Movimentação" rules={[{ required: true }]}>
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="Entrada"><ArrowUpOutlined /> Entrada</Radio.Button>
              <Radio.Button value="Saída"><ArrowDownOutlined /> Saída</Radio.Button>
              <Radio.Button value="Ajuste"><SettingOutlined /> Ajuste</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Row gutter={20}>
              <Col span={12}>
                  <Form.Item name="quantity" label="Quantidade" 
                      rules={[
                          { required: true, message: 'Insira a quantidade!' },
                          ({ getFieldValue }) => ({
                              validator(_, value) {
                                  if (getFieldValue('type') === 'Ajuste') return Promise.resolve();
                                  if (value > 0) return Promise.resolve();
                                  return Promise.reject(new Error('Maior que zero para Entrada/Saída!'));
                              },
                          }),
                      ]}
                  >
                      <InputNumber style={{ width: '100%' }} placeholder={stockForm.getFieldValue('type') === 'Ajuste' ? "+Entrada/-Saída" : "> 0"}/>
                  </Form.Item>
              </Col>
              <Col span={12}>
                  <Form.Item name="movementDate" label="Data da Movimentação" initialValue={dayjs()}>
                      <DatePicker style={{width: '100%'}} placeholder="Hoje" format="DD/MM/YYYY HH:mm" showTime />
                  </Form.Item>
              </Col>
          </Row>
          <Form.Item name="reason" label="Motivo/Observação (Opcional)"><Input.TextArea rows={2} placeholder="Ex: Compra fornecedor X, Venda pedido #123" /></Form.Item>
          <Divider className="form-divider" />
          <Form.Item className="form-action-buttons">
            <Button onClick={handleStockModalCancel} className="cancel-btn-form">Cancelar</Button>
            <Button type="primary" htmlType="submit" className="submit-btn-form">Confirmar Movimentação</Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal de Histórico de Estoque */}
      <Modal
        title={<Space><HistoryOutlined /> Histórico de Estoque: <Text strong>{productForHistory?.name}</Text></Space>}
        open={isHistoryModalVisible}
        onCancel={handleHistoryModalCancel}
        footer={[ <Button key="close" onClick={handleHistoryModalCancel}> Fechar </Button> ]}
        width={700}
        className="stock-history-modal modal-style-map"
      >
        <Table
          columns={[
            { title: 'Data', dataIndex: 'movementDate', key: 'movementDate', render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'), width: 150, sorter: (a,b) => dayjs(a.movementDate).unix() - dayjs(b.movementDate).unix() },
            { title: 'Tipo', dataIndex: 'type', key: 'type', width: 100, render: (type) => <Tag color={type === 'Entrada' ? 'green' : 'red'}>{type}</Tag> },
            { title: 'Quantidade', dataIndex: 'quantity', key: 'quantity', align: 'right', width: 100 },
            { title: 'Motivo/Ref.', dataIndex: 'reason', key: 'reason', ellipsis: true },
          ]}
          dataSource={stockHistory}
          rowKey="id"
          loading={historyLoading}
          pagination={historyPagination}
          onChange={handleHistoryTableChange}
          size="small"
          scroll={{ y: 300 }}
          locale={{ emptyText: historyLoading ? "Carregando histórico..." : "Nenhuma movimentação encontrada para este produto." }}
        />
      </Modal>
    </Content>
  );
};

export default ProdutosEstoquePage;