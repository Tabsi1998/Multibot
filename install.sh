#!/bin/bash

#######################################
# MultiBot Command Center - Installer
# VOLLAUTOMATISCHE Installation
# Einfach ausführen - alles wird installiert!
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get local IP
get_local_ip() {
    if command -v ip &> /dev/null; then
        LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $(NF-2);exit}')
    elif command -v hostname &> /dev/null; then
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    elif command -v ifconfig &> /dev/null; then
        LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    fi
    [ -z "$LOCAL_IP" ] && LOCAL_IP="localhost"
    echo "$LOCAL_IP"
}

LOCAL_IP=$(get_local_ip)

# Banner
clear
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🤖 MultiBot Command Center - VOLLAUTOMATISCHER Installer  ║"
echo "║                                                               ║"
echo "║     Lehne dich zurück - alles wird automatisch installiert!   ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${CYAN}📡 Erkannte lokale IP: ${LOCAL_IP}${NC}"
echo -e "${CYAN}📂 Installationsverzeichnis: $(pwd)${NC}"
echo ""

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_NAME=$NAME
        VER=$VERSION_ID
    elif [ -f /etc/debian_version ]; then
        OS="debian"
        OS_NAME="Debian"
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
        OS_NAME="Red Hat"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        OS_NAME="macOS"
    else
        OS=$(uname -s | tr '[:upper:]' '[:lower:]')
        OS_NAME=$(uname -s)
    fi
    echo -e "${CYAN}📦 Erkanntes Betriebssystem: ${OS_NAME}${NC}"
}

# Auto-install system dependencies
install_all_dependencies() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   📥 INSTALLIERE ALLE ABHÄNGIGKEITEN AUTOMATISCH...          ${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Debian/Ubuntu
    if command -v apt-get &> /dev/null; then
        echo -e "${CYAN}🔧 Verwende APT (Debian/Ubuntu)...${NC}"
        
        # Update package list
        echo -e "${YELLOW}   → Aktualisiere Paketliste...${NC}"
        sudo apt-get update -qq
        
        # Install Python
        echo -e "${YELLOW}   → Installiere Python 3...${NC}"
        sudo apt-get install -y -qq python3 python3-pip python3-venv python3-dev build-essential
        
        # Install Node.js (via NodeSource for latest version)
        echo -e "${YELLOW}   → Installiere Node.js 20.x...${NC}"
        if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 18 ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
            sudo apt-get install -y -qq nodejs
        fi
        
        # Install MongoDB
        echo -e "${YELLOW}   → Installiere MongoDB...${NC}"
        if ! command -v mongod &> /dev/null; then
            # Import MongoDB GPG key
            curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg 2>/dev/null || true
            # Add repository
            echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list >/dev/null
            sudo apt-get update -qq
            sudo apt-get install -y -qq mongodb-org || sudo apt-get install -y -qq mongodb
            sudo systemctl start mongod 2>/dev/null || sudo service mongod start 2>/dev/null || true
            sudo systemctl enable mongod 2>/dev/null || true
        fi
        
        # Install other tools
        echo -e "${YELLOW}   → Installiere weitere Tools...${NC}"
        sudo apt-get install -y -qq curl wget git
        
    # Red Hat/CentOS/Fedora
    elif command -v dnf &> /dev/null; then
        echo -e "${CYAN}🔧 Verwende DNF (Fedora/RHEL)...${NC}"
        
        echo -e "${YELLOW}   → Installiere Python 3...${NC}"
        sudo dnf install -y python3 python3-pip python3-devel gcc
        
        echo -e "${YELLOW}   → Installiere Node.js...${NC}"
        sudo dnf install -y nodejs npm
        
        echo -e "${YELLOW}   → Installiere MongoDB...${NC}"
        if ! command -v mongod &> /dev/null; then
            cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'REPOEOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
REPOEOF
            sudo dnf install -y mongodb-org || sudo dnf install -y mongodb
            sudo systemctl start mongod
            sudo systemctl enable mongod
        fi
        
    elif command -v yum &> /dev/null; then
        echo -e "${CYAN}🔧 Verwende YUM (CentOS/RHEL)...${NC}"
        
        echo -e "${YELLOW}   → Installiere Python 3...${NC}"
        sudo yum install -y python3 python3-pip python3-devel gcc
        
        echo -e "${YELLOW}   → Installiere Node.js...${NC}"
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
        sudo yum install -y nodejs
        
        echo -e "${YELLOW}   → Installiere MongoDB...${NC}"
        sudo yum install -y mongodb-org || sudo yum install -y mongodb
        sudo systemctl start mongod 2>/dev/null || true
        sudo systemctl enable mongod 2>/dev/null || true
        
    # Arch Linux
    elif command -v pacman &> /dev/null; then
        echo -e "${CYAN}🔧 Verwende Pacman (Arch Linux)...${NC}"
        
        echo -e "${YELLOW}   → Installiere alle Pakete...${NC}"
        sudo pacman -Sy --noconfirm python python-pip nodejs npm mongodb curl wget git base-devel
        sudo systemctl start mongodb
        sudo systemctl enable mongodb
        
    # macOS
    elif command -v brew &> /dev/null; then
        echo -e "${CYAN}🔧 Verwende Homebrew (macOS)...${NC}"
        
        echo -e "${YELLOW}   → Installiere Python 3...${NC}"
        brew install python3 2>/dev/null || true
        
        echo -e "${YELLOW}   → Installiere Node.js...${NC}"
        brew install node 2>/dev/null || true
        
        echo -e "${YELLOW}   → Installiere MongoDB...${NC}"
        brew tap mongodb/brew 2>/dev/null || true
        brew install mongodb-community 2>/dev/null || true
        brew services start mongodb-community
        
    # macOS without Homebrew - install Homebrew first
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${CYAN}🔧 macOS erkannt - installiere Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        echo -e "${YELLOW}   → Installiere alle Pakete...${NC}"
        brew install python3 node
        brew tap mongodb/brew
        brew install mongodb-community
        brew services start mongodb-community
        
    else
        echo -e "${RED}❌ Konnte Paketmanager nicht erkennen!${NC}"
        echo -e "${YELLOW}Bitte installiere manuell: Python 3.11+, Node.js 18+, MongoDB 6+${NC}"
        exit 1
    fi
    
    # Install Yarn globally
    echo -e "${YELLOW}   → Installiere Yarn...${NC}"
    if ! command -v yarn &> /dev/null; then
        sudo npm install -g yarn 2>/dev/null || npm install -g yarn
    fi
    
    echo ""
    echo -e "${GREEN}✅ Alle System-Abhängigkeiten installiert!${NC}"
}

