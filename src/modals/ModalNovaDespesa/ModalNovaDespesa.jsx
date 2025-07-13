// src/modals/ModalNovaDespesa/ModalNovaDespesa.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button, message, Checkbox, Space } from 'antd';
import { DollarCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { Option } = Select;

const ModalNovaDespesa = ({ open, onCancel, onSuccess, currentProfile, editingTransaction }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [creditCards, setCreditCards] = useState([]);
  const [loadingCreditCards, setLoadingCreditCards] = useState(false);
  const [isParcelada, setIsParcelada] = useState(false);
  const [showCreditCardSelect, setShowCreditCardSelect] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentProfile?.id) return;
    setLoadingCategories(true);
    setLoadingCreditCards(true);
    try {
      const [catRes, cardRes] = await Promise.all([
        apiClient.get(`/financial-accounts/${currentProfile.id}/categories`),
        apiClient.get(`/financial-accounts/${currentProfile.id}/credit-cards`)
      ]);
      setCategories(catRes.data.data.filter(c => c.type === 'Saída' || !c.type) || []);
      setCreditCards(cardRes.data.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados para modal de despesa:", error);
    } finally {
      setLoadingCategories(false);
      setLoadingCreditCards(false);
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    if (open) {
      fetchData();
      if (editingTransaction) {
        form.setFieldsValue({
          description: editingTransaction.description,
          value: parseFloat(editingTransaction.value),
          transactionDate: dayjs(editingTransaction.transactionDate),
          financialCategoryId: editingTransaction.financialCategoryId,
          notes: editingTransaction.notes,
          paymentMethod: editingTransaction.creditCardId ? 'cartao_credito' : 'outros',
          creditCardId: editingTransaction.creditCardId
        });
        setShowCreditCardSelect(!!editingTransaction.creditCardId);
      } else {
        form.resetFields();
        form.setFieldsValue({ transactionDate: dayjs(), paymentMethod: 'outros' });
        setIsParcelada(false);
        setShowCreditCardSelect(false);
      }
    }
  }, [open, editingTransaction, form, fetchData]);
  
  const handleFinish = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      type: 'Saída',
      transactionDate: values.transactionDate.format('YYYY-MM-DD'),
    };
    
    const isParcelledPurchase = values.paymentMethod === 'cartao_credito' && values.isParcelada;
    
    try {
        let endpoint, method;
        let finalPayload = { ...payload };

        if(editingTransaction) {
            // <<< MUDANÇA 4: Rota de edição usa PATCH e não PUT >>>
            endpoint = `/financial-accounts/${currentProfile.id}/transactions/${editingTransaction.id}`;
            method = 'patch';
        } else if (isParcelledPurchase) {
            endpoint = `/financial-accounts/${currentProfile.id}/transactions/parcelled`;
            method = 'post';
            finalPayload = {
                description: values.description,
                totalValue: values.value,
                numberOfParcels: values.numeroParcelas,
                transactionDate: values.transactionDate.format('YYYY-MM-DD'),
                financialCategoryId: values.financialCategoryId,
                creditCardId: values.creditCardId,
                notes: values.notes,
            };
        } else {
            endpoint = `/financial-accounts/${currentProfile.id}/transactions`;
            method = 'post';
        }

        await apiClient[method](endpoint, finalPayload);
        message.success(`Despesa ${editingTransaction ? 'atualizada' : 'adicionada'} com sucesso!`);
        onSuccess();
        onCancel();
    } catch (error) {
       // Interceptor já cuida do erro
    } finally {
        setLoading(false);
    }
  };


  return (
    <Modal
      title={
        <Space>
          <DollarCircleOutlined style={{ color: '#ff4d4f' }} />
          {editingTransaction ? 'Editar Despesa' : 'Nova Despesa'}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={600}
      className="modal-nova-transacao"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} onValuesChange={(changedValues) => {
          if (changedValues.paymentMethod !== undefined) setShowCreditCardSelect(changedValues.paymentMethod === 'cartao_credito');
          if (changedValues.isParcelada !== undefined) setIsParcelada(changedValues.isParcelada);
      }}>
        <Form.Item name="description" label="Descrição" rules={[{ required: true, message: 'Insira a descrição!' }]}>
          <Input placeholder="Ex: Almoço, Compra Supermercado" />
        </Form.Item>
        <Form.Item name="value" label={isParcelada ? "Valor Total da Compra (R$)" : "Valor (R$)"} rules={[{ required: true, message: 'Insira o valor!' }]}>
          <InputNumber style={{ width: '100%' }} min={0.01} precision={2} decimalSeparator="," addonBefore="R$" />
        </Form.Item>
        <Form.Item name="transactionDate" label="Data da Despesa" rules={[{ required: true, message: 'Insira a data!' }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="financialCategoryId" label="Categoria" rules={[{ required: true, message: 'Selecione uma categoria!' }]}>
          <Select placeholder="Selecione a categoria da despesa" loading={loadingCategories} showSearch optionFilterProp="children">
            {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="paymentMethod" label="Forma de Pagamento">
            <Select onChange={(value) => setShowCreditCardSelect(value === 'cartao_credito')}>
                <Option value="outros">Outros (Dinheiro, Débito, PIX)</Option>
                <Option value="cartao_credito">Cartão de Crédito</Option>
            </Select>
        </Form.Item>

        {showCreditCardSelect && (
            <>
                <Form.Item name="creditCardId" label="Cartão de Crédito" rules={[{ required: true, message: "Selecione o cartão" }]}>
                    <Select placeholder="Selecione o cartão utilizado" loading={loadingCreditCards}>
                        {creditCards.map(card => <Option key={card.id} value={card.id}>{card.name} (Final {card.lastFourDigits})</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="isParcelada" valuePropName="checked">
                    <Checkbox onChange={e => setIsParcelada(e.target.checked)}>Compra Parcelada?</Checkbox>
                </Form.Item>
                {isParcelada && (
                    <Form.Item name="numeroParcelas" label="Número de Parcelas" rules={[{ required: true, message: "Informe o nº de parcelas" }]}>
                        <InputNumber min={2} max={48} style={{ width: '100%' }} />
                    </Form.Item>
                )}
            </>
        )}
        <Form.Item name="notes" label="Observações (Opcional)">
          <Input.TextArea rows={2} placeholder="Detalhes adicionais sobre a despesa" />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right', marginTop: '20px', marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} className="modal-btn-cancel">Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="modal-btn-submit expense">
            {editingTransaction ? 'Salvar Alterações' : 'Adicionar Despesa'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalNovaDespesa;