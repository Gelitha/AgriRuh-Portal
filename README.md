# Smart Lab Submission & Evaluation System

## 🎯 Project Overview

A modern, scalable web-based system designed to digitize and streamline university lab report submission tracking and evaluation processes. This system replaces manual paper-based submissions with an efficient digital workflow supporting students, class representatives, and instructors.

### Key Objectives
✅ Eliminate paper-based submissions (100% digital)
✅ Reduce submission time from 5 minutes to <30 seconds
✅ Provide real-time monitoring and analytics
✅ Enable efficient marking and evaluation
✅ Support role-based workflows (Student, Rep, Admin)
✅ Achieve 99.9% system uptime

---

## 📦 Project Structure

```
Smart Lab Submission System/
├── docs/
│   ├── 01-SYSTEM_ARCHITECTURE.md      # Complete system design
│   ├── 02-DATABASE_SCHEMA.md          # Database design & ERD
│   ├── 03-API_SPECIFICATIONS.md       # REST API documentation
│   ├── 04-UI_UX_DESIGN.md             # Wireframes & design specs
│   ├── 05-USER_WORKFLOWS.md           # Detailed user journeys
│   └── README.md                      # This file
│
├── backend/
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Request handlers
│   │   ├── services/            # Business logic
│   │   ├── models/              # Database models
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Authentication, validation
│   │   ├── utils/               # Helper utilities
│   │   ├── constants/           # Constants and enums
│   │   └── server.js            # Entry point
│   ├── tests/                   # Unit & integration tests
│   ├── .env.example             # Environment variables template
│   ├── package.json             # Dependencies
│   └── README.md                # Backend setup guide
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API client
│   │   ├── hooks/               # Custom hooks
│   │   ├── context/             # State management
│   │   ├── styles/              # Global styles
│   │   ├── utils/               # Helper functions
│   │   └── App.jsx              # Root component
│   ├── public/                  # Static files
│   ├── tests/                   # Component tests
│   ├── .env.example             # Environment variables
│   ├── package.json             # Dependencies
│   └── README.md                # Frontend setup guide
│
├── database/
│   ├── migrations/              # SQL migration files
│   │   └── 001-init-schema.sql
│   │   └── 002-add-indexes.sql
│   │   └── 003-add-audit-logs.sql
│   ├── seeds/                   # Sample data
│   │   └── sample-data.sql
│   └── scripts/                 # Utility scripts
│       └── backup.sh
│       └── restore.sh
│
├── docker-compose.yml           # Local development environment
├── .gitignore
├── LICENSE
└── CONTRIBUTING.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+
- **PostgreSQL**: v12+
- **Redis**: v6+
- **Docker & Docker Compose** (optional, recommended)
- **Git**

### Option 1: Docker Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/university/smartlab-system.git
cd smartlab-system

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start containers
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate

# Seed sample data
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/v1
# API Docs: http://localhost:3001/api/v1/docs
```

### Option 2: Local Development Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Create database
createdb smartlab_db

# Run migrations
npm run migrate

# Seed sample data
npm run seed

# Start development server
npm run dev

# Server runs on http://localhost:3001
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with backend URL

# Start development server
npm run dev

# App runs on http://localhost:3000
```

---

## 🔧 Environment Variables

### Backend (.env)

```
# Server
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartlab_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=smartlab-submissions