# Verify installations
verify_installations() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   🔍 ÜBERPRÜFE INSTALLATIONEN...                             ${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    ALL_OK=true
    
    # Python
    if command -v python3 &> /dev/null; then
        PYTHON_VER=$(python3 --version 2>&1)
        echo -e "${GREEN}   ✅ Python: ${PYTHON_VER}${NC}"
    else
        echo -e "${RED}   ❌ Python nicht gefunden${NC}"
        ALL_OK=false
    fi
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VER=$(node --version 2>&1)
        echo -e "${GREEN}   ✅ Node.js: ${NODE_VER}${NC}"
    else
        echo -e "${RED}   ❌ Node.js nicht gefunden${NC}"
        ALL_OK=false
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VER=$(npm --version 2>&1)
        echo -e "${GREEN}   ✅ npm: v${NPM_VER}${NC}"
    else
        echo -e "${RED}   ❌ npm nicht gefunden${NC}"
        ALL_OK=false
    fi
    
    # Yarn
    if command -v yarn &> /dev/null; then
        YARN_VER=$(yarn --version 2>&1)
        echo -e "${GREEN}   ✅ Yarn: v${YARN_VER}${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Yarn wird installiert...${NC}"
        sudo npm install -g yarn 2>/dev/null || npm install -g yarn
    fi
    
    # MongoDB
    if command -v mongod &> /dev/null; then
        MONGO_VER=$(mongod --version 2>&1 | head -1)
        echo -e "${GREEN}   ✅ MongoDB: ${MONGO_VER}${NC}"
    else
        echo -e "${YELLOW}   ⚠️  MongoDB nicht als Command verfügbar (evtl. als Service)${NC}"
    fi
    
    echo ""
    
    if [ "$ALL_OK" = false ]; then
        echo -e "${RED}❌ Einige Abhängigkeiten fehlen. Bitte manuell installieren.${NC}"
        exit 1
    fi
}

