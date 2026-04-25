(function () {
  let REGEX = null;
  let audio = null;
  let soundCooldown = false;

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 🔊 PRELOAD SOUND BIAR CEPAT
  function initAudio() {
    audio = new Audio(chrome.runtime.getURL("notif.mp3"));
    audio.volume = 1;
    audio.preload = "auto";
    audio.load();
  }

  function playSound() {
    if (!audio || soundCooldown) return;

    soundCooldown = true;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      soundCooldown = false;
    }, 500);
  }

  // 📦 LOAD NAMES
  function loadNames(cb) {
    chrome.storage.local.get(["names"], (res) => {
      const names = (res.names || [])
        .map((n) => n.trim())
        .filter(Boolean);

      const safe = names.map(escapeRegExp);

      REGEX = safe.length
        ? new RegExp(`\\b(${safe.join("|")})\\b`, "gi")
        : null;

      cb && cb();
    });
  }

  // 🎨 STYLE
  function injectStyle() {
    if (document.getElementById("abay-style")) return;

    const style = document.createElement("style");
    style.id = "abay-style";

    style.textContent = `
      @keyframes abayBlink {
        0% { background: red; color: white; }
        50% { background: yellow; color: black; }
        100% { background: red; color: white; }
      }

      .abay-highlight {
        animation: abayBlink 0.6s infinite !important;
        font-weight: bold !important;
        padding: 2px 4px !important;
        border-radius: 4px !important;
      }
    `;

    document.documentElement.appendChild(style);
  }

  // 🔍 PROSES 1 TEXT NODE
  function processTextNode(node) {
    if (!REGEX || !node || !node.nodeValue) return false;

    const parent = node.parentNode;
    if (!parent) return false;

    if (parent.closest?.(".abay-highlight")) return false;

    if (["SCRIPT", "STYLE", "INPUT", "TEXTAREA"].includes(parent.nodeName)) {
      return false;
    }

    const text = node.nodeValue;

    REGEX.lastIndex = 0;
    if (!REGEX.test(text)) return false;

    REGEX.lastIndex = 0;

    const wrapper = document.createElement("span");

    wrapper.innerHTML = text.replace(REGEX, (match) => {
      return `<span class="abay-highlight">${match}</span>`;
    });

    node.replaceWith(wrapper);
    return true;
  }

  // 🔍 PROSES NODE BARU SAJA
  function processNode(root) {
    if (!REGEX || !root) return;

    let foundAny = false;

    if (root.nodeType === Node.TEXT_NODE) {
      foundAny = processTextNode(root);
    } else if (root.nodeType === Node.ELEMENT_NODE) {
      if (root.closest?.(".abay-highlight")) return;

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT
      );

      let node;
      const nodes = [];

      while ((node = walker.nextNode())) {
        nodes.push(node);
      }

      for (const textNode of nodes) {
        if (processTextNode(textNode)) {
          foundAny = true;
        }
      }
    }

    if (foundAny) {
      playSound();
    }
  }

  // 🔍 SCAN AWAL SEKALI SAJA
  function highlightAll() {
    if (!document.body) return;
    processNode(document.body);
  }

  // 👀 REALTIME DETECT
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          processNode(node);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 🚀 INIT
  function init() {
    if (!document.body) return;

    injectStyle();
    initAudio();

    loadNames(() => {
      highlightAll();
      startObserver();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();