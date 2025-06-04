import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button, Row, Col, Checkbox, Radio, Divider, message } from 'antd';
import dayjs from 'dayjs';
import { ShoppingCartOutlined, CreditCardOutlined, MoneyCollectOutlined } from '@ant-design/icons'; // Adicionando MoneyCollectOutlined

const { Option } = Select;

// Mock de categorias e cartões (substituir por dados da API/contexto)
const mockCategoriasDespesa = [
  { id: 'ali', nome: 'Alimentação' }, { id: 'mor', nome: 'Moradia' },
  { id: 'tra', nome: 'Transporte' }, { id: 'laz', nome: 'Lazer' },
  { id: 'sau', nome: 'Saúde' }, { id: 'con', nome: 'Contas Fixas'},
  { id: 'com', nome: 'Compras Diversas'}, { id: 'out', nome: 'Outras Despesas' },
];
const mockCartoes = [ 
    {id: 'cartao1', nome: 'Nubank Final 1234'},
    {id: 'cartao2', nome: 'Inter Final 5678'},
];

const ModalNovaDespesa = ({ visible, onCancel, onOk, currentProfile }) => {
  const [form] = Form.useForm();
  const [tipoPagamento, setTipoPagamento] = useState('normal'); // 'normal' ou 'cartao'
  const [isParcelada, setIsParcelada] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null); // Para saber se um cartão foi selecionado

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        const despesaData = {
            ...values,
            financialAccountId: currentProfile?.id,
            tipoMovimentacao: 'despesa', // Para diferenciar de receita no backend
            formaPagamento: tipoPagamento, // 'normal' ou 'cartao'
            cartaoId: tipoPagamento === 'cartao' ? selectedCardId : null,
            isParcelada: tipoPagamento === 'cartao' && isParcelada,
            numeroParcelas: tipoPagamento === 'cartao' && isParcelada ? values.numeroParcelas : 1,
            data: dayjs(values.data).format('YYYY-MM-DD'), // Formata a data
            valor: parseFloat(values.valor)
        };
        
        if (tipoPagamento === 'cartao' && isParcelada && (!values.numeroParcelas || values.numeroParcelas < 2 )) {
            message.error('Para compra parcelada no cartão, o número de parcelas deve ser no mínimo 2.');
            return;
        }


        // Se não for parcelada no cartão, ou for despesa normal, o número de parcelas é 1
        if (!(tipoPagamento === 'cartao' && isParcelada)) {
            despesaData.numeroParcelas = 1;
        }


        onOk(despesaData);
        // O reset será feito pelo afterClose + useEffect no componente pai
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleCancelModal = () => {
    onCancel(); // O reset será feito pelo afterClose no Modal e useEffect
  };

  // Resetar estados locais e formulário quando o modal se torna visível
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setTipoPagamento('normal');
      setIsParcelada(false);
      setSelectedCardId(null);
      form.setFieldsValue({ 
        data: dayjs(), 
        categoria: mockCategoriasDespesa[0]?.nome, // Usa o nome da categoria
        numeroParcelas: 1 
      });
    }
  }, [visible, form]);

  const handleTipoPagamentoChange = (e) => {
    const novoTipo = e.target.value;
    setTipoPagamento(novoTipo);
    if (novoTipo === 'normal') {
      setIsParcelada(false); // Despesa normal não é parcelada desta forma
      setSelectedCardId(null);
      form.setFieldsValue({ cartaoId: undefined, isParceladaCheck: false, numeroParcelas: 1 });
    }
  };

  const handleCartaoChange = (value) => {
    setSelectedCardId(value);
    if (!value) { // Se desmarcar o cartão
        setIsParcelada(false);
        form.setFieldsValue({ isParceladaCheck: false, numeroParcelas: 1 });
    }
  };
  
  const handleParceladaChange = (e) => {
    setIsParcelada(e.target.checked);
    if (!e.target.checked) {
        form.setFieldsValue({ numeroParcelas: 1 });
    } else {
        // Se marcar parcelada e não tiver um número de parcelas válido, pode setar um default > 1
        if(form.getFieldValue('numeroParcelas') < 2) {
            form.setFieldsValue({ numeroParcelas: 2 });
        }
    }
  };


  return (
    <Modal
      title="Registrar Nova Despesa"
      open={visible}
      onCancel={handleCancelModal}
      destroyOnHidden
      afterClose={() => { // Garante reset completo após animação de fechar
        form.resetFields();
        setTipoPagamento('normal');
        setIsParcelada(false);
        setSelectedCardId(null);
      }}
      footer={[
        <Button key="back" onClick={handleCancelModal} className="modal-btn-cancel">
          Cancelar
        </Button>,
        <Button key="submit" type="primary" danger onClick={handleOk} className="modal-btn-submit expense">
          Adicionar Despesa
        </Button>,
      ]}
      className="modal-nova-transacao modal-nova-despesa" // Adiciona classe específica
      width={600} // Um pouco maior para acomodar mais campos
    >
      <Form form={form} layout="vertical" name="form_in_modal_despesa">
        <Form.Item
          name="descricao"
          label="Descrição da Despesa"
          rules={[{ required: true, message: 'Por favor, insira a descrição!' }]}
        >
          <Input placeholder="Ex: Compras no supermercado, Mensalidade Netflix" />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="valor"
              label={tipoPagamento === 'cartao' && isParcelada ? "Valor Total da Compra (R$)" : "Valor da Despesa (R$)"}
              rules={[{ required: true, message: 'Por favor, insira o valor!' }, { type: 'number', min: 0.01, message: 'O valor deve ser positivo.'}]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} precision={2} decimalSeparator="," addonBefore="R$" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="data"
              label="Data da Despesa/Compra"
              rules={[{ required: true, message: 'Por favor, selecione a data!' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="categoria"
          label="Categoria"
          rules={[{ required: true, message: 'Por favor, selecione uma categoria!' }]}
        >
          <Select placeholder="Selecione a categoria da despesa">
            {mockCategoriasDespesa.map(cat => (
              <Option key={cat.id} value={cat.nome}>{cat.nome}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Forma de Pagamento">
            <Radio.Group onChange={handleTipoPagamentoChange} value={tipoPagamento}>
                <Radio.Button value="normal"><MoneyCollectOutlined /> Normal (Dinheiro/Débito/Pix)</Radio.Button>
                <Radio.Button value="cartao"><CreditCardOutlined /> Cartão de Crédito</Radio.Button>
            </Radio.Group>
        </Form.Item>

        {tipoPagamento === 'cartao' && (
          <>
            <Divider dashed>Detalhes do Cartão</Divider>
            <Form.Item 
                name="cartaoId" 
                label="Selecionar Cartão de Crédito"
                rules={[{ required: true, message: 'Por favor, selecione um cartão!' }]}
            >
                <Select placeholder="Escolha o cartão utilizado" onChange={handleCartaoChange} allowClear>
                    {mockCartoes.map(cartao => (
                        <Option key={cartao.id} value={cartao.id}>{cartao.nome}</Option>
                    ))}
                </Select>
            </Form.Item>
            {selectedCardId && ( // Só mostra opção de parcelamento se um cartão foi selecionado
                <>
                    <Form.Item name="isParceladaCheck" valuePropName="checked" style={{marginBottom: isParcelada ? '8px' : '24px'}}>
                        <Checkbox checked={isParcelada} onChange={handleParceladaChange}>
                            Compra Parcelada no Cartão?
                        </Checkbox>
                    </Form.Item>
                    {isParcelada && (
                        <Form.Item
                            name="numeroParcelas"
                            label="Número de Parcelas"
                            rules={[
                                { required: true, message: 'Informe o número de parcelas!' },
                                { type: 'number', min: 2, message: 'Mínimo de 2 parcelas para compra parcelada.'}
                            ]}
                        >
                            <InputNumber style={{ width: '100%' }} min={2} max={48} placeholder="Ex: 2, 3, 10, 12"/>
                        </Form.Item>
                    )}
                </>
            )}
          </>
        )}

        <Form.Item
          name="notas"
          label="Observações (Opcional)"
        >
          <Input.TextArea rows={2} placeholder="Algum detalhe adicional sobre esta despesa?" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalNovaDespesa;