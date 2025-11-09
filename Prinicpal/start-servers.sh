#!/bin/bash

# Função para encontrar e matar apenas os processos do nosso servidor
kill_server() {
    # Procura por processos node rodando nas portas 5000 (backend) e 5173 (frontend)
    backend_pid=$(lsof -ti:5000)
    frontend_pid=$(lsof -ti:5173)

    # Se encontrar processo na porta 5000, mata ele
    if [ ! -z "$backend_pid" ]; then
        echo "Encerrando processo do backend (PID: $backend_pid)"
        kill $backend_pid 2>/dev/null || kill -9 $backend_pid 2>/dev/null
    fi

    # Se encontrar processo na porta 5173, mata ele
    if [ ! -z "$frontend_pid" ]; then
        echo "Encerrando processo do frontend (PID: $frontend_pid)"
        kill $frontend_pid 2>/dev/null || kill -9 $frontend_pid 2>/dev/null
    fi
}

# Função para iniciar os servidores
start_servers() {
    # Inicia o backend
    echo "Iniciando o backend..."
    cd /workspaces/Busp-Certo/Prinicpal/backend
    npm start &
    sleep 2

    # Inicia o frontend
    echo "Iniciando o frontend..."
    cd /workspaces/Busp-Certo/Prinicpal/frontend
    npm run dev &
    sleep 2
}

# Mata processos existentes
kill_server

# Inicia os servidores
start_servers

echo "Servidores iniciados com sucesso!"