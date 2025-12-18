pipeline {
    agent any
    
    environment {
        REGISTRY = '192.168.56.10:5000'
        APP_VM = '192.168.56.11'
    }
    
    stages {
        stage('Build Image') {
            steps {
                echo '🏗️ Construction de l\'image Docker...'
                sh '''
                    docker build -t ${REGISTRY}/zenstack-chatbot:latest .
                '''
            }
        }
        
        stage('Push to Registry') {
            steps {
                echo '📤 Push vers le registry Docker...'
                sh '''
                    docker push ${REGISTRY}/zenstack-chatbot:latest
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Déploiement sur le serveur...'
                sh '''
                    ssh -o StrictHostKeyChecking=no vagrant@${APP_VM} "docker pull ${REGISTRY}/zenstack-chatbot:latest"
                    ssh -o StrictHostKeyChecking=no vagrant@${APP_VM} "docker stop zenstack-chatbot || true"
                    ssh -o StrictHostKeyChecking=no vagrant@${APP_VM} "docker rm zenstack-chatbot || true"
                    ssh -o StrictHostKeyChecking=no vagrant@${APP_VM} "docker run -d --name zenstack-chatbot -p 3000:3000 ${REGISTRY}/zenstack-chatbot:latest"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline terminé avec succès!'
        }
        failure {
            echo '❌ Pipeline a échoué!'
        }
    }
}
