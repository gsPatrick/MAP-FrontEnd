// src/pages/ChecklistPage/ChecklistPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Card, List, Button, Input, Checkbox,
  Space, Tooltip, Empty, Divider, Result, Tag, Modal, Form, Select, Progress, message, Spin, Row, Col
} from 'antd';
import {
  CheckSquareOutlined, PlusOutlined, HistoryOutlined, LeftOutlined, RightOutlined, StopOutlined,
  EditOutlined, DeleteOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';
import './ChecklistPage.css';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const ChecklistPage = () => {
  const { currentProfile } = useProfile();

  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setIsSubmitting] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const viewingToday = useMemo(() => selectedDate.isSame(dayjs(), 'day'), [selectedDate]);

  const fetchChecklist = useCallback(async (date) => {
    if (!currentProfile?.id) return;

    setLoading(true);
    const dateKey = date.format('YYYY-MM-DD');
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/checklists/${dateKey}`);
      // A API retorna os itens aninhados, garantimos que pegamos o array correto ou um array vazio
      const fetchedItems = response.data?.data?.items || [];
      setChecklistItems(fetchedItems);
    } catch (error) {
      // O interceptor de erro já deve exibir a mensagem, aqui apenas garantimos que a lista fique vazia
      setChecklistItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    if (currentProfile?.id) {
      fetchChecklist(selectedDate);
    }
  }, [selectedDate, fetchChecklist, currentProfile]);

  const dailyProgress = useMemo(() => {
      const total = checklistItems.length;
      if (total === 0) return 0;
      const completed = checklistItems.filter(item => item.completed).length;
      return Math.round((completed / total) * 100);
  }, [checklistItems]);

  const handleAddItem = useCallback(async (values) => {
    if (!values.text?.trim() || !viewingToday || !currentProfile?.id) return;
    
    setIsSubmitting(true);
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const payload = { 
        text: values.text.trim(), 
        priority: values.priority,
        notes: values.notes?.trim() || null
    };

    try {
      await apiClient.post(`/financial-accounts/${currentProfile.id}/checklists/${dateKey}/items`, payload);
      message.success('Tarefa adicionada com sucesso!');
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchChecklist(selectedDate); 
    } catch (error) {
      // O interceptor do apiClient já deve mostrar o erro
    } finally {
      setIsSubmitting(false);
    }
  }, [viewingToday, currentProfile?.id, selectedDate, fetchChecklist, addForm]);

  const handleToggleItem = useCallback(async (item) => {
    if (!viewingToday || !currentProfile?.id) return;

    const originalItems = [...checklistItems];
    const newItems = checklistItems.map(i => 
      i.id === item.id ? { ...i, completed: !i.completed } : i
    );
    setChecklistItems(newItems);

    try {
      await apiClient.put(`/financial-accounts/${currentProfile.id}/checklists/items/${item.id}`, { completed: !item.completed });
    } catch (error) {
      message.error('Não foi possível atualizar a tarefa.');
      setChecklistItems(originalItems);
    }
  }, [viewingToday, currentProfile?.id, checklistItems]);

  const handleDeleteItem = useCallback(async (itemId) => {
    if (!viewingToday || !currentProfile?.id) return;

    const originalItems = [...checklistItems];
    const newItems = checklistItems.filter(item => item.id !== itemId);
    setChecklistItems(newItems);

    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/checklists/items/${itemId}`);
      message.success('Tarefa excluída.');
    } catch (error) {
      message.error('Não foi possível excluir a tarefa.');
      setChecklistItems(originalItems);
    }
  }, [viewingToday, currentProfile?.id, checklistItems]);

  const showEditModal = (item) => {
    setEditingItem(item);
    editForm.setFieldsValue({
        ...item,
        notes: item.notes || ''
    });
    setIsEditModalVisible(true);
  };
  
  const handleUpdateItem = async (values) => {
    if (!editingItem || !currentProfile?.id) return;

    setIsSubmitting(true);
    try {
      await apiClient.put(`/financial-accounts/${currentProfile.id}/checklists/items/${editingItem.id}`, values);
      message.success('Tarefa atualizada com sucesso!');
      setIsEditModalVisible(false);
      setEditingItem(null);
      fetchChecklist(selectedDate);
    } catch (error) {
      // Erro já tratado pelo interceptor
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDateChange = (offset) => {
    setSelectedDate(prev => prev.add(offset, 'day'));
  };
  
  const renderPriorityTag = (priority) => {
      const config = {
          high: { color: 'red', text: 'Alta' },
          medium: { color: 'orange', text: 'Média' },
          low: { color: 'blue', text: 'Baixa' },
      };
      const { color, text } = config[priority] || { color: 'default', text: 'N/D'};
      return <Tag color={color} className={`priority-tag priority-tag-${priority}`}>{text}</Tag>
  };

  const formattedDateTitle = useMemo(() => {
    if (viewingToday) return `Hoje, ${selectedDate.format('DD [de] MMMM')}`;
    if (selectedDate.isSame(dayjs().subtract(1, 'day'), 'day')) return `Ontem, ${selectedDate.format('DD [de] MMMM')}`;
    return selectedDate.format('dddd, DD [de] MMMM [de] YYYY');
  }, [selectedDate, viewingToday]);

  return (
    <Content className="checklist-page-container">
      <div className="page-header">
        <Title level={2} className="page-title-checklist">
          <CheckSquareOutlined /> Checklist Diário
        </Title>
        <Paragraph className="page-subtitle-checklist">
          Organize suas tarefas diárias para o perfil <Text strong>{currentProfile?.name}</Text>.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* Coluna da Esquerda: Navegação e Progresso */}
        <Col xs={24} md={8} lg={7}>
          <Card className="date-navigator-card" bordered={false}>
              <Title level={4} className="date-navigator-title">{formattedDateTitle}</Title>
              <div className="date-navigator-controls">
                  <Tooltip title="Dia Anterior">
                      <Button icon={<LeftOutlined />} onClick={() => handleDateChange(-1)} />
                  </Tooltip>
                  <Tooltip title="Próximo Dia">
                      <Button icon={<RightOutlined />} onClick={() => handleDateChange(1)} disabled={viewingToday} />
                  </Tooltip>
              </div>
              
              <Divider />

              <div className="progress-section">
                <Spin spinning={loading}>
                    <Progress 
                        type="circle" 
                        percent={dailyProgress} 
                        width={120}
                        strokeWidth={10}
                        strokeColor={{'0%': '#108ee9', '100%': '#87d068'}}
                        format={(percent) => `${percent}%`}
                    />
                </Spin>
                <Text className="progress-label">Progresso do Dia</Text>
              </div>

              {!viewingToday && (
                  <Button type="primary" icon={<HistoryOutlined />} onClick={() => setSelectedDate(dayjs())} className="back-to-today-btn" block>
                      Voltar para Hoje
                  </Button>
              )}
          </Card>
        </Col>

        {/* Coluna da Direita: Lista de Tarefas */}
        <Col xs={24} md={16} lg={17}>
          <Card 
            className="checklist-card" 
            bordered={false}
            title={<Title level={4} className="checklist-card-title">Tarefas do Dia</Title>}
            extra={viewingToday && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)} size="middle">
                Adicionar Tarefa
              </Button>
            )}
          >
            <List
              className="checklist-list"
              dataSource={checklistItems}
              loading={loading}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      loading ? "Carregando tarefas..." : 
                      (viewingToday
                        ? "Nenhuma tarefa para hoje. Que tal adicionar uma?"
                        : "Nenhuma tarefa registrada para este dia.")
                    }
                  />
                ),
              }}
              renderItem={(item) => (
                <List.Item
                  className={`checklist-item ${item.completed ? 'completed' : ''}`}
                  actions={viewingToday ? [
                      <Space className="item-actions">
                        <Tooltip title="Editar Tarefa">
                            <Button type="text" shape="circle" icon={<EditOutlined />} onClick={() => showEditModal(item)} />
                        </Tooltip>
                        <Tooltip title="Excluir Tarefa">
                            <Button type="text" shape="circle" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(item.id)} />
                        </Tooltip>
                      </Space>
                  ] : []}
                >
                    <div className="checklist-item-main">
                        <Checkbox
                            checked={item.completed}
                            onChange={() => handleToggleItem(item)}
                            disabled={!viewingToday}
                            className="checklist-item-checkbox"
                        />
                        <div className="checklist-item-content">
                            <Text className="checklist-item-text">{item.text}</Text>
                            <div className="checklist-item-tags">
                                {renderPriorityTag(item.priority)}
                                {item.notes && (
                                    <Tooltip title={<div style={{whiteSpace: 'pre-wrap'}}>{item.notes}</div>}>
                                        <Tag icon={<InfoCircleOutlined />} className="notes-indicator">Nota</Tag>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal para Adicionar Tarefa */}
      <Modal
        title="Adicionar Nova Tarefa"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        destroyOnClose
        className="task-modal"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddItem} initialValues={{ priority: 'medium' }}>
            <Form.Item name="text" label="Tarefa" rules={[{ required: true, message: 'A tarefa não pode ficar em branco.'}]}>
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} placeholder="Ex: Fazer o faturamento mensal" disabled={submitting} />
            </Form.Item>
            <Form.Item name="priority" label="Prioridade" rules={[{ required: true }]}>
                <Select disabled={submitting}>
                    <Option value="high">Alta</Option>
                    <Option value="medium">Média</Option>
                    <Option value="low">Baixa</Option>
                </Select>
            </Form.Item>
            <Form.Item name="notes" label="Notas (Opcional)">
                <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Detalhes, links, informações extras..." disabled={submitting}/>
            </Form.Item>
            <Form.Item style={{textAlign: 'right', marginBottom: 0, marginTop: '24px'}}>
                <Button onClick={() => setIsAddModalVisible(false)} style={{ marginRight: 8 }} disabled={submitting}>Cancelar</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>Adicionar Tarefa</Button>
            </Form.Item>
        </Form>
      </Modal>

      {/* Modal para Editar Tarefa */}
      <Modal
        title="Editar Tarefa"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        destroyOnClose
        className="task-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateItem}>
            <Form.Item name="text" label="Tarefa" rules={[{ required: true, message: 'A tarefa não pode ficar em branco.'}]}>
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} disabled={submitting} />
            </Form.Item>
            <Form.Item name="priority" label="Prioridade" rules={[{ required: true }]}>
                <Select disabled={submitting}>
                    <Option value="high">Alta</Option>
                    <Option value="medium">Média</Option>
                    <Option value="low">Baixa</Option>
                </Select>
            </Form.Item>
            <Form.Item name="notes" label="Notas (Opcional)">
                <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Detalhes, links, informações extras..." disabled={submitting}/>
            </Form.Item>
            <Form.Item style={{textAlign: 'right', marginBottom: 0, marginTop: '24px'}}>
                <Button onClick={() => setIsEditModalVisible(false)} style={{ marginRight: 8 }} disabled={submitting}>Cancelar</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>Salvar Alterações</Button>
            </Form.Item>
        </Form>
      </Modal>

    </Content>
  );
};

export default ChecklistPage;