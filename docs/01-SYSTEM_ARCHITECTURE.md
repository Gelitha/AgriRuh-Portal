# Smart Lab Submission & Evaluation System - Architecture Design

## 1. System Overview

The Smart Lab Submission & Evaluation System is a modern, scalable web application designed to replace manual paper-based lab report submission tracking in universities. It streamlines the submission process, provides real-time monitoring, and facilitates the evaluation workflow.

### Key Benefits
- **Eliminates paper waste**: Complete digital submission process
- **Reduces time**: Automated tracking and QR-based submission (avg 30 seconds vs 5 minutes)
- **Improves accuracy**: Digital records prevent manual entry errors
- **Enhances accessibility**: Mobile-friendly interface for students and representatives
- **Supports evaluation**: Integrated marking system with analytics

---

## 2. High-Level Architecture

### Architecture Pattern: Microservices with Monolithic Foundation

For initial deployment, we use a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│   (React/Vue - Student, Rep, Admin Interfaces)           │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                    API Gateway Layer                     │
│   (Express.js/FastAPI - Route Management)               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Business Logic Layer                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization Service         │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  User Management Service                         │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Session Management Service                      │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Submission Service                             │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  QR Code Generation & Management Service        │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Marking & Evaluation Service                   │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Notification Service                           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│   (ORM - Sequelize/SQLAlchemy/TypeORM)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                         │
│   PostgreSQL (Primary) + Redis (Cache/Queue)            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
│   Email Service, File Storage (S3/Azure), QR Generator  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack Recommendation

### Backend
- **Runtime**: Node.js 18+ or Python 3.10+
- **Framework**: Express.js (Node) or FastAPI (Python)
- **Database**: PostgreSQL (relational data, 5.7+ required for JSON support)
- **Cache/Queue**: Redis (session management, rate limiting, background jobs)
- **ORM**: Sequelize (Node) or SQLAlchemy (Python)
- **Authentication**: JWT (access & refresh tokens)
- **QR Generation**: qrcode library
- **File Storage**: AWS S3 or Azure Blob Storage
- **Background Jobs**: Bull (Node) or Celery (Python)

### Frontend
- **Framework**: React 18+ or Vue 3+
- **State Management**: Redux/Zustand (React) or Pinia (Vue)
- **UI Library**: Material-UI, Ant Design, or Tailwind CSS
- **Mobile**: React Native or Progressive Web App (PWA)
- **QR Scanner**: qr-scanner or jsQR library
- **Build Tool**: Vite or Create React App

### Infrastructure
- **Hosting**: AWS (EC2/Elastic Beanstalk), Google Cloud, or Azure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions, GitLab CI, or Jenkins
- **Monitoring**: DataDog, New Relic, or ELK Stack
- **CDN**: CloudFront or Cloudflare

---

## 4. System Components

### 4.1 Core Modules

#### Authentication & Authorization Module
- **JWT-based authentication** with access & refresh tokens
- **Role-based access control (RBAC)** with three levels:
  - Student
  - Class Representative
  - Demonstrator/Lecturer (Admin)
- **University ID/Email** as primary identifier
- **Password reset and MFA support** (optional)

#### User Management Module
- User registration (Admin creates accounts for students/reps)
- Profile management
- Role assignment and modification
- User activation/deactivation
- Department and class association

#### Session Management Module
- Create sessions (Reps/Admins only)
- Set submission windows (on-time, late submission)
- Configure session parameters (subject, date, deadline)
- Auto-generate and manage QR codes
- Session status management (active, closed, archived)

#### Submission System Module
- **QR Code Scanning**: Students scan session QR → automatic submission
- **Manual Selection**: Students select subject and session if QR unavailable
- **Duplicate Prevention**: Check if student already submitted for session
- **Metadata Recording**: Timestamp, location (optional), device info
- **Submission Status**: On-time, Late, Closed

#### QR Code Service
- Generate unique QR codes per session
- Encode session ID and submission URL
- Track QR code generation time and expiration
- Support QR code regeneration

#### Marking & Evaluation Module
- Assign marks to submissions
- Add feedback/comments
- Mark submissions as reviewed/pending
- Optional: Automatic penalties for late submissions
- Control mark visibility to students

#### Analytics & Reporting Module
- Submission rate calculations
- Late submission tracking
- Department-wise analytics
- Export to CSV/Excel

---

## 5. Data Flow Architecture

### Student Submission Flow
```
1. Student Login (University ID + Password)
   ↓
2. Student Navigates to Submit Report
   ↓
3. Student Options:
   a) Scan QR Code → Auto-populate session
   b) Select Subject and Session Manually
   ↓
4. System Checks: Is session active and not closed?
   ↓
5. System Checks: Has this student already submitted?
   ↓
6. Record Submission:
   - Student ID, Name
   - Session ID
   - Submission timestamp
   - Status (On-time/Late/Closed)
   ↓
7. Display Confirmation & Receipt
   ↓
8. Notification: Email/In-app notification
```

