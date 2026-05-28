let requests = [];
let selectedId = null;
let currentDetail = null;

const listEl = document.getElementById("request-list");
const listHeading = document.getElementById("request-list-heading");
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

function formatListDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatRequestLabel(requestNumber) {
  const n = Number(requestNumber);
  if (!Number.isFinite(n) || n < 1) return "#—";
  return `#${n}`;
}

/** Oldest submit = #1; fills in if API omits requestNumber (stale server). */
function applyRequestNumbers(items) {
  if (items.every((item) => item.requestNumber > 0)) return items;

  const chronological = [...items].sort((a, b) => {
    const byDate = (a.createdAt || "").localeCompare(b.createdAt || "");
    if (byDate !== 0) return byDate;
    return (a.id || "").localeCompare(b.id || "");
  });
  const numberById = new Map();
  chronological.forEach((item, index) => {
    numberById.set(item.id, index + 1);
  });

  return items.map((item) => ({
    ...item,
    requestNumber: item.requestNumber > 0 ? item.requestNumber : numberById.get(item.id),
  }));
}

function buildListItemMarkup(item) {
  const summary = item.summary || "(no summary)";
  const truncated =
    summary.length > 72 ? `${summary.slice(0, 69)}…` : summary;
  const metaParts = [
    item.requesterLabel,
    formatListDate(item.createdAt),
  ].filter(Boolean);
  const label = formatRequestLabel(item.requestNumber);

  return `
    <span class="request-item-number" aria-hidden="true">${label}</span>
    <span class="request-item-body">
      <span class="request-item-summary">${escapeHtml(truncated)}</span>
      ${metaParts.length ? `<span class="request-item-meta">${escapeHtml(metaParts.join(" · "))}</span>` : ""}
    </span>
    <span class="status-chip ${statusClass(item.status)}">${statusLabel(item.status)}</span>
  `;
}

async function loadList() {
  const res = await fetch("/api/requests");
  requests = applyRequestNumbers(await res.json());
  listEl.innerHTML = "";
  emptyList.classList.toggle("hidden", requests.length > 0);

  if (listHeading) {
    listHeading.textContent =
      requests.length > 0 ? `Requests (${requests.length})` : "Requests";
  }

  for (const item of requests) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "request-item";
    btn.dataset.id = item.id;
    if (item.id === selectedId) btn.classList.add("selected");
    btn.setAttribute(
      "aria-label",
      `Request ${formatRequestLabel(item.requestNumber)}: ${item.summary || "untitled"}. Status ${statusLabel(item.status)}.`,
    );
    btn.innerHTML = buildListItemMarkup(item);
    btn.addEventListener("click", () => selectRequest(item.id));
    li.appendChild(btn);
    listEl.appendChild(li);
  }

  if (selectedId && !requests.some((r) => r.id === selectedId)) {
    selectedId = null;
    currentDetail = null;
    emptyDetail.classList.remove("hidden");
    detailContent.classList.add("hidden");
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function selectRequest(id) {
  selectedId = id;
  const res = await fetch(`/api/requests/${id}`);
  if (!res.ok) return;
  currentDetail = await res.json();

  emptyDetail.classList.add("hidden");
  detailContent.classList.remove("hidden");

  const goalRow = currentDetail.body.match(/\*\*Goal\*\* \| (.+)/);
  const titleText =
    goalRow?.[1]?.trim() ||
    currentDetail.body.match(/## Summary\s*\n+([\s\S]*?)(?=\n## )/)?.[1]?.trim().split("\n")[0] ||
    "Request";

  const detailNumber =
    currentDetail.requestNumber > 0
      ? currentDetail.requestNumber
      : requests.find((r) => r.id === id)?.requestNumber;
  const numberLabel = formatRequestLabel(detailNumber);

  document.getElementById("detail-title").textContent = `${numberLabel} — ${titleText}`;

  const when = currentDetail.createdAt
    ? new Date(currentDetail.createdAt).toLocaleString()
    : "";
  document.getElementById("detail-meta").textContent = [
    detailNumber > 0 && `Request ${detailNumber}`,
    currentDetail.requesterLabel && `From ${currentDetail.requesterLabel}`,
    when,
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

  document.querySelectorAll(".request-list .request-item").forEach((b) => {
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
