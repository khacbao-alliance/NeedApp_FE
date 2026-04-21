pipeline {
    agent any

    environment {
        IMAGE_NAME = 'needapp-fe'
        CONTAINER_NAME = 'needapp-fe'
        GG_CHAT_WEBHOOK = 'https://chat.googleapis.com/v1/spaces/AAQAyJg5xoU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=bPFiBiw7I06p8wFaPtA0Jr300iUTinPept8BH77KAik'
        JENKINS_URL_PUBLIC = 'http://42.119.236.229:9090'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                sh """
                    curl -s -X POST '${GG_CHAT_WEBHOOK}' \
                    -H 'Content-Type: application/json' \
                    -d '{"text": "🚀 *NeedApp FE - Bat dau deploy*\\nBuild: #${BUILD_NUMBER}\\nBranch: ${GIT_BRANCH}\\nXem log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}'
                """
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    MSG=\$(git log -1 --pretty=%s | cut -c1-60)
                    curl -s -X POST '${GG_CHAT_WEBHOOK}' \
                    -H 'Content-Type: application/json' \
                    -d "{\\"text\\": \\"🔨 *[1/3] Build Docker image...*\\\\nCommit: ${GIT_COMMIT.take(7)} - \$MSG\\"}"
                """
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_API_URL', variable: 'API_URL'),
                    string(credentialsId: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID')
                ]) {
                    sh """
                        docker build \
                            --build-arg NEXT_PUBLIC_API_URL=\${API_URL} \
                            --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID} \
                            -t \${IMAGE_NAME}:latest \
                            -t \${IMAGE_NAME}:${BUILD_NUMBER} \
                            .
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    curl -s -X POST '${GG_CHAT_WEBHOOK}' \
                    -H 'Content-Type: application/json' \
                    -d '{"text": "📦 *[2/3] Deploy container...*"}'
                """
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_API_URL', variable: 'API_URL'),
                    string(credentialsId: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID')
                ]) {
                    sh """
                        docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
                        NEXT_PUBLIC_API_URL=\${API_URL} \
                        NEXT_PUBLIC_GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID} \
                        docker compose up -d --no-build
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sh """
                    curl -s -X POST '${GG_CHAT_WEBHOOK}' \
                    -H 'Content-Type: application/json' \
                    -d '{"text": "🩺 *[3/3] Health check...*"}'
                """
                sh '''
                    echo "Waiting for container to start..."
                    sleep 10
                    for i in $(seq 1 12); do
                        STATUS=$(docker inspect --format="{{.State.Status}}" ${CONTAINER_NAME} 2>/dev/null || echo "not_found")
                        if [ "$STATUS" = "running" ]; then
                            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
                            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
                                echo "Container is running (HTTP $HTTP_CODE)"
                                exit 0
                            fi
                        fi
                        echo "Attempt $i/12: waiting..."
                        sleep 5
                    done
                    echo "Health check failed"
                    docker logs ${CONTAINER_NAME} --tail 50
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            sh """
                curl -s -X POST '${GG_CHAT_WEBHOOK}' \
                -H 'Content-Type: application/json' \
                -d '{"text": "✅ *NeedApp FE Deploy THANH CONG*\\nBuild: #${BUILD_NUMBER}\\nCommit: ${GIT_COMMIT.take(7)}\\nURL: http://localhost:3000\\nXem log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}'
            """
        }
        failure {
            sh """
                curl -s -X POST '${GG_CHAT_WEBHOOK}' \
                -H 'Content-Type: application/json' \
                -d '{"text": "❌ *NeedApp FE Deploy THAT BAI*\\nBuild: #${BUILD_NUMBER}\\nCommit: ${GIT_COMMIT.take(7)}\\nXem log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}'
            """
        }
        aborted {
            sh """
                curl -s -X POST '${GG_CHAT_WEBHOOK}' \
                -H 'Content-Type: application/json' \
                -d '{"text": "⚠️ *NeedApp FE Deploy BI HUY*\\nBuild: #${BUILD_NUMBER}\\nXem log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}'
            """
        }
    }
}
