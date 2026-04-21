pipeline {
    agent any

    environment {
        IMAGE_NAME = 'needapp-fe'
        CONTAINER_NAME = 'needapp-fe'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_API_URL', variable: 'API_URL'),
                    string(credentialsId: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID')
                ]) {
                    bat """
                        docker build ^
                            --build-arg NEXT_PUBLIC_API_URL=%API_URL% ^
                            --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% ^
                            -t %IMAGE_NAME%:latest ^
                            -t %IMAGE_NAME%:%BUILD_NUMBER% ^
                            .
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_API_URL', variable: 'API_URL'),
                    string(credentialsId: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID')
                ]) {
                    bat """
                        set NEXT_PUBLIC_API_URL=%API_URL%
                        set NEXT_PUBLIC_GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID%
                        docker compose up -d --no-build
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deploy thanh cong - Build #${BUILD_NUMBER}"
        }
        failure {
            echo "Deploy that bai - Build #${BUILD_NUMBER}"
        }
    }
}
