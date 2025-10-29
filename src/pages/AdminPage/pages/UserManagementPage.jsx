// src/pages/AdminPage/pages/UserManagementPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Typography, Tabs, Input, Button, message, Spin, Space } from 'antd';
import { UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../../../services/api';
import UserTable from '../components/UserTable';
import CreateUserModal from '../components/CreateUserModal';

const { Title } = Typography;

const UserManagementPage = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        try {
            // Pede um limite alto para buscar todos os usuários de uma vez
            const response = await apiClient.get('/admin/clients/list', { params: { limit: 10000 } });
            setAllUsers(response.data.clients);
            message.success('Lista de usuários atualizada!');
        } catch (error) {
            message.error('Falha ao carregar a lista completa de usuários.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    // Hook para realizar a filtragem no front-end
    useEffect(() => {
        let users = [...allUsers];

        // 1. Filtro de busca (Search)
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            users = users.filter(user =>
                user.name?.toLowerCase().includes(lowercasedTerm) ||
                user.email?.toLowerCase().includes(lowercasedTerm) ||
                user.phone?.includes(lowercasedTerm)
            );
        }

        // 2. Filtro da Aba (Tabs)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const today = new Date();

        switch (activeTab) {
            case 'basico':
                users = users.filter(u => u.accessLevel.includes('basico'));
                break;
            case 'avancado':
                users = users.filter(u => u.accessLevel.includes('avancado'));
                break;
            case 'expiring_soon':
                users = users.filter(u => 
                    u.accessExpiresAt &&
                    new Date(u.accessExpiresAt) <= sevenDaysFromNow &&
                    new Date(u.accessExpiresAt) >= today
                );
                break;
            case 'expired':
                 users = users.filter(u => u.status !== 'Ativo' || (u.accessExpiresAt && new Date(u.accessExpiresAt) < today));
                break;
            case 'all':
            default:
                // Nenhum filtro de aba a ser aplicado
                break;
        }

        setFilteredUsers(users);

    }, [activeTab, searchTerm, allUsers]);

    const tabItems = [
        { label: 'Todos os Usuários', key: 'all' },
        { label: 'Plano Básico', key: 'basico' },
        { label: 'Plano Avançado', key: 'avancado' },
        { label: 'Quase Expirando', key: 'expiring_soon' },
        { label: 'Expirados / Inativos', key: 'expired' },
    ];

    return (
        <Card>
            <div className="admin-header">
                <Title level={3} style={{ marginBottom: 0 }}>Lista de Usuários</Title>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsCreateModalVisible(true)}>
                    Criar Novo Usuário
                </Button>
            </div>
            
            <Input.Search
                placeholder="Buscar por nome, email ou telefone..."
                onSearch={setSearchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                enterButton={<Button icon={<SearchOutlined />} type="default" />}
                style={{ marginBottom: 20, maxWidth: 400 }}
                allowClear
            />
            
            {loading && allUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
            ) : (
                <>
                    <Tabs defaultActiveKey="all" items={tabItems} onChange={setActiveTab} />
                    <UserTable
                        users={filteredUsers}
                        loading={loading}
                        onActionSuccess={fetchAllUsers} // Passa a função para recarregar a lista
                    />
                </>
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
    );
};

export default UserManagementPage;