const COLORS = ["#4285F4", "#E34234", "#F5A623", "#2EAD6D", "#9B59B6", "#46BDC6", "#E67E22", "#C2185B"];
const BASE_URL = location.origin;

let users = [];
let range = "3m";

// DOM elements
const usernameInput = document.getElementById("username-input");
const addBtn = document.getElementById("add-btn");
const userTags = document.getElementById("user-tags");
const chartImg = document.getElementById("chart-img");
const chartPlaceholder = document.getElementById("chart-placeholder");
const chartLoading = document.getElementById("chart-loading");
const embedSection = document.getElementById("embed-section");
const embedCode = document.getElementById("embed-code");
const copyBtn = document.getElementById("copy-btn");
const guideSection = document.getElementById("guide");
const guideLink = document.getElementById("guide-link");

// Initialize from URL params
function initFromUrl() {
  const params = new URLSearchParams(location.search);
  const usersParam = params.get("users");
  const rangeParam = params.get("range");

  if (usersParam) {
    users = usersParam.split(",").map(u => u.trim()).filter(Boolean);
  }
  if (rangeParam && ["3m", "6m", "1y", "all"].includes(rangeParam)) {
    range = rangeParam;
    document.querySelectorAll(".btn-range").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.range === range);
    });
  }

  renderTags();
  if (users.length > 0) {
    loadChart();
  }
}

function updateUrl() {
  const params = new URLSearchParams();
  if (users.length > 0) params.set("users", users.join(","));
  if (range !== "3m") params.set("range", range);
  const qs = params.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

function addUser(username) {
  username = username.trim().toLowerCase();
  if (!username || users.includes(username)) return;
  if (users.length >= 5) return;

  users.push(username);
  renderTags();
  loadChart();
  updateUrl();
  usernameInput.value = "";
}

function removeUser(username) {
  users = users.filter(u => u !== username);
  renderTags();
  if (users.length > 0) {
    loadChart();
  } else {
    showPlaceholder();
  }
  updateUrl();
}

function renderTags() {
  userTags.innerHTML = users.map((user, i) => `
    <span class="user-tag">
      <span class="color-dot" style="background: ${COLORS[i % COLORS.length]}"></span>
      ${user}
      <span class="remove" onclick="removeUser('${user}')">&times;</span>
    </span>
  `).join("");
}

function showPlaceholder() {
  chartPlaceholder.classList.remove("hidden");
  chartImg.classList.add("hidden");
  chartLoading.classList.add("hidden");
  embedSection.classList.add("hidden");
}

function loadChart() {
  if (users.length === 0) {
    showPlaceholder();
    return;
  }

  const hasExistingChart = !chartImg.classList.contains("hidden");

  // If no chart yet, show loading. Otherwise keep existing chart visible.
  chartPlaceholder.classList.add("hidden");
  if (!hasExistingChart) {
    chartLoading.classList.remove("hidden");
  }

  const svgUrl = `${BASE_URL}/api/svg?users=${users.join(",")}&range=${range}`;
  const siteUrl = `${BASE_URL}/?users=${users.join(",")}&range=${range}`;

  // Preload new SVG in background, swap when ready
  const img = new Image();
  img.onload = () => {
    chartImg.src = svgUrl;
    chartImg.classList.remove("hidden");
    chartLoading.classList.add("hidden");

    // Show embed code
    const markdown = `[![Code War](${svgUrl})](${siteUrl})`;
    embedCode.textContent = markdown;
    embedSection.classList.remove("hidden");
  };
  img.onerror = () => {
    chartLoading.classList.add("hidden");
    if (!hasExistingChart) {
      chartPlaceholder.classList.remove("hidden");
      chartPlaceholder.querySelector("p").textContent = "Failed to load chart. Please try again.";
    }
  };
  img.src = svgUrl;
}

// Event listeners
addBtn.addEventListener("click", () => addUser(usernameInput.value));

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addUser(usernameInput.value);
});

// Range buttons
document.querySelectorAll(".btn-range").forEach(btn => {
  btn.addEventListener("click", () => {
    range = btn.dataset.range;
    document.querySelectorAll(".btn-range").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    if (users.length > 0) {
      loadChart();
      updateUrl();
    }
  });
});

// Preset buttons
document.querySelectorAll(".btn-preset").forEach(btn => {
  btn.addEventListener("click", () => addUser(btn.dataset.user));
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

// Guide toggle
guideLink.addEventListener("click", (e) => {
  e.preventDefault();
  guideSection.classList.toggle("hidden");
});

// Make removeUser available globally for onclick handlers
window.removeUser = removeUser;

// Init
initFromUrl();
