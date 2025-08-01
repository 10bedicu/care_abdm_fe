const fs = require("fs");
const { execSync } = require("child_process");

function getGitInfo() {
  try {
    const commitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
    return { commitHash, branch };
  } catch (error) {
    console.log("⚠️  Git information not available, using defaults");
    return { commitHash: "unknown", branch: "unknown" };
  }
}

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const version = packageJson.version;
const buildDate = new Date().toISOString();

const gitInfo = getGitInfo();

const currentBuild = {
  version,
  buildDate,
  environment: process.env.NODE_ENV || "unknown",
  timestamp: Date.now(),
  commitHash: gitInfo.commitHash,
  branch: gitInfo.branch,
};

let existingVersionInfo = { buildHistory: [] };
if (fs.existsSync("./public/version.json")) {
  try {
    existingVersionInfo = JSON.parse(
      fs.readFileSync("./public/version.json", "utf8")
    );
  } catch (error) {
    console.log("Could not parse existing version.json, starting fresh");
  }
}

const buildHistory = [
  currentBuild,
  ...(existingVersionInfo.buildHistory || []),
].slice(0, 10);

const versionInfo = {
  version,
  buildDate,
  environment: process.env.NODE_ENV || "unknown",
  timestamp: Date.now(),
  commitHash: gitInfo.commitHash,
  branch: gitInfo.branch,
  buildHistory,
};

fs.writeFileSync("./public/version.json", JSON.stringify(versionInfo, null, 2));

const indexPath = "./public/index.html";
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, "utf8");

  indexContent = indexContent.replace(
    /<span class="value" id="app-version">.*?<\/span>/,
    `<span class="value" id="app-version">${version}</span>`
  );

  indexContent = indexContent.replace(
    /<span class="value" id="build-date"><\/span>/,
    `<span class="value" id="build-date">${buildDate.split("T")[0]}</span>`
  );

  fs.writeFileSync(indexPath, indexContent);
}

console.log(`Version info generated: ${version} (${buildDate})`);
console.log(`Build history updated (${buildHistory.length} builds stored)`);
