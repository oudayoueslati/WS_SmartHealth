# Composants Paiements - Guide d'utilisation

## Vue d'ensemble

Le module de paiements comprend 5 composants React pour gérer le CRUD complet des paiements dans l'application SmartHealth.

## Composants disponibles

### 1. PaymentForm
Formulaire de création de nouveaux paiements.

**Props:**
- `onSaved` (function, optional): Callback appelé après la création réussie
- `defaultUser` (string, optional): Utilisateur par défaut (ex: "Utilisateur_John")

**Exemple:**
```jsx
import PaymentForm from './components/PaymentForm';

<PaymentForm 
  defaultUser="Utilisateur_John"
  onSaved={() => console.log('Paiement créé!')}
/>
```

---

### 2. PaymentsList
Liste des paiements avec actions de modification et suppression.

**Props:**
- `user` (string, required): ID de l'utilisateur dont on veut voir les paiements

**Exemple:**
```jsx
import PaymentsList from './components/PaymentsList';

<PaymentsList user="Utilisateur_John" />
```

**Fonctionnalités:**
- Affichage en tableau avec toutes les informations
- Badges colorés pour les statuts
- Boutons Modifier et Supprimer
- Modal d'édition intégré

---

### 3. EditPaymentModal
Modal pour modifier un paiement existant.

**Props:**
- `payment` (object, required): Objet paiement à modifier
- `onClose` (function, required): Callback pour fermer le modal

**Exemple:**
```jsx
import EditPaymentModal from './components/EditPaymentModal';

const payment = {
  id: "Paiement_abc123",
  montant: 80.0,
  modePaiement: "Carte",
  status: "PAID",
  date: "2025-11-03",
  referenceFacture: "F2025-001"
};

<EditPaymentModal 
  payment={payment}
  onClose={() => setEditing(null)}
/>
```

---

### 4. PaymentStats
Affiche les statistiques de paiement d'un utilisateur.

**Props:**
- `user` (string, optional): ID de l'utilisateur (default: "Utilisateur_John")

**Exemple:**
```jsx
import PaymentStats from './components/PaymentStats';

<PaymentStats user="Utilisateur_John" />
```

**Affiche:**
- Total des paiements
- Montant total
- Montant moyen

---

### 5. PaymentsPage
Page complète combinant tous les composants.

**Props:** Aucune

**Exemple:**
```jsx
import PaymentsPage from './components/PaymentsPage';

// Dans votre router
<Route path="/payments" element={<PaymentsPage />} />
```

**Inclut:**
- Sélecteur d'utilisateur
- Statistiques
- Formulaire de création
- Liste des paiements

---

## Installation

### 1. Installer les dépendances backend
```bash
cd server
npm install uuid
```

### 2. Démarrer le serveur
```bash
cd server
npm start
# Serveur sur http://localhost:5000
```

### 3. Configurer le client
Assurez-vous que `REACT_APP_SERVER_BASE` pointe vers votre serveur:
```env
REACT_APP_SERVER_BASE=http://localhost:5000
```

---

## Utilisation dans votre application

### Option 1: Utiliser la page complète
```jsx
import PaymentsPage from './components/PaymentsPage';

function App() {
  return (
    <div>
      <PaymentsPage />
    </div>
  );
}
```

### Option 2: Composer vos propres layouts
```jsx
import PaymentForm from './components/PaymentForm';
import PaymentsList from './components/PaymentsList';
import PaymentStats from './components/PaymentStats';

function CustomPaymentsView() {
  const [user, setUser] = useState('Utilisateur_John');
  
  return (
    <div>
      <h1>Mes Paiements</h1>
      <PaymentStats user={user} />
      <PaymentsList user={user} />
    </div>
  );
}
```

---

## API Functions

Les fonctions API sont disponibles dans `src/api.js`:

```javascript
import { 
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats 
} from './api';

// Récupérer les paiements
const payments = await getPayments('Utilisateur_John');

// Créer un paiement
await createPayment({
  user: 'Utilisateur_John',
  service: 'Consultation_001',
  montant: 80.0,
  modePaiement: 'Carte',
  status: 'PAID'
});

// Mettre à jour
await updatePayment('Paiement_abc123', {
  status: 'REFUNDED'
});

// Supprimer
await deletePayment('Paiement_abc123');

// Statistiques
const stats = await getPaymentStats('Utilisateur_John');
```

---

## Modes de paiement disponibles

- `Carte`
- `Espèces`
- `Virement`
- `Chèque`
- `Assurance`

## Statuts de paiement

- `PAID` - Payé (badge vert)
- `PENDING` - En attente (badge jaune)
- `FAILED` - Échoué (badge rouge)
- `REFUNDED` - Remboursé (badge gris)

---

## Structure des données

### Objet Payment
```javascript
{
  id: "Paiement_abc123",
  uri: "http://www.smarthealth-tracker.com/ontologie#Paiement_abc123",
  montant: 80.0,
  date: "2025-11-03",
  serviceId: "Consultation_001",
  serviceUri: "http://www.smarthealth-tracker.com/ontologie#Consultation_001",
  status: "PAID",
  referenceFacture: "F2025-001",
  modePaiement: "Carte"
}
```

### Objet Stats
```javascript
{
  total: 5,
  totalMontant: 450.0,
  avgMontant: 90.0
}
```

---

## Personnalisation

### Styles
Tous les composants utilisent des styles inline. Pour personnaliser:

1. Créez un fichier CSS:
```css
/* payments.css */
.payment-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 8px;
}
```

2. Importez et utilisez:
```jsx
import './payments.css';
```

### Thèmes
Les couleurs des badges de statut peuvent être modifiées dans `PaymentsList.jsx`:
```javascript
const colors = {
  PAID: '#28a745',    // Vert
  PENDING: '#ffc107', // Jaune
  FAILED: '#dc3545',  // Rouge
  REFUNDED: '#6c757d' // Gris
};
```

---

## Dépannage

### Erreur: "user query param required"
- Assurez-vous de passer le paramètre `user` à `PaymentsList`

### Erreur: "SPARQL Query Error"
- Vérifiez que Fuseki est démarré sur le bon port
- Vérifiez la variable `FUSEKI_URL` dans `.env`

### Les paiements ne s'affichent pas
- Vérifiez que l'utilisateur existe dans la base de données
- Vérifiez la console pour les erreurs réseau

### Le formulaire ne se soumet pas
- Vérifiez que tous les champs obligatoires sont remplis
- Vérifiez que le service sélectionné existe

---

## Support

Pour plus d'informations sur l'API backend, consultez:
`server/routes/PAYMENTS_API.md`
