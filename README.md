# 🎨 Frontend App — Customer Support Chatbot UI

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Analytics-Recharts-22c55e)](https://recharts.org/)
[![Lucide Icons](https://img.shields.io/badge/Icons-Lucide_React-pink)](https://lucide.dev/)

The client-side interface for the Customer Support Chatbot System. Built as a high-fidelity React 19 Single Page Application (SPA), it provides a responsive customer chatbot interface, session logs loader, and a secure admin control dashboard with analytics visualization.

> [!NOTE]
> This is the client-side frontend repository. For the server-side logic (RAG hybrid search, local vector embeddings, text chunking, and Groq SDK resolution), check out the [⚙️ Backend API Repository](https://github.com/Samarth-254/Chatbot-backend).

---

## 🎨 Screenshots & Interface Preview

<p align="center">
  <h3>💬 Customer Support Chatbot</h3>
  <img src="assets/chatbot3.png" alt="Customer Chatbot Interface" width="90%" style="border-radius: 8px; border: 1px solid #333; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
</p>

<br />

<p align="center">
  <h3>📊 Admin Control Panel (Overview)</h3>
  <img src="assets/chatbot1.png" alt="Admin Dashboard Analytics" width="90%" style="border-radius: 8px; border: 1px solid #333; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
</p>

<br />

<p align="center">
  <h3>📂 Knowledge Base & File Ingestion</h3>
  <img src="assets/Chatbot2.png" alt="Admin Knowledge Base Manager" width="90%" style="border-radius: 8px; border: 1px solid #333; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
</p>

---

## ✨ Key Features

### 💬 Customer Chatbot
* **Zero-Friction Access:** Public chatbot route available to guest users without login.
* **Suggested Queries:** Clickable suggestion chips to answer common support inquiries quickly.
* **History Sync:** Optional user sign-up/login to save, persist, and load chat session history.
* **Smart Session Management:** Keeps track of multiple chat sessions for registered users.
* **Typing Indicator & Chat Timelines:** Includes pulsing indicators and date separators for polished UX.

### 🛡️ Admin Control Panel
* **Real-time Metrics:** High-level overview of active users, ingested document count, chatbot queries, and logs frequency.
* **Analytics Visualizations:** Interactive usage graphs (Interaction Traffic, Answer Source Breakdown) built with Recharts.
* **Document Knowledge Hub:** Drag-and-drop document bulk uploader supporting `.pdf`, `.docx`, `.doc`, `.xls`, and `.xlsx`.
* **Custom Q&A Database:** Full CRUD manager to enforce strict prompt-answer overrides.
* **Conversation Audits:** Live audit list of customer queries and bot responses.
* **Admin-Exclusive Shortcuts:** Links in the sidebar to test the "Live Chatbot" (opens in a new tab with a routing bypass parameter) and links in the chatbot header to return to the admin panel.

---

## 🛣️ Routing Structure

Client-side routes managed via React Router DOM:

| Path | Access | Description |
| :--- | :--- | :--- |
| `/` | Public (Root) | Customer support chatbot (redirects logged-in admins to `/dashboard` unless `?preview=true` query is passed) |
| `/login` | Guest Only | Customer login and account registration portal |
| `/admin-login` | Guest Only | Administrator authentication gateway |
| `/dashboard` | Admin Only | Protected administrative analytics dashboard |
| `*` | Catch-all | Fallback route redirecting back to `/` |

---

## 📂 Codebase Structure

```txt
frontend/
├── public/                 # Favicons and static SVGs
├── src/
│   ├── components/
│   │   └── Sidebar.jsx     # Chatbot history and suggestions sidebar menu
│   ├── pages/
│   │   ├── Chatbot.jsx     # Conversational support chatbot page
│   │   ├── Dashboard.jsx   # Admin control panel page (Overview, Docs, QA, Logs)
│   │   └── Login.jsx       # Universal auth page (Customer login/register, Admin login)
│   ├── api.js              # Centralized Axios connection and local storage storage helpers
│   ├── App.css             # Main styling overrides
│   ├── App.jsx             # React routing configurations and route guards
│   ├── index.css           # Global custom classes (animations, custom scrollbars)
│   └── main.jsx            # React root application mount
│
├── tailwind.config.js      # Tailwind customization config
├── vite.config.js          # Vite building config
└── vercel.json             # Vercel deployment rewrite rules
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Navigate to the frontend directory and install npm packages:
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `frontend/` root folder:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
Start the local Vite development server (with hot-module reloading):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
Create an optimized production bundle:
```bash
npm run build
```
This builds static assets into the `dist/` directory.

---

