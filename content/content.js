(() => {
  "use strict";

  const EXTENSION_CLASS = "ycr-layout-active";
  const COMMENTS_CLASS = "ycr-comments-sidebar";
  const RELATED_CLASS = "ycr-recommendations-bottom";
  const RESTORE_MARKER_ID = "ycr-comments-restore-marker";
  const DEFAULT_SETTINGS = Object.freeze({ enabled: true, sidebarWidth: 460 });

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    comments: null,
    commentsParent: null,
    commentsNextSibling: null,
    related: null,
    resizeObserver: null,
    mutationObserver: null,
    scheduled: false,
    lastUrl: location.href
  };

  const extensionApi = globalThis.browser ?? globalThis.chrome;

  function isWatchPage() {
    return location.pathname === "/watch";
  }

  function normalizeSettings(value = {}) {
    const width = Number(value.sidebarWidth);
    return {
      enabled: value.enabled !== false,
      sidebarWidth: Number.isFinite(width)
        ? Math.min(640, Math.max(360, width))
        : DEFAULT_SETTINGS.sidebarWidth
    };
  }

  async function loadSettings() {
    if (!extensionApi?.storage?.local) return;

    try {
      const saved = await extensionApi.storage.local.get(DEFAULT_SETTINGS);
      state.settings = normalizeSettings(saved);
    } catch (error) {
      console.warn("[YouTube Comments Sidebar] 設定を読み込めませんでした。", error);
    }
  }

  function getWatchElements() {
    const watch = document.querySelector("ytd-watch-flexy");
    const columns = watch?.querySelector("#columns");
    const primary = columns?.querySelector(":scope > #primary");
    const related = columns?.querySelector(":scope > #secondary");
    const comments =
      primary?.querySelector("ytd-comments#comments") ??
      primary?.querySelector("ytd-comments") ??
      (state.comments?.isConnected ? state.comments : null);
    const player =
      primary?.querySelector("#player-container-outer") ??
      primary?.querySelector("#player") ??
      watch?.querySelector("#player-container-outer");

    return { watch, columns, primary, related, comments, player };
  }

  function rememberCommentsPosition(comments) {
    if (comments === state.comments && state.commentsParent) return;

    state.comments = comments;
    state.commentsParent = comments.parentNode;
    state.commentsNextSibling = comments.nextSibling;

    const existingMarker = document.getElementById(RESTORE_MARKER_ID);
    existingMarker?.remove();

    const marker = document.createElement("span");
    marker.id = RESTORE_MARKER_ID;
    marker.hidden = true;
    comments.before(marker);
  }

  function updatePlayerHeight(player, columns) {
    const height = Math.round(player?.getBoundingClientRect().height ?? 0);
    if (height > 240) {
      columns.style.setProperty("--ycr-player-height", `${height}px`);
    }
  }

  function observePlayer(player, columns) {
    state.resizeObserver?.disconnect();
    state.resizeObserver = new ResizeObserver(() => updatePlayerHeight(player, columns));
    if (player) state.resizeObserver.observe(player);
    updatePlayerHeight(player, columns);
  }

  function applyLayout() {
    if (!state.settings.enabled || !isWatchPage()) {
      restoreLayout();
      return;
    }

    const { watch, columns, primary, related, comments, player } = getWatchElements();
    if (!watch || !columns || !primary || !related || !comments || !player) return;

    rememberCommentsPosition(comments);

    watch.classList.add(EXTENSION_CLASS);
    columns.style.setProperty("--ycr-sidebar-width", `${state.settings.sidebarWidth}px`);

    if (comments.parentNode !== columns) {
      columns.insertBefore(comments, related);
    }

    comments.classList.add(COMMENTS_CLASS);
    related.classList.add(RELATED_CLASS);
    state.related = related;
    observePlayer(player, columns);
  }

  function restoreLayout() {
    document.querySelectorAll(`ytd-watch-flexy.${EXTENSION_CLASS}`).forEach((watch) => {
      watch.classList.remove(EXTENSION_CLASS);
      const columns = watch.querySelector("#columns");
      columns?.style.removeProperty("--ycr-sidebar-width");
      columns?.style.removeProperty("--ycr-player-height");
    });

    if (state.comments?.isConnected) {
      state.comments.classList.remove(COMMENTS_CLASS);
      const marker = document.getElementById(RESTORE_MARKER_ID);

      if (marker?.parentNode) {
        marker.replaceWith(state.comments);
      } else if (state.commentsParent?.isConnected) {
        const nextSibling = state.commentsNextSibling?.parentNode === state.commentsParent
          ? state.commentsNextSibling
          : null;
        state.commentsParent.insertBefore(state.comments, nextSibling);
      }
    }

    state.related?.classList.remove(RELATED_CLASS);
    document.querySelectorAll(`.${RELATED_CLASS}`).forEach((element) => {
      element.classList.remove(RELATED_CLASS);
    });
    document.getElementById(RESTORE_MARKER_ID)?.remove();
    state.resizeObserver?.disconnect();
    state.resizeObserver = null;
    state.comments = null;
    state.commentsParent = null;
    state.commentsNextSibling = null;
    state.related = null;
  }

  function scheduleLayout() {
    if (state.scheduled) return;
    state.scheduled = true;

    requestAnimationFrame(() => {
      state.scheduled = false;
      applyLayout();
    });
  }

  function watchYouTubeNavigation() {
    document.addEventListener("yt-navigate-finish", scheduleLayout);
    document.addEventListener("yt-page-data-updated", scheduleLayout);
    window.addEventListener("popstate", scheduleLayout);

    state.mutationObserver = new MutationObserver(() => {
      if (location.href !== state.lastUrl) {
        state.lastUrl = location.href;
        restoreLayout();
      }
      scheduleLayout();
    });

    state.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function watchSettings() {
    extensionApi?.storage?.onChanged?.addListener((changes, areaName) => {
      if (areaName !== "local") return;

      state.settings = normalizeSettings({
        ...state.settings,
        ...(changes.enabled ? { enabled: changes.enabled.newValue } : {}),
        ...(changes.sidebarWidth ? { sidebarWidth: changes.sidebarWidth.newValue } : {})
      });

      restoreLayout();
      scheduleLayout();
    });
  }

  async function start() {
    await loadSettings();
    watchSettings();
    watchYouTubeNavigation();
    scheduleLayout();
  }

  start();
})();
