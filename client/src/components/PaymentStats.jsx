import React, { useEffect, useState } from 'react';
import { getPaymentStats } from '../api';

export default function PaymentStats({ user = 'Utilisateur', refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      // Ne pas charger si pas d'utilisateur
      if (!user || user.trim() === '') {
        setStats(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const data = await getPaymentStats(user);
        setStats(data);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user, refreshTrigger]);

  if (loading) return <div>Chargement des statistiques...</div>;
  if (error) return <div style={{ color: 'red' }}>Erreur: {error}</div>;
  if (!stats) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 20,
      marginBottom: 20,
      flexWrap: 'wrap'
    }}>
      <div style={{
        flex: 1,
        minWidth: 200,
        padding: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
          Total Paiements
        </div>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {stats.total}
        </div>
      </div>

      <div style={{
        flex: 1,
        minWidth: 200,
        padding: 20,
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
          Montant Total
        </div>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {stats.totalMontant.toFixed(2)} €
        </div>
      </div>

      <div style={{
        flex: 1,
        minWidth: 200,
        padding: 20,
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
          Montant Moyen
        </div>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {stats.avgMontant.toFixed(2)} €
        </div>
      </div>
    </div>
  );
}
