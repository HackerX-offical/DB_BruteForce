# Firebase Penetration Testing Suite

This repository contains a custom security assessment tool designed to audit Firebase/Firestore configurations for common vulnerabilities.

## 🛠 Features

The `Firebase/index.ts` script performs the following automated checks:

1.  **Authentication Audits**:

    - Checks if **Anonymous Authentication** is enabled.
    - Checks if **Open User Registration** (Email/Password) is enabled.
    - **Brute Force Simulation**: Tests resilience against password guessing attacks on admin accounts (includes Rate Limit detection).

2.  **Data Access (IDOR / Broken Access Control)**:

    - Scans 25+ common sensitive collections (e.g., `users`, `payments`, `admins`) for public Read access.
    - Checks for Global Write access (Publicly writable database).

3.  **Privilege Escalation**:
    - **Mass Assignment Check**: Attempts to inject `role: 'admin'` and other privilege flags into user profiles.
    - **Direct Collection Write**: Attempts to add unauthorized users to the `admins` collection.

## 🚀 How to Run

### Prerequisites

- Node.js installed
- `npm install` (to install firebase, typescript, ts-node)

### Execute Pentest

Run the suite using the npm script:

```bash
npm run pentest
```

Or manually:

```bash
npx ts-node Firebase/index.ts
```

## 📊 Interpreting Results

- `[vuln]` **(Green)**: A vulnerability was successfully exploited (e.g., created a user, read a private file). **Action Required.**
- `[SECURE]` **(Red)**: The attack was blocked by the server. **Good.**
- `.` **(Dots)**: Represents a "Permission Denied" result for a specific collection scan.

## ⚠️ Disclaimer

This tool is for educational and authorized testing purposes only. Use this only on systems you own or have explicit permission to audit.
