// src/pages/ChecklistPage/ChecklistPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Card, List, Button, Input, Checkbox,
  Space, Tooltip, Empty, Divider, Result, Tag, Modal, Form, Select, Progress, message, Spin
} from 'antd';
import {
  CheckSquareOutlined, PlusOutlined, HistoryOutlined, LeftOutlined, RightOutlined, StopOutlined,
  EditOutlined, DeleteOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api'; // <<< PASSO 1: Importar o apiClient
import './ChecklistPage.css';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

// --- DADOS MOCKADOS REMOVIDOS ---

const ChecklistPage = () => {
  const { currentProfile, currentProfileType } = useProfile();

  // <<< PASSO 2: Simplificar o estado para lidar com dados da API >>>
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setIsSubmitting] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [newItemText, setNewItemText] = useState('');
  const [newItemPriority, setNewItemPriority] = useState('medium');

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm] = Form.useForm();

  const viewingToday = useMemo(() => selectedDate.isSame(dayjs(), 'day'), [selectedDate]);

  // <<< PASSO 3: Criar função para buscar dados da API >>>
  const fetchChecklist = useCallback(async (date) => {
    if (!currentProfile?.id) return;

    setLoading(true);
    const dateKey = date.format('YYYY-MM-DD');
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/checklists/${dateKey}`);
      // A API retorna um objeto de checklist com um array 'items'
      setChecklistItems(response.data.data.items || []);
    } catch (error) {
      // O interceptor já mostra a mensagem de erro, mas limpamos a lista
      setChecklistItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.id]);

  // Efeito para buscar os dados sempre que a data ou o perfil mudar
  useEffect(() => {
    fetchChecklist(selectedDate);
  }, [selectedDate, fetchChecklist]);

  const dailyProgress = useMemo(() => {
      const total = checklistItems.length;
      if (total === 0) return 0;
      const completed = checklistItems.filter(item => item.completed).length;
      return Math.round((completed / total) * 100);
  }, [checklistItems]);

  // <<< PASSO 4: Modificar todas as funções de manipulação para usar a API >>>
  const handleAddItem = useCallback(async () => {
    if (!newItemText.trim() || !viewingToday || !currentProfile?.id) return;
    
    setIsSubmitting(true);
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const payload = { text: newItemText.trim(), priority: newItemPriority };

    try {
      await apiClient.post(`/financial-accounts/${currentProfile.id}/checklists/${dateKey}/items`, payload);
      message.success('Tarefa adicionada!');
      setNewItemText('');
      setNewItemPriority('medium');
      fetchChecklist(selectedDate); // Recarrega a lista para mostrar o novo item
    } catch (error) {
      // O interceptor do apiClient já deve mostrar o erro
    } finally {
      setIsSubmitting(false);
    }
  }, [newItemText, newItemPriority, viewingToday, currentProfile?.id, selectedDate, fetchChecklist]);

  const handleToggleItem = useCallback(async (itemId, currentStatus) => {
    if (!viewingToday || !currentProfile?.id) return;
    
    // Optimistic Update
    const originalItems = [...checklistItems];
    const newItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, completed: !currentStatus } : item
    );
    setChecklistItems(newItems);

    try {
      await apiClient.put(`/financial-accounts/${currentProfile.id}/checklists/items/${itemId}`, { completed: !currentStatus });
    } catch (error) {
      message.error('Não foi possível atualizar a tarefa. Desfazendo alteração.');
      setChecklistItems(originalItems); // Reverte em caso de erro
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
      message.error('Não foi possível excluir a tarefa. Desfazendo alteração.');
      setChecklistItems(originalItems); // Reverte em caso de erro
    }
  }, [viewingToday, currentProfile?.id, checklistItems]);

  const showEditModal = (item) => {
    setEditingItem(item);
    editForm.setFieldsValue(item);
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
      fetchChecklist(selectedDate); // Recarrega a lista
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
      return <Tag color={color} className={`priority-tag-${priority}`}>{text}</Tag>
  };

  const formattedDateTitle = useMemo(() => {
    if (viewingToday) return `Hoje, ${selectedDate.format('DD [de] MMMM')}`;
    if (selectedDate.isSame(dayjs().subtract(1, 'day'), 'day')) return `Ontem, ${selectedDate.format('DD [de] MMMM')}`;
    return selectedDate.format('dddd, DD [de] MMMM [de] YYYY');
  }, [selectedDate, viewingToday]);

  if (currentProfileType !== 'PJ' && currentProfileType !== 'MEI') {
    return (
      <Content className="checklist-page-wrapper">
        <Result
          icon={<StopOutlined />}
          status="warning"
          title="Funcionalidade Exclusiva para Perfis de Negócio"
          subTitle="O Checklist Diário está disponível apenas para perfis PJ ou MEI."
        />
      </Content>
    );
  }

  return (
    <Content className="checklist-page-wrapper">
      <Title level={2} className="page-title-checklist">
        <CheckSquareOutlined /> Checklist Diário
      </Title>
      <Paragraph className="page-subtitle-checklist">
        Organize suas tarefas diárias para o perfil <Text strong>{currentProfile?.name}</Text>. As tarefas são zeradas a cada dia.
      </Paragraph>

      <Card className="date-navigator-card" bordered={false}>
        <div className="date-navigator-header">
            <div className="date-navigator-controls">
                <Tooltip title="Dia Anterior">
                    <Button icon={<LeftOutlined />} onClick={() => handleDateChange(-1)} />
                </Tooltip>
                <Title level={4} className="date-navigator-title">{formattedDateTitle}</Title>
                <Tooltip title="Próximo Dia">
                    <Button icon={<RightOutlined />} onClick={() => handleDateChange(1)} disabled={viewingToday} />
                </Tooltip>
            </div>
            <div className="progress-section">
                <Spin spinning={loading}>
                    <Progress 
                        type="circle" 
                        percent={dailyProgress} 
                        width={60}
                        strokeColor={{'0%': '#108ee9', '100%': '#87d068'}}
                        format={(percent) => `${percent}%`}
                    />
                </Spin>
            </div>
        </div>
        {!viewingToday && (
            <Button type="primary" icon={<HistoryOutlined />} onClick={() => setSelectedDate(dayjs())} className="back-to-today-btn">
                Voltar para Hoje
            </Button>
        )}
      </Card>

      <Card className="checklist-card" bordered={false}>
        {viewingToday && (
          <>
            <div className="add-item-section">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                    placeholder="Adicionar nova tarefa para hoje..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onPressEnter={handleAddItem}
                    size="large"
                    disabled={submitting}
                />
                <Select
                    value={newItemPriority}
                    onChange={(value) => setNewItemPriority(value)}
                    size="large"
                    style={{ width: 130 }}
                    disabled={submitting}
                >
                    <Option value="high">Prioridade Alta</Option>
                    <Option value="medium">Prioridade Média</Option>
                    <Option value="low">Prioridade Baixa</Option>
                </Select>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem} size="large" loading={submitting}>
                    Adicionar
                </Button>
              </Space.Compact>
            </div>
            <Divider />
          </>
        )}

        <List
          className="checklist-list"
          dataSource={checklistItems}
          loading={loading} // <<< Usa o estado de loading da API
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  loading ? "Carregando tarefas..." : 
                  (viewingToday
                    ? "Nenhuma tarefa para hoje. Adicione uma acima!"
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
                        onChange={() => handleToggleItem(item.id, item.completed)}
                        disabled={!viewingToday}
                        className="checklist-item-checkbox"
                    />
                    <div className="checklist-item-content">
                        <Text className="checklist-item-text">{item.text}</Text>
                        <div className="checklist-item-tags">
                            {renderPriorityTag(item.priority)}
                            {item.notes && (
                                <Tooltip title={<div style={{whiteSpace: 'pre-wrap'}}>{item.notes}</div>}>
                                    <InfoCircleOutlined className="notes-indicator" />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Editar Tarefa"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        destroyOnClose
        className="edit-item-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateItem}>
            <Form.Item name="text" label="Tarefa" rules={[{ required: true, message: 'A tarefa não pode ficar em branco.'}]}>
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} disabled={submitting} />
            </Form.Item>
            <Form.Item name="priority" label="Prioridade">
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