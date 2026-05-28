const steps = ["step-1", "step-2", "step-3", "step-clarify", "step-thanks"];
const stepAccents = ["1", "2", "3", "clarify", "thanks"];
let current = 0;

const stepPanel = document.getElementById("step-panel");

const state = {
  wish: "",
  requesterLabel: "",
  audience: "",
  frequency: "",
  success: "",
  clarify: [],
  clarifyNotes: "",
};

function showStep(index) {
  current = index;
  steps.forEach((id, i) => {
    document.getElementById(id).classList.toggle("hidden", i !== index);
  });
  const dots = document.querySelectorAll("#progress span");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i <= Math.min(index, 3));
  });
  if (stepPanel) {
    stepPanel.dataset.stepAccent = stepAccents[index] || "1";
  }
}

function collectClarify() {
  state.clarify = [...document.querySelectorAll("#clarify-options input:checked")].map(
    (el) => el.value,
  );
  state.clarifyNotes = document.getElementById("clarifyNotes").value.trim();
}

function buildRecapHtml() {
  return `
    <p><strong>Request:</strong> ${escapeHtml(state.wish)}</p>
    <p><strong>For:</strong> ${escapeHtml(state.audience)} (${escapeHtml(state.frequency)})</p>
    <p><strong>Done when:</strong> ${escapeHtml(state.success)}</p>
  `;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.getElementById("next-1").addEventListener("click", () => {
  state.wish = document.getElementById("wish").value.trim();
  state.requesterLabel = document.getElementById("requesterLabel").value.trim();
  if (!state.wish) {
    alert("Please describe what should be easier.");
    return;
  }
  showStep(1);
});

document.getElementById("back-2").addEventListener("click", () => showStep(0));
document.getElementById("next-2").addEventListener("click", () => {
  state.audience = document.getElementById("audience").value;
  state.frequency = document.getElementById("frequency").value;
  if (!state.audience || !state.frequency) {
    alert("Please choose audience and frequency.");
    return;
  }
  showStep(2);
});

document.getElementById("back-3").addEventListener("click", () => showStep(1));
document.getElementById("next-3").addEventListener("click", () => {
  state.success = document.getElementById("success").value.trim();
  if (!state.success) {
    alert("Please describe how you'll know it's working.");
    return;
  }
  showStep(3);
});

document.getElementById("back-clarify").addEventListener("click", () => showStep(2));

document.getElementById("submit-request").addEventListener("click", async () => {
  collectClarify();
  const errEl = document.getElementById("submit-error");
  errEl.classList.add("hidden");
  const btn = document.getElementById("submit-request");
  btn.disabled = true;

  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not save request");
    }
    document.getElementById("recap").innerHTML = buildRecapHtml();
    showStep(4);
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove("hidden");
    btn.disabled = false;
  }
});