# Setup backend
setup_backend() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   🐍 RICHTE BACKEND EIN...                                   ${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    cd backend
    
    # Create virtual environment
    echo -e "${YELLOW}   → Erstelle Python Virtual Environment...${NC}"
    python3 -m venv venv
    
    # Activate and install
    echo -e "${YELLOW}   → Installiere Python-Pakete...${NC}"
    source venv/bin/activate
    pip install --upgrade pip -q
    
    # Install emergentintegrations from custom index (required for AI features)
    echo -e "${YELLOW}   → Installiere Emergent Integrations (für AI)...${NC}"
    pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ -q 2>/dev/null || true
    
    # Install other requirements
    pip install -r requirements.txt -q
    
    # Create .env
    echo -e "${YELLOW}   → Erstelle Konfigurationsdatei...${NC}"
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
    cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="multibot"
CORS_ORIGINS="*"
JWT_SECRET="${JWT_SECRET}"
HOST="0.0.0.0"
PORT="8001"
EOF
    
    deactivate
    cd ..
    
    echo -e "${GREEN}   ✅ Backend eingerichtet!${NC}"
}

# Setup frontend
setup_frontend() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   ⚛️  RICHTE FRONTEND EIN...                                  ${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    cd frontend
    
    # Install dependencies
    echo -e "${YELLOW}   → Installiere Node.js-Pakete (das kann etwas dauern)...${NC}"
    yarn install --silent 2>/dev/null || npm install --silent
    
    # Create .env with local IP
    echo -e "${YELLOW}   → Erstelle Konfigurationsdatei...${NC}"
    cat > .env << EOF
REACT_APP_BACKEND_URL=http://${LOCAL_IP}:8001
HOST=0.0.0.0
PORT=3000
EOF
    
    cd ..
    
    echo -e "${GREEN}   ✅ Frontend eingerichtet!${NC}"
}

# Create start script
create_start_script() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   📜 ERSTELLE START-SCRIPT...                                ${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    cat > start.sh << 'STARTSCRIPT'
#!/bin/bash

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get local IP
get_local_ip() {
    if command -v ip &> /dev/null; then
        ip route get 1 2>/dev/null | awk '{print $(NF-2);exit}'
    elif command -v hostname &> /dev/null; then
        hostname -I 2>/dev/null | awk '{print $1}'
    elif command -v ifconfig &> /dev/null; then
        ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1
    else
        echo "localhost"
    fi
}

LOCAL_IP=$(get_local_ip)
[ -z "$LOCAL_IP" ] && LOCAL_IP="localhost"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

clear
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🚀 MultiBot Command Center - Starte...                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${CYAN}📡 Lokale IP: ${LOCAL_IP}${NC}"
echo ""

# Start MongoDB
echo -e "${YELLOW}📦 Starte MongoDB...${NC}"
if command -v systemctl &> /dev/null; then
    sudo systemctl start mongod 2>/dev/null || sudo systemctl start mongodb 2>/dev/null || true
elif command -v brew &> /dev/null; then
    brew services start mongodb-community 2>/dev/null || true
elif command -v service &> /dev/null; then
    sudo service mongod start 2>/dev/null || sudo service mongodb start 2>/dev/null || true
fi
sleep 2

# Update frontend .env with current IP
echo "REACT_APP_BACKEND_URL=http://${LOCAL_IP}:8001" > frontend/.env
echo "HOST=0.0.0.0" >> frontend/.env
echo "PORT=3000" >> frontend/.env

# Start Backend
echo -e "${YELLOW}🐍 Starte Backend auf 0.0.0.0:8001...${NC}"
cd backend
source venv/bin/activate
nohup uvicorn server:app --host 0.0.0.0 --port 8001 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

sleep 3

# Start Frontend
echo -e "${YELLOW}⚛️  Starte Frontend auf 0.0.0.0:3000...${NC}"
cd frontend
nohup env HOST=0.0.0.0 PORT=3000 yarn start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

sleep 5

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║     ✅ MultiBot Command Center läuft!                         ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║  📱 Dashboard (lokal):      http://localhost:3000             ║${NC}"
echo -e "${GREEN}║  📱 Dashboard (Netzwerk):   http://${LOCAL_IP}:3000               ${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║  🔌 API (lokal):            http://localhost:8001             ║${NC}"
echo -e "${GREEN}║  🔌 API (Netzwerk):         http://${LOCAL_IP}:8001               ${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}💡 Zugriff von anderen Geräten: http://${LOCAL_IP}:3000${NC}"
echo -e "${YELLOW}📝 Erster registrierter Benutzer = Administrator!${NC}"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo -e "   Backend:  tail -f logs/backend.log"
echo -e "   Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${CYAN}Stoppen mit: ./stop.sh${NC}"
STARTSCRIPT
    
    chmod +x start.sh
    
    # Create logs directory
    mkdir -p logs
    
    echo -e "${GREEN}   ✅ start.sh erstellt!${NC}"
}

