# main.py - VERSION CORRIGÉE
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from ai_processor import MesuresAIProcessor
import uvicorn
import spacy  # ⬅️ AJOUTEZ CET IMPORT
import re     # ⬅️ AJOUTEZ CET IMPORT

app = FastAPI(title="AI Mesures API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation du processeur AI
ai_processor = MesuresAIProcessor()

class UserQuestion(BaseModel):
    question: str

class AIResponse(BaseModel):
    action: str
    natural_response: str
    data: Optional[Dict] = None
    filters: List[Dict] = []
    suggestions: List[str] = []
    success: bool = True

# Ajoutez cette classe pour les scores santé
class ScoresAIProcessor:
    def __init__(self):
        self.nlp = spacy.load("fr_core_news_sm")
        self.setup_patterns()
    
    def setup_patterns(self):
        self.crud_keywords = {
            'create': ['ajouter', 'ajoute', 'créer', 'nouveau', 'nouvelle', 'insérer'],
            'read': ['afficher', 'montrer', 'lister', 'voir', 'trouver', 'chercher'],
            'update': ['modifier', 'changer', 'éditer', 'mettre à jour', 'corriger'],
            'delete': ['supprimer', 'effacer', 'retirer', 'enlever']
        }
        
        self.score_fields = {
            'activite': ['activité', 'activite', 'exercice', 'sport', 'physique'],
            'globale': ['globale', 'global', 'général', 'general', 'total'],
            'nutrition': ['nutrition', 'alimentation', 'nourriture', 'diète'],
            'sommeil': ['sommeil', 'dormir', 'repos', 'nuit']
        }

    def process_question(self, question: str) -> Dict:
        print(f"🔍 Traitement score: {question}")
        doc = self.nlp(question.lower())
        
        action = self._detect_crud_action(question)
        entities = self._extract_entities(doc, question)
        filters = self._detect_filters(question)
        
        result = {
            'action': action,
            'entities': entities,
            'filters': filters,
            'original_question': question
        }
        
        print(f"🎯 Résultat analyse scores: {result}")
        return result
    
    def _detect_crud_action(self, question: str) -> str:
        question_lower = question.lower()
        
        for action, keywords in self.crud_keywords.items():
            for keyword in keywords:
                if keyword in question_lower:
                    print(f"✅ Action scores détectée: {action}")
                    return action
        
        return 'read'

    def _extract_entities(self, doc, question: str) -> Dict:
        entities = {}
        numbers = re.findall(r'\d+', question)
        
        for field, keywords in self.score_fields.items():
            for keyword in keywords:
                if keyword in question.lower() and numbers:
                    entities[field] = int(numbers[0])
                    print(f"✅ {field} = {numbers[0]}")
                    numbers.pop(0)
                    break
        
        return entities

    def _detect_filters(self, question: str) -> List[Dict]:
        filters = []
        question_lower = question.lower()
        numbers = re.findall(r'\d+', question_lower)
        
        # Filtres pour scores élevés
        if any(word in question_lower for word in ['élevé', 'haut', 'supérieur', 'excellent', 'bon']):
            filters.append({'field': 'globale', 'operator': '>', 'value': '80', 'description': 'Score excellent (>80)'})
        
        # Filtres pour scores faibles
        elif any(word in question_lower for word in ['faible', 'bas', 'inférieur', 'mauvais']):
            filters.append({'field': 'globale', 'operator': '<', 'value': '60', 'description': 'Score faible (<60)'})
        
        # Filtres avec nombres
        elif numbers:
            if '>' in question_lower or 'supérieur' in question_lower:
                filters.append({'field': 'globale', 'operator': '>', 'value': numbers[0], 'description': f'Score > {numbers[0]}'})
            elif '<' in question_lower or 'inférieur' in question_lower:
                filters.append({'field': 'globale', 'operator': '<', 'value': numbers[0], 'description': f'Score < {numbers[0]}'})
        
        return filters

    def generate_natural_response(self, analysis: Dict) -> str:
        action = analysis['action']
        entities = analysis['entities']
        filters = analysis['filters']
        
        if action == 'create':
            if entities:
                details = [f"{field}: {value}" for field, value in entities.items()]
                return f"Je vais créer un nouveau score santé avec {', '.join(details)}"
            return "Je vais ajouter un nouveau score santé"
        
        elif action == 'read':
            if filters:
                return f"Je recherche les scores santé correspondant aux critères"
            return "Voici tous vos scores santé"
        
        elif action == 'update':
            return "Je vais modifier le score santé sélectionné"
        
        elif action == 'delete':
            return "Je supprime le score santé comme demandé"
        
        return "J'ai compris votre demande concernant les scores santé"

# Initialisation
scores_ai_processor = ScoresAIProcessor()

# Ajoutez cette route
@app.post("/ai/process-scores", response_model=AIResponse)
async def process_scores_question(user_question: UserQuestion):
    try:
        print(f"📥 Question scores reçue: {user_question.question}")
        
        analysis = scores_ai_processor.process_question(user_question.question)
        natural_response = scores_ai_processor.generate_natural_response(analysis)
        
        data = {}
        if analysis['entities']:
            data = {
                'scoreActivite': str(analysis['entities'].get('activite', '')),
                'scoreGlobale': str(analysis['entities'].get('globale', '')),
                'scoreNutrition': str(analysis['entities'].get('nutrition', '')),
                'scoreSommeil': str(analysis['entities'].get('sommeil', ''))
            }
        
        response = AIResponse(
            action=analysis['action'],
            natural_response=natural_response,
            data=data if data else None,
            filters=analysis.get('filters', []),
            suggestions=[],
            success=True
        )
        
        return response
        
    except Exception as e:
        print(f"❌ Erreur scores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))    

@app.post("/ai/process", response_model=AIResponse)
async def process_question(user_question: UserQuestion):
    try:
        print(f"📥 Question reçue: {user_question.question}")
        
        # 1. Traitement de la question naturelle
        analysis = ai_processor.process_question(user_question.question)
        print(f"🔍 Analyse: {analysis}")
        
        # 2. Génération de la réponse naturelle
        natural_response = ai_processor.generate_natural_response(analysis)
        
        # 3. Génération des suggestions
        suggestions = ai_processor.generate_suggestions(analysis)
        
        # 4. Préparation des données pour le frontend
        data = {}
        if analysis['entities']:
            data = {
                'valeurIMC': str(analysis['entities'].get('imc', '')),
                'caloriesConsommees': str(analysis['entities'].get('calories', '')),
                'mesureValue': str(analysis['entities'].get('mesurevalue', ''))
            }
        
        response = AIResponse(
            action=analysis['action'],
            natural_response=natural_response,
            data=data if data else None,
            filters=analysis.get('filters', []),
            suggestions=suggestions,
            success=True
        )
        
        print(f"📤 Réponse envoyée: {response}")
        return response
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "AI Mesures API is running!"}

@app.get("/ai/health")
async def health_check():
    return {"status": "AI API is running", "version": "spaCy"}

if __name__ == "__main__":
    print("🚀 Starting AI Mesures API on http://localhost:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)