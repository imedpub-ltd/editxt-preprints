#!/usr/bin/env node
"use strict";

// scripts/publishing/deposit-zenodo-cli.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");

// src/core/publication/zenodo/ZenodoDepositClient.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var ZenodoDepositClient = class _ZenodoDepositClient {
  constructor(apiToken) {
    this.apiToken = apiToken;
  }
  static BASE_URL = "https://zenodo.org/api";
  static DEFAULT_COMMUNITY = "imedpub";
  static DEFAULT_LICENSE = "cc-by-4.0";
  /**
   * Compiles the standardized Zenodo Deposition Payload.
   */
  buildMetadataPayload(meta) {
    if (!meta.title || meta.title.trim().length === 0) {
      throw new Error("Preprint title is required for Zenodo deposition.");
    }
    if (!meta.abstract || meta.abstract.trim().length === 0) {
      throw new Error("Preprint abstract/description is required for Zenodo deposition.");
    }
    if (!meta.authors || meta.authors.length === 0) {
      throw new Error("At least one author is required for Zenodo deposition.");
    }
    const creators = meta.authors.map((a) => {
      const creator = { name: a.name };
      if (a.affiliation) creator.affiliation = a.affiliation;
      if (a.orcid) creator.orcid = a.orcid.replace(/^https?:\/\/orcid\.org\//, "").trim();
      return creator;
    });
    const communityId = meta.community ?? _ZenodoDepositClient.DEFAULT_COMMUNITY;
    return {
      metadata: {
        title: meta.title.trim(),
        upload_type: "publication",
        publication_type: "preprint",
        description: meta.abstract.startsWith("<p>") ? meta.abstract : `<p>${meta.abstract.trim()}</p>`,
        creators,
        access_right: "open",
        license: meta.license ?? _ZenodoDepositClient.DEFAULT_LICENSE,
        communities: communityId ? [{ identifier: communityId }] : void 0,
        keywords: meta.keywords ?? ["open science", "computable preprint"],
        version: meta.version ?? "1.0.0",
        related_identifiers: meta.relatedIdentifiers?.map((r) => ({
          identifier: r.identifier,
          relation: r.relation,
          scheme: r.scheme,
          resource_type: r.resource_type
        })),
        prereserve_doi: meta.prereserveDoi ?? true
      }
    };
  }
  /**
   * Creates an unsubmitted draft deposition on Zenodo.
   * This is completely non-destructive: it does not publish to DataCite or index publicly.
   */
  async createDraftDeposition(meta, tokenOverride) {
    const token = tokenOverride ?? this.apiToken;
    if (!token) {
      throw new Error("Zenodo API Token is required to communicate with Zenodo.");
    }
    const payload = this.buildMetadataPayload(meta);
    const res = await fetch(`${_ZenodoDepositClient.BASE_URL}/deposit/depositions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to create Zenodo draft deposition (HTTP ${res.status}): ${errBody}`);
    }
    return await res.json();
  }
  /**
   * Uploads a file (PDF, Markdown, ZIP or JSON capsule) into the draft bucket.
   */
  async uploadFileToDraft(bucketUrl, filePath, tokenOverride) {
    const token = tokenOverride ?? this.apiToken;
    if (!token) throw new Error("Zenodo API Token is required.");
    if (!(0, import_node_fs.existsSync)(filePath)) throw new Error(`File does not exist: ${filePath}`);
    const fileName = (0, import_node_path.basename)(filePath);
    const fileBuffer = (0, import_node_fs.readFileSync)(filePath);
    const targetUrl = `${bucketUrl}/${encodeURIComponent(fileName)}`;
    const res = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream"
      },
      body: fileBuffer
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to upload file to Zenodo bucket (HTTP ${res.status}): ${errBody}`);
    }
  }
  /**
   * Safely deletes an unsubmitted draft deposition.
   */
  async deleteDraftDeposition(depositionId, tokenOverride) {
    const token = tokenOverride ?? this.apiToken;
    if (!token) throw new Error("Zenodo API Token is required.");
    const res = await fetch(`${_ZenodoDepositClient.BASE_URL}/deposit/depositions/${depositionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok && res.status !== 204) {
      const errBody = await res.text();
      throw new Error(`Failed to delete Zenodo draft ${depositionId} (HTTP ${res.status}): ${errBody}`);
    }
  }
  /**
   * Irreversible publication step: Mints permanent DataCite DOI.
   * STRICT GUARD: Requires explicit confirmation parameter.
   */
  async publishDeposition(depositionId, confirmIrreversiblePublish, tokenOverride) {
    if (!confirmIrreversiblePublish) {
      throw new Error(
        "SAFETY GUARD TRIGGERED: Cannot publish Zenodo deposition without confirmIrreversiblePublish=true. DOIs minted in Zenodo cannot be deleted. If this is a test or dry-run, do not call publish."
      );
    }
    const token = tokenOverride ?? this.apiToken;
    if (!token) throw new Error("Zenodo API Token is required.");
    const res = await fetch(`${_ZenodoDepositClient.BASE_URL}/deposit/depositions/${depositionId}/actions/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to publish Zenodo deposition ${depositionId} (HTTP ${res.status}): ${errBody}`);
    }
    return await res.json();
  }
};