# Create stop script
create_stop_script() {
    cat > stop.sh << 'STOPSCRIPT'
#!/bin/bash

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}🛑 Stoppe MultiBot Command Center...${NC}"

# Kill by PID files
if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null
    rm logs/backend.pid
fi

if [ -f logs/frontend.pid ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null
    rm logs/frontend.pid
fi

# Also kill by port (backup)
kill $(lsof -t -i:3000) 2>/dev/null || true
kill $(lsof -t -i:8001) 2>/dev/null || true

echo -e "${GREEN}✅ MultiBot gestoppt.${NC}"
STOPSCRIPT
    
    chmod +x stop.sh
    echo -e "${GREEN}   ✅ stop.sh erstellt!${NC}"
}

# Create restart script
create_restart_script() {
    cat > restart.sh << 'RESTARTSCRIPT'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
./stop.sh
sleep 2
./start.sh
RESTARTSCRIPT
    
    chmod +x restart.sh
    echo -e "${GREEN}   ✅ restart.sh erstellt!${NC}"
}

# Create status script
create_status_script() {
    cat > status.sh << 'STATUSSCRIPT'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}📊 MultiBot Status:${NC}"
echo ""

# Check Backend
if [ -f logs/backend.pid ] && kill -0 $(cat logs/backend.pid) 2>/dev/null; then
    echo -e "${GREEN}   ✅ Backend läuft (PID: $(cat logs/backend.pid))${NC}"
else
    echo -e "${RED}   ❌ Backend läuft nicht${NC}"
fi

# Check Frontend
if [ -f logs/frontend.pid ] && kill -0 $(cat logs/frontend.pid) 2>/dev/null; then
    echo -e "${GREEN}   ✅ Frontend läuft (PID: $(cat logs/frontend.pid))${NC}"
else
    echo -e "${RED}   ❌ Frontend läuft nicht${NC}"
fi

# Check MongoDB
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}   ✅ MongoDB läuft${NC}"
else
    echo -e "${RED}   ❌ MongoDB läuft nicht${NC}"
fi
STATUSSCRIPT
    
    chmod +x status.sh
    echo -e "${GREEN}   ✅ status.sh erstellt!${NC}"
}

# Main installation
main() {
    detect_os
    install_all_dependencies
    verify_installations
    setup_backend
    setup_frontend
    create_start_script
    create_stop_script
    create_restart_script
    create_status_script
    
    # Final message
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║     🎉 INSTALLATION ERFOLGREICH ABGESCHLOSSEN!                ║"
    echo "║                                                               ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo "║                                                               ║"
    echo "║     Verfügbare Befehle:                                       ║"
    echo "║                                                               ║"
    echo "║       ./start.sh    - Starten                                 ║"
    echo "║       ./stop.sh     - Stoppen                                 ║"
    echo "║       ./restart.sh  - Neustarten                              ║"
    echo "║       ./status.sh   - Status prüfen                           ║"
    echo "║                                                               ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo "║                                                               ║"
    echo "║     📱 Dashboard (lokal):      http://localhost:3000          ║"
    echo "║     📱 Dashboard (Netzwerk):   http://${LOCAL_IP}:3000            "
    echo "║                                                               ║"
    echo "║     🔌 API (lokal):            http://localhost:8001          ║"
    echo "║     🔌 API (Netzwerk):         http://${LOCAL_IP}:8001            "
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  📝 NÄCHSTE SCHRITTE:                                         ║${NC}"
    echo -e "${YELLOW}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${YELLOW}║                                                               ║${NC}"
    echo -e "${YELLOW}║  1. Starte mit:  ./start.sh                                   ║${NC}"
    echo -e "${YELLOW}║  2. Öffne:       http://localhost:3000                        ║${NC}"
    echo -e "${YELLOW}║  3. Registriere dich (1. User = Admin!)                       ║${NC}"
    echo -e "${YELLOW}║  4. Füge Discord Bot Token hinzu                              ║${NC}"
    echo -e "${YELLOW}║                                                               ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Starte jetzt mit: ${GREEN}./start.sh${NC}"
    echo ""
}

# Run
main "$@"
