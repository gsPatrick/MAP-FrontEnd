// src/config/plans.js

// Mapeamento dos planos com base nos IDs usados na PricingSection e URLs.
const planData = {
  '1': { id: '1', name: 'Básico Mensal', price: 39.90 },
  '2': { id: '2', name: 'Básico Anual', price: 389.90 },
  '3': { id: '3', name: 'Avançado Mensal', price: 79.90 },
  '4': { id: '4', name: 'Avançado Anual', price: 789.90 },
};

export const getPlanById = (id) => {
  return planData[id] || null;
};