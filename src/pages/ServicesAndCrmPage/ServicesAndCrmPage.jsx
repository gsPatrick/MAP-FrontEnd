// src/pages/ServicesAndCrmPage/ServicesAndCrmPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Row, Col, Card, List, Modal, Form, Input,
  InputNumber, Spin, Empty, Tag, Popconfirm, message, Statistic, Segmented,
  Select, DatePicker, Space,Pagination, Avatar, Tooltip, Input as AntdInput
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AppstoreAddOutlined,
  DollarCircleOutlined, ClockCircleOutlined, BarChartOutlined, CheckCircleOutlined,
  LoadingOutlined, InfoCircleOutlined, UserOutlined, TeamOutlined, ShareAltOutlined, CopyOutlined, WhatsAppOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../contexts/ProfileContext';
import './ServicesAndCrmPage.css';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ServicesAndCrmPage = () => {
  const { currentProfile, currentProfileType } = useProfile();
  const [activeView, setActiveView] = useState('services');
  
  const [services, setServices] = useState([]);
  const [allActiveServices, setAllActiveServices] = useState([]);
  
  const [crmActivity, setCrmActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCrm, setLoadingCrm] = useState(false);
  
  const [servicesPagination, setServicesPagination] = useState({ current: 1, pageSize: 6, total: 0 });
  const [crmPagination, setCrmPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [crmFilters, setCrmFilters] = useState({ serviceId: null, dateRange: null, status: null });
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  const fetchPaginatedServices = useCallback(async () => {
    if (!currentProfile?.id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/services/${currentProfile.id}`, {
        params: { page: servicesPagination.current, limit: servicesPagination.pageSize }
      });
      setServices(response.data.data.services || []);
      setServicesPagination(prev => ({ ...prev, total: response.data.data.totalItems || 0 }));
    } catch (error) {
      console.error("Falha ao buscar serviços paginados:", error);
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.id, servicesPagination.current, servicesPagination.pageSize]);
  
  const fetchAllActiveServicesForFilter = useCallback(async () => {
    if (!currentProfile?.id) return;
    try {
      const response = await apiClient.get(`/services/${currentProfile.id}`, {
        params: { page: 1, limit: 500, isActive: true }
      });
      setAllActiveServices(response.data.data.services || []);
    } catch (error) {
      console.error("Falha ao buscar serviços para filtros:", error);
    }
  }, [currentProfile?.id]);

  const fetchCrmActivity = useCallback(async () => {
    if (!currentProfile?.id) return;
    setLoadingCrm(true);
    try {
      const params = {
        page: crmPagination.current,
        limit: crmPagination.pageSize,
        sortBy: 'eventDateTime',
        sortOrder: 'DESC'
      };
      if (crmFilters.status) params.status = crmFilters.status;
      if (crmFilters.dateRange) {
        params.dateStart = crmFilters.dateRange[0].startOf('day').toISOString();
        params.dateEnd = crmFilters.dateRange[1].endOf('day').toISOString();
      }

      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/appointments`, { params });
      
      // <<< MUDANÇA AQUI >>>
      setCrmActivity(response.data.data || []);
      setCrmPagination(prev => ({ ...prev, total: response.data.totalItems || 0 }));

    } catch (error) {
      console.error("Falha ao buscar atividades de CRM:", error);
    } finally {
      setLoadingCrm(false);
    }
  }, [currentProfile?.id, crmPagination.current, crmPagination.pageSize, crmFilters]);

  useEffect(() => {
    if (currentProfileType === 'PJ' || currentProfileType === 'MEI') {
      fetchPaginatedServices();
      fetchAllActiveServicesForFilter();
    } else {
      setLoading(false);
    }
  }, [currentProfileType, fetchPaginatedServices, fetchAllActiveServicesForFilter]);
  
  useEffect(() => {
    if (activeView === 'crm' && (currentProfileType === 'PJ' || currentProfileType === 'MEI')) {
      fetchCrmActivity();
    }
  }, [activeView, crmFilters, crmPagination.current, crmPagination.pageSize, fetchCrmActivity]);

  const showModal = (service = null) => {
    setEditingService(service);
    form.setFieldsValue(service ? { ...service, price: parseFloat(service.price) } : { name: '', description: '', price: null, durationMinutes: 30, isActive: true });
    setIsModalVisible(true);
  };

  const handleCancel = () => { setIsModalVisible(false); setEditingService(null); form.resetFields(); };

  const handleFinish = async (values) => {
    setIsSubmitting(true);
    try {
      if (editingService) {
        await apiClient.patch(`/services/${currentProfile.id}/${editingService.id}`, values);
        message.success(`Serviço "${values.name}" atualizado!`);
      } else {
        await apiClient.post(`/services/${currentProfile.id}`, values);
        message.success(`Serviço "${values.name}" criado!`);
      }
      handleCancel();
      fetchPaginatedServices();
      fetchAllActiveServicesForFilter();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (serviceId) => {
    message.loading({ content: 'Excluindo...', key: `delete-${serviceId}` });
    try {
      await apiClient.delete(`/services/${currentProfile.id}/${serviceId}`);
      message.success({ content: 'Serviço excluído!', key: `delete-${serviceId}`, duration: 2 });
      fetchPaginatedServices();
      fetchAllActiveServicesForFilter();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
    }
  };

  const handleServicesPageChange = (page, pageSize) => {
    setServicesPagination(prev => ({ ...prev, current: page, pageSize }));
  };

  const handleCrmPageChange = (page, pageSize) => {
    setCrmPagination(prev => ({ ...prev, current: page, pageSize }));
  };

  const filteredCrmActivity = useMemo(() => {
    if (!crmFilters.serviceId) return crmActivity;
    return crmActivity.filter(act => 
      Array.isArray(act.services) && act.services.some(s => s.id === crmFilters.serviceId)
    );
  }, [crmActivity, crmFilters.serviceId]);

  const crmStats = useMemo(() => {
    const completedActivities = crmActivity.filter(act => act.status === 'Completed');
    const totalRevenue = completedActivities.reduce((sum, act) => {
      const activityValue = Array.isArray(act.services) 
        ? act.services.reduce((serviceSum, s) => serviceSum + parseFloat(s.price || 0), 0)
        : 0;
      return sum + activityValue;
    }, 0);
    return {
      totalAppointments: crmPagination.total,
      totalRevenue: totalRevenue.toFixed(2),
    };
  }, [crmActivity, crmPagination.total]);

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    in: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    out: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  const publicBookingLink = useMemo(() => {
    if (!currentProfile?.id) return '';
    return `${window.location.origin}/agendar/${currentProfile.id}`;
  }, [currentProfile?.id]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(publicBookingLink);
    message.success('Link copiado para a área de transferência!');
  };

  const ServicesView = () => (
    <motion.div key="services-view" variants={pageVariants} initial="initial" animate="in" exit="out">
      <div className="view-header">
        <Title level={4}>Catálogo de Serviços</Title>
        <Space>
          <Button icon={<ShareAltOutlined />} onClick={() => setIsShareModalVisible(true)}>
            Compartilhar Página do Agendamento
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} className="btn-create-service">
            Criar Novo Serviço
          </Button>
        </Space>
      </div>
      {services.length > 0 ? (
        <>
          <div className="services-grid-container">
            {services.map((service) => (
              <motion.div key={service.id} variants={itemVariants}>
                <Card className="service-manage-card" bordered={false} hoverable>
                  <Tag className="service-status-tag" color={service.isActive ? 'green' : 'default'}>{service.isActive ? 'Ativo' : 'Inativo'}</Tag>
                  <Title level={5} className="service-manage-title">{service.name}</Title>
                  <div className="service-meta-info">
                    <span><DollarCircleOutlined /> R$ {parseFloat(service.price).toFixed(2).replace('.', ',')}</span>
                    <span><ClockCircleOutlined /> {service.durationMinutes} min</span>
                  </div>
                  <Paragraph className="service-manage-description" ellipsis={{ rows: 2, expandable: true, symbol: 'mais' }}>{service.description || 'Nenhuma descrição.'}</Paragraph>
                  <div className="service-card-actions">
                    <Button type="text" icon={<EditOutlined />} onClick={() => showModal(service)}>Editar</Button>
                    <Popconfirm title="Excluir este serviço?" onConfirm={() => handleDelete(service.id)} okText="Sim" cancelText="Não" placement="topRight">
                      <Button type="text" danger icon={<DeleteOutlined />}>Excluir</Button>
                    </Popconfirm>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="pagination-container">
            <Pagination {...servicesPagination} onChange={handleServicesPageChange} showSizeChanger={false} />
          </div>
        </>
      ) : (
        <Empty className="custom-empty-state" description="Você ainda não cadastrou nenhum serviço. Comece agora!" >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Criar Primeiro Serviço</Button>
        </Empty>
      )}
    </motion.div>
  );

  const CrmView = () => (
    <motion.div key="crm-view" variants={pageVariants} initial="initial" animate="in" exit="out">
        <div className="view-header crm-filters">
            <Title level={4}>Análise de Atividades</Title>
            <div className="filters-wrapper">
                <Select
                    placeholder="Filtrar por serviço"
                    allowClear style={{ width: 220 }}
                    onChange={(value) => setCrmFilters(f => ({ ...f, serviceId: value }))}
                >
                    {allActiveServices.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
                <Select
                    placeholder="Filtrar por status"
                    allowClear style={{ width: 180 }}
                    onChange={(value) => setCrmFilters(f => ({ ...f, status: value }))}
                >
                    <Option value="Scheduled">Agendado</Option>
                    <Option value="Confirmed">Confirmado</Option>
                    <Option value="Completed">Finalizado</Option>
                    <Option value="Cancelled">Cancelado</Option>
                </Select>
                <RangePicker 
                    placeholder={['Data Início', 'Data Fim']} 
                    onChange={(dates) => setCrmFilters(f => ({ ...f, dateRange: dates }))}
                />
            </div>
        </div>
        <Row gutter={24} className="crm-stats-row">
            <Col xs={24} sm={12}><Statistic title="Total de Agendamentos (Filtrado)" value={crmStats.totalAppointments} prefix={<CheckCircleOutlined />} /></Col>
            <Col xs={24} sm={12}><Statistic title="Receita de Serviços Finalizados (Filtrado)" prefix="R$" value={crmStats.totalRevenue} precision={2} /></Col>
        </Row>
        <List
            className="crm-activity-list-full"
            header={<div className="crm-list-header-full">Histórico de Agendamentos</div>}
            dataSource={filteredCrmActivity}
            loading={loadingCrm}
            pagination={{ ...crmPagination, onChange: handleCrmPageChange, size: 'small' }}
            renderItem={item => {
                const clientName = Array.isArray(item.businessClients) && item.businessClients.length > 0 ? item.businessClients.map(c => c.name).join(', ') : 'Cliente não informado';
                const serviceNames = Array.isArray(item.services) && item.services.length > 0 ? item.services.map(s => s.name).join(' + ') : 'Serviço não informado';
                const statusConfig = {
                    Scheduled: { color: 'gold', text: 'Agendado' },
                    Confirmed: { color: 'green', text: 'Confirmado' },
                    Completed: { color: 'blue', text: 'Finalizado' },
                    Cancelled: { color: 'red', text: 'Cancelado' },
                };
                return (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar icon={(Array.isArray(item.businessClients) && item.businessClients.length > 1) ? <TeamOutlined /> : <UserOutlined />} />}
                            title={<Text strong>{clientName}</Text>}
                            description={`Serviços: ${serviceNames}`}
                        />
                        <div className="activity-details">
                            <Text type="secondary">{dayjs(item.eventDateTime).format('DD/MM/YYYY HH:mm')}</Text>
                            <Tag color={statusConfig[item.status]?.color || 'default'}>{statusConfig[item.status]?.text || item.status}</Tag>
                        </div>
                    </List.Item>
                )
            }}
        />
    </motion.div>
  );

  if (loading) {
    return (
      <div className="services-crm-loading-container">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'var(--map-laranja)' }} spin />} />
        <p>Carregando seu centro de comando...</p>
      </div>
    );
  }

  if (currentProfileType !== 'PJ' && currentProfileType !== 'MEI') {
      return (
          <Content className="services-crm-page-wrapper-light">
              <Empty
                  image={<InfoCircleOutlined style={{ fontSize: 64, color: '#ccc' }} />}
                  description={
                      <>
                          <Title level={4}>Funcionalidade Indisponível</Title>
                          <Paragraph>A gestão de Serviços e CRM é exclusiva para perfis de negócio (PJ ou MEI).</Paragraph>
                      </>
                  }
              />
          </Content>
      );
  }

  return (
    <Content className="services-crm-page-wrapper-light">
      <motion.div variants={pageVariants} initial="initial" animate="in" exit="out">
        <motion.div variants={itemVariants}>
          <Title level={2} className="page-title-services-crm">
            <AppstoreAddOutlined /> Centro de Serviços
          </Title>
          <Paragraph className="page-subtitle-services-crm">
            Gerencie seu catálogo de ofertas e analise a atividade de seus clientes para impulsionar seu negócio.
          </Paragraph>
        </motion.div>
        
        <motion.div variants={itemVariants}>
            <Segmented
                options={[
                    { label: 'Meus Serviços', value: 'services', icon: <AppstoreAddOutlined /> },
                    { label: 'CRM & Atividades', value: 'crm', icon: <BarChartOutlined /> },
                ]}
                value={activeView}
                onChange={setActiveView}
                block
                size="large"
                className="view-switcher"
            />
        </motion.div>

        <div className="view-container">
            <AnimatePresence mode="wait">
                {activeView === 'services' ? <ServicesView /> : <CrmView />}
            </AnimatePresence>
        </div>
      </motion.div>

      <Modal
        title={<Title level={4} style={{ margin: 0 }}>{editingService ? 'Editar Serviço' : 'Criar Novo Serviço'}</Title>}
        open={isModalVisible} onCancel={handleCancel} footer={null} className="service-form-modal" destroyOnHidden width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} className="service-form">
          <Form.Item name="name" label="Nome do Serviço" rules={[{ required: true, message: 'O nome é obrigatório.' }]}>
            <Input size="large" placeholder="Ex: Corte de Cabelo Masculino" />
          </Form.Item>
          <Form.Item name="description" label="Descrição (Opcional)">
            <Input.TextArea rows={3} placeholder="Detalhes do serviço, o que está incluso, etc." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="Preço (R$)" rules={[{ required: true, message: 'O preço é obrigatório.' }]}>
                <InputNumber size="large" style={{ width: '100%' }} formatter={v => `R$ ${v}`} parser={v => v.replace(/R\$\s?/, '')} precision={2} step={10} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="durationMinutes" label="Duração (minutos)" rules={[{ required: true, message: 'A duração é obrigatória.' }]}>
                <InputNumber size="large" style={{ width: '100%' }} min={5} step={5} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="Status do Serviço" valuePropName="checked">
            <Select size="large">
                <Option value={true}>Ativo (visível para agendamento)</Option>
                <Option value={false}>Inativo (oculto para agendamento)</Option>
            </Select>
          </Form.Item>
          <Form.Item className="modal-form-actions">
            <Button size="large" onClick={handleCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="primary" size="large" htmlType="submit" loading={isSubmitting}>
              {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><ShareAltOutlined /> Compartilhe sua Página de Agendamentos</Space>}
        open={isShareModalVisible}
        onCancel={() => setIsShareModalVisible(false)}
        footer={null}
        className="share-modal"
      >
        <Paragraph>
          Envie este link para seus clientes. Eles poderão ver seus serviços e agendar um horário diretamente.
        </Paragraph>
        <AntdInput.Group compact>
          <AntdInput style={{ width: 'calc(100% - 120px)' }} value={publicBookingLink} readOnly />
          <Tooltip title="Copiar Link">
            <Button icon={<CopyOutlined />} onClick={handleCopyToClipboard} style={{ width: 120 }}>
              Copiar
            </Button>
          </Tooltip>
        </AntdInput.Group>
        <Button 
          type="primary" 
          icon={<WhatsAppOutlined />} 
          href={`https://wa.me/?text=${encodeURIComponent(`Olá! Agende um horário comigo através do meu link exclusivo: ${publicBookingLink}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 16, width: '100%', backgroundColor: '#25D366', borderColor: '#25D366' }}
        >
          Compartilhar no WhatsApp
        </Button>
      </Modal>
    </Content>
  );
};

export default ServicesAndCrmPage;