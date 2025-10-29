// src/pages/AdminPage/pages/DashboardOverview.jsx
import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const DashboardOverview = () => {
    return (
        <Card>
            <Title level={3}>Visão Geral</Title>
            <Paragraph>
                Bem-vindo ao Painel do Administrador. Selecione uma opção no menu lateral para começar.
            </Paragraph>
        </Card>
    );
};

export default DashboardOverview;