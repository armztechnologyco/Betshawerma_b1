# Betshawerma POS & Management System

Welcome to the **Betshawerma** Point of Sale (POS) and Restaurant Management System. This is a comprehensive full-stack application built to streamline operations for a Shawerma restaurant, covering everything from cashier operations to kitchen displays, accounting, and admin management.

## 🚀 Features

### 🛒 Cashier Dashboard (`/cashier`)
- Dedicated interface for cashiers to take orders seamlessly.
- Real-time updates and order management.

### 🍳 Kitchen Display System (KDS) (`/kitchen`)
- Live feed of incoming orders for the kitchen staff.
- Order status tracking (Pending -> Preparing -> Completed).

### 📊 Accounting Dashboard (`/accounting`)
- Financial tracking including income and expenses.
- Salary and employee management.
- Monthly and daily financial summaries.

### ⚙️ Admin Dashboard (`/admin`)
- Centralized hub for system management.
- Menu management functionality to add, edit, or remove items.
- Employee management and dashboard statistics overview.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js (v18)
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS & PostCSS
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Date Formatting:** date-fns

### Backend & API
- **Framework:** Node.js with Express.js
- **Serverless:** Firebase Cloud Functions
- **Database:** Firebase Firestore & Realtime Database
- **Authentication:** Firebase Auth
- **AI Integration:** Google Genkit SDK

## 📁 Project Structure

This project is organized as a monorepo:
- `/frontend`: The React application containing all the user interfaces (Cashier, Kitchen, Admin, Accounting).
- `/functions`: The Node.js and Express backend API, deployed as Firebase Functions. Contains REST endpoints for Orders, Transactions, Employees, and Financials.
- `/backend` & `/dataconnect`: Database connection configurations and auto-generated data files.

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v24 recommended for functions)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### Running the Frontend Locally
```bash
cd frontend
npm install
npm start
```
The frontend application will be available at `http://localhost:3000`.

### Running the Backend (Firebase Emulators)
```bash
cd functions
npm install
npm run serve
```
This will build the backend code and start the Firebase local emulator suite for Functions and Firestore.

## 🔐 Authentication & Roles
The application uses role-based access control (RBAC) to ensure security and proper separation of concerns:
- `cashier`: Access to POS and order taking.
- `chef`: Access to the Kitchen Display System.
- `admin`: Full access to the system, including accounting and menu management.
- `accounting`: Access to financial dashboards and reporting.

Users are routed to their respective dashboards immediately upon login.

## 📜 License
This project is licensed under the ISC License.
