# Tests du Module Paiements

## Prérequis

1. **Fuseki** doit être démarré sur `http://localhost:3030/smarthealth`
2. **Backend** doit être démarré sur `http://localhost:5000`
3. **Frontend** doit être démarré sur `http://localhost:3000`

---

## Installation

### Backend
```bash
cd server
npm install uuid
npm start
```

### Frontend
```bash
cd client
npm start
```

---

## Tests Backend (API)

### 1. Test de création de paiement

```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Utilisateur_John",
    "service": "Consultation_001",
    "montant": 80.0,
    "modePaiement": "Carte",
    "status": "PAID",
    "referenceFacture": "F2025-001"
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "payment": {
    "id": "Paiement_...",
    "user": "Utilisateur_John",
    "service": "Consultation_001",
    "montant": 80,
    "modePaiement": "Carte",
    "date": "2025-11-03",
    "status": "PAID",
    "referenceFacture": "F2025-001"
  }
}
```

---

### 2. Test de récupération des paiements

```bash
curl http://localhost:5000/api/payments?user=Utilisateur_John
```

**Résultat attendu:**
```json
{
  "success": true,
  "payments": [
    {
      "id": "Paiement_...",
      "montant": 80,
      "date": "2025-11-03",
      "serviceId": "Consultation_001",
      "status": "PAID",
      "referenceFacture": "F2025-001",
      "modePaiement": "Carte"
    }
  ]
}
```

---

### 3. Test de mise à jour

Remplacez `PAYMENT_ID` par l'ID réel:

```bash
curl -X PUT http://localhost:5000/api/payments/PAYMENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REFUNDED",
    "montant": 90.0
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Payment updated successfully",
  "payment": {
    "id": "PAYMENT_ID",
    "status": "REFUNDED",
    "montant": 90
  }
}
```

---

### 4. Test des statistiques

```bash
curl http://localhost:5000/api/payments/stats/Utilisateur_John
```

**Résultat attendu:**
```json
{
  "success": true,
  "stats": {
    "total": 1,
    "totalMontant": 80,
    "avgMontant": 80
  }
}
```

---

### 5. Test de suppression

```bash
curl -X DELETE http://localhost:5000/api/payments/PAYMENT_ID
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Payment deleted successfully"
}
```

---

## Tests Frontend (Interface)

### Test 1: Affichage de la page
1. Ouvrir `http://localhost:3000`
2. Naviguer vers la page des paiements
3. Vérifier que les composants s'affichent correctement

### Test 2: Création d'un paiement
1. Remplir le formulaire:
   - Utilisateur: `Utilisateur_John`
   - Service: Sélectionner un service
   - Montant: `80.00`
   - Mode: `Carte`
   - Statut: `PAID`
2. Cliquer sur "Créer le paiement"
3. Vérifier l'alerte de succès
4. Vérifier que le paiement apparaît dans la liste

### Test 3: Affichage des statistiques
1. Vérifier que les 3 cartes de statistiques s'affichent:
   - Total Paiements
   - Montant Total
   - Montant Moyen
2. Vérifier que les valeurs sont correctes

### Test 4: Modification d'un paiement
1. Cliquer sur "Modifier" pour un paiement
2. Modifier le montant ou le statut
3. Cliquer sur "Sauvegarder"
4. Vérifier que les modifications sont appliquées

### Test 5: Suppression d'un paiement
1. Cliquer sur "Supprimer" pour un paiement
2. Confirmer la suppression
3. Vérifier que le paiement disparaît de la liste

### Test 6: Changement d'utilisateur
1. Changer l'utilisateur dans le sélecteur
2. Vérifier que la liste se met à jour
3. Vérifier que les statistiques changent

---

## Tests SPARQL (Fuseki)

### Vérifier les données dans Fuseki

