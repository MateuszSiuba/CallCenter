const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const TARGETS = {
  models: {
    filePath: path.join("data", "models.js"),
    varName: "ModelsData",
    templateValue: []
  },
  knowledge: {
    filePath: path.join("data", "knowledge.js"),
    varName: "KnowledgeBaseData",
    templateValue: []
  },
  policies: {
    filePath: path.join("data", "policies.js"),
    varName: "PoliciesData",
    templateValue: {}
  }
};

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPrimitive(value) {
  return value === null || (typeof value !== "object" && typeof value !== "function");
}

function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map(cloneDeep);
  }

  if (isPlainObject(value)) {
    const out = {};
    Object.keys(value).forEach((key) => {
      out[key] = cloneDeep(value[key]);
    });
    return out;
  }

  return value;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" + value.map((item) => stableStringify(item)).join(",") + "]";
  }

  const keys = Object.keys(value).sort();
  return (
    "{" +
    keys
      .map((key) => JSON.stringify(key) + ":" + stableStringify(value[key]))
      .join(",") +
    "}"
  );
}

function deepEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

function arrayUnion(dbArray, newArray) {
  const out = [];
  const seen = new Set();

  [...dbArray, ...newArray].forEach((item) => {
    const hash = stableStringify(item);
    if (seen.has(hash)) {
      return;
    }
    seen.add(hash);
    out.push(cloneDeep(item));
  });

  return out;
}

function normalizeModelName(name) {
  return String(name || "")
    .trim()
    .toUpperCase();
}

function findExactModelMatch(database, newModelName) {
  const incomingNormalized = normalizeModelName(newModelName);
  if (!incomingNormalized) {
    return -1;
  }

  for (let index = 0; index < database.length; index += 1) {
    const entry = database[index];
    if (!isPlainObject(entry)) {
      continue;
    }

    const databaseNormalized = normalizeModelName(entry.modelName);
    if (databaseNormalized && databaseNormalized === incomingNormalized) {
      return index;
    }
  }

  return -1;
}

function printValue(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  return JSON.stringify(value);
}

function logConflict(context, pathParts, dbVal, newVal) {
  const warningIcon = "\u26A0\uFE0F";
  const pathText = pathParts.join(".") || "root";
  const message = `${warningIcon} CONFLICT for [${context}] in [${pathText}]: DB has "${printValue(
    dbVal
  )}", New Data says "${printValue(newVal)}". Kept DB value. Manual review required.`;

  console.warn(message);

  return {
    context,
    path: pathText,
    dbValue: printValue(dbVal),
    newValue: printValue(newVal),
    message
  };
}

function mergeInto(dbNode, newNode, pathParts, context, stats) {
  Object.keys(newNode).forEach((key) => {
    const dbHasKey = Object.prototype.hasOwnProperty.call(dbNode, key);
    const dbVal = dbNode[key];
    const newVal = newNode[key];
    const nextPath = [...pathParts, key];

    if (!dbHasKey || !dbVal) {
      dbNode[key] = cloneDeep(newVal);
      return;
    }

    if (Array.isArray(dbVal) && Array.isArray(newVal)) {
      dbNode[key] = arrayUnion(dbVal, newVal);
      return;
    }

    if (isPlainObject(dbVal) && isPlainObject(newVal)) {
      mergeInto(dbVal, newVal, nextPath, context, stats);
      return;
    }

    if (isPrimitive(dbVal) && isPrimitive(newVal)) {
      if (dbVal !== newVal) {
        stats.conflicts.push(logConflict(context, nextPath, dbVal, newVal));
      }
      return;
    }

    if (!deepEqual(dbVal, newVal)) {
      stats.conflicts.push(logConflict(context, nextPath, dbVal, newVal));
    }
  });
}

function mergeModel(databaseModel, incomingModel, stats) {
  Object.keys(incomingModel).forEach((rootKey) => {
    if (rootKey === "modelName") {
      return;
    }

    const incomingValue = incomingModel[rootKey];
    const hasRootKey = Object.prototype.hasOwnProperty.call(databaseModel, rootKey);

    if (!hasRootKey || !databaseModel[rootKey]) {
      databaseModel[rootKey] = cloneDeep(incomingValue);
      return;
    }

    if (Array.isArray(databaseModel[rootKey]) && Array.isArray(incomingValue)) {
      databaseModel[rootKey] = arrayUnion(databaseModel[rootKey], incomingValue);
      return;
    }

    const context = databaseModel.modelName || incomingModel.modelName || "UNKNOWN_MODEL";

    if (isPlainObject(databaseModel[rootKey]) && isPlainObject(incomingValue)) {
      mergeInto(databaseModel[rootKey], incomingValue, [rootKey], context, stats);
      return;
    }

    if (isPrimitive(databaseModel[rootKey]) && isPrimitive(incomingValue)) {
      if (databaseModel[rootKey] !== incomingValue) {
        stats.conflicts.push(logConflict(context, [rootKey], databaseModel[rootKey], incomingValue));
      }
      return;
    }

    if (!deepEqual(databaseModel[rootKey], incomingValue)) {
      stats.conflicts.push(logConflict(context, [rootKey], databaseModel[rootKey], incomingValue));
    }
  });
}

