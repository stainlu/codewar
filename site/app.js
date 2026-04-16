const COLORS = ["#4285F4", "#E34234", "#F5A623", "#2EAD6D", "#9B59B6", "#46BDC6", "#E67E22", "#C2185B"];
const BASE_URL = location.origin;

let selfUser = "";
let targets = [];
let range = "3m";
let theme = "light";
let beatUser = ""; // top performer among targets, computed after chart loads

// Monotonic counter used to ignore stale image-preload callbacks when the
// user clicks Add/Remove rapidly. Only the most recent loadChart's onload
// is allowed to commit to the visible DOM.
let currentLoadId = 0;

// DOM elements
const selfInput = document.getElementById("self-input");
const targetInput = document.getElementById("target-input");
const addBtn = document.getElementById("add-btn");
const selfTagContainer = document.getElementById("self-tag-container");
const targetTags = document.getElementById("target-tags");
const chartImg = document.getElementById("chart-img");
const chartPlaceholder = document.getElementById("chart-placeholder");
const chartLoading = document.getElementById("chart-loading");
const chartWarning = document.getElementById("chart-warning");
const embedSection = document.getElementById("embed-section");
const shareXBtn = document.getElementById("share-x-btn");
const embedCode = document.getElementById("embed-code");
const copyBtn = document.getElementById("copy-btn");
const chartSpinner = document.getElementById("chart-spinner");
const guideSection = document.getElementById("guide");
const guideLink = document.getElementById("guide-link");
const resetBtn = document.getElementById("reset-btn");

// Initialize from URL params
function initFromUrl() {
  const params = new URLSearchParams(location.search);
  const rangeParam = params.get("range");

  // New format: user + targets
  const userParam = params.get("user");
  const targetsParam = params.get("targets");
  // Legacy format: users (all treated as targets)
  const usersParam = params.get("users");

  if (userParam) {
    selfUser = userParam.trim().toLowerCase();
    selfInput.value = "";
  }
  if (targetsParam) {
    targets = targetsParam.split(",").map(u => u.trim().toLowerCase()).filter(Boolean);
  } else if (usersParam) {
    // Legacy: if no user param, all go to targets
    const all = usersParam.split(",").map(u => u.trim().toLowerCase()).filter(Boolean);
    if (userParam) {
      targets = all.filter(u => u !== selfUser);
    } else {
      targets = all;
    }
  }

  if (rangeParam && ["1m", "3m", "1y", "all"].includes(rangeParam)) {
    range = rangeParam;
    document.querySelectorAll(".btn-range").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.range === range);
    });
  }

  // Default targets when visiting with no params
  if (!selfUser && targets.length === 0 && !params.has("user") && !params.has("targets") && !params.has("users")) {
    targets = ["bcherny", "karpathy", "torvalds"];
  }

  renderTags();
  if (getAllUsers().length > 0) {
    loadChart();
  }
}

function getAllUsers() {
  return [selfUser, ...targets].filter(Boolean);
}

