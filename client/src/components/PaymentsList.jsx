import React, { useEffect, useState } from 'react';
import { getPayments, deletePayment } from '../api';
import EditPaymentModal from './EditPaymentModal';

export default function PaymentsList({ user = 'Utilisateur', refreshTrigger }) {
  const [payments, setPayments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    // Ne pas charger si pas d'utilisateur
    if (!user || user.trim() === '') {
      setPayments([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getPayments(user);
      setPayments(data);
    } catch (e) {
      console.error(e);
      alert('Erreur récupération paiements: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user, refreshTrigger]);

  async function handleDelete(payment) {
    if (!window.confirm('Supprimer ce paiement ?')) return;
    try {
      await deletePayment(payment.id);
      load();
      alert('Paiement supprimé');
    } catch (err) {
      alert('Erreur suppression: ' + err.message);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  }

  function getStatusBadge(status) {
    const colors = {
      PAID: '#28a745',
      PENDING: '#ffc107',
      FAILED: '#dc3545',
      REFUNDED: '#6c757d'
    };
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        background: colors[status] || '#6c757d',
        color: '#fff',
        fontSize: '0.85em',
        fontWeight: 'bold'
      }}>
        {status || 'N/A'}
      </span>
    );
  }

  if (loading) return <div>Chargement des paiements...</div>;

  return (
    <div>
      <h2>Paiements de {user}</h2>
      {payments.length === 0 ? (
        <p>Aucun paiement trouvé.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Service</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Montant</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Mode</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Date</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Statut</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Référence</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  <strong>{payment.id}</strong>
                </td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  {payment.serviceId || 'N/A'}
                </td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  {payment.montant ? `${payment.montant.toFixed(2)} €` : 'N/A'}
                </td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  {payment.modePaiement || 'N/A'}
                </td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  {formatDate(payment.date)}
                </td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  {getStatusBadge(payment.status)}
                </td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  {payment.referenceFacture || '-'}
                </td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  <button 
                    onClick={() => setEditing(payment)}
                    style={{ marginRight: 5 }}
                  >
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(payment)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {editing && (
        <EditPaymentModal 
          payment={editing} 
          onClose={() => { 
            setEditing(null); 
            load(); 
          }} 
        />
      )}
    </div>
  );
}
