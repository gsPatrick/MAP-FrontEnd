// src/pages/AdminPage/components/UserTable.jsx
import React, { useState } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Tooltip } from 'antd';
import { UserSwitchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';
import ChangePlanModal from './ChangePlanModal';
import EditUserModal from './EditUserModal';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const planNameMapping = {
  gratuito: 'Gratuito',
  basico_mensal: 'Básico Mensal',
  basico_anual: 'Básico Anual',
  avancado_mensal: 'Avançado Mensal',
  avancado_anual: 'Avançado Anual',
  vitalicio_basico: 'Vitalício Básico',
  vitalicio_avancado: 'Vitalício Avançado',
};

const UserTable = ({ users, loading, onActionSuccess }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPlanModalVisible, setIsPlanModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleDelete = async (clientId) => {
    try {
      await apiClient.delete(`/admin/clients/${clientId}`);
      message.success('Cliente excluído com sucesso!');
      onActionSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao excluir o cliente.');
    }
  };

  const columns = [
    { title: 'Nome', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name), fixed: 'left', width: 200 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 250 },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone', width: 150 },
    {
      title: 'Plano',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      width: 150,
      render: (level) => <Tag color="blue">{planNameMapping[level] || level}</Tag>,
    },
    {
      title: 'Expira em',
      dataIndex: 'accessExpiresAt',
      key: 'accessExpiresAt',
      width: 120,
      render: (date) => (date ? new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        let color = status === 'Ativo' ? 'green' : 'volcano';
        let label = status;

        // Sobrescrita visual baseada na atividade
        if (status === 'Ativo' && record.lastActiveAt) {
          const diffDays = dayjs().diff(dayjs(record.lastActiveAt), 'day');
          if (diffDays > 30) { color = 'default'; label = 'Parado'; }
          else if (diffDays > 15) { color = 'warning'; label = 'Inativo'; }
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Última Atividade',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 150,
      render: (date) => (date ? dayjs(date).fromNow() : 'Nunca'),
      sorter: (a, b) => new Date(a.lastActiveAt || 0) - new Date(b.lastActiveAt || 0),
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      className: 'admin-table-actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar dados">
            <Button icon={<EditOutlined />} onClick={() => { setSelectedUser(record); setIsEditModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="Alterar plano">
            <Button icon={<UserSwitchOutlined />} onClick={() => { setSelectedUser(record); setIsPlanModalVisible(true); }} />
          </Tooltip>
          <Popconfirm
            title={`Excluir ${record.name}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Sim" cancelText="Não"
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
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1200 }}
      />
      {isEditModalVisible && (
        <EditUserModal
          client={selectedUser}
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={() => {
            setIsEditModalVisible(false);
            onActionSuccess();
          }}
        />
      )}
      {isPlanModalVisible && (
        <ChangePlanModal
          client={selectedUser}
          visible={isPlanModalVisible}
          onClose={() => setIsPlanModalVisible(false)}
          onSuccess={() => {
            setIsPlanModalVisible(false);
            onActionSuccess();
          }}
        />
      )}
    </>
  );
};

export default UserTable;