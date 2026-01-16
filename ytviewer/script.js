  const input = document.getElementById("yt-input");
  const loadBtn = document.getElementById("load-btn");
  const fsBtn = document.getElementById("fs-btn");
  const container = document.getElementById("container");
  const videoFrame = document.getElementById("video-frame");
  const chatFrame = document.getElementById("chat-frame");

  const EMBED_DOMAIN = "https://cwd273.github.io";

  /* Fix iOS viewport height */
  function updateVh() {
    document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
  }
  updateVh();
  window.addEventListener("resize", updateVh);

  function extractVideoId(value) {
    value = value.trim();
    if (!value.includes("http")) return value;

    try {
      const url = new URL(value);
      if (url.searchParams.has("v")) return url.searchParams.get("v");
      if (url.hostname.includes("youtu.be")) return url.pathname.split("/").pop();
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/").pop();
      if (url.pathname.startsWith("/live/")) return url.pathname.split("/").pop();
    } catch {}
    return null;
  }

  function loadStream() {
    const id = extractVideoId(input.value);
    if (!id) return alert("Invalid YouTube ID");

    videoFrame.src = `https://www.youtube.com/embed/${id}?controls=O`;
    chatFrame.src =
      `https://www.youtube.com/live_chat?v=${id}&embed_domain=${EMBED_DOMAIN}`;
  }

  loadBtn.onclick = loadStream;
  input.onkeydown = e => e.key === "Enter" && loadStream();

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  function toggleFullscreen() {
    const isFull =
      document.fullscreenElement ||
      container.classList.contains("pseudo-fullscreen");

    if (isFull) {
      // EXIT FULLSCREEN
      if (document.fullscreenElement) document.exitFullscreen();
      container.classList.remove("fullscreen", "pseudo-fullscreen");

      fsBtn.classList.remove("fullscreen-active");
      fsBtn.innerHTML = "<sup>⇱</sup><sub>⇲</sub>"; // enter icon
      return;
    }

    // ENTER FULLSCREEN
    if (!isIOS() && container.requestFullscreen) {
      container.requestFullscreen();
      container.classList.add("fullscreen");
    } else {
      container.classList.add("pseudo-fullscreen");
    }

    fsBtn.classList.add("fullscreen-active");
    fsBtn.innerHTML = "<sup>⇲</sup><sub>⇱</sub>"; // exit icon
  }

  fsBtn.onclick = toggleFullscreen;