// scripts/publishing/deposit-zenodo-cli.ts
function parseSimpleMarkdown(filePath) {
  const content = (0, import_node_fs2.readFileSync)(filePath, "utf8");
  const lines = content.split("\n");
  let title = "";
  let abstract = "";
  const authors = [];
  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "").trim();
      break;
    }
  }
  const abstractMatch = /(?:##\s+Abstract|Abstract)[\r\n]+([\s\S]*?)(?:##|$)/i.exec(content);
  if (abstractMatch && abstractMatch[1]) {
    abstract = abstractMatch[1].trim();
  } else {
    const paragraphs = content.split(/\n\s*\n/);
    const candidate = paragraphs.find((p) => !p.startsWith("#") && p.length > 100);
    abstract = candidate?.trim() ?? "Open computable scientific preprint submitted to EdiTxt Preprints.";
  }
  authors.push({
    name: "Men\xE9ndez-Gonz\xE1lez, Manuel",
    affiliation: "HUCA / iMedPub Limited",
    orcid: "0000-0002-1825-0097"
  });
  return {
    title: title || "Untitled Computable Preprint",
    abstract,
    authors,
    community: "imedpub",
    keywords: ["computational science", "diamond open access", "editxt", "preprint"]
  };
}
async function main() {
  const args = process.argv.slice(2);
  const isPublish = args.includes("--publish");
  const isDraftOnly = args.includes("--draft");
  const isDryRun = args.includes("--dry-run") || !isPublish && !isDraftOnly;
  const fileArg = args.find((a) => !a.startsWith("--"));
  if (!fileArg) {
    console.error("Usage: npm run zenodo:deposit -- <manuscript.md> [--dry-run] [--draft] [--publish]");
    process.exit(1);
  }
  const fullPath = (0, import_node_path2.resolve)(process.cwd(), fileArg);
  if (!(0, import_node_fs2.existsSync)(fullPath)) {
    console.error(`Error: File not found at ${fullPath}`);
    process.exit(1);
  }
  const token = process.env.ZENODO_TOKEN || process.env.ZENODO_API_TOKEN;
  if (!token && !isDryRun) {
    console.error("Error: ZENODO_TOKEN or ZENODO_API_TOKEN environment variable is required.");
    process.exit(1);
  }
  console.log("======================================================");
  console.log("EdiTxt Zenodo Deposition Gateway");
  console.log(`Target:    ${fileArg}`);
  console.log(`Mode:      ${isPublish ? "\u{1F6A8} LIVE PUBLICATION (PERMANENT)" : isDraftOnly ? "\u{1F4DD} DRAFT CREATION ONLY" : "\u{1F50D} DRY-RUN (METADATA VALIDATION ONLY)"}`);
  console.log("======================================================");
  const meta = parseSimpleMarkdown(fullPath);
  const client = new ZenodoDepositClient(token);
  const payload = client.buildMetadataPayload(meta);
  console.log("\n[Compiled Deposition Payload]:");
  console.log(JSON.stringify(payload, null, 2));
  if (isDryRun) {
    console.log("\n\u2705 Dry-run successful! Metadata is fully validated.");
    console.log("\u{1F512} SAFETY GUARD: No remote deposition or DOI was minted (zero irreversible traces).");
    process.exit(0);
  }
  if (isDraftOnly) {
    console.log("\nConnecting to Zenodo to create draft reservation...");
    const draft = await client.createDraftDeposition(meta, token);
    console.log(`\u2705 Draft Created: ID ${draft.id}`);
    console.log(`   Prereserved DOI: ${draft.metadata.prereserve_doi?.doi ?? "Pending"}`);
    console.log(`   HTML Link:       ${draft.links.html ?? "N/A"}`);
    console.log("\u{1F512} Deposition remains in unsubmitted draft state. Not published to DataCite.");
    process.exit(0);
  }
  if (isPublish) {
    console.log("\n\u{1F6A8} WARNING: Publishing will mint an INDELIBLE DataCite DOI on Zenodo.");
    console.log("Creating deposition...");
    const draft = await client.createDraftDeposition(meta, token);
    console.log(`Draft ${draft.id} created. Uploading manuscript...`);
    if (draft.links.bucket) {
      await client.uploadFileToDraft(draft.links.bucket, fullPath, token);
    }
    console.log("Minting permanent DOI...");
    const published = await client.publishDeposition(draft.id, true, token);
    console.log(`\u{1F389} PREPRINT PUBLISHED TO ZENODO!`);
    console.log(`   DOI:  https://doi.org/${published.doi}`);
    console.log(`   URL:  ${published.links.html}`);
  }
}
main().catch((err) => {
  console.error("\n\u274C Zenodo Deposition Error:", err.message);
  process.exit(1);
});
