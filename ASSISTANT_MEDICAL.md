# 🤖 Assistant Médical Intelligent (Q&A)

## 📋 Vue d'ensemble

L'assistant médical intelligent permet aux utilisateurs de poser des questions en langage naturel qui sont automatiquement traduites en requêtes SPARQL pour interroger l'ontologie Fuseki.

## 🎯 Objectif

Rendre l'accès aux données médicales plus intuitif en permettant aux utilisateurs de poser des questions naturelles plutôt que d'écrire des requêtes SPARQL complexes.

## 🔧 Architecture

### Backend

#### Service de traduction NLP → SPARQL
`server/services/medicalAssistantService.js`

**Fonctionnalités:**
- Analyse de questions en langage naturel
- Génération automatique de requêtes SPARQL
- Formatage des réponses en français
- Gestion de 6 catégories de questions

**Catégories supportées:**
1. **Services disponibles**
2. **Prix et tarifs**
3. **Examens et détails**
4. **Utilisateurs/Patients**
5. **Paiements et historique**
6. **Statistiques**

#### API Routes
`server/routes/assistant.js`

**Endpoints:**

1. `POST /api/assistant/ask`
   - Pose une question à l'assistant
   - Body: `{ question: "string" }`
   - Response: `{ answer, data, queryInfo, suggestion }`

2. `GET /api/assistant/examples`
   - Retourne des exemples de questions par catégorie

3. `GET /api/assistant/capabilities`
   - Retourne les capacités de l'assistant

### Frontend

#### Composant de chat
`client/src/components/MedicalAssistantChat.jsx`

**Features:**
- Interface de chat moderne
- Historique des conversations
- Exemples de questions cliquables
- Affichage des métadonnées (catégorie, type)
- Suggestions de reformulation
- Effacement de conversation

#### Page dédiée
`client/src/views/MedicalAssistant.jsx`
- Route: `/admin/assistant`
- Icône: 💬 (chat-round)

## 📊 Exemples de questions et réponses

### 1. Services disponibles

**Question:** "Quels sont les services médicaux disponibles ?"

**Requête SPARQL générée:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?type ?label WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
}
ORDER BY ?type ?service
```

**Réponse:**
```
J'ai trouvé 6 service(s) médical(aux):

**Consultation** (3):
• Consultation Cardiologie
• Consultation Dermatologie
• Consultation Psychologie

**Analyse** (2):
• Analyse Sanguine Complète
• Analyse d'Urine

**Telemedecine** (1):
• Téléconsultation Généraliste
```

---

### 2. Prix d'un service

**Question:** "Combien coûte une consultation en cardiologie ?"

**Requête SPARQL générée:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?label ?montant (COUNT(?paiement) as ?nombrePaiements) WHERE {
  ?paiement a sh:PaiementFacture ;
            sh:correspondÀ ?service ;
            sh:montant ?montant .
  OPTIONAL { ?service sh:label ?label }
  FILTER(CONTAINS(LCASE(STR(?label)), "cardiologie"))
}
GROUP BY ?service ?label ?montant
ORDER BY DESC(?nombrePaiements)
```

**Réponse:**
```
Le service **Consultation Cardiologie** coûte **80.00€** 
(basé sur 5 paiement(s) enregistré(s)).
```

---

### 3. Examens inclus

**Question:** "Quels examens sont inclus dans un check-up complet ?"

**Requête SPARQL générée:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?type ?label ?description WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
  OPTIONAL { ?service sh:description ?description }
  FILTER(CONTAINS(LCASE(STR(?label)), "check-up"))
}
```

**Réponse:**
```
Le service **Check-up Complet** comprend:
• Consultation générale
• Analyse sanguine complète
• Électrocardiogramme
• Mesure de la tension artérielle
```

---

### 4. Liste des patients

**Question:** "Combien de patients sont enregistrés ?"

**Requête SPARQL générée:**
```sparql
PREFIX ex: <http://example.org/>

SELECT ?username ?email ?firstName ?lastName WHERE {
  ?user a ex:User ;
        ex:username ?username ;
        ex:email ?email .
  OPTIONAL { ?user ex:firstName ?firstName . }
  OPTIONAL { ?user ex:lastName ?lastName . }
}
ORDER BY ?username
```

**Réponse:**
```
Il y a 3 utilisateur(s) enregistré(s):

• nawrasse_elbenna (nawrasse elbenna)
• john_doe (john.doe@email.com)
• marie_martin (Marie Martin)
```

---

### 5. Historique des paiements

**Question:** "Historique des paiements de nawrasse_elbenna"

**Requête SPARQL générée:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?paiement ?montant ?date ?service ?status WHERE {
  ?paiement a sh:PaiementFacture ;
            sh:montant ?montant ;
            sh:datePaiement ?date .
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
  FILTER(CONTAINS(LCASE(STR(?user)), "nawrasse_elbenna"))
}
ORDER BY DESC(?date)
```

**Réponse:**
```
J'ai trouvé 5 paiement(s) pour un total de **235.50€**:

• 2025-11-03: 80.00€ (PAID)
• 2025-11-02: 45.50€ (PAID)
• 2025-11-01: 30.00€ (PENDING)
• 2025-10-28: 50.00€ (PAID)
• 2025-10-15: 30.00€ (PAID)
```

---

### 6. Statistiques

**Question:** "Statistiques des services"

