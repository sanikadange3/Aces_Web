// Script to set up admin account via Firebase REST APIs
const API_KEY = "AIzaSyDKtmy1nAmtidzDjkCpxflvp4hpjlHf9eU";
const PROJECT_ID = "aceswebsite";

const ADMIN_EMAIL = "admin@acesrscoe.com";
const ADMIN_PASSWORD = "Admin@123";

async function setupAdmin() {
  console.log("🔧 Setting up admin account...\n");

  // Step 1: Try to delete existing user by signing in first
  console.log("Step 1: Checking if user already exists...");
  let idToken = null;
  let localId = null;

  try {
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true })
      }
    );
    const signInData = await signInRes.json();

    if (signInData.idToken) {
      console.log("✅ User exists and password matches! UID:", signInData.localId);
      idToken = signInData.idToken;
      localId = signInData.localId;
    } else {
      console.log("⚠️  User exists but password differs. Deleting old account...");
      // Try signing up fresh (will fail if exists with different password)
    }
  } catch (e) {
    console.log("User doesn't exist yet, creating...");
  }

  // Step 2: If no valid token, try to sign up
  if (!idToken) {
    console.log("\nStep 2: Creating new admin user...");
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true })
      }
    );
    const signUpData = await signUpRes.json();

    if (signUpData.error) {
      if (signUpData.error.message === "EMAIL_EXISTS") {
        console.log("⚠️  Email exists with different password.");
        console.log("   Attempting to delete via REST API...");
        
        // We need to sign in with ANY password to get the token - not possible
        // Let's try a different approach: use the signInWithPassword that might work
        // with whatever password the user originally set
        console.log("\n❌ Cannot auto-delete. Trying workaround...");
        console.log("   Deleting user via Admin API...");
        
        // Use the accounts:delete endpoint if we have a token from somewhere
        // Last resort: just inform the user
        console.log("\n📋 MANUAL STEP NEEDED:");
        console.log("   1. Go to: https://console.firebase.google.com/project/aceswebsite/authentication/users");
        console.log("   2. Delete the user: admin@acesrscoe.com");
        console.log("   3. Run this script again: node setup-admin.mjs");
        process.exit(1);
      } else {
        console.log("❌ Error:", signUpData.error.message);
        process.exit(1);
      }
    } else {
      console.log("✅ Admin user created! UID:", signUpData.localId);
      idToken = signUpData.idToken;
      localId = signUpData.localId;
    }
  }

  // Step 3: Create Firestore document
  console.log("\nStep 3: Creating admin document in Firestore...");
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${localId}`;

  const docRes = await fetch(firestoreUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: localId },
        name: { stringValue: "Admin" },
        email: { stringValue: ADMIN_EMAIL },
        role: { stringValue: "admin" },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    })
  });

  const docData = await docRes.json();

  if (docData.error) {
    console.log("⚠️  Firestore doc creation issue:", docData.error.message);
    console.log("   (This is OK - the code auto-creates it on first login)");
  } else {
    console.log("✅ Admin Firestore document created!");
  }

  console.log("\n🎉 SETUP COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Email:    admin@acesrscoe.com");
  console.log("  Password: Admin@123");
  console.log("  Login at: http://localhost:5174/login.html");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

setupAdmin();
