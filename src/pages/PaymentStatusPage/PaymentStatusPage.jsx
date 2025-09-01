// src/pages/PaymentStatusPage/PaymentStatusPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const statusConfig = {
    success: {
        status: 'success',
        icon: <CheckCircleOutlined />,
        title: 'Pagamento Confirmado!',
        subTitle: 'Sua assinatura está sendo ativada. Você será redirecionado para o painel em instantes. Bem-vindo(a) ao controle total!',
    },
    failure: {
        status: 'error',
        icon: <CloseCircleOutlined />,
        title: 'Pagamento Recusado',
        subTitle: 'Não foi possível processar seu pagamento. Por favor, verifique os dados ou tente um método de pagamento diferente.',
    },
    pending: {
        status: 'info',
        icon: <ClockCircleOutlined />,
        title: 'Pagamento Pendente',
        subTitle: 'Seu pagamento está sendo processado. Se você pagou com PIX, a confirmação pode levar alguns instantes. Você será notificado assim que for aprovado.',
    }
};

const PaymentStatusPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [config, setConfig] = useState(null);

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('success')) {
            setConfig(statusConfig.success);
            // Redireciona para o painel após 5 segundos para dar tempo ao webhook
            setTimeout(() => {
                navigate('/painel');
            }, 5000);
        } else if (path.includes('failure')) {
            setConfig(statusConfig.failure);
        } else if (path.includes('pending')) {
            setConfig(statusConfig.pending);
        }
    }, [location, navigate]);

    if (!config) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Result
            icon={config.icon}
            status={config.status}
            title={config.title}
            subTitle={config.subTitle}
            extra={[
                <Button type="primary" key="dashboard" onClick={() => navigate('/painel')}>
                    Ir para o Painel
                </Button>,
                <Button key="plans" onClick={() => navigate('/#planos')}>
                    Ver outros planos
                </Button>,
            ]}
        />
    );
};

export default PaymentStatusPage;