// Public Firebase Web app configuration. Never put server credentials here.
export const firebaseConfig = { apiKey: "AIzaSyBv95Dqk94lC6IDWkmNcdT5_AZGQcNpBeI", authDomain: "schemesathi-6596d.firebaseapp.com", projectId: "schemesathi-6596d", appId: "1:1054228226114:web:00ae818f547b701c2bcddb" };
export function isFirebaseConfigured() { return ["apiKey","authDomain","projectId","appId"].every(key => typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim().length > 0); }
