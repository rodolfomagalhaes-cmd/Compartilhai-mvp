// Ano no footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Menu mobile
const burger = document.getElementById("burger");
const mobile = document.getElementById("mobile");
if (burger && mobile) {
  burger.addEventListener("click", () => {
    const open = !mobile.hasAttribute("hidden");
    if (open) {
      mobile.setAttribute("hidden", "");
      burger.setAttribute("aria-expanded", "false");
    } else {
      mobile.removeAttribute("hidden");
      burger.setAttribute("aria-expanded", "true");
    }
  });

  mobile.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      mobile.setAttribute("hidden", "");
      burger.setAttribute("aria-expanded", "false");
    });
  });
}

// Tabs
const tabs = document.querySelectorAll(".tab");
const panelMorador = document.getElementById("panel-morador");
const panelSindico = document.getElementById("panel-sindico");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("tab--active"));
    btn.classList.add("tab--active");

    const tab = btn.dataset.tab;
    if (tab === "morador") {
      panelMorador.classList.add("panel--active");
      panelSindico.classList.remove("panel--active");
    } else {
      panelSindico.classList.add("panel--active");
      panelMorador.classList.remove("panel--active");
    }
  });
});

// WhatsApp (troque para seu número no formato 55DDDNÚMERO)
const WHATS_NUMBER = "553191918366"; // <-- troque aqui
const WHATS_TEXT = encodeURIComponent("Oi! Quero saber mais sobre o Compartilhaí e participar do piloto.");
const whatsUrl = `https://wa.me/${WHATS_NUMBER}?text=${WHATS_TEXT}`;

const whatsBtn = document.getElementById("whatsBtn");
const whatsBtn2 = document.getElementById("whatsBtn2");
if (whatsBtn) whatsBtn.href = whatsUrl;
if (whatsBtn2) whatsBtn2.href = whatsUrl;

// Simulador
const rentalsPerDay = document.getElementById("rentalsPerDay");
const rentalsLabel = document.getElementById("rentalsLabel");
const ticket = document.getElementById("ticket");
const fee = document.getElementById("fee");
const condoShare = document.getElementById("condoShare");

const gmvEl = document.getElementById("gmv");
const appRevEl = document.getElementById("appRev");
const condoRevEl = document.getElementById("condoRev");

function formatBRL(n){
  return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function calc(){
  const rpd = Number(rentalsPerDay.value || 0);
  const t = Number(ticket.value || 0);
  const f = Math.max(0, Math.min(30, Number(fee.value || 0))) / 100;
  const share = Math.max(0, Math.min(100, Number(condoShare.value || 0))) / 100;

  const monthlyRentals = rpd * 30;
  const gmv = monthlyRentals * t;
  const feeTotal = gmv * f;

  const condo = feeTotal * share;
  const app = feeTotal - condo;

  if (rentalsLabel) rentalsLabel.textContent = String(rpd);
  if (gmvEl) gmvEl.textContent = formatBRL(Math.round(gmv));
  if (appRevEl) appRevEl.textContent = formatBRL(Math.round(app));
  if (condoRevEl) condoRevEl.textContent = formatBRL(Math.round(condo));
}

[rentalsPerDay, ticket, fee, condoShare].forEach(el => el && el.addEventListener("input", calc));
calc();

// Formulário (MVP: abre WhatsApp com dados preenchidos)
// Para envio real: trocar para Formspree/Netlify Forms/back-end
const form = document.getElementById("leadForm");
const hint = document.getElementById("formHint");
const profile = document.getElementById("profile");
const unitsLabel = document.getElementById("unitsLabel");

function updateUnitLabel(){
  if (!profile || !unitsLabel) return;
  const isSindico = profile.value === "sindico";
  unitsLabel.style.display = isSindico ? "none" : "grid";
}
if (profile) profile.addEventListener("change", updateUnitLabel);
updateUnitLabel();

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    const msg = [
      "Lead - Compartilhaí",
      `Perfil: ${data.profile || "-"}`,
      `Condomínio: ${data.condo || "-"}`,
      `Nome: ${data.name || "-"}`,
      `WhatsApp: ${data.phone || "-"}`,
      data.profile === "morador" ? `Apto: ${data.unit || "-"}` : null,
      data.message ? `Mensagem: ${data.message}` : null
    ].filter(Boolean).join("\n");

    const url = `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(msg)}`;
    if (hint) hint.textContent = "Abrindo WhatsApp com seus dados…";
    window.open(url, "_blank", "noopener,noreferrer");
    form.reset();
    updateUnitLabel();
  });
}