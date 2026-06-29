// src/pages/AdminPage/components/UserTable.jsx
import React, { useState } from 'react';
import { Table, Tag, Button, Space, message, Tooltip, Avatar, Modal } from 'antd';
import { UserSwitchOutlined, DeleteOutlined, EditOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import apiClient from '../../../services/api';
import ChangePlanModal from './ChangePlanModal';
import EditUserModal from './EditUserModal';
import { getPlano, getSituacao } from './userStatus';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import './UserTable.css';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

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
  const [modal, modalContextHolder] = Modal.useModal();

  const doDelete = async (clientId) => {
    try {
      await apiClient.delete(`/admin/clients/${clientId}`);
      message.success('Usuário excluído com sucesso!');
      onActionSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao excluir o usuário.');
    }
  };

  const confirmDelete = (record) => {
    modal.confirm({
      title: 'Excluir usuário',
      icon: <ExclamationCircleFilled style={{ color: '#cf1322' }} />,
      centered: true,
      content: (
        <span>
          Tem certeza que deseja excluir <strong>{record.name || 'este usuário'}</strong>?<br />
          Ele ficará <strong>inativo</strong>, sairá da listagem e não receberá mais mensagens do sistema.
        </span>
      ),
      okText: 'Sim, excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => doDelete(record.id),
    });
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
      render: (level, record) => {
        const plano = getPlano(level);
        return (
          <div className="admin-plan-cell">
            <Tag color={plano.color} style={{ marginInlineEnd: 0 }}>{plano.label}</Tag>
            {plano.group !== 'sem_plano' && record.accessExpiresAt && (
              <span className="admin-plan-expiry">
                até {new Date(record.accessExpiresAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Situação',
      key: 'situacao',
      width: 170,
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
          <Tooltip title="Excluir usuário">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {modalContextHolder}
      <Table
        className="admin-user-table"
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} usuário(s)` }}
        scroll={{ x: 960 }}
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
