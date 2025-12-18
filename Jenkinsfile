pipeline {
    agent any
    
    environment {
        REGISTRY = '192.168.56.10:5000'
        IMAGE_NAME = 'zenstack-chatbot'
        IMAGE_TAG = 'latest'
    }
    
    stages {
        stage('Build Image') {
            steps {
                echo '🏗️ Construction de l\'image Docker...'
                script {
                    // Récupérer les credentials depuis Jenkins
                    withCredentials([
                        string(credentialsId: 'auth-secret', variable: 'AUTH_SECRET'),
                        string(credentialsId: 'database-url', variable: 'DATABASE_URL')
                    ]) {
                        sh """
                            docker build \
                              --build-arg AUTH_SECRET='${AUTH_SECRET}' \
                              --build-arg DATABASE_URL='${DATABASE_URL}' \
                              -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} .
                        """
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                echo '📤 Push vers le registry...'
                sh "docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Déploiement...'
                // Votre logique de déploiement
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline réussi!'
        }
        failure {
            echo '❌ Pipeline a échoué!'
        }
    }
}
