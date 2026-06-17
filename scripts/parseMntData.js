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

function addIfValue(target, key, value) {
  const normalized = clean(value);
  if (normalized) {
    target[key] = normalized;
  }
}

function buildTechnicalFlat(technicalByCategory) {
  const flat = {};
  Object.entries(technicalByCategory).forEach(([category, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      if (clean(value)) {
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
  const panelType = getValue("Panel");
  const resolution = getValue("Resolution (native)");
  const maxRefreshRate = getValue("Max Refresh Rate");
  const responseTimeGtG = getValue("Response time GtG");
  const responseTimeMPRT = getValue("Response time MPRT");
  const syncTechnology = getValue("Sync Technology");
  const hdr = getValue("HDR version VESA");
  const vesa = getValue("VESA Wallmount");
  const tilt = getValue("Tilt");
  const heightAdjust = getValue("Height Adjust (mm)");
  const pivot = getValue("Pivot");
  const bezelType = getValue("BezelType (Front)");
  const powerSupply = firstNonEmpty(getValue, ["Power supply", "Power Supply"]);
  const hdmiPorts = getValue("HDMI");
  const dpPorts = firstNonEmpty(getValue, ["DisplayPort", "Display Port"]);
  const usbC = getValue("USB-C");
  const usbHub = firstNonEmpty(getValue, ["USB hub", "USB Hub5"]);
  const audio = firstNonEmpty(getValue, ["Headphone out/Audio In", "Headphone out/Audio In8"]);
  const kvmSwitch = firstNonEmpty(getValue, ["Built-in KVM", "Built-in KVM7"]);
  const speakers = getValue("Speakers");
  const speakerPower = getValue("Speaker Power");

  const general = {};
  addIfValue(general, "Model Name", modelName);
  addIfValue(general, "Brand", brand);

  const displayPanel = {};
  addIfValue(displayPanel, "Panel Type", panelType);
  addIfValue(displayPanel, "Resolution", resolution);
  addIfValue(displayPanel, "Max Refresh Rate", maxRefreshRate);
  addIfValue(displayPanel, "Response Time GtG", responseTimeGtG);
  addIfValue(displayPanel, "Response Time MPRT", responseTimeMPRT);
  addIfValue(displayPanel, "Sync Technology", syncTechnology);
  addIfValue(displayPanel, "HDR", hdr);

  const connectivity = {};
  addIfValue(connectivity, "HDMI Ports", hdmiPorts);
  addIfValue(connectivity, "DisplayPort Ports", dpPorts);
  addIfValue(connectivity, "USB-C", usbC);
  addIfValue(connectivity, "USB Hub", usbHub);
  addIfValue(connectivity, "Audio", audio);
  addIfValue(connectivity, "KVM Switch", kvmSwitch);

  const physical = {};
  addIfValue(physical, "VESA", vesa);
  addIfValue(physical, "Tilt", tilt);
  addIfValue(physical, "Height Adjust", heightAdjust);
  addIfValue(physical, "Pivot", pivot);
  addIfValue(physical, "Bezel Type", bezelType);
  addIfValue(physical, "Power Supply", powerSupply);

  const sound = {};
  addIfValue(sound, "Speakers", speakers);
  addIfValue(sound, "Output power", speakerPower);

  const technicalByCategory = {
    General: general,
    "Display/Panel": displayPanel,
    Connectivity: connectivity,
    Physical: physical
  };

  if (Object.keys(sound).length > 0) {
    technicalByCategory.Sound = sound;
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
      panelType,
      resolution,
      maxRefreshRate,
      responseTimeGtG,
      responseTimeMPRT,
      syncTechnology,
      hdr,
      hdmiPorts,
      dpPorts,
      usbC,
      usbHub,
      audio,
      kvmSwitch,
      vesa,
      tilt,
      heightAdjust,
      pivot,
      bezelType,
      powerSupply,
      stand: [tilt, heightAdjust ? "Height " + heightAdjust : "", pivot].filter(Boolean).join(" | "),
      technicalByCategory,
      technicalFlat: buildTechnicalFlat(technicalByCategory),
      ports: [],
      features: {
        display: [resolution, maxRefreshRate, syncTechnology, hdr].filter(Boolean),
        connectivity: [hdmiPorts ? "HDMI " + hdmiPorts : "", dpPorts ? "DisplayPort " + dpPorts : "", usbC ? "USB-C " + usbC : "", kvmSwitch ? "KVM " + kvmSwitch : ""].filter(Boolean),
        physical: [vesa, bezelType, powerSupply].filter(Boolean)
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
