# VYBERA — Streetwear E-Commerce Platform

A premium, custom-built e-commerce platform for the VYBERA streetwear brand. Features a sleek dark-mode UI, robust product filtering, Razorpay checkout, and an integrated Admin Dashboard.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **Backend (API)**: Express.js + Razorpay SDK (Serverless ready)
- **Database / Auth**: Firebase (Firestore, Authentication, Storage)

## Running Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the Frontend** (Terminal 1)
   ```bash
   npm run dev
   ```

3. **Start the Local API Server** (Terminal 2)
   ```bash
   node server.js
   ```

## Deployment (Render & Vercel)
- Frontend deploys seamlessly to Vercel.
- Backend (`server.js`) is configured to deploy to Render as a Web Service. Ensure `FRONTEND_URL` and `RAZORPAY` keys are set in Render environment variables.
