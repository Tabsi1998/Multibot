#!/bin/bash

#######################################
# MultiBot Command Center - Installer
# One-Command Installation Script
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🤖 MultiBot Command Center - Installer                ║"
echo "║     Der ultimative Discord Bot mit Web-Dashboard          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Hinweis: Du führst das Script als root aus.${NC}"
fi

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    echo -e "${CYAN}📦 Erkanntes OS: $OS $VER${NC}"
}

# Check dependencies
check_dependency() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 gefunden${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 nicht gefunden${NC}"
        return 1
    fi
}

# Install system dependencies
install_dependencies() {
    echo -e "\n${BLUE}📥 Prüfe Abhängigkeiten...${NC}\n"
    
    MISSING_DEPS=()
    
    check_dependency "python3" || MISSING_DEPS+=("python3")
    check_dependency "pip3" || check_dependency "pip" || MISSING_DEPS+=("python3-pip")
    check_dependency "node" || MISSING_DEPS+=("nodejs")
    check_dependency "npm" || MISSING_DEPS+=("npm")
    check_dependency "mongod" || MISSING_DEPS+=("mongodb")
    
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  Fehlende Abhängigkeiten: ${MISSING_DEPS[*]}${NC}"
        echo -e "${YELLOW}Bitte installiere diese manuell oder nutze den automatischen Installer:${NC}\n"
        
        read -p "Soll ich versuchen, die Abhängigkeiten automatisch zu installieren? (j/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Jj]$ ]]; then
            install_system_deps
        else
            echo -e "${RED}Installation abgebrochen. Bitte installiere die fehlenden Abhängigkeiten.${NC}"
            exit 1
        fi
    fi
}

# Install system dependencies based on OS
install_system_deps() {
    if command -v apt-get &> /dev/null; then
        echo -e "${CYAN}📦 Verwende apt-get...${NC}"
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv nodejs npm
        
        # Install MongoDB
        if ! command -v mongod &> /dev/null; then
            echo -e "${CYAN}📦 Installiere MongoDB...${NC}"
            wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
        fi
        
    elif command -v yum &> /dev/null; then
        echo -e "${CYAN}📦 Verwende yum...${NC}"
        sudo yum install -y python3 python3-pip nodejs npm mongodb-org
        
    elif command -v brew &> /dev/null; then
        echo -e "${CYAN}📦 Verwende Homebrew...${NC}"
        brew install python3 node mongodb-community
        brew services start mongodb-community
        
    elif command -v pacman &> /dev/null; then
        echo -e "${CYAN}📦 Verwende pacman...${NC}"
        sudo pacman -S python python-pip nodejs npm mongodb
        
    else
        echo -e "${RED}❌ Konnte Paketmanager nicht erkennen. Bitte installiere manuell:${NC}"
        echo "   - Python 3.11+"
        echo "   - Node.js 18+"
        echo "   - MongoDB 6+"
        exit 1
    fi
    
    # Install yarn globally
    if ! command -v yarn &> /dev/null; then
        echo -e "${CYAN}📦 Installiere Yarn...${NC}"
        npm install -g yarn
    fi
}

# Setup backend
setup_backend() {
    echo -e "\n${BLUE}🐍 Richte Backend ein...${NC}\n"
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        echo -e "${CYAN}📝 Erstelle Backend .env...${NC}"
        cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="multibot"
CORS_ORIGINS="*"
JWT_SECRET="$(openssl rand -hex 32)"
EOF
    fi
    
    deactivate
    cd ..
}

# Setup frontend
setup_frontend() {
    echo -e "\n${BLUE}⚛️  Richte Frontend ein...${NC}\n"
    
    cd frontend
    
    # Install dependencies
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        echo -e "${CYAN}📝 Erstelle Frontend .env...${NC}"
        cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    fi
    
    cd ..
}

# Create start script
create_start_script() {
    echo -e "\n${BLUE}📜 Erstelle Start-Script...${NC}\n"
    
    cat > start.sh << 'EOF'
#!/bin/bash

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Starte MultiBot Command Center...${NC}"

# Start MongoDB if not running
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${CYAN}📦 Starte MongoDB...${NC}"
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    elif command -v brew &> /dev/null; then
        brew services start mongodb-community
    else
        mongod --fork --logpath /var/log/mongodb.log
    fi
fi

# Start Backend
echo -e "${CYAN}🐍 Starte Backend...${NC}"
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start Frontend
echo -e "${CYAN}⚛️  Starte Frontend...${NC}"
cd frontend
if command -v yarn &> /dev/null; then
    yarn start &
else
    npm start &
fi
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ MultiBot Command Center gestartet!${NC}"
echo -e "${GREEN}📱 Dashboard: http://localhost:3000${NC}"
echo -e "${GREEN}🔌 API: http://localhost:8001${NC}"
echo ""
echo -e "Drücke Ctrl+C zum Beenden..."

# Handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait
wait
EOF
    
    chmod +x start.sh
}

# Create stop script
create_stop_script() {
    cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stoppe MultiBot Command Center..."

# Kill processes on ports
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:8001) 2>/dev/null

echo "✅ Gestoppt."
EOF
    
    chmod +x stop.sh
}

# Create systemd service (optional)
create_systemd_service() {
    if command -v systemctl &> /dev/null; then
        echo -e "\n${BLUE}📜 Erstelle Systemd Service...${NC}\n"
        
        INSTALL_DIR=$(pwd)
        
        sudo cat > /etc/systemd/system/multibot.service << EOF
[Unit]
Description=MultiBot Command Center
After=network.target mongodb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/start.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        echo -e "${GREEN}✅ Systemd Service erstellt.${NC}"
        echo -e "${CYAN}   Starten mit: sudo systemctl start multibot${NC}"
        echo -e "${CYAN}   Autostart:   sudo systemctl enable multibot${NC}"
    fi
}

# Main installation
main() {
    detect_os
    install_dependencies
    setup_backend
    setup_frontend
    create_start_script
    create_stop_script
    
    # Ask for systemd service
    if command -v systemctl &> /dev/null; then
        echo ""
        read -p "Soll ein Systemd Service erstellt werden (Autostart)? (j/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Jj]$ ]]; then
            create_systemd_service
        fi
    fi
    
    # Success message
    echo -e "\n${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║     ✅ Installation erfolgreich abgeschlossen!            ║"
    echo "║                                                           ║"
    echo "╠═══════════════════════════════════════════════════════════╣"
    echo "║                                                           ║"
    echo "║     🚀 Starten:        ./start.sh                         ║"
    echo "║     🛑 Stoppen:        ./stop.sh                          ║"
    echo "║                                                           ║"
    echo "║     📱 Dashboard:      http://localhost:3000              ║"
    echo "║     🔌 API:            http://localhost:8001              ║"
    echo "║                                                           ║"
    echo "║     📖 Dokumentation:  /docs/QUICKSTART.md                ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${YELLOW}📝 Nächste Schritte:${NC}"
    echo "   1. Starte mit: ./start.sh"
    echo "   2. Öffne http://localhost:3000"
    echo "   3. Registriere dich (erster User = Admin)"
    echo "   4. Füge deinen Discord Bot Token hinzu"
    echo ""
}

# Run
main "$@"
