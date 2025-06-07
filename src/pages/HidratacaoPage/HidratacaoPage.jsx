// src/pages/HidratacaoPage/HidratacaoPage.jsx (MODIFICADO)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Typography, Button, Row, Col, Card, List, Progress,
  Empty, Tooltip, Modal, Form, TimePicker, InputNumber, Switch,
  Alert, Space, Avatar, Result, Select, Tag, Divider, Layout // Layout ainda é necessário para o Content
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ExperimentOutlined,
  CheckOutlined, SettingOutlined, InfoCircleOutlined, WarningOutlined, StopOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { message } from 'antd'; 

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api'; 

import './HidratacaoPage.css';

const logger = {
    warn: (text, obj) => console.warn(`[WARN] ${text}`, obj || ''),
    error: (text, obj) => console.error(`[ERROR] ${text}`, obj || ''),
    info: (text, obj) => console.log(`[INFO] ${text}`, obj || ''),
    debug: (text, obj) => console.debug(`[DEBUG] ${text}`, obj || ''),
};

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM = 15;

const HidratacaoPage = () => {
  const { 
    currentProfile,
    currentProfileType,
    setSelectedProfileId,
    userProfiles,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  const [dailyGoal, setDailyGoal] = useState(2000);
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderFrequencyType, setReminderFrequencyType] = useState('disabled');
  const [reminderCustomInterval, setReminderCustomInterval] = useState(120);
  const [reminderStartTime, setReminderStartTime] = useState('09:00');
  const [reminderEndTime, setReminderEndTime] = useState('18:00');   
  
  const [configLoading, setConfigLoading] = useState(true);

  const [waterIntakeList, setWaterIntakeList] = useState([]);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [settingsForm] = Form.useForm();
  const [customIntervalUnitModal, setCustomIntervalUnitModal] = useState('minutes'); 

  const LS_KEY_PREFIX = 'mapHidratacao_';
  
  const getLocalStorageKey = useCallback(() => {
    return `${LS_KEY_PREFIX}${currentProfile?.id || 'geral'}_${dayjs().format('YYYY-MM-DD')}`;
  }, [currentProfile]);

  const fetchHydrationPreferences = useCallback(async () => {
    if (!isAuthenticated || !currentProfile) {
        setConfigLoading(false);
        setDailyGoal(2000);
        setEnableReminder(false);
        setReminderFrequencyType('disabled');
        setReminderCustomInterval(120);
        setReminderStartTime('09:00');
        setReminderEndTime('18:00');
        return;
    }
    setConfigLoading(true);
    try {
      const response = await apiClient.get('/system/preferences');
      if (response.data && response.data.status === 'success') {
        const prefs = response.data.data;
        setDailyGoal(prefs.dailyGoalMl || 2000);
        setEnableReminder(prefs.enableWaterReminder || false);
        setReminderFrequencyType(prefs.waterReminderFrequencyType || 'disabled');
        setReminderCustomInterval(prefs.waterReminderCustomIntervalMinutes || 120);
        setReminderStartTime(prefs.waterReminderStartTime ? prefs.waterReminderStartTime.substring(0,5) : '09:00');
        setReminderEndTime(prefs.waterReminderEndTime ? prefs.waterReminderEndTime.substring(0,5) : '18:00');
      } else {
        message.warn("Configurações de hidratação não carregadas. Usando padrões.");
      }
    } catch (error) {
      console.error("Erro ao buscar preferências de hidratação:", error);
    } finally {
      setConfigLoading(false);
    }
  }, [isAuthenticated, currentProfile]);

  useEffect(() => {
    if (!loadingProfiles) {
        fetchHydrationPreferences();
    }
  }, [loadingProfiles, fetchHydrationPreferences]);

  const generateIntakeList = useCallback(() => {
    if (configLoading || !enableReminder || !reminderFrequencyType || reminderFrequencyType === 'disabled' || !reminderStartTime || !reminderEndTime) {
      setWaterIntakeList([]);
      return;
    }

    const list = [];
    let intervalMinutes;

    if (reminderFrequencyType === 'custom') {
      intervalMinutes = reminderCustomInterval > 0 ? parseInt(reminderCustomInterval, 10) : 120;
      if (isNaN(intervalMinutes) || intervalMinutes < MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM) { 
          logger.warn(`[HidratacaoPage] Intervalo customizado (em minutos) ${intervalMinutes} é menor que o mínimo do sistema (${MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM}min). Ajustando para ${MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM}min para geração da lista.`);
          intervalMinutes = MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM;
      }
    } else if (reminderFrequencyType === '2h' || reminderFrequencyType === '3h') {
      intervalMinutes = parseInt(reminderFrequencyType.replace('h', ''), 10) * 60;
    } else {
      logger.warn(`[HidratacaoPage] Tipo de frequência inválido: ${reminderFrequencyType}.`);
      setWaterIntakeList([]);
      return;
    }

    const start = dayjs(reminderStartTime, 'HH:mm');
    const end = dayjs(reminderEndTime, 'HH:mm');
    
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        logger.warn(`[HidratacaoPage] Horários de início/fim inválidos. Start: ${reminderStartTime}, End: ${reminderEndTime}`);
        setWaterIntakeList([]);
        return;
    }

    const durationTotalMinutes = end.diff(start, 'minute');
    let amountPerPortion = 250;
    let numberOfIntervals = 0;

    if (durationTotalMinutes >= 0 && intervalMinutes > 0) {
        numberOfIntervals = Math.floor(durationTotalMinutes / intervalMinutes) + 1;
    } else if (durationTotalMinutes >= 0 && intervalMinutes === 0) {
        numberOfIntervals = 1;
    }
    
    if (dailyGoal > 0 && numberOfIntervals > 0) {
        amountPerPortion = Math.max(100, Math.round(dailyGoal / numberOfIntervals / 50) * 50);
    } else if (dailyGoal > 0 && numberOfIntervals === 0 && durationTotalMinutes >= 0){
        amountPerPortion = dailyGoal;
        numberOfIntervals = 1; 
    }

    if (numberOfIntervals > 0) {
        let currentTime = start;
        let idCounter = 0;
        for (let i = 0; i < numberOfIntervals; i++) {
            if (currentTime.isAfter(end)) break; 
            if (list.length >= 25) break;
            list.push({
                id: `intake-${idCounter++}-${currentTime.format('HHmm')}`,
                time: currentTime.format('HH:mm'),
                amount: amountPerPortion,
                drank: false,
            });
            currentTime = currentTime.add(intervalMinutes, 'minute');
             if (intervalMinutes === 0 && i === 0) break;
        }
    }
    
    const storageKey = getLocalStorageKey();
    let savedState = {};
    try {
        const item = localStorage.getItem(storageKey);
        if (item) {
            savedState = JSON.parse(item);
        }
    } catch(e) {
        console.error("Erro ao ler localStorage para hidratação:", e);
    }
    
    const hydratedList = list.map(item => ({
        ...item,
        drank: savedState[item.id] || false,
    }));
    setWaterIntakeList(hydratedList);
  }, [dailyGoal, enableReminder, reminderFrequencyType, reminderCustomInterval, reminderStartTime, reminderEndTime, configLoading, getLocalStorageKey]);

  useEffect(() => {
    if(!configLoading && isAuthenticated && currentProfile){
        generateIntakeList();
    } else if (!isAuthenticated && !configLoading) {
        setWaterIntakeList([]);
    }
  }, [generateIntakeList, configLoading, isAuthenticated, currentProfile]);

  const totalDrankToday = useMemo(() => {
    return waterIntakeList.reduce((sum, r) => r.drank ? sum + r.amount : sum, 0);
  }, [waterIntakeList]);

  const progressPercent = useMemo(() => {
    return dailyGoal > 0 ? Math.min(Math.round((totalDrankToday / dailyGoal) * 100), 100) : 0;
  }, [totalDrankToday, dailyGoal]);

  const handleToggleDrank = (reminderId) => {
    const newList = waterIntakeList.map(r =>
      r.id === reminderId ? { ...r, drank: !r.drank } : r
    );
    setWaterIntakeList(newList);
    const storageKey = getLocalStorageKey();
    const currentState = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const itemChanged = newList.find(r => r.id === reminderId);
    if(itemChanged) {
        currentState[reminderId] = itemChanged.drank;
        localStorage.setItem(storageKey, JSON.stringify(currentState));
    }
  };
  
  const handleSaveReminderSettings = async (values) => {
    let intervalInMinutesFromForm = null; 
    if (values.enableReminder && values.reminderFrequencyType === 'custom') {
        const valueEntered = parseInt(values.reminderCustomIntervalValue, 10);
        if (values.reminderCustomIntervalUnit === 'hours') {
            intervalInMinutesFromForm = valueEntered * 60;
        } else {
            intervalInMinutesFromForm = valueEntered;
        }
        
        if (isNaN(intervalInMinutesFromForm) || intervalInMinutesFromForm < MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM) { 
            message.error(`Intervalo personalizado deve ser de no mínimo ${MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM} minutos.`);
            return;
        }
    }

    const dataToSave = {
        dailyGoalMl: values.dailyGoal,
        enableWaterReminder: values.enableReminder,
        waterReminderFrequencyType: values.enableReminder ? values.reminderFrequencyType : 'disabled',
        waterReminderCustomIntervalMinutes: intervalInMinutesFromForm, 
        waterReminderStartTime: values.enableReminder && values.reminderStartTime ? values.reminderStartTime.format('HH:mm:ss') : '09:00:00',
        waterReminderEndTime: values.enableReminder && values.reminderEndTime ? values.reminderEndTime.format('HH:mm:ss') : '18:00:00',
    };

    setConfigLoading(true);
    try {
        await apiClient.put('/system/preferences', dataToSave);
        message.success("Configurações de hidratação salvas!");
        
        setDailyGoal(dataToSave.dailyGoalMl);
        setEnableReminder(dataToSave.enableWaterReminder);
        setReminderFrequencyType(dataToSave.waterReminderFrequencyType);
        setReminderCustomInterval(dataToSave.waterReminderCustomIntervalMinutes !== null ? dataToSave.waterReminderCustomIntervalMinutes : 120); 
        setReminderStartTime(dataToSave.waterReminderStartTime.substring(0,5));
        setReminderEndTime(dataToSave.waterReminderEndTime.substring(0,5));
        
        setIsSettingsModalVisible(false);
    } catch (error) {
      console.error("Erro ao salvar configurações de hidratação:", error);
    } finally {
      setConfigLoading(false); 
    }
  };
  
  const openSettingsModal = () => {
      let displayIntervalValue = reminderCustomInterval;
      let displayIntervalUnit = 'minutes';
      if (reminderCustomInterval && reminderCustomInterval >= 60 && reminderCustomInterval % 60 === 0) {
          displayIntervalValue = reminderCustomInterval / 60;
          displayIntervalUnit = 'hours';
      }
      setCustomIntervalUnitModal(displayIntervalUnit); 

      settingsForm.setFieldsValue({
          dailyGoal: dailyGoal,
          enableReminder: enableReminder,
          reminderFrequencyType: reminderFrequencyType,
          reminderCustomIntervalValue: displayIntervalValue,
          reminderCustomIntervalUnit: displayIntervalUnit,
          reminderStartTime: reminderStartTime ? dayjs(reminderStartTime, 'HH:mm') : null,
          reminderEndTime: reminderEndTime ? dayjs(reminderEndTime, 'HH:mm') : null,
      });
      setIsSettingsModalVisible(true);
  };

  if (!loadingProfiles && currentProfileType !== 'PF' && isAuthenticated) {
    const pfProfile = userProfiles.find(p => p.type === 'PF');
    return (
      <Content className="restricted-access-content">
        <Result
          icon={<StopOutlined style={{color: 'var(--map-laranja)'}}/>}
          status="warning"
          title="Funcionalidade Apenas para Perfil Pessoal"
          subTitle={`A página de Lembretes de Hidratação é destinada ao uso pessoal. O perfil "${currentProfile?.name || 'Atual'}" (${currentProfileType}) não é compatível.`}
          extra={
            pfProfile ? (
              <Button type="primary" className="switch-profile-btn-restricted" onClick={() => setSelectedProfileId(pfProfile.id)}>
                Mudar para Perfil Pessoal ({pfProfile.name})
              </Button>
            ) : (
              <Text>Nenhum perfil pessoal encontrado para alternar.</Text>
            )
          }
        />
      </Content>
    );
  }
  
  if (loadingProfiles || (configLoading && isAuthenticated)) {
     return (
        <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
            <ExperimentOutlined style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>
        </Content>
    );
  }
  if (!isAuthenticated && !loadingProfiles) {
      return (
        <Content style={{padding: 50, textAlign: 'center'}}>
            <Title level={3}>Acesso Negado</Title>
            <Paragraph>Você precisa estar logado para acessar esta página.</Paragraph>
        </Content>
      );
  }
  if (!currentProfile && isAuthenticated && !loadingProfiles) {
      return (
        <Content style={{padding:50, textAlign:'center'}}>
            <Title level={3}>Nenhum Perfil Selecionado</Title>
            <Paragraph>Por favor, selecione um perfil para continuar.</Paragraph>
        </Content>
      );
  }

  return (
    <Content className="panel-content-area hidratacao-content">
      <div className="hidratacao-header">
        <Space align="center">
          <ExperimentOutlined className="page-icon-hidratacao" />
          <Title level={2} className="page-title-hidratacao">Meus Lembretes de Água</Title>
        </Space>
        <Button type="primary" icon={<SettingOutlined />} onClick={openSettingsModal} className="btn-config-hidratacao">
          Configurar Lembretes
        </Button>
      </div>
      <Paragraph type="secondary" className="page-subtitle-hidratacao">
        Mantenha-se hidratado! Acompanhe seus lembretes e registre seu consumo de água diário.
        (Perfil: <Text strong>{currentProfile?.name}</Text>)
      </Paragraph>

      <Row gutter={[24, 24]} align="middle" style={{ marginBottom: '30px' }}>
        <Col xs={24} md={10} lg={8}>
          <Card bordered={false} className="progress-card-hidratacao">
            <Title level={4} style={{textAlign: 'center', marginBottom: '20px'}}>Progresso Diário</Title>
            <Progress
              type="dashboard"
              percent={progressPercent}
              width={180}
              strokeColor={{ '0%': 'var(--map-dourado)', '100%': 'var(--map-laranja)' }}
              trailColor="rgba(0,0,0,0.06)"
              format={() => <span style={{color: 'var(--map-laranja)', fontWeight: '600'}}>{`${totalDrankToday}ml`}</span>}
            />
            <Paragraph style={{textAlign: 'center', marginTop: '15px', fontSize: '14px'}}>
              Meta: <Text strong>{dailyGoal}ml</Text>
            </Paragraph>
            {progressPercent >= 100 && (
                <Alert message="Parabéns! Meta de hidratação atingida!" type="success" showIcon style={{marginTop: '15px'}}/>
            )}
          </Card>
        </Col>
        <Col xs={24} md={14} lg={16}>
          <Card title="Lembretes de Hoje (Metas de Consumo)" bordered={false} className="reminders-list-card-hidratacao">
            {waterIntakeList.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={waterIntakeList}
                renderItem={(item) => (
                  <List.Item
                    className={`reminder-item ${item.drank ? 'drank' : ''}`}
                    actions={[
                      <Tooltip title={item.drank ? "Marcar como não bebido" : "Marcar como bebido"}>
                        <Button 
                          shape="circle" 
                          icon={item.drank ? <CheckOutlined /> : <ExperimentOutlined />} 
                          onClick={() => handleToggleDrank(item.id)}
                          type={item.drank ? "primary" : "default"}
                          className="btn-toggle-drank"
                        />
                      </Tooltip>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar className="reminder-time-avatar">{item.time}</Avatar>}
                      title={<Text strong className="reminder-amount">{item.amount} ml</Text>}
                      description={item.drank ? <Tag color="green" icon={<CheckCircleOutlined/>}>Consumido!</Tag> : <Tag color="blue">Pendente</Tag>}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description={!enableReminder || reminderFrequencyType === 'disabled' ? "Lembretes de água desativados." : "Nenhum horário de consumo. Verifique as configurações."} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Configurar Lembretes de Hidratação"
        open={isSettingsModalVisible}
        onCancel={() => setIsSettingsModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
        className="config-hidratacao-modal modal-style-map"
      >
        <Form 
            form={settingsForm} 
            layout="vertical" 
            onFinish={handleSaveReminderSettings}
            key={isSettingsModalVisible ? 'form-visible-hydration' : 'form-hidden-hydration'} 
        >
          <Form.Item name="dailyGoal" label="Meta Diária de Água (ml)" rules={[{required: true, message: "Meta é obrigatória"}]}>
            <InputNumber min={0} step={100} style={{ width: '100%' }} placeholder="Ex: 2000" />
          </Form.Item>
          
          <Form.Item name="enableReminder" label="Ativar Lembretes de Água no WhatsApp" valuePropName="checked">
            <Switch onChange={(checked) => settingsForm.setFieldsValue({ enableReminder: checked })}/>
          </Form.Item>

        <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
                prevValues.enableReminder !== currentValues.enableReminder || 
                prevValues.reminderFrequencyType !== currentValues.reminderFrequencyType ||
                prevValues.reminderCustomIntervalUnit !== currentValues.reminderCustomIntervalUnit
            }
        >
            {({ getFieldValue }) => getFieldValue('enableReminder') && (
                <>
                    <Form.Item name="reminderFrequencyType" label="Frequência dos Lembretes" rules={[{required: getFieldValue('enableReminder'), message: "Frequência é obrigatória"}]}>
                        <Select 
                            placeholder="Selecione a frequência" 
                            onChange={(value) => {
                                settingsForm.setFieldsValue({reminderFrequencyType: value});
                                if (value !== 'custom') {
                                    settingsForm.setFieldsValue({ reminderCustomIntervalValue: undefined, reminderCustomIntervalUnit: 'minutes' });
                                    setCustomIntervalUnitModal('minutes');
                                }
                            }}
                        >
                            <Option value="disabled">Desabilitado (sem lembretes)</Option>
                            <Option value="2h">A cada 2 horas</Option>
                            <Option value="3h">A cada 3 horas</Option>
                            <Option value="custom">Intervalo Personalizado</Option>
                        </Select>
                    </Form.Item>

                    {getFieldValue('reminderFrequencyType') === 'custom' && (
                        <Form.Item label="Intervalo Personalizado">
                            <Space.Compact style={{width: '100%'}}>
                                <Form.Item 
                                    name="reminderCustomIntervalValue" 
                                    noStyle
                                    rules={[{
                                        required: getFieldValue('reminderFrequencyType') === 'custom', 
                                        message: "Valor!"
                                    },{
                                        validator: (_, value) => {
                                            const unit = settingsForm.getFieldValue('reminderCustomIntervalUnit') || customIntervalUnitModal;
                                            let valInMinutes = value;
                                            if (unit === 'hours') {
                                                valInMinutes = value * 60;
                                            }
                                            if (getFieldValue('reminderFrequencyType') === 'custom' && valInMinutes < MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM) {
                                                return Promise.reject(new Error(`Mínimo ${MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM} minutos!`));
                                            }
                                            return Promise.resolve();
                                        }
                                    }]}
                                >
                                    <InputNumber 
                                        min={ (settingsForm.getFieldValue('reminderCustomIntervalUnit') || customIntervalUnitModal) === 'minutes' ? MIN_CUSTOM_INTERVAL_IN_MINUTES_SYSTEM : 1 } 
                                        style={{ width: '60%' }} 
                                        placeholder="Valor"
                                    />
                                </Form.Item>
                                <Form.Item 
                                    name="reminderCustomIntervalUnit" 
                                    noStyle
                                    rules={[{required: getFieldValue('reminderFrequencyType') === 'custom', message: "Unid.!"}]}
                                >
                                    <Select 
                                        style={{ width: '40%' }} 
                                        onChange={(value) => {
                                            settingsForm.setFieldsValue({ reminderCustomIntervalUnit: value });
                                            settingsForm.validateFields(['reminderCustomIntervalValue']);
                                        }}
                                    >
                                        <Option value="minutes">Minutos</Option>
                                        <Option value="hours">Horas</Option>
                                    </Select>
                                </Form.Item>
                            </Space.Compact>
                        </Form.Item>
                    )}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="reminderStartTime" label="Horário de Início" rules={[{required: getFieldValue('enableReminder'), message: "Início é obrigatório"}]}>
                                <TimePicker format="HH:mm" style={{width: '100%'}} placeholder="Ex: 09:00" minuteStep={15}/>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="reminderEndTime" label="Horário de Fim" rules={[{required: getFieldValue('enableReminder'), message: "Fim é obrigatório"}]}>
                                <TimePicker format="HH:mm" style={{width: '100%'}} placeholder="Ex: 18:00" minuteStep={15}/>
                            </Form.Item>
                        </Col>
                    </Row>
                </>
            )}
        </Form.Item>
          <Divider />
          <Form.Item style={{marginTop: '20px', textAlign: 'right'}}>
            <Button onClick={() => setIsSettingsModalVisible(false)} style={{marginRight: 8}} className="cancel-btn-form">
                Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={configLoading} className="submit-btn-form">
              Salvar Configurações
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
};

export default HidratacaoPage;