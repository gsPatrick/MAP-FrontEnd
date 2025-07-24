// src/pages/LoginPage/LoginPage.jsx

import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import { Layout, Form, Input, Button, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import HeaderLP from '../../componentsLP/Header/Header';
import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './LoginPage.css';

import apiClient from '../../services/api';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- Efeito para animação de entrada ---
  useEffect(() => {
    const loginCard = document.querySelector('.login-card-container');
    if (loginCard) {
      loginCard.classList.add('visible');
    }
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []);

  // --- Função de Callback para o sucesso do login ---
  const handleLoginSuccess = useCallback((token, userData, userRole, targetPath) => {
    console.log(`[handleLoginSuccess] Salvando dados para role: ${userRole}`);
    
    // Limpa completamente o localStorage antes de salvar a nova sessão
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('selectedProfileId'); // Limpa sempre qualquer ID de perfil selecionado anterior

    // Salva os dados de autenticação no localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userData', JSON.stringify(userData));

    // Lógica específica para clientes (perfis financeiros)
    if (userRole === 'client' && targetPath === '/painel') {
      const financialAccounts = userData.financialAccounts || [];
      
      if (financialAccounts.length > 0) {
        let profileIdToSelect = null;
        
        // 1. Tenta encontrar o perfil marcado como Padrão (isDefault: true)
        const defaultProfile = financialAccounts.find(acc => acc.isDefault === true);
        
        if (defaultProfile) {
          profileIdToSelect = defaultProfile.id.toString();
          console.log(`[handleLoginSuccess] Perfil Padrão encontrado: ${profileIdToSelect}`);
        } else {
          // 2. Se não houver perfil Padrão, tenta encontrar o primeiro perfil do tipo "PF" (Pessoal)
          const personalProfile = financialAccounts.find(acc => acc.accountType === 'PF');
          if (personalProfile) {
            profileIdToSelect = personalProfile.id.toString();
            console.log(`[handleLoginSuccess] Perfil Padrão não encontrado, selecionando o primeiro Perfil Pessoal: ${profileIdToSelect}`);
          } else {
            // 3. Se não houver Perfil Pessoal, seleciona o primeiro perfil disponível
            const firstAvailableProfile = financialAccounts[0];
            if (firstAvailableProfile) {
              profileIdToSelect = firstAvailableProfile.id.toString();
              console.log(`[handleLoginSuccess] Nenhum Perfil Padrão ou Pessoal encontrado, selecionando o primeiro perfil disponível: ${profileIdToSelect}`);
            }
          }
        }

        // Salva o ID do perfil selecionado no localStorage se um foi encontrado
        if (profileIdToSelect) {
          localStorage.setItem('selectedProfileId', profileIdToSelect);
        } else {
          // Se, por algum motivo, nenhuma conta foi selecionada (improvável se financialAccounts.length > 0),
          // redireciona para a página de gestão de perfis.
          console.warn('[handleLoginSuccess] Não foi possível determinar um perfil inicial. Redirecionando para gestão de perfis.');
          targetPath = '/painel/meu-perfil';
        }
      } else {
        // Cliente logado, mas sem perfis financeiros ainda. Leva para a página de gestão de perfis.
        console.log('[handleLoginSuccess] Cliente logado, sem perfis. Redirecionando para criação/gestão de perfil.');
        targetPath = '/painel/meu-perfil';
      }
    }
    
    message.success(`Login bem-sucedido! Bem-vindo(a), ${userData.name || userData.email}!`);
    navigate(targetPath);
  }, [navigate]); // Adicionado navigate às dependências do useCallback

  // --- Função para lidar com o submit do formulário ---
  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;

    // TENTATIVA 1: LOGIN COMO ADMINISTRADOR
    try {
      const adminResponse = await apiClient.post('/users/login', {
        email: email,
        password: password,
      });

      console.log('[Admin Login Attempt] Resposta da API:', adminResponse.data);

      if (adminResponse.data?.status === 'success' && adminResponse.data.data?.user?.role === 'admin') {
        console.log('[Admin Login Attempt] Sucesso! Role "admin" detectada.');
        const { token, user } = adminResponse.data.data;
        handleLoginSuccess(token, user, 'admin', '/admin/dashboard');
        // Não precisa mais chamar setLoading(false) aqui, pois handleLoginSuccess já faz o navigate
        return; // Sai da função após o sucesso
      }
      
    } catch (adminError) {
      // Se o erro NÃO for 401 (Não Autorizado) ou 404 (Não Encontrado), significa um erro inesperado.
      // Caso contrário, apenas ignoramos e prosseguimos para a tentativa de login de cliente.
      if (!adminError.response || (adminError.response.status !== 401 && adminError.response.status !== 404)) {
        console.error('Erro inesperado no login de administrador:', adminError);
        message.error('Ocorreu um erro inesperado durante o login de administrador. Tente novamente.');
        // Não precisa mais chamar setLoading(false) aqui, o finally cuidará disso
        return; // Importante sair aqui se o erro for inesperado
      }
      console.log('[Admin Login Attempt] Falhou (401/404). Tentando como cliente...');
    }

    // TENTATIVA 2: LOGIN COMO CLIENTE
    try {
      const clientResponse = await apiClient.post('/auth/client/login', {
        identifier: email, // Usa o mesmo campo de email para o identifier do cliente
        password: password,
      });

      console.log('[Client Login Attempt] Resposta da API:', clientResponse.data);

      if (clientResponse.data?.status === 'success' && clientResponse.data.data?.token) {
        console.log('[Client Login Attempt] Sucesso!');
        const { token, client, financialAccounts } = clientResponse.data.data;
        // Passa os dados combinados do cliente e suas contas para handleLoginSuccess
        const clientData = { ...client, financialAccounts }; 
        handleLoginSuccess(token, clientData, 'client', '/painel');
        // Não precisa mais chamar setLoading(false) aqui
        return; // Sai da função após o sucesso
      } else {
        // Se chegou aqui, significa que a tentativa de cliente também falhou ou a resposta não foi bem-sucedida.
        // A mensagem de erro específica (se houver) já deve ter sido tratada pelo interceptor do Axios.
        // Se não, exibimos uma mensagem genérica.
        message.error(clientResponse.data?.message || 'E-mail ou senha inválidos.');
      }
    } catch (clientError) {
      console.error('Erro no login de cliente:', clientError);
      // Mensagens de erro específicas (401, 403, 404, 500) são tratadas pelo interceptor do apiClient.
      // Se o erro não foi tratado pelo interceptor, mostra uma mensagem genérica.
      if (!clientError.response) { // Verifica se o erro é de rede ou configuração
          message.error('E-mail ou senha inválidos. Por favor, verifique seus dados.');
      }
    } finally {
      setLoading(false); // Garante que o loading seja desativado ao final de qualquer tentativa
    }
  };

  // --- Função para lidar com falha na validação do formulário ---
  const onFinishFailed = (errorInfo) => {
    console.log('Falha na validação do formulário:', errorInfo);
    message.error('Por favor, preencha todos os campos corretamente.');
  };

  return (
    <Layout className="login-page-layout">
      <HeaderLP />
      <Content className="login-page-content">
        <div className="login-card-container">
          <Title level={2} className="login-title">
            Bem-vindo de Volta!
          </Title>
          <Paragraph className="login-subtitle">
            Acesse sua conta para continuar gerenciando tudo com o MAP no Controle.
          </Paragraph>

          <Form name="login_form" className="login-form" onFinish={onFinish} onFinishFailed={onFinishFailed} layout="vertical">
            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, message: 'Por favor, insira seu e-mail!' },
                { type: 'email', message: 'Por favor, insira um e-mail válido!' } // Validação de formato de email
              ]}
            >
              <Input
                prefix={<MailOutlined className="site-form-item-icon" />}
                placeholder="seuemail@exemplo.com"
                size="large"
                autoComplete="email" // Sugestão para o navegador
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Senha"
              rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Sua senha"
                size="large"
                autoComplete="current-password" // Sugestão para o navegador
              />
            </Form.Item>

            <Form.Item className="login-form-options-simplified">
              <Link className="login-form-forgot" to="/esqueci-senha">
                Esqueceu sua senha?
              </Link>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="login-form-button" 
                size="large" 
                block 
                loading={loading}
              >
                Entrar
              </Button>
            </Form.Item>

            <Paragraph className="login-register-prompt">
              Ainda não tem uma conta? <Link to="/planos">Conheça nossos planos!</Link>
            </Paragraph>
          </Form>
        </div>
      </Content>
      <FooterLP />
    </Layout>
  );
};

export default LoginPage;