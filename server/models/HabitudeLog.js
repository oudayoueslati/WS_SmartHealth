const { PREFIXES } = require("./Habitude");

class HabitudeLog {
    constructor({ id, type, date, value, habitId, userId }) {
      this.id = id;
      this.type = type; // Sommeil_Log | Nutrition_Log | Activité_Log
      this.date = date;
      this.value = value;
      this.habitId = habitId;
      this.userId = userId;
    }
  
    toTTL() {
      // ⚠️ Ne PAS inclure PREFIX ici
      return `
  ontologie:${this.id} a ontologie:${this.type} ;
    ontologie:aDateLog "${this.date}"^^xsd:dateTime ;
    ontologie:aValeur "${this.value}"^^xsd:decimal ;
    ontologie:LogHabitude ontologie:${this.habitId}, ontologie:${this.userId} .
  `;
    }
  }
  


module.exports = { HabitudeLog };
