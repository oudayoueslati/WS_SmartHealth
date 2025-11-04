import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './SaifAIChat.css';
import Header from "components/Headers/Header.js";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const SaifAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [systemConfig, setSystemConfig] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    testBackendConnection();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const testBackendConnection = async () => {
    try {
      console.log('🔗 Test connexion backend...');
      
      let response;
      try {
        response = await api.get('/api/saif-ai/health');
      } catch (healthError) {
        console.log('Route /health non disponible, essai /statut...');
        response = await api.get('/api/saif-ai/statut');
      }
      
      console.log('✅ Backend connecté:', response.data);
      setBackendStatus('connected');
      setSystemConfig(response.data);
      
    } catch (error) {
      console.error('❌ Backend inaccessible:', error.message);
      setBackendStatus('disconnected');
      setSystemConfig(null);
      
      setMessages([{
        id: Date.now(),
        type: 'error',
        content: {
          error: "Backend non accessible",
          details: `Impossible de joindre ${API_BASE_URL}`,
          solution: "Vérifiez que le serveur backend est démarré sur le port 5000"
        },
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || backendStatus === 'disconnected') return;

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
      console.log('📤 Envoi message...');
      
      const response = await api.post('/api/saif-ai/generate', {
        prompt: inputMessage
      });

      console.log('✅ Réponse IA reçue:', response.data);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ Erreur:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: {
          error: "Erreur de communication avec l'IA",
          details: error.response?.data?.error || error.message,
          solution: "Vérifiez que la base de données contient des données"
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
  };

  const quickAction = async (action) => {
    const quickPrompts = {
      activité: "Trouver toutes mes activités physiques avec le nombre de pas",
      nutrition: "Afficher mes habitudes nutrition avec les calories",
      sommeil: "Montre-moi mes habitudes de sommeil avec les heures",
      habitudes: "Afficher toutes mes habitudes santé",
      test: "Test de connexion"
    };

    if (action === 'test') {
      await testBackendConnection();
      return;
    }

    if (action === 'habitudes') {
      try {
        const response = await api.get('/api/saif-ai/habits');
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          content: {
            response: `📊 **${response.data.count} habitude(s) trouvée(s) dans votre base**\n\n`,
            results: response.data.habits,
            mode: response.data.mode
          },
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Erreur récupération habitudes:', error);
      }
      return;
    }

    setInputMessage(quickPrompts[action]);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const getServiceStatus = () => {
    if (!systemConfig) return { fuseki: '🔴 Inconnu', dataset: 'Inconnu', status: 'Inconnu' };
    
    if (systemConfig.services) {
      return {
        fuseki: systemConfig.services.fuseki || '🔴 Inconnu',
        dataset: systemConfig.services.dataset || 'SmartHealth',
        status: systemConfig.status || 'Statut inconnu'
      };
    } else if (systemConfig.baseDeDonnees) {
      return {
        fuseki: systemConfig.baseDeDonnees.statut || '🔴 Inconnu',
        dataset: systemConfig.baseDeDonnees.nom || 'SmartHealth',
        status: systemConfig.message || 'Statut inconnu'
      };
    } else {
      return {
        fuseki: '🔴 Inconnu',
        dataset: 'SmartHealth',
        status: systemConfig.message || 'Statut inconnu'
      };
    }
  };

  const serviceStatus = getServiceStatus();

  return (
    <>
      <Header />
      <div className="saif-ai-chat">
        <div className="chat-header">
          <div className="system-info">
            <h2>🧠 Assistant Santé Saif AI</h2>
            <div className="connection-status">
              {backendStatus === 'connected' && (
                <div className="status-group">
                  <span className="status online">🟢 Backend Connecté</span>
                  <span className={`status datasource ${serviceStatus.fuseki.includes('🟢') ? 'online' : 'offline'}`}>
                    {serviceStatus.fuseki}
                  </span>
                </div>
              )}
              {backendStatus === 'disconnected' && <span className="status offline">🔴 Backend Déconnecté</span>}
              {backendStatus === 'checking' && <span className="status checking">🟡 Connexion...</span>}
            </div>
          </div>
          
          <div className="quick-actions">
            <button onClick={() => quickAction('test')} className="quick-btn test">
              🔧 Test
            </button>
            <button onClick={() => quickAction('habitudes')} className="quick-btn habits">
              📊 Toutes
            </button>
            <button onClick={() => quickAction('activité')} className="quick-btn activity">
              🏃 Sport
            </button>
            <button onClick={() => quickAction('nutrition')} className="quick-btn nutrition">
              🍎 Nutrition
            </button>
            <button onClick={() => quickAction('sommeil')} className="quick-btn sleep">
              💤 Sommeil
            </button>
          </div>
        </div>

        <div className="messages-container">
          {messages.length === 0 && backendStatus === 'connected' && (
            <div className="welcome-message">
              <div className="welcome-content">
                <h3>Bienvenue dans Saif AI 🧠</h3>
                <p><strong>Assistant Santé Intelligent</strong></p>
                <p>Je peux vous aider à analyser vos habitudes santé grâce à l'IA et SPARQL.</p>
                
                <div className="config-info">
                  <div className="config-item">
                    <strong>Base de données:</strong> {serviceStatus.dataset}
                  </div>
                  <div className="config-item">
                    <strong>Fuseki:</strong> {serviceStatus.fuseki}
                  </div>
                  <div className="config-item">
                    <strong>Statut:</strong> {serviceStatus.status}
                  </div>
                </div>

                <div className="examples">
                  <p><strong>💡 Exemples de requêtes :</strong></p>
                  <div className="example">"Trouver toutes mes activités physiques"</div>
                  <div className="example">"Afficher mes habitudes nutritionnelles"</div>
                  <div className="example">"Montrer mes données de sommeil"</div>
                  <div className="example">"Quelles sont mes habitudes santé récentes ?"</div>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="message ai loading">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="thinking">L'IA analyse votre demande...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                backendStatus === 'disconnected' 
                  ? "Backend déconnecté - Impossible d'envoyer des messages"
                  : "Posez votre question santé à l'IA..."
              }
              rows="1"
              disabled={isLoading || backendStatus === 'disconnected'}
            />
            <button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading || backendStatus === 'disconnected'}
              className="send-button"
            >
              {isLoading ? '⏳' : '🚀'}
            </button>
          </div>
          
          <div className="chat-controls">
            <button onClick={clearChat} className="clear-btn">
              🗑️ Effacer
            </button>
            <button onClick={testBackendConnection} className="status-btn">
              🔍 Statut
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const MessageBubble = ({ message }) => {
  const renderContent = () => {
    if (message.type === 'error') {
      return (
        <div className="error-content">
          <strong>❌ {message.content.error}</strong>
          {message.content.details && <p>{message.content.details}</p>}
          {message.content.solution && <p>💡 {message.content.solution}</p>}
        </div>
      );
    }

    if (message.type === 'user') {
      return <div className="user-text">{message.content}</div>;
    }

    if (message.type === 'ai') {
      const data = message.content;
      
      if (!data) {
        return <div className="error-content">❌ Données de réponse manquantes</div>;
      }
      
      return (
        <div className="ai-response">
          {data.response && (
            <div className="response-message">
              {data.response.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}

          {data.results && data.results.length > 0 && (
            <div className="results-section">
              <div className="elegant-table">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Titre</th>
                      <th>Description</th>
                      <th>Données</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((result, index) => {
                      const safeTitle = result.titre && result.titre !== 'undefined' ? result.titre : 'Habitude';
                      const safeDescription = result.description && result.description !== 'undefined' ? result.description : 'Données santé';
                      const safeType = result.type ? result.type.replace('ont:', '') : 'Habitude';
                      const safeDate = result.date && result.date !== 'undefined' ? result.date : 'N/A';
                      
                      // Données selon le type
                      let dataValue = '';
                      if (result.calories) dataValue = `${result.calories} cal`;
                      else if (result.heures) dataValue = `${result.heures} h`;
                      else if (result.pas) dataValue = `${result.pas} pas`;
                      else if (result.niveau) dataValue = `Niv. ${result.niveau}`;
                      else dataValue = '—';

                      return (
                        <tr key={index}>
                          <td>
                            <span className={`type-badge ${safeType.toLowerCase()}`}>
                              {safeType}
                            </span>
                          </td>
                          <td className="title-cell">{safeTitle}</td>
                          <td className="desc-cell">{safeDescription}</td>
                          <td>
                            <span className="data-value">{dataValue}</span>
                          </td>
                          <td className="date-cell">{safeDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.analysis && (
            <div className="analysis-info">
              <div className="analysis-tags">
                <span className="tag intention">Intention: {data.analysis.intent}</span>
                <span className="tag entity">Entité: {data.analysis.entity}</span>
                <span className="tag category">Catégorie: {data.analysis.category}</span>
              </div>
            </div>
          )}

          {data.sparql_query && (
            <div className="sparql-section">
              <details>
                <summary>🔍 Voir la requête SPARQL générée</summary>
                <pre className="sparql-query">{data.sparql_query}</pre>
              </details>
            </div>
          )}

          {data.mode === "Simulation" && (
            <div className="simulation-notice">
              🧪 Mode simulation - Données de démonstration
            </div>
          )}

          {(!data.results || data.results.length === 0) && !data.response?.includes('trouvé') && (
            <div className="no-results">
              <p>🔍 Aucune donnée trouvée correspondant à votre recherche.</p>
              <p>💡 Essayez d'ajouter des données à votre base ou utilisez des termes plus généraux.</p>
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

export default SaifAIChat;
