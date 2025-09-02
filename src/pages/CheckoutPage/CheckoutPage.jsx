// src/pages/CheckoutPage/CheckoutPage.jsx
import React, { useEffect, useState } from 'react';
import { Layout, Spin, message, Result, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Content } = Layout;

const CheckoutPage = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const createCheckout = async () => {
            if (!planId) {
                setError('Nenhum plano selecionado. Redirecionando...');
                setTimeout(() => navigate('/#planos'), 3000);
                return;
            }

            try {
                // <<< CORREÇÃO PRINCIPAL AQUI >>>
                // A chamada agora aponta para a rota correta: /mercado-pago/checkout
                // O nome antigo era /mercado-pago/create-checkout-pro-preference
                const response = await apiClient.post('/mercado-pago/checkout', {
                    planId: parseInt(planId, 10),
                });

                // A resposta agora contém 'init_point' que é a URL de checkout
                if (response.data?.data?.init_point) {
                    window.location.href = response.data.data.init_point;
                } else {
                    throw new Error('Não foi possível obter o link de pagamento.');
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao iniciar o pagamento. Tente novamente.';
                setError(errorMessage);
                message.error(errorMessage);
            }
        };

        createCheckout();
    }, [planId, navigate]); // Dependências do useEffect

    // Renderiza uma mensagem de erro se a API falhar
    if (error) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Result
                    status="error"
                    title="Falha ao Iniciar Pagamento"
                    subTitle={error}
                    extra={[
                        <Button type="primary" key="console" onClick={() => navigate('/#planos')}>
                            Ver Planos
                        </Button>,
                    ]}
                />
            </Layout>
        );
    }

    // Renderiza o spinner enquanto a chamada da API está em andamento
    return (
        <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" tip="Redirecionando para o checkout seguro do Mercado Pago..." />
        </Layout>
    );
};

export default CheckoutPage;