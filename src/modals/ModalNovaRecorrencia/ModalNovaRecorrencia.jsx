import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, InputNumber, DatePicker, Select, Button,
  Row, Col, Radio, Checkbox, Space, Tooltip, Typography, Divider
} from 'antd';
import dayjs from 'dayjs';
import { RetweetOutlined, CalendarOutlined, DollarCircleOutlined, InfoCircleOutlined  } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

// Mock de categorias (substituir por API/contexto)
const mockCategorias = [
  { id: 'sal', nome: 'Salário', tipoPermitido: 'Receita' },
  { id: 'fre', nome: 'Freelance', tipoPermitido: 'Receita' },
  { id: 'ali', nome: 'Alimentação', tipoPermitido: 'Despesa' },
  { id: 'mor', nome: 'Moradia', tipoPermitido: 'Despesa' },
  { id: 'ass', nome: 'Assinaturas', tipoPermitido: 'Despesa' },
  { id: 'inv', nome: 'Investimentos', tipoPermitido: 'Ambos' },
  { id: 'out', nome: 'Outras', tipoPermitido: 'Ambos' },
];

// Dias da semana para seleção
const diasDaSemana = [
  { label: 'Domingo', value: 0 }, { label: 'Segunda-feira', value: 1 },
  { label: 'Terça-feira', value: 2 }, { label: 'Quarta-feira', value: 3 },
  { label: 'Quinta-feira', value: 4 }, { label: 'Sexta-feira', value: 5 },
  { label: 'Sábado', value: 6 },
];