function updateUrl() {
  const params = new URLSearchParams();
  if (selfUser) params.set("user", selfUser);
  if (targets.length > 0) params.set("targets", targets.join(","));
  if (range !== "3m") params.set("range", range);
  const qs = params.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

function setSelf(username) {
  username = username.trim().toLowerCase();
  if (!username) return;
  // If this user is already a target, remove from targets
  targets = targets.filter(u => u !== username);
  selfUser = username;
  selfInput.value = "";
  renderTags();
  if (getAllUsers().length > 0) loadChart();
  updateUrl();
}

function clearSelf() {
  selfUser = "";
  renderTags();
  if (getAllUsers().length > 0) {
    loadChart();
  } else {
    showPlaceholder();
  }
  updateUrl();
}

function addTarget(username) {
  username = username.trim().toLowerCase();
  if (!username || targets.includes(username) || username === selfUser) return;
  if (getAllUsers().length >= 5) return;

  targets.push(username);
  renderTags();
  loadChart();
  updateUrl();
  targetInput.value = "";
}

function removeTarget(username) {
  targets = targets.filter(u => u !== username);
  renderTags();
  if (getAllUsers().length > 0) {
    loadChart();
  } else {
    showPlaceholder();
  }
  updateUrl();
}

function renderTags() {
  // Render self tag
  if (selfUser) {
    selfTagContainer.innerHTML = `
      <span class="self-tag">
        <span class="color-dot" style="background: ${COLORS[0]}"></span>
        ${selfUser}
        <span class="remove" onclick="clearSelf()">&times;</span>
      </span>`;
    selfInput.classList.add("hidden");
  } else {
    selfTagContainer.innerHTML = "";
    selfInput.classList.remove("hidden");
  }

  // Render target tags (color offset: if self is set, targets start at color index 1)
  const colorOffset = selfUser ? 1 : 0;
  targetTags.innerHTML = targets.map((user, i) => `
    <span class="user-tag">
      <span class="color-dot" style="background: ${COLORS[(i + colorOffset) % COLORS.length]}"></span>
      ${user}
      <span class="remove" onclick="removeTarget('${user}')">&times;</span>
    </span>
  `).join("");
}

function showPlaceholder() {
  chartPlaceholder.classList.remove("hidden");
  chartImg.classList.add("hidden");
  chartLoading.classList.add("hidden");
  embedSection.classList.add("hidden");
  clearWarning();
}

function showWarning(msg, isError = false) {
  chartWarning.textContent = msg;
  chartWarning.classList.toggle("error", isError);
  chartWarning.classList.remove("hidden");
}

function clearWarning() {
  chartWarning.classList.add("hidden");
  chartWarning.classList.remove("error");
  chartWarning.textContent = "";
}

function loadChart() {
  const allUsers = getAllUsers();
  if (allUsers.length === 0) {
    showPlaceholder();
    return;
  }

  const hasExistingChart = !chartImg.classList.contains("hidden");
  const loadId = ++currentLoadId;

  chartPlaceholder.classList.add("hidden");
  if (!hasExistingChart) {
    chartLoading.classList.remove("hidden");
  }
  chartSpinner.classList.remove("hidden");

  const selfParam = selfUser ? `&self=${selfUser}` : "";
  const themeParam = theme === "dark" ? `&theme=dark` : "";
  const svgUrl = `${BASE_URL}/api/svg?users=${allUsers.join(",")}&range=${range}${selfParam}${themeParam}`;
  const siteUrl = `${BASE_URL}/?user=${selfUser}&targets=${targets.join(",")}&range=${range}`;

  const img = new Image();
  img.onload = () => {
    if (loadId !== currentLoadId) return; // superseded by a newer loadChart
    chartImg.src = svgUrl;
    chartImg.classList.remove("hidden");
    chartLoading.classList.add("hidden");
    chartSpinner.classList.add("hidden");

    const markdown = `[![Code War](${svgUrl})](${siteUrl})`;
    embedCode.textContent = markdown;
    embedSection.classList.remove("hidden");

    // Fetch data to determine top performer and catch per-user failures
    // that the SVG endpoint silently dropped. Shares the same loadId so a
    // stale response from an earlier click can't overwrite the warning.
    const dataUsers = allUsers;
    fetch(`${BASE_URL}/api/data?users=${dataUsers.join(",")}&range=${range}`)
      .then(r => r.json())
      .then(data => {
        if (loadId !== currentLoadId) return;

        if (Array.isArray(data.failedUsers) && data.failedUsers.length > 0) {
          showWarning(
            `Couldn't load data for: ${data.failedUsers.join(", ")}. These users are missing from the chart — double-check the spelling or try again.`
          );
        } else {
          clearWarning();
        }

        const targetUsers = targets.length > 0 ? targets : allUsers;
        let topAvg = 0;
        beatUser = targetUsers[0] || "";
        for (const ds of data.datasets) {
          if (ds.points.length === 0) continue;
          if (!targetUsers.includes(ds.username)) continue;
          const avg = ds.points.reduce((s, p) => s + p.value, 0) / ds.points.length;
          if (avg > topAvg) { topAvg = avg; beatUser = ds.username; }
        }
        shareXBtn.classList.remove("hidden");
      })
      .catch(() => {
        if (loadId !== currentLoadId) return;
        beatUser = (targets[0] || allUsers[0]) || "";
        shareXBtn.classList.remove("hidden");
      });
  };
  img.onerror = () => {
    if (loadId !== currentLoadId) return; // superseded by a newer loadChart
    chartLoading.classList.add("hidden");
    chartSpinner.classList.add("hidden");
    if (!hasExistingChart) {
      chartPlaceholder.classList.remove("hidden");
      chartPlaceholder.querySelector("p").textContent = "Failed to load chart. Please try again.";
    } else {
      showWarning("Failed to refresh chart. Check your connection and try again.", true);
    }
  };
  img.src = svgUrl;
}

// Event listeners
selfInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") setSelf(selfInput.value);
});

addBtn.addEventListener("click", () => addTarget(targetInput.value));

targetInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTarget(targetInput.value);
});

// Range buttons
document.querySelectorAll(".btn-range").forEach(btn => {
  btn.addEventListener("click", () => {
    range = btn.dataset.range;
    document.querySelectorAll(".btn-range").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    if (getAllUsers().length > 0) {
      loadChart();
      updateUrl();
    }
  });
});

// Theme buttons
document.querySelectorAll(".btn-theme").forEach(btn => {
  btn.addEventListener("click", () => {
    theme = btn.dataset.theme;
    document.querySelectorAll(".btn-theme").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    if (getAllUsers().length > 0) {
      loadChart();
    }
  });
});

// Preset buttons
document.querySelectorAll(".btn-preset").forEach(btn => {
  btn.addEventListener("click", () => addTarget(btn.dataset.user));
});

// Copy button
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(embedCode.textContent).then(() => {
    copyBtn.textContent = "Copied!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 2000);
  });
});

// Reset all
resetBtn.addEventListener("click", () => {
  selfUser = "";
  targets = [];
  range = "3m";
  beatUser = "";
  selfInput.value = "";
  targetInput.value = "";
  document.querySelectorAll(".btn-range").forEach(b => {
    b.classList.toggle("active", b.dataset.range === "3m");
  });
  renderTags();
  showPlaceholder();
  shareXBtn.classList.add("hidden");
  updateUrl();
});

// Share on X
shareXBtn.addEventListener("click", () => {
  const shareUrl = `${BASE_URL}/?user=${selfUser}&targets=${targets.join(",")}&range=${range}`;
  const text = `CAN YOU BEAT @${beatUser}?`;
  window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
});

// Guide toggle
guideLink.addEventListener("click", (e) => {
  e.preventDefault();
  guideSection.classList.toggle("hidden");
});

// Make functions available globally for onclick handlers
window.removeTarget = removeTarget;
window.clearSelf = clearSelf;

// Init
initFromUrl();
