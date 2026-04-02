#!/bin/bash
set -e

REPO_DIR="C:/Users/user/Documents/CODE/medmind"
cd "$REPO_DIR"

echo "🛡️  MEDMIND Self-Heal Engine iniciando..."

# Verify required env vars
required_vars=(SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN DEVELOPER_WHATSAPP)
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Falta variable de entorno: $var"
    exit 1
  fi
done

# Run the monitor (requires ts-node or tsx)
if command -v tsx &> /dev/null; then
  tsx scripts/self-heal/monitor.ts &
elif command -v ts-node &> /dev/null; then
  ts-node scripts/self-heal/monitor.ts &
else
  echo "❌ Necesitas 'tsx' o 'ts-node': npm install -g tsx"
  exit 1
fi

MONITOR_PID=$!
echo "✅ Monitor corriendo en background (PID: $MONITOR_PID)"
echo "📱 Notificaciones WhatsApp → $DEVELOPER_WHATSAPP"
echo "🔗 Supabase → $SUPABASE_URL"
echo ""
echo "Para detener: kill $MONITOR_PID"

wait $MONITOR_PID