const ModalNovaRecorrencia = ({ visible, onCancel, onOk, currentProfile, editingRecorrencia }) => {
  const [form] = Form.useForm();
  const [tipoRecorrencia, setTipoRecorrencia] = useState('Despesa');
  const [frequencia, setFrequencia] = useState('monthly'); // Default: mensal

  // Filtrar categorias com base no tipo de recorrência selecionado
  const categoriasFiltradas = mockCategorias.filter(
    cat => cat.tipoPermitido === tipoRecorrencia || cat.tipoPermitido === 'Ambos'
  );

  useEffect(() => {
    if (visible) {
      if (editingRecorrencia) {
        form.setFieldsValue({
          ...editingRecorrencia,
          startDate: editingRecorrencia.startDate ? dayjs(editingRecorrencia.startDate) : null,
          endDate: editingRecorrencia.endDate ? dayjs(editingRecorrencia.endDate) : null,
          // valor já deve ser número
        });
        setTipoRecorrencia(editingRecorrencia.tipo || 'Despesa');
        setFrequencia(editingRecorrencia.frequency || 'monthly');
      } else {
        form.resetFields();
        setTipoRecorrencia('Despesa');
        setFrequencia('monthly');
        form.setFieldsValue({
          tipo: 'Despesa',
          frequency: 'monthly',
          startDate: dayjs().add(1, 'day'), // Sugere o próximo dia como início
          autoCreateTransaction: true,
          interval: 1,
        });
      }
    }
  }, [visible, editingRecorrencia, form]);

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        const recorrenciaData = {
          ...values,
          financialAccountId: currentProfile?.id,
          startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
          endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
          tipo: tipoRecorrencia, // Pegar do estado, pois o Radio.Group do form pode não atualizar a tempo
          // nextDueDate: PRECISA SER CALCULADO NO BACKEND/SERVICE com base nos outros campos
        };
        onOk(recorrenciaData);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleTipoChange = (e) => {
    setTipoRecorrencia(e.target.value);
    form.setFieldsValue({ categoriaId: undefined }); // Reseta categoria ao mudar tipo
  };

  const handleFrequenciaChange = (value) => {
    setFrequencia(value);
    // Resetar campos específicos de frequência se necessário
    if (value !== 'weekly' && value !== 'bi-weekly') {
      form.setFieldsValue({ dayOfWeek: undefined });
    }
    if (value !== 'monthly' && value !== 'quarterly' && value !== 'semi-annually') {
      form.setFieldsValue({ dayOfMonth: undefined });
    }
  };

  return (
    <Modal
      title={editingRecorrencia ? "Editar Regra de Recorrência" : "Criar Nova Recorrência"}
      open={visible}
      onCancel={onCancel}
      destroyOnHidden
      afterClose={() => {
        form.resetFields();
        setTipoRecorrencia('Despesa');
        setFrequencia('monthly');
      }}
      width={650} // Modal um pouco maior
      footer={[
        <Button key="back" onClick={onCancel} className="modal-btn-cancel">
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk} className="modal-btn-submit neutral" icon={<RetweetOutlined />}>
          {editingRecorrencia ? "Salvar Recorrência" : "Criar Recorrência"}
        </Button>,
      ]}
      className="modal-nova-recorrencia"
    >
      <Form form={form} layout="vertical" name="form_in_modal_recorrencia">
        <Form.Item
          name="description"
          label="Descrição da Recorrência"
          rules={[{ required: true, message: 'Por favor, insira a descrição!' }]}
        >
          <Input placeholder="Ex: Assinatura Mensal Spotify, Salário da Empresa" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="tipo" // Nome do campo no formulário
              label="Tipo"
              rules={[{ required: true, message: 'Selecione o tipo!' }]}
            >
              <Radio.Group onChange={handleTipoChange} value={tipoRecorrencia}>
                <Radio.Button value="Receita">Receita</Radio.Button>
                <Radio.Button value="Despesa">Despesa</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="value"
              label="Valor (R$)"
              rules={[{ required: true, message: 'Insira o valor!' }, { type: 'number', min: 0.01 }]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} precision={2} decimalSeparator="," addonBefore="R$" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="financialCategoryId"
          label="Categoria"
          rules={[{ required: true, message: 'Selecione uma categoria!' }]}
        >
          <Select placeholder="Selecione a categoria">
            {categoriasFiltradas.map(cat => (
              <Option key={cat.id} value={cat.id}>{cat.nome}</Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Detalhes da Recorrência</Divider>

        <Row gutter={16}>
            <Col xs={24} sm={12}>
                <Form.Item
                    name="frequency"
                    label="Frequência"
                    rules={[{ required: true, message: 'Selecione a frequência!' }]}
                >
                    <Select placeholder="Com que frequência isso ocorre?" onChange={handleFrequenciaChange}>
                        <Option value="daily">Diária</Option>
                        <Option value="weekly">Semanal</Option>
                        <Option value="bi-weekly">Quinzenal</Option>
                        <Option value="monthly">Mensal</Option>
                        <Option value="quarterly">Trimestral</Option>
                        <Option value="semi-annually">Semestral</Option>
                        <Option value="annually">Anual</Option>
                    </Select>
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                 <Form.Item
                    name="interval"
                    label="Repetir a cada"
                    tooltip="Ex: a cada 1 semana, a cada 2 meses."
                    rules={[{ required: true, message: 'Informe o intervalo!'}]}
                >
                    <InputNumber min={1} style={{ width: '100%' }} addonAfter={frequencia ? frequencia.replace(/ly$/, '(s)') : 'vez(es)'} />
                </Form.Item>
            </Col>
        </Row>
        
        {(frequencia === 'weekly' || frequencia === 'bi-weekly') && (
            <Form.Item name="dayOfWeek" label="Dia da Semana">
                <Select placeholder="Selecione o dia da semana">
                    {diasDaSemana.map(dia => <Option key={dia.value} value={dia.value}>{dia.label}</Option>)}
                </Select>
            </Form.Item>
        )}
        {(frequencia === 'monthly' || frequencia === 'quarterly' || frequencia === 'semi-annually') && (
            <Form.Item name="dayOfMonth" label="Dia do Mês">
                <InputNumber min={1} max={31} style={{width: '100%'}} placeholder="Ex: 5 (para dia 5), 31 (para último dia, se aplicável)"/>
                 <Text type="secondary" style={{fontSize: 12}}>Para "último dia do mês", insira 31. O sistema ajustará.</Text>
            </Form.Item>
        )}

        <Row gutter={16}>
            <Col xs={24} sm={12}>
                <Form.Item
                    name="startDate"
                    label="Data de Início da Recorrência"
                    rules={[{ required: true, message: 'Selecione a data de início!' }]}
                >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Primeira ocorrência" />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item name="endDate" label="Data de Término (Opcional)">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Deixar em branco se não houver fim" />
                </Form.Item>
            </Col>
        </Row>
        
        <Form.Item name="autoCreateTransaction" valuePropName="checked">
            <Checkbox>
                Gerar transação automaticamente no vencimento
                <Tooltip title="Se desmarcado, será criado apenas um lembrete/compromisso.">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: 'var(--map-cinza-texto)' }} />
                </Tooltip>
            </Checkbox>
        </Form.Item>

        <Form.Item name="notes" label="Observações (Opcional)">
          <Input.TextArea rows={2} placeholder="Detalhes adicionais sobre esta recorrência" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalNovaRecorrencia;