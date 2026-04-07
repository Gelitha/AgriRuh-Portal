# Quick Start Guide

## Prerequisites
- Node.js 18+ (download from https://nodejs.org/)
- npm (comes with Node.js)
- Git

## Installation & Running

### Option 1: Run Locally (Recommended for Development)

#### Terminal 1 - Start Backend Server
```bash
cd backend
npm install
npm run dev
```

Backend will start on: http://localhost:5000

#### Terminal 2 - Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```

Frontend will start on: http://localhost:5173

### Option 2: Run with Docker (Easiest)

```bash
# Install Docker from https://www.docker.com/products/docker-desktop

# Start all services
docker-compose up

# In another terminal, to stop:
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Verification

Once running, check:

1. **Backend Health**: http://localhost:5000/api/health
   - Should show: `{"status":"ok","timestamp":"...", ...}`

2. **Frontend**: http://localhost:5173
   - Should show the SmartLab dashboard

## API Endpoints (Development)

Once backend is running:

```bash
# Health check
curl http://localhost:5000/api/health

# Get sessions
curl http://localhost:5000/api/sessions

# Validate QR code
curl -X POST http://localhost:5000/api/qr/validate \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"session-123"}'
```

## Project Structure

```
smart-lab-system/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── server.js     # Main server file
│   │   ├── models/       # Database models (User, Session, etc.)
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── middleware/   # Auth, validation, etc.
│   ├── package.json
│   ├── .env              # Configuration
│   └── Dockerfile
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── main.jsx      # React entry point
│   │   ├── App.jsx       # Main component
│   │   └── components/   # Reusable components
│   ├── package.json
│   └── Dockerfile
├── docs/                 # Design documentation
├── database/             # Database scripts
└── docker-compose.yml    # Container orchestration
```

## Troubleshooting

### Backend not responding
- Make sure Terminal 1 shows "✅ SmartLab Backend Server Running"
- Check port 5000 is not in use: `netstat -ano | findstr :5000`
- Try different port: Change `PORT=5001` in backend/.env

### Frontend not loading
- Make sure Terminal 2 shows "➜ local: http://localhost:5173"
- Clear browser cache (Ctrl+Shift+Delete)
- Check network tab in browser DevTools for errors

### Port conflicts
- Change `PORT=` in backend/.env
- Change `server.port` in frontend/vite.config.js
- Update FRONTEND_URL if needed

### npm install fails
- Delete node_modules and package-lock.json
- Run `npm cache clean --force`
- Try again: `npm install`

## Next Steps

1. Review the design documentation in `/docs` folder
2. Implement database migrations in `database/` folder
3. Implement specific endpoints following the API specs
4. Add authentication logic to backend
5. Add QR scanning capability to frontend
6. Deploy using docker-compose file

## Support

For detailed documentation:
- System Architecture: See docs/01-SYSTEM_ARCHITECTURE.md
- API Endpoints: See docs/03-API_SPECIFICATIONS.md
- User Workflows: See docs/05-USER_WORKFLOWS.md
- Implementation Guide: See docs/06-IMPLEMENTATION_GUIDE.md
