# 🤖 Système de Recommandation Intelligente de Services

## 📋 Vue d'ensemble

Le système de recommandation utilise une approche **hybride** combinant:
1. **Analyse de contenu** (mots-clés, catégories)
2. **Historique utilisateur** (services déjà utilisés)
3. **Profil utilisateur** (âge, IMC, antécédents)

## 🎯 Fonctionnalités

### 1. Recherche en langage naturel
L'utilisateur peut poser des questions naturelles:
- "Je veux un service pour le stress"
- "Je cherche un suivi pour le diabète"
- "Consultation pour problème de peau"
- "Quel service est adapté à mon âge et mon IMC ?"

### 2. Recommandations personnalisées
Le système prend en compte:
- **Âge**: Recommandations adaptées par tranche d'âge
  - 0-18 ans: Pédiatrie, Vaccination
  - 18-35 ans: Check-up général, Dermatologie
  - 35-50 ans: Bilan sanguin, Cardiologie
  - 50-65 ans: Dépistage, Analyses complètes
  - 65+ ans: Suivi chronique, Gériatrie

- **IMC** (Indice de Masse Corporelle):
  - Sous-poids: Nutrition, Bilan sanguin
  - Normal: Check-up préventif
  - Surpoids: Nutrition, Bilan métabolique
  - Obésité: Nutrition, Diabète, Cardiologie

- **Historique**: Bonus pour les services déjà utilisés

### 3. Suggestions intelligentes
Le système génère des suggestions contextuelles:
- Stress/Anxiété → Consultation Psychologie
- Diabète → Analyse Glycémie + Consultation Nutrition
- Poids → Consultation Nutrition
- Cœur → Consultation Cardiologie

## 🔧 Architecture technique

### Backend

#### Service de recommandation
`server/services/recommendationService.js`

**Fonctions principales:**
- `recommendServices()`: Génère les recommandations
- `getSmartSuggestions()`: Suggestions contextuelles
- `calculateIMC()`: Calcul de l'IMC
- `normalizeQuery()`: Normalisation de la requête

**Algorithme de scoring:**
```javascript
Score total = Score contenu + Bonus historique + Bonus profil

Score contenu:
- Mot-clé dans requête trouvé dans service: +10
- Mot-clé de catégorie correspondant: +5
- Service contient le mot-clé de catégorie: +15

Bonus historique:
- Service déjà utilisé: +5

Bonus profil:
- Service adapté à l'âge/IMC: +8
```

#### API Routes
`server/routes/recommendations.js`

**Endpoints:**

1. `POST /api/recommendations/search`
   - Recherche intelligente avec recommandations
   - Body: `{ query, userProfile, includeHistory }`
   - Response: `{ recommendations, suggestions, userProfile }`

2. `GET /api/recommendations/profile/:username`
   - Recommandations basées sur le profil complet
   - Response: `{ profile, recommendations }`

### Frontend

#### Composant principal
`client/src/components/SmartServiceSearch.jsx`

**Features:**
- Barre de recherche en langage naturel
- Exemples de recherche cliquables
- Formulaire de profil optionnel (âge, poids, taille)
- Affichage des recommandations avec scores
- Suggestions intelligentes
- Sélection de service

#### Page dédiée
`client/src/views/ServiceRecommendations.jsx`
- Route: `/admin/recommendations`
- Icône: 💡 (bulb-61)

## 📊 Exemples d'utilisation

### Exemple 1: Recherche simple
```
Requête: "Je veux un service pour le stress"

Résultats:
1. Consultation Psychologie (Score: 35)
   Raison: Correspond à votre recherche
   
Suggestions:
- Consultation Psychologie
  Pour gérer le stress et l'anxiété
```

### Exemple 2: Recherche avec profil
```
Requête: "Quel service pour mon diabète ?"
Profil: Âge 45 ans, Poids 85kg, Taille 175cm (IMC: 27.8 - Surpoids)

Résultats:
1. Analyse Glycémie (Score: 43)
   Raison: Correspond à votre recherche (adapté à votre profil)
   
2. Consultation Nutrition (Score: 38)
   Raison: Correspond à votre recherche (adapté à votre profil)
   
Suggestions:
- Analyse Glycémie
  Pour surveiller votre taux de sucre
- Consultation Nutrition
  Pour un suivi diététique adapté
```

### Exemple 3: Avec historique
```
Requête: "Suivi cardiaque"
Profil: Âge 55 ans
Historique: Consultation Cardiologie (2 fois)

Résultats:
1. Consultation Cardiologie (Score: 48)
   Raison: Correspond à votre recherche (déjà utilisé) (adapté à votre profil)
```

## 🚀 Utilisation

### 1. Démarrer le backend
```bash
cd server
npm start
```

### 2. Démarrer le frontend
```bash
cd client
npm start
```

### 3. Accéder à la page
```
http://localhost:3000/admin/recommendations
```

### 4. Effectuer une recherche
1. Saisir une question en langage naturel
2. (Optionnel) Remplir le profil pour des recommandations personnalisées
3. Cliquer sur "Rechercher"
4. Consulter les recommandations et suggestions

## 🧪 Tests

### Test API avec curl

**Recherche simple:**
```bash
curl -X POST http://localhost:5000/api/recommendations/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Je veux un service pour le stress"
  }'
```

**Recherche avec profil:**
```bash
curl -X POST http://localhost:5000/api/recommendations/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quel service pour mon diabète",
    "userProfile": {
      "age": 45,
      "weight": 85,
      "height": 175
    }
  }'
```

**Recommandations par profil:**
```bash
curl http://localhost:5000/api/recommendations/profile/nawrasse_elbenna
```

## 📈 Améliorations futures

1. **Machine Learning**
   - Entraînement sur l'historique réel
   - Prédiction de satisfaction
   - Clustering d'utilisateurs similaires

2. **Filtres collaboratifs**
   - "Les utilisateurs comme vous ont aussi consulté..."
   - Notes et avis sur les services

3. **Contexte temporel**
   - Saisonnalité (grippe en hiver, allergies au printemps)
   - Urgence vs planification

4. **Intégration NLP avancée**
   - Analyse de sentiment
   - Extraction d'entités médicales
   - Compréhension d'intentions complexes

5. **Base de connaissances médicale**
   - Ontologie médicale complète
   - Relations symptômes-pathologies-traitements
   - Règles métier médicales

## 🔐 Considérations de sécurité

- ⚠️ Les recommandations sont informatives, pas des diagnostics médicaux
- ⚠️ Toujours consulter un professionnel de santé
- ⚠️ Données de santé sensibles: respecter le RGPD
- ⚠️ Validation des entrées utilisateur
- ⚠️ Logs d'audit des recommandations

## 📝 Notes

- Le système est conçu pour être extensible
- Les mots-clés peuvent être enrichis facilement
- L'algorithme de scoring peut être ajusté
- Compatible avec l'ontologie RDF existante

---

**Développé pour SmartHealth - Système de gestion de santé intelligent**
