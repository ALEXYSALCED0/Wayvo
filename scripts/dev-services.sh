#!/bin/bash
# Inicia todos los microservicios backend de Wayvo concurrentemente

trap 'kill $(jobs -p)' SIGINT SIGTERM EXIT

echo "🚀 Iniciando microservicios de Wayvo..."
echo "  • Booking Service: http://localhost:3001"
echo "  • Provider Service: http://localhost:3002"
echo "  • Trip Service: http://localhost:3003"
echo "  • API Gateway: http://localhost:3000"

npm run dev:booking &
npm run dev:provider &
npm run dev:trip &
npm run dev:gateway &

wait
