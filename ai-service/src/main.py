from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Service with Groq + Task Management")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# URL du backend
BACKEND_URL = os.getenv("BACKEND_URL", "http://chatbot-backend:5000")

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    action: str = None
    task_created: dict = None

async def call_groq_api(messages: list) -> str:
    """Appelle l'API Groq pour obtenir une réponse"""
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY non configurée. Créez un compte sur https://console.groq.com"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500
                },
                timeout=30.0
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Clé API Groq invalide. Vérifiez votre clé sur https://console.groq.com"
                )
            
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout lors de la connexion à Groq")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Erreur Groq API: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

async def create_task_in_backend(title: str, description: str = "") -> dict:
    """Crée une tâche dans le backend"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BACKEND_URL}/api/tasks",
                json={
                    "title": title,
                    "description": description,
                    "completed": False
                },
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"❌ Erreur création tâche: {e}")
        return None

async def list_tasks_from_backend() -> list:
    """Récupère toutes les tâches depuis le backend"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BACKEND_URL}/api/tasks",
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get("tasks", [])
    except Exception as e:
        print(f"❌ Erreur récupération tâches: {e}")
        return []

def extract_task_from_message(message: str) -> dict:
    """Extrait les informations de tâche du message utilisateur - VERSION AMÉLIORÉE"""
    message_lower = message.lower().strip()
    
    # Mots-clés pour détecter une demande de création de tâche
    create_keywords = ["créer", "crée", "créé", "ajouter", "ajoute", "ajouté", "nouvelle", "nouveau"]
    
    is_create_request = any(keyword in message_lower for keyword in create_keywords)
    
    if not is_create_request:
        return None
    
    # 🔧 AMÉLIORATION : Utiliser des regex pour nettoyer proprement
    # Enlever tous les mots-clés de commande
    title = message_lower
    
    # Liste exhaustive de mots à retirer
    keywords_to_remove = [
        r'\bcrée\b', r'\bcréer\b', r'\bcréé\b',
        r'\bajoute\b', r'\bajouter\b', r'\bajouté\b',
        r'\bnouvelle?\b', r'\bnouveau\b',
        r'\btâche\b', r'\btaches\b',
        r'\bune?\b', r'\bla\b', r'\ble\b', r'\bles\b',
        r'\bpour\b', r'\bde\b', r'\bà\b'
    ]
    
    for pattern in keywords_to_remove:
        title = re.sub(pattern, '', title, flags=re.IGNORECASE)
    
    # Nettoyer les espaces multiples et trim
    title = re.sub(r'\s+', ' ', title).strip()
    
    # Capitaliser la première lettre
    if title:
        title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()
    
    if len(title) >= 3:  # Au moins 3 caractères
        return {"title": title, "description": "Créé via le chatbot"}
    
    return None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "ai-service",
        "provider": "groq",
        "model": GROQ_MODEL
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Endpoint pour discuter avec le chatbot IA via Groq
    Peut créer et lister des tâches
    """
    user_message = request.message.strip()
    user_message_lower = user_message.lower()
    
    # 📋 ÉTAPE 1 : Vérifier si c'est une demande de LISTE des tâches
    if any(keyword in user_message_lower for keyword in ["liste", "affiche", "montre", "voir"]) and \
       any(keyword in user_message_lower for keyword in ["tâche", "taches", "todo"]):
        
        tasks = await list_tasks_from_backend()
        
        if not tasks:
            return ChatResponse(
                response="📋 Vous n'avez aucune tâche pour le moment. Voulez-vous en créer une ?",
                action="list_tasks"
            )
        
        # Formater la liste des tâches
        task_list = "📋 **Vos tâches :**\n\n"
        for task in tasks:
            status = "✅" if task.get('completed') else "⏳"
            task_list += f"{status} **{task['id']}.** {task['title']}\n"
        
        task_list += f"\n💡 Total : {len(tasks)} tâche(s)"
        
        return ChatResponse(
            response=task_list,
            action="list_tasks"
        )
    
    # ➕ ÉTAPE 2 : Vérifier si c'est une demande de CRÉATION de tâche
    task_info = extract_task_from_message(user_message)
    
    if task_info:
        # Créer la tâche dans le backend
        created_task = await create_task_in_backend(
            title=task_info["title"],
            description=task_info["description"]
        )
        
        if created_task:
            # Tâche créée avec succès
            return ChatResponse(
                response=f"✅ Tâche créée avec succès : **\"{task_info['title']}\"** !\n\n💡 Tapez 'liste mes tâches' pour la voir.",
                action="task_created",
                task_created=created_task
            )
        else:
            # Erreur lors de la création
            return ChatResponse(
                response=f"❌ Désolé, je n'ai pas pu créer la tâche \"{task_info['title']}\". Vérifiez que le backend est accessible.",
                action="task_creation_failed"
            )
    
    # 💬 ÉTAPE 3 : Si ce n'est ni liste ni création, réponse normale avec Groq
    system_message = """Tu es un assistant IA intelligent et utile pour gérer des tâches.

Tu peux :
- Aider à organiser et prioriser les tâches
- Donner des conseils de productivité  
- Répondre aux questions
- Avoir une conversation amicale

Commandes disponibles :
- "liste mes tâches" pour voir toutes les tâches
- "crée une tâche [nom]" pour créer une tâche

Réponds de manière concise et utile en français (2-3 phrases maximum)."""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message}
    ]
    
    ai_response = await call_groq_api(messages)
    
    return ChatResponse(response=ai_response)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Service",
        "provider": "Groq",
        "model": GROQ_MODEL,
        "backend": BACKEND_URL,
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)