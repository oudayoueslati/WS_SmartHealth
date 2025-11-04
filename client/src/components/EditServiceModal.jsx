import React, { useState } from 'react';
import { updateService } from '../api';

export default function EditServiceModal({ service, onClose, onSaved }) {
  const [label, setLabel] = useState(service.label || '');
  const [type, setType] = useState(service.type || 'Consultation');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const id = service.id || service.uri.split(/[#\/]/).pop();
      await updateService(id, { label, type });
      if (onSaved) onSaved();
    } catch (err) { alert('Erreur: ' + err.message); }
    finally { setSaving(false); onClose(); }
  }

  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)'}}>
      <div style={{background:'#fff',padding:20,minWidth:320}}>
        <h3>Modifier {service.id}</h3>
        <div><label>Label</label><input value={label} onChange={e=>setLabel(e.target.value)} /></div>
        <div><label>Type</label>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option>Consultation</option><option>Analyse</option><option>Telemedecine</option>
          </select>
        </div>
        <div style={{marginTop:10}}>
          <button onClick={handleSave} disabled={saving}>{saving ? 'Envoi...' : 'Sauvegarder'}</button>{' '}
          <button onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
