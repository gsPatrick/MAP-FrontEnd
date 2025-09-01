// src/pages/CheckoutPage/CheckoutPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Result, Button, message } from 'antd';
import apiClient from '../../services/api';

const CheckoutPage = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const createPreferenceAndRedirect = async () => {
            // Tenta recuperar o código de afiliado salvo no momento do cadastro (se houver)
            const affiliateCode = localStorage.getItem('affiliateCode');

            try {
                message.loading({ content: 'Preparando seu checkout seguro...', key: 'checkout', duration: 10 });

                // **[PONTO CHAVE 1]** Chama o endpoint correto do backend para Checkout Pro
                const response = await apiClient.post('/mercado-pago/create-checkout-pro-preference', {
                    planId,
                    affiliateCode, 
                });
                
                // **[PONTO CHAVE 2]** Pega a URL de redirecionamento (init_point)
                if (response.data?.status === 'success' && response.data.data.init_point) {
                    if (affiliateCode) {
                        localStorage.removeItem('affiliateCode');
                    }
                    message.success({ content: 'Redirecionando para o pagamento...', key: 'checkout' });
                    
                    // **[PONTO CHAVE 3]** Redireciona a página inteira para o site do Mercado Pago
                    window.location.href = response.data.data.init_point;
                } else {
                    throw new Error('Não foi possível obter o link de pagamento do nosso servidor.');
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao preparar seu pagamento. Por favor, tente novamente mais tarde.';
                setError(errorMessage);
                message.error({ content: errorMessage, key: 'checkout', duration: 5 });
            }
        };

        createPreferenceAndRedirect();
    }, [planId, navigate]);

    // Se houver um erro, exibe uma tela de falha para o usuário
    if (error) {
        return (
            <Result
                status="error"
                title="Falha na Preparação do Pagamento"
                subTitle={error}
                extra={[
                    <Button type="primary" key="console" onClick={() => navigate('/#planos')}>
                        Escolher Outro Plano
                    </Button>,
                    <Button key="buy" onClick={() => window.location.reload()}>Tentar Novamente</Button>,
                ]}
            />
        );
    }

    // Enquanto a chamada ao backend está acontecendo, exibe uma tela de carregamento
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', backgroundColor: '#fdfcf9' }}>
            <Spin size="large" />
            <p style={{ marginTop: '20px', fontSize: '18px', color: '#555' }}>
                Aguarde, estamos te redirecionando para o ambiente seguro do Mercado Pago...
            </p>
        </div>
    );
};

export default CheckoutPage;