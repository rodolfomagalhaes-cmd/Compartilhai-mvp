/* firebases.js (com S)
   Firebase Auth + Firestore + helpers globais
   Funciona em site estático (Vercel) com Firebase compat CDN
*/
(() => {
  "use strict";

  // ========= 1) CONFIG (troque pelos valores REAIS do seu Firebase) =========
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
  };

  // ========= 2) Loader único do Firebase (garante waitFirebaseReady existir) =========
  let _initStarted = false;
  let _readyResolve, _readyReject;

  const _readyPromise = new Promise((res, rej) => {
    _readyResolve = res;
    _readyReject = rej;
  });

  // Disponível para o resto do app
  window.waitFirebaseReady = function waitFirebaseReady(timeoutMs = 15000) {
    startFirebaseInitOnce();
    return Promise.race([
      _readyPromise,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("Firebase timeout")), timeoutMs)
      ),
    ]);
  };

  function startFirebaseInitOnce() {
    if (_initStarted) return;
    _initStarted = true;

    // Se já existir no window, só inicializa
    if (window.firebase && window.firebase.apps) {
      try {
        finishInit();
      } catch (e) {
        _readyReject(e);
      }
      return;
    }

    // Carrega os 3 scripts compat (app, auth, firestore)
    loadScript("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js")
      .then(() =>
        loadScript("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js")
      )
      .then(() =>
        loadScript("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js")
      )
      .then(() => finishInit())
      .catch((err) => _readyReject(err));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // evita duplicar
      const exists = Array.from(document.scripts).some((s) => s.src === src);
      if (exists) return resolve();

      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Falha ao carregar script: " + src));
      document.head.appendChild(s);
    });
  }

  function finishInit() {
    if (!window.firebase) throw new Error("firebase não carregou");

    // Inicializa app (ou reutiliza)
    const firebase = window.firebase;
    const app =
      firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Expor globais (o restante do seu código usa isso)
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;

    // Helpers globais simples
    window.AuthAPI = {
      async loginOrCreate(email, password) {
        await window.waitFirebaseReady();
        try {
          const cred = await auth.signInWithEmailAndPassword(email, password);
          return cred.user;
        } catch (e) {
          // Se não existe, cria
          if (e && (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential")) {
            const cred2 = await auth.createUserWithEmailAndPassword(email, password);
            return cred2.user;
          }
          throw e;
        }
      },

      async logout() {
        await window.waitFirebaseReady();
        return auth.signOut();
      },

      onChange(cb) {
        startFirebaseInitOnce();
        return auth.onAuthStateChanged(cb);
      },

      getCurrentUser() {
        return auth.currentUser;
      },
    };

    window.ItemsAPI = {
      async addItem(data) {
        await window.waitFirebaseReady();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não logado");

        // coleção: items
        const payload = {
          name: (data.name || "").trim(),
          category: (data.category || "").trim(),
          pricePerDay: Number(data.pricePerDay || 0),
          notes: (data.notes || "").trim(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: user.uid,
        };

        if (!payload.name) throw new Error("Nome do item obrigatório");
        if (!payload.category) throw new Error("Categoria obrigatória");
        if (!payload.pricePerDay || payload.pricePerDay <= 0) throw new Error("Valor por dia inválido");

        const ref = await db.collection("items").add(payload);
        return ref.id;
      },

      async listItems() {
        await window.waitFirebaseReady();
        // pega os mais recentes
        const snap = await db
          .collection("items")
          .orderBy("createdAt", "desc")
          .limit(50)
          .get();

        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
    };

    _readyResolve(true);
  }

  // Inicia o init assim que o arquivo carrega (sem depender de clique)
  try {
    startFirebaseInitOnce();
  } catch (e) {
    _readyReject(e);
  }
})();
