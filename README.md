# Plainview LeanKit Clone

A full-stack Kanban board application inspired by LeanKit, built with **React**, **Node.js**, **Express**, **Prisma**, and **SQLite**.

## 🚀 QUICK START

Follow these **exact** steps to run the application locally.

### Prerequisites
- Node.js (v14 or higher)
- npm

### Step 1: Start Backend (Terminal 1)
Open a terminal, navigate to the project root, and run:

```bash
cd server
npm install
npm run db:setup
npm run dev
```

**Expected Output:**
- Prisma generates client and seeds data.
- Server starts on port 3000.
- `Server running on port 3000`

### Step 2: Start Frontend (Terminal 2)
Open a **new** terminal, navigate to the project root, and run:

```bash
npm install
npm run dev
```

**Expected Output:**
- Vite development server starts.
- `Local: http://localhost:5173/`

### Step 3: Open Application
Open your browser and go to:
👉 **[http://localhost:5173](http://localhost:5173)**

### Login Credentials
- **Email:** `admin@plainview.com`
- **Password:** `password123`

---

## Troubleshooting

**"localhost refused to connect"**
- Ensure the backend is running in Terminal 1 (`Server running on port 3000`).
- Ensure the frontend is running in Terminal 2 (`Local: http://localhost:5173/`).
- Check if port 3000 or 5173 is already in use by another application.

**Database Errors**
- If you see database errors, stop the backend and run `npm run db:setup` inside the `server` directory again to reset the database.

## Features
- **Kanban Board**: Drag and drop cards, column limits, filtering.
- **Client Cards**: Rich details, planned dates, priority, comments.
- **User Management**: Admin panel to create/edit users.
- **Export**: Download board data to Excel.
