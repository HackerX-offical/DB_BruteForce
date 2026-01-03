import * as admin from "firebase-admin";

// ============================================================================
// CRITICAL: You MUST replace 'serviceAccountKey.json' with your REAL key file!
// Download it from: Firebase Console > Project Settings > Service Accounts
// ============================================================================
let serviceAccount;
try {
  serviceAccount = require("./serviceAccountKey.json");
} catch (e) {
  console.error("\n[ERROR] 'serviceAccountKey.json' is missing or invalid.");
  console.error(
    "Please download it from Firebase Console -> Project Settings -> Service Accounts."
  );
  console.error("Save it in the 'Firebase' folder.\n");
  process.exit(1);
}

// Initialize the "God Mode" SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function createSuperAdmin() {
  const email = "super_admin@gyanniketan.com";
  const password = "SuperSecretPassword123!"; // Strong password for your new admin

  console.log(`\n--- Creating Super Admin Account ---`);
  console.log(`Target Email: ${email}`);

  let uid;
  try {
    // 1. Create or Get User in Auth
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log(`[INFO] User exists (UID: ${uid}). Updating password...`);
      await auth.updateUser(uid, { password });
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        const userRecord = await auth.createUser({ email, password });
        uid = userRecord.uid;
        console.log(`[SUCCESS] New user created (UID: ${uid}).`);
      } else {
        throw e;
      }
    }

    // 2. Set Admin Privileges (Custom Claims - The "Real" Server-Side Admin Flag)
    // This is what Security Rules like "request.auth.token.admin == true" look for.
    await auth.setCustomUserClaims(uid, { admin: true, role: "admin" });
    console.log("[SUCCESS] Custom Claims set: { admin: true }");

    // 3. Update Firestore Records (for frontend access logic)
    // We write to both 'users' and 'admins' to cover all bases given the pentest findings.
    const adminData = {
      email,
      role: "admin",
      isAdmin: true,
      type: "super_admin",
      createdAt: new Date(),
      permissions: {
        gallery: true,
        results: true,
        faculty: true,
        news: true,
        notices: true, // "Do anything"
        student_management: true,
        settings: true,
      },
    };

    console.log("[INFO] Writing admin privileges to database...");
    await db.collection("users").doc(uid).set(adminData, { merge: true });
    await db.collection("admins").doc(uid).set(adminData, { merge: true }); // Just in case

    console.log("[SUCCESS] Database records updated.");

    // 4. Verification Test (Prove we can do anything)
    console.log("\n--- Verifying 'God Mode' Access ---");
    const testCollections = ["notices", "gallery", "news", "faculty"];

    for (const col of testCollections) {
      const docRef = await db.collection(col).add({
        title: "Admin Access Verification",
        body: `This record proves we can write to '${col}'.`,
        timestamp: new Date(),
        createdBy: "Super Admin Script",
      });
      console.log(`[TEST] Successfully wrote to '${col}' (ID: ${docRef.id})`);

      // Clean up
      await docRef.delete();
    }
    console.log("[TEST] Cleanup complete.");

    console.log(`\n==================================================`);
    console.log(` DONE! You have a fully privileged Admin Account.`);
    console.log(` Email:    ${email}`);
    console.log(` Password: ${password}`);
    console.log(`==================================================\n`);
  } catch (e) {
    console.error("Error creating admin:", e);
  }
}

createSuperAdmin();
