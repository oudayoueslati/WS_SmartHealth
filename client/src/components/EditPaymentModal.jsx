import React, { useState } from 'react';
import { updatePayment } from '../api';

const PAYMENT_MODES = ['Carte', 'Espèces', 'Virement', 'Chèque', 'Assurance'];
const PAYMENT_STATUS = ['PAID', 'PENDING', 'FAILED', 'REFUNDED'];

export default function EditPaymentModal({ payment, onClose }) {
  const [montant, setMontant] = useState(payment.montant || '');
  const [modePaiement, setModePaiement] = useState(payment.modePaiement || 'Carte');
  const [status, setStatus] = useState(payment.status || 'PAID');
  const [referenceFacture, setReferenceFacture] = useState(payment.referenceFacture || '');
  const [date, setDate] = useState(payment.date ? payment.date.split('T')[0] : '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updates = {};
      if (montant !== payment.montant) updates.montant = parseFloat(montant);
      if (modePaiement !== payment.modePaiement) updates.modePaiement = modePaiement;
      if (status !== payment.status) updates.status = status;
      if (referenceFacture !== payment.referenceFacture) updates.referenceFacture = referenceFacture;
      if (date !== payment.date?.split('T')[0]) updates.date = date;

      await updatePayment(payment.id, updates);
      alert('Paiement mis à jour');
      onClose();
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        padding: 30,
        minWidth: 400,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h3>Modifier le paiement {payment.id}</h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Montant (€)
          </label>
          <input 
            type="number" 
            step="0.01"
            value={montant} 
            onChange={e => setMontant(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Mode de paiement
          </label>
          <select 
            value={modePaiement} 
            onChange={e => setModePaiement(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          >
            {PAYMENT_MODES.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Statut
          </label>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          >
            {PAYMENT_STATUS.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Date
          </label>
          <input 
            type="date"
            value={date} 
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Référence facture
          </label>
          <input 
            value={referenceFacture} 
            onChange={e => setReferenceFacture(e.target.value)}
            placeholder="F2025-001"
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px 20px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 20px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
