// src/pages/AdminPage/components/AffiliatesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, Modal, message, Popconfirm, Tooltip, Typography, Alert } from 'antd';
import { DollarOutlined, HistoryOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';

const { Text } = Typography;

const AffiliatesTab = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/dashboard/affiliates');
      setAffiliates(response.data.data);
    } catch (error) {
      message.error('Falha ao carregar dados dos afiliados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const handleClearBalance = async (clientId) => {
    try {
      await apiClient.put(`/admin/clients/${clientId}/clear-balance`);
      message.success('Saldo zerado com sucesso! (Pagamento manual registrado)');
      fetchAffiliates();
    } catch (error) {
      message.error(error.response?.data?.message || 'Erro ao zerar o saldo.');
    }
  };

  const affiliateColumns = [
    {
      title: 'Nome do Afiliado',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.email && <Text type="secondary" style={{ fontSize: '12px' }}>({record.email})</Text>}
        </Space>
      ),
    },
    {
      title: 'Total de Indicados (Ciclo Atual)',
      dataIndex: 'referralsCount',
      key: 'referralsCount',
      align: 'center',
    },
    {
      title: 'Ganhos Totais (Ciclo Atual)',
      dataIndex: 'totalEarned',
      key: 'totalEarned',
      align: 'right',
      render: (value) => (
        <Text type="success" strong>
          {parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Text>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver Histórico de Indicações">
            <Button
              icon={<HistoryOutlined />}
              onClick={() => {
                setSelectedAffiliate(record);
                setHistoryModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Zerar Saldo e Reiniciar Ciclo?"
            description="Isso marcará o saldo como pago e zerará o contador de indicados para o próximo ciclo."
            onConfirm={() => handleClearBalance(record.id)}
            okText="Sim, paguei"
            cancelText="Cancelar"
          >
            <Button type="primary" danger icon={<DollarOutlined />}>
              Zerar Saldo (Pagar)
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    { title: 'Data', dataIndex: 'joinDate', key: 'joinDate', render: (date) => new Date(date).toLocaleDateString('pt-BR') },
    { title: 'Indicado', dataIndex: 'name', key: 'name' },
    { title: 'Plano', dataIndex: ['subscription', 'planName'], key: 'planName', render: (plan) => plan ? <Tag color="blue">{plan}</Tag> : <Tag>N/A</Tag> },
    { title: 'Comissão', dataIndex: ['subscription', 'commissionEarned'], key: 'commission', render: (val) => val ? `R$ ${parseFloat(val).toFixed(2)}` : '-' },
  ];

  console.log('AffiliatesTab rendering', { affiliates, loading });

  return (
    <div className="affiliates-tab-content">
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="Nota: Os dados exibidos referem-se ao ciclo atual (desde o último pagamento/zeramento de saldo)."
          type="info"
          showIcon
        />
      </div>

      <Table
        columns={affiliateColumns}
        dataSource={affiliates}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        summary={pageData => {
          let totalReferrals = 0;
          let totalEarnings = 0;
          pageData.forEach(({ referralsCount, totalEarned }) => {
            totalReferrals += referralsCount || 0;
            totalEarnings += parseFloat(totalEarned || 0);
          });
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="center">
                <Text strong>{totalReferrals}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <Text strong type="success">
                  {totalEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
            </Table.Summary.Row>
          );
        }}
      />

      <Modal
        title={`Histórico de Indicações - ${selectedAffiliate?.name || ''}`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        {selectedAffiliate && (
          <Table
            columns={historyColumns}
            dataSource={selectedAffiliate.referrals}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        )}
      </Modal>
    </div>
  );
};

export default AffiliatesTab;