function mergeArrayRoot(dbArray, newArray, targetName, stats) {
  const hasModelItems = newArray.some(
    (item) => isPlainObject(item) && typeof item.modelName === "string"
  );

  if (!hasModelItems) {
    const before = dbArray.length;
    const merged = arrayUnion(dbArray, newArray);
    stats.inserted += Math.max(0, merged.length - before);
    return merged;
  }

  const out = dbArray.map(cloneDeep);

  newArray.forEach((incomingItem) => {
    if (!isPlainObject(incomingItem)) {
      const hash = stableStringify(incomingItem);
      const exists = out.some((item) => stableStringify(item) === hash);
      if (!exists) {
        out.push(cloneDeep(incomingItem));
        stats.inserted += 1;
      }
      return;
    }

    if (typeof incomingItem.modelName !== "string" || !incomingItem.modelName.trim()) {
      const hash = stableStringify(incomingItem);
      const exists = out.some((item) => stableStringify(item) === hash);
      if (!exists) {
        out.push(cloneDeep(incomingItem));
        stats.inserted += 1;
      }
      return;
    }

    const existingIndex = findExactModelMatch(out, incomingItem.modelName);
    if (existingIndex === -1) {
      out.push(cloneDeep(incomingItem));
      stats.inserted += 1;
      return;
    }

    mergeModel(out[existingIndex], incomingItem, stats);
    stats.merged += 1;
  });

  return out;
}

function mergeRootData(databaseData, incomingData, targetName, stats) {
  if (Array.isArray(databaseData) && Array.isArray(incomingData)) {
    return mergeArrayRoot(databaseData, incomingData, targetName, stats);
  }

  if (isPlainObject(databaseData) && isPlainObject(incomingData)) {
    const out = cloneDeep(databaseData);
    mergeInto(out, incomingData, [targetName], targetName, stats);
    return out;
  }

  if (!databaseData) {
    return cloneDeep(incomingData);
  }

  if (isPrimitive(databaseData) && isPrimitive(incomingData)) {
    if (databaseData !== incomingData) {
      stats.conflicts.push(logConflict(targetName, [targetName], databaseData, incomingData));
    }
    return databaseData;
  }

  if (!deepEqual(databaseData, incomingData)) {
    stats.conflicts.push(logConflict(targetName, [targetName], databaseData, incomingData));
  }

  return databaseData;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMatchingLiteralEnd(text, startIndex) {
  const stack = [];
  let inString = null;
  let escapeNext = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      const opener = stack.pop();
      if (!opener) {
        throw new Error("Invalid JS literal: unexpected closing bracket.");
      }
      if (opener === "{" && ch !== "}") {
        throw new Error("Invalid JS literal: mismatched bracket.");
      }
      if (opener === "[" && ch !== "]") {
        throw new Error("Invalid JS literal: mismatched bracket.");
      }
      if (stack.length === 0) {
        return i;
      }
    }
  }

  throw new Error("Could not find end of JS literal.");
}

function locateAssignedLiteral(source, varName) {
  const escaped = escapeRegExp(varName);
  const declarationPatterns = [
    new RegExp(`(?:const|let|var)\\s+${escaped}\\s*=`, "m"),
    new RegExp(`window\\.${escaped}\\s*=`, "m")
  ];

  let match = null;
  for (const pattern of declarationPatterns) {
    const found = source.match(pattern);
    if (found && typeof found.index === "number") {
      if (!match || found.index < match.index) {
        match = found;
      }
    }
  }

  if (!match) {
    return null;
  }

  const statementStart = match.index;
  let valueStart = statementStart + match[0].length;

  while (valueStart < source.length && /\s/.test(source[valueStart])) {
    valueStart += 1;
  }

  const startChar = source[valueStart];
  if (startChar !== "[" && startChar !== "{") {
    throw new Error(`Expected array/object literal for ${varName}.`);
  }

  const valueEnd = findMatchingLiteralEnd(source, valueStart);

  let statementEnd = valueEnd;
  let cursor = valueEnd + 1;
  while (cursor < source.length && /\s/.test(source[cursor])) {
    cursor += 1;
  }
  if (source[cursor] === ";") {
    statementEnd = cursor;
  }

  return {
    statementStart,
    statementEnd,
    literalText: source.slice(valueStart, valueEnd + 1)
  };
}

function evaluateLiteral(literalText, contextLabel) {
  try {
    return vm.runInNewContext(`(${literalText})`, {}, { timeout: 1000 });
  } catch (error) {
    throw new Error(`Failed to parse ${contextLabel} literal: ${error.message}`);
  }
}

