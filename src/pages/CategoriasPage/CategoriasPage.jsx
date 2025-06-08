import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Button, Row, Col, Card, Modal, Form, Input,
  Empty, Tooltip, Popconfirm, message, Space, Avatar, Result, Tag, Layout
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined
} from '@ant-design/icons';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// As importações de Layout, HeaderPanel e SidebarPanel foram removidas.
// import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
// import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';

import './CategoriasPage.css';

const { Content } = Layout; // A importação de Layout do antd é mantida apenas para usar o Content.
const { Title, Paragraph, Text } = Typography;

const CategoriasPage = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  // O estado 'sidebarCollapsed' e a variável 'userNameForHeader' foram removidos.

  const [categorias, setCategorias] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [form] = Form.useForm();

  const fetchCategorias = async () => {
    if (!currentProfile?.id) {
      setCategorias([]);
      setLoadingCategories(false);
      return;
    }
    setLoadingCategories(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/categories?hierarchical=false`);
      if (response.data && response.data.status === 'success') {
        setCategorias(response.data.data.map(cat => ({ ...cat, key: cat.id })) || []);
      } else {
        setCategorias([]);
        message.error(response.data?.message || "Falha ao buscar categorias.");
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      setCategorias([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      fetchCategorias();
    } else if (!loadingProfiles && !isAuthenticated) {
        setLoadingCategories(false);
        setCategorias([]);
    }
  }, [currentProfile, loadingProfiles, isAuthenticated]);

  const showModal = (categoria = null) => {
    setEditingCategoria(categoria);
    if (categoria) {
      form.setFieldsValue({
        name: categoria.name,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingCategoria(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values) => {
    if (!currentProfile?.id) {
      message.error("Perfil não selecionado. Não é possível salvar a categoria.");
      return;
    }
    // ALTERAÇÃO 1: Removido o campo 'type' do payload. O backend não o utiliza mais.
    const payload = {
      name: values.name,
      parentId: null, // Mantido, pois o UI atual cria apenas categorias raiz.
    };

    try {
      if (editingCategoria) {
        // Para edição, o payload também não precisa mais do 'type'.
        await apiClient.put(`/financial-accounts/${currentProfile.id}/categories/${editingCategoria.id}`, { name: values.name });
        message.success(`Categoria "${payload.name}" atualizada com sucesso!`);
      } else {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/categories`, payload);
        message.success(`Categoria "${payload.name}" criada com sucesso!`);
      }
      fetchCategorias();
      handleCancelModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erro ao salvar categoria.";
      message.error(errorMessage);
      console.error("Erro ao salvar categoria:", error);
    }
  };

  const handleDeleteCategoria = async (categoria) => {
    if (!currentProfile?.id) return;
    const params = {
        actionForSubcategories: 'restrict',
        actionForTransactions: 'set_null'
    };
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/categories/${categoria.id}`, { params });
      message.warn(`Categoria "${categoria.name}" foi excluída.`);
      fetchCategorias();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erro ao excluir categoria.";
      message.error(errorMessage);
      console.error("Erro ao excluir categoria:", error);
    }
  };

  // Os blocos de retorno condicional foram simplificados para retornar apenas o conteúdo
  // que será renderizado dentro do <Outlet> do novo PainelLayout.
  if (loadingProfiles) {
    return (
      <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
          <TagsOutlined style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>
      </Content>
    );
  }
  if (!isAuthenticated && !loadingProfiles) {
    return <Result status="403" title="Acesso Negado" subTitle="Você precisa estar logado para ver esta página." extra={<Button type="primary" href="/login">Fazer Login</Button>} />;
  }
  if (!currentProfile && isAuthenticated && !loadingProfiles) {
    return <Result status="warning" title="Nenhum Perfil Selecionado" subTitle="Por favor, selecione ou crie um perfil financeiro em 'Meu Perfil' para gerenciar categorias." extra={<Button type="primary" href="/painel/meu-perfil">Ir para Meu Perfil</Button>} />;
  }

  // O retorno principal agora só contém o <Content> da página.
  return (
    <Content className="panel-content-area categorias-content">
      <Row justify="space-between" align="middle" className="page-header-categorias">
        <Col>
          <Title level={2} className="page-title-categorias">Minhas Categorias</Title>
          <Paragraph className="page-subtitle-categorias">
            Gerencie as categorias para o perfil <Text strong>{currentProfile?.name || 'N/D'}</Text>.
          </Paragraph>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => showModal()}
            className="btn-nova-categoria"
            disabled={!currentProfile?.id || loadingCategories}
          >
            Nova Categoria
          </Button>
        </Col>
      </Row>

      {loadingCategories ? (
        <div style={{textAlign: 'center', marginTop: '50px'}}><TagsOutlined style={{fontSize: '48px', color: 'var(--map-laranja)'}} spin/> <Title level={4}>Carregando categorias...</Title></div>
      ) : categorias.length > 0 ? (
        <Row gutter={[20, 20]} className="categorias-card-list">
          {categorias.map(cat => (
            <Col xs={24} sm={12} md={8} lg={6} key={cat.id}>
              <Card 
                hoverable 
                className="categoria-item-card"
                actions={[
                  <Tooltip title="Editar Categoria" key="edit">
                    <EditOutlined onClick={() => showModal(cat)} style={{color: 'var(--map-dourado)'}}/>
                  </Tooltip>,
                  <Popconfirm
                    key={`delete-${cat.id}`}
                    title={<Text>Excluir "<Text strong>{cat.name}</Text>"?</Text>}
                    description="Transações associadas ficarão sem categoria. Continuar?"
                    onConfirm={() => handleDeleteCategoria(cat)}
                    okText="Sim, Excluir"
                    cancelText="Não"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="Excluir Categoria">
                      <DeleteOutlined style={{color: 'var(--map-vermelho-escuro)'}}/>
                    </Tooltip>
                  </Popconfirm>
                ]}
              >
                <Card.Meta
                  // ALTERAÇÃO 2: Removida a classe dinâmica baseada em 'type'.
                  avatar={<Avatar icon={<TagsOutlined />} className="categoria-card-avatar" />}
                  title={<Text className="categoria-card-nome" ellipsis={{tooltip: cat.name}}>{cat.name}</Text>}
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Result
            icon={<TagsOutlined style={{fontSize: '64px', color: 'var(--map-cinza-texto)'}}/>}
            title={`Nenhuma categoria cadastrada para ${currentProfile?.name || 'este perfil'}`}
            subTitle='Clique em "Nova Categoria" para começar a organizar suas transações!'
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} className="btn-nova-categoria" disabled={!currentProfile?.id}>
                    Criar Primeira Categoria
                </Button>
            }
            style={{marginTop: '30px'}}
        />
      )}

      <Modal
         title={editingCategoria ? "Editar Categoria" : "Nova Categoria"}
         open={isModalVisible}
         onCancel={handleCancelModal}
         footer={null}
         destroyOnClose
         className="categoria-modal"
         width={400}
       >
         <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
                name="name"
                label="Nome da Categoria"
                rules={[
                    { required: true, message: 'O nome da categoria é obrigatório!' },
                    { min: 2, message: 'O nome deve ter pelo menos 2 caracteres.'}
                ]}
            >
                <Input placeholder="Ex: Alimentação, Salário, Transporte" />
            </Form.Item>
            
            <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
                <Button onClick={handleCancelModal} style={{ marginRight: 8 }} className="cancel-btn-form">
                    Cancelar
                </Button>
                <Button type="primary" htmlType="submit" className="submit-btn-form modal-submit-btn">
                    {editingCategoria ? "Salvar Nome" : "Criar Categoria"}
                </Button>
            </Form.Item>
         </Form>
       </Modal>
    </Content>
  );
};

export default CategoriasPage;