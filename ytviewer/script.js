const input = document.getElementById("yt-input");
const loadBtn = document.getElementById("load-btn");

const accountBtn = document.getElementById("account-btn");
const installBtn = document.getElementById("install-btn");

const fsEnter = document.getElementById("fs-enter");
const fsExit = document.getElementById("fs-exit");

const container = document.getElementById("container");
const videoFrame = document.getElementById("video-frame");
const chatFrame = document.getElementById("chat-frame");

const iosInstallMessage = document.getElementById("ios-install-message");
const iosInstallClose = document.getElementById("ios-install-close");

const EMBED_DOMAIN = window.location.hostname || "cwd273.github.io";


/* =========================================================
   PWA
   ========================================================= */

let deferredInstallPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      console.log("Service worker registered:", registration.scope);
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}

/* Android / Chrome / Edge install prompt */
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.style.display = "inline-flex";
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showIOSInstallInstructions();
    return;
  }

  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  console.log("PWA install result:", result.outcome);

  deferredInstallPrompt = null;
  installBtn.style.display = "none";
});

window.addEventListener("appinstalled", () => {
  console.log("PWA installed");
  deferredInstallPrompt = null;
  installBtn.style.display = "none";
});

function isStandalonePWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function showIOSInstallInstructions() {
  if (!isIOS()) {
    alert("Use your browser's Install App or Add to Home Screen option.");
    return;
  }

  if (isStandalonePWA()) {
    return;
  }

  iosInstallMessage.classList.add("visible");
}

iosInstallClose.addEventListener("click", () => {
  iosInstallMessage.classList.remove("visible");
});

if (isStandalonePWA()) {
  installBtn.style.display = "none";
}


/* =========================================================
   iOS viewport handling
   ========================================================= */

function updateVh() {
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`
  );
}

updateVh();

window.addEventListener("resize", updateVh);
window.addEventListener("orientationchange", () => {
  // innerHeight can lag behind the orientation event on iOS
  setTimeout(updateVh, 100);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    updateVh();
  }
});


/* =========================================================
   YouTube helpers
   ========================================================= */

function extractVideoId(value) {
  value = value.trim();

  if (!value) {
    return null;
  }

  /* Allow direct video IDs */
  if (!value.includes("http")) {
    return value;
  }

  try {
    const url = new URL(value);

    /* youtube.com/watch?v=XXXXXXXXXXX */
    if (url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }

    /* youtu.be/XXXXXXXXXXX */
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean).pop();
    }

    /* /embed/XXXXXXXXXXX  or  /live/XXXXXXXXXXX */
    if (
      url.pathname.startsWith("/embed/") ||
      url.pathname.startsWith("/live/")
    ) {
      return url.pathname.split("/").filter(Boolean).pop();
    }
  } catch (error) {
    console.error("Unable to parse YouTube URL:", error);
  }

  return null;
}

function loadStream() {
  const id = extractVideoId(input.value);

  if (!id) {
    alert("Invalid YouTube ID or URL");
    return;
  }

  videoFrame.src =
    `https://www.youtube.com/embed/${encodeURIComponent(id)}` +
    `?autoplay=1` +
    `&rel=0` +
    `&enablejsapi=1`;

  /*
   * The chat session uses the Google account currently
   * signed into the browser/PWA.
   */
  chatFrame.src =
    `https://www.youtube.com/live_chat` +
    `?v=${encodeURIComponent(id)}` +
    `&embed_domain=${encodeURIComponent(EMBED_DOMAIN)}`;
}

loadBtn.addEventListener("click", loadStream);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadStream();
  }
});


/* =========================================================
   Google Account Switching
   ========================================================= */

/*
 * Google does not allow a third-party page to inspect or change the
 * account used inside the cross-origin YouTube iframe, so this opens
 * Google's account chooser instead.
 */
function switchGoogleAccount() {
  const chooserURL =
    "https://accounts.google.com/AccountChooser" +
    "?continue=" +
    encodeURIComponent("https://www.youtube.com/");

  window.open(chooserURL, "_blank", "noopener,noreferrer");
}

accountBtn.addEventListener("click", switchGoogleAccount);


/* =========================================================
   Fullscreen
   =========================================================
   Two modes:
   - native:  Fullscreen API on #container (desktop, Android, iPad)
   - pseudo:  CSS .pseudo-fullscreen fallback (iPhone Safari, or if
              the native request is rejected)

   #fs-exit lives inside #container, so it is visible in both.
   ========================================================= */

function nativeFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function isPseudoFullscreen() {
  return container.classList.contains("pseudo-fullscreen");
}

function setFullscreenUI(on) {
  document.body.classList.toggle("is-fullscreen", on);
}

function enterPseudoFullscreen() {
  container.classList.add("pseudo-fullscreen");
  setFullscreenUI(true);
  sessionStorage.setItem("isFullscreen", "true");
}

async function enterFullscreen() {
  const request =
    container.requestFullscreen || container.webkitRequestFullscreen;

  if (request) {
    try {
      await request.call(container);
      setFullscreenUI(true);
      return;
    } catch (error) {
      console.warn("Native fullscreen failed, using fallback:", error);
    }
  }

  enterPseudoFullscreen();
}

function exitFullscreen() {
  if (nativeFullscreenElement()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;

    try {
      const result = exit.call(document);
      if (result && result.catch) result.catch(() => {});
    } catch (_) {}
  }

  container.classList.remove("pseudo-fullscreen");
  setFullscreenUI(false);
  sessionStorage.setItem("isFullscreen", "false");
}

fsEnter.addEventListener("click", enterFullscreen);
fsExit.addEventListener("click", exitFullscreen);

/*
 * Keep UI in sync when the browser leaves native fullscreen itself
 * (Esc key, swipe gesture, etc.)
 */
function onNativeFullscreenChange() {
  if (nativeFullscreenElement()) {
    setFullscreenUI(true);
  } else if (!isPseudoFullscreen()) {
    setFullscreenUI(false);
  }
}

document.addEventListener("fullscreenchange", onNativeFullscreenChange);
document.addEventListener("webkitfullscreenchange", onNativeFullscreenChange);

/* Esc exits pseudo-fullscreen (native handles Esc on its own) */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isPseudoFullscreen()) {
    exitFullscreen();
  }
});


/* =========================================================
   Page restoration (iOS back/forward cache)
   ========================================================= */

window.addEventListener("pageshow", (event) => {
  updateVh();

  if (!event.persisted) {
    return;
  }

  if (sessionStorage.getItem("isFullscreen") === "true") {
    enterPseudoFullscreen();
  } else {
    container.classList.remove("pseudo-fullscreen");
    setFullscreenUI(false);
  }
});
