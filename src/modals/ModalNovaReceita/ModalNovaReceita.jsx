import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button, Row, Col, message } from 'antd';
import dayjs from 'dayjs';
import apiClient from '../../services/api'; // Importar apiClient
// useProfile não é estritamente necessário aqui se currentProfile já é passado como prop.

const { Option } = Select;

const ModalNovaReceita = ({ visible, onCancel, onOk, currentProfile, editingTransaction }) => {
  const [form] = Form.useForm();
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

  useEffect(() => {
    if (visible && currentProfile?.id) {
      setLoadingCategories(true);
      apiClient.get(`/financial-accounts/${currentProfile.id}/categories?hierarchical=false`) // Busca plana
        .then(response => {
          if (response.data && response.data.status === 'success') {
            setCategoriasDisponiveis(response.data.data || []);
          } else {
            message.error(response.data?.message || "Falha ao buscar categorias de receita.");
            setCategoriasDisponiveis([]);
          }
        })
        .catch(error => {
          console.error("Erro ao buscar categorias de receita:", error);
          // Interceptor já deve ter mostrado mensagem
          setCategoriasDisponiveis([]);
        })
        .finally(() => setLoadingCategories(false));
    } else if (!visible) {
        setCategoriasDisponiveis([]); // Limpa categorias quando o modal não está visível
    }
  }, [visible, currentProfile]);

  useEffect(() => {
    if (visible) {
        form.resetFields();
        if (editingTransaction) {
            form.setFieldsValue({
                description: editingTransaction.description,
                value: editingTransaction.value,
                data: editingTransaction.transactionDate ? dayjs(editingTransaction.transactionDate) : dayjs(),
                financialCategoryId: editingTransaction.financialCategoryId, // Agora é o ID
                notes: editingTransaction.notes,
            });
        } else {
            form.setFieldsValue({
                data: dayjs(),
                // Não preenche categoria default aqui, espera categorias carregarem
            });
        }
    }
  }, [visible, editingTransaction, form]);

  // Efeito para setar a categoria default após carregamento, se não estiver editando
  useEffect(() => {
      if (visible && !editingTransaction && categoriasDisponiveis.length > 0 && !form.getFieldValue('financialCategoryId')) {
          form.setFieldsValue({ financialCategoryId: categoriasDisponiveis[0].id });
      }
  }, [visible, editingTransaction, categoriasDisponiveis, form]);


  const handleOk = () => {
    form.validateFields()
      .then(values => {
        const dataToSend = {
          ...values,
          // 'data' já é um objeto dayjs, será formatado em handleAddGeneric
          // 'financialCategoryId' já é o ID
        };
        onOk(dataToSend);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
        message.error("Por favor, preencha todos os campos obrigatórios.");
      });
  };
  
  const handleCancelModal = () => {
    onCancel();
  };

  return (
    <Modal
      title={editingTransaction ? "Editar Receita" : "Registrar Nova Receita"}
      open={visible}
      onCancel={handleCancelModal}
      destroyOnHidden 
      afterClose={() => form.resetFields()}
      footer={[
        <Button key="back" onClick={handleCancelModal} className="modal-btn-cancel">
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk} className="modal-btn-submit income">
          {editingTransaction ? "Salvar Alterações" : "Adicionar Receita"}
        </Button>,
      ]}
      className="modal-nova-transacao"
    >
      <Form form={form} layout="vertical" name="form_in_modal_receita">
        <Form.Item
          name="description"
          label="Descrição da Receita"
          rules={[{ required: true, message: 'Por favor, insira a descrição!' }]}
        >
          <Input placeholder="Ex: Salário do mês, Venda produto X" />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="value"
              label="Valor (R$)"
              rules={[{ required: true, message: 'Por favor, insira o valor!' }, { type: 'number', min: 0.01, message: 'O valor deve ser positivo.'}]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} precision={2} decimalSeparator="," step={10} addonBefore="R$" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="data"
              label="Data da Receita"
              rules={[{ required: true, message: 'Por favor, selecione a data!' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="financialCategoryId" // Envia o ID
          label="Categoria"
          rules={[{ required: true, message: 'Por favor, selecione uma categoria!' }]}
        >
          <Select 
            placeholder="Selecione a categoria da receita" 
            loading={loadingCategories} 
            showSearch 
            optionFilterProp="children"
            filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {categoriasDisponiveis.map(cat => (
              <Option key={cat.id} value={cat.id}>{cat.name}</Option> 
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="notes"
          label="Observações (Opcional)"
        >
          <Input.TextArea rows={2} placeholder="Algum detalhe adicional sobre esta receita?" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalNovaReceita;