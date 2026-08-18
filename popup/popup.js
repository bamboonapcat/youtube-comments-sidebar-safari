(() => {
  "use strict";

  const extensionApi = globalThis.browser ?? globalThis.chrome;
  const enabledInput = document.getElementById("enabled");
  const widthInput = document.getElementById("sidebar-width");
  const widthOutput = document.getElementById("width-output");
  const defaults = { enabled: true, sidebarWidth: 460 };

  function showWidth(value) {
    widthOutput.value = `${value}px`;
    widthOutput.textContent = `${value}px`;
  }

  async function initialize() {
    const settings = await extensionApi.storage.local.get(defaults);
    enabledInput.checked = settings.enabled !== false;
    widthInput.value = String(settings.sidebarWidth ?? defaults.sidebarWidth);
    showWidth(widthInput.value);
  }

  enabledInput.addEventListener("change", () => {
    extensionApi.storage.local.set({ enabled: enabledInput.checked });
  });

  widthInput.addEventListener("input", () => {
    showWidth(widthInput.value);
  });

  widthInput.addEventListener("change", () => {
    extensionApi.storage.local.set({ sidebarWidth: Number(widthInput.value) });
  });

  initialize();
})();
