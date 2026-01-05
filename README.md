# Gyan Niketan Admin Panel - Security Assessment Toolkit

**Author**: Suryanshu Nabheet
**Date**: 2026-01-05
**Target**: Gyan Niketan Admin Panel (Firebase)

---

## 🚨 Overview

This toolkit performs an automated security audit of the Gyan Niketan Admin Panel. It tests the resilience of the application against common Firebase misconfigurations, specifically focusing on **Broken Access Control** and **Privilege Escalation**.

## 🛠 Usage

You can run this tool using either **TypeScript** or **JavaScript**.

### Prerequisites

- Node.js (v14 or higher)
- NPM

### Installation

```bash
npm install
```

### Running the Audit

**Option 1: TypeScript (Recommended)**

```bash
npm run start:ts
```

**Option 2: JavaScript (Standard)**

```bash
npm start
```

---

## 🔬 What does this tool do?

The script executes a **3-Stage Attack Vector** to determine if an unauthorized user can gain administrative access.

### Step 1: Open Registration Check

- **The Test**: Creates a new Firebase Authentication account using a generated email.
- **The Logic**: If the system allows anyone to register via the generic API (`createUserWithEmailAndPassword`), it has "Open Registration". This is often the first step in a breach.
- **Expected Result**: Success (User Created) or Failure (Operation Not Allowed).

### Step 2: Privilege Escalation (Mass Assignment)

- **The Test**: Uses the newly created user's credentials to write to the `users` collection.
- **The Payload**:
  ```json
  {
    "role": "admin",
    "isAdmin": true,
    "permissions": { "all": true }
  }
  ```
- **The Logic**: Many developers assume that if a user is authenticated, they can update their own profile. However, if they don't explicitly block sensitive fields (like `isAdmin`), a user can "promote" themselves. This is known as **Mass Assignment**.
- **Expected Result**:
  - **Vulnerable**: The write succeeds.
  - **Secure**: Returns `PERMISSION_DENIED` (Firebase Security Rules blocked the write).

### Step 3: Admin Action Verification

- **The Test**: Attempts to write a document to a protected collection (`notices`) that typically only admins can edit.
- **The Logic**: This confirms if the privileges claimed in Step 2 are actually respected by the backend.
- **Expected Result**:
  - **CRITICAL VULNERABILITY**: The notice is posted. The site is compromised.
  - **SECURE**: Returns `PERMISSION_DENIED`. The rules are correctly enforcing roles.

---

## 🛡️ Remediation Strategy (For Developers)

If the tool reports a **SUCCESS** or **VULNERABILITY** at any stage, apply the following fixes:

### 1. Fix Open Registration

Disable the "Email/Password" provider in the Firebase Console if this is an internal admin tool. Only allow accounts to be created by existing admins via the Firebase Admin SDK.

### 2. Secure the `users` Collection

Prevent users from editing their own roles.
**Insecure Rule:**

```javascript
allow write: if request.auth.uid == userId;
```

**Secure Rule:**

```javascript
// Allow users to update only safe fields (name, email)
// Block 'role' or 'isAdmin' fields
allow update: if request.auth.uid == userId
              && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isAdmin', 'permissions']));
```

### 3. Enforce Role Checks on Data

Ensure every write to `notices`, `news`, etc., checks the user's role in the database.

```javascript
function isAdmin() {
  return get( /databases/$(database)/documents/users/$(request.auth.uid) ).data.role == 'admin';
}

match /notices/{noticeId} {
  allow write: if isAdmin();
}
```

---

## 📊 Understanding the Output

- **`[SUCCESS]`**: The operation worked. If this appears during the Attack phase, it implies a **vulnerability**.
- **`[FAILED] PERMISSION_DENIED`**: The operation was blocked by the server. This implies the system is **secure** against that specific attack.

---

**Disclaimer**: This tool is for educational and authorized testing purposes only.
