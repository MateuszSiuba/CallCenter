const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "ROADMAP.csv");
const outputPath = path.join(projectRoot, "mnt-parsed.json");

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ";" && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content) {
  const rows = [];
  let currentLine = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentLine += char + nextChar;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      rows.push(parseCsvLine(currentLine));
      currentLine = "";
      continue;
    }

    currentLine += char;
  }

  if (currentLine.length > 0) {
    rows.push(parseCsvLine(currentLine));
  }

  return rows;
}

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function createRowReader(headers, row) {
  const firstIndexByHeader = new Map();
  headers.forEach((header, index) => {
    const key = clean(header);
    if (key && !firstIndexByHeader.has(key)) {
      firstIndexByHeader.set(key, index);
    }
  });

  return function getValue(headerName) {
    const index = firstIndexByHeader.get(headerName);
    return typeof index === "number" ? clean(row[index]) : "";
  };
}

function firstNonEmpty(getValue, headerNames) {
  for (const headerName of headerNames) {
    const value = getValue(headerName);
    if (value) {
      return value;
    }
  }
  return "";
}

function isUnavailable(value, options) {
  const text = clean(value);
  const lowerText = text.toLowerCase();
  if (!text || text === "-" || lowerText.includes("tbc") || lowerText.includes("tbd")) {
    return true;
  }

  if (options && options.forBox && (/^0(?:\s*=\s*no)?$/i.test(text) || /^no$/i.test(text))) {
    return true;
  }

  return false;
}

function addIfValue(target, key, value) {
  const normalized = clean(value);
  if (!isUnavailable(normalized)) {
    target[key] = normalized;
  }
}

function addIfBoxValue(target, key, value) {
  const normalized = clean(value);
  if (!isUnavailable(normalized, { forBox: true })) {
    target[key] = "Included";
  }
}

function formatAspectRatio(value) {
  return clean(value).replace(/^(\d+):0?(\d+)$/, "$1:$2");
}

function formatStaticContrast(value) {
  return clean(value).replace(/^(\d+):0?1:00$/, "$1:1");
}


function formatPivot(value) {
  const text = clean(value);
  if (/^-?\d+(?:[.,]\d+)?$/.test(text)) {
    return text.replace(",", ".") + "\u00b0";
  }
  return text;
}

function formatVesa(value) {
  return clean(value).replace(/^(\d+)x(\d+)$/i, "$1 x $2");
}


function formatBoxPresence(value) {
  const text = clean(value);
  return isUnavailable(text, { forBox: true }) ? "" : "Included";
}

function formatTiltValue(value) {
  const text = clean(value);
  const normalizedNumber = Number(text.replace(",", "."));

  if (Number.isFinite(normalizedNumber) && normalizedNumber < 0 && normalizedNumber > -1) {
    const upperValue = 5 / Math.abs(normalizedNumber);
    const formattedUpper = Number.isInteger(upperValue)
      ? String(upperValue)
      : String(Math.round(upperValue * 10) / 10);
    return "-5/" + formattedUpper + "\u00b0";
  }

  if (/^-?\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/.test(text)) {
    return text.replace(",", ".") + "\u00b0";
  }

  return text;
}

function formatSwivelValue(value) {
  const text = clean(value);
  if (text === "-1") {
    return "-180/180\u00b0";
  }
  if (/^-?\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/.test(text)) {
    return text.replace(",", ".") + "\u00b0";
  }
  return text;
}

function buildAdaptiveSync(syncTechnology, amdFreeSync, nvidiaGSync) {
  const syncParts = [];
  if (clean(amdFreeSync) && !/^no$/i.test(clean(amdFreeSync))) {
    syncParts.push(clean(amdFreeSync));
  }
  if (clean(nvidiaGSync) && !/^no$/i.test(clean(nvidiaGSync))) {
    syncParts.push(clean(nvidiaGSync));
  }
  return syncParts.length > 0 ? syncParts.join("/") : clean(syncTechnology);
}

function addFeature(features, value) {
  const text = clean(value);
  if (!isUnavailable(text) && !/^no$/i.test(text) && !features.includes(text)) {
    features.push(text);
  }
}

function buildTechnicalFlat(technicalByCategory) {
  const flat = {};
  Object.entries(technicalByCategory).forEach(([category, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      if (!isUnavailable(value)) {
        flat[category + " :: " + key] = value;
      }
    });
  });
  return flat;
}