# QR Code
QR_EXPIRY_MINUTES=120

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_APP_NAME=SmartLab
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development
```

---

## 📚 Documentation Guide

Read the documentation in this order:

1. **[01-SYSTEM_ARCHITECTURE.md](./docs/01-SYSTEM_ARCHITECTURE.md)**
   - Understand the overall system design, components, and technology stack
   - Review the high-level architecture and data flow
   - Estimated reading time: 30 minutes

2. **[02-DATABASE_SCHEMA.md](./docs/02-DATABASE_SCHEMA.md)**
   - Learn the database structure, tables, and relationships
   - Understand entity relationships and indexing strategy
   - Estimated reading time: 20 minutes

3. **[03-API_SPECIFICATIONS.md](./docs/03-API_SPECIFICATIONS.md)**
   - Explore all REST API endpoints and request/response formats
   - Reference during frontend and backend development
   - Estimated reading time: 40 minutes (reference document)

4. **[04-UI_UX_DESIGN.md](./docs/04-UI_UX_DESIGN.md)**
   - Review wireframes and UI components for all three user roles
   - Understand design system and accessibility requirements
   - Estimated reading time: 25 minutes

5. **[05-USER_WORKFLOWS.md](./docs/05-USER_WORKFLOWS.md)**
   - Study detailed user journeys for each role
   - Understand data flow and system behavior
   - Reference for edge cases and error handling
   - Estimated reading time: 35 minutes (reference document)

---

## 🏗️ Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Tasks:**
- [ ] Set up development environment (Docker, databases)
- [ ] Initialize Git repository with proper branching strategy
- [ ] Create backend Express.js project with boilerplate
- [ ] Create frontend React project with boilerplate
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Configure ESLint, Prettier, TypeScript

**Deliverables:**
- Basic project structure
- Development environment ready
- CI/CD pipeline configured

### Phase 2: Backend Core (Weeks 3-5)

**Tasks:**
- [ ] Implement database schema and migrations
- [ ] Create authentication system (JWT, password hashing)
- [ ] Implement user management endpoints
- [ ] Build session management service
- [ ] Create QR code generation service
- [ ] Implement submission logic with duplicate prevention
- [ ] Add error handling and logging

**Deliverables:**
- User registration and login working
- Session creation and QR code generation
- Basic submission functionality

**Key Files to Create:**
```
backend/src/
├── models/
│   ├── User.js
│   ├── Session.js
│   ├── Submission.js
│   └── Marks.js
├── services/
│   ├── AuthService.js
│   ├── SessionService.js
│   ├── SubmissionService.js
│   └── QRCodeService.js
├── controllers/
│   ├── authController.js
│   ├── sessionController.js
│   └── submissionController.js
└── middleware/
    ├── authMiddleware.js
    └── validationMiddleware.js
```

### Phase 3: Frontend Core (Weeks 6-8)

**Tasks:**
- [ ] Build authentication pages (login)
- [ ] Create student dashboard and submission flow
- [ ] Implement QR code scanner component
- [ ] Build class rep dashboard
- [ ] Create admin dashboard
- [ ] Implement real-time updates (WebSocket)
- [ ] Add responsive design

**Deliverables:**
- Student can submit via QR code
- Rep can create sessions and monitor submissions
- Admin can view submissions and data

**Key Components:**
```
frontend/src/
├── pages/
│   ├── LoginPage.jsx
│   ├── StudentDashboard.jsx
│   ├── RepDashboard.jsx
│   └── AdminDashboard.jsx
├── components/
│   ├── QRScanner.jsx
│   ├── SubmissionForm.jsx
│   ├── SubmissionTable.jsx
│   └── MarkingInterface.jsx
└── hooks/
    ├── useAuth.js
    └── useSubmissions.js
```

### Phase 4: Advanced Features (Weeks 9-10)

**Tasks:**
- [ ] Implement marking system with rubrics
- [ ] Add analytics and reporting
- [ ] Create export functionality (CSV, PDF)
- [ ] Build notification system (email, in-app)
- [ ] Implement late penalty system
- [ ] Add audit logging
- [ ] Create admin user management

**Deliverables:**
- Full marking workflow working
- Analytics dashboard populated
- Email notifications sending

### Phase 5: Testing & Optimization (Weeks 11-12)

**Tasks:**
- [ ] Write unit tests for services (target: 80% coverage)
- [ ] Write integration tests for API endpoints
- [ ] Write E2E tests for main workflows
- [ ] Performance testing and optimization
- [ ] Security audit and penetration testing
- [ ] Load testing (SLOAD, JMeter)
- [ ] Documentation finalization

**Deliverables:**
- All tests passing
- Performance benchmarks met
- Security issues resolved

---

## 🛡️ Security Checklist

Before launching to production:

- [ ] Enable HTTPS/TLS for all communications
- [ ] Implement CORS with proper origins
- [ ] Add rate limiting on authentication endpoints
- [ ] Implement CSRF token validation
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Sanitize all user inputs
- [ ] Hash passwords with bcrypt (min 10 rounds)
- [ ] Store secrets in environment variables
- [ ] Implement request validation middleware
- [ ] Enable audit logging for sensitive operations
- [ ] Setup firewall rules for database access
- [ ] Configure backups and disaster recovery
- [ ] Implement monitoring and alerting
- [ ] Create incident response plan

---

## 📊 Database Initialization

### 1. Create Database

```bash
createdb smartlab_db

