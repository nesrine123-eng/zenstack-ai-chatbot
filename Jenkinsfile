pipeline {
    agent any
    
    environment {
        REGISTRY = '192.168.56.10:5000'
        APP_VM = '192.168.56.11'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/votre-repo/zenstack-ai-chatbot.git'
            }
        }
        
        stage('Build Images') {
            steps {
                echo 'Building Docker images...'
                sh '''
                    docker build -t ${REGISTRY}/chatbot-frontend:latest ./frontend
                    docker build -t ${REGISTRY}/chatbot-backend:latest ./backend
                    docker build -t ${REGISTRY}/chatbot-ai:latest ./ai-service
                '''
            }
        }
        
        stage('Push to Registry') {
            steps {
                echo 'Pushing images to registry...'
                sh '''
                    docker push ${REGISTRY}/chatbot-frontend:latest
                    docker push ${REGISTRY}/chatbot-backend:latest
                    docker push ${REGISTRY}/chatbot-ai:latest
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying to app VM...'
                sh '''
                    ssh vagrant@${APP_VM} "cd /home/vagrant && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