function toJsWrapper(varName, value) {
  const json = JSON.stringify(value, null, 2);
  return [
    `const ${varName} = ${json};`,
    "",
    "if (typeof window !== \"undefined\") {",
    `  window.${varName} = ${varName};`,
    "}",
    ""
  ].join("\n");
}

function ensureWindowBridge(source, varName) {
  const bridgeRegex = new RegExp(`window\\.${escapeRegExp(varName)}\\s*=`, "m");
  if (bridgeRegex.test(source)) {
    return source;
  }

  const bridge = [
    "",
    "if (typeof window !== \"undefined\") {",
    `  window.${varName} = ${varName};`,
    "}",
    ""
  ].join("\n");

  return source.trimEnd() + bridge;
}

async function ensureTargetFile(targetConfig, absoluteTargetPath) {
  await fs.mkdir(path.dirname(absoluteTargetPath), { recursive: true });

  try {
    await fs.access(absoluteTargetPath);
  } catch {
    const template = toJsWrapper(targetConfig.varName, targetConfig.templateValue);
    await fs.writeFile(absoluteTargetPath, template, "utf8");
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function buildConflictCsv(conflicts) {
  const header = ["context", "path", "dbValue", "newValue", "message"].join(",");
  const rows = conflicts.map((conflict) =>
    [
      csvEscape(conflict.context),
      csvEscape(conflict.path),
      csvEscape(conflict.dbValue),
      csvEscape(conflict.newValue),
      csvEscape(conflict.message)
    ].join(",")
  );

  return [header, ...rows].join("\n") + "\n";
}

function parseCliArgs() {
  const [, , targetArg, inputArg] = process.argv;

  if (!targetArg || !inputArg) {
    throw new Error(
      "Usage: node smart_deep_merge.js [models|knowledge|policies] [input_file.json]"
    );
  }

  const target = String(targetArg).toLowerCase();
  if (!TARGETS[target]) {
    throw new Error(
      `Invalid target \"${targetArg}\". Valid targets: ${Object.keys(TARGETS).join(", ")}`
    );
  }

  return {
    target,
    inputPath: path.resolve(process.cwd(), inputArg)
  };
}

async function main() {
  const { target, inputPath } = parseCliArgs();
  const targetConfig = TARGETS[target];

  const absoluteTargetPath = path.resolve(process.cwd(), targetConfig.filePath);
  await ensureTargetFile(targetConfig, absoluteTargetPath);

  const sourceBefore = await fs.readFile(absoluteTargetPath, "utf8");
  const located = locateAssignedLiteral(sourceBefore, targetConfig.varName);

  const databaseData = located
    ? evaluateLiteral(located.literalText, `${targetConfig.varName} in ${targetConfig.filePath}`)
    : cloneDeep(targetConfig.templateValue);

  const incomingRaw = await fs.readFile(inputPath, "utf8");
  const incomingData = JSON.parse(incomingRaw);

  const stats = {
    merged: 0,
    inserted: 0,
    conflicts: []
  };

  const mergedData = mergeRootData(databaseData, incomingData, targetConfig.varName, stats);

  const backupPath = absoluteTargetPath.replace(/\.js$/i, ".backup.js");
  await fs.copyFile(absoluteTargetPath, backupPath);

  const replacementLiteral = JSON.stringify(mergedData, null, 2);
  const replacementStatement = `const ${targetConfig.varName} = ${replacementLiteral};`;

  let sourceAfter;
  if (located) {
    sourceAfter =
      sourceBefore.slice(0, located.statementStart) +
      replacementStatement +
      sourceBefore.slice(located.statementEnd + 1);
    sourceAfter = ensureWindowBridge(sourceAfter, targetConfig.varName);
  } else {
    sourceAfter = toJsWrapper(targetConfig.varName, mergedData);
  }

  await fs.writeFile(absoluteTargetPath, sourceAfter.trimEnd() + "\n", "utf8");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const conflictCsvPath = path.resolve(
    process.cwd(),
    `merge_conflicts_${target}_${timestamp}.csv`
  );
  const csvContent = buildConflictCsv(stats.conflicts);
  await fs.writeFile(conflictCsvPath, csvContent, "utf8");

  console.log("Smart deep merge complete.");
  console.log(`Target: ${target}`);
  console.log(`Input: ${inputPath}`);
  console.log(`Updated: ${absoluteTargetPath}`);
  console.log(`Backup: ${backupPath}`);
  console.log(`Merged entries: ${stats.merged}`);
  console.log(`Inserted entries: ${stats.inserted}`);
  console.log(`Conflicts detected: ${stats.conflicts.length}`);
  console.log(`Conflict CSV: ${conflictCsvPath}`);
}

main().catch((error) => {
  console.error("Smart deep merge failed:", error.message);
  process.exit(1);
});
