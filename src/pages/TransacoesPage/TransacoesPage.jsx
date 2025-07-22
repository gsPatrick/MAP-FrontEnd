import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaPlus, FaPen, FaTrash, FaTag, FaEllipsisV, FaSearch } from 'react-icons/fa';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Contexto
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// Modais (reutilizados)
import ModalNovaReceita from '../../modals/ModalNovaReceita/ModalNovaReceita';
import ModalNovaDespesa from '../../modals/ModalNovaDespesa/ModalNovaDespesa';

import './TransacoesPage.css';

dayjs.locale('pt-br');

// --- Componente de Card de Transação (NOVO LAYOUT) ---
const TransactionCard = ({ transaction, onEdit, onDelete }) => {
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

    const isPaid = transaction.isPaidOrReceived;
    const isIncome = transaction.type === 'Entrada';
    let status = '';
    if (isIncome) {
        status = isPaid ? 'Recebido' : 'A Receber';
    } else {
        status = isPaid ? 'Pago' : 'A Pagar';
    }
    
    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="transaction-card">
            <div className="card-main-info">
                <span className="card-description">{transaction.description}</span>
                <span className={`card-value ${isIncome ? 'income' : 'expense'}`}>
                    {formatCurrency(transaction.value)}
                </span>
            </div>
            
            <div className="card-metadata">
                <span className={`card-category ${isIncome ? 'income' : 'expense'}`}>
                    <FaTag /> {transaction.category?.name || 'Sem Categoria'}
                </span>
                <span className="card-date">{dayjs(transaction.transactionDate).format('DD/MM/YYYY')}</span>
                <div className="card-menu-container" ref={menuRef}>
                    <button className="card-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
                        <FaEllipsisV />
                    </button>
                    {menuOpen && (
                        <div className="card-menu">
                            <button onClick={() => { onEdit(transaction); setMenuOpen(false); }}><FaPen /> Editar</button>
                            <button onClick={() => { onDelete(transaction); setMenuOpen(false); }} className="danger"><FaTrash /> Excluir</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card-status-wrapper">
                <span className={`card-status-tag ${status.replace(' ', '-').toLowerCase()}`}>{status}</span>
            </div>
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


const TransacoesPage = () => {
    const { currentProfile, loadingProfiles, isAuthenticated } = useProfile();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [filterType, setFilterType] = useState('todas'); // 'todas', 'pago', 'recebido', 'a_pagar'
    const [filterDescription, setFilterDescription] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12; // Aumentado para preencher melhor o grid

    // Modais
    const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [transactionTypeForModal, setTransactionTypeForModal] = useState('Saída');
    const [isConfirmDeleteModalVisible, setIsConfirmDeleteModalVisible] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const fetchTransactions = useCallback(async () => {
        if (!currentProfile) return;
        setLoading(true);
        
        let params = {
            search: filterDescription || undefined,
            sortBy: 'transactionDate',
            sortOrder: 'DESC',
            limit: 1000
        };

        try {
            const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/transactions`, { params });
            setTransactions(response.data.transactions || []);
        } catch (error) {
            console.error("Erro ao buscar transações:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [currentProfile, filterDescription]);

    useEffect(() => {
        if (isAuthenticated && currentProfile) {
            fetchTransactions();
        }
    }, [isAuthenticated, currentProfile, fetchTransactions]);

    const filteredTransactions = useMemo(() => {
        if (filterType === 'todas') {
            return transactions;
        }
        return transactions.filter(t => {
            const isIncome = t.type === 'Entrada';
            const isPaid = t.isPaidOrReceived;
            if (filterType === 'pago') return !isIncome && isPaid;
            if (filterType === 'recebido') return isIncome && isPaid;
            if (filterType === 'a_pagar') return !isPaid;
            return false;
        });
    }, [transactions, filterType]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    
    const handleOpenModal = (type, transaction = null) => {
        setTransactionTypeForModal(type);
        setEditingTransaction(transaction);
        setIsTransactionModalVisible(true);
    };

    const handleDeleteClick = (transaction) => {
        setTransactionToDelete(transaction);
        setIsConfirmDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete || !currentProfile) return;
        try {
            await apiClient.delete(`/financial-accounts/${currentProfile.id}/transactions/${transactionToDelete.id}`);
            fetchTransactions();
        } catch (error) {
            console.error("Erro ao excluir transação:", error);
        } finally {
            setIsConfirmDeleteModalVisible(false);
            setTransactionToDelete(null);
        }
    };
    
    if (loadingProfiles) return <div className="loading-container"><p>Carregando perfil...</p></div>;
    if (!isAuthenticated) return <div className="loading-container"><p>Acesso negado.</p></div>;
    if (!currentProfile) return <div className="loading-container"><p>Nenhum perfil selecionado.</p></div>;

    return (
        <main className="transactions-container-clean">
            <header className="page-header-clean">
                <h1>Transações</h1>
                <p>Verifique suas transações completas.</p>
            </header>

            <div className="filter-controls">
                <button onClick={() => setFilterType('todas')} className={filterType === 'todas' ? 'active' : ''}>Todas</button>
                <button onClick={() => setFilterType('pago')} className={filterType === 'pago' ? 'active' : ''}>Pagos</button>
                <button onClick={() => setFilterType('recebido')} className={filterType === 'recebido' ? 'active' : ''}>Recebidos</button>
                <button onClick={() => setFilterType('a_pagar')} className={filterType === 'a_pagar' ? 'active' : ''}>A Pagar/Receber</button>
            </div>
            
            <div className="search-bar-container">
                <FaSearch className="search-icon" />
                <input 
                    type="search" 
                    placeholder="Pesquisar por descrição, categoria..." 
                    value={filterDescription}
                    onChange={e => setFilterDescription(e.target.value)}
                />
            </div>
            
            <div className="add-buttons-container">
                 <button className="btn-add income" onClick={() => handleOpenModal('Entrada')}><FaPlus /> Nova Receita</button>
                 <button className="btn-add expense" onClick={() => handleOpenModal('Saída')}><FaPlus /> Nova Despesa</button>
            </div>


            <section className="transaction-list">
                {loading ? (
                    <p className="loading-text">Carregando transações...</p>
                ) : paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map(t => (
                        <TransactionCard 
                            key={t.id} 
                            transaction={t}
                            onEdit={() => handleOpenModal(t.type, t)}
                            onDelete={() => handleDeleteClick(t)}
                        />
                    ))
                ) : (
                    <div className="empty-state-container">
                        <p className="empty-text">Nenhuma transação encontrada.</p>
                    </div>
                )}
            </section>

            {totalPages > 1 && (
                <div className="pagination-controls-clean">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</button>
                    <span className="page-number active">{currentPage}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próximo</button>
                </div>
            )}

            {isTransactionModalVisible && (
              transactionTypeForModal === 'Entrada' ? (
                  <ModalNovaReceita
                      open={isTransactionModalVisible}
                      onCancel={() => setIsTransactionModalVisible(false)}
                      onSuccess={() => { fetchTransactions(); setIsTransactionModalVisible(false); }}
                      currentProfile={currentProfile}
                      editingTransaction={editingTransaction}
                  />
              ) : (
                  <ModalNovaDespesa
                      open={isTransactionModalVisible}
                      onCancel={() => setIsTransactionModalVisible(false)}
                      onSuccess={() => { fetchTransactions(); setIsTransactionModalVisible(false); }}
                      currentProfile={currentProfile}
                      editingTransaction={editingTransaction}
                  />
              )
            )}

            <ConfirmationModal
                isOpen={isConfirmDeleteModalVisible}
                onClose={() => setIsConfirmDeleteModalVisible(false)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
            >
                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </ConfirmationModal>
        </main>
    );
};

export default TransacoesPage;