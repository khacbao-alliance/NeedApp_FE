pipeline {
    agent any

    environment {
        IMAGE_NAME = 'needapp-fe'
        CONTAINER_NAME = 'needapp-fe'
        GCHAT_WEBHOOK = 'https://chat.googleapis.com/v1/spaces/AAQAyJg5xoU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=bPFiBiw7I06p8wFaPtA0Jr300iUTinPept8BH77KAik'
    }

    stages {
        stage('Notify Start') {
            steps {
                bat """
                    curl -s -X POST "%GCHAT_WEBHOOK%" ^
                        -H "Content-Type: application/json" ^
                        -d "{\"text\": \"🚀 *[NeedApp FE]* Build #%BUILD_NUMBER% bat dau\\nBranch: %GIT_BRANCH%\\nTriggered by: %BUILD_USER_ID%\"}"
                """
            }
        }

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
            bat """
                curl -s -X POST "%GCHAT_WEBHOOK%" ^
                    -H "Content-Type: application/json" ^
                    -d "{\"text\": \"✅ *[NeedApp FE]* Build #%BUILD_NUMBER% thanh cong\\nBranch: %GIT_BRANCH%\\nDuration: %BUILD_DURATION%\"}"
            """
        }
        failure {
            bat """
                curl -s -X POST "%GCHAT_WEBHOOK%" ^
                    -H "Content-Type: application/json" ^
                    -d "{\"text\": \"❌ *[NeedApp FE]* Build #%BUILD_NUMBER% that bai\\nBranch: %GIT_BRANCH%\\nXem log: %BUILD_URL%console\"}"
            """
        }
    }
}
