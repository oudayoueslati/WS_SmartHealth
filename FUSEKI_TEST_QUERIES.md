# 🧪 Guide de Test Complet - Toutes les Fonctionnalités SmartHealth

## 📋 Table des matières
1. [Authentification](#1-authentification)
2. [Gestion des Utilisateurs](#2-gestion-des-utilisateurs)
3. [Services Médicaux](#3-services-médicaux)
4. [Programmes de Santé](#4-programmes-de-santé)
5. [Paiements](#5-paiements)
6. [Recommandations](#6-recommandations)
7. [Assistant Médical](#7-assistant-médical)
8. [Administration](#8-administration)

---

## 1. Authentification

### 1.1 Inscription (Signup)

**Endpoint:** `POST /api/auth/signup`

**Test via curl:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_martin",
    "email": "alice.martin@email.com",
    "password": "Alice123456",
    "firstName": "Alice",
    "lastName": "Martin"
  }'
```

**Requête SPARQL générée:**
```sparql
# Vérification si l'email existe
PREFIX ex: <http://example.org/>
ASK WHERE {
  ?u a ex:User ;
     ex:email "alice.martin@email.com" .
}

# Création de l'utilisateur
@prefix ex: <http://example.org/> .
ex:alice_martin a ex:User ;
    ex:username "alice_martin" ;
    ex:firstName "Alice" ;
    ex:lastName "Martin" ;
    ex:email "alice.martin@email.com" ;
    ex:password "$2a$10$hashedpassword..." .
```

**Test dans Fuseki UI:**
```
URL: http://localhost:3030/SmartHealth/query
Query:
PREFIX ex: <http://example.org/>
SELECT * WHERE {
  ?user a ex:User ;
        ex:email "alice.martin@email.com" ;
        ex:firstName ?firstName ;
        ex:lastName ?lastName .
}
```

---

### 1.2 Connexion (Login)

**Endpoint:** `POST /api/auth/login`

**Test via curl:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.martin@email.com",
    "password": "Alice123456"
  }'
```

**Requête SPARQL:**
```sparql
PREFIX ex: <http://example.org/>
SELECT ?username ?password ?firstName ?lastName
WHERE {
  ?u a ex:User ;
     ex:email "alice.martin@email.com" ;
     ex:username ?username ;
     ex:password ?password ;
     ex:firstName ?firstName ;
     ex:lastName ?lastName .
}
```

---

## 2. Gestion des Utilisateurs

### 2.1 Obtenir le profil utilisateur

**Endpoint:** `GET /api/users/:username`

**Test via curl:**
```bash
curl http://localhost:5000/api/users/alice_martin
```

**Requête SPARQL:**
```sparql
PREFIX ex: <http://example.org/>
SELECT ?email ?firstName ?lastName
WHERE {
  ex:alice_martin a ex:User ;
                  ex:email ?email ;
                  ex:firstName ?firstName ;
                  ex:lastName ?lastName .
}
```

**Test dans Fuseki UI:**
```sparql
PREFIX ex: <http://example.org/>
SELECT ?user ?username ?email ?firstName ?lastName
WHERE {
  ?user a ex:User ;
        ex:username ?username ;
        ex:email ?email ;
        ex:firstName ?firstName ;
        ex:lastName ?lastName .
}
ORDER BY ?username
```

---

## 3. Services Médicaux

### 3.1 Lister tous les services

**Endpoint:** `GET /api/services`

**Test via curl:**
```bash
curl http://localhost:5000/api/services
```

**Requête SPARQL:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?type ?label ?description ?duration ?price
WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
  OPTIONAL { ?service sh:description ?description }
  OPTIONAL { ?service sh:duration ?duration }
  OPTIONAL { ?service sh:price ?price }
}
ORDER BY ?type ?service
```

**Test dans Fuseki UI:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?type ?label
WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
}
```

---

### 3.2 Ajouter des services de test

**Insérer via Fuseki UI (Update):**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

INSERT DATA {
  sh:ConsultationCardiologie rdf:type sh:Consultation ;
                             sh:label "Consultation Cardiologie" ;
                             sh:description "Examen cardiologique complet" ;
                             sh:duration "30" ;
                             sh:price "80.00" .
  
  sh:ConsultationDermatologie rdf:type sh:Consultation ;
                              sh:label "Consultation Dermatologie" ;
                              sh:description "Consultation dermatologique" ;
                              sh:duration "20" ;
                              sh:price "60.00" .
  
  sh:AnalyseSanguine rdf:type sh:Analyse ;
                     sh:label "Analyse Sanguine Complète" ;
                     sh:description "Bilan sanguin complet" ;
                     sh:duration "15" ;
                     sh:price "45.00" .
  
  sh:TeleconsultationGeneraliste rdf:type sh:Telemedecine ;
                                 sh:label "Téléconsultation Généraliste" ;
                                 sh:description "Consultation à distance" ;
                                 sh:duration "15" ;
                                 sh:price "35.00" .
}
```

---

## 4. Programmes de Santé

### 4.1 Lister tous les programmes

**Endpoint:** `GET /api/health-programs`

**Test via curl:**
```bash
curl http://localhost:5000/api/health-programs
```

**Requête SPARQL:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?program ?label ?description ?duration ?category
WHERE {
  ?program rdf:type sh:ProgrammeSante ;
           sh:label ?label .
  OPTIONAL { ?program sh:description ?description }
  OPTIONAL { ?program sh:duration ?duration }
  OPTIONAL { ?program sh:category ?category }
}
ORDER BY ?label
```

---

### 4.2 Créer des programmes de test

**Insérer via Fuseki UI:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

INSERT DATA {
  sh:ProgrammeDiabete rdf:type sh:ProgrammeSante ;
                      sh:label "Programme Diabète" ;
                      sh:description "Suivi et gestion du diabète" ;
                      sh:duration "90" ;
                      sh:category "Chronique" .
  
  sh:ProgrammeCardiaque rdf:type sh:ProgrammeSante ;
                        sh:label "Programme Cardiaque" ;
                        sh:description "Prévention des maladies cardiovasculaires" ;
                        sh:duration "120" ;
                        sh:category "Prévention" .
  
  sh:ProgrammeNutrition rdf:type sh:ProgrammeSante ;
                        sh:label "Programme Nutrition" ;
                        sh:description "Rééquilibrage alimentaire" ;
                        sh:duration "60" ;
                        sh:category "Bien-être" .
}
```

---

### 4.3 Inscrire un utilisateur à un programme

**Endpoint:** `POST /api/health-programs/:programId/enroll`

**Test via curl:**
```bash
curl -X POST http://localhost:5000/api/health-programs/ProgrammeDiabete/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_martin"
  }'
```

**Requête SPARQL générée:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>

INSERT DATA {
  sh:Enrollment_alice_martin_ProgrammeDiabete_1730736000000 
    a sh:Enrollment ;
    sh:user ex:alice_martin ;
    sh:program sh:ProgrammeDiabete ;
    sh:enrollmentDate "2025-11-04T14:00:00Z" ;
    sh:status "active" .
}
```

---

## 5. Paiements

### 5.1 Créer un paiement

**Endpoint:** `POST /api/payments`

**Test via curl:**
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_martin",
    "serviceId": "ConsultationCardiologie",
    "amount": 80.00,
    "paymentMethod": "carte_bancaire"
  }'
```

**Requête SPARQL générée:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>

INSERT DATA {
  sh:Payment_uuid_12345 a sh:PaiementFacture ;
                        sh:effectuéPar ex:alice_martin ;
                        sh:correspondÀ sh:ConsultationCardiologie ;
                        sh:montant "80.00" ;
                        sh:datePaiement "2025-11-04T14:30:00Z" ;
                        sh:statusPaiement "PAID" ;
                        sh:methodePaiement "carte_bancaire" .
}
```

---

### 5.2 Obtenir l'historique des paiements

**Endpoint:** `GET /api/payments/user/:username`

**Test via curl:**
```bash
curl http://localhost:5000/api/payments/user/alice_martin
```

**Requête SPARQL:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>

SELECT ?payment ?montant ?date ?service ?status ?method
WHERE {
  ?payment a sh:PaiementFacture ;
           sh:effectuéPar ex:alice_martin ;
           sh:montant ?montant ;
           sh:datePaiement ?date .
  OPTIONAL { ?payment sh:correspondÀ ?service }
  OPTIONAL { ?payment sh:statusPaiement ?status }
  OPTIONAL { ?payment sh:methodePaiement ?method }
}
ORDER BY DESC(?date)
```

---

### 5.3 Statistiques des paiements

**Endpoint:** `GET /api/payments/stats`

**Test via curl:**
```bash
curl http://localhost:5000/api/payments/stats
```

**Requête SPARQL:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT 
  (COUNT(?payment) as ?totalPayments)
  (SUM(xsd:decimal(?montant)) as ?totalAmount)
  (AVG(xsd:decimal(?montant)) as ?averageAmount)
WHERE {
  ?payment a sh:PaiementFacture ;
           sh:montant ?montant ;
           sh:statusPaiement "PAID" .
}
```

---

### 5.4 Insérer des paiements de test

**Insérer via Fuseki UI:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>

INSERT DATA {
  sh:Payment_001 a sh:PaiementFacture ;
                 sh:effectuéPar ex:alice_martin ;
                 sh:correspondÀ sh:ConsultationCardiologie ;
                 sh:montant "80.00" ;
                 sh:datePaiement "2025-11-01T10:00:00Z" ;
                 sh:statusPaiement "PAID" ;
                 sh:methodePaiement "carte_bancaire" .
  
  sh:Payment_002 a sh:PaiementFacture ;
                 sh:effectuéPar ex:alice_martin ;
                 sh:correspondÀ sh:AnalyseSanguine ;
                 sh:montant "45.00" ;
                 sh:datePaiement "2025-11-02T14:30:00Z" ;
                 sh:statusPaiement "PAID" ;
                 sh:methodePaiement "especes" .
  
  sh:Payment_003 a sh:PaiementFacture ;
                 sh:effectuéPar ex:alice_martin ;
                 sh:correspondÀ sh:TeleconsultationGeneraliste ;
                 sh:montant "35.00" ;
                 sh:datePaiement "2025-11-03T09:15:00Z" ;
                 sh:statusPaiement "PENDING" ;
                 sh:methodePaiement "carte_bancaire" .
}
```

---

## 6. Recommandations

### 6.1 Obtenir des recommandations personnalisées

**Endpoint:** `GET /api/recommendations/:username`

**Test via curl:**
```bash
curl http://localhost:5000/api/recommendations/alice_martin
```

**Requête SPARQL:**
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

# 1. Récupérer tous les services
SELECT ?service ?type ?label ?description
WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
  OPTIONAL { ?service sh:description ?description }
}

# 2. Récupérer l'historique de l'utilisateur
SELECT ?service ?date
WHERE {
  ?payment a sh:PaiementFacture ;
           sh:effectuéPar ex:alice_martin ;
           sh:correspondÀ ?service ;
           sh:datePaiement ?date .
}
ORDER BY DESC(?date)

# 3. Récupérer le profil utilisateur
SELECT ?age ?conditions
WHERE {
  ex:alice_martin sh:age ?age .
  OPTIONAL { ex:alice_martin sh:medicalConditions ?conditions }
}
```

---

## 7. Assistant Médical

### 7.1 Poser une question

**Endpoint:** `POST /api/assistant/ask`

**Test via curl:**
```bash
curl -X POST http://localhost:5000/api/assistant/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quels sont les services médicaux disponibles ?"
  }'
```

**Requêtes SPARQL générées selon la question:**

#### Question: "Quels sont les services disponibles ?"
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

#### Question: "Combien coûte une consultation en cardiologie ?"
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

#### Question: "Combien de patients sont enregistrés ?"
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

#### Question: "Historique des paiements de alice_martin"
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?paiement ?montant ?date ?service ?status WHERE {
  ?paiement a sh:PaiementFacture ;
            sh:montant ?montant ;
            sh:datePaiement ?date .
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
  FILTER(CONTAINS(LCASE(STR(?user)), "alice_martin"))
}
ORDER BY DESC(?date)
```

#### Question: "Statistiques des services"
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

---

### 7.2 Obtenir les exemples de questions

**Endpoint:** `GET /api/assistant/examples`

**Test via curl:**
```bash
curl http://localhost:5000/api/assistant/examples
```

---

## 8. Administration

### 8.1 Obtenir tous les utilisateurs

**Endpoint:** `GET /api/admin/users`

**Test via curl:**
```bash
curl http://localhost:5000/api/admin/users
```

**Requête SPARQL:**
```sparql
PREFIX ex: <http://example.org/>

SELECT ?username ?email ?firstName ?lastName
WHERE {
  ?user a ex:User ;
        ex:username ?username ;
        ex:email ?email ;
        ex:firstName ?firstName ;
        ex:lastName ?lastName .
}
ORDER BY ?username
```

---

### 8.2 Statistiques globales

**Endpoint:** `GET /api/admin/stats`

**Test via curl:**
```bash
curl http://localhost:5000/api/admin/stats
```

**Requêtes SPARQL:**

#### Nombre total d'utilisateurs
```sparql
PREFIX ex: <http://example.org/>

SELECT (COUNT(?user) as ?totalUsers)
WHERE {
  ?user a ex:User .
}
```

#### Nombre total de paiements
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT (COUNT(?payment) as ?totalPayments)
WHERE {
  ?payment a sh:PaiementFacture .
}
```

#### Revenu total
```sparql
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT (SUM(xsd:decimal(?montant)) as ?totalRevenue)
WHERE {
  ?payment a sh:PaiementFacture ;
           sh:montant ?montant ;
           sh:statusPaiement "PAID" .
}
```

#### Nombre de services
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT (COUNT(?service) as ?totalServices)
WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
}
```

---

## 🧪 Script de Test Complet

### Créer un jeu de données complet

**Fichier: `test-data-complete.ttl`**

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix sh: <http://www.smarthealth-tracker.com/ontologie#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# ========================================
# SERVICES MÉDICAUX
# ========================================

sh:ConsultationCardiologie rdf:type sh:Consultation ;
    sh:label "Consultation Cardiologie" ;
    sh:description "Examen cardiologique complet avec ECG" ;
    sh:duration "30" ;
    sh:price "80.00" .

sh:ConsultationDermatologie rdf:type sh:Consultation ;
    sh:label "Consultation Dermatologie" ;
    sh:description "Consultation dermatologique" ;
    sh:duration "20" ;
    sh:price "60.00" .

sh:ConsultationPsychologie rdf:type sh:Consultation ;
    sh:label "Consultation Psychologie" ;
    sh:description "Séance de psychologie" ;
    sh:duration "45" ;
    sh:price "70.00" .

sh:AnalyseSanguine rdf:type sh:Analyse ;
    sh:label "Analyse Sanguine Complète" ;
    sh:description "Bilan sanguin complet" ;
    sh:duration "15" ;
    sh:price "45.00" .

sh:AnalyseUrine rdf:type sh:Analyse ;
    sh:label "Analyse d'Urine" ;
    sh:description "Analyse d'urine standard" ;
    sh:duration "10" ;
    sh:price "25.00" .

sh:TeleconsultationGeneraliste rdf:type sh:Telemedecine ;
    sh:label "Téléconsultation Généraliste" ;
    sh:description "Consultation à distance avec un médecin généraliste" ;
    sh:duration "15" ;
    sh:price "35.00" .

# ========================================
# PROGRAMMES DE SANTÉ
# ========================================

sh:ProgrammeDiabete rdf:type sh:ProgrammeSante ;
    sh:label "Programme Diabète" ;
    sh:description "Suivi et gestion du diabète de type 2" ;
    sh:duration "90" ;
    sh:category "Chronique" .

sh:ProgrammeCardiaque rdf:type sh:ProgrammeSante ;
    sh:label "Programme Cardiaque" ;
    sh:description "Prévention des maladies cardiovasculaires" ;
    sh:duration "120" ;
    sh:category "Prévention" .

sh:ProgrammeNutrition rdf:type sh:ProgrammeSante ;
    sh:label "Programme Nutrition" ;
    sh:description "Rééquilibrage alimentaire et suivi nutritionnel" ;
    sh:duration "60" ;
    sh:category "Bien-être" .
```

---

## 📊 Vérifications Rapides

### Vérifier que tout est bien inséré

```sparql
# Compter tous les triples
SELECT (COUNT(*) as ?totalTriples)
WHERE { ?s ?p ?o }

# Compter par type
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?type (COUNT(?s) as ?count)
WHERE { ?s rdf:type ?type }
GROUP BY ?type
ORDER BY DESC(?count)

# Lister tous les utilisateurs
PREFIX ex: <http://example.org/>
SELECT ?user ?username ?email
WHERE {
  ?user a ex:User ;
        ex:username ?username ;
        ex:email ?email .
}

# Lister tous les services
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
SELECT ?service ?label ?price
WHERE {
  ?service sh:label ?label ;
           sh:price ?price .
}

# Lister tous les paiements
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
SELECT ?payment ?montant ?date ?status
WHERE {
  ?payment a sh:PaiementFacture ;
           sh:montant ?montant ;
           sh:datePaiement ?date ;
           sh:statusPaiement ?status .
}
ORDER BY DESC(?date)
```

---

## 🚀 Ordre de Test Recommandé

1. **Créer des utilisateurs** (Signup)
2. **Insérer les services** dans Fuseki
3. **Insérer les programmes** dans Fuseki
4. **Créer des paiements** via l'API
5. **Inscrire aux programmes** via l'API
6. **Tester l'assistant** avec différentes questions
7. **Vérifier les statistiques** admin
8. **Tester les recommandations**

---

**Tous les scripts sont prêts à être utilisés! 🎯**
