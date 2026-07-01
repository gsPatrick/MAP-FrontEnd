// src/pages/AdminPage/pages/UserManagementPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Typography, Input, Button, message, Spin, Space, Row, Col, Statistic, Select } from 'antd';
import { UserAddOutlined, SearchOutlined, SafetyCertificateOutlined, AlertOutlined, StopOutlined, TeamOutlined, ClearOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';
import UserTable from '../components/UserTable';
import CreateUserModal from '../components/CreateUserModal';
import { getPlano, getSituacao, PLANO_FILTER_OPTIONS, SITUACAO_FILTER_OPTIONS } from '../components/userStatus';

const { Title } = Typography;

const UserManagementPage = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [adminStats, setAdminStats] = useState({ totalUsers: 0, active7d: 0, inactive15d: 0, stagnant30d: 0 });
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

    // Filtros combináveis
    const [searchTerm, setSearchTerm] = useState('');
    const [planoFilter, setPlanoFilter] = useState([]);      // ex: ['basico','vitalicio']
    const [situacaoFilter, setSituacaoFilter] = useState([]); // ex: ['Inadimplente']
    const [affiliateFilter, setAffiliateFilter] = useState(undefined); // '__any__' | '__none__' | 'id:<n>'
    const [cancelFilter, setCancelFilter] = useState(undefined);       // 'scheduled' | 'none'

    const fetchAdminStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await apiClient.get('/admin/dashboard/stats');
            setAdminStats(response.data.data);
        } catch (error) {
            console.error('Falha ao carregar estatísticas do admin.');
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/clients/list', { params: { limit: 10000 } });
            setAllUsers(response.data.clients);
        } catch (error) {
            message.error('Falha ao carregar a lista completa de usuários.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllUsers();
        fetchAdminStats();
    }, [fetchAllUsers, fetchAdminStats]);

    // Lista de afiliados (para o filtro), montada a partir de quem indicou alguém.
    const affiliateOptions = useMemo(() => {
        const map = new Map();
        allUsers.forEach(u => { if (u.referredBy) map.set(u.referredBy.id, u.referredBy); });
        const specific = [...map.values()]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map(a => ({ value: `id:${a.id}`, label: `${a.name}${a.affiliateCode ? ` (${a.affiliateCode})` : ''}` }));
        return [
            { value: '__any__', label: '✅ Veio de algum afiliado' },
            { value: '__none__', label: '🚫 Sem indicação' },
            ...(specific.length ? [{ label: 'Afiliados', options: specific }] : []),
        ];
    }, [allUsers]);

    const filteredUsers = useMemo(() => {
        return allUsers.filter((user) => {
            // 1) Busca
            if (searchTerm) {
                const t = searchTerm.toLowerCase();
                const match =
                    user.name?.toLowerCase().includes(t) ||
                    user.email?.toLowerCase().includes(t) ||
                    user.phone?.includes(t) ||
                    user.referredBy?.name?.toLowerCase().includes(t) ||
                    user.referredBy?.affiliateCode?.toLowerCase().includes(t);
                if (!match) return false;
            }
            // 2) Filtro de plano (OR dentro da categoria)
            if (planoFilter.length > 0) {
                if (!planoFilter.includes(getPlano(user.accessLevel).group)) return false;
            }
            // 3) Filtro de situação (OR dentro da categoria)
            if (situacaoFilter.length > 0) {
                if (!situacaoFilter.includes(getSituacao(user).label)) return false;
            }
            // 4) Filtro de afiliado
            if (affiliateFilter) {
                if (affiliateFilter === '__any__' && !user.referredBy) return false;
                if (affiliateFilter === '__none__' && user.referredBy) return false;
                if (affiliateFilter.startsWith('id:')) {
                    const id = parseInt(affiliateFilter.slice(3), 10);
                    if (user.referredBy?.id !== id) return false;
                }
            }
            // 5) Filtro de cancelamento
            if (cancelFilter === 'scheduled' && !user.subscriptionCancelAt) return false;
            if (cancelFilter === 'none' && user.subscriptionCancelAt) return false;
            return true;
        });
    }, [allUsers, searchTerm, planoFilter, situacaoFilter, affiliateFilter, cancelFilter]);

    const hasFilters = searchTerm || planoFilter.length > 0 || situacaoFilter.length > 0 || affiliateFilter || cancelFilter;
    const clearFilters = () => { setSearchTerm(''); setPlanoFilter([]); setSituacaoFilter([]); setAffiliateFilter(undefined); setCancelFilter(undefined); };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stats-card admin-summary-card">
                        <Statistic title="Total de Usuários" value={adminStats.totalUsers} prefix={<TeamOutlined />} loading={statsLoading} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stats-card admin-summary-card active-7d">
                        <Statistic title="Ativos (7 dias)" value={adminStats.active7d} prefix={<SafetyCertificateOutlined />} loading={statsLoading} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stats-card admin-summary-card inactive-15d">
                        <Statistic title="Inativos (+15 dias)" value={adminStats.inactive15d} prefix={<AlertOutlined />} loading={statsLoading} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="stats-card admin-summary-card stagnant-30d">
                        <Statistic title="Parados (+30 dias)" value={adminStats.stagnant30d} prefix={<StopOutlined />} loading={statsLoading} valueStyle={{ color: '#8c8c8c' }} />
                    </Card>
                </Col>
            </Row>

            <Card>
                <div className="admin-header">
                    <Title level={3} style={{ marginBottom: 0 }}>Lista de Usuários</Title>
                    <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsCreateModalVisible(true)}>
                        Criar Novo Usuário
                    </Button>
                </div>

                {/* Filtros combináveis */}
                <Row gutter={[12, 12]} style={{ marginBottom: 12 }} align="middle">
                    <Col xs={24} md={10}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Buscar por nome, e-mail, telefone ou afiliado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Col>
                    <Col xs={12} md={7}>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Plano"
                            options={PLANO_FILTER_OPTIONS}
                            value={planoFilter}
                            onChange={setPlanoFilter}
                            maxTagCount="responsive"
                        />
                    </Col>
                    <Col xs={12} md={7}>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Situação"
                            options={SITUACAO_FILTER_OPTIONS}
                            value={situacaoFilter}
                            onChange={setSituacaoFilter}
                            maxTagCount="responsive"
                        />
                    </Col>
                    <Col xs={12} md={10}>
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            style={{ width: '100%' }}
                            placeholder="Indicado por afiliado..."
                            options={affiliateOptions}
                            value={affiliateFilter}
                            onChange={setAffiliateFilter}
                        />
                    </Col>
                    <Col xs={12} md={7}>
                        <Select
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Cancelamento"
                            value={cancelFilter}
                            onChange={setCancelFilter}
                            options={[
                                { value: 'scheduled', label: 'Cancelamento agendado' },
                                { value: 'none', label: 'Sem cancelamento' },
                            ]}
                        />
                    </Col>
                    <Col xs={24} md={7}>
                        <Button block icon={<ClearOutlined />} onClick={clearFilters} disabled={!hasFilters}>
                            Limpar filtros
                        </Button>
                    </Col>
                </Row>
                {hasFilters && (
                    <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 13 }}>
                        {filteredUsers.length} usuário(s) encontrado(s)
                    </div>
                )}

                {loading && allUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
                ) : (
                    <UserTable users={filteredUsers} loading={loading} onActionSuccess={fetchAllUsers} />
                )}

                <CreateUserModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onSuccess={() => {
                        setIsCreateModalVisible(false);
                        fetchAllUsers();
                    }}
                />
            </Card>
        </Space>
    );
};

export default UserManagementPage;
