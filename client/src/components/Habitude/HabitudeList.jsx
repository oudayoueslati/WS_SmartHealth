import React, { useEffect, useState } from "react";
import { getAllHabitudes, deleteHabitude } from "../../api/habitudeApi";
import HabitudeForm from "./HabitudeForm";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "../Sidebar/Sidebar";
import Header from "components/Headers/Header.js";
    
const HabitudeList = () => {
  const [habitudes, setHabitudes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedHabitude, setSelectedHabitude] = useState(null); // Pour la sidebar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, logout, loading: authLoading } = useAuth();

  // ✅ FONCTION: CHARGER_HABITUDES - Charger toutes les habitudes
  const chargerHabitudes = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await getAllHabitudes();
      
      if (!res.data) {
        setHabitudes([]);
        return;
      }

      const habitudesFormatees = formaterDonneesHabitudes(res.data);
      setHabitudes(habitudesFormatees);
    } catch (err) {
      console.error("❌ CHARGER_HABITUDES - Erreur:", err);
      setError("Impossible de charger les habitudes.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION: FORMATER_DONNEES_HABITUDES - Formater les données RDF
  const formaterDonneesHabitudes = (donneesRDF) => {
    if (!Array.isArray(donneesRDF)) return [];

    return donneesRDF.map((habitude, index) => {
      // Extraire l'ID
      const idComplet = habitude.habit?.value || "";
      const idSimple = idComplet.includes('#') ? idComplet.split('#')[1] : idComplet;
      
      // Extraire le type
      const typeComplet = habitude.type?.value || "";
      const typeSimple = typeComplet.includes('#') ? typeComplet.split('#')[1] : typeComplet;

      return {
        id: idComplet,
        idSimple: idSimple,
        type: typeSimple,
        title: habitude.title?.value || "",
        description: habitude.desc?.value || "",
        calories: habitude.calories?.value || "",
        hours: habitude.hours?.value || "",
        steps: habitude.steps?.value || "",
        rawData: habitude
      };
    }).filter(h => h.title);
  };

  // ✅ FONCTION: SUPPRIMER_HABITUDE - Supprimer une habitude
  const supprimerHabitude = async (habitudeId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette habitude ?")) return;

    try {
      await deleteHabitude(habitudeId);
      chargerHabitudes();
      setSelectedHabitude(null); // Fermer la sidebar
    } catch (err) {
      console.error("❌ SUPPRIMER_HABITUDE - Erreur:", err);
      alert("Erreur lors de la suppression.");
    }
  };

  // ✅ FONCTION: OBTENIR_COULEUR_TYPE - Couleur selon le type
  const obtenirCouleurType = (type) => {
    const couleurs = {
      'Sommeil': '#3498db',
      'Nutrition': '#2ecc71', 
      'ActivitéPhysique': '#e74c3c',
      'Stress': '#9b59b6'
    };
    return couleurs[type] || '#7f8c8d';
  };

  // ✅ FONCTION: AFFICHER_DETAILS_COMPLETS - Afficher tous les détails dans la sidebar
  const afficherDetailsComplets = (habitude) => {
    if (!habitude) return null;

    return (
     
      <div style={{ 
        position: 'fixed',
        right: '0',
        top: '0',
        width: '400px',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
        padding: '20px',
        overflowY: 'auto',
        zIndex: 1000
      }}>
        {/* En-tête de la sidebar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>📋 Détails de l'Habitude</h3>
          <button 
            onClick={() => setSelectedHabitude(null)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              color: '#7f8c8d'
            }}
          >
            ✕
          </button>
        </div>

        {/* Informations principales */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '1.3em' }}>
              {habitude.title}
            </h4>
            <span style={{ 
              color: "white", 
              fontSize: "0.8em",
              backgroundColor: obtenirCouleurType(habitude.type),
              padding: "6px 12px",
              borderRadius: "20px",
              fontWeight: "bold"
            }}>
              {habitude.type}
            </span>
          </div>

          {habitude.description && (
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <strong style={{ color: '#555', display: 'block', marginBottom: '5px' }}>
                📝 Description:
              </strong>
              <div style={{ color: '#666', lineHeight: '1.5' }}>
                {habitude.description}
              </div>
            </div>
          )}
        </div>

        {/* Détails spécifiques selon le type */}
        <div style={{ marginBottom: '25px' }}>
          <h5 style={{ color: '#2c3e50', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            📊 Données Spécifiques
          </h5>
          
          {habitude.type === "Nutrition" && habitude.calories && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#e8f5e8',
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#27ae60' }}>🔥 Calories:</span>
              <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{habitude.calories} kcal</span>
            </div>
          )}
          
          {habitude.type === "Sommeil" && habitude.hours && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#e3f2fd',
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#2980b9' }}>😴 Heures de sommeil:</span>
              <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{habitude.hours}h</span>
            </div>
          )}
          
          {habitude.type === "ActivitéPhysique" && habitude.steps && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#ffebee',
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#c0392b' }}>🏃 Pas effectués:</span>
              <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{habitude.steps} pas</span>
            </div>
          )}

          {!habitude.calories && !habitude.hours && !habitude.steps && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#7f8c8d',
              fontStyle: 'italic'
            }}>
              Aucune donnée spécifique enregistrée
            </div>
          )}
        </div>

        {/* Informations techniques */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '25px'
        }}>
          <h5 style={{ color: '#2c3e50', marginBottom: '10px' }}>🔧 Informations Techniques</h5>
          
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#555', fontSize: '0.9em' }}>🆔 ID Simple:</strong>
            <div style={{ color: '#666', fontSize: '0.9em', wordBreak: 'break-all' }}>
              {habitude.idSimple}
            </div>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#555', fontSize: '0.9em' }}>🔗 URI Complète:</strong>
            <div style={{ color: '#888', fontSize: '0.8em', wordBreak: 'break-all' }}>
              {habitude.id}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              setSelected(habitude);
              setSelectedHabitude(null);
            }}
            style={{ 
              flex: 1,
              padding: "12px",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "0.9em"
            }}
          >
            ✏️ Modifier
          </button>
          <button 
            onClick={() => supprimerHabitude(habitude.idSimple)}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "0.9em"
            }}
          >
            🗑️ Supprimer
          </button>
          
        </div>
        
      </div>
      
    );
    
  };

  // ✅ FONCTION: AFFICHER_CARTE_HABITUDE - Carte simplifiée dans la liste
  const afficherCarteHabitude = (habitude) => {
    return (
      
      <div 
        key={habitude.id} 
        onClick={() => setSelectedHabitude(habitude)}
        style={{ 
          marginBottom: "15px", 
          padding: "15px", 
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          ':hover': {
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 5px 0", color: "#2c3e50" }}>
              {habitude.title}
            </h4>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9em" }}>
              {habitude.description || "Aucune description"}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ 
              color: "white", 
              fontSize: "0.7em",
              backgroundColor: obtenirCouleurType(habitude.type),
              padding: "4px 8px",
              borderRadius: "12px",
              fontWeight: "bold",
              display: 'block',
              marginBottom: '5px'
            }}>
              {habitude.type}
            </span>
            {habitude.calories && (
              <div style={{ fontSize: "0.8em", color: "#27ae60" }}>🔥 {habitude.calories} kcal</div>
            )}
            {habitude.hours && (
              <div style={{ fontSize: "0.8em", color: "#2980b9" }}>😴 {habitude.hours}h</div>
            )}
            {habitude.steps && (
              <div style={{ fontSize: "0.8em", color: "#c0392b" }}>🏃 {habitude.steps} pas</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      chargerHabitudes();
    }
  }, [user]);

  if (authLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>;
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>🔐 Connexion Requise</h3>
        <p>Veuillez vous connecter pour gérer vos habitudes.</p>
        <button onClick={() => window.location.href = '/login'}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Contenu principal */}
      <div style={{ 
        flex: 1, 
        padding: '20px',
        marginRight: selectedHabitude ? '400px' : '0',
        transition: 'margin-right 0.3s ease'
      }}>
        {/* En-tête */}
        <div style={{ 
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>🧩 Gestion des Habitudes</h1>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Cliquez sur une habitude pour voir les détails</p>
        </div>

        {/* Formulaire */}
        <HabitudeForm
          onSuccess={() => {
            chargerHabitudes();
            setSelected(null);
          }}
          selected={selected}
        />

        {/* États */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '1.2em', color: '#7f8c8d' }}>🔄 Chargement des habitudes...</div>
          </div>
        )}
        
        {error && (
          <div style={{ 
            backgroundColor: "#e74c3c", 
            color: "white", 
            padding: "15px", 
            borderRadius: "5px",
            margin: "20px 0",
            textAlign: 'center'
          }}>
            <strong>❌ Erreur:</strong> {error}
            <button onClick={chargerHabitudes} style={{ marginLeft: '10px' }}>
              🔄 Réessayer
            </button>
          </div>
        )}

        {/* Liste des habitudes */}
        {!loading && habitudes.length === 0 && !error && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#7f8c8d',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#95a5a6' }}>Aucune habitude enregistrée</h3>
            <p>Ajoutez votre première habitude !</p>
          </div>
        )}

        {!loading && habitudes.length > 0 && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#2c3e50', margin: 0 }}>
                📊 Mes Habitudes ({habitudes.length})
              </h3>
              <button onClick={chargerHabitudes}>
                🔄 Actualiser
              </button>
            </div>
            <div>
              {habitudes.map(afficherCarteHabitude)}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar des détails */}
      {selectedHabitude && afficherDetailsComplets(selectedHabitude)}
    </div>
    
  );
  
};

export default HabitudeList;