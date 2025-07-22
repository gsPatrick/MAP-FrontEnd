import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlus, FaPen, FaTrash, FaRetweet, FaBell, FaCheckCircle, FaEllipsisV } from 'react-icons/fa';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import ModalNovaRecorrencia from '../../modals/ModalNovaRecorrencia/ModalNovaRecorrencia';

import './RecorrenciasPage.css';

dayjs.locale('pt-br');

// --- Helpers ---
const frequencyMap = {
  daily: 'Diária', weekly: 'Semanal', 'bi-weekly': 'Quinzenal', monthly: 'Mensal',
  quarterly: 'Trimestral', 'semi-annually': 'Semestral', annually: 'Anual',
};
const translateFrequency = (freq) => frequencyMap[freq] || freq;
const formatCurrency = (value) => (parseFloat(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


// --- Componente de Card de Recorrência ---
const RecurrenceCard = ({ recurrence, onEdit, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div className="recurrence-card">
            <header className="card-header">
                <span className="recurrence-description">{recurrence.description}</span>
                <span className={`recurrence-value ${recurrence.type.toLowerCase()}`}>{formatCurrency(recurrence.value)}</span>
            </header>
            <div className="card-body">
                <div className="recurrence-meta-item">
                    <span className="meta-label">Tipo:</span>
                    <span className={`tag ${recurrence.type.toLowerCase()}`}>{recurrence.type}</span>
                </div>
                <div className="recurrence-meta-item">
                    <span className="meta-label">Frequência:</span>
                    <span>{translateFrequency(recurrence.frequency)}</span>
                </div>
                <div className="recurrence-meta-item">
                    <span className="meta-label">Próxima Data:</span>
                    <span>{recurrence.nextDueDate ? dayjs(recurrence.nextDueDate).format('DD/MM/YYYY') : 'N/A'}</span>
                </div>
            </div>
            <footer className="card-footer">
                <span className={`recurrence-status ${recurrence.isActive ? 'ativa' : 'inativa'}`}>
                    {recurrence.isActive ? 'Ativa' : 'Inativa'}
                </span>
                <span className="auto-action-status">
                    {recurrence.autoCreateTransaction ? <FaCheckCircle /> : <FaBell />}
                    {recurrence.autoCreateTransaction ? 'Cria Transação' : 'Apenas Lembra'}
                </span>
                <div className="card-menu-container" ref={menuRef}>
                    <button className="card-menu-button" onClick={() => setMenuOpen(!menuOpen)}><FaEllipsisV /></button>
                    {menuOpen && (
                        <div className="card-menu">
                            <button onClick={() => { onEdit(recurrence); setMenuOpen(false); }}><FaPen /> Editar</button>
                            <button onClick={() => { onDelete(recurrence); setMenuOpen(false); }} className="danger"><FaTrash /> Excluir</button>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
};


// --- Componente de Modal de Confirmação ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content confirmation-modal">
                <h3 className="modal-title">{title}</h3>
                <p className="confirmation-text">{children}</p>
                <div className="confirmation-actions">
                    <button onClick={onClose} className="btn-cancel">Cancelar</button>
                    <button onClick={onConfirm} className="btn-confirm-danger">Excluir</button>
                </div>
            </div>
        </div>
    );
};


const RecorrenciasPage = () => {
  const { currentProfile, loadingProfiles, isAuthenticated } = useProfile();

  const [recurrences, setRecurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('todas'); 
  const [filterStatus, setFilterStatus] = useState('todas'); 

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState(null);

  const [isConfirmDeleteModalVisible, setIsConfirmDeleteModalVisible] = useState(false);
  const [recurrenceToDelete, setRecurrenceToDelete] = useState(null);

  const fetchRecurrences = useCallback(async () => {
    if (!currentProfile || !isAuthenticated) {
      setRecurrences([]); setLoading(false); return;
    }
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'todas') params.type = filterType; 
      if (filterStatus === 'ativa') params.isActive = true;
      if (filterStatus === 'inativa') params.isActive = false;
      
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/recurring-rules`, { params });
      setRecurrences(response.data?.data?.rules || []);
    } catch (error) {
      console.error("Erro ao carregar recorrências:", error);
      setRecurrences([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile, isAuthenticated, filterType, filterStatus]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated) {
        fetchRecurrences();
    }
  }, [fetchRecurrences, loadingProfiles, isAuthenticated]);


  const handleOpenModal = (recurrence = null) => {
    setEditingRecurrence(recurrence);
    setIsModalVisible(true);
  };
  
  const handleDeleteClick = (recurrence) => {
    setRecurrenceToDelete(recurrence);
    setIsConfirmDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!recurrenceToDelete || !currentProfile) return;
    try {
        await apiClient.delete(`/financial-accounts/${currentProfile.id}/recurring-rules/${recurrenceToDelete.id}`);
        fetchRecurrences();
    } catch (error) {
        console.error("Erro ao excluir recorrência:", error);
    } finally {
        setIsConfirmDeleteModalVisible(false);
        setRecurrenceToDelete(null);
    }
  };

  if (loadingProfiles) return <div className="loading-container"><p>Carregando perfil...</p></div>;
  if (!isAuthenticated) return <div className="loading-container"><p>Acesso negado.</p></div>;
  if (!currentProfile) return <div className="loading-container"><p>Nenhum perfil selecionado.</p></div>;

  return (
    <main className="recurrences-container">
      <header className="page-header-recurrence">
        <h1><FaRetweet /> Gerenciar Recorrências</h1>
        <p>Configure suas receitas e despesas recorrentes do perfil: <strong>{currentProfile.name}</strong></p>
      </header>

      <section className="filter-controls-recurrence">
        <div className="filter-group">
            <label>Tipo</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="todas">Todas</option>
                <option value="Entrada">Receitas</option>
                <option value="Saída">Despesas</option>
            </select>
        </div>
        <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="todas">Todos</option>
                <option value="ativa">Ativas</option>
                <option value="inativa">Inativas</option>
            </select>
        </div>
        <button className="btn-add-recurrence" onClick={() => handleOpenModal()}><FaPlus /> Nova Recorrência</button>
      </section>

      <section className="recurrence-list">
        {loading ? (
            <p className="loading-text">Carregando...</p>
        ) : recurrences.length > 0 ? (
            recurrences.map(rec => (
                <RecurrenceCard 
                    key={rec.id} 
                    recurrence={rec}
                    onEdit={() => handleOpenModal(rec)}
                    onDelete={() => handleDeleteClick(rec)}
                />
            ))
        ) : (
            <div className="empty-state-container">
                <p className="empty-text">Nenhuma recorrência encontrada.</p>
            </div>
        )}
      </section>

      <ModalNovaRecorrencia
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => { fetchRecurrences(); setIsModalVisible(false); }}
        currentProfile={currentProfile}
        editingRecorrencia={editingRecurrence}
      />
      
      <ConfirmationModal
          isOpen={isConfirmDeleteModalVisible}
          onClose={() => setIsConfirmDeleteModalVisible(false)}
          onConfirm={confirmDelete}
          title="Confirmar Exclusão"
      >
          Tem certeza que deseja excluir a recorrência "{recurrenceToDelete?.description}"?
      </ConfirmationModal>
    </main>
  );
};

export default RecorrenciasPage;