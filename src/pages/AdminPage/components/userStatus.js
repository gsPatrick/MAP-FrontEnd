// src/pages/AdminPage/components/userStatus.js
// Fonte única de verdade para "Plano" e "Situação" do usuário no painel admin.
import dayjs from 'dayjs';

export const planNameMapping = {
  basico_mensal: 'Básico Mensal',
  basico_anual: 'Básico Anual',
  avancado_mensal: 'Avançado Mensal',
  avancado_anual: 'Avançado Anual',
  vitalicio_basico: 'Vitalício Básico',
  vitalicio_avancado: 'Vitalício Avançado',
};

const NON_PLAN = ['inadimplente', 'gratuito', null, undefined, ''];

// Plano REAL do usuário, ou "Sem plano".
export const getPlano = (level) => {
  if (NON_PLAN.includes(level)) return { label: 'Sem plano', color: 'default', group: 'sem_plano' };
  if (level.startsWith('vitalicio_')) return { label: planNameMapping[level] || level, color: 'gold', group: 'vitalicio' };
  if (level.includes('avancado')) return { label: planNameMapping[level] || level, color: 'geekblue', group: 'avancado' };
  if (level.includes('basico')) return { label: planNameMapping[level] || level, color: 'blue', group: 'basico' };
  return { label: planNameMapping[level] || level, color: 'default', group: 'outro' };
};

// Situação PADRONIZADA: Pagamento efetuado | Aguardando pagamento | Inadimplente
// (+ Bloqueado / Excluído para o ciclo de vida da conta).
export const getSituacao = (record) => {
  if (record.status === 'Inativo') return { label: 'Excluído', color: 'default' };
  if (record.status === 'Bloqueado') return { label: 'Bloqueado', color: 'red' };
  if (record.status === 'Aguardando Pagamento' || record.status === 'Pagamento Falhou') {
    return { label: 'Aguardando pagamento', color: 'gold' };
  }

  const lvl = record.accessLevel;
  const isPaidLevel = lvl && !['inadimplente', 'gratuito'].includes(lvl);
  if (isPaidLevel) {
    if (lvl.startsWith('vitalicio_')) return { label: 'Pagamento efetuado', color: 'green' };
    if (record.accessExpiresAt && dayjs(record.accessExpiresAt).endOf('day').isAfter(dayjs())) {
      return { label: 'Pagamento efetuado', color: 'green' };
    }
  }
  // Expirado, sem plano, etc. -> tudo padronizado como Inadimplente.
  return { label: 'Inadimplente', color: 'red' };
};

// Opções para os filtros combináveis da listagem.
export const PLANO_FILTER_OPTIONS = [
  { value: 'basico', label: 'Básico' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'vitalicio', label: 'Vitalício' },
  { value: 'sem_plano', label: 'Sem plano' },
];

export const SITUACAO_FILTER_OPTIONS = [
  { value: 'Pagamento efetuado', label: 'Pagamento efetuado' },
  { value: 'Aguardando pagamento', label: 'Aguardando pagamento' },
  { value: 'Inadimplente', label: 'Inadimplente' },
  { value: 'Bloqueado', label: 'Bloqueado' },
];
