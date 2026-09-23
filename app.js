import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth,onAuthStateChanged,setPersistence,browserLocalPersistence,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signInWithPhoneNumber,RecaptchaVerifier,reload,signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { firebaseConfig,isFirebaseConfigured } from "./firebase-config.js";

(() => {
  "use strict";

  let schemes = [];
  const categoryNames = {
    all:"All topics",
    health:"Health",
    farmers:"For farmers",
    women:"Women & family",
    housing:"Home & energy",
    business:"Work & business",
    education:"Education & scholarships"
  };
  const state = {
    category:"all",
    topics:null,
    view:"all",
    query:"",
    sort:"featured",
    saved:new Set(),
    user:null
  };
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const grid=$("#scheme-grid");
  const search=$("#search");
  const dialog=$("#detail-dialog");
  const privacyDialog=$("#privacy-dialog");
  let toastTimer;

  function savedStorageKey(uid) { return "schemesaathi-saved:"+uid; }

  function loadSaved(uid) {
    try {
      const items=JSON.parse(localStorage.getItem(savedStorageKey(uid)) || "[]");
      return new Set(Array.isArray(items) ? items.filter(item=>typeof item==="string") : []);
    } catch { return new Set(); }
  }

  function saveState() {
    if(!state.user) return;
    try { localStorage.setItem(savedStorageKey(state.user.uid),JSON.stringify([...state.saved])); }
    catch { showToast("Your browser could not save this change."); }
  }

  function element(tag, className, text) {
    const node=document.createElement(tag);
    if(className) node.className=className;
    if(text!==undefined) node.textContent=text;
    return node;
  }

  function makeButton(text, action, id, className) {
    const button=element("button",className,text);
    button.type="button";
    button.dataset.action=action;
    if(id) button.dataset.id=id;
    return button;
  }

  function createCard(scheme) {
    const card=element("article","scheme-card");
    const top=element("div","card-top");
    top.append(element("span","scheme-icon",scheme.icon));
    top.lastChild.setAttribute("aria-hidden","true");
    top.append(element("span","category-label",scheme.categoryLabel));
    const save=makeButton(state.saved.has(scheme.id)?"♥":"♡","save",scheme.id,"save-button"+(state.saved.has(scheme.id)?" saved":""));
    save.setAttribute("aria-label",state.saved.has(scheme.id)?"Remove "+scheme.name+" from saved schemes":"Save "+scheme.name);
    save.setAttribute("aria-pressed",String(state.saved.has(scheme.id)));
    top.append(save);
    card.append(top);
    card.append(element("h3","",scheme.name));
    card.append(element("p","card-summary",scheme.summary));
    const bottom=element("div","card-bottom");
    bottom.append(element("span","benefit",scheme.audience));
    bottom.append(makeButton("View details ↗","details",scheme.id,"learn-button"));
    card.append(bottom);
    return card;
  }

  function visibleSchemes() {
    const query=state.query.toLocaleLowerCase().trim();
    let result=schemes.filter(scheme=>{
      if(state.view==="saved" && !state.saved.has(scheme.id)) return false;
      if(state.category!=="all" && scheme.category!==state.category) return false;
      if(state.topics && !state.topics.includes(scheme.category)) return false;
      if(query && ![scheme.name,scheme.summary,scheme.categoryLabel,scheme.audience,scheme.overview].join(" ").toLocaleLowerCase().includes(query)) return false;
      return true;
    });
    if(state.sort==="az") result.sort((a,b)=>a.name.localeCompare(b.name));
    else result.sort((a,b)=>a.featured-b.featured);
    return result;
  }

  function render() {
    const result=visibleSchemes();
    const count=result.length;
    grid.replaceChildren(...result.map(createCard));
    $("#saved-count").textContent=state.saved.size;
    $("#all-count")?.replaceChildren();
    $$("[data-category-count]").forEach(node=>{
      const category=node.dataset.categoryCount;
      node.textContent=category==="all"?String(schemes.length):String(schemes.filter(s=>s.category===category).length);
    });
    $("#scheme-count") && ($("#scheme-count").textContent=String(schemes.length));
    const searchIsActive=Boolean(state.query);
    let label=state.view==="saved"?"Your saved schemes":
      state.topics&&!searchIsActive?"Your shortlist · "+state.topics.map(topic=>categoryNames[topic]).join(", "):
      searchIsActive?count+" result"+(count===1?"":"s")+" for “"+search.value.trim()+"”":
      state.category==="all"?"Popular starting points":categoryNames[state.category];
    $("#results-label").textContent=label;
    $("#clear-filters").hidden=!(state.view==="saved"||state.category!=="all"||state.topics||searchIsActive);
    $("#search-clear").hidden=!search.value;
    $("#empty-state").hidden=count>0;
    $("#scheme-grid").hidden=count===0;
    $("#empty-title").textContent=state.view==="saved"?"No saved schemes yet":"No schemes found";
    $("#empty-copy").textContent=state.view==="saved"?"Save a scheme from the directory and it will appear here.":"Try another search or clear your filters.";
    $("#empty-clear").textContent=state.view==="saved"?"Browse schemes":"Show all schemes";
    $$(".filter-chip").forEach(button=>button.classList.toggle("active",state.view!=="saved"&&!state.topics&&button.dataset.category===state.category));
    $("#saved-shortcut").setAttribute("aria-current",state.view==="saved"?"page":"false");
  }

  function resetFinder() {
    state.topics=null;
    $$('input[name="support"]').forEach(input=>input.checked=false);
    $("#finder-status").hidden=true;
  }

  function clearFilters() {
    state.category="all";
    state.topics=null;
    state.view="all";
    state.query="";
    search.value="";
    resetFinder();
    render();
  }

  function showToast(message) {
    const toast=$("#toast");
    toast.textContent=message;
    toast.hidden=false;
    window.clearTimeout(toastTimer);
    toastTimer=window.setTimeout(()=>{toast.hidden=true;},2600);
  }

  function openScheme(id, updateHash=true) {
    const scheme=schemes.find(item=>item.id===id);
    if(!scheme) return;
    const content=$("#dialog-content");
    content.replaceChildren();
    content.append(element("span","dialog-category",scheme.categoryLabel));
    const title=element("h2","",scheme.name);
    title.id="dialog-title";
    content.append(title);
    content.append(element("p","dialog-summary",scheme.summary));
    const audience=element("section","dialog-section");
    audience.append(element("h3","","Who may find this relevant"));
    audience.append(element("p","",scheme.audience));
    content.append(audience);
    const overview=element("section","dialog-section");
    overview.append(element("h3","","The basics"));
    overview.append(element("p","",scheme.overview));
    content.append(overview);
    const next=element("section","dialog-section");
    next.append(element("h3","","A useful next step"));
    next.append(element("p","",scheme.nextStep));
    content.append(next);
    const actions=element("div","dialog-actions");
    const official=element("a","button button-dark","Open official source ↗");
    official.href=scheme.officialUrl;
    official.target="_blank";
    official.rel="noopener noreferrer";
    official.setAttribute("aria-label","Open the official "+scheme.officialLabel+" website in a new tab");
    actions.append(official);
    const save=makeButton(state.saved.has(id)?"♥ Saved":"♡ Save scheme","dialog-save",id,"learn-button dialog-save-button");
    actions.append(save);
    content.append(actions);
    content.append(element("p","disclaimer","SchemeSaathi is an independent guide. This summary is not an eligibility decision. Check the latest rules and application dates with the official source."));
    if(!dialog.open) dialog.showModal();
    if(updateHash) history.replaceState(null,"","#scheme/"+encodeURIComponent(id));
  }

  function closeScheme() {
    if(dialog.open) dialog.close();
    if(location.hash.startsWith("#scheme/")) history.replaceState(null,"",state.view==="saved"?"#saved":"#schemes");
  }

  function setView(view, scroll=true) {
    state.view=view;
    if(view==="all") {
      state.category="all";
      state.topics=null;
      state.query="";
      search.value="";
      resetFinder();
    } else {
      state.category="all";
      state.topics=null;
      state.query="";
      search.value="";
      resetFinder();
    }
    render();
    if(scroll) $("#schemes").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function handleRoute() {
    const hash=decodeURIComponent(location.hash || "");
    if(hash==="#saved") {
      setView("saved",false);
      return;
    }
    if(hash.startsWith("#scheme/")) {
      openScheme(hash.slice(8),false);
      return;
    }
    if(hash==="#schemes" && state.view==="saved") setView("all",false);
  }

  $("#filters").addEventListener("click",event=>{
    const button=event.target.closest("[data-category]");
    if(!button) return;
    state.view="all";
    state.category=button.dataset.category;
    state.query="";
    search.value="";
    resetFinder();
    render();
  });

  $("#scheme-grid").addEventListener("click",event=>{
    const button=event.target.closest("[data-action]");
    if(!button) return;
    if(button.dataset.action==="details") openScheme(button.dataset.id);
    if(button.dataset.action==="save") toggleSaved(button.dataset.id);
  });

  function toggleSaved(id) {
    if(state.saved.has(id)) state.saved.delete(id); else state.saved.add(id);
    saveState();
    render();
    if(dialog.open) openScheme(id,false);
  }

  $("#dialog-content").addEventListener("click",event=>{
    const button=event.target.closest('[data-action="dialog-save"]');
    if(button) toggleSaved(button.dataset.id);
  });

  $("#finder-form").addEventListener("submit",event=>{
    event.preventDefault();
    const selected=$$('input[name="support"]:checked').map(input=>input.value);
    const status=$("#finder-status");
    if(!selected.length) {
      status.textContent="Choose at least one topic to build your shortlist.";
      status.hidden=false;
      return;
    }
    state.view="all";
    state.category="all";
    state.topics=selected;
    state.query="";
    search.value="";
    render();
    status.textContent="Your shortlist is ready below. These are potential starting points, not an eligibility check.";
    status.hidden=false;
    $("#schemes").scrollIntoView({behavior:"smooth",block:"start"});
  });

  $("#search").addEventListener("input",()=>{
    state.query=search.value;
    state.view="all";
    render();
  });
  $("#search-clear").addEventListener("click",()=>{
    search.value="";
    state.query="";
    search.focus();
    render();
  });
  $("#sort").addEventListener("change",event=>{
    state.sort=event.target.value;
    render();
  });
  $("#clear-filters").addEventListener("click",clearFilters);
  $("#empty-clear").addEventListener("click",()=>{
    if(state.view==="saved") location.hash="#schemes";
    else clearFilters();
  });
  $("#saved-shortcut").addEventListener("click",event=>{
    event.preventDefault();
    state.view="saved";
    state.category="all";
    state.topics=null;
    state.query="";
    search.value="";
    resetFinder();
    render();
    if(location.hash!=="#saved") history.pushState(null,"","#saved");
    $("#schemes").scrollIntoView({behavior:"smooth",block:"start"});
  });
  $("#dialog-close").addEventListener("click",closeScheme);
  dialog.addEventListener("click",event=>{if(event.target===dialog) closeScheme();});
  dialog.addEventListener("close",()=>{
    if(location.hash.startsWith("#scheme/")) history.replaceState(null,"",state.view==="saved"?"#saved":"#schemes");
  });

  $("#privacy-open").addEventListener("click",()=>privacyDialog.showModal());
  $("#privacy-close").addEventListener("click",()=>privacyDialog.close());
  privacyDialog.addEventListener("click",event=>{if(event.target===privacyDialog) privacyDialog.close();});
  $("#clear-saved").addEventListener("click",()=>{
    state.saved.clear();
    saveState();
    render();
    privacyDialog.close();
    showToast("Saved schemes cleared from this browser.");
  });

  $("#menu-toggle").addEventListener("click",event=>{
    const button=event.currentTarget;
    const expanded=button.getAttribute("aria-expanded")==="true";
    button.setAttribute("aria-expanded",String(!expanded));
    button.setAttribute("aria-label",expanded?"Open navigation":"Close navigation");
    $("#site-nav").classList.toggle("open",!expanded);
  });
  $("#site-nav").addEventListener("click",event=>{
    if(event.target.closest("a")) {
      $("#menu-toggle").setAttribute("aria-expanded","false");
      $("#menu-toggle").setAttribute("aria-label","Open navigation");
      $("#site-nav").classList.remove("open");
    }
  });

  document.addEventListener("keydown",event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k") {
      event.preventDefault();
      search.focus();
      $("#schemes").scrollIntoView({behavior:"smooth",block:"start"});
    }
    if(event.key==="Escape" && dialog.open) closeScheme();
  });

  window.addEventListener("hashchange",handleRoute);

  let auth=null, recaptchaVerifier=null, phoneConfirmation=null, emailMode="sign-in", authRevision=0;
  const authScreen=$("#auth-screen"), protectedSite=$("#protected-site"), authSetup=$("#auth-setup-message");
  const configuredUi=$("#auth-configured-ui"), authOptions=$("#auth-options"), verificationPanel=$("#verification-panel");

  function authMessage(message,tone="info") {
    const node=$("#auth-status"); node.textContent=message; node.dataset.state=tone;
  }
  function authError(error) {
    const messages={
      "auth/invalid-email":"Enter a valid email address.",
      "auth/weak-password":"Choose a password with at least 6 characters.",
      "auth/invalid-credential":"That email or password did not match.",
      "auth/email-already-in-use":"An account already uses this email. Sign in or reset your password.",
      "auth/too-many-requests":"Too many attempts. Wait a little, then try again.",
      "auth/operation-not-allowed":"This sign-in method is not enabled in Firebase yet.",
      "auth/unauthorized-domain":"This website domain is not allowed in Firebase settings.",
      "auth/popup-blocked":"Your browser blocked the Google sign-in window.",
      "auth/popup-closed-by-user":"The Google sign-in window was closed before sign-in finished.",
      "auth/invalid-phone-number":"Enter a valid number in international format, such as +91 followed by your number.",
      "auth/invalid-verification-code":"That code is not correct. Check it and try again.",
      "auth/code-expired":"That code expired. Request a new one.",
      "auth/captcha-check-failed":"The security check did not complete. Try again.",
      "auth/network-request-failed":"Check your internet connection and try again."
    };
    return messages[error?.code] || "Sign-in could not be completed. Please try again.";
  }
  function authBusy(value) { $$("#auth-configured-ui button").forEach(button=>button.disabled=value); }
  function showAuthOptions() { authOptions.hidden=false; verificationPanel.hidden=true; authMessage(""); }
  function requireEmailVerification(user) {
    protectedSite.hidden=true; authScreen.hidden=false; authOptions.hidden=true; verificationPanel.hidden=false;
    $("#verification-address").textContent=user.email || "your email address";
    authMessage("Verify your email before continuing.");
  }
  function hideProtected() {
    protectedSite.hidden=true; authScreen.hidden=false; state.user=null; state.saved=new Set();
  }
  function clearRecaptcha() {
    if(recaptchaVerifier) { try { recaptchaVerifier.clear(); } catch {} recaptchaVerifier=null; }
    $("#recaptcha-container").replaceChildren();
  }
  async function admitUser(user,revision) {
    const ids=(user.providerData||[]).map(item=>item.providerId);
    if(ids.includes("password")&&!user.emailVerified&&!ids.some(id=>id==="google.com"||id==="phone")) {
      requireEmailVerification(user); return;
    }
    if(!ids.some(id=>id==="password"||id==="google.com"||id==="phone")) {
      await signOut(auth); showAuthOptions(); authMessage("This account does not use an enabled sign-in method.","error"); return;
    }
    try {
      const catalog=await import("./scheme-data.js");
      if(revision!==authRevision||auth.currentUser?.uid!==user.uid) return;
      schemes=catalog.default; state.user=user; state.saved=loadSaved(user.uid);
      $("#account-label").textContent=user.email||user.phoneNumber||"Signed in";
      authScreen.hidden=true; protectedSite.hidden=false; showAuthOptions(); render(); handleRoute();
    } catch {
      hideProtected(); showAuthOptions(); authMessage("We could not load the site. Refresh the page and try again.","error");
    }
  }
  async function sendPhoneOtp(event) {
    event.preventDefault();
    const phone=$("#phone-number").value.trim().replace(/[\s()-]/g,"");
    if(!/^\+[1-9][0-9]{7,14}$/.test(phone)) { authMessage("Use international format, for example +91 98765 43210.","error"); return; }
    authBusy(true); authMessage("Preparing a secure phone check…");
    try {
      if(!recaptchaVerifier) recaptchaVerifier=new RecaptchaVerifier(auth,$("#recaptcha-container"),{size:"normal"});
      await recaptchaVerifier.render();
      phoneConfirmation=await signInWithPhoneNumber(auth,phone,recaptchaVerifier);
      $("#otp-form").hidden=false; $("#send-phone-code").hidden=true; $("#otp-code").focus();
      authMessage("We sent a code to "+phone+". Enter it below to continue.");
    } catch(error) { clearRecaptcha(); authMessage(authError(error),"error"); }
    finally { authBusy(false); }
  }
  function bindAuth() {
    $$("[data-auth-tab]").forEach(tab=>tab.addEventListener("click",()=>{
      const email=tab.dataset.authTab==="email";
      $$(".auth-tab").forEach(item=>{const active=item===tab;item.classList.toggle("active",active);item.setAttribute("aria-selected",String(active));});
      $("#email-panel").hidden=!email; $("#phone-panel").hidden=email; authMessage("");
    }));
    $("#email-mode-toggle").addEventListener("click",()=>{
      emailMode=emailMode==="sign-in"?"sign-up":"sign-in"; const signup=emailMode==="sign-up";
      $("#email-submit").innerHTML=signup?'Create account <span aria-hidden="true">↗</span>':'Sign in <span aria-hidden="true">↗</span>';
      $("#email-mode-prompt").textContent=signup?"Already have an account?":"New here?";
      $("#email-mode-toggle").textContent=signup?"Sign in":"Create an account";
      $("#forgot-password").hidden=signup; $("#email-password").autocomplete=signup?"new-password":"current-password"; authMessage("");
    });
    $("#email-form").addEventListener("submit",async event=>{
      event.preventDefault(); const email=$("#email-address").value.trim(), password=$("#email-password").value;
      authBusy(true); authMessage(emailMode==="sign-up"?"Creating your account…":"Signing in…");
      try {
        if(emailMode==="sign-up") {
          const result=await createUserWithEmailAndPassword(auth,email,password);
          await sendEmailVerification(result.user); requireEmailVerification(result.user);
          authMessage("We sent a verification link to "+email+". Open it, then return here.");
        } else { await signInWithEmailAndPassword(auth,email,password); }
      } catch(error) { authMessage(authError(error),"error"); }
      finally { authBusy(false); }
    });
    $("#forgot-password").addEventListener("click",async()=>{
      const email=$("#email-address").value.trim();
      if(!email) {authMessage("Enter your email address first.","error");$("#email-address").focus();return;}
      authBusy(true);
      try {await sendPasswordResetEmail(auth,email);authMessage("If an account uses that email, Firebase will send a reset link.");}
      catch(error){authMessage(authError(error),"error");}
      finally{authBusy(false);}
    });
    $("#google-sign-in").addEventListener("click",async()=>{
      authBusy(true); authMessage("Connecting to Google…"); const provider=new GoogleAuthProvider();
      try {
        if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {await signInWithRedirect(auth,provider);return;}
        await signInWithPopup(auth,provider);
      } catch(error) {
        if(error?.code==="auth/popup-blocked") {
          try {await signInWithRedirect(auth,new GoogleAuthProvider());return;}
          catch(redirectError){authMessage(authError(redirectError),"error");}
        } else authMessage(authError(error),"error");
        authBusy(false);
      }
    });
    $("#phone-form").addEventListener("submit",sendPhoneOtp);
    $("#otp-form").addEventListener("submit",async event=>{
      event.preventDefault(); if(!phoneConfirmation){authMessage("Request a code first.","error");return;}
      authBusy(true); authMessage("Verifying your code…");
      try {await phoneConfirmation.confirm($("#otp-code").value.trim());}
      catch(error){authMessage(authError(error),"error");}
      finally{authBusy(false);}
    });
    $("#change-number").addEventListener("click",()=>{
      phoneConfirmation=null; $("#otp-form").reset(); $("#otp-form").hidden=true;
      $("#send-phone-code").hidden=false; $("#otp-code").value=""; clearRecaptcha(); authMessage("");
    });
    $("#check-verification").addEventListener("click",async()=>{
      if(!auth.currentUser){showAuthOptions();return;}
      authBusy(true); authMessage("Checking your email verification…");
      try {
        await reload(auth.currentUser);
        if(auth.currentUser?.emailVerified) await admitUser(auth.currentUser,authRevision);
        else authMessage("Your email is not verified yet. Open the link, then try again.","error");
      } catch(error){authMessage(authError(error),"error");}
      finally{authBusy(false);}
    });
    $("#resend-verification").addEventListener("click",async()=>{
      if(!auth.currentUser){showAuthOptions();return;}
      authBusy(true);
      try {await sendEmailVerification(auth.currentUser);authMessage("A new verification link has been sent.");}
      catch(error){authMessage(authError(error),"error");}
      finally{authBusy(false);}
    });
    $("#verification-sign-out").addEventListener("click",()=>signOut(auth));
    $("#sign-out").addEventListener("click",async()=>{hideProtected();await signOut(auth);});
  }
  async function startAuthentication() {
    if(!isFirebaseConfigured()) return;
    try {
      auth=getAuth(initializeApp(firebaseConfig)); configuredUi.hidden=false; authSetup.hidden=true; bindAuth();
      await setPersistence(auth,browserLocalPersistence);
      onAuthStateChanged(auth,user=>{
        const revision=++authRevision;
        if(!user) {
          hideProtected(); showAuthOptions(); clearRecaptcha(); $("#otp-form").hidden=true;
          $("#send-phone-code").hidden=false; $("#account-label").textContent=""; return;
        }
        admitUser(user,revision);
      });
      try {await getRedirectResult(auth);}
      catch(error){authMessage(authError(error),"error");}
    } catch {
      authSetup.hidden=false; configuredUi.hidden=true;
      authSetup.querySelector("strong").textContent="Sign-in needs configuration";
      authSetup.querySelector("p").textContent="Check Firebase settings, enabled providers, and allowed site domains.";
    }
  }

  startAuthentication();
})();