function buildModel(headers, row, index) {
  const getValue = createRowReader(headers, row);
  const modelName = getValue("Model name");
  if (!modelName) {
    return null;
  }

  const brand = getValue("Brand");
  const productLine = getValue("Product Line");
  const warranty = getValue("Warranty Period");
  const aspectRatio = formatAspectRatio(getValue("Aspect ratio"));
  const curved = getValue("Curvature");
  const touch = getValue("Touch");
  const panelType = getValue("Panel");
  const backlight = getValue("Backlight");
  const resolution = getValue("Resolution (native)");
  const maxRefreshRate = getValue("Max Refresh Rate");
  const responseTimeGtG = getValue("Response time GtG");
  const responseTimeMPRT = getValue("Response time MPRT");
  const brightnessMax = getValue("Brightness (max)");
  const contrastStatic = formatStaticContrast(getValue("Contrast (static)"));
  const syncTechnology = getValue("Sync Technology");
  const amdFreeSync = getValue("AMD FreeSync Certified");
  const nvidiaGSync = getValue("NVIDIA G-Sync Certified");
  const adaptiveSync = buildAdaptiveSync(syncTechnology, amdFreeSync, nvidiaGSync);
  const hdr = getValue("HDR version VESA");
  const vesa = formatVesa(getValue("VESA Wallmount"));
  const tilt = formatTiltValue(getValue("Tilt"));
  const heightAdjust = getValue("Height Adjust (mm)");
  const pivot = formatPivot(getValue("Pivot"));
  const swivel = formatSwivelValue(getValue("Swivel"));
  const webcam = getValue("Webcam");
  const powerSensorLightSensor = getValue("Powersensor/Lightsensor");
  const bezelType = getValue("BezelType (Front)");
  const bezelColour = getValue("Bezel colour (Front)");
  const cabinetColour = getValue("Cabinet colour (backside)");
  const powerSupply = firstNonEmpty(getValue, ["Power supply", "Power Supply"]);
  const hdmiPorts = getValue("HDMI");
  const dpPorts = firstNonEmpty(getValue, ["DisplayPort", "Display Port"]);
  const usbC = getValue("USB-C");
  const usbHub = firstNonEmpty(getValue, ["USB hub", "USB Hub5"]);
  const rj45 = firstNonEmpty(getValue, ["RJ45", "RJ-45"]);
  const audio = firstNonEmpty(getValue, ["Headphone out/Audio In", "Headphone out/Audio In8"]);
  const kvmSwitch = firstNonEmpty(getValue, ["Built-in KVM", "Built-in KVM7"]);
  const speakers = getValue("Speakers");
  const speakerPower = getValue("Speaker Power");
  const vgaCable = formatBoxPresence(getValue("VGA cable"));
  const dviCable = formatBoxPresence(getValue("DVI cable"));
  const hdmiCable = formatBoxPresence(getValue("HDMI cable"));
  const displayPortCable = formatBoxPresence(getValue("Displayport Cable"));
  const miniDpCable = formatBoxPresence(getValue("Mini-DP cable"));
  const audioCable = formatBoxPresence(getValue("Audio Cable"));
  const usbAToBCable = formatBoxPresence(getValue("USB-A to B Cable"));
  const usbCCable = formatBoxPresence(getValue("USB-C Cable"));
  const remoteControl = formatBoxPresence(getValue("Remote Control"));
  const ecmaEcoDeclaration = getValue("ECMA Eco Declaration");
  const blueLightHardware = getValue("Blue Light technology Hardware (Certified)");
  const tcoEdge = getValue("TCO EDGE");

  const general = {};
  addIfValue(general, "Model Name", modelName);
  addIfValue(general, "Brand", brand);
  addIfValue(general, "Warranty", warranty);

  const displayPanel = {};
  addIfValue(displayPanel, "Panel Type", panelType);
  addIfValue(displayPanel, "Resolution", resolution);
  addIfValue(displayPanel, "Warranty", warranty);
  addIfValue(displayPanel, "Aspect Ratio", aspectRatio);
  addIfValue(displayPanel, "Curved", curved);
  addIfValue(displayPanel, "Backlight", backlight);
  addIfValue(displayPanel, "Max Refresh Rate", maxRefreshRate);
  addIfValue(displayPanel, "Response Time GtG", responseTimeGtG);
  addIfValue(displayPanel, "Response Time MPRT", responseTimeMPRT);
  addIfValue(displayPanel, "Brightness (max)", brightnessMax);
  addIfValue(displayPanel, "Contrast (static)", contrastStatic);
  addIfValue(displayPanel, "Touch", touch);
  addIfValue(displayPanel, "Sync Technology", syncTechnology);
  addIfValue(displayPanel, "HDR", hdr);

  const connectivity = {};
  addIfValue(connectivity, "HDMI Ports", hdmiPorts);
  addIfValue(connectivity, "DisplayPort Ports", dpPorts);
  addIfValue(connectivity, "USB-C", usbC);
  addIfValue(connectivity, "USB Hub", usbHub);
  addIfValue(connectivity, "KVM Switch", kvmSwitch);
  addIfValue(connectivity, "Adaptive Sync", adaptiveSync);
  addIfValue(connectivity, "RJ45", rj45);
  addIfValue(connectivity, "Headphone out/Audio In", audio);

  const physical = {};
  addIfValue(physical, "VESA", vesa);
  addIfValue(physical, "Tilt", tilt);
  addIfValue(physical, "Height Adjust", heightAdjust);
  addIfValue(physical, "Pivot", pivot);
  addIfValue(physical, "Swivel", swivel);
  addIfValue(physical, "VESA Wallmount", vesa);
  addIfValue(physical, "Webcam", webcam);
  addIfValue(physical, "Bezel Type", bezelType);
  addIfValue(physical, "BezelType (Front)", bezelType);
  addIfValue(physical, "Bezel colour (Front)", bezelColour);
  addIfValue(physical, "Cabinet colour (backside)", cabinetColour);
  addIfValue(physical, "Powersensor/Lightsensor", powerSensorLightSensor);
  addIfValue(physical, "Power Supply", powerSupply);

  const sound = {};
  addIfValue(sound, "Speakers", speakers);
  addIfValue(sound, "Speaker power", speakerPower);

  const inTheBox = {};
  addIfBoxValue(inTheBox, "VGA cable", vgaCable);
  addIfBoxValue(inTheBox, "DVI cable", dviCable);
  addIfBoxValue(inTheBox, "HDMI cable", hdmiCable);
  addIfBoxValue(inTheBox, "Displayport Cable", displayPortCable);
  addIfBoxValue(inTheBox, "Mini-DP cable", miniDpCable);
  addIfBoxValue(inTheBox, "Audio Cable", audioCable);
  addIfBoxValue(inTheBox, "USB-A to B Cable", usbAToBCable);
  addIfBoxValue(inTheBox, "USB-C Cable", usbCCable);
  addIfBoxValue(inTheBox, "Remote Control", remoteControl);

  const technicalByCategory = {
    General: general,
    "Display/Panel": displayPanel,
    Connectivity: connectivity,
    Physical: physical,
    "What's in the box": inTheBox
  };

  if (Object.keys(sound).length > 0) {
    technicalByCategory.Sound = sound;
  }

  const knowledgeFeatures = [];
  addFeature(knowledgeFeatures, productLine);
  addFeature(knowledgeFeatures, ecmaEcoDeclaration ? "ECMA Eco Declaration" : "");
  addFeature(knowledgeFeatures, blueLightHardware ? "Blue Light technology Hardware (Certified)" : "");
  addFeature(knowledgeFeatures, tcoEdge);
  if (/(\d{3,})\s*hz/i.test(maxRefreshRate)) {
    addFeature(knowledgeFeatures, maxRefreshRate.replace(/\s+/g, ""));
  }

  return {
    id: "mnt-" + modelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + String(index + 1),
    productType: "MNT",
    module: "MNT",
    brand,
    year: 2026,
    modelName,
    availableSizes: [],
    aliases: [],
    osProfileId: "Monitor",
    panelType,
    status: "roadmap",
    notes: "",
    specs: {
      brand,
      modelName,
      productLine,
      warranty,
      panelType,
      aspectRatio,
      curved,
      backlight,
      touch,
      resolution,
      maxRefreshRate,
      responseTimeGtG,
      responseTimeMPRT,
      brightnessMax,
      contrastStatic,
      syncTechnology,
      adaptiveSync,
      hdr,
      hdmiPorts,
      dpPorts,
      usbC,
      usbHub,
      rj45,
      audio,
      kvmSwitch,
      vesa,
      tilt,
      heightAdjust,
      pivot,
      swivel,
      webcam,
      powerSensorLightSensor,
      bezelType,
      bezelColour,
      cabinetColour,
      powerSupply,
      stand: [tilt, heightAdjust ? "Height " + heightAdjust : "", pivot].filter(Boolean).join(" | "),
      technicalByCategory,
      technicalFlat: buildTechnicalFlat(technicalByCategory),
      ports: [],
      features: {
        display: [productLine, resolution, maxRefreshRate, adaptiveSync, hdr].filter(Boolean),
        connectivity: [hdmiPorts ? "HDMI " + hdmiPorts : "", dpPorts ? "DisplayPort " + dpPorts : "", usbC ? "USB-C " + usbC : "", kvmSwitch ? "KVM " + kvmSwitch : ""].filter(Boolean),
        physical: [vesa, bezelType, powerSupply].filter(Boolean),
        knowledge: knowledgeFeatures
      },
      rawSource: Object.fromEntries(headers.map((header, headerIndex) => [header || "Column " + String(headerIndex + 1), clean(row[headerIndex])]))
    },
    audioChannels: speakers,
    audioPower: speakerPower,
    wifiStandard: "",
    bluetoothVersion: "",
    vrrMaxRefreshRate: maxRefreshRate
  };
}

function main() {
  const content = fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(content);
  const headers = rows[1] || [];
  const models = rows
    .slice(2)
    .map((row, index) => buildModel(headers, row, index))
    .filter(Boolean);

  fs.writeFileSync(outputPath, JSON.stringify(models, null, 2) + "\n", "utf8");
  console.log("Parsed " + models.length + " MNT models to " + path.relative(projectRoot, outputPath));
}

main();
