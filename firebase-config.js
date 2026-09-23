// Public Firebase Web app configuration. Never put server credentials here.
export const firebaseConfig = { apiKey: "", authDomain: "", projectId: "", appId: "" };
export function isFirebaseConfigured() { return ["apiKey","authDomain","projectId","appId"].every(key => typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim().length > 0); }
