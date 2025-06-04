import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Space, Radio, InputNumber, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { CalendarOutlined, DollarCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const ModalNovoCompromisso = ({ visible, onCancel, onOk, currentProfile, editingAppointment }) => {
  const [form] = Form.useForm();
  const [prazoTipo, setPrazoTipo] = useState('data');
  const [isFinanceiro, setIsFinanceiro] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (editingAppointment) {
        const isApptFinanceiro = editingAppointment.associatedValue !== null && editingAppointment.associatedValue !== undefined;
        setIsFinanceiro(isApptFinanceiro);
        setPrazoTipo('data'); 

        form.setFieldsValue({
          titulo: editingAppointment.title,
          prazoDatePicker: editingAppointment.eventDateTime ? dayjs(editingAppointment.eventDateTime) : dayjs().add(1, 'hour'),
          // Prazo relativo não é preenchido na edição, força data específica
          tipoAgendamento: isApptFinanceiro ? 'Financeiro' : 'Geral',
          valor: isApptFinanceiro ? editingAppointment.associatedValue : undefined,
          tipoValor: isApptFinanceiro ? editingAppointment.associatedTransactionType : undefined,
          notes: editingAppointment.notes,
          location: editingAppointment.location,
          durationMinutes: editingAppointment.durationMinutes,
        });
      } else {
        setPrazoTipo('data');
        setIsFinanceiro(false);
        form.setFieldsValue({
          tipoAgendamento: 'Geral',
          prazoDatePicker: dayjs().add(1, 'hour'), // Nome do campo para DatePicker
        });
      }
    }
  }, [visible, editingAppointment, form]);


  const handleOk = () => {
    form.validateFields()
      .then(values => {
        let prazoFinalISO;
        if (prazoTipo === 'data' && values.prazoDatePicker) { // Usar o nome do campo do DatePicker
          prazoFinalISO = values.prazoDatePicker.toISOString();
        } else if (prazoTipo === 'relativo' && values.prazoRelativoValor && values.prazoRelativoUnidade) {
          prazoFinalISO = dayjs().add(values.prazoRelativoValor, values.prazoRelativoUnidade).toISOString();
        } else if (editingAppointment && editingAppointment.eventDateTime && prazoTipo === 'data' && !values.prazoDatePicker){
            // Caso de edição onde a data não foi alterada e era específica
            prazoFinalISO = dayjs(editingAppointment.eventDateTime).toISOString();
        }
        else {
          message.error('Prazo não definido corretamente.'); // Exibir mensagem de erro
          return;
        }
        
        const dataToSend = {
          ...values,
          prazo: prazoFinalISO, // Este campo 'prazo' será usado por handleAddGeneric
          // Os campos 'valor' e 'tipoValor' do formulário já estão em 'values'
          // tipoAgendamento é apenas de controle do modal.
          // 'titulo' já está em 'values'
        };
        // Remover campos de controle do prazo relativo se não forem usados
        if (prazoTipo !== 'relativo') {
            delete dataToSend.prazoRelativoValor;
            delete dataToSend.prazoRelativoUnidade;
        }
        delete dataToSend.prazoDatePicker; // Remover o campo específico do DatePicker
        delete dataToSend.tipoAgendamento; // Remover controle do modal

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

  const renderPrazoRelativoForm = () => (
    <Space>
      <Form.Item name="prazoRelativoValor" noStyle rules={prazoTipo === 'relativo' ? [{ required: true, message: 'Valor!' }] : []}>
        <InputNumber style={{ width: 100 }} placeholder="Quantidade" min={1} />
      </Form.Item>
      <Form.Item name="prazoRelativoUnidade" noStyle rules={prazoTipo === 'relativo' ? [{ required: true, message: 'Unidade!' }] : []}>
        <Select style={{ width: 120 }} placeholder="Unidade">
          <Option value="hours">Horas</Option>
          <Option value="days">Dias</Option>
          <Option value="weeks">Semanas</Option>
          <Option value="months">Meses</Option>
        </Select>
      </Form.Item>
    </Space>
  );

  return (
    <Modal
      title={editingAppointment ? "Editar Compromisso" : "Criar Novo Compromisso/Lembrete"}
      open={visible}
      onCancel={handleCancelModal}
      destroyOnHidden
      afterClose={() => {
        form.resetFields();
        setPrazoTipo('data');
        setIsFinanceiro(false);
      }}
      footer={[
        <Button key="back" onClick={handleCancelModal} className="modal-btn-cancel">
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk} className="modal-btn-submit neutral">
          {editingAppointment ? "Salvar Alterações" : "Criar Compromisso"}
        </Button>,
      ]}
      className="modal-novo-compromisso"
      width={600}
    >
      <Form form={form} layout="vertical" name="form_in_modal_compromisso">
        <Form.Item
          name="titulo"
          label="Título do Compromisso/Lembrete"
          rules={[{ required: true, message: 'Por favor, insira um título!' }]}
        >
          <Input placeholder="Ex: Reunião de Planejamento, Pagar aluguel" />
        </Form.Item>

        <Form.Item label="Definir Prazo Como:">
            <Radio.Group onChange={(e) => setPrazoTipo(e.target.value)} value={prazoTipo}>
                <Radio.Button value="data">Data Específica</Radio.Button>
                <Radio.Button value="relativo">Relativo a Agora</Radio.Button>
            </Radio.Group>
        </Form.Item>

        {prazoTipo === 'data' && (
            <Form.Item
                name="prazoDatePicker" // Nome específico para o DatePicker
                label="Data e Hora do Compromisso"
                rules={prazoTipo === 'data' ? [{ required: true, message: 'Selecione data e hora!' }] : []}
            >
                <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
                placeholder="Selecione data e hora"
                />
            </Form.Item>
        )}
        {prazoTipo === 'relativo' && (
             <Form.Item label="Prazo Relativo a Partir de Agora">
                {renderPrazoRelativoForm()}
             </Form.Item>
        )}
        
        <Form.Item name="tipoAgendamento" label="Tipo de Lembrete">
            <Radio.Group value={isFinanceiro ? 'Financeiro' : 'Geral'} onChange={(e) => setIsFinanceiro(e.target.value === 'Financeiro')}>
                <Radio.Button value="Geral"><CalendarOutlined/> Lembrete Geral</Radio.Button>
                <Radio.Button value="Financeiro"><DollarCircleOutlined /> Lembrete Financeiro</Radio.Button>
            </Radio.Group>
        </Form.Item>

        {isFinanceiro && (
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                  name="valor"
                  label="Valor Associado (R$)"
                  rules={[{ required: isFinanceiro, message: 'Informe o valor!' }, { type: 'number', min: 0.01 }]}
              >
                  <InputNumber style={{ width: '100%' }} min={0.01} precision={2} placeholder="Ex: 250,75" addonBefore="R$"/>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                  name="tipoValor"
                  label="Natureza do Valor"
                  rules={[{ required: isFinanceiro, message: 'Informe a natureza do valor!' }]}
              >
                  <Select placeholder="É uma entrada ou uma saída?">
                      <Option value="Entrada">Entrada (A Receber)</Option>
                      <Option value="Saída">Saída (A Pagar)</Option>
                  </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
            <Col xs={24} sm={12}>
                <Form.Item name="location" label="Local (Opcional)">
                    <Input placeholder="Ex: Sala de Reuniões B, Online (Zoom)"/>
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item name="durationMinutes" label="Duração (minutos, opcional)">
                    <InputNumber min={1} style={{width: '100%'}} placeholder="Ex: 60"/>
                </Form.Item>
            </Col>
        </Row>

        <Form.Item
          name="notes"
          label="Observações (Opcional)"
        >
          <Input.TextArea rows={2} placeholder="Detalhes adicionais, link para reunião, etc." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalNovoCompromisso;