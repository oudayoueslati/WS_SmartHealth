# 🚀 Guide de démarrage rapide - SmartHealth

## Installation en 5 minutes

### Prérequis
- Node.js 18+ installé
- Docker & Docker Compose installés (optionnel mais recommandé)
- Git

---

## Option 1: Docker (Recommandé)

### 1. Cloner et démarrer
```bash
# Cloner le projet
git clone <repo-url>
cd WS_SmartHealth

# Démarrer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

### 2. Accéder aux services
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Fuseki**: http://localhost:3030

### 3. Initialiser les données
```bash
# Uploader l'ontologie dans Fuseki
curl -X POST http://localhost:3030/smarthealth/data?default \
  -H "Content-Type: text/turtle" \
  --data-binary @ontology/smarthealth.ttl
```

✅ **C'est tout! L'application est prête.**

---

## Option 2: Installation manuelle

### 1. Démarrer Fuseki
```bash
# Avec Docker
docker run -d -p 3030:3030 --name fuseki stain/jena-fuseki

# OU télécharger depuis https://jena.apache.org/download/
# Puis: ./fuseki-server --port=3030
```

### 2. Créer le dataset
1. Ouvrir http://localhost:3030
2. Aller dans "Manage datasets"
3. Créer un dataset nommé `smarthealth` (type: Persistent - TDB2)

### 3. Backend
```bash
cd server

# Installer les dépendances
npm install

# Créer .env
cat > .env << EOF
FUSEKI_URL=http://localhost:3030/smarthealth
PORT=5000
NODE_ENV=development
EOF

# Démarrer
npm start
```

### 4. Frontend
```bash
cd client

# Installer les dépendances
npm install

# Créer .env
cat > .env << EOF
REACT_APP_SERVER_BASE=http://localhost:5000
EOF

# Démarrer
npm start
```

---

## 🧪 Tester l'installation

### 1. Vérifier Fuseki
```bash
curl http://localhost:3030/$/ping
# Devrait retourner: {"version":"..."}
```

### 2. Vérifier le Backend
```bash
curl http://localhost:5000/
# Devrait retourner: {"message":"Backend API is running"}
```

### 3. Créer un service de test
```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Consultation",
    "label": "Consultation test",
    "id": "Consultation_Test001"
  }'
```

### 4. Créer un paiement de test
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Utilisateur_John",
    "service": "Consultation_Test001",
    "montant": 80.0,
    "modePaiement": "Carte",
    "status": "PAID"
  }'
```

### 5. Récupérer les paiements
```bash
curl "http://localhost:5000/api/payments?user=Utilisateur_John"
```

---

## 📱 Utiliser l'interface web

### 1. Ouvrir l'application
Naviguer vers http://localhost:3000

### 2. Créer un service
1. Aller dans la section "Services"
2. Remplir le formulaire
3. Cliquer sur "Créer"

### 3. Créer un paiement
1. Aller dans la section "Paiements"
2. Sélectionner un utilisateur
3. Remplir le formulaire
4. Cliquer sur "Créer le paiement"

### 4. Voir les statistiques
Les statistiques s'affichent automatiquement en haut de la page paiements.

---

## 🔧 Configuration avancée

### Variables d'environnement Backend
```env
# server/.env
FUSEKI_URL=http://localhost:3030/smarthealth
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Variables d'environnement Frontend
```env
# client/.env
REACT_APP_SERVER_BASE=http://localhost:5000
```

---

## 🐛 Dépannage

### Problème: "Cannot connect to Fuseki"
**Solution:**
```bash
# Vérifier que Fuseki est démarré
docker ps | grep fuseki
# OU
curl http://localhost:3030/$/ping
```

### Problème: "Dataset not found"
**Solution:**
```bash
# Créer le dataset via l'interface Fuseki
# Ou avec curl:
curl -X POST http://localhost:3030/$/datasets \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "dbName=smarthealth&dbType=tdb2"
```

### Problème: "CORS error"
**Solution:** Vérifier que le backend a bien `app.use(cors())` dans `server.js`

### Problème: "Module not found"
**Solution:**
```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

### Problème: Port déjà utilisé
**Solution:**
```bash
# Changer le port dans .env
# Backend: PORT=5001
# Frontend: PORT=3001

# Ou tuer le processus
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Prochaines étapes

1. **Lire la documentation complète**: `ARCHITECTURE.md`
2. **Explorer l'API**: `server/routes/PAYMENTS_API.md`
3. **Tester les composants**: `client/src/components/PAYMENTS_README.md`
4. **Exécuter les tests**: `TEST_PAYMENTS.md`

---

## 🆘 Besoin d'aide?

- **Documentation**: Voir `ARCHITECTURE.md`
- **API Reference**: Voir `server/routes/PAYMENTS_API.md`
- **Tests**: Voir `TEST_PAYMENTS.md`
- **Issues**: Ouvrir une issue sur GitHub

---

## ✅ Checklist de vérification

- [ ] Fuseki démarré et accessible
- [ ] Dataset `smarthealth` créé
- [ ] Backend démarré sur port 5000
- [ ] Frontend démarré sur port 3000
- [ ] Test de création de service réussi
- [ ] Test de création de paiement réussi
- [ ] Interface web accessible

**Si tous les points sont cochés, vous êtes prêt! 🎉**
