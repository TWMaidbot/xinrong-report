# XinRong Report System (新榮永續報工系統)

A web-based production reporting system designed for XinRong Manufacturing.

## Status
![Version](https://img.shields.io/badge/version-v1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production-green)

## Features (v1.0.0)

### 🏭 Production & Reporting
- **QR-code Scanner**: Integrated camera scanner for quick machine selection.
- **Machine Persistence**: Automatically remembers the operator's last used machine.
- **Work Types**: Smart filtering of work types based on selected machine.

### 📊 Dashboard & TV Mode
- **Real-time Dashboard**: Visualizes production stats by category (Pallet, Shear, etc.).
- **TV Mode**: Specialized view for factory displays (`?mode=tv`).
  - **No Login Required**: Accessible via direct link.
  - **1080p Optimized**: Larger fonts and high-contrast layout.
  - **Auto-Refresh**: Updates data every 60 seconds.
  - **Date Header**: Displays current date and time.

### 🛡️ Security & Management
- **Role-based Access**: Worker, Manager, and Admin roles.
- **Data Protection**: Firestore security rules prevent unauthorized deletion of reports.
- **Machine Management**: Admin interface to add/edit machines and generate QR codes.

## Setup
1. Clone the repository.
2. Install dependencies: `npm install -g firebase-tools`
3. Deploy: `firebase deploy`

## Tech Stack
- Frontend: Vanilla JS, HTML5, CSS3
- Backend: Firebase (Firestore, Hosting)