# Or with Docker
docker-compose exec db createdb -U postgres smartlab_db
```

### 2. Run Migrations

```bash
npm run migrate

# Specific migration
npm run migrate --to=001-init-schema.sql
```

### 3. Seed Sample Data (Optional)

```bash
npm run seed

# This creates:
# - 3 departments (CSE, ECE, MECH)
# - 10 subjects
# - 50 users (35 students, 10 reps, 5 admins)
# - 5 sessions with QR codes
# - 100 sample submissions
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test

# With coverage report
npm run test:coverage

# Watch mode (for development)
npm run test:watch
```

### Specific Test Suite

```bash
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=submission
npm test -- --testPathPattern=session
```

### E2E Tests

```bash
npm run test:e2e

# Specific E2E test
npm run test:e2e -- --testNamePattern="student submission"
```

---

## 📈 Performance Targets

| Metric | Target | How to Monitor |
|--------|--------|---|
| API Response Time (p95) | < 200ms | New Relic, DataDog |
| Database Query Time (p95) | < 100ms | PostgreSQL logs, pg_stat_statements |
| Page Load Time | < 2s | Lighthouse, WebPageTest |
| Submission Success Rate | > 99.9% | Application logs, error tracking |
| System Uptime | 99.5% SLA | Statuspage.io, monitoring tools |
| QR Scan Success Rate | > 98% | Analytics dashboard |

---

## 🚨 Monitoring & Alerts

### Key Metrics to Monitor

1. **Application Health**
   - API error rate (alert if > 1%)
   - API response time (alert if p95 > 500ms)
   - Database connection pool utilization

2. **Business Metrics**
   - Submission success rate
   - Failed QR scans
   - Session creation rate
   - User authentication failures

3. **Infrastructure**
   - CPU usage (alert if > 80%)
   - Memory usage (alert if > 85%)
   - Disk space (alert if < 20%)
   - Network latency

### Setup Monitoring

```bash
# DataDog integration
npm install datadog-browser-rum

# Or New Relic
npm install newrelic

# Or Sentry for error tracking
npm install @sentry/node
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: docker-compose build
      - name: Push to registry
        run: docker push ${{ secrets.REGISTRY_URL }}/backend:latest

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: kubectl apply -f k8s/staging/
      - name: Run smoke tests
        run: npm run test:smoke
      - name: Deploy to production
        run: kubectl apply -f k8s/production/
```

---

## 📞 Support & Community

### Getting Help

- **Documentation**: Read the docs folder first
- **Issues**: [GitHub Issues](https://github.com/university/smartlab-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/university/smartlab-system/discussions)
- **Email**: smartlab-dev@university.edu

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📋 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database backups configured
- [ ] SSL certificates installed
- [ ] Environment variables configured
- [ ] Monitoring and alerting setup
- [ ] Error tracking configured
- [ ] Log aggregation configured
- [ ] CDN configured for static assets
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Database connection pooling optimized
- [ ] Redis cache configured
- [ ] API documentation deployed
- [ ] Incident response team trained

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Team**: All contributors and stakeholders
- **University**: For supporting this initiative
- **Framework/Libraries**: Express.js, React, PostgreSQL, Redis

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-26 | Initial release with core features |
| 1.1.0 | TBD | Add plagiarism detection |
| 1.2.0 | TBD | Mobile native apps |
| 2.0.0 | TBD | Blockchain integration |

---

## ❓ FAQ

### Q: How long does it take to set up?
**A:** With Docker: ~5 minutes. Local setup: ~15-20 minutes.

### Q: What's the system capacity?
**A:** Designed for ~10,000 concurrent users. Horizontally scalable.

### Q: Can I deploy to AWS?
**A:** Yes! Use Elastic Beanstalk for backend, CloudFront for frontend, RDS for database.

### Q: What about mobile users?
**A:** Fully responsive design. Future versions will include native apps.

### Q: Is offline mode supported?
**A:** Future enhancement planned for Phase 2.

---

**Last Updated**: March 26, 2026

For the latest version, visit: [GitHub Repository](https://github.com/university/smartlab-system)

