import { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

function App() {
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Bonjour ! Je suis votre assistant IA. Je peux vous aider à gérer vos tâches. Essayez "Crée une tâche pour acheter du pain" !' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Charger les tâches au démarrage
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Ajouter le message utilisateur
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${AI_SERVICE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec le service IA');
      }

      const data = await response.json();
      
      // Ajouter la réponse du bot
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: data.response 
      }]);

      // Si une tâche a été créée, rafraîchir la liste
      if (data.action === 'task_created' && data.task_created) {
        await fetchTasks();
      }

    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: `❌ Erreur: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: '',
          completed: false
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la création de la tâche');

      setNewTaskTitle('');
      await fetchTasks();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la tâche');
    }
  };

  const handleToggleTask = async (taskId, completed) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      await fetchTasks();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      await fetchTasks();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 Chatbot DevOps - Gestionnaire de Tâches</h1>
        <p>Projet CI/CD avec Docker, Jenkins, Vagrant & Nagios</p>
      </header>

      <div className="container">
        {/* Section Chat */}
        <div className="chat-section">
          <h2>💬 Assistant IA</h2>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-content loading">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tapez votre message... (ex: Crée une tâche pour faire les courses)"
              disabled={isLoading}
              className="chat-input"
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()} className="send-button">
              {isLoading ? '...' : '📤'}
            </button>
          </form>
        </div>

        {/* Section Tâches */}
        <div className="tasks-section">
          <h2>📋 Mes Tâches</h2>
          
          {/* Formulaire d'ajout manuel */}
          <form onSubmit={handleAddTask} className="add-task-form">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ajouter une tâche manuellement..."
              className="task-input"
            />
            <button type="submit" className="add-button">➕</button>
          </form>

          {/* Liste des tâches */}
          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="empty-state">
                <p>Aucune tâche pour le moment.</p>
                <p className="hint">💡 Essayez de dire au chatbot : "Crée une tâche pour acheter du pain"</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    className="task-checkbox"
                  />
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="delete-button"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="tasks-stats">
            <span>Total: {tasks.length}</span>
            <span>Complétées: {tasks.filter(t => t.completed).length}</span>
            <span>En cours: {tasks.filter(t => !t.completed).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;