// src/pages/LoginPage/LoginPage.jsx
import React, { useEffect, useState } from 'react'; // Adicionado useState
import { Layout, Form, Input, Button, Typography, message } from 'antd'; // Adicionado message
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

// Importar HeaderLP e FooterLP
 import HeaderLP from '../../componentsLP/Header/Header';
 import FooterLP from '../../componentsLP/FooterLP/FooterLP';
import './LoginPage.css';

// Importar o apiClient
import apiClient from '../../services/api'; // Ajuste o caminho se necessário
import { useProfile } from '../../contexts/ProfileContext'; // Importar para atualizar o perfil no login

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Estado para o loading do botão
  const { setSelectedProfileId, fetchUserProfiles } = useProfile(); // Usar fetchUserProfiles do contexto

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

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Seu backend espera 'identifier' e 'password' para /auth/client/login
      const response = await apiClient.post('/auth/client/login', {
        identifier: values.email, // Mapeia 'email' do formulário para 'identifier'
        password: values.password,
      });

      if (response.data && response.data.status === 'success' && response.data.data.token) {
        const { token, client, financialAccounts } = response.data.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(client)); // Salva dados do cliente

        // Lógica para definir o perfil selecionado
        // Se houver contas financeiras, tenta usar a default ou a primeira
        // Se não houver, o ProfileContext deve lidar com isso ao buscar perfis (pode não ter perfis ainda)
        let initialProfileId = null;
        if (financialAccounts && financialAccounts.length > 0) {
            const defaultAccount = financialAccounts.find(acc => acc.isDefault);
            initialProfileId = defaultAccount ? defaultAccount.id : financialAccounts[0].id;
        }
        
        if (initialProfileId) {
            localStorage.setItem('selectedProfileId', initialProfileId);
            setSelectedProfileId(initialProfileId); // Atualiza o contexto diretamente se possível
        } else {
            localStorage.removeItem('selectedProfileId');
            setSelectedProfileId(null);
        }
        
        // Força a busca dos perfis atualizados pelo ProfileContext
        // A função fetchUserProfiles deve ser implementada no ProfileContext
        if (typeof fetchUserProfiles === 'function') {
            await fetchUserProfiles(); // Espera buscar os perfis antes de navegar
        } else {
            // Se fetchUserProfiles não estiver disponível, pode ser necessário um reload ou
            // uma estrutura onde o App detecta o login e força o reload do contexto.
            // Para uma melhor UX, é ideal que o ProfileContext se atualize.
            console.warn("ProfileContext não possui fetchUserProfiles. Perfis podem não ser atualizados imediatamente.");
        }

        message.success(`Login bem-sucedido! Bem-vindo, ${client.name || client.email}!`);
        navigate('/painel');
      } else {
        // Caso a API retorne sucesso mas sem token, ou formato inesperado
        message.error(response.data?.message || 'Falha no login. Resposta inesperada do servidor.');
      }
    } catch (error) {
      // Os erros da API já são tratados pelo interceptor do apiClient e mostram uma mensagem.
      // Aqui podemos logar ou tratar especificidades, se necessário.
      console.error('Erro no login:', error);

      // Adiciona uma mensagem específica para erro de email/senha (ex: status 401 ou 400 com mensagem relevante)
      // A label do campo é "E-mail ou Telefone", então a mensagem reflete isso.
      if (error.response && 
          (error.response.status === 401 || 
           (error.response.status === 400 && error.response.data?.message && typeof error.response.data.message === 'string' && error.response.data.message.toLowerCase().includes('credenciais')) || // Exemplo: "Credenciais inválidas"
           (error.response.status === 400 && error.response.data?.message && typeof error.response.data.message === 'string' && error.response.data.message.toLowerCase().includes('inválido')) // Exemplo: "Usuário ou senha inválido"
          )
         ) {
        message.error('E-mail/telefone ou senha inválidos. Por favor, tente novamente.');
      } else {
        // Para outros erros, assume-se que o interceptor do apiClient (se configurado para tal)
        // já exibiu uma mensagem adequada (ex: error.response.data.message).
        // Se o interceptor não exibir mensagens ou uma mensagem genérica for desejada aqui como fallback,
        // ela poderia ser adicionada, mas com cuidado para não duplicar mensagens.
        // Exemplo de fallback (se o interceptor não cobrir):
        // if (!error.response?.data?.message) {
        //   message.error('Ocorreu uma falha ao tentar fazer login. Tente novamente mais tarde.');
        // }
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Falha ao submeter:', errorInfo);
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

          <Form
            name="login_form"
            className="login-form"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
          >
            <Form.Item
              name="email"
              label="E-mail ou Telefone" // Ajustado para refletir 'identifier'
              rules={[{ required: true, message: 'Por favor, insira seu e-mail ou telefone!' }]}
            >
              <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="seuemail@exemplo.com ou 55119..." size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Senha"
              rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
            >
              <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Sua senha" size="large" />
            </Form.Item>

            <Form.Item className="login-form-options-simplified">
              <Link className="login-form-forgot" to="/esqueci-senha">
                Esqueceu sua senha?
              </Link>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button" size="large" block loading={loading}>
                Entrar
              </Button>
            </Form.Item>

            <Paragraph className="login-register-prompt">
              Ainda não tem uma conta? <Link to="/registro">Crie uma agora!</Link>
            </Paragraph>
          </Form>
        </div>
      </Content>
       <FooterLP /> 
    </Layout>
  );
};

export default LoginPage;