/* firebases.js  (com S)  */
/* MVP: Firebase Auth + Firestore + helpers globais para login/items */

/* =============== CONFIG (COLE SUAS CHAVES AQUI) =============== */
const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

/* =============== FIREBASE (CDN / MODULE) =============== */
let _app = null;
let _auth = null;
let _db = null;

let _readyResolve;
let _readyReject;
const _readyPromise = new Promise((res, rej) => {
  _readyResolve = res;
  _readyReject = rej;
});

// expõe um “aguardador” global (pra não quebrar seus HTMLs)
window.waitFirebaseReady = function waitFirebaseReady(timeoutMs = 12000) {
  return Promise.race([
    _readyPromise,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error("Firebase não carregou a tempo.")), timeoutMs)
    )
  ]);
};

// util simples pra log
function _log(...args) {
  // console.log("[Firebase]", ...args);
}

async function bootFirebase() {
  try {
    // Carrega módulos do Firebase
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const {
      getAuth,
      onAuthStateChanged,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut
    } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

    const {
      getFirestore,
      collection,
      addDoc,
      getDocs,
      query,
      orderBy,
      serverTimestamp
    } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    // Inicializa
    _app = initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db = getFirestore(_app);

    // APIs globais
    window.AuthAPI = {
      loginOrCreate: async (email, password) => {
        if (!email || !password) throw new Error("Informe e-mail e senha.");
        try {
          const cred = await signInWithEmailAndPassword(_auth, email, password);
          return cred.user;
        } catch (err) {
          // se não existe, cria
          if (String(err?.code || "").includes("auth/user-not-found") || String(err?.code || "").includes("auth/invalid-credential")) {
            const cred = await createUserWithEmailAndPassword(_auth, email, password);
            return cred.user;
          }
          // alguns casos: email já existe mas senha errada
          if (String(err?.code || "").includes("auth/wrong-password")) {
            throw new Error("Senha incorreta.");
          }
          throw err;
        }
      },

      logout: async () => {
        await signOut(_auth);
      },

      onChange: (cb) => {
        return onAuthStateChanged(_auth, cb);
      },

      currentUser: () => _auth.currentUser
    };

    window.ItemsAPI = {
      // salva item no Firestore
      addItem: async ({ name, category, pricePerDay, notes }) => {
        if (!_auth.currentUser) throw new Error("Usuário não autenticado.");
        if (!name) throw new Error("Informe o nome do item.");
        const price = Number(pricePerDay);
        if (!Number.isFinite(price) || price <= 0) throw new Error("Informe um valor por dia válido.");

        const ref = collection(_db, "items");
        const doc = await addDoc(ref, {
          name: String(name).trim(),
          category: String(category || "Outros").trim(),
          pricePerDay: price,
          notes: String(notes || "").trim(),
          ownerUid: _auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        return doc.id;
      },

      // lista itens do Firestore
      listItems: async () => {
        const ref = collection(_db, "items");
        const q = query(ref, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    };

    // sinaliza pronto
    _log("Firebase pronto");
    _readyResolve(true);
  } catch (e) {
    console.error("Erro iniciando Firebase:", e);
    _readyReject(e);
  }
}

// inicia ao carregar
bootFirebase();
