const steps = ["step-1", "step-2", "step-3", "step-clarify", "step-thanks"];
const stepAccents = ["1", "2", "3", "clarify", "thanks"];
let current = 0;

const stepPanel = document.getElementById("step-panel");
const llmToggle = document.getElementById("use-llm");
const llmToggleWrap = document.getElementById("llm-toggle-wrap");
const llmToggleHint = document.getElementById("llm-toggle-hint");

const state = {
  wish: "",
  requesterLabel: "",
  audience: "",
  frequency: "",
  success: "",
  clarify: [],
  clarifyNotes: "",
  useLlm: false,
};

let apiConfig = { llmAvailable: false, model: "openrouter/free" };

async function loadApiConfig() {
  try {
    const res = await fetch("/api/config");
    if (res.ok) apiConfig = await res.json();
  } catch {
    /* rules-only fallback */
  }
  syncLlmToggleUi();
}

function syncLlmToggleUi() {
  if (!llmToggle || !llmToggleWrap) return;

  if (apiConfig.llmAvailable) {
    llmToggleWrap.classList.remove("is-disabled");
    llmToggle.disabled = false;
    llmToggleHint.textContent = `Uses OpenRouter (${apiConfig.model}) to tighten PRD → ADR wording.`;
  } else {
    llmToggleWrap.classList.add("is-disabled");
    llmToggle.checked = false;
    llmToggle.disabled = true;
    state.useLlm = false;
    llmToggleHint.textContent =
      "AI polish is off — server has no OpenRouter key (rules-only normalization still runs).";
  }
}

if (llmToggle) {
  llmToggle.addEventListener("change", () => {
    state.useLlm = llmToggle.checked && apiConfig.llmAvailable;
  });
}

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
  state.useLlm = Boolean(llmToggle?.checked && apiConfig.llmAvailable);
}

function buildRecapHtml(recap) {
  if (recap?.goal) {
    let html = `
      <p><strong>We understood your goal as:</strong> ${escapeHtml(recap.goal)}</p>
      <p><strong>Done when:</strong> ${escapeHtml(recap.success || state.success)}</p>
    `;
    if (recap.useLlm && recap.normalizedMode?.includes("llm")) {
      html += `<p><strong>AI polish:</strong> Applied via OpenRouter${recap.llmModel ? ` (${escapeHtml(recap.llmModel)})` : ""}.</p>`;
    } else     if (recap.useLlm) {
      html += `<p><strong>AI polish:</strong> Requested but unavailable — saved with rules-only normalization.</p>`;
    }
    if (recap.hasAttachment) {
      html += `<p><strong>Screenshot:</strong> Attached for your developer.</p>`;
    }
    html += `<p class="subtitle" style="margin-top:1rem">Your original words are saved for the developer. We cleaned up spelling and shaped a scoped brief they can use in Cursor.</p>`;
    if (recap.warnings?.length) {
      html += `<p><strong>We'll double-check:</strong> ${escapeHtml(recap.warnings.slice(0, 2).join("; "))}</p>`;
    }
    return html;
  }
  return `
    <p><strong>Request:</strong> ${escapeHtml(state.wish)}</p>
    <p><strong>For:</strong> ${escapeHtml(state.audience)} (${escapeHtml(state.frequency)})</p>
    <p><strong>Done when:</strong> ${escapeHtml(state.success)}</p>
  `;
}

function escapeHtml(str) {
  return String(str)
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
  if (!state.requesterLabel) {
    alert("Please enter your name and role.");
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

function buildSubmitBody() {
  const screenshotInput = document.getElementById("screenshot");
  const file = screenshotInput?.files?.[0];

  if (file) {
    const fd = new FormData();
    fd.append("wish", state.wish);
    fd.append("requesterLabel", state.requesterLabel);
    fd.append("audience", state.audience);
    fd.append("frequency", state.frequency);
    fd.append("success", state.success);
    fd.append("clarify", JSON.stringify(state.clarify));
    if (state.clarifyNotes) fd.append("clarifyNotes", state.clarifyNotes);
    fd.append("useLlm", state.useLlm ? "true" : "false");
    fd.append("screenshot", file);
    return { body: fd };
  }

  return {
    body: JSON.stringify(state),
    headers: { "Content-Type": "application/json" },
  };
}

const screenshotInput = document.getElementById("screenshot");
const screenshotPreview = document.getElementById("screenshot-preview");
const screenshotFilename = document.getElementById("screenshot-filename");
const screenshotClear = document.getElementById("screenshot-clear");
let screenshotPreviewUrl = null;

function revokeScreenshotPreview() {
  if (screenshotPreviewUrl) {
    URL.revokeObjectURL(screenshotPreviewUrl);
    screenshotPreviewUrl = null;
  }
}

function syncScreenshotUi() {
  if (!screenshotInput) return;
  const file = screenshotInput.files?.[0];

  if (screenshotFilename) {
    screenshotFilename.textContent = file ? file.name : "No image selected";
  }
  screenshotClear?.classList.toggle("hidden", !file);

  if (!screenshotPreview) return;
  revokeScreenshotPreview();
  if (!file) {
    screenshotPreview.classList.add("hidden");
    screenshotPreview.innerHTML = "";
    return;
  }
  screenshotPreviewUrl = URL.createObjectURL(file);
  screenshotPreview.innerHTML = `<img src="${screenshotPreviewUrl}" alt="Screenshot preview" />`;
  screenshotPreview.classList.remove("hidden");
}

if (screenshotInput) {
  screenshotInput.addEventListener("change", syncScreenshotUi);
}

screenshotClear?.addEventListener("click", () => {
  if (screenshotInput) screenshotInput.value = "";
  syncScreenshotUi();
});

document.getElementById("submit-request").addEventListener("click", async () => {
  collectClarify();
  const errEl = document.getElementById("submit-error");
  errEl.classList.add("hidden");
  const btn = document.getElementById("submit-request");
  btn.disabled = true;
  const prevLabel = btn.textContent;
  if (state.useLlm) btn.textContent = "Polishing with AI…";

  try {
    const { body, headers } = buildSubmitBody();
    const res = await fetch("/api/requests", {
      method: "POST",
      headers,
      body,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not save request");
    }
    const data = await res.json();
    document.getElementById("recap").innerHTML = buildRecapHtml(data.recap);
    showStep(4);
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = prevLabel;
  }
});

loadApiConfig();
