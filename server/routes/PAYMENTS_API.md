# API Paiements - Documentation

## Base URL
```
http://localhost:5000/api/payments
```

## Endpoints

### 1. GET `/api/payments?user={userId}`
Récupère tous les paiements d'un utilisateur.

**Query Parameters:**
- `user` (required): ID de l'utilisateur (ex: `Utilisateur_John`)

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "uri": "http://www.smarthealth-tracker.com/ontologie#Paiement_abc123",
      "id": "Paiement_abc123",
      "montant": 80.0,
      "date": "2025-11-03",
      "serviceUri": "http://www.smarthealth-tracker.com/ontologie#Consultation_001",
      "serviceId": "Consultation_001",
      "status": "PAID",
      "referenceFacture": "F2025-001",
      "modePaiement": "Carte"
    }
  ]
}
```

---

### 2. GET `/api/payments/:id`
Récupère un paiement spécifique par son ID.

**URL Parameters:**
- `id`: ID du paiement (ex: `Paiement_abc123`)

**Response:**
```json
{
  "success": true,
  "payment": [
    {
      "p": { "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
      "o": { "value": "http://www.smarthealth-tracker.com/ontologie#PaiementFacture" }
    }
  ]
}
```

---

### 3. POST `/api/payments`
Crée un nouveau paiement.

**Request Body:**
```json
{
  "user": "Utilisateur_John",
  "service": "Consultation_001",
  "montant": 80.0,
  "modePaiement": "Carte",
  "date": "2025-11-03",           // optional, default: today
  "status": "PAID",               // optional
  "referenceFacture": "F2025-001" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "payment": {
    "id": "Paiement_abc123def456",
    "user": "Utilisateur_John",
    "service": "Consultation_001",
    "montant": 80.0,
    "modePaiement": "Carte",
    "date": "2025-11-03",
    "status": "PAID",
    "referenceFacture": "F2025-001"
  }
}
```

---

### 4. PUT `/api/payments/:id`
Met à jour un paiement existant.

**URL Parameters:**
- `id`: ID du paiement

**Request Body:** (tous les champs sont optionnels)
```json
{
  "montant": 90.0,
  "date": "2025-11-04",
  "modePaiement": "Virement",
  "status": "REFUNDED",
  "referenceFacture": "F2025-002"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment updated successfully",
  "payment": {
    "id": "Paiement_abc123",
    "montant": 90.0,
    "date": "2025-11-04",
    "modePaiement": "Virement",
    "status": "REFUNDED",
    "referenceFacture": "F2025-002"
  }
}
```

---

### 5. DELETE `/api/payments/:id`
Supprime un paiement.

**URL Parameters:**
- `id`: ID du paiement

**Response:**
```json
{
  "success": true,
  "message": "Payment deleted successfully"
}
```

---

### 6. GET `/api/payments/stats/:user`
Récupère les statistiques de paiement d'un utilisateur.

**URL Parameters:**
- `user`: ID de l'utilisateur (ex: `Utilisateur_John`)

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 5,
    "totalMontant": 450.0,
    "avgMontant": 90.0
  }
}
```

---

## Modes de paiement disponibles
- `Carte`
- `Espèces`
- `Virement`
- `Chèque`
- `Assurance`

## Statuts de paiement
- `PAID` - Payé
- `PENDING` - En attente
- `FAILED` - Échoué
- `REFUNDED` - Remboursé

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Paramètres manquants ou invalides |
| 404 | Paiement non trouvé |
| 500 | Erreur serveur / SPARQL |

## Exemples avec cURL

### Créer un paiement
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Utilisateur_John",
    "service": "Consultation_001",
    "montant": 80.0,
    "modePaiement": "Carte",
    "status": "PAID"
  }'
```

### Récupérer les paiements d'un utilisateur
```bash
curl http://localhost:5000/api/payments?user=Utilisateur_John
```

### Mettre à jour un paiement
```bash
curl -X PUT http://localhost:5000/api/payments/Paiement_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REFUNDED",
    "montant": 90.0
  }'
```

### Supprimer un paiement
```bash
curl -X DELETE http://localhost:5000/api/payments/Paiement_abc123
```

### Obtenir les statistiques
```bash
curl http://localhost:5000/api/payments/stats/Utilisateur_John
```
