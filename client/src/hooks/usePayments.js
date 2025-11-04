import { useState, useEffect, useCallback } from 'react';
import { 
  getPayments, 
  createPayment, 
  updatePayment, 
  deletePayment,
  getPaymentStats 
} from '../api';

/**
 * Hook personnalisé pour gérer les paiements
 * Best practice React: https://react.dev/learn/reusing-logic-with-custom-hooks
 */
export function usePayments(userId) {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les paiements
  const loadPayments = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getPayments(userId);
      setPayments(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const data = await getPaymentStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [userId]);

  // Charger au montage et quand userId change
  useEffect(() => {
    loadPayments();
    loadStats();
  }, [loadPayments, loadStats]);

  // Créer un paiement
  const create = useCallback(async (paymentData) => {
    setError(null);
    try {
      await createPayment(paymentData);
      await loadPayments(); // Recharger la liste
      await loadStats(); // Recharger les stats
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadPayments, loadStats]);

  // Mettre à jour un paiement
  const update = useCallback(async (id, paymentData) => {
    setError(null);
    try {
      await updatePayment(id, paymentData);
      await loadPayments(); // Recharger la liste
      await loadStats(); // Recharger les stats
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadPayments, loadStats]);

  // Supprimer un paiement
  const remove = useCallback(async (id) => {
    setError(null);
    try {
      await deletePayment(id);
      await loadPayments(); // Recharger la liste
      await loadStats(); // Recharger les stats
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadPayments, loadStats]);

  // Trouver un paiement par ID
  const findById = useCallback((id) => {
    return payments.find(p => p.id === id);
  }, [payments]);

  // Filtrer par statut
  const filterByStatus = useCallback((status) => {
    return payments.filter(p => p.status === status);
  }, [payments]);

  // Filtrer par service
  const filterByService = useCallback((serviceId) => {
    return payments.filter(p => p.serviceId === serviceId);
  }, [payments]);

  // Calculer le total
  const calculateTotal = useCallback(() => {
    return payments.reduce((sum, p) => sum + (p.montant || 0), 0);
  }, [payments]);

  // Grouper par mois
  const groupByMonth = useCallback(() => {
    return payments.reduce((acc, payment) => {
      if (!payment.date) return acc;
      const month = payment.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = [];
      acc[month].push(payment);
      return acc;
    }, {});
  }, [payments]);

  return {
    payments,
    stats,
    loading,
    error,
    loadPayments,
    loadStats,
    create,
    update,
    remove,
    findById,
    filterByStatus,
    filterByService,
    calculateTotal,
    groupByMonth
  };
}
