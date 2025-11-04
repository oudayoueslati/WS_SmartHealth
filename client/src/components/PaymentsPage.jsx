import React, { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import PaymentsList from './PaymentsList';
import PaymentStats from './PaymentStats';
import { getUsers } from '../api';

/**
 * Page complète de gestion des paiements
 * Combine le formulaire, la liste et les statistiques
 */
export default function PaymentsPage() {
  const [currentUser, setCurrentUser] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Charger les utilisateurs depuis la base
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const response = await getUsers();
        const usersList = response.users || [];
        setUsers(usersList);
        // Sélectionner le premier utilisateur par défaut
        if (usersList.length > 0 && !currentUser) {
          setCurrentUser(usersList[0].username);
        }
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err);
        alert('❌ Erreur lors du chargement des utilisateurs');
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  // Fonction pour rafraîchir la liste après création/modification
  const handlePaymentSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 30 }}>Gestion des Paiements</h1>

      {/* Sélecteur d'utilisateur */}
      <div style={{ marginBottom: 30 }}>
        <label style={{ marginRight: 10, fontWeight: 'bold' }}>
          Utilisateur:
        </label>
        <select 
          value={currentUser} 
          onChange={e => setCurrentUser(e.target.value)}
          style={{ padding: 8, fontSize: 16 }}
          disabled={loadingUsers}
        >
          {loadingUsers ? (
            <option value="">⏳ Chargement des utilisateurs...</option>
          ) : users.length === 0 ? (
            <option value="">Aucun utilisateur trouvé</option>
          ) : (
            users.map((user, index) => (
              <option key={`${user.username}_${user.email}_${index}`} value={user.username}>
                {user.fullName || user.username} ({user.email})
              </option>
            ))
          )}
        </select>
        {!loadingUsers && users.length > 0 && (
          <span style={{ marginLeft: 10, color: '#28a745' }}>
            ✅ {users.length} utilisateur{users.length > 1 ? 's' : ''} chargé{users.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Statistiques */}
      <PaymentStats user={currentUser} refreshTrigger={refreshKey} />

      {/* Formulaire de création */}
      <div style={{
        background: '#f8f9fa',
        padding: 20,
        borderRadius: 8,
        marginBottom: 30
      }}>
        <PaymentForm 
          defaultUser={currentUser}
          onSaved={handlePaymentSaved}
        />
      </div>

      {/* Liste des paiements */}
      <PaymentsList 
        user={currentUser} 
        refreshTrigger={refreshKey}
      />
    </div>
  );
}
