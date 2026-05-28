let requests = [];
let selectedId = null;
let currentDetail = null;

const listEl = document.getElementById("request-list");
const emptyList = document.getElementById("empty-list");
const emptyDetail = document.getElementById("empty-detail");
const detailContent = document.getElementById("detail-content");

function statusClass(status) {
  if (status === "in-cursor") return "status-in-cursor";
  if (status === "done") return "status-done";
  return "status-new";
}

function statusLabel(status) {
  if (status === "in-cursor") return "In Cursor";
  if (status === "done") return "Done";
  return "New";
}

async function loadList() {
  const res = await fetch("/api/requests");
  requests = await res.json();
  listEl.innerHTML = "";
  emptyList.classList.toggle("hidden", requests.length > 0);

  for (const item of requests) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = item.id;
    if (item.id === selectedId) btn.classList.add("selected");
    const summary = item.summary || "(no summary)";
    btn.innerHTML = `
      <div>${escapeHtml(summary.slice(0, 60))}${summary.length > 60 ? "…" : ""}</div>
      <span class="status-chip ${statusClass(item.status)}">${statusLabel(item.status)}</span>
    `;
    btn.addEventListener("click", () => selectRequest(item.id));
    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function selectRequest(id) {
  selectedId = id;
  const res = await fetch(`/api/requests/${id}`);
  if (!res.ok) return;
  currentDetail = await res.json();

  emptyDetail.classList.add("hidden");
  detailContent.classList.remove("hidden");

  const goalRow = currentDetail.body.match(/\*\*Goal\*\* \| (.+)/);
  document.getElementById("detail-title").textContent =
    goalRow?.[1]?.trim() ||
    currentDetail.body.match(/## Summary\s*\n+([\s\S]*?)(?=\n## )/)?.[1]?.trim().split("\n")[0] ||
    "Request";

  const when = currentDetail.createdAt
    ? new Date(currentDetail.createdAt).toLocaleString()
    : "";
  document.getElementById("detail-meta").textContent = [
    currentDetail.requesterLabel && `From ${currentDetail.requesterLabel}`,
    when,
    currentDetail.id,
  ]
    .filter(Boolean)
    .join(" · ");

  document.getElementById("status-select").value = currentDetail.status;
  document.getElementById("spec-preview").textContent = currentDetail.content;

  const attEl = document.getElementById("attachment-preview");
  if (currentDetail.attachmentUrl) {
    attEl.innerHTML = `<img src="${escapeHtml(currentDetail.attachmentUrl)}" alt="Stakeholder screenshot" />`;
    attEl.classList.remove("hidden");
  } else {
    attEl.innerHTML = "";
    attEl.classList.add("hidden");
  }

  document.querySelectorAll(".request-list button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.id === id);
  });
}

function showToast(msg) {
  const el = document.getElementById("copy-toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2000);
}

document.getElementById("copy-cursor").addEventListener("click", async () => {
  if (!currentDetail?.cursorCopy) return;
  await navigator.clipboard.writeText(currentDetail.cursorCopy);
  showToast("Copied for Cursor");
});

document.getElementById("copy-issue").addEventListener("click", async () => {
  if (!currentDetail?.issueDraft) return;
  await navigator.clipboard.writeText(currentDetail.issueDraft);
  showToast("Copied issue draft");
});

document.getElementById("status-select").addEventListener("change", async (e) => {
  if (!selectedId) return;
  const status = e.target.value;
  const res = await fetch(`/api/requests/${selectedId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (res.ok) {
    await loadList();
    await selectRequest(selectedId);
  }
});

loadList();
