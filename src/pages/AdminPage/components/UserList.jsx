// src/pages/AdminPage/components/UserList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, Modal, Input, message, Popconfirm, Tooltip } from 'antd';
import { UserSwitchOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';
import ChangePlanModal from './ChangePlanModal';
import EditUserModal from './EditUserModal';

const planNameMapping = {
    gratuito: 'Gratuito',
    basico_mensal: 'Básico Mensal',
    basico_anual: 'Básico Anual',
    avancado_mensal: 'Avançado Mensal',
    avancado_anual: 'Avançado Anual',
    vitalicio_basico: 'Vitalício Básico',
    vitalicio_avancado: 'Vitalício Avançado',
};

const UserList = ({ filterKey }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const [editingClient, setEditingClient] = useState(null);
  const [isPlanModalVisible, setIsPlanModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const fetchClients = useCallback(async (page = pagination.current, pageSize = pagination.pageSize, search = searchTerm) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/clients/list', {
        params: { page, limit: pageSize, search, filter: filterKey },
      });
      setClients(response.data.clients);
      setPagination({
        current: response.data.currentPage,
        pageSize: pageSize,
        total: response.data.totalItems,
      });
    } catch (error) {
      message.error('Falha ao carregar a lista de clientes.');
    } finally {
      setLoading(false);
    }
  }, [filterKey, pagination.current, pagination.pageSize, searchTerm]);

  useEffect(() => {
    fetchClients(1); // Reset to page 1 when filterKey or searchTerm changes
  }, [filterKey, searchTerm]);

  const handleTableChange = (newPagination) => {
    fetchClients(newPagination.current, newPagination.pageSize);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };
  
  const handleDeleteClient = async (clientId) => {
    try {
      await apiClient.delete(`/admin/clients/${clientId}`);
      message.success('Cliente excluído com sucesso!');
      fetchClients();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao excluir o cliente.');
    }
  };

  const clientColumns = [
    { title: 'Nome', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Plano',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      render: (level) => <Tag color="blue">{planNameMapping[level] || level}</Tag>,
    },
    {
      title: 'Expira em',
      dataIndex: 'accessExpiresAt',
      key: 'accessExpiresAt',
      render: (date) => (date ? new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Vitalício/Gratuito'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'Ativo' ? 'green' : 'volcano'}>{status}</Tag>,
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      className: 'admin-table-actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar dados do usuário">
            <Button icon={<EditOutlined />} onClick={() => { setEditingClient(record); setIsEditModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="Alterar plano do usuário">
            <Button icon={<UserSwitchOutlined />} onClick={() => { setEditingClient(record); setIsPlanModalVisible(true); }} />
          </Tooltip>
          <Popconfirm
            title={`Tem certeza que quer excluir ${record.name}?`}
            description="Esta ação é irreversível."
            onConfirm={() => handleDeleteClient(record.id)}
            okText="Sim, excluir"
            cancelText="Não"
          >
            <Tooltip title="Excluir usuário">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="Buscar por nome, email ou telefone..."
          onSearch={handleSearch}
          enterButton={<Button icon={<SearchOutlined />} type="primary" />}
          style={{ width: 400 }}
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={() => fetchClients()} loading={loading}>Atualizar</Button>
      </Space>
      <Table
        columns={clientColumns}
        dataSource={clients}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />
      {isEditModalVisible && (
        <EditUserModal 
          client={editingClient}
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={() => {
            setIsEditModalVisible(false);
            fetchClients();
          }}
        />
      )}
      {isPlanModalVisible && (
        <ChangePlanModal
          client={editingClient}
          visible={isPlanModalVisible}
          onClose={() => setIsPlanModalVisible(false)}
          onSuccess={() => {
            setIsPlanModalVisible(false);
            fetchClients();
          }}
        />
      )}
    </>
  );
};

export default UserList;