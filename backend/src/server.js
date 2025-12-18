const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-api' });
});

// Routes CRUD pour les tâches
let tasks = [];
let taskId = 1;

// GET - Récupérer toutes les tâches
app.get('/api/tasks', (req, res) => {
  res.json({ tasks });
});

// POST - Créer une tâche
app.post('/api/tasks', (req, res) => {
  const { title, description } = req.body;
  const newTask = {
    id: taskId++,
    title,
    description,
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  res.status(201).json({ task: newTask });
});

// PUT - Mettre à jour une tâche
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const task = tasks.find(t => t.id === parseInt(id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  task.completed = completed;
  res.json({ task });
});

// DELETE - Supprimer une tâche
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  tasks = tasks.filter(t => t.id !== parseInt(id));
  res.json({ message: 'Task deleted' });
});

// Route pour le chatbot (appel au service IA)
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Appeler le service IA
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
    const aiResponse = await axios.post(`${aiServiceUrl}/chat`, {
      message: message
    });
    
    res.json(aiResponse.data);
  } catch (error) {
    console.error('Error calling AI service:', error.message);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
});