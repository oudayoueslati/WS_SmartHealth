import spacy
from typing import Dict

class EtatSanteAIProcessor:
    def __init__(self):
        self.nlp = spacy.load("fr_core_news_sm")
        self.keywords = {
            "create": ["ajoute", "crée", "nouvel", "ajouter", "insère"],
            "read": ["affiche", "montre", "liste", "cherche", "voir"],
            "update": ["modifie", "corrige", "change"],
            "delete": ["supprime", "enlève", "retire"]
        }

    def process(self, command: str) -> Dict:
        doc = self.nlp(command.lower())
        action = self.detect_action(command)
        entities = self.extract_entities(doc)
        return {"action": action, "entities": entities, "original": command}

    def detect_action(self, text: str):
        text = text.lower()
        for action, keys in self.keywords.items():
            if any(k in text for k in keys):
                return action
        return "read"

    def extract_entities(self, doc):
        entities = {}
        for token in doc:
            if token.text.replace(",", ".").isdigit():
                entities["valeur"] = float(token.text)
            if token.text in ["allergie", "condition", "traitement"]:
                entities["type"] = token.text.capitalize()
        return entities

    def to_sparql(self, analysis: Dict) -> str:
        """Convertit l'analyse en requête SPARQL"""
        base = "PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n"
        act = analysis["action"]
        ent = analysis["entities"]

        if act == "create":
            type_class = ent.get("type", "ConditionMedicale")
            value = ent.get("valeur", 0)
            return base + f"""
INSERT DATA {{
  sh:etatSante_{id(self)} a sh:EtatSante , sh:{type_class} ;
      sh:aValeur "{value}"^^xsd:decimal .
}}"""

        elif act == "read":
            return base + """
SELECT ?etat ?type ?valeur WHERE {
  ?etat a sh:EtatSante ;
        sh:aValeur ?valeur ;
        a ?type .
}"""

        elif act == "delete":
            return base + """
DELETE WHERE { ?etat a sh:EtatSante . ?etat ?p ?o . }"""

        elif act == "update":
            return base + "# UPDATE logic à implémenter selon ton besoin"

        return base
