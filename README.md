# ⬡ Nexus — Centralized Institutional Management System

<div align="center">

![Nexus System](https://img.shields.io/badge/Nexus-Centralized%20System-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsOSA1IDktNVYxMmwtOSA1LTktNXoiLz48L3N2Zz4=)
![Python](https://img.shields.io/badge/Python-Flask-3776AB?style=for-the-badge&logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript)

**A centralized, role-based system for managing Meetings, Events, Policies & Announcements**

[Features](#features) • [Tech Stack](#tech-stack) • [Setup](#setup) • [Usage](#usage) • [API](#api-endpoints)

</div>

---

## 📋 Problem Statement

Meetings, conferences, and institutional events are critical for decision-making and policy implementation. However, record-keeping is often carried out manually or in unorganized formats — scattered files, emails, or paper-based documentation. This results in:

- Inconsistent documentation of Minutes of Meetings
- Limited access to event content (speeches, presentations, discussions)
- Challenges in retrieving past records for audits or references
- Policies stored in different repositories without proper version control
- Reduced institutional memory and transparency

**Nexus** solves all of this with a centralized, role-based, cloud-backed record-keeping platform.

---

## ✨ Features

### 🏛️ Core Modules
| Module | Description |
|--------|-------------|
| **Meetings** | Schedule, manage, and archive all institutional meetings with full MoM support |
| **Events** | Track conferences, seminars, and institutional events with speaker management |
| **Policies** | Maintain a versioned policy repository with category-wise organization |
| **Announcements** | Broadcast institutional announcements with priority levels |
| **Dashboard** | Role-aware analytics and quick access panel |

### 🔒 Role-Based Access Control (RBAC)

| Permission | 👑 Admin | 🔧 Manager | 👤 User |
|-----------|----------|------------|---------|
| View all records | ✅ | ✅ | ✅ |
| Create / Edit Meetings | ✅ | ✅ | ❌ |
| Create / Edit Events | ✅ | ✅ | ❌ |
| Create / Edit Policies | ✅ | ❌ | ❌ |
| Create Announcements | ✅ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ❌ |
| Analytics Dashboard | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

### 📄 PDF Report Export
- One-click printable reports for Meetings, Events, and Policies
- Professional Nexus-branded report layout with timestamps
- Auto-triggers browser print dialog (save as PDF)

### 📎 File Attachments
- Upload presentations, MoM documents, images to meetings/events
- Supports: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG, MP4
- 50MB file size limit per upload
- Stored server-side, accessible via download link

### 🔢 Policy Version Control
- Every edit automatically increments version (v1.0 → v1.1 → v1.2)
- Full version history stored with timestamp and approver
- View complete audit trail for any policy document

### ✅ Action Items Tracking
- Add structured action items directly inside meeting records
- Track: Task description, Assignee, Due Date, Status (Pending / In Progress / Done)
- Action items included in generated Minutes of Meeting PDF

---

## 🛠️ Tech Stack

```
Frontend         Backend          Database         Auth
─────────────    ─────────────    ─────────────    ─────────────
HTML5            Python 3.x       MongoDB Atlas    JWT Tokens
CSS3 (Vanilla)   Flask            pymongo          bcrypt hashing
JavaScript ES6+  Flask-CORS       BSON ObjectId    Role-Based
Font Awesome     Werkzeug                          Permissions
```

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.8+ installed
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/deepakkumar7388/Centralize-System.git
cd Centralize-System
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment
Create `backend/.env` file:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nexus_db
SECRET_KEY=your_jwt_secret_key_here
```

### 4. Start Backend Server
```bash
cd backend
python app.py
```
Server runs at: `http://127.0.0.1:5000`

### 5. Open Frontend
```
Open: frontend/index.html in a browser
OR serve via XAMPP/Live Server
```

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| User | `user` | `user123` |

> ⚠️ **Important:** Change these credentials after first login in production.

---

## 📁 Project Structure

```
nexus-system/
├── backend/
│   ├── app.py              # Flask API server (all routes)
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Environment variables (not committed)
│   └── uploads/            # Uploaded files storage
│
├── frontend/
│   ├── index.html          # Single Page Application shell
│   ├── css/
│   │   └── styles.css      # Global styles & design system
│   └── js/
│       ├── app.js          # SPA router & navigation
│       ├── auth.js         # Authentication & JWT management
│       ├── api.js          # API service layer (fetch calls)
│       ├── permissions.js  # Role-based permissions engine
│       ├── dashboard.js    # Dashboard module
│       ├── meetings.js     # Meetings CRUD + Action Items
│       ├── events.js       # Events CRUD + Attachments
│       ├── policies.js     # Policies CRUD + Version Control
│       ├── announcements.js# Announcements CRUD
│       ├── store.js        # Local state management
│       └── utils.js        # Utilities (print, upload, format)
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login          Login with username/password
POST   /api/auth/reset-password Reset password
```

### Meetings
```
GET    /api/meetings            Get all meetings
POST   /api/meetings            Create meeting (with action items)
PUT    /api/meetings/<id>       Update meeting
DELETE /api/meetings/<id>       Delete meeting
```

### Events
```
GET    /api/events              Get all events
POST   /api/events              Create event (with attachments)
PUT    /api/events/<id>         Update event
DELETE /api/events/<id>         Delete event
```

### Policies
```
GET    /api/policies            Get all policies
POST   /api/policies            Create policy
PUT    /api/policies/<id>       Update policy (auto version bump)
DELETE /api/policies/<id>       Delete policy
```

### Announcements
```
GET    /api/announcements       Get all announcements
POST   /api/announcements       Create announcement
PUT    /api/announcements/<id>  Update announcement
DELETE /api/announcements/<id>  Delete announcement
```

### File Upload
```
POST   /api/upload              Upload file (multipart/form-data)
GET    /api/uploads/<filename>  Download/serve a file
```

---

## 🖥️ Screenshots

> Login with different roles to see the role-based UI in action.

- **Admin View:** Full access — create, edit, delete, export reports, view analytics
- **Manager View:** Can manage meetings & events, view policies, export reports
- **User View:** Read-only access with navigation-focused quick actions

---

## 📦 Python Dependencies

```txt
Flask==3.1.1
Flask-Cors==5.0.1
pymongo==4.13.2
python-dotenv==1.1.0
PyJWT==2.10.1
bcrypt==4.3.0
Werkzeug==3.1.3
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📄 License

This project is open-source. Feel free to use and modify.

---

<div align="center">
Made with ❤️ using Flask + Vanilla JS + MongoDB Atlas
</div>
