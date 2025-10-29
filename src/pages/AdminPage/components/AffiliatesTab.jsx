// src/pages/AdminPage/components/AffiliatesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, Modal, message, Popconfirm, Tooltip, Typography } from 'antd';
import { DollarOutlined, HistoryOutlined, CheckCircleOutlined } from '@ant-design/icons';
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

  const showHistory = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setHistoryModalVisible(true);
  };
  
  const affiliateColumns = [
    { title: 'Nome do Afiliado', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Saldo de Comissão', 
      dataIndex: 'balance', 
      key: 'balance',
      render: (balance) => <Text strong style={{ color: '#389e0d' }}>{`R$ ${parseFloat(balance).toFixed(2)}`}</Text>,
      sorter: (a, b) => a.balance - b.balance,
    },
    { title: 'Total de Indicados', dataIndex: 'totalReferrals', key: 'totalReferrals', sorter: (a, b) => a.totalReferrals - b.totalReferrals },
    { title: 'Ganhos Totais (Histórico)', dataIndex: 'totalEarned', key: 'totalEarned', render: (val) => `R$ ${parseFloat(val).toFixed(2)}` },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver histórico de indicações">
            <Button icon={<HistoryOutlined />} onClick={() => showHistory(record)}>Histórico</Button>
          </Tooltip>
          <Popconfirm
            title={`Confirmar pagamento para ${record.name}?`}
            description="Esta ação irá zerar o saldo de comissão do afiliado."
            onConfirm={() => handleClearBalance(record.id)}
            okText="Sim, paguei"
            cancelText="Não"
          >
            <Tooltip title="Marcar comissões como pagas (zerar saldo)">
              <Button icon={<CheckCircleOutlined />} type="primary" disabled={parseFloat(record.balance) === 0}>
                Zerar Saldo
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    { title: 'Indicado', dataIndex: ['referred', 'name'], key: 'referredName' },
    { title: 'Email Indicado', dataIndex: 'email', key: 'referredEmail' },
    { title: 'Data da Indicação', dataIndex: 'createdAt', key: 'joinDate', render: (date) => new Date(date).toLocaleDateString('pt-BR') },
    { title: 'Plano Assinado', dataIndex: ['plan', 'name'], key: 'planName', render: (plan) => plan ? <Tag color="geekblue">{plan.replace(/_/g, ' ')}</Tag> : <Tag>N/A</Tag> },
    { title: 'Comissão Gerada', dataIndex: 'commissionAmount', key: 'commission', render: (amount) => amount ? `R$ ${parseFloat(amount).toFixed(2)}` : 'N/A' },
  ];

  return (
    <>
      <Table
        columns={affiliateColumns}
        dataSource={affiliates}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        summary={pageData => (
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}><Text strong>Totais</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                    <Text strong style={{ color: '#cf1322' }}>
                        {`R$ ${pageData.reduce((sum, item) => sum + parseFloat(item.balance), 0).toFixed(2)}`}
                    </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}><Text strong>{pageData.reduce((sum, item) => sum + item.totalReferrals, 0)}</Text></Table.Summary.Cell>
            </Table.Summary.Row>
        )}
      />
      <Modal
        title={`Histórico de Indicações de ${selectedAffiliate?.name}`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedAffiliate && (
            <Table 
                columns={historyColumns}
                dataSource={selectedAffiliate.referrals}
                rowKey="id"
                pagination={false}
            />
        )}
      </Modal>
    </>
  );
};

export default AffiliatesTab;