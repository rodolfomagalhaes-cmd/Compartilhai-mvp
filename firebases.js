/* firebases.js (com S) */
/* MVP: Firebase Auth + Firestore + helpers globais para login/items/add-item */

(() => {
  // 1) CONFIG — cole suas chaves aqui (Firebase Console > Project settings > SDK setup)
  const firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "COLE_AQUI",
    authDomain: "COLE_AQUI",
    projectId: "COLE_AQUI",
    storageBucket: "COLE_AQUI",
    messagingSenderId: "COLE_AQUI",
    appId: "COLE_AQUI",
  };

  // 2) Loader único do Firebase (evita "não carregou a tempo" e garante waitFirebaseReady existir)
  let _app = null;
  let _auth = null;
  let _db = null;

  const _ready = (async () => {
    // Validação rápida do config
    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "COLE_AQUI") {
      throw new Error("Firebase config não preenchido (firebaseConfig).");
    }

    // Import via CDN (funciona no Vercel/GitHub Pages)
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const {
      getAuth,
      onAuthStateChanged,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
    } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

    const {
      getFirestore,
      collection,
      addDoc,
      getDocs,
      query,
      where,
      orderBy,
      serverTimestamp,
    } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    _app = initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db = getFirestore(_app);

    // expõe helpers internos (se precisar)
    window.__fb = {
      _app,
      _auth,
      _db,
      onAuthStateChanged,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      collection,
      addDoc,
      getDocs,
      query,
      where,
      orderBy,
      serverTimestamp,
    };

    return window.__fb;
  })();

  // 3) Função que seus HTMLs chamam (isso resolve o erro: waitFirebaseReady is not a function)
  window.waitFirebaseReady = () => _ready;

  // 4) API simples de Auth (usada pelo login.html / items.html)
  window.AuthAPI = {
    async loginOrCreate(email, password) {
      const fb = await _ready;
      try {
        const cred = await fb.signInWithEmailAndPassword(fb._auth, email, password);
        return cred.user;
      } catch (e) {
        // se não existir, cria
        if (e && (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential")) {
          const cred = await fb.createUserWithEmailAndPassword(fb._auth, email, password);
          return cred.user;
        }
        throw e;
      }
    },
    async logout() {
      const fb = await _ready;
      await fb.signOut(fb._auth);
    },
    onChange(cb) {
      _ready.then((fb) => fb.onAuthStateChanged(fb._auth, cb));
    },
  };

  // 5) API simples de Itens (Firestore)
  // Coleção: items
  // Campos: name, category, pricePerDay, notes, ownerUid, createdAt
  window.ItemsAPI = {
    async addItem({ name, category, pricePerDay, notes }) {
      const fb = await _ready;
      const user = fb._auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado.");

      const payload = {
        name: String(name || "").trim(),
        category: String(category || "Outros").trim(),
        pricePerDay: Number(pricePerDay || 0),
        notes: String(notes || "").trim(),
        ownerUid: user.uid,
        createdAt: fb.serverTimestamp(),
      };

      if (!payload.name) throw new Error("Nome do item é obrigatório.");
      if (!payload.pricePerDay || payload.pricePerDay < 1) throw new Error("Valor por dia inválido.");

      await fb.addDoc(fb.collection(fb._db, "items"), payload);
      return true;
    },

    async listMyItems() {
      const fb = await _ready;
      const user = fb._auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado.");

      const q = fb.query(
        fb.collection(fb._db, "items"),
        fb.where("ownerUid", "==", user.uid),
        fb.orderBy("createdAt", "desc")
      );

      const snap = await fb.getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  };
})();
