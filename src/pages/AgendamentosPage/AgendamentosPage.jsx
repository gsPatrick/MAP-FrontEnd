// src/pages/AgendamentosPage/AgendamentosPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Typography, Button, Modal, Form, Input, DatePicker, Select,
  List, Card, Space, Tooltip, Popconfirm, message, Tag, Row, Col,
  Empty, ConfigProvider, Avatar, InputNumber, Radio, Spin 
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CalendarOutlined, DollarCircleOutlined,
  InfoCircleOutlined, UserOutlined, ShopOutlined, CalendarFilled,
  TeamOutlined, MailOutlined, PhoneOutlined, ProfileOutlined, LoadingOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/pt-br';
import ptBR from 'antd/lib/locale/pt_BR';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// REMOVIDO: HeaderPanel e SidebarPanel
// import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
// import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';

import './AgendamentosPage.css'; 

moment.locale('pt-br');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const AgendamentosPage = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  // REMOVIDO: Estado do sidebar
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userNameForHeader = currentProfile?.ownerClientName || currentProfile?.name || "Usuário Agendamentos";

  const [agendamentos, setAgendamentos] = useState([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState(null);
  const [form] = Form.useForm();
  const [prazoTipoModal, setPrazoTipoModal] = useState('data');

  const [businessClientsList, setBusinessClientsList] = useState([]); 
  const [loadingBusinessClients, setLoadingBusinessClients] = useState(false); 
  const isBusinessProfile = useMemo(() => ['PJ', 'MEI'].includes(currentProfile?.type), [currentProfile]);

  const [isClientDetailsModalVisible, setIsClientDetailsModalVisible] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);


  const fetchAgendamentos = async () => {
    if (!currentProfile || !isAuthenticated) {
      setAgendamentos([]);
      setLoadingAgendamentos(false);
      return;
    }
    setLoadingAgendamentos(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments`, {
        params: {
          sortBy: 'eventDateTime',
          sortOrder: 'ASC',
          limit: 200 
        }
      });
      if (response.data && response.data.status === 'success') {
        const mappedAgendamentos = response.data.data.map(app => ({
            id: app.id.toString(),
            financialAccountId: app.financialAccountId,
            titulo: app.title,
            prazo: app.eventDateTime,
            tipo: (app.associatedValue !== null && app.associatedValue !== undefined) ? 'Financeiro' : 'Geral',
            valor: app.associatedValue,
            tipoValorAssociado: app.associatedTransactionType,
            concluido: app.status === 'Completed',
            statusOriginal: app.status,
            notas: app.description || app.notes,
            businessClients: (app.businessClients || []).map(bc => ({
                id: bc.id.toString(),
                name: bc.name,
                email: bc.email, // <<< Garantir que API retorna email
                phone: bc.phone, // <<< Garantir que API retorna phone
                notes: bc.notes, // <<< Garantir que API retorna notes
                photoUrl: bc.photoUrl // <<< Garantir que API retorna photoUrl
            })),
        }));
        setAgendamentos(mappedAgendamentos);
      } else {
        setAgendamentos([]);
        message.error(response.data?.message || "Falha ao carregar agendamentos.");
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      setAgendamentos([]);
    } finally {
      setLoadingAgendamentos(false);
    }
  };

  const fetchBusinessClientsForSelect = async () => {
      if (!currentProfile || !isBusinessProfile) {
          setBusinessClientsList([]);
          return;
      }
      setLoadingBusinessClients(true);
      try {
          const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`, {
               params: {
                  isActive: true, 
                  limit: 500 
               }
          });
           if (response.data && response.data.status === 'success') {
               const options = response.data.data.map(client => ({
                   value: client.id.toString(), 
                   label: client.name,
                   photoUrl: client.photoUrl // Essencial para Avatar
               }));
               setBusinessClientsList(options);
           } else {
               setBusinessClientsList([]);
               console.error("Falha ao carregar clientes de negócio para o Select:", response.data?.message);
           }
      } catch (error) {
          console.error("Erro ao carregar clientes de negócio para o Select:", error);
          setBusinessClientsList([]);
      } finally {
          setLoadingBusinessClients(false);
      }
  }


  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      fetchAgendamentos();
      if (isBusinessProfile) {
          fetchBusinessClientsForSelect();
      } else {
          setBusinessClientsList([]);
      }
    } else if (!isAuthenticated && !loadingProfiles) {
        setAgendamentos([]);
        setLoadingAgendamentos(false);
        setBusinessClientsList([]);
    } else if (currentProfile && !isBusinessProfile && !loadingProfiles) {
         fetchAgendamentos();
         setBusinessClientsList([]);
    }
  }, [currentProfile, isAuthenticated, loadingProfiles, isBusinessProfile]);

  const showModal = (agendamento = null) => {
    setEditingAgendamento(agendamento);
    form.resetFields();
    setPrazoTipoModal('data'); 

    if (agendamento) {
      form.setFieldsValue({
        titulo: agendamento.titulo,
        prazoPicker: agendamento.prazo ? moment(agendamento.prazo) : null,
        descricaoAgendamento: agendamento.notas,
        businessClientIds: agendamento.businessClients ? agendamento.businessClients.map(client => client.id.toString()) : [],
      });
       if (agendamento.prazo && moment(agendamento.prazo).isBefore(moment())) {
           setPrazoTipoModal('data'); 
       }
    } else {
      form.setFieldsValue({
        prazoPicker: moment().add(1, 'hour'), 
        businessClientIds: [], 
      });
       setPrazoTipoModal('data'); 
    }
    setIsModalVisible(true);
    if (isBusinessProfile && businessClientsList.length === 0 && !loadingBusinessClients) {
        fetchBusinessClientsForSelect();
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingAgendamento(null);
    form.resetFields();
  };

  const onFinishModal = async (values) => {
    if (!currentProfile) {
        message.error("Perfil não selecionado.");
        return;
    }

    let eventDateTimeISO;
     if (prazoTipoModal === 'data') {
        if (!values.prazoPicker) { message.error('Por favor, selecione uma Data e Hora para o prazo.'); return; }
        eventDateTimeISO = values.prazoPicker.toISOString();
     } else if (prazoTipoModal === 'relativo') {
         if (!values.prazoRelativoValor || !values.prazoRelativoUnidade) { message.error('Defina Valor e Unidade para o prazo relativo.'); return; }
         if (values.prazoRelativoValor <= 0) { message.error('O valor do prazo relativo deve ser maior que zero.'); return; }
         eventDateTimeISO = moment().add(values.prazoRelativoValor, values.prazoRelativoUnidade).toISOString();
     } else { message.error('Tipo de prazo inválido.'); return; }

    const appointmentDataPayload = {
      title: values.titulo,
      eventDateTime: eventDateTimeISO,
      description: values.descricaoAgendamento,
      businessClientIds: isBusinessProfile && values.businessClientIds ? values.businessClientIds.map(id => parseInt(id, 10)) : [],
    };

    setLoadingAgendamentos(true);
    try {
      if (editingAgendamento) {
        await apiClient.put(`/financial-accounts/${currentProfile.id}/appointments/${editingAgendamento.id}`, appointmentDataPayload);
        message.success(`Agendamento "${appointmentDataPayload.title}" atualizado!`);
      } else {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/appointments`, appointmentDataPayload);
        message.success(`Agendamento "${appointmentDataPayload.title}" criado para ${currentProfile.name}!`);
      }
      fetchAgendamentos(); 
      handleCancel(); 
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
    } finally {
      setLoadingAgendamentos(false);
    }
  };

  const handleDelete = async (id) => {
    if (!currentProfile) return;
    const agendamentoParaExcluir = agendamentos.find(item => item.id === id);
     if (!agendamentoParaExcluir) return;

    setLoadingAgendamentos(true);
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/appointments/${id}`);
      message.warn(`Agendamento "${agendamentoParaExcluir.titulo}" excluído!`);
      fetchAgendamentos(); 
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
    } finally {
      setLoadingAgendamentos(false);
    }
  };

  const toggleConcluido = async (id) => {
    if (!currentProfile) return;
    const agendamento = agendamentos.find(item => item.id === id);
    if (!agendamento) return;

    const novoStatus = agendamento.concluido ? 'Scheduled' : 'Completed';
    setLoadingAgendamentos(true);
    try {
      await apiClient.put(`/financial-accounts/${currentProfile.id}/appointments/${id}`, { status: novoStatus });
      message.info(`Agendamento "${agendamento.titulo}" marcado como ${novoStatus === 'Completed' ? 'concluído' : 'pendente'}.`);
      fetchAgendamentos(); 
    } catch (error) {
      console.error("Erro ao alterar status do agendamento:", error);
    } finally {
      setLoadingAgendamentos(false);
    }
  };

  const sortedAgendamentos = useMemo(() =>
    [...agendamentos].sort((a, b) => moment(a.prazo).diff(moment(b.prazo)))
  , [agendamentos]);

  const renderPrazoRelativoFormModal = () => (
    <Space>
      <Form.Item name="prazoRelativoValor" noStyle rules={prazoTipoModal === 'relativo' ? [{ required: true, message: 'Valor!' }] : []}>
        <InputNumber min={1} style={{ width: 80 }} placeholder="Valor" />
      </Form.Item>
      <Form.Item name="prazoRelativoUnidade" noStyle rules={prazoTipoModal === 'relativo' ? [{ required: true, message: 'Unid.!' }] : []}>
        <Select style={{ width: 120 }} placeholder="Unidade">
          <Option value="hours">Horas</Option>
          <Option value="days">Dias</Option>
          <Option value="weeks">Semanas</Option>
          <Option value="months">Meses</Option>
        </Select>
      </Form.Item>
    </Space>
  );

  const showClientDetailsModal = (client) => {
    // Garante que o objeto 'client' que é passado para o estado tenha todos os campos necessários
    const clientDetails = {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
        photoUrl: client.photoUrl,
    };
    setSelectedClientForDetails(clientDetails);
    setIsClientDetailsModalVisible(true);
  };
  const handleClientDetailsModalCancel = () => {
    setIsClientDetailsModalVisible(false);
    setSelectedClientForDetails(null);
  };

  const renderAgendamentoItem = (item) => (
    <List.Item
      className={`agendamento-item ${item.concluido ? 'concluido' : ''} tipo-${item.valor ? 'financeiro' : 'geral'}`}
      actions={[
        <Tooltip title={item.concluido ? "Marcar como Pendente" : "Marcar como Concluído"} key={`action-concluir-${item.id}`}>
          <Button
            type="text" shape="circle"
            icon={<CheckCircleOutlined style={{ color: item.concluido ? 'var(--ant-success-color)' : undefined }} />}
            onClick={() => toggleConcluido(item.id)} className="action-btn-concluir"
            disabled={loadingAgendamentos}
          />
        </Tooltip>,
        <Tooltip title="Editar Agendamento" key={`action-editar-${item.id}`}>
          <Button type="text" shape="circle" icon={<EditOutlined />} onClick={() => showModal(item)} className="action-btn-editar" disabled={loadingAgendamentos}/>
        </Tooltip>,
        <Popconfirm
          key={`action-excluir-${item.id}`} title="Tem certeza que deseja excluir?"
          onConfirm={() => handleDelete(item.id)} okText="Sim" cancelText="Não" placement="topRight"
        >
          <Tooltip title="Excluir Agendamento">
            <Button type="text" shape="circle" danger icon={<DeleteOutlined />} className="action-btn-excluir" disabled={loadingAgendamentos}/>
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <List.Item.Meta
        avatar={
            <Avatar
                src={item.photoUrl} // Avatar do agendamento em si, se houver
                icon={!item.photoUrl && (item.valor ? <DollarCircleOutlined /> : <CalendarOutlined />)}
                className={`avatar-tipo-${item.valor ? 'financeiro' : 'geral'}`}
            />
        }
        title={<Text strong className="agendamento-titulo">{item.titulo}</Text>}
        description={
          <>
            <Tag icon={<ClockCircleOutlined />} color={moment(item.prazo).isBefore(moment()) && !item.concluido ? "volcano" : "blue"}>
              {moment(item.prazo).format('DD/MM/YYYY HH:mm')} ({moment(item.prazo).fromNow()})
            </Tag>
            {item.valor !== null && item.valor !== undefined && (
              <Tag color={item.tipoValorAssociado === 'Entrada' ? "green" : "purple"} icon={<DollarCircleOutlined />}>
                R$ {parseFloat(item.valor).toFixed(2)} {item.tipoValorAssociado ? `(${item.tipoValorAssociado})` : ''}
              </Tag>
            )}

            {isBusinessProfile && item.businessClients && item.businessClients.length > 0 && (
                <div className="associated-business-clients-list-item">
                     <Avatar.Group 
                        maxCount={item.businessClients.length > 3 ? 2 : 3} // Mostra até 2 se mais de 3, senão até 3
                        size="small" 
                        maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf', cursor: 'pointer' }}
                     >
                         {item.businessClients.map(client => (
                            <Tooltip title={`Ver detalhes de ${client.name}`} key={client.id}>
                                <Avatar 
                                    src={client.photoUrl} 
                                    icon={!client.photoUrl && <UserOutlined />} 
                                    onClick={() => showClientDetailsModal(client)} 
                                    className="associated-client-avatar-in-list"
                                />
                            </Tooltip>
                         ))}
                    </Avatar.Group>
                     {item.businessClients.length > (item.businessClients.length > 3 ? 2 : 3) && (
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                             e +{item.businessClients.length - (item.businessClients.length > 3 ? 2 : 3)}
                        </Text>
                    )}
                </div>
            )}

            {item.notas && <Paragraph ellipsis={{ rows: 1, expandable: true, symbol: 'mais' }} className="agendamento-notas"><InfoCircleOutlined /> {item.notas}</Paragraph>}
          </>
        }
      />
    </List.Item>
  );

  // --- Renderização Principal e de Loading/Erro ---
  if (loadingProfiles || (loadingAgendamentos && isAuthenticated && currentProfile)) {
    return (
        <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
             <Spin indicator={<CalendarFilled style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>}/>
        </Content>
    );
  }

  if (!isAuthenticated && !loadingProfiles) {
    return ( <Content style={{ padding: 50, textAlign: 'center' }}><Title level={3}>Acesso Negado</Title><Paragraph>Você precisa estar logado para acessar esta página.</Paragraph></Content> );
  }

  if (!currentProfile && isAuthenticated && !loadingProfiles) {
    return ( <Content style={{ padding: 50, textAlign: 'center' }}><Title level={3}>Nenhum Perfil Selecionado</Title><Paragraph>Por favor, selecione um perfil financeiro para gerenciar agendamentos.</Paragraph></Content> );
  }

  return (
    <ConfigProvider locale={ptBR}>
      <Content className="agendamentos-page-content">
        <Row justify="space-between" align="middle" className="page-header-agendamentos">
          <Col>
            <Title level={2} className="page-title-agendamentos">Meus Agendamentos</Title>
            <Paragraph className="page-subtitle-agendamentos">
              Organize seus compromissos para o perfil <Text strong>{currentProfile?.name}</Text>.
            </Paragraph>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => showModal()} className="btn-criar-agendamento" loading={loadingAgendamentos} >
              Novo Agendamento
            </Button>
          </Col>
        </Row>

        <Card bordered={false} className="agendamentos-card">
          {sortedAgendamentos.length > 0 ? (
            <List itemLayout="horizontal" dataSource={sortedAgendamentos} renderItem={renderAgendamentoItem} className="agendamentos-list" loading={loadingAgendamentos} />
          ) : (
             <Empty description={loadingAgendamentos ? "Carregando agendamentos..." : `Nenhum agendamento encontrado para ${currentProfile?.name}.`} image={loadingAgendamentos ? <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'var(--map-laranja)' }} spin />} /> : Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Content>

      {/* Modal de Criação/Edição de Agendamento */}
      <Modal
        title={editingAgendamento ? "Editar Agendamento" : "Criar Novo Agendamento/Lembrete"}
        open={isModalVisible} onCancel={handleCancel} footer={null}
        className="agendamento-modal" destroyOnClose width={600}
        confirmLoading={loadingAgendamentos}
      >
        <Form form={form} layout="vertical" onFinish={onFinishModal} disabled={loadingAgendamentos}>
          <Form.Item name="titulo" label="Título do Agendamento/Lembrete" rules={[{ required: true, message: 'Por favor, insira um título!' }]}>
            <Input placeholder="Ex: Reunião com equipe, Pagar conta X" />
          </Form.Item>
          <Form.Item label="Definir Prazo Como:">
              <Radio.Group onChange={(e) => setPrazoTipoModal(e.target.value)} value={prazoTipoModal}>
                  <Radio.Button value="data">Data e Hora Específica</Radio.Button>
                  <Radio.Button value="relativo">Relativo a Agora</Radio.Button>
              </Radio.Group>
          </Form.Item>
          {prazoTipoModal === 'data' && (
              <Form.Item name="prazoPicker" label="Prazo" rules={prazoTipoModal === 'data' ? [{ required: true, message: 'Por favor, selecione o prazo!' }] : []}>
                  <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} placeholder="Selecione data e hora" />
              </Form.Item>
          )}
          {prazoTipoModal === 'relativo' && (
               <Form.Item label="Prazo Relativo" rules={prazoTipoModal === 'relativo' ? [{ required: true, message: 'Por favor, defina um prazo relativo!' }] : []}>
                  {renderPrazoRelativoFormModal()}
               </Form.Item>
          )}

          {isBusinessProfile && (
              <Form.Item
                  name="businessClientIds"
                  label={ <Space> Clientes de Negócio Associados (Opcional) {loadingBusinessClients && <Spin size="small" />} </Space> }
              >
                  <Select
                      mode="multiple" placeholder="Selecione clientes de negócio..." style={{ width: '100%' }}
                      loading={loadingBusinessClients} disabled={loadingBusinessClients} allowClear
                      filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }
                      optionRender={(option) => ( 
                          <Space>
                              <Avatar src={option.data.photoUrl} icon={!option.data.photoUrl && <UserOutlined />} size="small" />
                              {option.data.label}
                          </Space>
                      )}
                      tagRender={({ label, value, closable, onClose }) => {
                          const clientOption = businessClientsList.find(c => c.value === value);
                          return (
                              <Tag closable={closable} onClose={onClose} style={{ marginRight: 3, display: 'flex', alignItems: 'center', padding: '2px 6px' }}>
                                   <Avatar src={clientOption?.photoUrl} icon={!clientOption?.photoUrl && <UserOutlined />} size="small" style={{ marginRight: 5 }} />
                                  {label}
                              </Tag>
                          );
                      }}
                  >
                  {businessClientsList.map(client => ( 
                      <Option key={client.value} value={client.value} label={client.label} data={client}>
                          {client.label} 
                      </Option>
                  ))}
                  </Select>
              </Form.Item>
          )}

          <Form.Item name="descricaoAgendamento" label="Descrição do Agendamento" rules={[{ required: true, message: 'Por favor, insira a descrição do agendamento!' }]}>
            <Input.TextArea rows={3} placeholder="Detalhes sobre o agendamento..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }} className="cancel-btn-form">Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={loadingAgendamentos} className="submit-btn-form">
              {editingAgendamento ? "Salvar Alterações" : "Criar Agendamento"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
          title={
              <Space>
                  <ProfileOutlined /> Detalhes do Cliente: <Text strong>{selectedClientForDetails?.name}</Text>
              </Space>
          }
          open={isClientDetailsModalVisible}
          onCancel={handleClientDetailsModalCancel}
          footer={[ <Button key="close" onClick={handleClientDetailsModalCancel}>Fechar</Button> ]}
          className="client-details-modal-agendamentos" 
      >
          {selectedClientForDetails ? (
              <div className="client-details-content">
                  <Avatar 
                      size={80} // Aumentado para melhor visualização
                      src={selectedClientForDetails.photoUrl} 
                      icon={!selectedClientForDetails.photoUrl && <UserOutlined />} 
                      style={{ marginBottom: 20, border:'2px solid var(--map-laranja-claro)' }} 
                  />
                  <Paragraph><Text strong><UserOutlined /> Nome:</Text> {selectedClientForDetails.name}</Paragraph>
                  {selectedClientForDetails.email && <Paragraph><Text strong><MailOutlined /> Email:</Text> <a href={`mailto:${selectedClientForDetails.email}`}>{selectedClientForDetails.email}</a></Paragraph>}
                  {selectedClientForDetails.phone && <Paragraph><Text strong><PhoneOutlined /> Telefone:</Text> <a href={`tel:${selectedClientForDetails.phone}`}>{selectedClientForDetails.phone}</a></Paragraph>}
                  {selectedClientForDetails.notes && <Paragraph className="client-details-notes"><Text strong><InfoCircleOutlined /> Notas:</Text> {selectedClientForDetails.notes}</Paragraph>}
              </div>
          ) : (
              <Paragraph>Nenhum cliente selecionado.</Paragraph>
          )}
      </Modal>
    </ConfigProvider>
  );
};

export default AgendamentosPage;