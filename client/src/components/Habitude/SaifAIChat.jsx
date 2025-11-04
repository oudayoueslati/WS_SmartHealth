import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './SaifAIChat.css';
import Header from "components/Headers/Header.js";

// Configuration API directe (solution temporaire)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour le débogage
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Call: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:');
    console.error('   Status:', error.response?.status);
    console.error('   URL:', error.config?.url);
    console.error('   Message:', error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);



const SaifAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState({ userId: 'user123' });
  const [systemStatus, setSystemStatus] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef(null);

  // Test de connexion au démarrage
  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const testConnection = async () => {
    try {
      console.log('🔗 Test de connexion au backend...');
      const response = await api.get('/api/test');
      console.log('✅ Backend connecté:', response.data);
      setConnectionError(false);
      checkSystemStatus();
    } catch (error) {
      console.error('❌ Impossible de se connecter au backend:', error);
      setConnectionError(true);
      
      setMessages([{
        id: Date.now(),
        type: 'error',
        content: {
          error: "Backend non connecté",
          details: "Vérifiez que le serveur backend est démarré sur http://localhost:5000"
        },
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const response = await api.get('/api/saif-ai/statut');
      setSystemStatus(response.data);
      console.log('✅ Statut Saif AI:', response.data);
    } catch (error) {
      console.error('❌ Erreur statut système:', error);
      setSystemStatus({ 
        statut: "🔴 Hors ligne", 
        message: "Impossible de contacter Saif AI" 
      });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || connectionError) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🚀 Envoi requête Saif AI:', inputMessage);
      
      const response = await api.post('/api/saif-ai/executer', {
        prompt: inputMessage,
        context: context,
        executeQuery: true
      });

      console.log('✅ Réponse Saif AI reçue:', response.data);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (response.data.analyse?.entite) {
        setContext(prev => ({
          ...prev,
          lastEntity: response.data.analyse.entite
        }));
      }

    } catch (error) {
      console.error('❌ Erreur complète:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: {
          error: "Erreur de communication avec Saif AI",
          details: error.response?.data?.error || error.message,
          status: error.response?.status,
          url: error.config?.url
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setConnectionError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConnectionError(false);
  };

  const quickAction = async (action) => {
    const quickPrompts = {
      sommeil: "Afficher mes habitudes de sommeil de cette semaine",
      nutrition: "Quelles sont mes consommations caloriques récentes ?",
      activité: "Montre-moi mes activités physiques des derniers jours",
      analyse: "Analyse mes performances globales cette semaine",
      test: "Test de connexion backend"
    };

    if (action === 'test') {
      await testConnection();
      return;
    }

    setInputMessage(quickPrompts[action]);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <>
    <Header />
  
    <div className="saif-ai-chat">
      {/* En-tête avec indicateur de connexion */}
      <div className="chat-header">
        <div className="system-info">
          <h2>🧠 Saif AI - Assistant Santé Intelligent</h2>
          <div className="connection-status">
            {connectionError ? (
              <span className="status offline">🔴 Déconnecté</span>
            ) : systemStatus ? (
              <span className={`status ${systemStatus.statut.includes('🟢') ? 'online' : 'offline'}`}>
                {systemStatus.statut}
              </span>
            ) : (
              <span className="status checking">🟡 Vérification...</span>
            )}
          </div>
        </div>
        
        <div className="quick-actions">
          <button onClick={() => quickAction('test')} className="quick-btn test">
            🔧 Test Connexion
          </button>
          <button onClick={() => quickAction('sommeil')} className="quick-btn sleep">
            💤 Sommeil
          </button>
          <button onClick={() => quickAction('nutrition')} className="quick-btn nutrition">
            🍎 Nutrition
          </button>
          <button onClick={() => quickAction('activité')} className="quick-btn activity">
            🏃 Activité
          </button>
          <button onClick={() => quickAction('analyse')} className="quick-btn analysis">
            📊 Analyse
          </button>
        </div>
      </div>

      {/* Bannière d'erreur de connexion */}
      {connectionError && (
        <div className="connection-banner error">
          <div className="banner-content">
            <strong>❌ Backend non connecté</strong>
            <p>Le serveur backend n'est pas accessible sur http://localhost:5000</p>
            <button onClick={testConnection} className="retry-btn">
              🔄 Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Zone de conversation */}
      <div className="messages-container">
        {messages.length === 0 && !connectionError ? (
          <div className="welcome-message">
            <div className="welcome-content">
              <h3>Bienvenue dans Saif AI 🧠</h3>
              <p>Je suis votre assistant santé intelligent. Je peux vous aider à :</p>
              <ul>
                <li>📝 Créer et gérer vos habitudes de santé</li>
                <li>🔍 Analyser vos données de sommeil, nutrition et activité</li>
                <li>📊 Générer des rapports et tendances</li>
                <li>🎯 Vous donner des recommandations personnalisées</li>
              </ul>
              <div className="setup-guide">
                <h4>🛠️ Configuration requise :</h4>
                <ol>
                  <li>Démarrez le serveur backend: <code>npm run dev</code> dans le dossier backend</li>
                  <li>Vérifiez que Fuseki est démarré sur http://localhost:3030</li>
                  <li>Cliquez sur "🔧 Test Connexion" pour vérifier</li>
                </ol>
              </div>
              <div className="examples">
                <p><strong>💡 Exemples de requêtes :</strong></p>
                <div className="example">"Afficher mes habitudes de sommeil de cette semaine"</div>
                <div className="example">"Ajouter 7 heures de sommeil pour hier"</div>
                <div className="example">"Analyser ma consommation calorique"</div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="message ai loading">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="thinking">Saif AI réfléchit...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={connectionError 
              ? "Backend déconnecté - Vérifiez la configuration..." 
              : "Parlez à Saif AI... (ex: 'Afficher mes habitudes sommeil de cette semaine')"
            }
            rows="1"
            disabled={isLoading || connectionError}
          />
          <button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || isLoading || connectionError}
            className="send-button"
          >
            {isLoading ? '⏳' : connectionError ? '❌' : '🚀'}
          </button>
        </div>
        
        <div className="chat-controls">
          <button onClick={clearChat} className="clear-btn">
            🗑️ Effacer
          </button>
          <button onClick={testConnection} className="status-btn">
            🔍 Vérifier Connexion
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

// Composant de bulle de message
const MessageBubble = ({ message }) => {
  const renderContent = () => {
    if (message.type === 'error') {
      return (
        <div className="error-content">
          <strong>❌ Erreur:</strong> {message.content.error}
          {message.content.details && (
            <div className="error-details">{message.content.details}</div>
          )}
          {message.content.status && (
            <div className="error-status">Status: {message.content.status}</div>
          )}
        </div>
      );
    }

    if (message.type === 'user') {
      return <div className="user-text">{message.content}</div>;
    }

    if (message.type === 'ai') {
      const data = message.content;
      return (
        <div className="ai-response">
          {/* Analyse de l'intention */}
          <div className="intent-section">
            <div className={`intent-badge intent-${data.analyse.intention}`}>
              {data.analyse.intention.toUpperCase()}
            </div>
            <span className="entity-type">
              {data.analyse.entite?.type || 'Habitude'}
            </span>
          </div>

          {/* Résultats de la requête */}
          {data.resultat && data.execute && (
            <div className="results-section">
              <h4>📊 Résultats:</h4>
              <QueryResults data={data.resultat} />
            </div>
          )}

          {/* Requête SPARQL générée */}
          <div className="sparql-section">
            <details>
              <summary>🔍 Voir la requête SPARQL générée</summary>
              <pre className="sparql-query">{data.requeteGeneree}</pre>
            </details>
          </div>

          {/* Suggestions */}
          {data.suggestions && data.suggestions.length > 0 && (
            <div className="suggestions-section">
              <h5>💡 Suggestions:</h5>
              <ul>
                {data.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`message ${message.type}`}>
      <div className="message-avatar">
        {message.type === 'user' ? '👤' : 
         message.type === 'error' ? '❌' : '🧠'}
      </div>
      <div className="message-content">
        {renderContent()}
        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// Composant d'affichage des résultats de requête
// Composant QueryResults SUPER SÉCURISÉ
const QueryResults = ({ data }) => {
    // Vérifications en cascade
    if (!data) {
      return <div className="no-results">❌ Aucune donnée disponible</div>;
    }
  
    // Cas 1: Opération réussie (CREATE/UPDATE/DELETE)
    if (data.message) {
      return (
        <div className="operation-success">
          <div className="success-badge">✅</div>
          <div>{data.message}</div>
          {data.simulated && <div className="simulation-badge">Mode Simulation</div>}
        </div>
      );
    }
  
    // Cas 2: Données SPARQL standard
    if (data.results && data.results.bindings && Array.isArray(data.results.bindings)) {
      const headers = data.results.head?.vars || [];
      const rows = data.results.bindings;
  
      if (rows.length === 0) {
        return <div className="no-results">📭 Aucune donnée trouvée</div>;
      }
  
      return (
        <div className="results-table">
          <table>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {headers.map(header => (
                    <td key={header}>
                      {row[header]?.value || 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="results-count">
            {rows.length} résultat(s)
          </div>
        </div>
      );
    }
  
    // Cas 3: Format non reconnu
    return (
      <div className="no-results">
        🔧 Format de réponse non supporté
        <details>
          <summary>Détails techniques</summary>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>
    );
  };

export default SaifAIChat;