### Rep Session Creation Flow
```
1. Rep Login
   ↓
2. Rep Navigation: Create New Session
   ↓
3. Input Session Details:
   - Subject
   - Date and Time
   - Deadline
   - Optional Late Submission Window
   ↓
4. System Generates:
   - Unique Session ID
   - QR Code
   - Generated Timestamp
   ↓
5. Rep Options:
   - Display QR on screen
   - Print QR
   - Share QR link
   ↓
6. Rep Reviews Dashboard:
   - Real-time submission list
   - Students who submitted
   - Students pending
```

### Admin Evaluation Flow
```
1. Admin Login
   ↓
2. Admin Navigation: View Submissions
   ↓
3. Filter/Search:
   - By Session
   - By Department
   - By Status (On-time/Late)
   ↓
4. Review Submission:
   - View submission details
   - Mark as reviewed
   ↓
5. Assign Marks:
   - Enter marks
   - Add feedback
   - Optional: Apply late penalty
   ↓
6. Publish Marks:
   - Make visible to students (optional)
   - Send notifications
   ↓
7. Export Data:
   - Submission report
   - Analytics
```

---

## 6. Security Architecture

### Authentication & Authorization
- **JWT tokens** with 15-min expiry (access) + 7-day expiry (refresh)
- **HTTPS/TLS 1.2+** for all communications
- **CORS policies** restricting to university domain
- **Rate limiting** on authentication endpoints

### Data Security
- **Password hashing**: bcrypt with salt rounds 10+
- **SQL injection prevention**: Parameterized queries via ORM
- **XSS prevention**: Input sanitization + Content Security Policy
- **CSRF protection**: Token-based CSRF validation
- **Encryption**: Sensitive data (student details) encrypted at rest

### API Security
- **API key authentication** for service-to-service calls
- **Request validation**: Schema validation for all inputs
- **Audit logging**: Track all mark assignments and data modifications
- **Role-based endpoint access**: Middleware validation

### Infrastructure Security
- **VPC isolation**: Database in private subnet
- **WAF**: Web Application Firewall for DDoS protection
- **Secrets management**: AWS Secrets Manager or similar
- **Regular backups**: Daily automated backups with encryption

---

## 7. Scalability & Performance Considerations

### Caching Strategy
- **Session data cache**: Redis (30-min TTL)
- **User profile cache**: Redis (1-hour TTL)
- **Submission status cache**: Redis (5-min TTL)
- **QR code cache**: Redis (1-hour TTL)

### Database Optimization
- **Indexes on frequently queried fields**: user_id, session_id, submission_time
- **Table partitioning**: Submissions partitioned by date (monthly)
- **Read replicas**: For analytics queries

### API Optimization
- **Pagination**: All list endpoints support limit/offset
- **Compression**: gzip compression for responses
- **CDN**: Static assets (QR images, documents) served via CDN

### Load Handling
- **Horizontal scaling**: Stateless backend services
- **Load balancing**: Nginx/HAProxy for request distribution
- **Auto-scaling**: Kubernetes or cloud-native orchestration
- **Rate limiting**: 100 requests/min per IP for submission endpoint

---

## 8. Deployment Architecture

### Environment Strategy
- **Development**: Local machine or dev server
- **Staging**: Pre-production environment (mirrors production)
- **Production**: High-availability setup with redundancy

### Containerization
```
docker-compose.yml includes:
- Backend service (Node/Python)
- PostgreSQL database
- Redis cache
- Nginx reverse proxy
```

### CI/CD Pipeline
```
1. Code Push to Repository
   ↓
2. Automated Testing (Unit, Integration)
   ↓
3. Build Docker Images
   ↓
4. Push to Registry
   ↓
5. Deploy to Staging
   ↓
6. Run Smoke Tests
   ↓
7. Promote to Production
```

---

## 9. Metrics & Monitoring

### Key Metrics
- **API Response Time**: p95 < 200ms, p99 < 500ms
- **Database Query Time**: p95 < 100ms
- **Submission Success Rate**: > 99.9%
- **System Uptime**: 99.5% SLA
- **QR Scan Success Rate**: > 98%

### Monitoring Tools
- **Application Performance**: New Relic or DataDog
- **Logging**: ELK Stack or CloudWatch
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Statuspage.io

### Alerts
- API response time > 1s
- Database connection errors
- Authentication failures > 10/min
- Submission failures
- Disk space warning

---

## 10. Future Enhancements

1. **Blockchain Integration**: Immutable submission records
2. **AI-Powered Plagiarism Detection**: Automated content analysis
3. **Mobile Native Apps**: iOS and Android native applications
4. **Geofencing**: Location-based submission restrictions
5. **Biometric Authentication**: Fingerprint/face recognition for enhanced security
6. **Proctoring Integration**: Live invigilation support
7. **Multi-Language Support**: Internationalization
8. **Integration with LMS**: Blackboard, Canvas, Moodle
9. **Mobile Offline Mode**: Queue submissions when offline
10. **Advanced Analytics**: Machine learning for submission patterns

---

## 11. Success Criteria

- ✅ Reduce submission time from 5 min → 30 seconds
- ✅ Zero paper usage for submissions
- ✅ 99.9% system uptime
- ✅ Mobile-responsive interface
- ✅ Support 10,000+ concurrent users
- ✅ Real-time dashboard updates
- ✅ Data export within 1 minute
- ✅ User satisfaction score > 4.5/5

