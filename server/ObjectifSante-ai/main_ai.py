# ==============================================
# main.py — Backend AI pour SmartHealth
# ==============================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests, re, time, datetime

FUSEKI_ENDPOINT = "http://localhost:3030/SmartHealth"
PREFIX = "http://www.smarthealth-tracker.com/ontologie#"

app = FastAPI(title="SmartHealth AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------
# 🔹 Modèle Pydantic
# ----------------------------------------------
class AICommand(BaseModel):
    entity: str  # etat_sante / objectif
    command: str

# ----------------------------------------------
# 🔹 Fonctions utilitaires
# ----------------------------------------------
def send_sparql_update(query: str):
    r = requests.post(
        f"{FUSEKI_ENDPOINT}/update",
        data=query.encode("utf-8"),
        headers={"Content-Type": "application/sparql-update"},
    )
    r.raise_for_status()
    return {"success": True}

def send_sparql_select(query: str):
    r = requests.post(
        f"{FUSEKI_ENDPOINT}/query",
        data={"query": query},
        headers={"Accept": "application/sparql-results+json"},
    )
    r.raise_for_status()
    return r.json()

def detect_action(text: str):
    text = text.lower()
    if any(k in text for k in ["ajoute", "crée", "ajouter", "créer"]):
        return "create"
    if any(k in text for k in ["modifie", "mets à jour", "éditer"]):
        return "update"
    if any(k in text for k in ["supprime", "efface", "enlève"]):
        return "delete"
    if any(k in text for k in ["affiche", "liste", "montre", "cherche"]):
        return "read"
    return "read"

def extract_numbers(text):
    return [float(n) for n in re.findall(r"\d+\.?\d*", text)]

# ----------------------------------------------
# 🔹 Génération SPARQL : Etat de Santé
# ----------------------------------------------
def sparql_etat_sante(action: str, text: str):
    id_entity = f"etatSante_{int(time.time())}"
    poids, taille, temperature = None, None, None
    pression = "120/80"
    nums = extract_numbers(text)
    if len(nums) == 1:
        temperature = nums[0]
    elif len(nums) >= 2:
        poids, taille = nums[:2]

    now = datetime.datetime.utcnow().isoformat()

    if action == "create":
        return f"""
        PREFIX sh: <{PREFIX}>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        INSERT DATA {{
          sh:{id_entity} a sh:EtatSante ;
              sh:aPoids "{poids or 70}"^^xsd:decimal ;
              sh:aTaille "{taille or 1.75}"^^xsd:decimal ;
              sh:aPression "{pression}"^^xsd:string ;
              sh:aTemperature "{temperature or 37}"^^xsd:decimal ;
              sh:aDate "{now}"^^xsd:dateTime .
        }}
        """

    if action == "read":
        return f"""
        PREFIX sh: <{PREFIX}>
        SELECT ?etat ?poids ?taille ?pression ?temperature ?date
        WHERE {{
          ?etat a sh:EtatSante ;
                sh:aPoids ?poids ;
                sh:aTaille ?taille ;
                sh:aPression ?pression ;
                sh:aTemperature ?temperature ;
                sh:aDate ?date .
        }}
        ORDER BY DESC(?date)
        """

    if action == "delete":
        return f"PREFIX sh: <{PREFIX}> DELETE WHERE {{ ?s a sh:EtatSante ; ?p ?o . }}"

    if action == "update":
        return f"""
        PREFIX sh: <{PREFIX}>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        DELETE {{ ?s sh:aTemperature ?oldTemp }}
        INSERT {{ ?s sh:aTemperature "{temperature or 36.9}"^^xsd:decimal }}
        WHERE {{ ?s a sh:EtatSante ; sh:aTemperature ?oldTemp }}
        """

# ----------------------------------------------
# 🔹 Génération SPARQL : Objectif
# ----------------------------------------------
def sparql_objectif(action: str, text: str):
    id_entity = f"objectif_{int(time.time())}"
    now = datetime.datetime.utcnow().isoformat()

    if "poids" in text.lower():
        type_obj = "Perte de poids"
    elif "sport" in text.lower():
        type_obj = "Activité physique"
    else:
        type_obj = "Objectif général"

    if action == "create":
        return f"""
        PREFIX sh: <{PREFIX}>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        INSERT DATA {{
          sh:{id_entity} a sh:Objectif ;
              sh:aType "{type_obj}"^^xsd:string ;
              sh:aDescription "Créé automatiquement via AI"^^xsd:string ;
              sh:aEtat "En cours"^^xsd:string ;
              sh:aDateDebut "{now}"^^xsd:dateTime ;
              sh:aDateFin "{now}"^^xsd:dateTime .
        }}
        """

    if action == "read":
        return f"""
        PREFIX sh: <{PREFIX}>
        SELECT ?objectif ?type ?description ?etat ?dateDebut ?dateFin
        WHERE {{
          ?objectif a sh:Objectif ;
                    sh:aType ?type ;
                    sh:aDescription ?description ;
                    sh:aEtat ?etat ;
                    sh:aDateDebut ?dateDebut ;
                    sh:aDateFin ?dateFin .
        }}
        ORDER BY DESC(?dateDebut)
        """

    if action == "delete":
        return f"PREFIX sh: <{PREFIX}> DELETE WHERE {{ ?s a sh:Objectif ; ?p ?o . }}"

    if action == "update":
        return f"""
        PREFIX sh: <{PREFIX}>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        DELETE {{ ?s sh:aEtat ?oldEtat }}
        INSERT {{ ?s sh:aEtat "Terminé"^^xsd:string }}
        WHERE {{ ?s a sh:Objectif ; sh:aEtat ?oldEtat }}
        """

# ----------------------------------------------
# 🔹 Endpoint principal
# ----------------------------------------------
@app.post("/ai/execute")
def execute_ai(cmd: AICommand):
    try:
        entity = cmd.entity.lower()
        command = cmd.command.strip()
        action = detect_action(command)

        if entity not in ["etat_sante", "objectif"]:
            raise HTTPException(status_code=400, detail="Entité non reconnue")

        sparql = (
            sparql_etat_sante(action, command)
            if entity == "etat_sante"
            else sparql_objectif(action, command)
        )

        result = (
            send_sparql_select(sparql)
            if action == "read"
            else send_sparql_update(sparql)
        )

        return {
            "analysis": {"entity": entity, "action": action, "command": command},
            "sparql": sparql.strip(),
            "result": result,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"status": "running"}
