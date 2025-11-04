/**
 * Fuseki Client - Wrapper centralisé pour les interactions avec Apache Jena Fuseki
 * Documentation: https://jena.apache.org/documentation/fuseki2/
 */

const axios = require("axios");

class FusekiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.FUSEKI_URL || "http://localhost:3030/smarthealth";
    this.queryEndpoint = `${this.baseUrl}/query`;
    this.updateEndpoint = `${this.baseUrl}/update`;
    this.dataEndpoint = `${this.baseUrl}/data`;
    
    // Authentication
    this.auth = {
      username: process.env.FUSEKI_USER || 'admin',
      password: process.env.FUSEKI_PASSWORD || 'admin123'
    };
  }

  /**
   * Exécute une requête SPARQL SELECT
   * @param {string} query - Requête SPARQL SELECT
   * @returns {Promise<Object>} - Résultats au format SPARQL JSON
   */
  async query(query) {
    try {
      const response = await axios.get(this.queryEndpoint, {
        params: { query },
        headers: { 
          Accept: "application/sparql-results+json" 
        },
        auth: this.auth,
        timeout: 10000 // 10 secondes
      });
      return response.data;
    } catch (error) {
      this._handleError(error, "SPARQL Query");
    }
  }

  /**
   * Exécute une requête SPARQL UPDATE (INSERT, DELETE, etc.)
   * @param {string} updateQuery - Requête SPARQL UPDATE
   * @returns {Promise<boolean>} - true si succès
   */
  async update(updateQuery) {
    try {
      await axios.post(this.updateEndpoint, updateQuery, {
        headers: { 
          "Content-Type": "application/sparql-update" 
        },
        auth: this.auth,
        timeout: 10000
      });
      return true;
    } catch (error) {
      this._handleError(error, "SPARQL Update");
    }
  }

  /**
   * Exécute une requête SPARQL ASK
   * @param {string} askQuery - Requête SPARQL ASK
   * @returns {Promise<boolean>} - true/false
   */
  async ask(askQuery) {
    try {
      const response = await axios.get(this.queryEndpoint, {
        params: { query: askQuery },
        headers: { 
          Accept: "application/sparql-results+json" 
        },
        auth: this.auth,
        timeout: 5000
      });
      return response.data.boolean;
    } catch (error) {
      this._handleError(error, "SPARQL Ask");
    }
  }

  /**
   * Upload RDF data (Turtle, RDF/XML, etc.)
   * @param {string} data - Données RDF
   * @param {string} contentType - Type MIME (text/turtle, application/rdf+xml, etc.)
   * @returns {Promise<boolean>}
   */
  async uploadData(data, contentType = "text/turtle") {
    try {
      await axios.post(`${this.dataEndpoint}?default`, data, {
        headers: { 
          "Content-Type": contentType 
        },
        auth: this.auth,
        timeout: 15000
      });
      return true;
    } catch (error) {
      this._handleError(error, "Upload Data");
    }
  }

  /**
   * Vérifie si une ressource existe
   * @param {string} resourceUri - URI de la ressource
   * @returns {Promise<boolean>}
   */
  async resourceExists(resourceUri) {
    const askQuery = `ASK { <${resourceUri}> ?p ?o }`;
    return this.ask(askQuery);
  }

  /**
   * Compte le nombre de triples dans le dataset
   * @returns {Promise<number>}
   */
  async countTriples() {
    const query = `SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }`;
    const result = await this.query(query);
    const binding = result.results.bindings[0];
    return binding ? parseInt(binding.count.value) : 0;
  }

  /**
   * Gestion centralisée des erreurs
   * @private
   */
  _handleError(error, context) {
    const errorMessage = error.response?.data || error.message;
    const statusCode = error.response?.status;
    
    console.error(`[FusekiClient] ${context} Error:`, {
      message: errorMessage,
      status: statusCode,
      url: error.config?.url
    });

    // Créer une erreur enrichie
    const enrichedError = new Error(
      `${context} failed: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`
    );
    enrichedError.statusCode = statusCode;
    enrichedError.originalError = error;
    
    throw enrichedError;
  }

  /**
   * Test de connexion au serveur Fuseki
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const query = `SELECT * WHERE { ?s ?p ?o } LIMIT 1`;
      await this.query(query);
      return true;
    } catch (error) {
      console.error("[FusekiClient] Connection test failed:", error.message);
      return false;
    }
  }

  /**
   * Obtenir les statistiques du dataset
   * @returns {Promise<Object>}
   */
  async getStats() {
    try {
      const query = `
        SELECT 
          (COUNT(DISTINCT ?s) as ?subjects)
          (COUNT(DISTINCT ?p) as ?predicates)
          (COUNT(DISTINCT ?o) as ?objects)
          (COUNT(*) as ?triples)
        WHERE { ?s ?p ?o }
      `;
      const result = await this.query(query);
      const binding = result.results.bindings[0];
      
      return {
        subjects: parseInt(binding.subjects.value),
        predicates: parseInt(binding.predicates.value),
        objects: parseInt(binding.objects.value),
        triples: parseInt(binding.triples.value)
      };
    } catch (error) {
      console.error("[FusekiClient] Stats error:", error.message);
      return null;
    }
  }
}

// Export singleton instance
const fusekiClient = new FusekiClient();

module.exports = fusekiClient;
module.exports.FusekiClient = FusekiClient;
