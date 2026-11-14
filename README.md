# Industrial Tank Monitoring & Inventory Control System

<p align="center">
  **A Modern, Secure & Hardware-Ready Industrial Monitoring Platform**
</p>

<p align="center">
  <a href="https://industrial-tank-monitoring.vercel.app">Live Demo</a> •
  <a href="https://github.com/areebamansoor49-eng/industrial-tank-monitoring">GitHub Repository</a>
</p>

---

## Overview

The **Industrial Tank Monitoring & Inventory Control System** is a modern, web-based industrial operations platform designed to centralize tank monitoring, asset management, inventory operations, delivery tracking, alerts, incidents, and reporting.

The platform follows a **software-first, hardware-ready architecture**, providing a foundation for future integration with physical IoT sensors, industrial controllers, gateways, and automated workflows.

By combining a modern web application, secure cloud database infrastructure, and workflow automation capabilities, the project aims to improve operational visibility, data management, and industrial process efficiency.

## Key Features

### 📊 Operational Dashboard
- Centralized industrial operations dashboard.
- Organized workspace navigation.
- Responsive desktop and mobile interface.
- Light and dark theme support.

### 🏭 Asset & Tank Management
- Centralized asset registry.
- Tank and asset information management.
- Asset details and operational visibility.
- Foundation for future live telemetry integration.

### 📦 Logistics & Inventory Operations
- Delivery workflow management.
- Delivery status tracking.
- Organized logistics operations.
- Inventory management architecture.

### 🚨 Alerts & Incident Management
- Centralized operational alerts.
- Alert acknowledgement and resolution workflows.
- Incident tracking and management.
- Role-based administrative controls.

### 📈 Reports & Analytics
- Operational reporting interface.
- Structured report views.
- CSV export functionality.
- Foundation for future automated reporting.

### ⚙️ Workflow Automation with n8n
The project incorporates n8n into its automation architecture to support workflow orchestration and external service integrations.

Potential automation workflows include:

- Industrial alert and notification workflows.
- Tank threshold event processing.
- Device and gateway status notifications.
- Scheduled operational reporting.
- Webhook-based integrations.
- Automated incident notification and escalation workflows.

*Production automation workflows depend on the deployment and validation of the corresponding n8n integrations.*

### 🔐 Security & Access Control
- Supabase-backed authentication infrastructure.
- Organization-aware data architecture.
- PostgreSQL database.
- Row Level Security (RLS).
- Role-based access restrictions.
- Protected API routes.

### 🔌 Hardware-Ready IoT Architecture
- Software-first development approach.
- Foundation for virtual IoT device simulation.
- Future sensor and controller integration.
- Potential industrial gateway connectivity.
- Designed to support real-time telemetry workflows.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack web framework |
| React | User interface |
| TypeScript | Type-safe development |
| Tailwind CSS | Responsive styling |
| Supabase | Backend services and authentication |
| PostgreSQL | Relational database |
| n8n | Workflow automation and integrations |
| Vercel | Cloud deployment |
| Git & GitHub | Version control |

---

## System Architecture

The platform is structured around a modular application architecture.

```text
Industrial Tank Monitoring System
│
├── Frontend Application
│   ├── Operational Dashboard
│   ├── Asset Registry
│   ├── Logistics
│   ├── Alerts
│   ├── Incidents
│   └── Reports
│
├── Backend
│   ├── Next.js API Routes
│   ├── Authentication
│   └── Business Logic
│
├── Database Infrastructure
│   ├── Supabase
│   ├── PostgreSQL
│   ├── Row Level Security
│   └── Database Migrations
│
├── Automation Layer
│   └── n8n Workflows
│       ├── Webhook Integrations
│       ├── Notifications
│       └── Automated Processes
│
└── Future IoT Integration
    ├── Virtual Devices
    ├── Physical Sensors
    ├── Industrial Controllers
    └── IoT Gateways
```

*This is a conceptual overview of the architecture, not a claim that every illustrated integration is already deployed.*

---

## Project Structure

```text
industrial-tank-monitoring/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── operations/
│   │   └── (dashboard)/
│   │       ├── assets/
│   │       ├── logistics/
│   │       ├── alerts/
│   │       ├── incidents/
│   │       └── reports/
│   │
│   ├── components/
│   │   └── workspaces/
│   │
│   └── lib/
│       └── database.types.ts
│
├── supabase/
│   └── migrations/
│
├── public/
├── package.json
└── README.md
```

*Simplified project structure.*

---

## Getting Started

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- A Supabase project

### 1. Clone the Repository

```bash
git clone https://github.com/areebamansoor49-eng/industrial-tank-monitoring.git
```

### 2. Navigate to the Project

```bash
cd industrial-tank-monitoring
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholders with your own Supabase project credentials.

**Security Notice:** Never commit `.env.local`, private credentials, access tokens, or secret keys to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 6. Create a Production Build

```bash
npm run build
```

---

## Database & Backend

The application uses Supabase and PostgreSQL for backend data management.

Database migrations are maintained in:

```text
supabase/migrations/
```

The database architecture uses:

- PostgreSQL relational data storage.
- Supabase authentication infrastructure.
- Row Level Security policies.
- Organization-aware data access.
- Role-based administrative permissions.

For a new installation, configure your Supabase project and apply the required database migrations.

---

## n8n Automation

n8n provides a workflow automation layer for connecting application events with external services and operational processes.

The intended integration architecture supports:

1. Receiving application events through webhooks.
2. Processing operational conditions and events.
3. Triggering notification workflows.
4. Connecting external services.
5. Supporting scheduled and event-driven automation.

The n8n instance and workflow credentials should be configured separately. Never publish webhook secrets or private credentials in this repository.

---

## Security & Data Integrity

Security is a fundamental part of the platform.

- Environment-based configuration.
- Supabase Row Level Security.
- Organization-level data access controls.
- Role-based administrative permissions.
- Protected backend API routes.
- Secure handling of application credentials.
- Separation of simulated and physical device data as the system evolves.

---

## Live Deployment

**Production Website:**

https://industrial-tank-monitoring.vercel.app

**GitHub Repository:**

https://github.com/areebamansoor49-eng/industrial-tank-monitoring

**Deployment Platform:** Vercel

---

## Development Roadmap

The platform is being developed with a long-term industrial deployment vision.

- [x] Core application foundation
- [x] Supabase database integration
- [x] Organization-aware security architecture
- [x] Operational dashboard
- [x] Logistics workflow
- [x] Alerts management
- [x] Incident management
- [x] Reports and CSV export
- [x] Production deployment
- [ ] Complete production end-to-end validation
- [ ] Complete live asset and inventory data workflows
- [ ] Validated n8n production automation
- [ ] Virtual IoT device simulation
- [ ] Physical sensor integration
- [ ] Industrial gateway and controller integration
- [ ] Advanced telemetry and monitoring workflows

---

## Project Vision

The vision is to build a scalable industrial monitoring and inventory control platform capable of supporting real-world industrial environments.

By combining secure cloud infrastructure, modern application development, workflow automation, and future IoT connectivity, the platform aims to provide a unified solution for industrial monitoring, inventory visibility, operational alerts, and process automation.

---

## Author

**Areeba Mansoor**

Web Designer & Developer | Software Developer

GitHub: [@areebamansoor49-eng](https://github.com/areebamansoor49-eng)

---

<p align="center">
  **Industrial Tank Monitoring & Inventory Control System**
  
  *Building smarter, more connected industrial operations.*
</p>
