pipeline {
    agent any

    environment {
        IMAGE_NAME = 'needapp-fe'
        CONTAINER_NAME = 'needapp-fe'
        GG_CHAT_WEBHOOK = 'https://chat.googleapis.com/v1/spaces/AAQAyJg5xoU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=bPFiBiw7I06p8wFaPtA0Jr300iUTinPept8BH77KAik'
        JENKINS_URL_PUBLIC = 'http://42.119.236.229:9090'
        THREAD_FILE = "/tmp/gchat_thread_${BUILD_NUMBER}"
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                sh """
                    RESPONSE=\$(curl -s -X POST '${GG_CHAT_WEBHOOK}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d '{"text": "🚀 *NeedApp FE - Deployment Started*\\nBuild: #${BUILD_NUMBER}\\nBranch: ${GIT_BRANCH}\\nView log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}')
                    echo \$RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['thread']['name'])" > ${THREAD_FILE} 2>/dev/null || true
                """
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    THREAD_NAME=\$(cat ${THREAD_FILE} 2>/dev/null || echo "")
                    MSG=\$(git log -1 --pretty=%s | cut -c1-60)
                    BODY="{\\"text\\": \\"🔨 *[NeedApp FE - 1/3] Building Docker image...*\\\\nCommit: ${GIT_COMMIT.take(7)} - \$MSG\\"}"
                    if [ -n "\$THREAD_NAME" ]; then
                        BODY="{\\"text\\": \\"🔨 *[NeedApp FE - 1/3] Building Docker image...*\\\\nCommit: ${GIT_COMMIT.take(7)} - \$MSG\\", \\"thread\\": {\\"name\\": \\"\$THREAD_NAME\\"}}"
                    fi
                    curl -s -X POST '${GG_CHAT_WEBHOOK}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d "\$BODY"
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
                    THREAD_NAME=\$(cat ${THREAD_FILE} 2>/dev/null || echo "")
                    BODY='{"text": "📦 *[NeedApp FE - 2/3] Deploying container...*"}'
                    if [ -n "\$THREAD_NAME" ]; then
                        BODY="{\\"text\\": \\"📦 *[NeedApp FE - 2/3] Deploying container...*\\", \\"thread\\": {\\"name\\": \\"\$THREAD_NAME\\"}}"
                    fi
                    curl -s -X POST '${GG_CHAT_WEBHOOK}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d "\$BODY"
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
                    THREAD_NAME=\$(cat ${THREAD_FILE} 2>/dev/null || echo "")
                    BODY='{"text": "🩺 *[NeedApp FE - 3/3] Running health check...*"}'
                    if [ -n "\$THREAD_NAME" ]; then
                        BODY="{\\"text\\": \\"🩺 *[NeedApp FE - 3/3] Running health check...*\\", \\"thread\\": {\\"name\\": \\"\$THREAD_NAME\\"}}"
                    fi
                    curl -s -X POST '${GG_CHAT_WEBHOOK}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d "\$BODY"
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
                THREAD_NAME=\$(cat ${THREAD_FILE} 2>/dev/null || echo "")
                BODY='{"text": "✅ *NeedApp FE - Deployment Successful*\\nBuild: #${BUILD_NUMBER}\\nCommit: ${GIT_COMMIT.take(7)}\\nURL: http://localhost:3000\\nView log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}'
                if [ -n "\$THREAD_NAME" ]; then
                    BODY="{\\"text\\": \\"✅ *NeedApp FE - Deployment Successful*\\\\nBuild: #${BUILD_NUMBER}\\\\nCommit: ${GIT_COMMIT.take(7)}\\\\nURL: http://localhost:3000\\\\nView log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console\\", \\"thread\\": {\\"name\\": \\"\$THREAD_NAME\\"}}"
                fi
                curl -s -X POST '${GG_CHAT_WEBHOOK}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                    -H 'Content-Type: application/json' \
                    -d "\$BODY"
                rm -f ${THREAD_FILE}
            """
        }
        failure {
            sh """
                THREAD_NAME=\$(cat ${THREAD_FILE} 2>/dev/null || echo "")
                BODY='{"text": "❌ *NeedApp FE - Deployment Failed*\\nBuild: #${BUILD_NUMBER}\\nCommit: ${GIT_COMMIT.take(7)}\\nView log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}'
                if [ -n "\$THREAD_NAME" ]; then
                    BODY="{\\"text\\": \\"❌ *NeedApp FE - Deployment Failed*\\\\nBuild: #${BUILD_NUMBER}\\\\nCommit: ${GIT_COMMIT.take(7)}\\\\nView log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console\\", \\"thread\\": {\\"name\\": \\"\$THREAD_NAME\\"}}"
                fi
                curl -s -X POST '${GG_CHAT_WEBHOOK}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                    -H 'Content-Type: application/json' \
                    -d "\$BODY"
                rm -f ${THREAD_FILE}
            """
        }
        aborted {
            sh """
                THREAD_NAME=\$(cat ${THREAD_FILE} 2>/dev/null || echo "")
                BODY='{"text": "⚠️ *NeedApp FE - Deployment Aborted*\\nBuild: #${BUILD_NUMBER}\\nView log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console"}'
                if [ -n "\$THREAD_NAME" ]; then
                    BODY="{\\"text\\": \\"⚠️ *NeedApp FE - Deployment Aborted*\\\\nBuild: #${BUILD_NUMBER}\\\\nView log: ${JENKINS_URL_PUBLIC}/job/needapp-fe/${BUILD_NUMBER}/console\\", \\"thread\\": {\\"name\\": \\"\$THREAD_NAME\\"}}"
                fi
                curl -s -X POST '${GG_CHAT_WEBHOOK}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                    -H 'Content-Type: application/json' \
                    -d "\$BODY"
                rm -f ${THREAD_FILE}
            """
        }
    }
}
