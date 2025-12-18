-- ============================================
-- Script d'initialisation PostgreSQL
-- ============================================

-- Étape 1 : Créer l'utilisateur chatbot_user
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'chatbot_user') THEN
      
      CREATE ROLE chatbot_user LOGIN PASSWORD 'chatbot_password';
      RAISE NOTICE '✅ Utilisateur chatbot_user créé';
   ELSE
      RAISE NOTICE '⚠️ Utilisateur chatbot_user existe déjà';
   END IF;
END
$$;

-- Étape 2 : Créer la base de données chatbot_db
SELECT 'CREATE DATABASE chatbot_db OWNER chatbot_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chatbot_db')\gexec

-- Étape 3 : Donner tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE chatbot_db TO chatbot_user;

-- Étape 4 : Se connecter à la base de données chatbot_db
\c chatbot_db

-- Étape 5 : Créer la table des tâches
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255)
);

-- Étape 6 : Donner les privilèges sur la table
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatbot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatbot_user;

-- Étape 7 : Insérer des données de test
INSERT INTO tasks (title, description, completed) VALUES
    ('Apprendre Docker', 'Conteneuriser une application complète', false),
    ('Configurer Jenkins', 'Mettre en place le pipeline CI/CD', false),
    ('Installer Nagios', 'Surveiller l''infrastructure', false),
    ('Tester le chatbot', 'Vérifier que l''IA répond correctement', false);

-- Message de confirmation final
DO $$
BEGIN
   RAISE NOTICE '========================================';
   RAISE NOTICE '✅ Base de données initialisée avec succès !';
   RAISE NOTICE '✅ Utilisateur: chatbot_user';
   RAISE NOTICE '✅ Database: chatbot_db';
   RAISE NOTICE '✅ Table: tasks';
   RAISE NOTICE '✅ 4 tâches de test insérées';
   RAISE NOTICE '========================================';
END $$;