**Requête SPARQL générée:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?type (COUNT(?service) as ?count) WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
}
GROUP BY ?type
ORDER BY DESC(?count)
```

**Réponse:**
```
Voici les statistiques:

• **Consultation**: 12 élément(s)
• **Analyse**: 8 élément(s)
• **Telemedecine**: 5 élément(s)
```

## 🚀 Utilisation

### 1. Accéder à l'assistant
```
http://localhost:3000/admin/assistant
```

### 2. Poser une question
1. Tapez votre question dans le champ de texte
2. Cliquez sur "Envoyer" ou appuyez sur Entrée
3. L'assistant traduit votre question en SPARQL
4. La réponse s'affiche dans le chat

### 3. Utiliser les exemples
1. Cliquez sur "Exemples de questions"
2. Cliquez sur une question d'exemple
3. Elle sera automatiquement envoyée

## 🧪 Tests

### Test via l'interface web

1. **Ouvrir**: `http://localhost:3000/admin/assistant`
2. **Essayer**: "Quels sont les services disponibles ?"
3. **Observer**: La réponse formatée avec les données

### Test via API

**Poser une question:**
```bash
curl -X POST http://localhost:5000/api/assistant/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Combien coûte une consultation en cardiologie ?"}'
```

**Obtenir les exemples:**
```bash
curl http://localhost:5000/api/assistant/examples
```

**Obtenir les capacités:**
```bash
curl http://localhost:5000/api/assistant/capabilities
```

## 📈 Patterns de questions supportés

### Services
- "Quels sont les services médicaux disponibles ?"
- "Liste des services pour les maladies cardiaques"
- "Services de télémédecine disponibles"

### Prix
- "Combien coûte une consultation en cardiologie ?"
- "Quel est le prix d'une analyse sanguine ?"
- "Tarif pour une téléconsultation"

### Examens
- "Quels examens sont inclus dans un check-up complet ?"
- "Que comprend une consultation cardiologie ?"
- "Contenu d'une analyse sanguine"

### Patients
- "Combien de patients sont enregistrés ?"
- "Liste des utilisateurs"
- "Qui sont les patients ?"

### Paiements
- "Historique des paiements de nawrasse_elbenna"
- "Combien a payé l'utilisateur X ?"
- "Total des paiements pour Marie"

### Statistiques
- "Statistiques des services"
- "Combien de consultations ?"
- "Nombre de paiements par statut"

## 🎨 Interface utilisateur

```
┌──────────────────────────────────────────────────────────┐
│ 💬 Assistant Médical Intelligent          [Effacer]     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Assistant] 👋 Bonjour! Je suis votre assistant...     │
│              14:30                                       │
│                                                          │
│                  [User] Quels services disponibles ?     │
│                         14:31                            │
│                                                          │
│  [Assistant] J'ai trouvé 6 service(s):                  │
│              **Consultation** (3):                       │
│              • Consultation Cardiologie                  │
│              • Consultation Dermatologie                 │
│              ...                                         │
│              [services] [services]                       │
│              14:31                                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 💡 Exemples de questions ▼                              │
│                                                          │
│ [Posez votre question ici...          ] [Envoyer]       │
│                                                          │
│ 💡 L'assistant traduit vos questions en SPARQL...       │
└──────────────────────────────────────────────────────────┘
```

## 🔮 Améliorations futures

### 1. Intégration LLM (GPT/Claude)
```javascript
// Utiliser un LLM pour améliorer la compréhension
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{
    role: "system",
    content: "Tu es un assistant qui traduit des questions médicales en requêtes SPARQL..."
  }, {
    role: "user",
    content: question
  }]
});
```

### 2. Apprentissage continu
- Stocker les questions fréquentes
- Améliorer les patterns avec le temps
- Feedback utilisateur sur la pertinence

### 3. Contexte de conversation
- Mémoriser le contexte précédent
- Questions de suivi ("Et pour Marie ?")
- Clarifications ("De quel service parlez-vous ?")

### 4. Requêtes complexes
- Jointures multiples
- Agrégations avancées
- Filtres temporels

### 5. Visualisations
- Graphiques pour les statistiques
- Tableaux pour les listes
- Calendriers pour les rendez-vous

## ⚠️ Limitations actuelles

1. **Patterns fixes**: L'assistant utilise des regex, pas de vrai NLP
2. **Pas de contexte**: Chaque question est indépendante
3. **Questions simples**: Pas de requêtes très complexes
4. **Français uniquement**: Pas de support multilingue
5. **Pas d'apprentissage**: Les patterns sont statiques

## 🔐 Sécurité

- ✅ Validation des entrées utilisateur
- ✅ Sanitization des requêtes SPARQL
- ✅ Pas d'injection SPARQL possible
- ✅ Limitation du nombre de résultats
- ⚠️ Pas d'authentification sur l'API (à ajouter)

## 📝 Notes techniques

### Normalisation des questions
```javascript
function normalizeQuery(query) {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}
```

### Génération SPARQL
```javascript
function generateServicesByConditionQuery(condition) {
  const normalizedCondition = condition.toLowerCase();
  return {
    query: `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
      SELECT ?service ?label WHERE {
        ?service sh:label ?label .
        FILTER(CONTAINS(LCASE(?label), "${normalizedCondition}"))
      }
    `,
    type: 'services'
  };
}
```

---

**Développé pour SmartHealth - Assistant médical intelligent basé sur SPARQL**
