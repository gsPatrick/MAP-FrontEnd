// src/modals/ModalNovaRecorrencia/ModalNovaRecorrencia.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button, message, Space, Radio, Switch, Tooltip, Row, Col } from 'antd';
import { RetweetOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../services/api';

const { Option } = Select;
const diasDaSemanaModal = [
    { label: 'Domingo', value: 0 }, { label: 'Segunda', value: 1 },
    { label: 'Terça', value: 2 }, { label: 'Quarta', value: 3 },
    { label: 'Quinta', value: 4 }, { label: 'Sexta', value: 5 },
    { label: 'Sábado', value: 6 },
];

const ModalNovaRecorrencia = ({ open, onCancel, onSuccess, currentProfile, editingRecorrencia }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [frequencia, setFrequencia] = useState('monthly');
    const [tipo, setTipo] = useState('Saída');

    const fetchCategories = useCallback(async (currentType) => {
        if (!currentProfile?.id) return;
        setLoadingCategories(true);
        try {
            const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/categories`);
            const allCategories = response.data.data || [];
            const filtered = allCategories.filter(c => c.type === currentType || !c.type);
            setCategories(filtered);
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
        } finally {
            setLoadingCategories(false);
        }
    }, [currentProfile?.id]);
    
    useEffect(() => {
        fetchCategories(tipo);
    }, [tipo, fetchCategories]);

    useEffect(() => {
        if (open) {
            if (editingRecorrencia) {
                const initialType = editingRecorrencia.type || 'Saída';
                const initialFreq = editingRecorrencia.frequency || 'monthly';
                setTipo(initialType);
                setFrequencia(initialFreq);
                fetchCategories(initialType);
                form.setFieldsValue({
                    ...editingRecorrencia,
                    value: parseFloat(editingRecorrencia.value),
                    startDate: dayjs(editingRecorrencia.startDate),
                    endDate: editingRecorrencia.endDate ? dayjs(editingRecorrencia.endDate) : null,
                });
            } else {
                form.resetFields();
                setTipo('Saída');
                setFrequencia('monthly');
                fetchCategories('Saída');
                form.setFieldsValue({
                    type: 'Saída',
                    frequency: 'monthly',
                    interval: 1,
                    startDate: dayjs().add(1, 'day'),
                    autoCreateTransaction: true,
                    isActive: true,
                });
            }
        }
    }, [open, editingRecorrencia, form, fetchCategories]);

    const handleFinish = async (values) => {
        setLoading(true);
        const payload = {
            ...values,
            startDate: values.startDate.format('YYYY-MM-DD'),
            endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        };
        try {
            const endpoint = editingRecorrencia
              ? `/financial-accounts/${currentProfile.id}/recurring-rules/${editingRecorrencia.id}`
              : `/financial-accounts/${currentProfile.id}/recurring-rules`;
            const method = editingRecorrencia ? 'put' : 'post';
            
            await apiClient[method](endpoint, payload);
            message.success(`Recorrência ${editingRecorrencia ? 'atualizada' : 'criada'}!`);
            onSuccess();
            onCancel();
        } catch (error) {
            // Interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={<Space><RetweetOutlined style={{ color: '#1677ff' }} />{editingRecorrencia ? 'Editar Recorrência' : 'Nova Recorrência'}</Space>}
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnClose width={700}
            className="modal-nova-recorrencia"
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} onValuesChange={(changed) => {
                if (changed.frequency) setFrequencia(changed.frequency);
                if (changed.type) setTipo(changed.type);
            }}>
                <Form.Item name="description" label="Descrição" rules={[{ required: true }]}><Input /></Form.Item>
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="type" label="Tipo" rules={[{ required: true }]}><Radio.Group buttonStyle="solid"><Radio.Button value="Saída">Despesa</Radio.Button><Radio.Button value="Entrada">Receita</Radio.Button></Radio.Group></Form.Item></Col>
                    <Col span={12}><Form.Item name="value" label="Valor (R$)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.01} precision={2} /></Form.Item></Col>
                </Row>
                <Form.Item name="financialCategoryId" label="Categoria" rules={[{ required: true }]}><Select loading={loadingCategories} showSearch>{categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}</Select></Form.Item>
                <Form.Item name="frequency" label="Frequência" rules={[{ required: true }]}><Select><Option value="daily">Diária</Option><Option value="weekly">Semanal</Option><Option value="bi-weekly">Quinzenal</Option><Option value="monthly">Mensal</Option></Select></Form.Item>
                
                {(frequencia === 'weekly' || frequencia === 'bi-weekly') && <Form.Item name="dayOfWeek" label="Dia da Semana" rules={[{ required: true }]}><Select>{diasDaSemanaModal.map(d => <Option key={d.value} value={d.value}>{d.label}</Option>)}</Select></Form.Item>}
                {frequencia === 'monthly' && <Form.Item name="dayOfMonth" label="Dia do Mês" rules={[{ required: true }]}><InputNumber min={1} max={31} style={{width: '100%'}} /></Form.Item>}

                <Row gutter={16}>
                    <Col span={12}><Form.Item name="startDate" label="Data de Início" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    <Col span={12}><Form.Item name="endDate" label="Data de Término (Opcional)"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                </Row>
                <Form.Item name="autoCreateTransaction" valuePropName="checked">
                    <Switch checkedChildren="Gerar Transação" unCheckedChildren="Apenas Lembrar" />
                    <Tooltip title="Se marcado, uma transação será criada automaticamente."><InfoCircleOutlined style={{ marginLeft: 8 }} /></Tooltip>
                </Form.Item>
                <Form.Item style={{ textAlign: 'right', marginTop: '20px', marginBottom: 0 }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }} className="modal-btn-cancel">Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading} className="modal-btn-submit neutral">{editingRecorrencia ? 'Salvar' : 'Criar'}</Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalNovaRecorrencia;