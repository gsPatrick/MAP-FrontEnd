import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout, Input, Button, Avatar, List, Typography, Space, Spin, Modal, message } from 'antd';
import {
  SendOutlined, UserOutlined, RobotOutlined, PlusOutlined, ExperimentOutlined,
  SearchOutlined, EditOutlined, LoadingOutlined, DeleteOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';
import './ChatbotPage.css';

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

const CHAT_STORAGE_PREFIX = 'mapSiteChat_';

const ChatbotPage = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [actionSuggestions, setActionSuggestions] = useState([]);
  const [resourceCurrentlyEditing, setResourceCurrentlyEditing] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const userNameForHeader = currentProfile?.ownerClient?.name?.split(" ")[0] || currentProfile?.name?.split(" ")[0] || "Usuário Chat";
  
  const userSessionId = useMemo(() => {
    if (currentProfile?.ownerClient?.id) {
        return `client_${currentProfile.ownerClient.id}`;
    } else if (isAuthenticated && currentProfile?.clientId) {
        return `client_${currentProfile.clientId}`;
    } else if (isAuthenticated && currentProfile?.id) {
        return `profile_${currentProfile.id}`;
    }
    return null;
  }, [currentProfile, isAuthenticated]);

  const storageKey = useMemo(() => userSessionId ? `${CHAT_STORAGE_PREFIX}${userSessionId}` : null, [userSessionId]);

  const saveChatStateToLocalStorage = (currentMessages, currentInputValue, currentActionSuggestions, currentEditingResource) => {
    if (!storageKey) return;
    try {
      const stateToSave = {
        messages: currentMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
        })),
        inputValue: currentInputValue,
        actionSuggestions: currentActionSuggestions,
        resourceCurrentlyEditing: currentEditingResource, // Salva o contexto de edição
        lastActivity: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Erro ao salvar estado do chat no localStorage:", error);
    }
  };

  useEffect(() => {
    if (storageKey && !loadingProfiles && isAuthenticated && currentProfile) {
      try {
        const savedStateString = localStorage.getItem(storageKey);
        if (savedStateString) {
          const savedState = JSON.parse(savedStateString);
          const restoredMessages = savedState.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp) 
          }));
          setMessages(restoredMessages);
          setInputValue(savedState.inputValue || '');
          setActionSuggestions(savedState.actionSuggestions || []);
          setResourceCurrentlyEditing(savedState.resourceCurrentlyEditing || null); // Restaura contexto de edição
          console.log("Estado do chat restaurado do localStorage para:", storageKey);
        } else {
          setMessages([
            {
              id: `init-${Date.now()}`,
              text: `Olá! Sou seu assistente MAP para o perfil **${currentProfile.name}**. Como posso te ajudar hoje?`,
              sender: 'ai',
              timestamp: new Date(),
              resourceContext: null
            }
          ]);
          setInputValue('');
          setActionSuggestions([]);
          setResourceCurrentlyEditing(null);
        }
      } catch (error) {
        console.error("Erro ao restaurar estado do chat do localStorage:", error);
        setMessages([{ id: `init-error-${Date.now()}`, text: "Olá! Como posso ajudar?", sender: 'ai', timestamp: new Date(), resourceContext: null }]);
        setResourceCurrentlyEditing(null);
      }
    } else if (!loadingProfiles && !isAuthenticated) {
        setMessages([{id: 'auth-error', text: "Por favor, faça login para usar o chat.", sender: 'ai', timestamp: new Date(), resourceContext: null}]);
        setResourceCurrentlyEditing(null);
    } else if (!loadingProfiles && isAuthenticated && !currentProfile) {
        setMessages([{id: 'profile-error', text: "Nenhum perfil financeiro selecionado. Por favor, selecione um.", sender: 'ai', timestamp: new Date(), resourceContext: null}]);
        setResourceCurrentlyEditing(null);
    }
    inputRef.current?.focus();
  }, [storageKey, loadingProfiles, isAuthenticated, currentProfile]);


  useEffect(() => {
    if (storageKey && (messages.length > 0 || resourceCurrentlyEditing !== null)) {
      saveChatStateToLocalStorage(messages, inputValue, actionSuggestions, resourceCurrentlyEditing);
    }
  }, [messages, inputValue, actionSuggestions, resourceCurrentlyEditing, storageKey]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isAiTyping]);


  const sendChatMessageToApi = async (messageContent, payloadForBackend = {}) => {
    if (messageContent.trim() === '' || isAiTyping || !currentProfile || !isAuthenticated || !storageKey) return;

    const userMsgObject = {
      id: `msg-${Date.now()}-user`,
      text: messageContent,
      sender: 'user',
      timestamp: new Date(),
      resourceContext: null
    };
    
    setMessages(prev => [...prev, userMsgObject]);
    
    let nextInputValue = inputValue;
    if (!payloadForBackend.suggestionClickedValueKeepsInput && !payloadForBackend.isEditActionInitiation) {
        nextInputValue = '';
        setInputValue('');
    }
    setIsAiTyping(true);
    const nextActionSuggestions = []; 
    setActionSuggestions(nextActionSuggestions);

    try {
      const apiPayload = {
        message: messageContent,
        activeProfileId: currentProfile.id,
        userSessionId: userSessionId,
        payloadFromFrontend: {
            ...payloadForBackend,
            // Envia o resourceCurrentlyEditing se estiver setado e NÃO for uma iniciação de edição
            // (porque na iniciação, o payloadForBackend.editingResourceContextFromFrontend já tem essa info)
            resourceBeingEdited: (resourceCurrentlyEditing && !payloadForBackend.isEditActionInitiation)
              ? { id: resourceCurrentlyEditing.id, type: resourceCurrentlyEditing.type, description: resourceCurrentlyEditing.description } 
              : (payloadForBackend.editingResourceContextFromFrontend || null) // Se for iniciação, usa o que veio
        }
      };
      
      const response = await apiClient.post('/chat/send-message', apiPayload);
      
      if (response.data && response.data.status === 'success' && response.data.data) {
        const serviceResponse = response.data.data;
        const aiMsgObject = {
          id: `msg-${Date.now()}-ai`,
          text: serviceResponse.replyText || "Desculpe, não entendi bem. Pode tentar de outra forma?",
          sender: 'ai',
          timestamp: new Date(),
          resourceContext: serviceResponse.resourceForUiContext || null,
        };
        setMessages(prev => [...prev, aiMsgObject]); 
        
        if (serviceResponse.suggestions && serviceResponse.suggestions.length > 0 && !serviceResponse.resourceForUiContext) {
          setActionSuggestions(serviceResponse.suggestions);
        }

        // Se a IA confirmou que uma edição foi feita OU se a IA não pediu clarificação e não detectou um UPDATE,
        // significa que o fluxo de edição pode ter sido concluído ou abandonado.
        if (serviceResponse.actionWasAnEdit) {
            console.log("Frontend: Edição confirmada pelo backend, limpando resourceCurrentlyEditing.");
            setResourceCurrentlyEditing(null);
        } else if (resourceCurrentlyEditing && 
                   (!serviceResponse.clarifications_needed || serviceResponse.clarifications_needed.length === 0) &&
                   (!serviceResponse.detected_actions || !serviceResponse.detected_actions.some(a => (a.action || a.action_type)?.startsWith("UPDATE_")))) {
            // Verifica se a resposta da IA ainda é sobre a edição. Se não for, limpa.
            // Esta lógica pode ser complexa, pois a IA pode responder algo genérico.
            // O ideal é a IA explicitamente indicar que o fluxo de edição terminou ou mudou.
            // Por ora, se não for um UPDATE e não pedir clarificação, assumimos que saiu do fluxo de edição.
            const isStillEditingRelated = serviceResponse.replyText?.toLowerCase().includes(resourceCurrentlyEditing.description.toLowerCase());
            if (!isStillEditingRelated) {
                console.log("Frontend: Conversa mudou de rumo ou IA não entendeu edição, limpando resourceCurrentlyEditing.");
                setResourceCurrentlyEditing(null);
            }
        }

      } else {
          throw new Error(response.data?.message || "Resposta inválida do servidor de chat.");
      }

    } catch (error) {
      console.error("Erro ao enviar/receber mensagem do chat:", error);
      const errorText = error.response?.data?.message || "Desculpe, não consegui processar sua mensagem. Tente novamente.";
      const errorResponse = {
        id: `err-${Date.now()}-ai`,
        text: errorText,
        sender: 'ai',
        timestamp: new Date(),
        resourceContext: null
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleUserMessageSend = () => {
    sendChatMessageToApi(inputValue);
  };
  
  const handleSuggestionClick = (suggestion) => {
    let messageToSend = suggestion.label;
    let payload = { suggestionClickedValue: suggestion.id };
    if (suggestion.command) messageToSend = suggestion.command;
    sendChatMessageToApi(messageToSend, payload);
  };

  const handleEditResource = (resource) => {
    setResourceCurrentlyEditing({
        id: resource.id,
        type: resource.type,
        description: resource.description
    });
    const editInitiationMessage = `Quero editar o item: "${resource.description}" (ID: ${resource.id})`;
    sendChatMessageToApi(editInitiationMessage, { 
        isEditActionInitiation: true, 
        editingResourceContextFromFrontend: { // Envia o contexto para o backend iniciar o state.editingResource
            type: resource.type, 
            id: resource.id, 
            description: resource.description 
        } 
    });
    // A IA deve responder pedindo os detalhes da edição.
    // O usuário então digitará as alterações, e o resourceCurrentlyEditing (do frontend)
    // será enviado no payload para o backend saber qual item está sendo alterado.
  };

  const handleDeleteResource = (resource) => {
    let endpoint = '';
    const resourceName = resource.description || `item ID ${resource.id}`;

    switch(resource.type) {
        case 'transaction': endpoint = `/financial-accounts/${currentProfile.id}/transactions/${resource.id}`; break;
        case 'appointment': endpoint = `/financial-accounts/${currentProfile.id}/appointments/${resource.id}`; break;
        case 'credit_card': endpoint = `/financial-accounts/${currentProfile.id}/credit-cards/${resource.id}`; break;
        case 'recurring_rule': endpoint = `/financial-accounts/${currentProfile.id}/recurring-rules/${resource.id}`; break;
        case 'product': endpoint = `/financial-accounts/${currentProfile.id}/products/${resource.id}`; break;
        case 'parcelled_account': endpoint = `/financial-accounts/${currentProfile.id}/transactions/parcelled-group/${resource.id}`; break;
        default:
            message.error(`Tipo de recurso desconhecido para exclusão: ${resource.type}`);
            return;
    }

    Modal.confirm({
        title: 'Confirmar Exclusão',
        content: `Tem certeza que deseja excluir "${resourceName}"? Esta ação não pode ser desfeita.`,
        okText: 'Excluir',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk: async () => {
            const confirmDeleteUserMessage = {
                id: `user-confirm-delete-${resource.id}-${Date.now()}`,
                text: `Sim, pode excluir "${resourceName}".`,
                sender: 'user',
                timestamp: new Date(),
                resourceContext: null
            };
            setMessages(prev => [...prev, confirmDeleteUserMessage]);
            setIsAiTyping(true);
            setActionSuggestions([]);

            try {
                await apiClient.delete(endpoint);
                const successMsg = {
                    id: `delete-confirm-ai-${Date.now()}`,
                    text: `"${resourceName}" foi excluído com sucesso! 👍`,
                    sender: 'ai',
                    timestamp: new Date(),
                    resourceContext: null
                };
                setMessages(prev => [...prev, successMsg]);
            } catch (error) {
                console.error(`Erro ao excluir ${resource.type} ID ${resource.id}:`, error);
                const errorMsg = {
                    id: `delete-error-ai-${Date.now()}`,
                    text: `Ops! Não consegui excluir "${resourceName}". ${error.response?.data?.message || 'Tente novamente.'}`,
                    sender: 'ai',
                    timestamp: new Date(),
                    resourceContext: null
                };
                setMessages(prev => [...prev, errorMsg]);
            } finally {
                setIsAiTyping(false);
            }
        }
    });
  };

  const predefinedActions = useMemo(() => {
    if (!currentProfile) return [];
    return [
      { id: "ask_despesa_exemplo", label: currentProfile.type === 'PJ' ? "Lançar despesa R$500 Fornecedor X" : "Lançar despesa R$50 Alimentação", icon: <PlusOutlined/> },
      { id: "ask_receita_exemplo", label: currentProfile.type === 'PJ' ? "Lançar receita R$2000 Cliente Y" : "Lançar receita R$100 Bico Z", icon: <PlusOutlined/> },
      { id: "ask_summary_month", label: "Ver resumo deste mês", icon: <SearchOutlined/> },
      { id: "ask_appointment_example", label: currentProfile.type === 'PJ' ? "Agendar reunião equipe amanhã 10h" : "Lembrar pagar aluguel dia 5", icon: <EditOutlined/> },
    ];
  }, [currentProfile]);

  if (loadingProfiles && !userSessionId) {
    return (
      <Layout style={{ minHeight: '100vh' }} className="chatbot-page-layout">
        <SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={currentProfile?.type} />
        <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220 }}>
          <HeaderPanel userName={userNameForHeader} appName={sidebarCollapsed ? "" : "MAP Chat"}/>
          <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
            <LoadingOutlined style={{fontSize: 48, color: 'var(--map-dourado)'}} spin/>
            <Text style={{marginLeft: 15, fontSize: 16, color: 'var(--chatbot-text-secondary)'}}>Carregando dados do chat...</Text>
          </Content>
        </Layout>
      </Layout>
    );
  }
  if (!isAuthenticated && !loadingProfiles){
      return (
          <Layout style={{ minHeight: '100vh' }} className="chatbot-page-layout">
                <SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={null} />
                <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220 }}>
                <HeaderPanel userName={"Visitante"} appName={sidebarCollapsed ? "" : "MAP Chat"}/>
                    <Content className="chatbot-content-area">
                        <div className="chat-container" style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
                            <RobotOutlined style={{fontSize: 60, color: 'var(--chatbot-text-secondary)', marginBottom: 20}}/>
                            <Title level={3} style={{color: 'var(--chatbot-text-secondary)'}}>Acesso Negado</Title>
                            <Paragraph style={{color: 'var(--chatbot-text-secondary)'}}>Você precisa estar logado para usar o assistente.</Paragraph>
                            <Button type="primary" onClick={() => window.location.href='/login'} className="login-button-chat">Ir para Login</Button>
                        </div>
                    </Content>
                </Layout>
          </Layout>
      )
  }
   if (!currentProfile && isAuthenticated && !loadingProfiles){
      return (
          <Layout style={{ minHeight: '100vh' }} className="chatbot-page-layout">
                <SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={null} />
                <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220 }}>
                <HeaderPanel userName={userNameForHeader} appName={sidebarCollapsed ? "" : "MAP Chat"}/>
                     <Content className="chatbot-content-area">
                        <div className="chat-container" style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
                             <RobotOutlined style={{fontSize: 60, color: 'var(--chatbot-text-secondary)', marginBottom: 20}}/>
                            <Title level={3} style={{color: 'var(--chatbot-text-secondary)'}}>Nenhum Perfil Selecionado</Title>
                            <Paragraph style={{color: 'var(--chatbot-text-secondary)'}}>
                                Por favor, selecione um perfil (PF/PJ) no topo da página para interagir com o assistente.
                            </Paragraph>
                             <Button type="primary" onClick={() => window.location.href='/painel/meu-perfil'} className="profile-button-chat">Configurar Perfis</Button>
                        </div>
                    </Content>
                </Layout>
          </Layout>
      )
  }

  return (
    <Layout style={{ minHeight: '100vh' }} className="chatbot-page-layout">
      <SidebarPanel
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        selectedProfileType={currentProfile?.type}
      />
      <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220, transition: 'margin-left 0.2s ease' }}>
        <HeaderPanel
          userName={userNameForHeader}
          appName={sidebarCollapsed ? "" : "MAP Chat"}
        />
        <Content className="chatbot-content-area">
          <div className="chat-container">
            {(storageKey && messages.length <= 1 && !isAiTyping && predefinedActions.length > 0 && !messages.find(m => m.resourceContext)) && (
              <div className="chat-initial-screen">
                <div className="initial-icon-wrapper">
                  <RobotOutlined className="initial-icon" />
                </div>
                <Title level={2} className="initial-title animated-text">
                  Pronto para ajudar com <Text style={{color: 'var(--map-dourado)'}}>{currentProfile?.name}</Text>!
                </Title>
                <Paragraph className="initial-subtitle animated-text" style={{ animationDelay: '0.2s' }}>
                  Sou seu assistente financeiro. Pergunte-me qualquer coisa ou escolha uma sugestão abaixo.
                </Paragraph>
                <Space wrap size={[12, 16]} justify="center" className="initial-actions-container">
                  {predefinedActions.map((action, index) => (
                    <Button
                      key={action.id}
                      className="initial-action-button animated-button"
                      style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                      icon={action.icon || <ExperimentOutlined />}
                      onClick={() => handleSuggestionClick(action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Space>
              </div>
            )}

            <div className="messages-list">
              {messages.map((msg) => (
                <React.Fragment key={msg.id}>
                  <div
                    className={`message-item ${msg.sender === 'user' ? 'user-message' : 'ai-message'} message-appear`}
                  >
                    <Avatar
                      className="message-avatar"
                      icon={msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    />
                    <div className="message-content">
                      <div className="message-bubble">
                        {msg.sender === 'ai' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown> 
                        ) : (
                          <Paragraph className="message-text" style={{marginBottom: 0}}>{msg.text}</Paragraph>
                        )}
                      </div>
                      <Text className="message-timestamp">
                        {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </div>
                  </div>
                  {msg.sender === 'ai' && msg.resourceContext && (
                    <div className="resource-actions-chat">
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={() => handleEditResource(msg.resourceContext)}
                            className="resource-action-btn edit"
                        >
                            Editar "{msg.resourceContext.description.substring(0,15)}{msg.resourceContext.description.length > 15 ? '...' : ''}"
                        </Button>
                        <Button 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeleteResource(msg.resourceContext)}
                            className="resource-action-btn delete"
                            danger
                        >
                            Excluir
                        </Button>
                    </div>
                  )}
                </React.Fragment>
              ))}
              {isAiTyping && (
                <div className="message-item ai-message typing-indicator message-appear">
                  <Avatar className="message-avatar" icon={<RobotOutlined />} />
                  <div className="message-content">
                    <div className="message-bubble">
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: 'var(--chatbot-text-primary)' }} spin />} />
                      <Text style={{ marginLeft: 8, color: 'var(--chatbot-text-primary)', opacity: 0.8 }}>Digitando...</Text>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {actionSuggestions.length > 0 && !isAiTyping && (
                <div className="suggestions-area">
                    <Text strong style={{color: 'var(--chatbot-text-secondary)', marginBottom: 8, display: 'block'}}>Sugestões:</Text>
                    <Space wrap size={[8,12]}>
                        {actionSuggestions.map(sugg => (
                            <Button key={sugg.id} onClick={() => handleSuggestionClick(sugg)} className="suggestion-button">
                                {sugg.label}
                            </Button>
                        ))}
                    </Space>
                </div>
            )}

            <div className="chat-input-area">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleUserMessageSend}
                placeholder={currentProfile && storageKey ? `Converse com seu assistente (${currentProfile.name})...` : "Carregando assistente..."}
                className="chat-input"
                size="large"
                disabled={isAiTyping || !currentProfile || loadingProfiles || !isAuthenticated || !storageKey}
                suffix={
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleUserMessageSend}
                    className="send-button"
                    disabled={!inputValue.trim() || isAiTyping || !currentProfile || loadingProfiles || !isAuthenticated || !storageKey}
                    loading={isAiTyping}
                  />
                }
              />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatbotPage;