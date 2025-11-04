# 🏥 SmartHealth - Système de Gestion Sémantique

Application web full-stack pour la gestion de services médicaux et paiements avec ontologie RDF/OWL et Apache Jena Fuseki.

## ✨ Fonctionnalités

- 🔹 **CRUD Services médicaux** (Consultation, Analyse, Télémédecine)
- 💳 **CRUD Paiements** avec suivi complet
- 📊 **Statistiques en temps réel**
- 🔍 **Requêtes SPARQL** sur données sémantiques
- 🐳 **Déploiement Docker** simplifié
- 📝 **Logging & Audit trail**
- 🎨 **Interface React moderne**

## 🚀 Démarrage rapide

### Avec Docker (Recommandé)
```bash
# Cloner et démarrer
git clone <repo-url>
cd WS_SmartHealth
docker-compose up -d

# Accéder à l'application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Fuseki: http://localhost:3030
```

### Installation manuelle
Voir [QUICKSTART.md](QUICKSTART.md) pour les instructions détaillées.

## 📁 Structure du projet

```
WS_SmartHealth/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Composants UI
│   │   ├── hooks/         # Hooks personnalisés
│   │   └── api.js         # Couche API
│   └── package.json
├── server/                # Backend Node/Express
│   ├── routes/           # Routes REST
│   ├── lib/              # Utilitaires (fusekiClient, logger)
│   └── package.json
├── docker-compose.yml    # Orchestration Docker
├── ARCHITECTURE.md       # Documentation architecture
├── QUICKSTART.md         # Guide démarrage rapide
└── TEST_PAYMENTS.md      # Guide de tests
```

## 🛠️ Technologies

### Frontend
- **React 18** - Framework UI
- **Custom Hooks** - Gestion d'état
- **Fetch API** - Communication HTTP

### Backend
- **Node.js 18** - Runtime
- **Express** - Framework web
- **Axios** - Client HTTP pour Fuseki

### Triplestore
- **Apache Jena Fuseki** - Base de données RDF
- **SPARQL 1.1** - Langage de requête
- **OWL** - Ontologie

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture détaillée et flux de données
- **[QUICKSTART.md](QUICKSTART.md)** - Installation et configuration
- **[TEST_PAYMENTS.md](TEST_PAYMENTS.md)** - Guide de tests complet
- **[server/routes/PAYMENTS_API.md](server/routes/PAYMENTS_API.md)** - Documentation API
- **[client/src/components/PAYMENTS_README.md](client/src/components/PAYMENTS_README.md)** - Guide composants React

## 🔌 API Endpoints

### Services
- `GET /api/services` - Liste des services
- `POST /api/services` - Créer un service
- `PUT /api/services/:id` - Modifier un service
- `DELETE /api/services/:id` - Supprimer un service

### Paiements
- `GET /api/payments?user=X` - Liste des paiements
- `POST /api/payments` - Créer un paiement
- `PUT /api/payments/:id` - Modifier un paiement
- `DELETE /api/payments/:id` - Supprimer un paiement
- `GET /api/payments/stats/:user` - Statistiques

## 🧪 Tests

```bash
# Backend
cd server
npm test

# Frontend
cd client
npm test

# Tests manuels
curl http://localhost:5000/api/services
```

Voir [TEST_PAYMENTS.md](TEST_PAYMENTS.md) pour les scénarios de test complets.

## 🐳 Docker

```bash
# Démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Rebuild
docker-compose up -d --build
```

## 🔒 Sécurité

- ✅ Sanitization des entrées (injection SPARQL)
- ✅ Validation côté serveur
- ✅ CORS configuré
- ✅ Logging des opérations critiques
- 🔜 Authentification JWT (à venir)
- 🔜 Validation SHACL (à venir)

## 📊 Monitoring

### Health checks
```bash
# Backend
curl http://localhost:5000/health

# Fuseki
curl http://localhost:3030/$/ping
```

### Logs
```bash
# Logs applicatifs
tail -f server/logs/app.log

# Logs d'erreurs
tail -f server/logs/error.log

# Audit trail
tail -f server/logs/audit/audit-$(date +%Y-%m-%d).log
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT License

## 👥 Auteurs

- Votre nom

## 🙏 Remerciements

- Apache Jena Team
- React Team
- Express.js Team

## 📞 Support

- **Documentation**: Voir les fichiers `.md` dans le projet
- **Issues**: Ouvrir une issue sur GitHub
- **Email**: votre-email@example.com

---

**⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile!** 
