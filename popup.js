const input = document.getElementById("nameInput");
const btn = document.getElementById("addBtn");
const list = document.getElementById("nameList");
const search = document.getElementById("searchInput");

let cachedNames = [];

// 🔥 RENDER LIST
function render() {
  chrome.storage.local.get(["names"], (res) => {
    cachedNames = res.names || [];
    list.innerHTML = "";

    cachedNames.forEach((n, i) => {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = n;

      const del = document.createElement("button");
      del.textContent = "X";

      del.onclick = () => {
        cachedNames.splice(i, 1);
        chrome.storage.local.set({ names: cachedNames }, render);
      };

      li.appendChild(span);
      li.appendChild(del);
      list.appendChild(li);
    });
  });
}

// ➕ ADD NAME (ANTI DUPLICATE)
btn.onclick = () => {
  const val = input.value.trim();
  if (!val) return;

  chrome.storage.local.get(["names"], (res) => {
    const names = res.names || [];

    const isDuplicate = names.some(
      (n) => n.toLowerCase() === val.toLowerCase()
    );

    if (isDuplicate) {
      input.value = "";
      input.placeholder = "⚠ DUPLICATE NAME!";

      setTimeout(() => {
        input.placeholder = "Masukkan nama...";
      }, 1200);

      return;
    }

    names.push(val);

    chrome.storage.local.set({ names }, () => {
      input.value = "";
      render();
    });
  });
};

// 🔍 SEARCH FILTER (REALTIME)
if (search) {
  search.addEventListener("input", () => {
    const value = search.value.toLowerCase();
    const items = document.querySelectorAll("#nameList li");

    items.forEach((li) => {
      const text = li.innerText.toLowerCase();
      li.style.display = text.includes(value) ? "flex" : "none";
    });
  });
}

// 🚀 INIT
render();