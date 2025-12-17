import React, { useState, useEffect } from 'react';
import { Card, Switch, Typography, message, Divider, Alert as AntAlert } from 'antd'; // Renamed Alert to AntAlert to avoid conflict
import { RobotOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../../../services/api'; // Adjust path based on location

const { Title, Text, Paragraph } = Typography;

const AdminSettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [areAutomatedJobsEnabled, setAreAutomatedJobsEnabled] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/system/preferences');
            if (response.data && response.data.data) {
                setAreAutomatedJobsEnabled(response.data.data.areAutomatedJobsEnabled);
            }
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            message.error('Não foi possível carregar as configurações do sistema.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAutomation = async (checked) => {
        const originalState = areAutomatedJobsEnabled;
        setAreAutomatedJobsEnabled(checked); // Optimistic update

        try {
            await api.put('/system/preferences', { areAutomatedJobsEnabled: checked });
            message.success(`Automações do sistema ${checked ? 'ATIVADAS' : 'DESATIVADAS'} com sucesso.`);
        } catch (error) {
            console.error('Erro ao atualizar configuração:', error);
            setAreAutomatedJobsEnabled(originalState); // Revert on error
            message.error('Erro ao salvar alteração. Tente novamente.');
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}><RobotOutlined /> Configurações do Sistema</Title>
            <Paragraph>Gerencie parâmetros globais e comportamentos da plataforma.</Paragraph>

            <Divider />

            <Card
                title="Controle de Automação (Jobs)"
                bordered={false}
                style={{ maxWidth: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <Title level={4} style={{ marginTop: 0 }}>Disparos Automáticos</Title>
                        <Paragraph type="secondary" style={{ maxWidth: 600 }}>
                            Este switch controla <b>TODOS</b> os disparos automáticos de mensagens do sistema (Briefing Matinal, Lembretes de Água, Alertas de Vencimento, etc.).
                            <br /><br />
                            Use com cautela. Ao desligar, nenhum cliente receberá notificações programadas até que seja religado.
                        </Paragraph>
                    </div>
                    <Switch
                        checked={areAutomatedJobsEnabled}
                        onChange={handleToggleAutomation}
                        loading={loading}
                        checkedChildren="LIGADO"
                        unCheckedChildren="DESLIGADO"
                        style={{ transform: 'scale(1.2)', marginLeft: 24 }}
                    />
                </div>

                {!areAutomatedJobsEnabled && (
                    <AntAlert
                        message="O sistema está em modo PAUSA"
                        description="Todos os agendamentos e filas de mensagens automáticas estão suspensos. O bot de resposta e interações diretas continuam funcionando."
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        style={{ marginTop: 24 }}
                    />
                )}
            </Card>
        </div>
    );
};

export default AdminSettingsPage;
