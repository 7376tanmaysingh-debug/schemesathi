// Public Firebase Web app configuration. Never put server credentials here.
export const firebaseConfig = {
  apiKey: "AIzaSyBv95Dqk94lC6IDWkmNcdT5_AZGQcNpBeI",
  authDomain: "schemesathi-6596d.firebaseapp.com",
  projectId: "schemesathi-6596d",
  storageBucket: "schemesathi-6596d.firebasestorage.app",
  messagingSenderId: "1054228226114",
  appId: "1:1054228226114:web:768ddd584788ea512bcddb",
  measurementId: "G-Q26KQ391F3"
};

export function isFirebaseConfigured() {
  return ["apiKey","authDomain","projectId","appId"].every(
    key => typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim().length > 0
  );
}
