const input = document.getElementById("yt-input");
const loadBtn = document.getElementById("load-btn");

const accountBtn = document.getElementById("account-btn");
const installBtn = document.getElementById("install-btn");

const fsEnter = document.getElementById("fs-enter");
const fsExit = document.getElementById("fs-exit");

const container = document.getElementById("container");
const videoFrame = document.getElementById("video-frame");
const chatFrame = document.getElementById("chat-frame");

const iosInstallMessage =
  document.getElementById("ios-install-message");

const iosInstallClose =
  document.getElementById("ios-install-close");

const EMBED_DOMAIN =
  window.location.hostname || "cwd273.github.io";


/* =========================================================
   PWA
   ========================================================= */

let deferredInstallPrompt = null;


/*
 * Register service worker
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register("./sw.js");

      console.log(
        "Service worker registered:",
        registration.scope
      );
    } catch (error) {
      console.error(
        "Service worker registration failed:",
        error
      );
    }
  });
}


/*
 * Android / Chrome / Edge install prompt
 */
window.addEventListener("beforeinstallprompt", (event) => {

  // Prevent browser from immediately displaying its own prompt
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

  const result =
    await deferredInstallPrompt.userChoice;

  console.log(
    "PWA install result:",
    result.outcome
  );

  deferredInstallPrompt = null;

  installBtn.style.display = "none";
});


window.addEventListener("appinstalled", () => {

  console.log("PWA installed");

  deferredInstallPrompt = null;

  installBtn.style.display = "none";
});


/*
 * Determine whether the site is already running as a PWA
 */
function isStandalonePWA() {

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}


/*
 * iOS detection
 */
function isIOS() {

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1
    );
}


/*
 * Show iOS installation instructions
 */
function showIOSInstallInstructions() {

  if (!isIOS()) {
    alert(
      "Use your browser's Install App or Add to Home Screen option."
    );
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


/*
 * Don't show install button if already installed
 */
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


/*
 * iOS Safari does not always fire resize when returning
 * through the back button.
 */
window.addEventListener("pageshow", (event) => {

  updateVh();

  if (event.persisted) {

    const wasFullscreen =
      sessionStorage.getItem("isFullscreen") === "true";

    if (wasFullscreen) {

      container.classList.add("pseudo-fullscreen");
      document.body.classList.add("is-fullscreen");

    } else {

      container.classList.remove(
        "fullscreen",
        "pseudo-fullscreen"
      );

      document.body.classList.remove(
        "is-fullscreen"
      );

    }

  }

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

  /*
   * Allow direct video IDs
   */
  if (!value.includes("http")) {
    return value;
  }

  try {

    const url = new URL(value);

    /*
     * Normal YouTube URL
     * youtube.com/watch?v=XXXXXXXXXXX
     */
    if (url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }

    /*
     * Short URL
     * youtu.be/XXXXXXXXXXX
     */
    if (url.hostname.includes("youtu.be")) {
      return url.pathname
        .split("/")
        .filter(Boolean)
        .pop();
    }

    /*
     * Embed URL
     */
    if (url.pathname.startsWith("/embed/")) {
      return url.pathname
        .split("/")
        .filter(Boolean)
        .pop();
    }

    /*
     * Live URL
     * youtube.com/live/XXXXXXXXXXX
     */
    if (url.pathname.startsWith("/live/")) {
      return url.pathname
        .split("/")
        .filter(Boolean)
        .pop();
    }

  } catch (error) {

    console.error(
      "Unable to parse YouTube URL:",
      error
    );

  }

  return null;
}


/*
 * Load YouTube stream and live chat
 */
function loadStream() {

  const id = extractVideoId(input.value);

  if (!id) {

    alert("Invalid YouTube ID or URL");

    return;
  }


  /*
   * YouTube player
   */
  videoFrame.src =
    `https://www.youtube.com/embed/${encodeURIComponent(id)}` +
    `?autoplay=1` +
    `&rel=0` +
    `&enablejsapi=1`;


  /*
   * YouTube Live Chat
   *
   * The chat session uses the Google account currently
   * signed into the browser/PWA.
   */
  chatFrame.src =
    `https://www.youtube.com/live_chat` +
    `?v=${encodeURIComponent(id)}` +
    `&embed_domain=${encodeURIComponent(EMBED_DOMAIN)}`;

}


/*
 * Load button
 */
loadBtn.addEventListener("click", loadStream);


/*
 * Enter key
 */
input.addEventListener("keydown", (event) => {

  if (event.key === "Enter") {
    loadStream();
  }

});


/* =========================================================
   Google Account Switching
   ========================================================= */

/*
 * IMPORTANT:
 *
 * Google does not allow a third-party webpage to directly
 * inspect or change the Google account used inside the
 * cross-origin YouTube iframe.
 *
 * Therefore this opens Google's account chooser and sends
 * the user to YouTube after selecting an account.
 */
function switchGoogleAccount() {

  const youtubeURL =
    "https://www.youtube.com/";

  const chooserURL =
    "https://accounts.google.com/AccountChooser" +
    "?continue=" +
    encodeURIComponent(youtubeURL);

  window.open(
    chooserURL,
    "_blank",
    "noopener,noreferrer"
  );

}


accountBtn.addEventListener(
  "click",
  switchGoogleAccount
);


/* =========================================================
   Fullscreen
   ========================================================= */

function enterFullscreen() {

  if (!isIOS() && container.requestFullscreen) {

    container.requestFullscreen()
      .catch((error) => {
        console.error(
          "Fullscreen request failed:",
          error
        );
      });

    container.classList.add("fullscreen");

  } else {

    /*
     * iOS Safari does not provide normal
     * element.requestFullscreen() behavior.
     *
     * Use pseudo-fullscreen instead.
     */
    container.classList.add(
      "pseudo-fullscreen"
    );

  }

  document.body.classList.add(
    "is-fullscreen"
  );

  sessionStorage.setItem(
    "isFullscreen",
    "true"
  );

}


function exitFullscreen() {

  if (document.fullscreenElement) {

    document.exitFullscreen()
      .catch(() => {});

  }

  container.classList.remove(
    "fullscreen",
    "pseudo-fullscreen"
  );

  document.body.classList.remove(
    "is-fullscreen"
  );

  sessionStorage.setItem(
    "isFullscreen",
    "false"
  );

}


fsEnter.addEventListener(
  "click",
  enterFullscreen
);

fsExit.addEventListener(
  "click",
  exitFullscreen
);


/*
 * Browser fullscreen changes
 */
document.addEventListener(
  "fullscreenchange",
  () => {

    if (!document.fullscreenElement) {

      container.classList.remove(
        "fullscreen"
      );

      /*
       * Don't remove pseudo-fullscreen here.
       * It is used by iOS.
       */
      if (!isIOS()) {

        document.body.classList.remove(
          "is-fullscreen"
        );

        sessionStorage.setItem(
          "isFullscreen",
          "false"
        );

      }

    }

  }
);


/* =========================================================
   Restore fullscreen after PWA/page restoration
   ========================================================= */

window.addEventListener("pageshow", () => {

  if (
    sessionStorage.getItem("isFullscreen") === "true"
  ) {

    container.classList.add(
      "pseudo-fullscreen"
    );

    document.body.classList.add(
      "is-fullscreen"
    );

  }

});
