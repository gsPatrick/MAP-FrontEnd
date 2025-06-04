// src/modals/ModalBusinessClientForm/ModalBusinessClientForm.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, Button, Row, Col, message } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, LinkOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const ModalBusinessClientForm = ({ open, onCancel, onFinish, initialValues, loading }) => {
  const [form] = Form.useForm();

  // Atualiza os campos do formulário quando o modal é aberto ou initialValues mudam
  useEffect(() => {
    if (open) {
      form.resetFields(); // Reseta os campos
      if (initialValues) {
        // Popula os campos com os dados do cliente para edição
        form.setFieldsValue({
          ...initialValues,
          isActive: initialValues.isActive !== undefined ? initialValues.isActive : true, // Default para ativo na edição se não especificado
        });
      } else {
         // Define defaults para criação
         form.setFieldsValue({
             isActive: true // Novo cliente começa ativo por padrão
         });
      }
    }
  }, [open, initialValues, form]); // Adicionado form como dependência

  const handleFinish = (values) => {
    // Passa os valores do formulário para a função onFinish no componente pai
    onFinish(values);
  };

  return (
    <Modal
      title={initialValues ? "Editar Cliente de Negócio" : "Novo Cliente de Negócio"}
      open={open}
      onCancel={onCancel}
      footer={null} // Remove footer padrão para usar botões do form
      destroyOnClose // Destrói o formulário ao fechar para resetar o estado
      width={600}
      className="business-client-modal" // Classe para estilização
      confirmLoading={loading} // Prop para loading no modal (embora usemos loading no botão)
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} disabled={loading}> {/* Desabilita form enquanto salva */}
        <Form.Item
          name="name"
          label="Nome do Cliente"
          rules={[{ required: true, message: 'Por favor, insira o nome do cliente!' }]}
        >
          <Input placeholder="Ex: João da Silva, Empresa Y Ltda." prefix={<UserOutlined />} />
        </Form.Item>

        <Row gutter={16}>
            <Col xs={24} sm={12}>
                <Form.Item
                  name="phone"
                  label="Telefone (Opcional)"
                  rules={[{ pattern: /^\+?[0-9\s()-]*$/, message: 'Formato de telefone inválido', validateTrigger: 'onSubmit' }]} // Validação simples
                >
                  <Input placeholder="Ex: +55 11 98765-4321" prefix={<PhoneOutlined />} />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                 <Form.Item
                  name="email"
                  label="Email (Opcional)"
                  rules={[{ type: 'email', message: 'Email inválido', validateTrigger: 'onSubmit' }]}
                >
                  <Input placeholder="Ex: contato@cliente.com" prefix={<MailOutlined />} />
                </Form.Item>
            </Col>
        </Row>

        <Form.Item
          name="photoUrl"
          label="URL da Foto (Opcional)"
          rules={[{ type: 'url', message: 'URL inválida', validateTrigger: 'onSubmit' }]}
        >
          <Input placeholder="Ex: https://imagem.com/foto.jpg" prefix={<LinkOutlined />} />
        </Form.Item>

        <Form.Item name="notes" label="Notas (Opcional)">
          <TextArea rows={3} placeholder="Detalhes adicionais sobre o cliente..." />
        </Form.Item>

        <Form.Item name="isActive" label="Cliente Ativo" valuePropName="checked">
          <Switch checkedChildren="Sim" unCheckedChildren="Não" />
        </Form.Item>


        <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? "Salvar Alterações" : "Criar Cliente"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalBusinessClientForm;