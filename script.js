const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
const video = document.getElementById("camera");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start-button");
const statusMessage = document.getElementById("status-message");
const featureList = document.getElementById("feature-list");
const suggestionText = document.getElementById("suggestion-text");
const loadingIndicator = document.getElementById("loading-indicator");

let detectionInterval = null;
let hiddenCanvas = null;

async function loadModels() {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]);
    startButton.disabled = false;
    statusMessage.textContent = "Bereit – starte die Kamera und blicke frontal hinein.";
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      "Modelle konnten nicht geladen werden. Bitte Seite neu laden oder Verbindung prüfen.";
  }
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusMessage.textContent = "Dein Browser unterstützt keine Kamerazugriffe.";
    return;
  }

  loadingIndicator.hidden = false;
  featureList.innerHTML = "<li>Warte auf Gesichtserkennung …</li>";
  suggestionText.textContent = "Wir sammeln gerade Daten zu deinen Gesichtszügen.";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      initializeCanvas();
      startDetectionLoop();
    };

    statusMessage.textContent =
      "Kamera aktiv – halte dein Gesicht mittig und ausreichend beleuchtet.";
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      "Kamera konnte nicht gestartet werden. Bitte erlaube den Zugriff oder wähle ein anderes Gerät.";
    loadingIndicator.hidden = true;
  }
}

function initializeCanvas() {
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
  overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);

  hiddenCanvas = hiddenCanvas || document.createElement("canvas");
  hiddenCanvas.width = video.videoWidth;
  hiddenCanvas.height = video.videoHeight;
}

function startDetectionLoop() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
  }

  detectionInterval = setInterval(async () => {
    if (video.paused || video.ended) {
      return;
    }

    const result = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
      .withFaceLandmarks(true);

    renderOverlay(result);

    if (result) {
      const analysis = analyzeFace(result);
      renderAnalysis(analysis);
      loadingIndicator.hidden = true;
    } else {
      statusMessage.textContent = "Bitte bleibe frontal im Bild und nutze weiches Licht.";
    }
  }, 700);
}

function renderOverlay(result) {
  const ctx = overlay.getContext("2d");
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (!result) {
    return;
  }

  const resized = faceapi.resizeResults(result, {
    width: overlay.width,
    height: overlay.height,
  });

  if (resized.detection) {
    faceapi.draw.drawDetections(overlay, [resized.detection]);
  } else {
    faceapi.draw.drawDetections(overlay, resized);
  }

  if (resized.landmarks) {
    faceapi.draw.drawFaceLandmarks(overlay, resized.landmarks);
  } else {
    faceapi.draw.drawFaceLandmarks(overlay, resized);
  }
}

function analyzeFace(result) {
  const { detection, landmarks } = result;
  const positions = landmarks.positions;

  const eyeColor = estimateEyeColor(positions);
  const forehead = estimateForehead(detection, landmarks);
  const jaw = estimateJaw(positions, detection);
  const symmetry = estimateSymmetry(positions, detection);

  const suggestion = generateSuggestion({ eyeColor, forehead, jaw, symmetry });

  return { eyeColor, forehead, jaw, symmetry, suggestion };
}

function estimateEyeColor(positions) {
  if (!hiddenCanvas) {
    return { label: "Keine Daten", detail: "", rgb: [0, 0, 0] };
  }

  const leftEye = landmarksToBox(positions.slice(36, 42));
  const rightEye = landmarksToBox(positions.slice(42, 48));
  const expanded = combineBoxes(leftEye, rightEye, 6);

  const ctx = hiddenCanvas.getContext("2d");
  ctx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

  const { x, y, width, height } = expanded;
  if (width <= 0 || height <= 0) {
    return { label: "Unbekannt", detail: "", rgb: [0, 0, 0] };
  }

  const imageData = ctx.getImageData(x, y, width, height).data;
  let r = 0;
  let g = 0;
  let b = 0;
  const totalPixels = imageData.length / 4;

  for (let i = 0; i < imageData.length; i += 4) {
    r += imageData[i];
    g += imageData[i + 1];
    b += imageData[i + 2];
  }

  const avgR = r / totalPixels;
  const avgG = g / totalPixels;
  const avgB = b / totalPixels;

  const { label, detail } = categorizeEyeColor(avgR, avgG, avgB);

  return { label, detail, rgb: [Math.round(avgR), Math.round(avgG), Math.round(avgB)] };
}

function landmarksToBox(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.max(Math.min(...xs), 0);
  const minY = Math.max(Math.min(...ys), 0);
  const maxX = Math.min(Math.max(...xs), hiddenCanvas.width);
  const maxY = Math.min(Math.max(...ys), hiddenCanvas.height);
  return {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

function combineBoxes(boxA, boxB, padding = 0) {
  const minX = Math.max(Math.min(boxA.x, boxB.x) - padding, 0);
  const minY = Math.max(Math.min(boxA.y, boxB.y) - padding, 0);
  const maxX = Math.min(
    Math.max(boxA.x + boxA.width, boxB.x + boxB.width) + padding,
    hiddenCanvas.width
  );
  const maxY = Math.min(
    Math.max(boxA.y + boxA.height, boxB.y + boxB.height) + padding,
    hiddenCanvas.height
  );

  return {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

function categorizeEyeColor(r, g, b) {
  const total = r + g + b;
  const normalizedR = r / total;
  const normalizedG = g / total;
  const normalizedB = b / total;

  if (normalizedB > 0.38 && normalizedG > 0.32) {
    return {
      label: "Blau",
      detail: "Kühle Augenfarbe – harmoniert wunderbar mit hellen, kühlen Nuancen.",
    };
  }

  if (normalizedG > 0.37 && normalizedB < 0.34) {
    return {
      label: "Grün",
      detail: "Warme Untertöne lassen deine Augenfarbe besonders strahlen.",
    };
  }

  if (normalizedR > 0.38 && normalizedG > 0.33 && normalizedB < 0.29) {
    return {
      label: "Hasel/Braun",
      detail: "Satte Töne und leichte Kontraste bringen Tiefe in den Look.",
    };
  }

  return {
    label: "Grau",
    detail: "Neutrale Farben und klare Konturen betonen deine Augen.",
  };
}

function estimateForehead(detection, landmarks) {
  const box = detection.box;
  const foreheadTop = box.y;
  const browLine = averageY(landmarks.getLeftEyeBrow().concat(landmarks.getRightEyeBrow()));
  const ratio = (browLine - foreheadTop) / box.height;

  let label = "Ausgeglichen";
  let detail = "Natürlich proportionierte Stirn – du kannst sowohl Pony als auch freies Gesicht tragen.";

  if (ratio > 0.3) {
    label = "Hoch";
    detail = "Ein weicher Pony oder Volumen auf Höhe der Schläfen schafft Balance.";
  } else if (ratio < 0.23) {
    label = "Niedrig";
    detail = "Sanfte Längen nach oben geöffnet strecken dein Gesicht optisch.";
  }

  return { label, detail, ratio: Number(ratio.toFixed(2)) };
}

function averageY(points) {
  return points.reduce((sum, point) => sum + point.y, 0) / points.length;
}

function estimateJaw(positions, detection) {
  const leftJaw = positions[4];
  const rightJaw = positions[12];
  const distance = euclidean(leftJaw, rightJaw);
  const ratio = distance / detection.box.width;

  let label = "Mittel";
  let detail = "Ausgeglichene Kieferlinie – vielseitige Schnitte stehen dir.";

  if (ratio > 0.78) {
    label = "Breit";
    detail = "Weiche Stufen und Volumen am Oberkopf sorgen für Balance.";
  } else if (ratio < 0.64) {
    label = "Schmal";
    detail = "Seitliche Fülle und strukturierte Enden geben dem Gesicht mehr Präsenz.";
  }

  return { label, detail, ratio: Number(ratio.toFixed(2)) };
}

function estimateSymmetry(positions, detection) {
  const centerX = detection.box.x + detection.box.width / 2;
  const pairs = [
    [36, 45],
    [39, 42],
    [31, 35],
    [48, 54],
    [3, 13],
  ];

  let difference = 0;

  pairs.forEach(([leftIndex, rightIndex]) => {
    const left = positions[leftIndex];
    const right = positions[rightIndex];
    const leftDistance = centerX - left.x;
    const rightDistance = right.x - centerX;
    difference += Math.abs(leftDistance - rightDistance);
  });

  const normalizedDifference = difference / (pairs.length * detection.box.width * 0.5);
  const symmetryScore = Math.max(0, 1 - normalizedDifference);

  let label = "Ausgeglichen";
  let detail = "Sehr harmonische Proportionen – präzise Schnitte wirken bei dir besonders elegant.";

  if (symmetryScore > 0.9) {
    label = "Sehr symmetrisch";
    detail = "Du kannst klare Mittelscheitel oder grafische Schnitte hervorragend tragen.";
  } else if (symmetryScore < 0.78) {
    label = "Leicht asymmetrisch";
    detail = "Asymmetrische Details oder seitliche Ponys setzen spannende Akzente.";
  }

  return { label, detail, score: Number(symmetryScore.toFixed(2)) };
}

function euclidean(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function generateSuggestion({ eyeColor, forehead, jaw, symmetry }) {
  const lines = [];

  switch (eyeColor.label) {
    case "Blau":
      lines.push("Kühle Balayage-Töne oder aschige Nuancen lassen deine Augen strahlen.");
      break;
    case "Grün":
      lines.push("Goldene Highlights oder warme Kupfertöne verstärken den lebendigen Blick.");
      break;
    case "Hasel/Braun":
      lines.push("Satte Schokoladen- oder karamellige Nuancen geben deinen Augen Tiefe.");
      break;
    default:
      lines.push("Neutrale oder platinblonde Highlights betonen deine ruhige Augenfarbe.");
  }

  if (forehead.label === "Hoch") {
    lines.push("Ein texturierter, leicht fransiger Pony verkürzt die Stirn optisch.");
  } else if (forehead.label === "Niedrig") {
    lines.push("Volumen am Oberkopf und seitlich auslaufende Fransen strecken dein Gesicht.");
  } else {
    lines.push("Spiel mit Mittelscheitel oder soften Curtain Bangs für variable Looks.");
  }

  if (jaw.label === "Breit") {
    lines.push("Stufige Längen, die unterhalb des Kiefers enden, sorgen für eine schmale Silhouette.");
  } else if (jaw.label === "Schmal") {
    lines.push("Ein kinnlanger Bob oder Waves mit seitlicher Fülle wirken besonders harmonisch.");
  } else {
    lines.push("Ein moderner Long Bob mit sanften Waves bringt Bewegung ohne die Balance zu verlieren.");
  }

  if (symmetry.label === "Leicht asymmetrisch") {
    lines.push("Probiere einen seitlichen Scheitel oder einen Asymmetry-Bob für zusätzliche Dynamik.");
  } else {
    lines.push("Klar definierte Linien und präzise Schnitte unterstreichen deine natürliche Symmetrie.");
  }

  return lines.join(" ");
}

function renderAnalysis({ eyeColor, forehead, jaw, symmetry, suggestion }) {
  featureList.innerHTML = "";

  const items = [
    {
      label: "Augenfarbe",
      value: `${eyeColor.label} (RGB ${eyeColor.rgb.join(", ")})`,
      detail: eyeColor.detail,
    },
    {
      label: "Stirnhöhe",
      value: `${forehead.label} (Verhältnis ${forehead.ratio})`,
      detail: forehead.detail,
    },
    {
      label: "Kieferbreite",
      value: `${jaw.label} (Verhältnis ${jaw.ratio})`,
      detail: jaw.detail,
    },
    {
      label: "Symmetrie",
      value: `${symmetry.label} (Score ${symmetry.score})`,
      detail: symmetry.detail,
    },
  ];

  items.forEach(({ label, value, detail }) => {
    const li = document.createElement("li");

    const labelSpan = document.createElement("span");
    labelSpan.className = "label";
    labelSpan.textContent = label;

    const valueSpan = document.createElement("span");
    valueSpan.className = "value";
    valueSpan.textContent = value;

    const detailSpan = document.createElement("span");
    detailSpan.className = "detail";
    detailSpan.textContent = detail;

    li.appendChild(labelSpan);
    li.appendChild(valueSpan);
    li.appendChild(detailSpan);

    featureList.appendChild(li);
  });

  suggestionText.textContent = suggestion;
}

startButton.addEventListener("click", () => {
  startButton.disabled = true;
  startButton.textContent = "Kamera aktiv";
  startCamera();
});

loadModels();