1. Ouvrir `http://localhost:3030`
2. Sélectionner le dataset `smarthealth`
3. Exécuter cette requête:

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?paiement ?montant ?date ?service ?status ?ref ?mode
WHERE {
  ?paiement rdf:type sh:PaiementFacture .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:referenceFacture ?ref . }
  OPTIONAL { ?paiement sh:modePaiement ?mode . }
}
ORDER BY DESC(?date)
```

---

## Scénarios de test complets

### Scénario 1: Workflow complet
1. Créer 3 paiements avec différents montants
2. Vérifier les statistiques (total = 3, montants corrects)
3. Modifier un paiement (changer le statut)
4. Supprimer un paiement
5. Vérifier les statistiques mises à jour (total = 2)

### Scénario 2: Validation des champs
1. Essayer de créer un paiement sans service → Erreur attendue
2. Essayer de créer un paiement sans montant → Erreur attendue
3. Essayer de créer un paiement avec montant négatif → Vérifier comportement

### Scénario 3: Multi-utilisateurs
1. Créer des paiements pour `Utilisateur_John`
2. Créer des paiements pour `Utilisateur_Jane`
3. Changer d'utilisateur dans le sélecteur
4. Vérifier que chaque utilisateur voit uniquement ses paiements

---

## Checklist de validation

### Backend
- [ ] Route POST `/api/payments` fonctionne
- [ ] Route GET `/api/payments?user=X` fonctionne
- [ ] Route GET `/api/payments/:id` fonctionne
- [ ] Route PUT `/api/payments/:id` fonctionne
- [ ] Route DELETE `/api/payments/:id` fonctionne
- [ ] Route GET `/api/payments/stats/:user` fonctionne
- [ ] Gestion des erreurs (400, 404, 500)
- [ ] Validation des données
- [ ] Sanitization des entrées

### Frontend
- [ ] PaymentForm s'affiche correctement
- [ ] PaymentsList affiche les paiements
- [ ] EditPaymentModal fonctionne
- [ ] PaymentStats affiche les bonnes valeurs
- [ ] PaymentsPage combine tous les composants
- [ ] Badges de statut colorés
- [ ] Formatage des dates en français
- [ ] Formatage des montants avec 2 décimales
- [ ] Gestion des erreurs avec messages clairs
- [ ] Loading states pendant les requêtes

### Intégration
- [ ] Communication client-serveur
- [ ] Rafraîchissement après création
- [ ] Rafraîchissement après modification
- [ ] Rafraîchissement après suppression
- [ ] Synchronisation des statistiques
- [ ] Gestion des erreurs réseau

---

## Problèmes connus et solutions

### Problème: "Cannot find module 'uuid'"
**Solution:**
```bash
cd server
npm install uuid
```

### Problème: "FUSEKI_URL is not defined"
**Solution:** Créer/modifier `server/.env`:
```
FUSEKI_URL=http://localhost:3030/smarthealth
PORT=5000
```

### Problème: "CORS error"
**Solution:** Vérifier que `cors` est bien configuré dans `server.js`:
```javascript
app.use(cors());
```

### Problème: "Services not loading in form"
**Solution:** Vérifier que l'API `/api/services` fonctionne et retourne des données

---

## Métriques de performance

### Temps de réponse attendus
- GET payments: < 500ms
- POST payment: < 300ms
- PUT payment: < 300ms
- DELETE payment: < 200ms
- GET stats: < 400ms

### Taille des réponses
- Liste de 10 paiements: ~2-3 KB
- Statistiques: ~200 bytes
- Création: ~500 bytes

---

## Prochaines étapes

### Améliorations possibles
1. Pagination de la liste des paiements
2. Filtres (par date, statut, montant)
3. Export CSV/PDF
4. Graphiques de visualisation
5. Notifications en temps réel
6. Historique des modifications
7. Validation côté serveur renforcée
8. Tests unitaires et d'intégration
9. Documentation Swagger/OpenAPI
10. Authentification et autorisation

---

## Ressources

- **Documentation API Backend:** `server/routes/PAYMENTS_API.md`
- **Documentation Composants:** `client/src/components/PAYMENTS_README.md`
- **Code Backend:** `server/routes/payments.js`
- **Code Frontend:** `client/src/components/Payment*.jsx`
