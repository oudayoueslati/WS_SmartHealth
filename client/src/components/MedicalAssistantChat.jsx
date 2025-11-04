import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Form,
  FormGroup,
  Input,
  Button,
  Badge,
  ListGroup,
  ListGroupItem,
  Collapse,
  Alert
} from 'reactstrap';

export default function MedicalAssistantChat() {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      text: '👋 Bonjour! Je suis votre assistant médical intelligent. Posez-moi des questions sur les services, les prix, les examens, etc.',
      timestamp: new Date()
    }
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [examples, setExamples] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Charger les exemples
    fetch('http://localhost:5000/api/assistant/examples')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExamples(data.examples);
        }
      })
      .catch(err => console.error('Error loading examples:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Ajouter la question de l'utilisateur
    const userMessage = {
      type: 'user',
      text: question,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setShowExamples(false);

    try {
      const response = await fetch('http://localhost:5000/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      const data = await response.json();

      if (data.success) {
        // Ajouter la réponse de l'assistant
        const assistantMessage = {
          type: 'assistant',
          text: data.answer,
          data: data.data,
          queryInfo: data.queryInfo,
          suggestion: data.suggestion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          type: 'error',
          text: `❌ Erreur: ${data.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage = {
        type: 'error',
        text: `❌ Erreur de connexion: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuestion) => {
    setQuestion(exampleQuestion);
    setShowExamples(false);
  };

  const clearChat = () => {
    setMessages([
      {
        type: 'assistant',
        text: '👋 Conversation réinitialisée. Comment puis-je vous aider ?',
        timestamp: new Date()
      }
    ]);
    setShowExamples(true);
  };

  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-primary">
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0 text-white">
            <i className="ni ni-chat-round" /> Assistant Médical Intelligent
          </h3>
          <Button
            color="light"
            size="sm"
            onClick={clearChat}
          >
            <i className="ni ni-fat-remove" /> Effacer
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {/* Zone de messages */}
        <div
          style={{
            height: '500px',
            overflowY: 'auto',
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f7fafc',
            borderRadius: '0.375rem'
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 d-flex ${msg.type === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  backgroundColor: msg.type === 'user' ? '#5e72e4' : msg.type === 'error' ? '#f5365c' : '#fff',
                  color: msg.type === 'user' || msg.type === 'error' ? '#fff' : '#32325d',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}
              >
                <div style={{ whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>
                {msg.suggestion && (
                  <Alert color="warning" className="mt-2 mb-0" style={{ fontSize: '0.875rem' }}>
                    💡 {msg.suggestion}
                  </Alert>
                )}
                {msg.queryInfo && (
                  <div className="mt-2">
                    <Badge color="info" className="mr-1">{msg.queryInfo.category}</Badge>
                    <Badge color="secondary">{msg.queryInfo.type}</Badge>
                  </div>
                )}
                <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                  {msg.timestamp.toLocaleTimeString()}
                </small>
              </div>
            </div>
          ))}
          {loading && (
            <div className="d-flex justify-content-start mb-3">
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}
              >
                <span className="spinner-border spinner-border-sm mr-2" />
                L'assistant réfléchit...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Exemples de questions */}
        {showExamples && examples.length > 0 && (
          <div className="mb-3">
            <Button
              color="link"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="p-0 mb-2"
            >
              <i className="ni ni-bulb-61" /> Exemples de questions
            </Button>
            <Collapse isOpen={showExamples}>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {examples.map((category, idx) => (
                  <div key={idx} className="mb-2">
                    <strong className="text-sm">{category.category}:</strong>
                    <ListGroup flush className="mt-1">
                      {category.questions.map((q, qIdx) => (
                        <ListGroupItem
                          key={qIdx}
                          action
                          onClick={() => handleExampleClick(q)}
                          className="py-2 px-3 cursor-pointer"
                          style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                        >
                          💬 {q}
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        )}

        {/* Formulaire de question */}
        <Form onSubmit={handleSubmit}>
          <FormGroup className="mb-0">
            <div className="input-group">
              <Input
                type="text"
                placeholder="Posez votre question ici..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={loading}
                style={{ fontSize: '1rem' }}
              />
              <div className="input-group-append">
                <Button
                  color="primary"
                  type="submit"
                  disabled={loading || !question.trim()}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <>
                      <i className="ni ni-send" /> Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </FormGroup>
        </Form>

        {/* Info */}
        <div className="mt-3">
          <small className="text-muted">
            <i className="ni ni-bulb-61" /> L'assistant traduit vos questions en requêtes SPARQL pour interroger la base de données médicale.
          </small>
        </div>
      </CardBody>
    </Card>
  );
}
