const PREFIXES = `
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
`;

class Habitude {
  constructor({ id, type, title, description, calories, hours, steps }) {
    this.id = id || `Habitude_${Date.now()}`;
    this.type = type; // Sommeil | Nutrition | ActivitéPhysique | Stress
    this.title = title;
    this.description = description;
    this.calories = calories;
    this.hours = hours;
    this.steps = steps;
  }

  toTTL() {
    let triples = `
ontologie:${this.id} a ontologie:${this.type} ;
  ontologie:aTitle "${this.title}" ;
  ontologie:aDescription "${this.description}" .
`;

    if (this.type === "Nutrition" && this.calories)
      triples += `ontologie:${this.id} ontologie:aCaloriesConsommées "${this.calories}"^^xsd:int .\n`;
    if (this.type === "Sommeil" && this.hours)
      triples += `ontologie:${this.id} ontologie:aNombreHeuresSommeil "${this.hours}"^^xsd:decimal .\n`;
    if (this.type === "ActivitéPhysique" && this.steps)
      triples += `ontologie:${this.id} ontologie:aPasEffectués "${this.steps}"^^xsd:int .\n`;

    return triples;
  }
}

module.exports = { PREFIXES, Habitude };
