// src/modals/ModalNovaReceita/ModalNovaReceita.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button, message, Space } from 'antd';
import { DollarCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { Option } = Select;

const ModalNovaReceita = ({ open, onCancel, onSuccess, currentProfile, editingTransaction }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!currentProfile?.id) return;
    setLoadingCategories(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/categories`);
      if (response.data && response.data.status === 'success') {
        setCategories(response.data.data.filter(c => c.type === 'Entrada' || !c.type) || []);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias de receita:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (editingTransaction) {
        form.setFieldsValue({
          description: editingTransaction.description,
          value: parseFloat(editingTransaction.value),
          transactionDate: dayjs(editingTransaction.transactionDate),
          financialCategoryId: editingTransaction.financialCategoryId,
          notes: editingTransaction.notes,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ transactionDate: dayjs() });
      }
    }
  }, [open, editingTransaction, form, fetchCategories]);

  const handleFinish = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      type: 'Entrada',
      transactionDate: values.transactionDate.format('YYYY-MM-DD'),
    };

    try {
      // <<< MUDANÇA 4: Rota de edição usa PATCH e não PUT >>>
      const endpoint = editingTransaction
        ? `/financial-accounts/${currentProfile.id}/transactions/${editingTransaction.id}`
        : `/financial-accounts/${currentProfile.id}/transactions`;
      // O método para edição agora é 'patch'
      const method = editingTransaction ? 'patch' : 'post';
      
      await apiClient[method](endpoint, payload);
      message.success(`Receita ${editingTransaction ? 'atualizada' : 'adicionada'} com sucesso!`);
      onSuccess();
      onCancel();
    } catch (error) {
      // O interceptor do apiClient já deve lidar com a mensagem de erro.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DollarCircleOutlined style={{ color: '#52c41a' }} />
          {editingTransaction ? 'Editar Receita' : 'Nova Receita'}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      className="modal-nova-transacao"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="description" label="Descrição" rules={[{ required: true, message: 'Insira a descrição!' }]}>
          <Input placeholder="Ex: Salário, Venda do Produto X" />
        </Form.Item>
        <Form.Item name="value" label="Valor (R$)" rules={[{ required: true, message: 'Insira o valor!' }]}>
          <InputNumber style={{ width: '100%' }} min={0.01} precision={2} decimalSeparator="," addonBefore="R$" />
        </Form.Item>
        <Form.Item name="transactionDate" label="Data da Receita" rules={[{ required: true, message: 'Insira a data!' }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="financialCategoryId" label="Categoria" rules={[{ required: true, message: 'Selecione uma categoria!' }]}>
          <Select placeholder="Selecione a categoria da receita" loading={loadingCategories} showSearch optionFilterProp="children">
            {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="notes" label="Observações (Opcional)">
          <Input.TextArea rows={2} placeholder="Detalhes adicionais sobre a receita" />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right', marginTop: '20px', marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} className="modal-btn-cancel">Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="modal-btn-submit income">
            {editingTransaction ? 'Salvar Alterações' : 'Adicionar Receita'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalNovaReceita;