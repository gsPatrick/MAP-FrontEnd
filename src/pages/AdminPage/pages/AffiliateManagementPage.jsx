// src/pages/AdminPage/pages/AffiliateManagementPage.jsx
import React from 'react';
import { Card, Typography } from 'antd';
import AffiliatesTab from '../components/AffiliatesTab'; // Reutilizando o componente

const { Title } = Typography;

const AffiliateManagementPage = () => {
    return (
        <Card>
            <Title level={3} style={{ marginBottom: '20px' }}>Gerenciamento de Afiliados</Title>
            <AffiliatesTab />
        </Card>
    );
};

export default AffiliateManagementPage;