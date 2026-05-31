/**
 * validate.js
 * Runs on every PR to check domain JSON files are valid before merging.
 * Exit code 1 = validation failed (blocks the PR).
 */

const fs = require("fs");
const path = require("path");

const DOMAINS_DIR = "domains";
const ROOT_DOMAIN = "vtxgames.co.uk";
const RESERVED = ["www", "mail", "ftp", "admin", "api", "dev", "test", "staging", "smtp", "pop", "imap", "ns1", "ns2"];

let hasError = false;

function error(file, msg) {
  console.error(`❌ [${file}] ${msg}`);
  hasError = true;
}

function warn(file, msg) {
  console.warn(`⚠️  [${file}] ${msg}`);
}

const files = fs.readdirSync(DOMAINS_DIR).filter((f) => f.endsWith(".json") && f !== "example.json");

for (const file of files) {
  const filePath = path.join(DOMAINS_DIR, file);
  let data;

  // Must be valid JSON
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    error(file, "Invalid JSON");
    continue;
  }

  const { subdomain, owner, record, description } = data;

  // Required fields
  if (!subdomain) error(file, "Missing 'subdomain' field");
  if (!owner?.github) error(file, "Missing 'owner.github' field");
  if (!record?.type) error(file, "Missing 'record.type' field");
  if (!record?.value) error(file, "Missing 'record.value' field");
  if (!description) warn(file, "Missing 'description' — please add a short game description");

  // Filename must match subdomain
  const expectedFile = `${subdomain}.json`;
  if (file !== expectedFile) {
    error(file, `Filename must match subdomain: expected '${expectedFile}'`);
  }

  // Subdomain format: lowercase alphanumeric and hyphens only
  if (subdomain && !/^[a-z0-9-]+$/.test(subdomain)) {
    error(file, `Subdomain '${subdomain}' must be lowercase letters, numbers, and hyphens only`);
  }

  // Reserved names
  if (RESERVED.includes(subdomain)) {
    error(file, `Subdomain '${subdomain}' is reserved`);
  }

  // Record type must be CNAME or A
  if (record?.type && !["CNAME", "A"].includes(record.type)) {
    error(file, `record.type must be 'CNAME' or 'A', got '${record.type}'`);
  }

  // CNAME value should not end with a dot (common mistake)
  if (record?.type === "CNAME" && record?.value?.endsWith(".")) {
    error(file, `CNAME value should not end with a dot`);
  }

  // A record must be a valid IPv4
  if (record?.type === "A" && record?.value) {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4.test(record.value)) {
      error(file, `A record value '${record.value}' is not a valid IPv4 address`);
    }
  }

  if (!hasError) {
    console.log(`✅ ${subdomain}.${ROOT_DOMAIN} → ${record?.value}`);
  }
}

if (hasError) {
  console.error("\n❌ Validation failed. Fix the errors above before this PR can be merged.");
  process.exit(1);
} else {
  console.log(`\n✨ All ${files.length} domain(s) valid`);
}
