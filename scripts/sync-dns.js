const fs = require("fs");
const path = require("path");

const TOKEN = process.env.CF_API_TOKEN;
const ZONE = process.env.CF_ZONE_ID;
const ROOT_DOMAIN = "vtxgames.co.uk";

if (!TOKEN || !ZONE) {
  console.error("❌ Missing CF_API_TOKEN or CF_ZONE_ID environment variables");
  process.exit(1);
}

async function getExistingRecords() {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records?per_page=500`,
    {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch existing DNS records");
  return data.result;
}

async function createRecord(name, type, content) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, name, content, proxied: false, ttl: 1 }),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(`Failed to create ${name}: ${JSON.stringify(data.errors)}`);
  return data.result;
}

async function updateRecord(id, name, type, content) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records/${id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, name, content, proxied: false, ttl: 1 }),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(`Failed to update ${name}: ${JSON.stringify(data.errors)}`);
  return data.result;
}

async function deleteRecord(id, name) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(`Failed to delete ${name}: ${JSON.stringify(data.errors)}`);
}

async function main() {
  console.log("🔄 Syncing DNS records...\n");

  // Load all domain JSON files
  const domainFiles = fs
    .readdirSync("domains")
    .filter((f) => f.endsWith(".json") && f !== "example.json");

  const desired = domainFiles.map((file) => {
    const data = JSON.parse(fs.readFileSync(path.join("domains", file)));
    return {
      name: `${data.subdomain}.${ROOT_DOMAIN}`,
      type: data.record.type,
      content: data.record.value,
    };
  });

  // Get existing Cloudflare records for this zone
  const existing = await getExistingRecords();

  // Only manage records that are subdomains of our root (ignore root A/MX/etc)
  const managed = existing.filter(
    (r) => r.name.endsWith(`.${ROOT_DOMAIN}`) && r.name !== ROOT_DOMAIN
  );

  const managedMap = {};
  for (const r of managed) managedMap[r.name] = r;

  const desiredMap = {};
  for (const r of desired) desiredMap[r.name] = r;

  let created = 0, updated = 0, deleted = 0;

  // Create or update
  for (const record of desired) {
    const existing = managedMap[record.name];
    if (!existing) {
      await createRecord(record.name, record.type, record.content);
      console.log(`✅ Created  ${record.name} → ${record.content}`);
      created++;
    } else if (existing.content !== record.content || existing.type !== record.type) {
      await updateRecord(existing.id, record.name, record.type, record.content);
      console.log(`🔁 Updated  ${record.name} → ${record.content}`);
      updated++;
    } else {
      console.log(`⏭️  Skipped  ${record.name} (no change)`);
    }
  }

  // Delete records no longer in the repo
  for (const record of managed) {
    if (!desiredMap[record.name]) {
      await deleteRecord(record.id, record.name);
      console.log(`🗑️  Deleted  ${record.name}`);
      deleted++;
    }
  }

  console.log(`\n✨ Done — ${created} created, ${updated} updated, ${deleted} deleted`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
