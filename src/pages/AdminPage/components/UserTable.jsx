// src/pages/AdminPage/components/UserTable.jsx
import React, { useState } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Tooltip, Avatar } from 'antd';
import { UserSwitchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';
import ChangePlanModal from './ChangePlanModal';
import EditUserModal from './EditUserModal';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import './UserTable.css';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const planNameMapping = {
  gratuito: 'Gratuito',
  inadimplente: 'Inadimplente',
  basico_mensal: 'Básico Mensal',
  basico_anual: 'Básico Anual',
  avancado_mensal: 'Avançado Mensal',
  avancado_anual: 'Avançado Anual',
  vitalicio_basico: 'Vitalício Básico',
  vitalicio_avancado: 'Vitalício Avançado',
};

const planTagColor = (level) => {
  if (!level) return 'default';
  if (level.startsWith('vitalicio_')) return 'gold';
  if (level === 'inadimplente' || level === 'gratuito') return 'red';
  if (level.includes('avancado')) return 'geekblue';
  if (level.includes('basico')) return 'blue';
  return 'default';
};

// Situação UNIFICADA: combina status + plano + expiração em um único estado claro,
// eliminando a redundância entre "status" e "accessLevel".
const getSituacao = (record) => {
  if (record.status === 'Inativo') return { label: 'Excluído', color: 'default' };
  if (record.status === 'Bloqueado') return { label: 'Bloqueado', color: 'red' };
  if (record.status === 'Aguardando Pagamento') return { label: 'Aguardando pagamento', color: 'gold' };

  const lvl = record.accessLevel;
  if (lvl && lvl.startsWith('vitalicio_')) return { label: 'Ativo (vitalício)', color: 'green' };
  if (!lvl || lvl === 'inadimplente' || lvl === 'gratuito') return { label: 'Inadimplente', color: 'red' };

  if (record.accessExpiresAt) {
    const expired = dayjs(record.accessExpiresAt).endOf('day').isBefore(dayjs());
    return expired
      ? { label: 'Expirado', color: 'volcano' }
      : { label: 'Ativo', color: 'green' };
  }
  return { label: 'Ativo', color: 'green' };
};

const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const avatarColor = (str) => {
  const colors = ['#b24a0a', '#1677ff', '#52c41a', '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16'];
  let h = 0;
  for (const c of String(str || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
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
    {
      title: 'Usuário',
      key: 'user',
      fixed: 'left',
      width: 280,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (_, record) => (
        <div className="admin-user-cell">
          <Avatar style={{ backgroundColor: avatarColor(record.name || record.email), flexShrink: 0 }}>
            {initials(record.name)}
          </Avatar>
          <div className="admin-user-cell-info">
            <span className="admin-user-name">{record.name || 'Sem nome'}</span>
            <span className="admin-user-email">{record.email || 'sem e-mail'}</span>
          </div>
        </div>
      ),
    },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone', width: 150, render: (p) => p || '—' },
    {
      title: 'Plano',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      width: 160,
      render: (level, record) => (
        <div className="admin-plan-cell">
          <Tag color={planTagColor(level)} style={{ marginInlineEnd: 0 }}>
            {planNameMapping[level] || level || '—'}
          </Tag>
          {record.accessExpiresAt && (
            <span className="admin-plan-expiry">
              até {new Date(record.accessExpiresAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Situação',
      key: 'situacao',
      width: 150,
      filters: [
        { text: 'Ativo', value: 'Ativo' },
        { text: 'Inadimplente', value: 'Inadimplente' },
        { text: 'Aguardando pagamento', value: 'Aguardando pagamento' },
        { text: 'Bloqueado', value: 'Bloqueado' },
      ],
      onFilter: (value, record) => getSituacao(record).label.startsWith(value),
      render: (_, record) => {
        const s = getSituacao(record);
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Última atividade',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 150,
      render: (date) => (date ? dayjs(date).fromNow() : <span className="admin-muted">Nunca</span>),
      sorter: (a, b) => new Date(a.lastActiveAt || 0) - new Date(b.lastActiveAt || 0),
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 150,
      align: 'center',
      className: 'admin-table-actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar dados">
            <Button size="small" icon={<EditOutlined />} onClick={() => { setSelectedUser(record); setIsEditModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="Alterar plano">
            <Button size="small" type="primary" ghost icon={<UserSwitchOutlined />} onClick={() => { setSelectedUser(record); setIsPlanModalVisible(true); }} />
          </Tooltip>
          <Popconfirm
            title={`Excluir ${record.name || 'este usuário'}?`}
            description="O usuário ficará inativo e sairá da listagem."
            onConfirm={() => handleDelete(record.id)}
            okText="Sim" cancelText="Não"
          >
            <Tooltip title="Excluir usuário">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        className="admin-user-table"
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} usuário(s)` }}
        scroll={{ x: 940 }}
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
