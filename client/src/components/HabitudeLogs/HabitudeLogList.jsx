import React, { useEffect, useState } from "react";
import { getAllLogs, deleteLog, createLog, updateLog } from "../../api/habitudeLogsApi";
import { useAuth } from "../../context/AuthContext";

const HabitudeLogList = () => {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // ✅ FONCTION: CHARGER_LOGS - Charger tous les logs
  const chargerLogs = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await getAllLogs();
      
      console.log("✅ CHARGER_LOGS - Données reçues:", res.data);

      if (!res.data) {
        setLogs([]);
        return;
      }

      const logsFormates = formaterDonneesLogs(res.data);
      setLogs(logsFormates);
    } catch (err) {
      console.error("❌ CHARGER_LOGS - Erreur:", err);
      const message = err.response?.data?.error || err.message || "Erreur de connexion au serveur";
      setError(`Impossible de charger les logs: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION: FORMATER_DONNEES_LOGS - Formater les données RDF des logs
  const formaterDonneesLogs = (donneesRDF) => {
    if (!Array.isArray(donneesRDF)) return [];

    return donneesRDF.map((log, index) => {
      // Extraire l'ID
      const idComplet = log.log?.value || "";
      const idSimple = idComplet.includes('#') ? idComplet.split('#')[1] : idComplet;
      
      // Extraire le type
      const typeComplet = log.type?.value || "";
      const typeSimple = typeComplet.includes('#') ? typeComplet.split('#')[1] : typeComplet;

      // Extraire les IDs d'habitude et utilisateur
      const habitIdComplet = log.habitId?.value || "";
      const habitIdSimple = habitIdComplet.includes('#') ? habitIdComplet.split('#')[1] : habitIdComplet;
      
      const userIdComplet = log.userId?.value || "";
      const userIdSimple = userIdComplet.includes('#') ? userIdComplet.split('#')[1] : userIdComplet;

      return {
        id: idComplet,
        idSimple: idSimple,
        type: typeSimple,
        date: log.date?.value || "",
        value: log.value?.value || "",
        habitId: habitIdSimple,
        userId: userIdSimple,
        rawData: log
      };
    }).filter(log => log.type && log.date); // Filtrer les logs sans type ou date
  };

  // ✅ FONCTION: SUPPRIMER_LOG - Supprimer un log
  const supprimerLog = async (logId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce log ?")) return;

    try {
      await deleteLog(logId);
      chargerLogs(); // Recharger la liste
    } catch (err) {
      console.error("❌ SUPPRIMER_LOG - Erreur:", err);
      const message = err.response?.data?.error || err.message || "Erreur inconnue";
      alert(`Erreur lors de la suppression: ${message}`);
    }
  };

  // ✅ FONCTION: OBTENIR_ICONE_TYPE - Icône selon le type de log
  const obtenirIconeType = (type) => {
    const icones = {
      'Sommeil_Log': '😴',
      'Nutrition_Log': '🍎',
      'Activité_Log': '🏃',
      'Stress_Log': '🧘'
    };
    return icones[type] || '📊';
  };

  // ✅ FONCTION: OBTENIR_COULEUR_TYPE - Couleur selon le type de log
  const obtenirCouleurType = (type) => {
    const couleurs = {
      'Sommeil_Log': '#3498db',
      'Nutrition_Log': '#2ecc71',
      'Activité_Log': '#e74c3c',
      'Stress_Log': '#9b59b6'
    };
    return couleurs[type] || '#7f8c8d';
  };

  // ✅ FONCTION: FORMATER_DATE - Formater la date pour l'affichage
  const formaterDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // ✅ FONCTION: OBTENIR_UNITE - Unité selon le type de log
  const obtenirUnite = (type) => {
    const unites = {
      'Sommeil_Log': 'heures',
      'Nutrition_Log': 'calories',
      'Activité_Log': 'pas',
      'Stress_Log': 'niveau'
    };
    return unites[type] || 'unités';
  };

  // ✅ FONCTION: FORMULAIRE_LOG - Formulaire pour créer/modifier un log
  const FormulaireLog = () => {
    const [formData, setFormData] = useState({
      type: "",
      date: new Date().toISOString().slice(0, 16),
      value: "",
      habitId: ""
    });
    const [soumission, setSoumission] = useState(false);
    const [erreurForm, setErreurForm] = useState("");

    useEffect(() => {
      if (selectedLog) {
        setFormData({
          type: selectedLog.type || "",
          date: selectedLog.date ? new Date(selectedLog.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          value: selectedLog.value || "",
          habitId: selectedLog.habitId || ""
        });
      } else {
        setFormData({
          type: "",
          date: new Date().toISOString().slice(0, 16),
          value: "",
          habitId: ""
        });
      }
    }, [selectedLog]);

    const gererChangement = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Effacer l'erreur quand l'utilisateur modifie
      if (erreurForm) setErreurForm("");
    };

    const validerFormulaire = () => {
      if (!formData.type.trim()) {
        return "Le type de log est requis";
      }
      if (!formData.date.trim()) {
        return "La date est requise";
      }
      if (!formData.value.trim() || isNaN(parseFloat(formData.value))) {
        return "La valeur doit être un nombre valide";
      }
      if (!formData.habitId.trim()) {
        return "L'ID de l'habitude est requis";
      }
      return null;
    };

    const soumettreFormulaire = async (e) => {
      e.preventDefault();
      
      const erreurValidation = validerFormulaire();
      if (erreurValidation) {
        setErreurForm(erreurValidation);
        return;
      }

      try {
        setSoumission(true);
        setErreurForm("");
        
        const donneesLog = {
          type: formData.type,
          date: new Date(formData.date).toISOString(),
          value: parseFloat(formData.value),
          habitId: formData.habitId,
          userId: user?.id || user?.email || "utilisateur_par_defaut"
        };

        console.log("📤 Envoi des données log:", donneesLog);

        if (selectedLog) {
          await updateLog(selectedLog.idSimple, donneesLog);
        } else {
          await createLog(donneesLog);
        }

        // Réinitialiser et fermer
        setSelectedLog(null);
        setShowForm(false);
        chargerLogs();
      } catch (error) {
        console.error("❌ Erreur soumission log:", error);
        const message = error.response?.data?.error || error.message || "Erreur inconnue";
        setErreurForm(`Erreur lors de l'enregistrement: ${message}`);
      } finally {
        setSoumission(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        zIndex: 1000,
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
          {selectedLog ? '✏️ Modifier le Log' : '➕ Nouveau Log d\'Habitude'}
        </h3>

        {erreurForm && (
          <div style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            ❌ {erreurForm}
          </div>
        )}

        <form onSubmit={soumettreFormulaire}>
          {/* Type de log */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Type de Log: *
            </label>
            <select 
              name="type" 
              value={formData.type} 
              onChange={gererChangement}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: '1px solid #ddd' 
              }}
            >
              <option value="">Sélectionnez un type</option>
              <option value="Sommeil_Log">😴 Log Sommeil (heures)</option>
              <option value="Nutrition_Log">🍎 Log Nutrition (calories)</option>
              <option value="Activité_Log">🏃 Log Activité (pas)</option>
              <option value="Stress_Log">🧘 Log Stress (niveau 1-10)</option>
            </select>
          </div>

          {/* Date et heure */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date et Heure: *
            </label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={gererChangement}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: '1px solid #ddd' 
              }}
            />
          </div>

          {/* Valeur */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Valeur: *
            </label>
            <input
              type="number"
              step="0.1"
              name="value"
              value={formData.value}
              onChange={gererChangement}
              placeholder={
                formData.type === 'Sommeil_Log' ? 'Ex: 7.5 (heures de sommeil)' :
                formData.type === 'Nutrition_Log' ? 'Ex: 500 (calories)' :
                formData.type === 'Activité_Log' ? 'Ex: 10000 (pas)' :
                formData.type === 'Stress_Log' ? 'Ex: 3 (niveau de stress 1-10)' :
                'Entrez la valeur'
              }
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: '1px solid #ddd' 
              }}
            />
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
              {formData.type && `Unité: ${obtenirUnite(formData.type)}`}
            </div>
          </div>

          {/* ID Habitude */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              ID de l'Habitude: *
            </label>
            <input
              type="text"
              name="habitId"
              value={formData.habitId}
              onChange={gererChangement}
              placeholder="Ex: Habitude_123456789"
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: '1px solid #ddd' 
              }}
            />
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
              Trouvez l'ID dans la liste des habitudes
            </div>
          </div>

          {/* Informations utilisateur */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '0.9em'
          }}>
            <strong>Utilisateur:</strong> {user?.username || user?.email || "Non connecté"}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={() => {
                setSelectedLog(null);
                setShowForm(false);
                setErreurForm("");
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={soumission}
              style={{
                padding: '10px 20px',
                backgroundColor: soumission ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: soumission ? 'not-allowed' : 'pointer'
              }}
            >
              {soumission ? '⏳ Envoi...' : (selectedLog ? '✅ Modifier' : '➕ Ajouter')}
            </button>
          </div>
        </form>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      chargerLogs();
    }
  }, [user]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>📊 Logs des Habitudes</h1>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Suivi détaillé de vos habitudes quotidiennes</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1em'
          }}
        >
          ➕ Nouveau Log
        </button>
      </div>

      {/* États */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '1.2em', color: '#7f8c8d' }}>🔄 Chargement des logs...</div>
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
          <div style={{ marginTop: "10px" }}>
            <button 
              onClick={chargerLogs}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#e74c3c',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Liste des logs */}
      {!loading && logs.length === 0 && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#7f8c8d',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '4em', marginBottom: '20px' }}>📝</div>
          <h3 style={{ color: '#95a5a6' }}>Aucun log enregistré</h3>
          <p>Commencez par ajouter votre premier log pour suivre vos habitudes !</p>
          <button 
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            ➕ Créer mon premier log
          </button>
        </div>
      )}

      {/* Grille des logs */}
      {!loading && logs.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#2c3e50', margin: 0 }}>
              📈 Logs enregistrés ({logs.length})
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={chargerLogs}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Actualiser
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gap: '15px'
          }}>
            {logs.map((log) => (
              <div key={log.id} style={{ 
                padding: '20px', 
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                }
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  {/* Icône et type */}
                  <div style={{ 
                    fontSize: '2.5em',
                    textAlign: 'center'
                  }}>
                    {obtenirIconeType(log.type)}
                  </div>

                  {/* Informations principales */}
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        color: "white", 
                        fontSize: "0.7em",
                        backgroundColor: obtenirCouleurType(log.type),
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold"
                      }}>
                        {log.type.replace('_Log', '')}
                      </span>
                      <strong style={{ fontSize: '1.2em', color: '#2c3e50' }}>
                        {log.value} {obtenirUnite(log.type)}
                      </strong>
                    </div>
                    
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      <div>📅 <strong>{formaterDate(log.date)}</strong></div>
                      <div>🆔 Habitude: <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>{log.habitId}</code></div>
                      {log.userId && <div>👤 Utilisateur: {log.userId}</div>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <button 
                      onClick={() => {
                        setSelectedLog(log);
                        setShowForm(true);
                      }}
                      style={{ 
                        padding: "8px 12px",
                        backgroundColor: "#3498db",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "0.8em"
                      }}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={() => supprimerLog(log.idSimple)}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "0.8em"
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlay et formulaire */}
      {(showForm || selectedLog) && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
            onClick={() => {
              setSelectedLog(null);
              setShowForm(false);
            }}
          />
          <FormulaireLog />
        </>
      )}
    </div>
  );
};

export default HabitudeLogList;