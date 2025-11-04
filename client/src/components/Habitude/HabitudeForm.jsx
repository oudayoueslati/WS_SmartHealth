import React, { useState, useEffect } from "react";
import { createHabitude, updateHabitude } from "../../api/habitudeApi";

const HabitudeForm = ({ onSuccess, selected }) => {
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    calories: "",
    hours: "",
    steps: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // ✅ FONCTION: VALIDER_FORMULAIRE - Contrôles de saisie
  const validerFormulaire = () => {
    const erreurs = {};

    // Validation du type
    if (!formData.type.trim()) {
      erreurs.type = "Le type d'habitude est requis";
    }

    // Validation du titre
    if (!formData.title.trim()) {
      erreurs.title = "Le titre est requis";
    } else if (formData.title.length < 2) {
      erreurs.title = "Le titre doit contenir au moins 2 caractères";
    } else if (formData.title.length > 50) {
      erreurs.title = "Le titre ne peut pas dépasser 50 caractères";
    }

    // Validation de la description
    if (formData.description.length > 200) {
      erreurs.description = "La description ne peut pas dépasser 200 caractères";
    }

    // Validations spécifiques selon le type
    if (formData.type === "Nutrition" && formData.calories) {
      const calories = parseInt(formData.calories);
      if (isNaN(calories) || calories < 0) {
        erreurs.calories = "Les calories doivent être un nombre positif";
      } else if (calories > 10000) {
        erreurs.calories = "Les calories ne peuvent pas dépasser 10000";
      }
    }

    if (formData.type === "Sommeil" && formData.hours) {
      const heures = parseFloat(formData.hours);
      if (isNaN(heures) || heures < 0) {
        erreurs.hours = "Les heures doivent être un nombre positif";
      } else if (heures > 24) {
        erreurs.hours = "Les heures ne peuvent pas dépasser 24";
      }
    }

    if (formData.type === "ActivitéPhysique" && formData.steps) {
      const pas = parseInt(formData.steps);
      if (isNaN(pas) || pas < 0) {
        erreurs.steps = "Le nombre de pas doit être un nombre positif";
      } else if (pas > 100000) {
        erreurs.steps = "Le nombre de pas ne peut pas dépasser 100000";
      }
    }

    setValidationErrors(erreurs);
    return Object.keys(erreurs).length === 0;
  };

  // ✅ FONCTION: GERER_CHANGEMENT - Gérer les changements de champs
  const gererChangement = (e) => {
    const { name, value } = e.target;
    
    // Nettoyage des données
    let valeurNettoyee = value;
    
    if (name === "calories" || name === "steps") {
      // Uniquement des nombres entiers positifs
      valeurNettoyee = value.replace(/[^0-9]/g, '');
    } else if (name === "hours") {
      // Nombres décimaux positifs
      valeurNettoyee = value.replace(/[^0-9.]/g, '');
      // Un seul point décimal
      const points = valeurNettoyee.split('.');
      if (points.length > 2) {
        valeurNettoyee = points[0] + '.' + points.slice(1).join('');
      }
    } else if (name === "title") {
      // Limiter la longueur du titre
      if (value.length > 50) {
        return;
      }
    } else if (name === "description") {
      // Limiter la longueur de la description
      if (value.length > 200) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: valeurNettoyee
    }));

    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // ✅ FONCTION: SOUMETTRE_FORMULAIRE - Soumettre le formulaire
  const soumettreFormulaire = async (e) => {
    e.preventDefault();
    
    if (!validerFormulaire()) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Préparer les données pour l'API
      const donneesAPI = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        ...(formData.type === "Nutrition" && { 
          calories: formData.calories ? parseInt(formData.calories) : undefined 
        }),
        ...(formData.type === "Sommeil" && { 
          hours: formData.hours ? parseFloat(formData.hours) : undefined 
        }),
        ...(formData.type === "ActivitéPhysique" && { 
          steps: formData.steps ? parseInt(formData.steps) : undefined 
        })
      };

      console.log("📤 SOUMETTRE_FORMULAIRE - Données:", donneesAPI);

      if (selected) {
        // Mise à jour
        const idAModifier = selected.idSimple || selected.id;
        await updateHabitude(idAModifier, donneesAPI);
      } else {
        // Création
        await createHabitude(donneesAPI);
      }
      
      onSuccess();
    } catch (error) {
      console.error("❌ SOUMETTRE_FORMULAIRE - Erreur:", error);
      setError("Erreur lors de l'enregistrement: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION: REINITIALISER_FORMULAIRE - Réinitialiser le formulaire
  const reinitialiserFormulaire = () => {
    setFormData({
      type: "",
      title: "",
      description: "",
      calories: "",
      hours: "",
      steps: ""
    });
    setValidationErrors({});
    setError("");
  };

  // Effet pour remplir le formulaire en mode édition
  useEffect(() => {
    if (selected) {
      setFormData({
        type: selected.type || "",
        title: selected.title || "",
        description: selected.description || "",
        calories: selected.calories || "",
        hours: selected.hours || "",
        steps: selected.steps || ""
      });
    } else {
      reinitialiserFormulaire();
    }
  }, [selected]);

  // ✅ FONCTION: AFFICHER_CHAMPS_SPECIFIQUES - Afficher les champs selon le type
  const afficherChampsSpecifiques = () => {
    const champs = {
      "Nutrition": (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            🔥 Calories consommées:
          </label>
          <input
            type="text"
            name="calories"
            value={formData.calories}
            onChange={gererChangement}
            placeholder="Ex: 500 (optionnel)"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: validationErrors.calories ? '2px solid #e74c3c' : '2px solid #ced4da',
              fontSize: '1em'
            }}
          />
          {validationErrors.calories && (
            <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '5px' }}>
              ⚠️ {validationErrors.calories}
            </div>
          )}
        </div>
      ),
      "Sommeil": (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            😴 Heures de sommeil:
          </label>
          <input
            type="text"
            name="hours"
            value={formData.hours}
            onChange={gererChangement}
            placeholder="Ex: 7.5 (optionnel)"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: validationErrors.hours ? '2px solid #e74c3c' : '2px solid #ced4da',
              fontSize: '1em'
            }}
          />
          {validationErrors.hours && (
            <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '5px' }}>
              ⚠️ {validationErrors.hours}
            </div>
          )}
        </div>
      ),
      "ActivitéPhysique": (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            🏃 Pas effectués:
          </label>
          <input
            type="text"
            name="steps"
            value={formData.steps}
            onChange={gererChangement}
            placeholder="Ex: 10000 (optionnel)"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: validationErrors.steps ? '2px solid #e74c3c' : '2px solid #ced4da',
              fontSize: '1em'
            }}
          />
          {validationErrors.steps && (
            <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '5px' }}>
              ⚠️ {validationErrors.steps}
            </div>
          )}
        </div>
      )
    };

    return champs[formData.type] || null;
  };

  return (
    <div style={{ 
      marginBottom: "30px", 
      padding: '25px', 
      border: '2px solid #e9ecef', 
      borderRadius: '10px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>
        {selected ? "✏️ Modifier une Habitude" : "➕ Ajouter une Habitude"}
      </h3>
      
      {error && (
        <div style={{ 
          color: "white", 
          backgroundColor: "#e74c3c", 
          padding: "10px", 
          borderRadius: "5px",
          marginBottom: "15px"
        }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={soumettreFormulaire}>
        {/* Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            🏷️ Type d'habitude:
          </label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={gererChangement} 
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '5px', 
              border: validationErrors.type ? '2px solid #e74c3c' : '2px solid #ced4da',
              fontSize: '1em'
            }}
          >
            <option value="">Sélectionnez un type</option>
            <option value="Sommeil">😴 Sommeil</option>
            <option value="Nutrition">🍎 Nutrition</option>
            <option value="ActivitéPhysique">🏃 Activité Physique</option>
            <option value="Stress">🧘 Stress</option>
          </select>
          {validationErrors.type && (
            <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '5px' }}>
              ⚠️ {validationErrors.type}
            </div>
          )}
        </div>

        {/* Titre */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            📝 Titre:
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={gererChangement}
            placeholder="Ex: Course du matin"
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '5px', 
              border: validationErrors.title ? '2px solid #e74c3c' : '2px solid #ced4da',
              fontSize: '1em'
            }}
          />
          <div style={{ fontSize: '0.8em', color: '#6c757d', marginTop: '5px' }}>
            {formData.title.length}/50 caractères
          </div>
          {validationErrors.title && (
            <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '5px' }}>
              ⚠️ {validationErrors.title}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            📄 Description:
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={gererChangement}
            placeholder="Décrivez votre habitude..."
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '5px', 
              border: validationErrors.description ? '2px solid #e74c3c' : '2px solid #ced4da', 
              minHeight: '100px',
              fontSize: '1em',
              resize: 'vertical'
            }}
          />
          <div style={{ fontSize: '0.8em', color: '#6c757d', marginTop: '5px' }}>
            {formData.description.length}/200 caractères
          </div>
          {validationErrors.description && (
            <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '5px' }}>
              ⚠️ {validationErrors.description}
            </div>
          )}
        </div>

        {/* Champs spécifiques selon le type */}
        {afficherChampsSpecifiques()}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '12px 25px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              minWidth: '150px'
            }}
          >
            {loading ? "⏳ En cours..." : (selected ? "✅ Mettre à jour" : "➕ Ajouter")}
          </button>
          
          {selected && (
            <button 
              type="button" 
              onClick={() => onSuccess()}
              style={{
                padding: '12px 25px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1em',
                minWidth: '120px'
              }}
            >
              ↩️ Annuler
            </button>
          )}
          
          {!selected && (
            <button 
              type="button" 
              onClick={reinitialiserFormulaire}
              style={{
                padding: '12px 25px',
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1em',
                minWidth: '120px'
              }}
            >
              🗑️ Effacer
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default HabitudeForm;