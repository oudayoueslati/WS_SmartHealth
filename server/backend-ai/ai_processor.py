# ai_processor.py - Version corrigée
import spacy
import re
from typing import Dict, List

class MesuresAIProcessor:
    def __init__(self):
        # Charger le modèle français que vous venez d'installer
        self.nlp = spacy.load("fr_core_news_sm")
        self.setup_patterns()
    
    def setup_patterns(self):
        """Configuration des motifs pour comprendre le domaine des mesures"""
        self.crud_keywords = {
            'create': ['ajouter', 'ajoute', 'créer', 'nouveau', 'nouvelle', 'insérer', 'enregistrer'],
            'read': ['trouver', 'chercher', 'rechercher', 'afficher', 'montrer', 'lister', 'voir'],
            'update': ['modifier', 'changer', 'éditer', 'mettre à jour', 'corriger'],
            'delete': ['supprimer', 'effacer', 'retirer', 'enlever']
        }
        
        self.mesure_fields = {
            'imc': ['imc', 'indice masse', 'indice de masse corporelle'],
            'calories': ['calories', 'énergie', 'kcal'],
            'mesurevalue': ['mesure', 'pas', 'steps', 'activité', 'exercice']
        }

    def process_question(self, question: str) -> Dict:
        """Traite la question naturelle avec spaCy"""
        print(f"🔍 Traitement de la question: {question}")
        doc = self.nlp(question.lower())
        
        # Debug: afficher les tokens
        print(f"📝 Tokens: {[token.text for token in doc]}")
        
        action = self._detect_crud_action(question)
        entities = self._extract_entities_with_spacy(doc)
        filters = self._detect_filters(question)
        sort_config = self._detect_sort(question)
        
        result = {
            'action': action,
            'entities': entities,
            'filters': filters,
            'sort': sort_config,
            'original_question': question
        }
        
        print(f"🎯 Résultat analyse: {result}")
        return result
    
    def _detect_crud_action(self, question: str) -> str:
        """Détecte l'action CRUD - version améliorée"""
        question_lower = question.lower()
        print(f"🔎 Détection action CRUD: {question_lower}")
        
        for action, keywords in self.crud_keywords.items():
            for keyword in keywords:
                if keyword in question_lower:
                    print(f"✅ Action détectée: {action} (mot-clé: {keyword})")
                    return action
        
        print("ℹ️  Action par défaut: read")
        return 'read'

    def _extract_entities_with_spacy(self, doc) -> Dict:
        """Extrait les entités avec spaCy - version améliorée"""
        entities = {}
        
        print("🔍 Extraction des entités...")
        
        # Méthode 1: Extraction avec spaCy
        for ent in doc.ents:
            print(f"🏷️  Entité spaCy: {ent.text} (label: {ent.label_})")
            if ent.label_ in ["CARDINAL", "QUANTITY"]:
                # Associer aux champs basé sur le contexte
                for i in range(max(0, ent.start-3), min(len(doc), ent.end+3)):
                    token_text = doc[i].text.lower()
                    for field, keywords in self.mesure_fields.items():
                        if any(keyword in token_text for keyword in keywords):
                            try:
                                entities[field] = float(ent.text)
                                print(f"✅ {field} = {ent.text}")
                                break
                            except ValueError:
                                continue
        
        # Méthode 2: Fallback avec regex si spaCy ne trouve rien
        if not entities:
            numbers = re.findall(r'\d+\.?\d*', doc.text)
            print(f"🔢 Nombres trouvés par regex: {numbers}")
            
            for field, keywords in self.mesure_fields.items():
                for keyword in keywords:
                    if keyword in doc.text and numbers:
                        entities[field] = float(numbers[0])
                        print(f"✅ {field} = {numbers[0]} (fallback regex)")
                        numbers.pop(0)
                        break
        
        print(f"📊 Entités finales: {entities}")
        return entities

    def _detect_filters(self, question: str) -> List[Dict]:
        """Détecte les filtres dans la question - version améliorée"""
        filters = []
        question_lower = question.lower()
        
        print(f"🔍 Analyse des filtres pour: {question_lower}")
        
        # Filtres pour IMC avec plages spécifiques
        if any(word in question_lower for word in ['élevé', 'haut', 'supérieur', 'grand', 'obésité', 'surpoids']):
            filters.append({'field': 'imc', 'operator': '>', 'value': '25', 'description': 'IMC élevé (>25)'})
            print("✅ Filtre IMC élevé détecté")
        
        elif any(word in question_lower for word in ['normal', 'idéal', 'santé']):
            filters.append({'field': 'imc', 'operator': '>=', 'value': '18.5', 'description': 'IMC normal (18.5-25)'})
            filters.append({'field': 'imc', 'operator': '<=', 'value': '25', 'description': 'IMC normal (18.5-25)'})
            print("✅ Filtre IMC normal détecté")
        
        elif any(word in question_lower for word in ['faible', 'bas', 'inférieur', 'petit', 'maigreur']):
            filters.append({'field': 'imc', 'operator': '<', 'value': '18.5', 'description': 'IMC faible (<18.5)'})
            print("✅ Filtre IMC faible détecté")
        
        # Filtres pour calories
        if 'calories' in question_lower:
            if 'supérieur' in question_lower or 'plus de' in question_lower or '>' in question_lower:
                numbers = re.findall(r'\d+', question_lower)
                if numbers:
                    value = numbers[0]
                    filters.append({'field': 'calories', 'operator': '>', 'value': value, 'description': f'Calories > {value}'})
                    print(f"✅ Filtre calories > {value} détecté")
            
            elif 'inférieur' in question_lower or 'moins de' in question_lower or '<' in question_lower:
                numbers = re.findall(r'\d+', question_lower)
                if numbers:
                    value = numbers[0]
                    filters.append({'field': 'calories', 'operator': '<', 'value': value, 'description': f'Calories < {value}'})
                    print(f"✅ Filtre calories < {value} détecté")
            
            elif 'élevé' in question_lower or 'haut' in question_lower:
                filters.append({'field': 'calories', 'operator': '>', 'value': '2000', 'description': 'Calories élevées (>2000)'})
                print("✅ Filtre calories élevées détecté")
        
        print(f"📊 Filtres appliqués: {filters}")
        return filters

    def _detect_sort(self, question: str) -> Dict:
        """Détecte les demandes de tri"""
        question_lower = question.lower()
        
        if any(phrase in question_lower for phrase in ['plus haut', 'décroissant', 'du plus grand au plus petit']):
            return {'field': 'imc', 'direction': 'DESC'}
        elif any(phrase in question_lower for phrase in ['plus bas', 'croissant', 'du plus petit au plus grand']):
            return {'field': 'imc', 'direction': 'ASC'}
        elif 'trier' in question_lower and 'calories' in question_lower:
            return {'field': 'calories', 'direction': 'DESC'}
        
        return {}

    def generate_natural_response(self, analysis: Dict) -> str:
        """Génère une réponse naturelle"""
        action = analysis['action']
        entities = analysis['entities']
        filters = analysis['filters']
        
        if action == 'create':
            if entities:
                details = []
                if 'imc' in entities:
                    details.append(f"IMC: {entities['imc']}")
                if 'calories' in entities:
                    details.append(f"calories: {entities['calories']}")
                if 'mesurevalue' in entities:
                    details.append(f"mesure: {entities['mesurevalue']}")
                return f"Je vais créer une nouvelle mesure avec {', '.join(details)}"
            return "Je vais ajouter une nouvelle mesure"
        
        elif action == 'read':
            if filters:
                filter_descriptions = [f.get('description', f"{f['field']} {f['operator']} {f['value']}") for f in filters]
                return f"Je recherche les mesures avec: {', '.join(filter_descriptions)}"
            return "Voici toutes vos mesures"
        
        elif action == 'update':
            return "Je vais modifier la mesure sélectionnée"
        
        elif action == 'delete':
            return "Je supprime la mesure comme demandé"
        
        return "J'ai compris votre demande concernant les mesures"
    
    def generate_suggestions(self, analysis: Dict) -> List[str]:
        """Génère des suggestions contextuelles"""
        suggestions = []
        action = analysis['action']
        filters = analysis['filters']
        
        if action == 'read':
            if filters:
                suggestions = [
                    "Afficher aussi les statistiques",
                    "Exporter les résultats",
                    "Créer un graphique"
                ]
            else:
                suggestions = [
                    "Filtrer par IMC normal (18.5-25)",
                    "Afficher les calories moyennes", 
                    "Trier par date récente"
                ]
        elif action == 'create':
            suggestions = [
                "Ajouter un commentaire",
                "Enregistrer avec l'heure actuelle"
            ]
        
        return suggestions