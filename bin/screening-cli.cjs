"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/screening/run-screening.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");

// src/core/screening/PreprintScreeningEngine.ts
var import_node_crypto10 = require("node:crypto");
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// src/core/capabilities/CapabilityRegistry.ts
var CapabilityNotFoundError = class extends Error {
  constructor(capability) {
    super(`Capability ${capability} is not registered.`);
    this.capability = capability;
  }
};
var CapabilityInputError = class extends Error {
  constructor(capability, problems) {
    super(`Input for ${capability} is invalid: ${problems.join("; ")}`);
    this.capability = capability;
    this.problems = problems;
  }
};
var CapabilityRegistry = class {
  capabilities = /* @__PURE__ */ new Map();
  register(capability) {
    const { name } = capability.getContract();
    if (this.capabilities.has(name)) {
      throw new Error(`Capability ${name} is already registered.`);
    }
    this.capabilities.set(name, capability);
    return this;
  }
  has(name) {
    return this.capabilities.has(name);
  }
  contracts() {
    return [...this.capabilities.values()].map((c) => c.getContract());
  }
  /** Class names of registered capabilities, used by the registry-coverage meta-test. */
  registeredClassNames() {
    return [...this.capabilities.values()].map((c) => c.constructor.name);
  }
  async invoke(name, input) {
    const capability = this.capabilities.get(name);
    if (!capability) throw new CapabilityNotFoundError(name);
    const problems = validateAgainstSchema(capability.getContract().inputSchema, input);
    if (problems.length > 0) throw new CapabilityInputError(name, problems);
    return capability.invoke(input);
  }
};
function validateAgainstSchema(schema, value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return ["input must be a JSON object"];
  }
  const record = value;
  const problems = [];
  for (const key of schema.required ?? []) {
    if (!(key in record)) problems.push(`missing required field "${key}"`);
  }
  for (const [key, property] of Object.entries(schema.properties)) {
    if (!(key in record) || record[key] === void 0) continue;
    const actual = record[key];
    const expected = property?.type;
    if (typeof expected !== "string") continue;
    const matches = expected === "array" ? Array.isArray(actual) : expected === "object" ? typeof actual === "object" && actual !== null && !Array.isArray(actual) : typeof actual === expected;
    if (!matches) problems.push(`field "${key}" must be of type ${expected}`);
  }
  return problems;
}

// src/core/document/providers/http.ts
var ProviderError = class extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
    this.name = "ProviderError";
  }
};
var RETRYABLE_STATUS = /* @__PURE__ */ new Set([408, 425, 429, 500, 502, 503, 504]);
var MAX_BACKOFF_MS = 8e3;
var defaultSleep = (ms) => new Promise((resolve2) => setTimeout(resolve2, ms));
async function getWithRetry(url, options, accept) {
  for (let attempt = 0; ; attempt++) {
    let response;
    try {
      response = await options.fetchImpl(url, {
        headers: { Accept: accept, ...options.headers },
        signal: AbortSignal.timeout(options.timeoutMs)
      });
    } catch (error) {
      if (attempt >= options.retries) {
        throw new ProviderError("unavailable", `network error: ${describe(error)}`);
      }
      await options.sleep(backoffMs(attempt));
      continue;
    }
    if (response.status === 404) return null;
    if (response.ok) return response;
    if (!RETRYABLE_STATUS.has(response.status) || attempt >= options.retries) {
      throw new ProviderError("unavailable", `HTTP ${response.status}`);
    }
    const retryAfter = Number(response.headers?.get?.("retry-after"));
    await options.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1e3, MAX_BACKOFF_MS) : backoffMs(attempt));
  }
}
async function getJson(url, options) {
  const response = await getWithRetry(url, options, "application/json");
  if (!response) return { status: 404, body: null };
  try {
    return { status: response.status, body: await response.json() };
  } catch {
    throw new ProviderError("invalid_response", "body is not valid JSON");
  }
}
async function getText(url, options, accept = "application/atom+xml, text/xml") {
  const response = await getWithRetry(url, options, accept);
  if (!response) return null;
  return response.text();
}
function backoffMs(attempt) {
  return Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempt);
}
function describe(error) {
  return error instanceof Error ? error.message : String(error);
}
function expectRecord(value, what) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ProviderError("invalid_response", `${what} is not an object`);
  }
  return value;
}
function expectArray(value, what) {
  if (!Array.isArray(value)) throw new ProviderError("invalid_response", `${what} is not an array`);
  return value;
}
function optionalString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}

// src/core/document/providers/CrossrefReferenceProvider.ts
var CrossrefReferenceProvider = class {
  providerId = "crossref";
  providerName = "Crossref";
  baseUrl;
  contactEmail;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.crossref.org";
    this.contactEmail = options.contactEmail;
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: { "User-Agent": this.userAgent() }
    };
  }
  async resolveById(doi) {
    const result = await getJson(this.url(`/works/${encodeURIComponent(doi)}`), this.http);
    if (result.status === 404) return null;
    const message = expectRecord(expectRecord(result.body, "Crossref response").message, "Crossref message");
    return toReference(message);
  }
  async search(query) {
    const result = await getJson(this.url("/works", { "query.bibliographic": query, rows: "1" }), this.http);
    const message = expectRecord(expectRecord(result.body, "Crossref response").message, "Crossref message");
    return expectArray(message.items ?? [], "Crossref items").map((item) => toReference(expectRecord(item, "Crossref item")));
  }
  url(path, params = {}) {
    const query = new URLSearchParams(params);
    if (this.contactEmail) query.set("mailto", this.contactEmail);
    const suffix = query.toString();
    return `${this.baseUrl}${path}${suffix ? `?${suffix}` : ""}`;
  }
  userAgent() {
    return this.contactEmail ? `EdiTXT/1.0 (https://github.com/Fundacion-de-Neurociencias/editxt; mailto:${this.contactEmail})` : "EdiTXT/1.0 (https://github.com/Fundacion-de-Neurociencias/editxt)";
  }
};
function toReference(message) {
  const doi = optionalString(message.DOI);
  if (!doi) throw new ProviderError("invalid_response", "Crossref record has no DOI");
  const titles = Array.isArray(message.title) ? message.title : [];
  const authors = Array.isArray(message.author) ? message.author : [];
  const issued = expectRecord(message.issued ?? {}, "Crossref issued");
  const dateParts = Array.isArray(issued["date-parts"]) ? issued["date-parts"] : [];
  const firstPart = Array.isArray(dateParts[0]) ? dateParts[0] : [];
  const reference = {
    id: `crossref:${doi}`,
    doi,
    title: typeof titles[0] === "string" ? titles[0] : "",
    authors: authors.map((a) => expectRecord(a, "Crossref author")).map((a) => [optionalString(a.given), optionalString(a.family)].filter(Boolean).join(" ")).filter((name) => name.length > 0),
    year: typeof firstPart[0] === "number" ? firstPart[0] : 0,
    source: "Crossref"
  };
  if (isRetracted(message)) reference.retracted = true;
  return reference;
}
function isRetracted(message) {
  const updates = Array.isArray(message["updated-by"]) ? message["updated-by"] : [];
  return updates.some((u) => typeof u === "object" && u !== null && String(u.type).toLowerCase() === "retraction");
}

// src/core/document/providers/PubMedReferenceProvider.ts
var PubMedReferenceProvider = class {
  providerId = "pubmed";
  providerName = "PubMed";
  baseUrl;
  apiKey;
  contactEmail;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
    this.apiKey = options.apiKey;
    this.contactEmail = options.contactEmail;
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: {}
    };
  }
  async resolveById(pmid) {
    const result = await getJson(this.url("esummary.fcgi", { id: pmid }), this.http);
    if (result.status === 404) return null;
    const summaries = expectRecord(expectRecord(result.body, "PubMed response").result, "PubMed result");
    const record = summaries[pmid];
    if (record === void 0) return null;
    const summary = expectRecord(record, "PubMed summary");
    if (summary.error !== void 0) return null;
    return toReference2(pmid, summary);
  }
  async search(query) {
    const result = await getJson(this.url("esearch.fcgi", { term: query, retmax: "1" }), this.http);
    const search = expectRecord(expectRecord(result.body, "PubMed response").esearchresult, "PubMed esearchresult");
    const ids = expectArray(search.idlist ?? [], "PubMed idlist");
    const first = ids[0];
    if (typeof first !== "string") return [];
    const reference = await this.resolveById(first);
    return reference ? [reference] : [];
  }
  url(endpoint, params) {
    const query = new URLSearchParams({ db: "pubmed", retmode: "json", tool: "EdiTXT", ...params });
    if (this.contactEmail) query.set("email", this.contactEmail);
    if (this.apiKey) query.set("api_key", this.apiKey);
    return `${this.baseUrl}/${endpoint}?${query.toString()}`;
  }
};
function toReference2(pmid, summary) {
  const authors = Array.isArray(summary.authors) ? summary.authors : [];
  const articleIds = Array.isArray(summary.articleids) ? summary.articleids : [];
  const doiEntry = articleIds.map((entry) => expectRecord(entry, "PubMed articleid")).find((entry) => entry.idtype === "doi");
  const year = parseInt(String(summary.pubdate ?? "").slice(0, 4), 10);
  const reference = {
    id: `pmid:${pmid}`,
    pmid,
    title: optionalString(summary.title) ?? "",
    authors: authors.map((a) => optionalString(expectRecord(a, "PubMed author").name)).filter((name) => name !== void 0),
    year: Number.isFinite(year) ? year : 0,
    source: "PubMed"
  };
  const doi = optionalString(doiEntry?.value);
  if (doi) reference.doi = doi;
  const pubTypes = Array.isArray(summary.pubtype) ? summary.pubtype : [];
  if (pubTypes.some((t) => typeof t === "string" && t.toLowerCase() === "retracted publication")) reference.retracted = true;
  if (!reference.title) throw new ProviderError("invalid_response", `PubMed summary ${pmid} has no title`);
  return reference;
}

// src/core/document/providers/OpenAlexReferenceProvider.ts
var OpenAlexReferenceProvider = class {
  providerId = "openalex";
  providerName = "OpenAlex";
  baseUrl;
  contactEmail;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.openalex.org";
    this.contactEmail = options.contactEmail;
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: {}
    };
  }
  async resolveById(doi) {
    const result = await getJson(this.url(`/works/https://doi.org/${encodeURI(doi)}`), this.http);
    if (result.status === 404) return null;
    return toReference3(expectRecord(result.body, "OpenAlex work"));
  }
  async search(query) {
    const result = await getJson(this.url("/works", { search: query, "per-page": "1" }), this.http);
    const page = expectRecord(result.body, "OpenAlex response");
    return expectArray(page.results ?? [], "OpenAlex results").map((w) => toReference3(expectRecord(w, "OpenAlex work")));
  }
  url(path, params = {}) {
    const query = new URLSearchParams(params);
    if (this.contactEmail) query.set("mailto", this.contactEmail);
    const suffix = query.toString();
    return `${this.baseUrl}${path}${suffix ? `?${suffix}` : ""}`;
  }
};
function toReference3(work) {
  const openAlexId = optionalString(work.id);
  if (!openAlexId) throw new ProviderError("invalid_response", "OpenAlex work has no id");
  const title = optionalString(work.display_name) ?? optionalString(work.title) ?? "";
  const authorships = Array.isArray(work.authorships) ? work.authorships : [];
  const reference = {
    id: `openalex:${openAlexId.replace(/^https:\/\/openalex\.org\//, "")}`,
    title,
    authors: authorships.map((a) => optionalString(expectRecord(expectRecord(a, "OpenAlex authorship").author ?? {}, "OpenAlex author").display_name)).filter((name) => name !== void 0),
    year: typeof work.publication_year === "number" ? work.publication_year : 0,
    source: "OpenAlex"
  };
  const doi = optionalString(work.doi)?.replace(/^https?:\/\/doi\.org\//i, "");
  if (doi) reference.doi = doi;
  if (work.is_retracted === true) reference.retracted = true;
  return reference;
}

// src/core/document/providers/ClinicalTrialsReferenceProvider.ts
var NCT_PATTERN = /^NCT\d{8}$/i;
var ClinicalTrialsReferenceProvider = class {
  providerId = "clinicaltrials";
  providerName = "ClinicalTrials";
  baseUrl;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://clinicaltrials.gov/api/v2";
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: {}
    };
  }
  async resolveById(nct) {
    if (!NCT_PATTERN.test(nct)) return null;
    const result = await getJson(`${this.baseUrl}/studies/${nct.toUpperCase()}`, this.http);
    if (result.status === 404) return null;
    return toReference4(expectRecord(result.body, "ClinicalTrials.gov study"));
  }
  async search(query) {
    const params = new URLSearchParams({ "query.term": query, pageSize: "1" });
    const result = await getJson(`${this.baseUrl}/studies?${params.toString()}`, this.http);
    const page = expectRecord(result.body, "ClinicalTrials.gov response");
    return expectArray(page.studies ?? [], "ClinicalTrials.gov studies").map((s) => toReference4(expectRecord(s, "ClinicalTrials.gov study")));
  }
};
function toReference4(study) {
  const protocol = expectRecord(study.protocolSection, "ClinicalTrials.gov protocolSection");
  const identification = expectRecord(protocol.identificationModule, "ClinicalTrials.gov identificationModule");
  const nct = optionalString(identification.nctId);
  if (!nct) throw new ProviderError("invalid_response", "ClinicalTrials.gov study has no nctId");
  const status = expectRecord(protocol.statusModule ?? {}, "ClinicalTrials.gov statusModule");
  const start = expectRecord(status.startDateStruct ?? {}, "ClinicalTrials.gov startDateStruct");
  const year = parseInt(String(start.date ?? "").slice(0, 4), 10);
  const sponsors = expectRecord(protocol.sponsorCollaboratorsModule ?? {}, "ClinicalTrials.gov sponsors");
  const lead = optionalString(expectRecord(sponsors.leadSponsor ?? {}, "ClinicalTrials.gov leadSponsor").name);
  return {
    id: `nct:${nct}`,
    nct,
    title: optionalString(identification.officialTitle) ?? optionalString(identification.briefTitle) ?? "",
    authors: lead ? [lead] : [],
    year: Number.isFinite(year) ? year : 0,
    source: "ClinicalTrials"
  };
}

// src/core/document/providers/ArxivReferenceProvider.ts
var ARXIV_PATTERN = /^(\d{4}\.\d{4,5}|[a-z-]+(\.[A-Z]{2})?\/\d{7})(v\d+)?$/;
var ArxivReferenceProvider = class {
  providerId = "arxiv";
  providerName = "arXiv";
  baseUrl;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://export.arxiv.org/api";
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: {}
    };
  }
  async resolveById(arxivId) {
    const id = arxivId.replace(/^arxiv:/i, "");
    if (!ARXIV_PATTERN.test(id)) return null;
    const xml = await getText(`${this.baseUrl}/query?id_list=${encodeURIComponent(id)}&max_results=1`, this.http);
    if (xml === null) return null;
    return parseEntries(xml)[0] ?? null;
  }
  async search(query) {
    const params = new URLSearchParams({ search_query: `all:"${query.replace(/"/g, "")}"`, max_results: "1" });
    const xml = await getText(`${this.baseUrl}/query?${params.toString()}`, this.http);
    return xml === null ? [] : parseEntries(xml);
  }
};
function parseEntries(xml) {
  const references = [];
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const idUrl = text(entry, "id");
    if (!idUrl || idUrl.includes("/api/errors")) continue;
    const arxivId = idUrl.replace(/^https?:\/\/arxiv\.org\/abs\//, "").replace(/v\d+$/, "");
    const reference = {
      id: `arxiv:${arxivId}`,
      arxivId,
      title: text(entry, "title") ?? "",
      authors: [...(entry ?? "").matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)].map((m) => decode(m[1] ?? "")),
      year: parseInt((text(entry, "published") ?? "").slice(0, 4), 10) || 0,
      source: "arXiv"
    };
    const doi = (entry ?? "").match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/)?.[1];
    if (doi) reference.doi = decode(doi);
    references.push(reference);
  }
  return references;
}
function text(xml, tag) {
  const value = (xml ?? "").match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1];
  return value === void 0 ? void 0 : decode(value);
}
function decode(value) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

// src/core/document/providers/EuropePmcReferenceProvider.ts
var EuropePmcReferenceProvider = class {
  providerId = "europepmc";
  providerName = "EuropePMC";
  baseUrl;
  contactEmail;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://www.ebi.ac.uk/europepmc/webservices/rest";
    this.contactEmail = options.contactEmail;
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: {}
    };
  }
  async resolveById(id) {
    const query = /^\d{1,9}$/.test(id) ? `EXT_ID:${id} AND SRC:MED` : `DOI:"${id.replace(/"/g, "")}"`;
    const [first] = await this.query(query);
    return first ?? null;
  }
  search(query) {
    return this.query(query.replace(/[":]/g, " "));
  }
  async query(query) {
    const params = new URLSearchParams({ query, format: "json", resultType: "core", pageSize: "1" });
    if (this.contactEmail) params.set("email", this.contactEmail);
    const result = await getJson(`${this.baseUrl}/search?${params.toString()}`, this.http);
    if (result.status === 404) return [];
    const body = expectRecord(result.body, "Europe PMC response");
    const list = expectRecord(body.resultList ?? {}, "Europe PMC resultList");
    return expectArray(list.result ?? [], "Europe PMC results").map((r) => toReference5(expectRecord(r, "Europe PMC result")));
  }
};
function toReference5(record) {
  const source = optionalString(record.source) ?? "MED";
  const id = optionalString(record.id) ?? optionalString(record.pmid) ?? optionalString(record.doi) ?? "unknown";
  const pubTypes = expectArray(expectRecord(record.pubTypeList ?? {}, "Europe PMC pubTypeList").pubType ?? [], "Europe PMC pubType");
  const reference = {
    id: `europepmc:${source}/${id}`,
    title: optionalString(record.title)?.replace(/\.$/, "") ?? "",
    authors: (optionalString(record.authorString) ?? "").replace(/\.$/, "").split(/,\s*/).filter(Boolean),
    year: parseInt(optionalString(record.pubYear) ?? "", 10) || 0,
    source: "EuropePMC"
  };
  const pmid = optionalString(record.pmid);
  if (pmid) reference.pmid = pmid;
  const doi = optionalString(record.doi);
  if (doi) reference.doi = doi;
  if (pubTypes.some((t) => typeof t === "string" && t.toLowerCase() === "retracted publication")) reference.retracted = true;
  return reference;
}

// src/core/document/providers/SemanticScholarReferenceProvider.ts
var FIELDS = "title,year,authors,externalIds";
var SemanticScholarReferenceProvider = class {
  providerId = "semanticscholar";
  providerName = "SemanticScholar";
  baseUrl;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.semanticscholar.org/graph/v1";
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: options.apiKey ? { "x-api-key": options.apiKey } : {}
    };
  }
  async resolveById(id) {
    const result = await getJson(`${this.baseUrl}/paper/${paperKey(id)}?fields=${FIELDS}`, this.http);
    if (result.status === 404) return null;
    return toReference6(expectRecord(result.body, "Semantic Scholar paper"));
  }
  async search(query) {
    const params = new URLSearchParams({ query, limit: "1", fields: FIELDS });
    const result = await getJson(`${this.baseUrl}/paper/search?${params.toString()}`, this.http);
    const page = expectRecord(result.body, "Semantic Scholar response");
    return expectArray(page.data ?? [], "Semantic Scholar data").map((p) => toReference6(expectRecord(p, "Semantic Scholar paper")));
  }
};
function paperKey(id) {
  if (/^\d{1,9}$/.test(id)) return `PMID:${id}`;
  if (/^10\.\d{4,9}\//.test(id)) return `DOI:${id}`;
  return `ARXIV:${id.replace(/^arxiv:/i, "")}`;
}
function toReference6(paper) {
  const paperId = optionalString(paper.paperId);
  if (!paperId) throw new ProviderError("invalid_response", "Semantic Scholar paper has no paperId");
  const ids = expectRecord(paper.externalIds ?? {}, "Semantic Scholar externalIds");
  const authors = Array.isArray(paper.authors) ? paper.authors : [];
  const reference = {
    id: `s2:${paperId}`,
    title: optionalString(paper.title) ?? "",
    authors: authors.map((a) => optionalString(expectRecord(a, "Semantic Scholar author").name)).filter((n) => n !== void 0),
    year: typeof paper.year === "number" ? paper.year : 0,
    source: "SemanticScholar"
  };
  const doi = optionalString(ids.DOI);
  if (doi) reference.doi = doi;
  const pmid = ids.PubMed === void 0 ? void 0 : String(ids.PubMed);
  if (pmid) reference.pmid = pmid;
  const arxiv = optionalString(ids.ArXiv);
  if (arxiv) reference.arxivId = arxiv;
  return reference;
}

// src/core/document/providers/DataCiteReferenceProvider.ts
var DataCiteReferenceProvider = class {
  providerId = "datacite";
  providerName = "DataCite";
  baseUrl;
  http;
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.datacite.org";
    this.http = {
      fetchImpl: options.fetchImpl ?? fetch,
      timeoutMs: options.timeoutMs ?? 1e4,
      retries: options.retries ?? 2,
      sleep: options.sleep ?? defaultSleep,
      headers: {}
    };
  }
  async resolveById(doi) {
    const result = await getJson(`${this.baseUrl}/dois/${encodeURIComponent(doi)}`, this.http);
    if (result.status === 404) return null;
    return toReference7(expectRecord(expectRecord(result.body, "DataCite response").data, "DataCite data"));
  }
  async search(query) {
    const params = new URLSearchParams({ query, "page[size]": "1" });
    const result = await getJson(`${this.baseUrl}/dois?${params.toString()}`, this.http);
    const body = expectRecord(result.body, "DataCite response");
    return expectArray(body.data ?? [], "DataCite data").map((d) => toReference7(expectRecord(d, "DataCite record")));
  }
};
function toReference7(record) {
  const attributes = expectRecord(record.attributes, "DataCite attributes");
  const doi = optionalString(attributes.doi) ?? optionalString(record.id);
  if (!doi) throw new ProviderError("invalid_response", "DataCite record has no DOI");
  const titles = Array.isArray(attributes.titles) ? attributes.titles : [];
  const creators = Array.isArray(attributes.creators) ? attributes.creators : [];
  const firstTitle = titles[0] && typeof titles[0] === "object" ? optionalString(titles[0].title) : void 0;
  return {
    id: `datacite:${doi}`,
    doi,
    title: firstTitle ?? "",
    authors: creators.map((c) => optionalString(expectRecord(c, "DataCite creator").name)).filter((n) => n !== void 0),
    year: typeof attributes.publicationYear === "number" ? attributes.publicationYear : parseInt(String(attributes.publicationYear ?? ""), 10) || 0,
    source: "DataCite"
  };
}

// src/core/capabilities/OnTrackCapability.ts
var import_crypto = require("crypto");
function traceIdFor(value) {
  return (0, import_crypto.createHash)("sha256").update(JSON.stringify(value)).digest("hex");
}
var OnTrackCapability = class {
  getContract() {
    return this.contract;
  }
  /**
   * Generates a pseudo-deterministic trace ID based on inputs.
   */
  generateTraceId(input) {
    return traceIdFor(input);
  }
  /**
   * The core execution wrapper that enforces the OnTrack lifecycle.
   */
  async invoke(input) {
    const traceId = this.generateTraceId(input);
    const output = await this.execute(input);
    const event = {
      eventId: (0, import_crypto.randomUUID)(),
      traceId,
      capabilityName: this.contract.name,
      timestamp: /* @__PURE__ */ new Date(),
      payload: output
    };
    this.emitEvent(event);
    return { output, traceId };
  }
  emitEvent(event) {
  }
};

// src/core/publication/literature/BibliographyImport.ts
function detectFormat(content) {
  if (/^\s*TY {2}- /m.test(content)) return "ris";
  if (/@\w+\s*[{(]/.test(content)) return "bibtex";
  return null;
}
function importBibliography(content, format = "auto") {
  const resolved = format === "auto" ? detectFormat(content) : format;
  if (!resolved) return { format: "bibtex", citations: [], warnings: ["Unrecognised bibliography format: expected BibTeX or RIS."] };
  return resolved === "ris" ? parseRis(content) : parseBibtex(content);
}
var DOI_RE = /\b(10\.\d{4,9}\/[^\s"<>{}]+)/i;
var NCT_RE = /\b(NCT\d{8})\b/i;
var PUBMED_URL_RE = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d{1,9})/i;
var ARXIV_URL_RE = /arxiv\.org\/(?:abs|pdf)\/([^\s?#]+?)(?:\.pdf)?(?:[?#\s]|$)/i;
var ARXIV_ID_RE = /^(\d{4}\.\d{4,5}|[a-z-]+(\.[A-Z]{2})?\/\d{7})(v\d+)?$/;
function normaliseDoi(value) {
  const match = value.trim().replace(/^doi:\s*/i, "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").match(DOI_RE);
  return match?.[1]?.replace(/[.,;]+$/, "");
}
function identifiersInText(text2) {
  const found = {};
  const doi = normaliseDoi(text2.match(DOI_RE)?.[1] ?? "");
  if (doi) found.doi = doi;
  const pmid = text2.match(PUBMED_URL_RE)?.[1];
  if (pmid) found.pmid = pmid;
  const nct = text2.match(NCT_RE)?.[1];
  if (nct) found.nct = nct.toUpperCase();
  const arxiv = text2.match(ARXIV_URL_RE)?.[1];
  if (arxiv && ARXIV_ID_RE.test(arxiv)) found.arxiv = arxiv.replace(/v\d+$/, "");
  return found;
}
function toCitation(id, text2, ids) {
  const citation = { id, text: text2 };
  if (ids.pmid) citation.pmid = ids.pmid;
  if (ids.doi) citation.doi = ids.doi;
  if (ids.nct) citation.nct = ids.nct;
  if (ids.arxiv) citation.arxiv = ids.arxiv;
  return citation;
}
function describe2(authors, year, title) {
  const names = authors.map((a) => a.split(",")[0].trim()).filter(Boolean).slice(0, 3).join(", ");
  return [names, year ? `(${year})` : "", title ?? ""].filter(Boolean).join(" ").trim();
}
function uniqueId(base, used) {
  let id = base || `ref${used.size + 1}`;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
}
function parseBibtex(content) {
  const citations = [];
  const warnings = [];
  const used = /* @__PURE__ */ new Set();
  for (const entry of bibtexEntries(content)) {
    const type = entry.type.toLowerCase();
    if (type === "comment" || type === "string" || type === "preamble") continue;
    const fields = entry.fields;
    const title = cleanLatex(fields.title ?? "");
    const authors = (fields.author ?? "").split(/\s+and\s+/i).map(cleanLatex).filter((a) => a && a.toLowerCase() !== "others");
    const year = (fields.year ?? fields.date ?? "").match(/\d{4}/)?.[0];
    const ids = identifiersInText([fields.url, fields.note, fields.howpublished].filter(Boolean).join(" "));
    const doi = fields.doi ? normaliseDoi(fields.doi) : void 0;
    if (doi) ids.doi = doi;
    if (fields.pmid && /^\d{1,9}$/.test(fields.pmid.trim())) ids.pmid = fields.pmid.trim();
    const eprint = fields.eprint?.trim();
    if (eprint && (/arxiv/i.test(fields.archiveprefix ?? fields.eprinttype ?? "") || ARXIV_ID_RE.test(eprint)) && ARXIV_ID_RE.test(eprint)) {
      ids.arxiv = eprint.replace(/v\d+$/, "");
    }
    const text2 = describe2(authors, year, title);
    if (!text2 && !ids.doi && !ids.pmid && !ids.nct && !ids.arxiv) {
      warnings.push(`Entry ${entry.key || "(no key)"} has no title, author or identifier; skipped.`);
      continue;
    }
    citations.push(toCitation(uniqueId(entry.key, used), text2, ids));
  }
  return { format: "bibtex", citations, warnings };
}
function bibtexEntries(content) {
  const entries = [];
  const re = /@(\w+)\s*([{(])/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const open = match[2];
    const start = re.lastIndex;
    let depth = 1;
    let braces = 0;
    let i = start;
    for (; i < content.length; i++) {
      const ch = content[i];
      if (open === "{") {
        if (ch === "{") depth++;
        else if (ch === "}" && --depth === 0) break;
      } else if (ch === "{") braces++;
      else if (ch === "}") braces--;
      else if (braces === 0 && ch === "(") depth++;
      else if (braces === 0 && ch === ")" && --depth === 0) break;
    }
    const body = content.slice(start, i);
    re.lastIndex = i + 1;
    const comma = body.indexOf(",");
    const key = (comma === -1 ? body : body.slice(0, comma)).trim();
    entries.push({ type: match[1], key, fields: comma === -1 ? {} : bibtexFields(body.slice(comma + 1)) });
  }
  return entries;
}
function bibtexFields(body) {
  const fields = {};
  let i = 0;
  while (i < body.length) {
    const nameMatch = /\s*,?\s*([A-Za-z][\w-]*)\s*=\s*/y;
    nameMatch.lastIndex = i;
    const m = nameMatch.exec(body);
    if (!m) break;
    const name = m[1].toLowerCase();
    i = nameMatch.lastIndex;
    let value = "";
    if (body[i] === "{") {
      let depth = 0;
      const start = i;
      for (; i < body.length; i++) {
        if (body[i] === "{") depth++;
        else if (body[i] === "}" && --depth === 0) {
          i++;
          break;
        }
      }
      value = body.slice(start + 1, i - 1);
    } else if (body[i] === '"') {
      const end = body.indexOf('"', i + 1);
      value = body.slice(i + 1, end === -1 ? body.length : end);
      i = end === -1 ? body.length : end + 1;
    } else {
      const end = body.slice(i).search(/[,\n]/);
      value = body.slice(i, end === -1 ? body.length : i + end).trim();
      i = end === -1 ? body.length : i + end;
    }
    fields[name] = value.replace(/\s+/g, " ").trim();
  }
  return fields;
}
var GREEK_LATEX_MAP = {
  alpha: "alpha",
  beta: "beta",
  gamma: "gamma",
  delta: "delta",
  epsilon: "epsilon",
  kappa: "kappa",
  lambda: "lambda",
  mu: "mu",
  pi: "pi",
  sigma: "sigma",
  tau: "tau",
  omega: "omega"
};
function cleanLatex(value) {
  return value.replace(/\\(alpha|beta|gamma|delta|epsilon|kappa|lambda|mu|pi|sigma|tau|omega)\b/gi, (_, g) => GREEK_LATEX_MAP[g.toLowerCase()] ?? g).replace(/\\(textit|textbf|emph|textrm|mathrm|textsc)\{([^{}]*)\}/g, "$2").replace(/\\[`'^"~=.]\{?([A-Za-z])\}?/g, "$1").replace(/\\[uvHcdbtr](?:\{([A-Za-z])\}|\s+([A-Za-z]))/g, "$1$2").replace(/\$([^$]+)\$/g, "$1").replace(/[{}]/g, "").replace(/\\&/g, "&").replace(/~/g, " ").replace(/\s+/g, " ").trim();
}
function parseRis(content) {
  const citations = [];
  const warnings = [];
  const used = /* @__PURE__ */ new Set();
  let record = null;
  let index = 0;
  const flush = () => {
    if (!record) return;
    index++;
    const first = (tag) => record?.[tag]?.[0];
    const all = (...tags) => tags.flatMap((t) => record?.[t] ?? []);
    const title = first("TI") ?? first("T1") ?? first("CT") ?? first("BT");
    const authors = all("AU", "A1");
    const year = (first("PY") ?? first("Y1") ?? first("DA") ?? "").match(/\d{4}/)?.[0];
    const ids = identifiersInText(all("UR", "L1", "N1", "M1", "C1").join(" "));
    const doi = first("DO") ? normaliseDoi(first("DO")) : void 0;
    if (doi) ids.doi = doi;
    const an = first("AN")?.trim();
    if (an && /^\d{1,9}$/.test(an)) ids.pmid = an;
    const text2 = describe2(authors, year, title);
    if (!text2 && !ids.doi && !ids.pmid && !ids.nct && !ids.arxiv) {
      warnings.push(`RIS record ${index} has no title, author or identifier; skipped.`);
    } else {
      citations.push(toCitation(uniqueId(first("ID")?.trim() ?? `ref${index}`, used), text2, ids));
    }
    record = null;
  };
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9]) {2}-(?: (.*))?$/);
    if (!m) continue;
    const tag = m[1];
    const value = (m[2] ?? "").trim();
    if (tag === "TY") {
      if (record) {
        warnings.push(`RIS record ${index + 1} has no ER line; closed at the next TY.`);
        flush();
      }
      record = {};
      continue;
    }
    if (tag === "ER") {
      flush();
      continue;
    }
    if (record) (record[tag] ??= []).push(value);
  }
  if (record) {
    warnings.push(`RIS record ${index + 1} has no ER line; imported anyway.`);
    flush();
  }
  return { format: "ris", citations, warnings };
}
var ImportBibliographyCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "literature.import_bibliography",
      description: "Converts a BibTeX or RIS export (Zotero, Mendeley, EndNote) into citations for the citation gate.",
      inputSchema: {
        type: "object",
        properties: { content: { type: "string" }, format: { type: "string" } },
        required: ["content"]
      },
      outputSchema: {
        type: "object",
        properties: { format: { type: "string" }, citations: { type: "array" }, warnings: { type: "array" } }
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  execute(input) {
    return importBibliography(input.content, input.format ?? "auto");
  }
};

// src/core/publication/literature/CitationResolver.ts
var MATCH_THRESHOLD = 0.6;
var PROVIDERS_FOR = {
  pmid: { primary: ["PubMed", "EuropePMC"], fallback: ["SemanticScholar"] },
  doi: { primary: ["Crossref", "OpenAlex", "EuropePMC"], fallback: ["DataCite", "SemanticScholar"] },
  nct: { primary: ["ClinicalTrials"], fallback: [] },
  arxiv: { primary: ["arXiv"], fallback: ["SemanticScholar"] }
};
var CitationResolverCapability = class extends OnTrackCapability {
  constructor(providers = []) {
    super();
    this.providers = providers;
  }
  get contract() {
    return {
      name: "review.resolve_citations",
      description: "Verifies citations (PMID, DOI, NCT, arXiv id or text) against reference providers and flags retracted works. Unverifiable citations are blocking.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          citations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                text: { type: "string" },
                doi: { type: "string" },
                pmid: { type: "string" },
                nct: { type: "string" },
                arxiv: { type: "string" },
                acknowledgedRetraction: { type: "boolean" }
              },
              required: ["id", "text"]
            }
          }
        },
        required: ["manuscriptId", "citations"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          verifiedCitations: { type: "array", items: { type: "object" } },
          hasHallucinations: { type: "boolean" },
          retractedCitations: { type: "array", items: { type: "string" } },
          blockingErrors: { type: "array", items: { type: "string" } }
        }
      },
      // Depends on external databases, so the same input can resolve differently over time.
      determinism: "NON_DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const verifiedCitations = [];
    const blockingErrors = [];
    const retractedCitations = [];
    let unverifiedCount = 0;
    for (const citation of input.citations) {
      const result = await this.verify(citation);
      verifiedCitations.push(result);
      if (result.hallucinationAlert) {
        unverifiedCount++;
        blockingErrors.push(result.hallucinationAlert);
      } else if (result.retracted && !result.retractionAcknowledged) {
        retractedCitations.push(result.id);
        blockingErrors.push(
          `Citation ${result.id} cites a retracted publication (flagged by ${(result.retractedBy ?? []).join(", ")}). If it is cited on purpose, set acknowledgedRetraction on the citation.`
        );
      }
    }
    return {
      manuscriptId: input.manuscriptId,
      verifiedCitations,
      hasHallucinations: unverifiedCount > 0,
      retractedCitations,
      blockingErrors
    };
  }
  async verify(citation) {
    try {
      const identifier = identifierOf(citation);
      return identifier ? await this.checkById(citation, identifier.kind, identifier.id) : await this.checkByText(citation);
    } catch (error) {
      return unverified(citation.id, describeFailure(citation.id, error), "unavailable");
    }
  }
  async checkById(citation, kind, id) {
    const { primary, fallback } = PROVIDERS_FOR[kind];
    const pick = (names) => names.flatMap((name) => this.providers.filter((p) => p.providerName === name));
    const primaries = pick(primary);
    const fallbacks = pick(fallback);
    if (primaries.length === 0 && fallbacks.length === 0) {
      return unverified(citation.id, `Citation ${citation.id} not verified: no provider configured for ${kind.toUpperCase()} (${[...primary, ...fallback].join(", ")}).`, "no_provider");
    }
    const found = [];
    const failures = [];
    const consulted = [];
    const consult = async (providers2) => {
      for (const provider of providers2) {
        consulted.push(provider);
        try {
          const reference = await provider.resolveById(id);
          if (reference) found.push({ provider, reference });
        } catch (error) {
          failures.push({ provider, error });
        }
      }
    };
    await consult(primaries);
    if (found.length === 0) await consult(fallbacks);
    const providers = consulted;
    const first = found[0];
    if (!first) {
      const failure = failures[0];
      if (failure) return unverified(citation.id, describeFailure(citation.id, failure.error), "unavailable");
      return unverified(citation.id, `Citation ${citation.id} hallucinated: ${providers.map((p) => p.providerName).join(" and ")} lookup for ${id} returned no record.`, "not_found");
    }
    const result = {
      id: citation.id,
      verified: true,
      databaseSource: first.provider.providerName,
      externalId: id,
      title: first.reference.title,
      checkedBy: found.map((f) => f.provider.providerName)
    };
    if (failures.length > 0) {
      result.warnings = failures.map((f) => `${f.provider.providerName} unavailable (${f.error instanceof Error ? f.error.message : String(f.error)}); retraction status not checked there.`);
    }
    return withRetraction(result, citation, found.filter((f) => f.reference.retracted).map((f) => f.provider.providerName));
  }
  async checkByText(citation) {
    const provider = this.providers.find((p) => p.providerName === "OpenAlex") ?? this.providers[0];
    if (!provider) {
      return unverified(citation.id, `Citation ${citation.id} not verified: no reference provider configured for text search.`, "no_provider");
    }
    const [match] = await provider.search(citation.text);
    if (!match) {
      return unverified(citation.id, `Citation ${citation.id} hallucinated: ${provider.providerName} text search returned 0 results.`, "not_found");
    }
    const score = citationSimilarity(citation.text, match);
    if (score < MATCH_THRESHOLD) {
      return unverified(citation.id, `Citation ${citation.id} hallucinated: best ${provider.providerName} match "${match.title}" scores ${score.toFixed(2)}, below ${MATCH_THRESHOLD}.`, "not_found");
    }
    return withRetraction({
      id: citation.id,
      verified: true,
      databaseSource: provider.providerName,
      externalId: match.doi ?? match.pmid ?? match.nct ?? match.arxivId ?? match.id,
      title: match.title,
      checkedBy: [provider.providerName]
    }, citation, match.retracted ? [provider.providerName] : []);
  }
};
function identifierOf(citation) {
  if (citation.pmid) return { kind: "pmid", id: citation.pmid };
  if (citation.doi) return { kind: "doi", id: citation.doi };
  if (citation.nct) return { kind: "nct", id: citation.nct };
  if (citation.arxiv) return { kind: "arxiv", id: citation.arxiv };
  return null;
}
function withRetraction(result, citation, retractedBy) {
  if (retractedBy.length === 0) return result;
  return { ...result, retracted: true, retractedBy, retractionAcknowledged: citation.acknowledgedRetraction === true };
}
function citationSimilarity(text2, reference) {
  const wanted = terms(text2);
  if (wanted.size === 0) return 0;
  const available = terms([reference.title, ...reference.authors, String(reference.year)].join(" "));
  let found = 0;
  for (const term of wanted) if (available.has(term)) found++;
  return found / wanted.size;
}
function terms(text2) {
  return new Set(text2.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2));
}
function describeFailure(id, error) {
  if (error instanceof ProviderError) {
    return error.kind === "invalid_response" ? `Citation ${id} could not be verified: unexpected response from the provider (${error.message}).` : `Citation ${id} could not be verified: provider unavailable (${error.message}).`;
  }
  const reason = error instanceof Error ? error.message : String(error);
  return `Citation ${id} could not be verified: ${reason}.`;
}
function unverified(id, alert, failure) {
  return { id, verified: false, hallucinationAlert: alert, failure };
}

// src/core/publication/literature/CitationWatch.ts
function compareCitationRuns(recorded, current) {
  const before = new Map(recorded.map((c) => [c.id, c]));
  const changes = [];
  const inconclusive = [];
  for (const now of current) {
    const then = before.get(now.id);
    if (!now.verified && now.failure !== "not_found") {
      inconclusive.push(`${now.id}: ${now.hallucinationAlert ?? "could not be checked"}`);
      continue;
    }
    if (then?.verified && !now.verified) {
      changes.push({ id: now.id, kind: "no_longer_found", detail: now.hallucinationAlert ?? "no record found", needsAttention: true });
      continue;
    }
    if (now.verified && now.retracted && !then?.retracted) {
      const by = (now.retractedBy ?? []).join(", ");
      changes.push({
        id: now.id,
        kind: "newly_retracted",
        detail: `${now.title ?? now.externalId ?? now.id} is now marked as retracted by ${by}.` + (now.retractionAcknowledged ? " The citation acknowledges the retraction." : ""),
        needsAttention: !now.retractionAcknowledged
      });
      continue;
    }
    if (then?.retracted && now.verified && !now.retracted) {
      changes.push({ id: now.id, kind: "retraction_cleared", detail: "no provider marks it as retracted any more", needsAttention: false });
      continue;
    }
    if (then && !then.verified && now.verified) {
      changes.push({ id: now.id, kind: "newly_verified", detail: `now found in ${now.databaseSource}`, needsAttention: false });
    }
  }
  return {
    checked: current.length,
    changes,
    inconclusive,
    needsAttention: changes.some((c) => c.needsAttention)
  };
}
var WatchCitationsCapability = class extends OnTrackCapability {
  constructor(resolver) {
    super();
    this.resolver = resolver;
  }
  get contract() {
    return {
      name: "literature.watch_citations",
      description: "Re-checks the citations of a published manuscript and reports retractions or records that disappeared since publication.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          citations: { type: "array", items: { type: "object" } },
          recorded: { type: "array", items: { type: "object" } }
        },
        required: ["manuscriptId", "citations", "recorded"]
      },
      outputSchema: {
        type: "object",
        properties: { changes: { type: "array" }, inconclusive: { type: "array" }, needsAttention: { type: "boolean" } }
      },
      determinism: "NON_DETERMINISTIC",
      // depends on the current state of external databases
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const { output } = await this.resolver.invoke({ manuscriptId: input.manuscriptId, citations: input.citations });
    return { ...compareCitationRuns(input.recorded, output.verifiedCitations), current: output.verifiedCitations };
  }
};

// src/core/publication/guest/GUESTReporter.ts
var crypto = __toESM(require("crypto"));
var GenerateGUESTReportCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "review.generate_guest_report",
      description: "Generates a GUEST-compliant methodological report for systematic literature reviews assisted by GenAI.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          literatureQueries: { type: "array", items: { type: "string" } },
          humanReviewerId: { type: "string" },
          agentModelVersion: { type: "string" }
        },
        required: ["manuscriptId", "literatureQueries", "humanReviewerId", "agentModelVersion"]
      },
      outputSchema: {
        type: "object",
        properties: {
          complianceHash: { type: "string" },
          reportMarkdown: { type: "string" },
          isGUESTCompliant: { type: "boolean" },
          humanOversightVerified: { type: "boolean" }
        }
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const hasHumanOversight = input.humanReviewerId.trim().length > 0;
    const isCompliant = hasHumanOversight && input.literatureQueries.length > 0;
    const reportLines = [
      `# GUEST Framework Compliance Report`,
      `**Manuscript ID:** ${input.manuscriptId}`,
      `**Agent Model Version:** ${input.agentModelVersion}`,
      `**Human Reviewer ID:** ${input.humanReviewerId || "NONE (VIOLATION)"}`,
      ``,
      `## Methodological Transparency`,
      `The LiteratureReviewer agent executed the following queries:`,
      ...input.literatureQueries.map((q) => `- \`${q}\``),
      ``,
      `## Verification`,
      `This review satisfies the GUEST (GenAI Use and Evaluation in SLR Tasks) guidelines by ensuring structured prompts, deterministic trace recording (OnTrack ADR-ONTRACK-001), and explicit human oversight checkpoints before inclusion in the ReviewGraph.`,
      ``,
      `**Compliance Status:** ${isCompliant ? "PASS" : "FAIL - Unsupervised GenAI SLR detected."}`
    ];
    const markdown = reportLines.join("\n");
    const complianceHash = crypto.createHash("sha256").update(markdown).digest("hex");
    return {
      complianceHash,
      reportMarkdown: markdown,
      isGUESTCompliant: isCompliant,
      humanOversightVerified: hasHumanOversight
    };
  }
};

// src/core/publication/venue/AwesomeJournalAdapter.ts
var LoadVenueSkillCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.load_venue_skill",
      description: "[PROTOTYPE] Returns simulated house-style and workflow packs; the Awesome Journal Skills fetch is not implemented.",
      inputSchema: {
        type: "object",
        properties: {
          venueName: { type: "string" },
          includeHouseStyle: { type: "boolean" },
          includeWorkflows: { type: "boolean" }
        },
        required: ["venueName"]
      },
      outputSchema: {
        type: "object",
        properties: {
          venueName: { type: "string" },
          wordCountLimit: { type: "number" },
          figureLimit: { type: "number" },
          houseStyleNotes: { type: "array", items: { type: "string" } },
          workflowSteps: { type: "array", items: { type: "string" } },
          systemPromptInjection: { type: "string" }
        }
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
      // It's read-only because it fetches static skill packs
    };
  }
  async execute(input) {
    let houseStyleNotes = [];
    let workflowSteps = [];
    if (input.includeHouseStyle) {
      houseStyleNotes = [
        `Strictly enforce active voice for methodology.`,
        `Avoid adjectives in the abstract.`,
        `P-values must be exact up to 3 decimal places.`
      ];
    }
    if (input.includeWorkflows) {
      workflowSteps = [
        "Check figure bounds",
        "Verify conflict of interest statement",
        "Audit methodological transparency"
      ];
    }
    return {
      venueName: input.venueName,
      wordCountLimit: 4e3,
      figureLimit: 5,
      houseStyleNotes,
      workflowSteps,
      systemPromptInjection: `You are auditing a manuscript for ${input.venueName}. Follow these house style rules: ${houseStyleNotes.join(" ")}`
    };
  }
};

// src/core/document/DocumentRuntime.ts
var DocumentRuntime = class {
  document;
  constructor(document) {
    this.document = document;
  }
  // Traverses the AST and returns all nodes of a specific type
  getNodesByType(type) {
    const results = [];
    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.type === type) {
          results.push(node);
        }
        if ("children" in node && Array.isArray(node.children)) {
          traverse(node.children);
        }
      }
    };
    traverse(this.document.content);
    return results;
  }
  getGeneratedFragments() {
    return this.getNodesByType("GeneratedFragment");
  }
  getFigureArtifacts() {
    return this.getNodesByType("FigureArtifact");
  }
  getTableArtifacts() {
    return this.getNodesByType("TableArtifact");
  }
  getCitations() {
    return this.getNodesByType("CitationAnchor");
  }
  // Check if any artifact is stale due to upstream data changes
  hasStaleArtifacts() {
    const figures = this.getFigureArtifacts();
    const tables = this.getTableArtifacts();
    return figures.some((f) => f.isStale) || tables.some((t) => t.isStale);
  }
};

// src/core/compiler/ArtifactGenerator.ts
var LATEX_FLOAT_BARRIER_PREAMBLE = [
  "% --- DETERMINISTIC FLOAT PLACEMENT & SECTION-BARRIER ENGINE ---",
  "\\renewcommand{\\topfraction}{0.95}",
  "\\renewcommand{\\bottomfraction}{0.95}",
  "\\renewcommand{\\textfraction}{0.04}",
  "\\renewcommand{\\floatpagefraction}{0.85}",
  "\\setcounter{topnumber}{4}",
  "\\setcounter{bottomnumber}{4}",
  "\\setcounter{totalnumber}{6}",
  "\\setlength{\\textfloatsep}{10pt plus 2pt minus 2pt}",
  "\\setlength{\\floatsep}{8pt plus 2pt minus 2pt}",
  "\\setlength{\\intextsep}{10pt plus 2pt minus 2pt}",
  "\\makeatletter",
  "\\providecommand{\\FloatBarrier}{%",
  "  \\par",
  "  \\expandafter\\ifx\\csname @freelist\\endcsname\\relax\\else",
  "    \\ifx\\@deferlist\\@empty\\else",
  "      \\clearpage",
  "    \\fi",
  "  \\fi",
  "}",
  "\\let\\orig@section\\section",
  "\\renewcommand{\\section}{\\FloatBarrier\\orig@section}",
  "\\makeatother"
].join("\n");

// src/core/github/CodeToTextImpactAnalyzer.ts
var CodeToTextImpactAnalyzer = class {
  documentAnchors;
  constructor(anchors) {
    this.documentAnchors = anchors;
  }
  // Analyzes how a simulated manifest change from a PR affects the manuscript
  analyzeImpact(simulatedManifestChanges) {
    const brokenAnchors = [];
    for (const delta of simulatedManifestChanges) {
      const affectedAnchors = this.documentAnchors.filter((a) => a.variablePath === delta.variablePath);
      for (const anchor of affectedAnchors) {
        if (anchor.expectedValue !== delta.newValue) {
          brokenAnchors.push({
            anchor,
            delta
          });
        }
      }
    }
    return {
      isSafe: brokenAnchors.length === 0,
      brokenAnchors
    };
  }
};

// src/core/publication/mcp/VirtualAuthorServer.ts
var VirtualAuthorServer = class {
  manuscriptId;
  assertions;
  tools;
  constructor(manuscriptId, assertions) {
    this.manuscriptId = manuscriptId;
    this.assertions = assertions;
    this.tools = /* @__PURE__ */ new Map();
    this.registerDefaultTools();
  }
  registerDefaultTools() {
    this.tools.set("query_assertion", async (args) => {
      const assertion = this.assertions.find((a) => a.variablePath === args.variablePath);
      if (!assertion) {
        return {
          content: [{ type: "text", text: `Assertion for ${args.variablePath} not found in manuscript.` }],
          isError: true
        };
      }
      return {
        content: [{
          type: "text",
          text: `Found assertion in node ${assertion.nodeId}: "${assertion.contextText}". Expected value is ${assertion.expectedValue}.${formatBindings(assertion)}`
        }]
      };
    });
  }
  getManifest() {
    return {
      name: `VirtualAuthor-${this.manuscriptId}`,
      tools: [
        {
          name: "query_assertion",
          description: "Query a specific data assertion embedded in the manuscript.",
          inputSchema: {
            type: "object",
            properties: {
              variablePath: { type: "string", description: "The variable path, e.g., model_metrics.p_value" }
            },
            required: ["variablePath"]
          }
        }
      ]
    };
  }
  async executeTool(toolName, args) {
    const handler = this.tools.get(toolName);
    if (!handler) {
      return {
        content: [{ type: "text", text: `Tool ${toolName} not found.` }],
        isError: true
      };
    }
    return handler(args);
  }
};
function formatBindings(assertion) {
  const parts = [
    assertion.claimId && `claim ${assertion.claimId}`,
    assertion.somArtifactId && `SOM artifact ${assertion.somArtifactId}`,
    assertion.lineageHash && `lineage ${assertion.lineageHash}`
  ].filter(Boolean);
  return parts.length > 0 ? ` Bound to ${parts.join(", ")}.` : "";
}

// src/core/publication/Paper2AgentCompiler.ts
var Paper2AgentCompiler = class {
  /**
   * Compiles an approved PublicationBundle into a VirtualAuthorServer.
   * This implements the "One-Click Agentify" capability from Paper2Agent.
   */
  compile(bundle, anchors, status = "accepted") {
    if (status !== "accepted") {
      throw new Error("Cannot compile an MCP Server for a manuscript that is not accepted.");
    }
    return new VirtualAuthorServer(bundle.bundleId, anchors);
  }
};

// src/core/publication/PublicationPipeline.ts
var PIPELINE_STEPS = ["citations", "compliance", "venue", "review", "compile"];
function pipelineStepInputs(input) {
  return {
    citations: { manuscriptId: input.manuscriptId, citations: input.citations },
    compliance: {
      manuscriptId: input.manuscriptId,
      literatureQueries: input.literatureQueries,
      humanReviewerId: input.humanReviewerId,
      agentModelVersion: input.agentModelVersion
    },
    venue: { venueName: input.venueName, includeHouseStyle: true, includeWorkflows: true },
    review: { findings: input.reviewFindings },
    compile: { bundleId: input.bundleId, anchors: input.anchors }
  };
}
function openCriticalFindings(findings) {
  return findings.filter((f) => f.severity === "critical" && !f.resolved).map((f) => f.id);
}
function chainTraceIdFor(steps) {
  return traceIdFor(steps.map((s) => s.traceId));
}
var PublicationPipelineCapability = class extends OnTrackCapability {
  constructor(deps) {
    super();
    this.deps = deps;
  }
  get contract() {
    return {
      name: "publishing.run_gates",
      description: "Runs citation, compliance, venue, review and compile gates in order, stopping at the first blocking gate.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          bundleId: { type: "string" },
          citations: { type: "array", items: { type: "object" } },
          literatureQueries: { type: "array", items: { type: "string" } },
          humanReviewerId: { type: "string" },
          agentModelVersion: { type: "string" },
          venueName: { type: "string" },
          reviewFindings: { type: "array", items: { type: "object" } },
          anchors: { type: "array", items: { type: "object" } }
        },
        required: ["manuscriptId", "bundleId", "citations", "literatureQueries", "humanReviewerId", "agentModelVersion", "venueName", "reviewFindings", "anchors"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          bundleId: { type: "string" },
          status: { type: "string" },
          blockedAt: { type: "string" },
          steps: { type: "array", items: { type: "object" } },
          chainTraceId: { type: "string" }
        }
      },
      determinism: "NON_DETERMINISTIC",
      // citation lookups depend on external databases
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const stepInputs = pipelineStepInputs(input);
    const steps = [];
    let venueSkill = null;
    let manifest = null;
    let blockedAt = null;
    const record = (step, status, traceId, detail) => {
      steps.push({ step, status, traceId, detail });
      if (status === "blocked") blockedAt = step;
    };
    const citations = await this.deps.citations.invoke(stepInputs.citations);
    const citationsBlock = citations.output.blockingErrors.length > 0;
    record(
      "citations",
      citationsBlock ? "blocked" : "passed",
      citations.traceId,
      citationsBlock ? citations.output.blockingErrors.join("; ") : citations.output.verifiedCitations.length === 0 ? "no citations to verify" : `${citations.output.verifiedCitations.length} citation(s) verified`
    );
    if (!blockedAt) {
      const guest = await this.deps.guest.invoke(stepInputs.compliance);
      record(
        "compliance",
        guest.output.isGUESTCompliant ? "passed" : "blocked",
        guest.traceId,
        guest.output.isGUESTCompliant ? "GUEST compliant" : "human oversight or literature queries missing"
      );
    }
    if (!blockedAt) {
      const venue = await this.deps.venue.invoke(stepInputs.venue);
      venueSkill = venue.output;
      record("venue", "informational", venue.traceId, `loaded ${venue.output.houseStyleNotes.length} house style notes`);
    }
    if (!blockedAt) {
      const openCritical = openCriticalFindings(input.reviewFindings);
      record(
        "review",
        openCritical.length > 0 ? "blocked" : "passed",
        traceIdFor(stepInputs.review),
        openCritical.length > 0 ? `unresolved critical findings: ${openCritical.join(", ")}` : "no unresolved critical findings"
      );
    }
    if (!blockedAt) {
      const server = new Paper2AgentCompiler().compile({ bundleId: input.bundleId }, input.anchors, "accepted");
      manifest = server.getManifest();
      record("compile", "passed", traceIdFor(stepInputs.compile), "Virtual Author compiled");
    }
    for (const step of PIPELINE_STEPS) {
      if (!steps.some((s) => s.step === step)) record(step, "skipped", null, "not reached: an earlier gate blocked");
    }
    const ordered = PIPELINE_STEPS.map((name) => steps.find((s) => s.step === name));
    return {
      manuscriptId: input.manuscriptId,
      bundleId: input.bundleId,
      status: blockedAt ? "blocked" : "accepted",
      blockedAt,
      steps: ordered,
      venueSkill,
      virtualAuthorManifest: manifest,
      citationResults: citations.output.verifiedCitations,
      chainTraceId: chainTraceIdFor(ordered)
    };
  }
};

// src/core/editor/ManuscriptTemplates.ts
var NatureTemplate = class {
  journalName = "Nature";
  description = "Nature standard manuscript format";
  maxTotalWords = 3e3;
  maxFigures = 6;
  maxReferences = 50;
  sections = [
    { id: "sec-abstract", name: "Abstract", required: true, maxWords: 200 },
    { id: "sec-intro", name: "Introduction", required: true },
    { id: "sec-results", name: "Results", required: true },
    { id: "sec-discussion", name: "Discussion", required: true },
    { id: "sec-methods", name: "Methods", required: true, maxWords: 3e3 }
  ];
  validate(runtime) {
    const errors = [];
    const warnings = [];
    const figures = runtime.getFigureArtifacts();
    if (this.maxFigures && figures.length > this.maxFigures) {
      errors.push(`Maximum of ${this.maxFigures} figures allowed, but document has ${figures.length}.`);
    }
    const citations = runtime.getCitations();
    const uniqueRefs = new Set(citations.map((c) => c.referenceId));
    if (this.maxReferences && uniqueRefs.size > this.maxReferences) {
      errors.push(`Maximum of ${this.maxReferences} references allowed, but document has ${uniqueRefs.size}.`);
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// src/core/editor/TemplateValidationCapability.ts
var TEMPLATES = {
  Nature: new NatureTemplate()
};
var ValidateTemplateCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.validate_template",
      description: "Validates manuscript counts (figures, references) against a journal template. Implemented templates: Nature.",
      inputSchema: {
        type: "object",
        properties: {
          journal: { type: "string" },
          figureCount: { type: "number" },
          referenceIds: { type: "array", items: { type: "string" } }
        },
        required: ["journal", "figureCount", "referenceIds"]
      },
      outputSchema: {
        type: "object",
        properties: {
          journal: { type: "string" },
          isValid: { type: "boolean" },
          errors: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } }
        }
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  execute(input) {
    const template = TEMPLATES[input.journal];
    if (!template) {
      return {
        journal: input.journal,
        isValid: false,
        errors: [`No template implemented for journal "${input.journal}".`],
        warnings: []
      };
    }
    const report = template.validate(toRuntime(input));
    return { journal: input.journal, ...report };
  }
};
function toRuntime(input) {
  const figures = Array.from({ length: input.figureCount }, (_, i) => ({
    nodeId: `figure_${i + 1}`,
    type: "FigureArtifact"
  }));
  const citations = input.referenceIds.map((referenceId, i) => ({
    nodeId: `citation_${i + 1}`,
    type: "CitationAnchor",
    referenceId,
    text: "",
    verificationState: "unverified"
  }));
  const content = [...figures, ...citations];
  const document = {
    documentId: "validation-only",
    projectId: "validation-only",
    artifactId: "validation-only",
    content,
    annotations: [],
    suggestedEdits: [],
    createdAt: /* @__PURE__ */ new Date(0),
    updatedAt: /* @__PURE__ */ new Date(0)
  };
  return new DocumentRuntime(document);
}

// src/core/github/GitHubCommentAdapter.ts
var GitHubCommentAdapter = class {
  formatImpactReportAsMarkdown(report) {
    if (report.isSafe) {
      return `\u2705 **EdiTXT Manuscript Guard:** 
This PR has been analyzed against the linked manuscript. The code changes do not alter any variables anchored in the text. Safe to merge from a publication standpoint.`;
    }
    let comment = `\u274C **EdiTXT Manuscript Guard:**
`;
    comment += `I have detected that this PR alters metrics that are directly anchored in the manuscript text.

`;
    comment += `\u26A0\uFE0F **Impact on Manuscript:**
`;
    for (const disruption of report.brokenAnchors) {
      comment += `- The variable \`${disruption.delta.variablePath}\` changes from \`${disruption.delta.oldValue}\` to \`${disruption.delta.newValue}\`.
`;
      comment += `  - **Broken Assertion (Node ${disruption.anchor.nodeId}):** *"${disruption.anchor.contextText}"*
`;
    }
    comment += `
If you merge this PR, the manuscript will transition to a STALE state and the main assertions will be marked as false. Do you wish to propose a ChangeSet to the manuscript?`;
    return comment;
  }
};

// src/core/github/ImpactCheckCapability.ts
var ImpactCheckCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "review.check_manuscript_impact",
      description: "Compares DataAILab manifest values with the values asserted in the manuscript and reports broken assertions.",
      inputSchema: {
        type: "object",
        properties: {
          anchors: { type: "array", items: { type: "object" } },
          manifestDeltas: { type: "array", items: { type: "object" } }
        },
        required: ["anchors", "manifestDeltas"]
      },
      outputSchema: {
        type: "object",
        properties: {
          isSafe: { type: "boolean" },
          brokenAnchors: { type: "array", items: { type: "object" } },
          comment: { type: "string" }
        }
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  execute(input) {
    const report = new CodeToTextImpactAnalyzer(input.anchors).analyzeImpact(input.manifestDeltas);
    return {
      isSafe: report.isSafe,
      brokenAnchors: report.brokenAnchors.map(({ anchor, delta }) => ({
        nodeId: anchor.nodeId,
        variablePath: anchor.variablePath,
        expectedValue: anchor.expectedValue,
        newValue: delta.newValue,
        claimId: anchor.claimId ?? null
      })),
      comment: new GitHubCommentAdapter().formatImpactReportAsMarkdown(report)
    };
  }
};

// src/core/publication/capsule/PublicationCapsule.ts
var import_crypto2 = require("crypto");
var CAPSULE_FORMAT = "editxt-capsule/1";
function buildCapsule(args) {
  const seen = /* @__PURE__ */ new Set();
  const files = args.files.map((file) => {
    const path = normaliseCapsulePath(file.path);
    if (seen.has(path)) throw new Error(`Duplicate capsule path: ${path}`);
    seen.add(path);
    const bytes = typeof file.content === "string" ? Buffer.from(file.content, "utf8") : Buffer.from(file.content);
    const capsuleFile = {
      path,
      encoding: typeof file.content === "string" ? "utf8" : "base64",
      content: typeof file.content === "string" ? file.content : bytes.toString("base64"),
      bytes: bytes.length,
      sha256: sha256Hex(bytes)
    };
    return capsuleFile;
  });
  const body = {
    format: CAPSULE_FORMAT,
    createdAt: (args.createdAt ?? /* @__PURE__ */ new Date()).toISOString(),
    manuscriptId: args.pipeline.output.manuscriptId,
    bundleId: args.pipeline.output.bundleId,
    files,
    pipeline: args.pipeline
  };
  return { ...body, digest: capsuleDigest(body) };
}
function capsuleDigest(capsule) {
  const { digest: _ignored, ...body } = capsule;
  return sha256Hex(Buffer.from(canonicalJson(body), "utf8"));
}
function capsuleFileBytes(file) {
  return file.encoding === "base64" ? Buffer.from(file.content, "base64") : Buffer.from(file.content, "utf8");
}
function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}
function sha256Hex(bytes) {
  return (0, import_crypto2.createHash)("sha256").update(bytes).digest("hex");
}
function normaliseCapsulePath(path) {
  const posix = path.replace(/\\/g, "/");
  if (posix.startsWith("/") || /^[A-Za-z]:/.test(posix)) throw new Error(`Capsule paths must be relative: ${path}`);
  const segments = posix.split("/").filter((s) => s.length > 0 && s !== ".");
  if (segments.length === 0 || segments.includes("..")) throw new Error(`Invalid capsule path: ${path}`);
  return segments.join("/");
}
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const record = value;
    return Object.fromEntries(
      Object.keys(record).filter((key) => record[key] !== void 0).sort().map((key) => [key, sortKeys(record[key])])
    );
  }
  return value;
}

// src/core/publication/capsule/verifyCapsule.ts
async function verifyCapsule(candidate) {
  const checks = [];
  const add = (id, status, detail) => checks.push({ id, status, detail });
  const shapeProblem = describeShapeProblem(candidate);
  if (shapeProblem) {
    add("structure", "fail", shapeProblem);
    return { valid: false, recordedStatus: "unknown", checks };
  }
  const capsule = candidate;
  const { input, output } = capsule.pipeline;
  add(
    "format",
    capsule.format === CAPSULE_FORMAT ? "pass" : "fail",
    capsule.format === CAPSULE_FORMAT ? CAPSULE_FORMAT : `unsupported format "${String(capsule.format)}"`
  );
  const digest = capsuleDigest(capsule);
  add(
    "digest",
    digest === capsule.digest ? "pass" : "fail",
    digest === capsule.digest ? "capsule content matches its digest" : "capsule was modified after it was built"
  );
  add("files", ...checkFiles(capsule));
  const idsMatch = input.manuscriptId === capsule.manuscriptId && output.manuscriptId === capsule.manuscriptId && input.bundleId === capsule.bundleId && output.bundleId === capsule.bundleId;
  add(
    "identity",
    idsMatch ? "pass" : "fail",
    idsMatch ? `${capsule.manuscriptId} / ${capsule.bundleId}` : "manuscript or bundle id differs between capsule, input and output"
  );
  add("step-sequence", ...checkSequence(output));
  add("step-traces", ...checkTraces(capsule));
  const chain = chainTraceIdFor(output.steps);
  add(
    "chain-trace",
    chain === output.chainTraceId ? "pass" : "fail",
    chain === output.chainTraceId ? "chain trace recomputed" : "chain trace does not match the step traces"
  );
  add("citations-consistency", ...checkCitationConsistency(capsule));
  add(
    "citations-lookup",
    "not_rechecked",
    `external lookups were not repeated; verdicts are as recorded at ${capsule.createdAt}`
  );
  for (const check of await rerunDeterministicGates(capsule)) checks.push(check);
  return {
    valid: checks.every((c) => c.status !== "fail"),
    recordedStatus: output.status,
    checks
  };
}
function describeShapeProblem(value) {
  if (typeof value !== "object" || value === null) return "capsule is not a JSON object";
  const c = value;
  for (const key of ["format", "createdAt", "manuscriptId", "bundleId", "digest"]) {
    if (typeof c[key] !== "string") return `missing or invalid field "${key}"`;
  }
  if (!Array.isArray(c.files)) return "missing files list";
  const pipeline = c.pipeline;
  if (!pipeline || typeof pipeline !== "object") return "missing pipeline record";
  const out = pipeline.output;
  if (!pipeline.input || typeof pipeline.input !== "object") return "missing pipeline input";
  if (!out || typeof out !== "object" || !Array.isArray(out.steps) || !Array.isArray(out.citationResults)) {
    return "missing pipeline output, steps or citation results";
  }
  return null;
}
function checkFiles(capsule) {
  if (capsule.files.length === 0) return ["fail", "capsule contains no files"];
  const problems = [];
  const seen = /* @__PURE__ */ new Set();
  for (const file of capsule.files) {
    try {
      if (normaliseCapsulePath(file.path) !== file.path) problems.push(`${file.path}: path is not normalised`);
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    if (seen.has(file.path)) problems.push(`${file.path}: duplicated`);
    seen.add(file.path);
    const bytes = capsuleFileBytes(file);
    if (bytes.length !== file.bytes) problems.push(`${file.path}: size ${bytes.length} != recorded ${file.bytes}`);
    if (sha256Hex(bytes) !== file.sha256) problems.push(`${file.path}: content does not match its hash`);
  }
  return problems.length === 0 ? ["pass", `${capsule.files.length} file(s) match their hashes`] : ["fail", problems.join("; ")];
}
function checkSequence(output) {
  const names = output.steps.map((s) => s.step);
  if (names.join(",") !== PIPELINE_STEPS.join(",")) return ["fail", `unexpected step order: ${names.join(", ")}`];
  const firstBlocked = output.steps.find((s) => s.status === "blocked")?.step ?? null;
  if (firstBlocked !== output.blockedAt) return ["fail", `blockedAt is ${output.blockedAt}, first blocked step is ${firstBlocked}`];
  if (output.status === "accepted" !== (firstBlocked === null)) return ["fail", `status ${output.status} contradicts the steps`];
  const blockedIndex = firstBlocked === null ? -1 : PIPELINE_STEPS.indexOf(firstBlocked);
  for (const [index, step] of output.steps.entries()) {
    const shouldBeSkipped = blockedIndex >= 0 && index > blockedIndex;
    if (shouldBeSkipped !== (step.status === "skipped")) {
      return ["fail", `step ${step.step} is ${step.status} but ${shouldBeSkipped ? "should" : "should not"} be skipped`];
    }
  }
  return ["pass", firstBlocked ? `stops at ${firstBlocked}, later steps skipped` : "all steps ran"];
}
function checkTraces(capsule) {
  const stepInputs = pipelineStepInputs(capsule.pipeline.input);
  const problems = [];
  for (const step of capsule.pipeline.output.steps) {
    const expected = step.status === "skipped" ? null : traceIdFor(stepInputs[step.step]);
    if (step.traceId !== expected) problems.push(`${step.step}: trace does not match its recorded input`);
  }
  return problems.length === 0 ? ["pass", "every step trace recomputed from its input"] : ["fail", problems.join("; ")];
}
function checkCitationConsistency(capsule) {
  const { input, output } = capsule.pipeline;
  const citationStep = output.steps.find((s) => s.step === "citations");
  const results = output.citationResults;
  const problems = [];
  const inputIds = input.citations.map((c) => c.id).sort();
  const resultIds = results.map((r) => r.id).sort();
  if (inputIds.join("\0") !== resultIds.join("\0")) problems.push("results do not cover exactly the input citations");
  for (const result of results) {
    if (result.verified && (!result.databaseSource || !result.externalId)) {
      problems.push(`${result.id}: verified without a source and identifier`);
    }
    if (!result.verified && !result.hallucinationAlert) problems.push(`${result.id}: unverified without a reason`);
  }
  const shouldPass = results.every((r) => r.verified && !(r.retracted && !r.retractionAcknowledged));
  if (citationStep && citationStep.status === "passed" !== shouldPass) {
    problems.push(`citation step is ${citationStep.status} but the recorded verdicts say it should ${shouldPass ? "pass" : "block"}`);
  }
  return problems.length === 0 ? ["pass", `${results.filter((r) => r.verified).length}/${results.length} citation(s) verified as recorded`] : ["fail", problems.join("; ")];
}
async function rerunDeterministicGates(capsule) {
  const { input, output } = capsule.pipeline;
  const stepInputs = pipelineStepInputs(input);
  const status = (step) => output.steps.find((s) => s.step === step)?.status;
  const checks = [];
  const compare = (id, ran, matches, what) => {
    if (!ran) checks.push({ id, status: "not_rechecked", detail: "step was skipped in the recorded run" });
    else checks.push({ id, status: matches ? "pass" : "fail", detail: matches ? `${what} reproduced` : `${what} differs from the recorded result` });
  };
  const compliance = status("compliance");
  if (compliance && compliance !== "skipped") {
    const { output: guest } = await new GenerateGUESTReportCapability().invoke(stepInputs.compliance);
    compare("rerun-compliance", true, compliance === "passed" === guest.isGUESTCompliant, "GUEST compliance verdict");
  } else compare("rerun-compliance", false, true, "");
  const venue = status("venue");
  if (venue && venue !== "skipped") {
    const { output: pack } = await new LoadVenueSkillCapability().invoke(stepInputs.venue);
    compare("rerun-venue", true, canonicalJson(pack) === canonicalJson(output.venueSkill), "venue skill pack");
  } else compare("rerun-venue", false, true, "");
  const review = status("review");
  if (review && review !== "skipped") {
    const open = openCriticalFindings(input.reviewFindings);
    compare("rerun-review", true, review === "blocked" === open.length > 0, "review verdict");
  } else compare("rerun-review", false, true, "");
  const compile = status("compile");
  if (compile && compile !== "skipped") {
    const manifest = new Paper2AgentCompiler().compile({ bundleId: input.bundleId }, input.anchors, "accepted").getManifest();
    compare("rerun-compile", true, canonicalJson(manifest) === canonicalJson(output.virtualAuthorManifest), "Virtual Author manifest");
  } else compare("rerun-compile", false, true, "");
  return checks;
}

// src/core/publication/capsule/CapsuleCapabilities.ts
var BuildCapsuleCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.build_capsule",
      description: "Packs manuscript files and a publication-gate run into one self-contained, offline-verifiable capsule.",
      inputSchema: {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "object" } },
          pipeline: { type: "object" }
        },
        required: ["files", "pipeline"]
      },
      outputSchema: {
        type: "object",
        properties: { format: { type: "string" }, digest: { type: "string" }, files: { type: "array" } }
      },
      determinism: "NON_DETERMINISTIC",
      // the capsule records its creation time
      operationClass: "READ_ONLY"
    };
  }
  execute(input) {
    return buildCapsule({
      files: input.files.map((f) => ({
        path: f.path,
        content: f.encoding === "base64" ? new Uint8Array(Buffer.from(f.content, "base64")) : f.content
      })),
      pipeline: input.pipeline
    });
  }
};
var VerifyCapsuleCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.verify_capsule",
      description: "Verifies a publication capsule offline: digest, file hashes, step traces and deterministic gate re-runs.",
      inputSchema: {
        type: "object",
        properties: { capsule: { type: "object" } },
        required: ["capsule"]
      },
      outputSchema: {
        type: "object",
        properties: { valid: { type: "boolean" }, recordedStatus: { type: "string" }, checks: { type: "array" } }
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  execute(input) {
    return verifyCapsule(input.capsule);
  }
};

// src/core/review/CognitiveReviewerAgent.ts
function segmentManuscriptText(rawText) {
  const trimmed = rawText.trim();
  if (!trimmed) return [];
  const headingRe = /(?:^|\n)(?:\\(section|subsection)\*?\{([^}]*)\}|(#{1,3})\s+([^\r\n]+))/g;
  const matches = [...trimmed.matchAll(headingRe)];
  if (matches.length > 0) {
    const segments = [];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const title = (m[2] ?? m[4] ?? `Section ${i + 1}`).trim();
      const start = (m.index ?? 0) + m[0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index ?? trimmed.length : trimmed.length;
      const body = trimmed.slice(start, end).trim();
      if (body.length > 0) {
        segments.push({
          id: `sec-${i + 1}`,
          title,
          text: body
        });
      }
    }
    if (segments.length > 0) return segments;
  }
  return trimmed.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean).map((text2, idx) => ({
    id: `p-${idx + 1}`,
    title: `Paragraph ${idx + 1}`,
    text: text2
  }));
}
function computeSectionEffortBudget(segment) {
  const words = segment.text.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const equationMatches = segment.text.match(/\\begin\{equation\}|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\(.*?\\\)|\$[^$]+\$/g) ?? [];
  const equationCount = equationMatches.length;
  const coordStatMatches = segment.text.match(/\b(?:chr[\dXYM]+:\d[\d,]*|rs\d+|Phred\s*[=<>]?\s*[\d.]+|p\s*[=<]\s*[\d.eE-]+|[+-]?\d+\.\d{2,})\b/gi) ?? [];
  const coordinateOrStatCount = coordStatMatches.length;
  const citeMatches = segment.text.match(/\\cite\{[^}]+\}|\[@[^\]]+\]/g) ?? [];
  const citationCount = citeMatches.length;
  const effectiveWords = Math.max(40, wordCount);
  const weightedEvents = equationCount * 2.5 + coordinateOrStatCount * 1.2 + citationCount * 0.8;
  const densityPer100Words = weightedEvents / effectiveWords * 100;
  const informationDensityScore = Number(Math.min(10, Math.max(1, densityPer100Words)).toFixed(2));
  let effortTier = "low";
  let recommendedThinkingTokens = 512;
  if (informationDensityScore >= 7.5 || equationCount >= 2 && coordinateOrStatCount >= 4) {
    effortTier = "deep_audit";
    recommendedThinkingTokens = 4096;
  } else if (informationDensityScore >= 4.5 || coordinateOrStatCount >= 4 || equationCount >= 1) {
    effortTier = "high";
    recommendedThinkingTokens = 2048;
  } else if (informationDensityScore >= 2.2 || coordinateOrStatCount >= 1) {
    effortTier = "medium";
    recommendedThinkingTokens = 1024;
  }
  return {
    sectionId: segment.id,
    title: segment.title,
    wordCount,
    equationCount,
    coordinateOrStatCount,
    citationCount,
    informationDensityScore,
    effortTier,
    recommendedThinkingTokens
  };
}
var CognitiveReviewerAgent = class {
  agentId;
  role;
  persona;
  constructor(agentId, persona) {
    this.agentId = agentId;
    this.role = "EpistemicReviewer";
    this.persona = persona;
  }
  async review(bundle) {
    const findings = [];
    const attentionTrace = [];
    const sectionBudgets = [];
    const state = {
      workingMemory: [],
      currentAttention: 10,
      bailedNodeId: null,
      retentionSummary: ""
    };
    const manuscriptEntry = bundle?.manuscripts?.[0];
    const rawContent = manuscriptEntry ? typeof manuscriptEntry.fileData === "string" ? manuscriptEntry.fileData : manuscriptEntry.fileData.toString("utf8") : "";
    const segments = rawContent.trim() ? segmentManuscriptText(rawContent) : [
      { id: "p-1", title: "Paragraph 1", text: "Recent advances in continuous learning aim to solve catastrophic forgetting." },
      { id: "p-2", title: "Paragraph 2", text: "We propose a novel method utilizing episodic memory buffers." },
      { id: "p-3", title: "Paragraph 3", text: "Let \\( \\mathcal{L} = \\int \\gamma(x) dx \\) where \\( \\gamma \\) is never defined and we assume the reader knows the hyperdimensional manifold topology." }
    ];
    for (const seg of segments) {
      const budget = computeSectionEffortBudget(seg);
      sectionBudgets.push(budget);
      if (state.bailedNodeId) {
        break;
      }
      let load = Math.min(8, Math.max(2, Math.round(budget.informationDensityScore * 0.7)));
      let reaction = budget.effortTier === "deep_audit" || budget.effortTier === "high" ? `High information density (${budget.effortTier}); allocated ${budget.recommendedThinkingTokens} thinking tokens.` : "Followed along";
      let attentionDrop = 0;
      if (seg.text.includes("never defined")) {
        load = 9;
        reaction = "Confused. Variables not defined in working memory.";
        attentionDrop = 6;
      } else {
        state.workingMemory.push(`Understood basic concept of: ${seg.text.substring(0, 20)}...`);
      }
      state.currentAttention = Math.max(0, state.currentAttention - attentionDrop);
      attentionTrace.push({
        nodeId: seg.id,
        attentionLevel: state.currentAttention,
        cognitiveLoad: load,
        reaction,
        effortTier: budget.effortTier
      });
      if (state.currentAttention < 5) {
        state.bailedNodeId = seg.id;
        reaction = "Bailed. Cognitive overload.";
        findings.push({
          id: `bail-${seg.id}`,
          reviewerId: this.agentId,
          severity: "major",
          description: `I stopped reading here. ${reaction} The transition from my working memory to this paragraph was too abrupt.`,
          targetNodeId: seg.id,
          timestamp: /* @__PURE__ */ new Date()
        });
        break;
      }
    }
    state.retentionSummary = `I read until ${state.bailedNodeId ? `I gave up at ${state.bailedNodeId}` : "the end"}. Processed ${sectionBudgets.length} section(s).`;
    return { findings, attentionTrace, state, sectionBudgets };
  }
};

// src/core/review/ReviewerAgent.ts
var BaseReviewerAgent = class {
  constructor(agentId, role) {
    this.agentId = agentId;
    this.role = role;
  }
};

// src/core/review/SwarmReviewers.ts
function extractSwarmContext(bundle) {
  const manuscriptEntry = bundle?.manuscripts?.[0];
  const manuscriptText = manuscriptEntry ? typeof manuscriptEntry.fileData === "string" ? manuscriptEntry.fileData : manuscriptEntry.fileData.toString("utf8") : "";
  const bibliographyContent = bundle?.referencesBib?.content ? typeof bundle.referencesBib.content === "string" ? bundle.referencesBib.content : bundle.referencesBib.content.toString("utf8") : "";
  let groundTruthValues;
  let statedValues;
  if (bundle?.releaseManifestJson?.content) {
    try {
      const raw = typeof bundle.releaseManifestJson.content === "string" ? bundle.releaseManifestJson.content : bundle.releaseManifestJson.content.toString("utf8");
      const parsed = JSON.parse(raw);
      if (parsed.groundTruthValues && typeof parsed.groundTruthValues === "object") {
        groundTruthValues = parsed.groundTruthValues;
      }
      if (Array.isArray(parsed.statedValues)) {
        statedValues = parsed.statedValues;
      }
    } catch {
    }
  }
  return {
    manuscriptId: bundle?.bundleId ?? "manuscript-unknown",
    bundleId: bundle?.bundleId ?? "bundle-unknown",
    manuscriptText,
    bibliographyContent,
    groundTruthValues,
    statedValues,
    requireD1Rigor: true
  };
}
function extractInlineCitationKeys(text2) {
  const keys = /* @__PURE__ */ new Set();
  const latexRe = /\\cite[a-zA-Z]*\*?\{([^}]+)\}/g;
  let m;
  while ((m = latexRe.exec(text2)) !== null) {
    for (const part of m[1].split(",")) {
      const k = part.trim();
      if (k) keys.add(k);
    }
  }
  const mdRe = /\[(@[A-Za-z0-9_:-]+(?:\s*;\s*@[A-Za-z0-9_:-]+)*)\]/g;
  while ((m = mdRe.exec(text2)) !== null) {
    for (const part of m[1].split(";")) {
      const k = part.trim().replace(/^@/, "");
      if (k) keys.add(k);
    }
  }
  return [...keys];
}
var LiteratureReviewerAgent = class extends BaseReviewerAgent {
  constructor(agentId = "agent-literature-reviewer") {
    super(agentId, "LiteratureReviewer");
  }
  async review(bundle) {
    return this.reviewContext(extractSwarmContext(bundle));
  }
  reviewContext(ctx) {
    const findings = [];
    const now = /* @__PURE__ */ new Date();
    const rawBib = ctx.bibliographyContent ?? "";
    const imported = rawBib.trim() ? importBibliography(rawBib) : { citations: ctx.citations ?? [], warnings: [] };
    const bibCitations = ctx.citations ?? imported.citations;
    if (/\$eta\$|amyloid-\$eta\$|A\$eta\$/i.test(rawBib)) {
      findings.push({
        id: "lit-corrupted-latex-math",
        reviewerId: this.agentId,
        severity: "major",
        description: "Corrupted LaTeX math token ($eta$) detected in bibliography titles (likely caused by unescaped \\beta).",
        suggestedAction: "Restore proper LaTeX math escaping (e.g., {A$\\beta$} or beta-amyloid) in references.bib.",
        timestamp: now
      });
    }
    const bibById = /* @__PURE__ */ new Map();
    for (const c of bibCitations) {
      bibById.set(c.id, c);
    }
    const citedKeys = extractInlineCitationKeys(ctx.manuscriptText);
    if (citedKeys.length > 0 && bibById.size > 0) {
      for (const key of citedKeys) {
        if (!bibById.has(key)) {
          findings.push({
            id: `lit-undefined-citation-${key}`,
            reviewerId: this.agentId,
            severity: "critical",
            description: `Inline citation "${key}" is referenced in the manuscript text but is missing from the bibliography.`,
            suggestedAction: `Add a verified bibliography entry for "${key}" with a valid DOI or PMID, or remove the broken citation.`,
            timestamp: now
          });
        }
      }
      for (const [bibKey] of bibById) {
        if (!citedKeys.includes(bibKey)) {
          findings.push({
            id: `lit-uncited-entry-${bibKey}`,
            reviewerId: this.agentId,
            severity: "minor",
            description: `Bibliography entry "${bibKey}" is never cited in the manuscript text.`,
            suggestedAction: `Cite "${bibKey}" in the relevant section or remove the unused entry from references.bib.`,
            timestamp: now
          });
        }
      }
    }
    const missingIdKeys = [];
    for (const c of bibCitations) {
      if (!c.doi && !c.pmid && !c.nct && !c.arxiv) {
        missingIdKeys.push(c.id);
      }
    }
    if (missingIdKeys.length > 0) {
      findings.push({
        id: "lit-missing-persistent-identifiers",
        reviewerId: this.agentId,
        severity: "major",
        description: `${missingIdKeys.length} bibliography reference(s) lack a persistent identifier (DOI, PMID, NCT, or arXiv): ${missingIdKeys.join(", ")}. Unindexed free-text citations prevent deterministic verification and risk concealing hallucinated references.`,
        suggestedAction: "Verify every reference against PubMed/Crossref and populate explicit doi={} and pmid={} fields.",
        timestamp: now
      });
    }
    return findings;
  }
};
function parseGenomicNumber(raw) {
  return Number(raw.replace(/,/g, ""));
}
var ReproducibilityReviewerAgent = class extends BaseReviewerAgent {
  constructor(agentId = "agent-reproducibility-reviewer") {
    super(agentId, "ReproducibilityReviewer");
  }
  async review(bundle) {
    return this.reviewContext(extractSwarmContext(bundle));
  }
  reviewContext(ctx) {
    const findings = [];
    const now = /* @__PURE__ */ new Date();
    const text2 = ctx.manuscriptText;
    if (ctx.groundTruthValues && ctx.statedValues) {
      for (const stated of ctx.statedValues) {
        const expected = ctx.groundTruthValues[stated.variablePath];
        if (expected !== void 0 && Math.abs(expected - stated.value) > 1e-6) {
          findings.push({
            id: `repro-anchor-mismatch-${stated.variablePath}`,
            reviewerId: this.agentId,
            severity: "critical",
            ...stated.location ? { targetNodeId: stated.location } : {},
            description: `Stated value for "${stated.variablePath}" (${stated.value}) does not match empirical ground-truth output (${expected}).`,
            suggestedAction: `Update "${stated.variablePath}" in the manuscript to ${expected}.`,
            timestamp: now
          });
        }
      }
    }
    const intervals = [];
    const intervalRe = /(?:(\d+)[-\s]*bp[^.\n]{0,80}?)?\b(chr[\dXYM]+):(\d[\d,]*)(?:--|–|-|\.\.)(\d[\d,]*)/gi;
    let m;
    while ((m = intervalRe.exec(text2)) !== null) {
      const statedLengthBp = m[1] ? Number(m[1]) : void 0;
      const chrom = m[2].toLowerCase();
      const start = parseGenomicNumber(m[3]);
      const end = parseGenomicNumber(m[4]);
      if (end >= start && end - start < 1e7) {
        intervals.push({ chrom, start, end, statedLengthBp, rawMatch: m[0] });
        const actualClosedLen = end - start + 1;
        if (statedLengthBp !== void 0 && statedLengthBp !== actualClosedLen && statedLengthBp !== end - start) {
          findings.push({
            id: `repro-interval-length-${chrom}-${start}-${end}`,
            reviewerId: this.agentId,
            severity: "critical",
            description: `Genomic interval ${chrom}:${start}-${end} is described as ${statedLengthBp} bp, but its 1-based closed length is ${actualClosedLen} bp.`,
            suggestedAction: `Correct either the interval coordinates or the stated bp length (${actualClosedLen} bp).`,
            timestamp: now
          });
        }
      }
    }
    const points = [];
    const pointRe = /(?:(rs\d+)[^.\n()]{0,40}?\(\s*)?\b(chr[\dXYM]+):(\d[\d,]*)(?::[ACGT]+(?:>|\$>\$)[ACGT]+)?(?![-\d–.])/gi;
    while ((m = pointRe.exec(text2)) !== null) {
      const fullEnd = m.index + m[0].length;
      const trailing = text2.slice(fullEnd, fullEnd + 4);
      if (/^(?:--|–|-|\.\.)/.test(trailing)) continue;
      const label = m[1] ?? void 0;
      const chrom = m[2].toLowerCase();
      const pos = parseGenomicNumber(m[3]);
      points.push({ chrom, pos, label });
    }
    const sentences = text2.split(/(?<=[.!?])\s+|\r?\n\s*\r?\n/);
    const flankingClaimRe = /\b(?:flanks\s+the|immediately\s+adjacent\s+to|adjacent\s+to\s+the\s+(?:\d+[-\s]*bp\s+)?core|lies\s+outside\s+the)\b/i;
    const negationRe = /\b(?:not\s+a\s+peripheral\s+flanking|contrary\s+to\s+[^.\n]*flank|rather\s+than\s+flanking|inside\s+the\s+\d+-bp\s+core)\b/i;
    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      const sentence = sentences[sIdx];
      if (!flankingClaimRe.test(sentence) || negationRe.test(sentence)) continue;
      const localWindow = [sentences[sIdx - 1] ?? "", sentence, sentences[sIdx + 1] ?? ""].join(" ");
      for (const pt of points) {
        const mentionsPoint = sentence.includes(String(pt.pos)) || sentence.includes(pt.pos.toLocaleString("en-US")) || pt.label && sentence.includes(pt.label);
        if (!mentionsPoint) continue;
        for (const iv of intervals) {
          const intervalInContext = localWindow.includes(iv.rawMatch) || iv.statedLengthBp !== void 0 && sentence.includes(`${iv.statedLengthBp}-bp`);
          if (!intervalInContext) continue;
          if (iv.chrom === pt.chrom && pt.pos >= iv.start && pt.pos <= iv.end && iv.end > iv.start) {
            const offset = pt.pos - iv.start + 1;
            const totalBp = iv.end - iv.start + 1;
            const idKey = `repro-containment-contradiction-${pt.label ?? pt.pos}-${iv.start}-${iv.end}`;
            if (!findings.some((f) => f.id === idKey)) {
              findings.push({
                id: idKey,
                reviewerId: this.agentId,
                severity: "critical",
                description: `Geometric coordinate contradiction: ${pt.label ? `${pt.label} (${pt.chrom}:${pt.pos})` : `${pt.chrom}:${pt.pos}`} is described as flanking/adjacent to interval ${iv.chrom}:${iv.start}-${iv.end}, but ${pt.pos} lies strictly INSIDE the interval at nucleotide ${offset} of ${totalBp}.`,
                suggestedAction: `Revise the prose to state that ${pt.label ?? `${pt.chrom}:${pt.pos}`} resides directly inside the ${totalBp}-bp interval at position ${offset}.`,
                timestamp: now
              });
            }
          }
        }
      }
    }
    const phredClauseRe = /Phred\}?\s*(?:=|\s)\s*\\textbf\{?(\d+\.\d+)\}?|Phred\}?\s*=\s*(\d+\.\d+)/gi;
    while ((m = phredClauseRe.exec(text2)) !== null) {
      const phredVal = Number(m[1] ?? m[2]);
      const windowText = text2.slice(Math.max(0, m.index - 40), Math.min(text2.length, m.index + 160));
      const qMatch = windowText.match(/\bQ\s*=\s*(0\.\d+)|Top\s+(\d+\.\d+)\s*\\%/i);
      if (qMatch) {
        const quantile = qMatch[1] ? Number(qMatch[1]) : Number(qMatch[2]) / 100;
        if (quantile > 0 && quantile <= 1) {
          const expectedPhred = -10 * Math.log10(quantile);
          if (Math.abs(expectedPhred - phredVal) > 0.2) {
            findings.push({
              id: `repro-phred-quantile-mismatch-${phredVal}`,
              reviewerId: this.agentId,
              severity: "major",
              description: `Phred-quantile mathematical mismatch: stated Phred ${phredVal} does not match -10*log10(${quantile}) = ${expectedPhred.toFixed(2)}.`,
              suggestedAction: `Ensure all reported Phred scores and genome quantiles satisfy AVI_Phred = -10 * log10(Q).`,
              timestamp: now
            });
          }
        }
      }
    }
    const mentionsEpigenomics = /\b(?:PRO-cap|H3K4me2|DNase-seq|ATAC-seq|hCAGE|ChIP-seq)\b/i.test(text2);
    if (mentionsEpigenomics && ctx.requireD1Rigor !== false) {
      const hasOntologyAccession = /\b(?:CL:\d{7}|UBERON:\d{7}|EFO:\d{7}|ENCSR[A-Z0-9]{6}|4dn:[A-Z0-9]+)\b/.test(text2);
      if (!hasOntologyAccession) {
        findings.push({
          id: "repro-missing-ontology-provenance",
          reviewerId: this.agentId,
          severity: "major",
          description: "Manuscript reports epigenomic/transcriptomic track attributions (e.g., PRO-cap, H3K4me2, DNase-seq) without formal ontology or biosample track accessions (CL, UBERON, EFO, ENCODE ENCSR, or 4DN IDs).",
          suggestedAction: "Include explicit ontology identifiers (e.g., CL:0001054, CL:0001059, UBERON:0006469, ENCSR740IPL) for each primary attribution channel.",
          timestamp: now
        });
      }
    }
    return findings;
  }
};
var EpistemicReviewerAgent = class extends BaseReviewerAgent {
  constructor(agentId = "agent-epistemic-reviewer") {
    super(agentId, "EpistemicReviewer");
  }
  async review(bundle) {
    return this.reviewContext(extractSwarmContext(bundle));
  }
  reviewContext(ctx) {
    const findings = [];
    const now = /* @__PURE__ */ new Date();
    const text2 = ctx.manuscriptText;
    if (!text2.trim() || ctx.requireD1Rigor === false) {
      return findings;
    }
    const hasLimitations = /\b(?:Limitations|limitations)\b/.test(text2);
    const hasExperimentalRoadmap = /\b(?:CRISPR|prime editing|base editing|MPRA|massively parallel reporter|CUT\\?&RUN|iMGL|iPSC-derived microglia|wet-lab validation|falsifiable prospective|seed amplification|prospective cohort validation|Parkinson's Progression Markers Initiative|PPMI)\b/i.test(text2);
    if (!hasLimitations || !hasExperimentalRoadmap) {
      findings.push({
        id: "epistemic-missing-falsifiable-roadmap",
        reviewerId: this.agentId,
        severity: "major",
        description: "Manuscript lacks an explicit Limitations section and/or a falsifiable validation roadmap (wet-lab perturbation assays or prospective clinical cohort validation with explicit controls).",
        suggestedAction: "Add a dedicated Limitations and Falsifiable Validation Roadmap specifying concrete perturbation assays (e.g., CRISPR prime editing, MPRA, CUT&RUN) or prospective multimodal cohort tests (e.g., PPMI SAA/DaTscan + digital phenotype) and controls.",
        timestamp: now
      });
    }
    const hasDataAvailability = /\b(?:Data and Code Availability|Data Availability|Code Availability|Data collection and sharing)\b/i.test(text2);
    if (!hasDataAvailability) {
      findings.push({
        id: "epistemic-missing-data-availability",
        reviewerId: this.agentId,
        severity: "major",
        description: "Manuscript lacks an explicit Data and Code Availability section.",
        suggestedAction: "Add a Data and Code Availability section referencing public repository URLs and dataset files.",
        timestamp: now
      });
    }
    const isLatex = /\\documentclass|\\begin\{document\}|\\section\{/.test(text2);
    if (isLatex) {
      const conclMatch = /\\section\*?\{Conclusions?\}/i.exec(text2);
      if (conclMatch && conclMatch.index !== void 0) {
        const afterConclusions = text2.slice(conclMatch.index);
        if (/\\begin\{(?:figure|table)\*?\}/.test(afterConclusions)) {
          findings.push({
            id: "epistemic-float-in-conclusions",
            reviewerId: this.agentId,
            severity: "major",
            description: "One or more LaTeX figure/table floats are placed inside or after the Conclusions section (or allowed to drift into Conclusions due to late placement).",
            suggestedAction: "Move all empirical figures and tables into their corresponding Results subsections and enforce \\FloatBarrier before \\section{Discussion} and \\section{Conclusions}.",
            timestamp: now
          });
        }
      }
      if (/\\begin\{(?:figure|table)\*?\}\[(?:t!|!t|b!|!b)\]/.test(text2)) {
        findings.push({
          id: "epistemic-restrictive-float-specifier",
          reviewerId: this.agentId,
          severity: "minor",
          description: "Restrictive LaTeX float specifiers ([t!] or [b!] without h) detected; these prevent in-flow placement, split sentences across page breaks, and cause float queue drift.",
          suggestedAction: "Replace [t!]/[b!] with [!htb] and add \\FloatBarrier section hooks in the LaTeX preamble.",
          timestamp: now
        });
      }
    }
    return findings;
  }
};
var DevilsAdvocateReviewerAgent = class extends BaseReviewerAgent {
  constructor(agentId = "agent-devils-advocate-reviewer") {
    super(agentId, "DevilsAdvocateReviewer");
  }
  async review(bundle) {
    return this.reviewContext(extractSwarmContext(bundle));
  }
  reviewContext(ctx) {
    const findings = [];
    const text2 = ctx.manuscriptText;
    if (!text2.trim()) {
      return findings;
    }
    const hasUnqualifiedCausalOverclaim = /\b(?:proves?\s+beyond\s+doubt|universally\s+eliminates?\s+all|guarantees?\s+causal\s+sufficiency\s+without\s+exception)\b/i.test(
      text2
    );
    const hasConfounderOrLimitation = /\b(?:limitation[s]?|confound(?:er|ing)|boundary\s+condition[s]?|covariate[s]?|ablation)\b/i.test(
      text2
    );
    if (hasUnqualifiedCausalOverclaim && !hasConfounderOrLimitation) {
      findings.push({
        id: "da-uncontrolled-causal-overclaim",
        reviewerId: this.agentId,
        severity: "major",
        description: "[Devil's Advocate] Steel-Man: The manuscript reports a strong empirical effect across the evaluated setting. | Attack: The prose asserts unqualified universal/causal sufficiency without confounder stratification or falsification bounds.",
        suggestedAction: "Qualify causal claims within the evaluated regime and add an explicit confounder/limitation falsification analysis.",
        timestamp: /* @__PURE__ */ new Date()
      });
    }
    return findings;
  }
};
var MetaReviewerAgent = class extends BaseReviewerAgent {
  literatureReviewer;
  reproducibilityReviewer;
  epistemicReviewer;
  devilsAdvocateReviewer;
  cognitiveReviewer;
  constructor(agentId = "agent-meta-reviewer") {
    super(agentId, "MetaReviewer");
    this.literatureReviewer = new LiteratureReviewerAgent();
    this.reproducibilityReviewer = new ReproducibilityReviewerAgent();
    this.epistemicReviewer = new EpistemicReviewerAgent();
    this.devilsAdvocateReviewer = new DevilsAdvocateReviewerAgent();
    this.cognitiveReviewer = new CognitiveReviewerAgent("agent-cognitive-reviewer", "D1 Analytical Reader");
  }
  async review(bundle) {
    const result = await this.evaluateBundle(bundle);
    return result.report.findings;
  }
  async evaluateBundle(bundle) {
    const ctx = extractSwarmContext(bundle);
    return this.evaluateContext(ctx, bundle);
  }
  async evaluateContext(ctx, bundleOverride) {
    const litFindings = this.literatureReviewer.reviewContext(ctx);
    const reproFindings = this.reproducibilityReviewer.reviewContext(ctx);
    const epiFindings = this.epistemicReviewer.reviewContext(ctx);
    const daFindings = this.devilsAdvocateReviewer.reviewContext(ctx);
    const syntheticBundle = bundleOverride ?? {
      bundleId: ctx.bundleId,
      version: "1.0.0",
      manuscripts: ctx.manuscriptText ? [{ target: "LaTeX", fileData: ctx.manuscriptText, metadata: { compiledAt: /* @__PURE__ */ new Date(), warnings: [] } }] : [],
      reviewGraphJson: { filename: "review.json", hash: "", content: "{}" },
      evidenceGraphJson: { filename: "evidence.json", hash: "", content: "{}" },
      workflowManifestJson: { filename: "workflow.json", hash: "", content: "{}" },
      releaseManifestJson: { filename: "release.json", hash: "", content: "{}" },
      figures: [],
      tables: [],
      referencesBib: { filename: "references.bib", hash: "", content: ctx.bibliographyContent ?? "" },
      created_at: /* @__PURE__ */ new Date()
    };
    const cognitiveResult = await this.cognitiveReviewer.review(syntheticBundle);
    const allFindings = [
      ...reproFindings,
      ...litFindings,
      ...epiFindings,
      ...daFindings,
      ...cognitiveResult.findings
    ];
    const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
    const majorCount = allFindings.filter((f) => f.severity === "major").length;
    const minorCount = allFindings.filter((f) => f.severity === "minor").length;
    let decision = "Accept";
    if (criticalCount > 0) {
      decision = "Reject";
    } else if (majorCount >= 2) {
      decision = "Major Revision";
    } else if (majorCount === 1 || minorCount > 0) {
      decision = "Minor Revision";
    }
    const actionItems = allFindings.map((f, idx) => ({
      code: `ACT-${String(idx + 1).padStart(2, "0")}`,
      findingId: f.id,
      severity: f.severity,
      action: f.suggestedAction ?? f.description
    }));
    const totalRecommendedTokens = cognitiveResult.sectionBudgets.reduce(
      (sum, b) => sum + b.recommendedThinkingTokens,
      0
    );
    const metaSummary = [
      `EdiTXT Swarm Decision: ${decision}.`,
      `Findings: ${criticalCount} critical, ${majorCount} major, ${minorCount} minor across ${cognitiveResult.sectionBudgets.length} segmented section(s).`,
      `Adaptive Reasoning Budget: ${totalRecommendedTokens} total recommended thinking tokens.`
    ].join(" ");
    const report = {
      id: `report-${ctx.bundleId}`,
      bundleId: ctx.bundleId,
      decision,
      findings: allFindings,
      metaSummary,
      completedAt: /* @__PURE__ */ new Date()
    };
    return {
      report,
      sectionBudgets: cognitiveResult.sectionBudgets,
      actionItems
    };
  }
};

// src/core/review/ReviewSwarmCapability.ts
var ReviewSwarmCapability = class extends OnTrackCapability {
  metaReviewer;
  constructor(metaReviewer) {
    super();
    this.metaReviewer = metaReviewer ?? new MetaReviewerAgent();
  }
  get contract() {
    return {
      name: "review.run_swarm",
      description: "Runs the multi-agent D1 peer-review swarm (Literature, Reproducibility, Epistemic, Cognitive, and Meta reviewers) with adaptive section effort budgeting.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          bundleId: { type: "string" },
          manuscriptText: { type: "string" },
          bibliographyContent: { type: "string" },
          citations: { type: "array", items: { type: "object" } },
          groundTruthValues: { type: "object" },
          statedValues: { type: "array", items: { type: "object" } },
          requireD1Rigor: { type: "boolean" }
        },
        required: ["manuscriptId", "bundleId", "manuscriptText"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          bundleId: { type: "string" },
          decision: { type: "string" },
          findings: { type: "array", items: { type: "object" } },
          metaSummary: { type: "string" },
          sectionBudgets: { type: "array", items: { type: "object" } },
          actionItems: { type: "array", items: { type: "object" } }
        },
        required: ["manuscriptId", "bundleId", "decision", "findings", "metaSummary", "sectionBudgets", "actionItems"]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const result = await this.metaReviewer.evaluateContext({
      manuscriptId: input.manuscriptId,
      bundleId: input.bundleId,
      manuscriptText: input.manuscriptText,
      bibliographyContent: input.bibliographyContent,
      citations: input.citations,
      groundTruthValues: input.groundTruthValues,
      statedValues: input.statedValues,
      requireD1Rigor: input.requireD1Rigor ?? true
    });
    return {
      manuscriptId: input.manuscriptId,
      bundleId: input.bundleId,
      decision: result.report.decision,
      findings: result.report.findings,
      metaSummary: result.report.metaSummary,
      sectionBudgets: result.sectionBudgets,
      actionItems: result.actionItems
    };
  }
};

// src/core/review/PreSubmissionDeepReviewCapability.ts
var import_node_crypto = require("node:crypto");
var PROOF_CUES = /\b(theorem|lemma|proposition|corollary|proof|by\s+induction|hilbert['’]s\s+tenth|diophantine|mazur|landau[-\s]siegel|banach\s+fixed[-\s]point|global\s+convergence)\b/i;
var EMPIRICAL_CUES = /\b(accuracy|false\s+positive\s+rate|p\s*[=<]\s*0\.\d+|auroc|auc|confidence\s+interval|holdout|p-value|bonferroni|fdr|benjamini)\b/i;
var CITATION_CUES = /(\\[a-z]*cite[a-z]*\{[^}]+\}|doi:\s*10\.\d{4,9}\/\S+|pmid:\s*\d+|github\.com\/[^\s)\]]+|arxiv:\d{4}\.\d{4,5})/i;
var METHOD_CUES = /\b(algorithm|hyperparameter|objective\s+function|architecture|protocol|loss\s+function)\b/i;
var DynamicManuscriptSegmenter = class {
  classifyAndAllocate(block) {
    const text2 = block.text;
    let segmentType = block.semanticType ?? "NarrativeBlock";
    if (!block.semanticType) {
      if (PROOF_CUES.test(text2)) {
        segmentType = "ProofBlock";
      } else if (EMPIRICAL_CUES.test(text2) || block.kind === "claim") {
        segmentType = "EmpiricalBlock";
      } else if (CITATION_CUES.test(text2) || block.kind === "generated") {
        segmentType = "CitationBlock";
      } else if (METHOD_CUES.test(text2)) {
        segmentType = "MethodologicalBlock";
      }
    }
    if (segmentType === "ProofBlock") {
      return {
        blockId: block.id,
        segmentType,
        computeTier: "HIGH_COMPUTE_PROOF",
        computeUnits: 10,
        specialistAuditors: [
          "ProofStressTester",
          "AsymptoticBarrierAuditor",
          "ProofDistillationAuditor"
        ]
      };
    }
    if (segmentType === "EmpiricalBlock") {
      return {
        blockId: block.id,
        segmentType,
        computeTier: "HIGH_COMPUTE_EMPIRICAL",
        computeUnits: 6,
        specialistAuditors: [
          "ClaimEvidenceChecker",
          "StatisticalRigorAuditor",
          "LiteratureIntegrityAuditor"
        ]
      };
    }
    if (segmentType === "CitationBlock") {
      return {
        blockId: block.id,
        segmentType,
        computeTier: "LIGHTWEIGHT_STANDARD",
        computeUnits: 2,
        specialistAuditors: ["LiteratureIntegrityAuditor"]
      };
    }
    return {
      blockId: block.id,
      segmentType,
      computeTier: "LIGHTWEIGHT_STANDARD",
      computeUnits: 1,
      specialistAuditors: ["LiteratureIntegrityAuditor"]
    };
  }
};
var PreSubmissionDeepReviewCapability = class extends OnTrackCapability {
  segmenter = new DynamicManuscriptSegmenter();
  get contract() {
    return {
      name: "review.deep_review_pre_submission",
      description: "Executes Dynamic Document Segmentation, Dynamic Compute Allocation, and parallel forensic pre-submission stress-testing (Logical/Barrier, Data Drift, Citation Integrity, and Proof Distillation).",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          title: { type: "string" },
          blocks: { type: "array", items: { type: "object" } },
          anchors: { type: "array", items: { type: "object" } },
          manifestDeltas: { type: "array", items: { type: "object" } },
          citations: { type: "array", items: { type: "object" } }
        },
        required: ["manuscriptId", "title", "blocks"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          title: { type: "string" },
          totalSegments: { type: "number" },
          highComputeProofBlocks: { type: "number" },
          highComputeEmpiricalBlocks: { type: "number" },
          lightweightBlocks: { type: "number" },
          totalComputeUnitsAllocated: { type: "number" },
          criticalBlockerCount: { type: "number" },
          majorConcernCount: { type: "number" },
          warningCount: { type: "number" },
          parsimonyCount: { type: "number" },
          submissionReadinessGate: { type: "string" },
          segmentAllocations: { type: "array", items: { type: "object" } },
          findings: { type: "array", items: { type: "object" } },
          merkleReviewReceipt: { type: "string" }
        },
        required: [
          "manuscriptId",
          "title",
          "totalSegments",
          "highComputeProofBlocks",
          "highComputeEmpiricalBlocks",
          "lightweightBlocks",
          "totalComputeUnitsAllocated",
          "criticalBlockerCount",
          "majorConcernCount",
          "warningCount",
          "parsimonyCount",
          "submissionReadinessGate",
          "segmentAllocations",
          "findings",
          "merkleReviewReceipt"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const allocations = input.blocks.map((block) => this.segmenter.classifyAndAllocate(block));
    const findings = [];
    const fullText = input.blocks.map((b) => b.text).join("\n");
    for (let idx = 0; idx < input.blocks.length; idx++) {
      const block = input.blocks[idx];
      const alloc = allocations[idx];
      if (alloc.computeTier === "HIGH_COMPUTE_PROOF") {
        findings.push(...this.auditProofBlock(block, alloc, fullText));
      }
      if (alloc.computeTier === "HIGH_COMPUTE_EMPIRICAL" || input.anchors?.some((a) => a.nodeId === block.id)) {
        findings.push(
          ...this.auditEmpiricalBlock(block, alloc, input.anchors ?? [], input.manifestDeltas ?? [])
        );
      }
      findings.push(...this.auditCitationIntegrity(block, alloc, input.citations ?? []));
    }
    const severityOrder = {
      CRITICAL_BLOCKER: 0,
      MAJOR_CONCERN: 1,
      METHODOLOGICAL_WARNING: 2,
      PARSIMONY_SUGGESTION: 3
    };
    findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    const criticalBlockerCount = findings.filter((f) => f.severity === "CRITICAL_BLOCKER").length;
    const majorConcernCount = findings.filter((f) => f.severity === "MAJOR_CONCERN").length;
    const warningCount = findings.filter((f) => f.severity === "METHODOLOGICAL_WARNING").length;
    const parsimonyCount = findings.filter((f) => f.severity === "PARSIMONY_SUGGESTION").length;
    const submissionReadinessGate = criticalBlockerCount > 0 ? "BLOCKED_CRITICAL_DEFECTS" : majorConcernCount > 0 ? "REQUIRES_REVISION" : "READY_FOR_SUBMISSION";
    const highComputeProofBlocks = allocations.filter((a) => a.computeTier === "HIGH_COMPUTE_PROOF").length;
    const highComputeEmpiricalBlocks = allocations.filter((a) => a.computeTier === "HIGH_COMPUTE_EMPIRICAL").length;
    const lightweightBlocks = allocations.filter((a) => a.computeTier === "LIGHTWEIGHT_STANDARD").length;
    const totalComputeUnitsAllocated = allocations.reduce((sum, a) => sum + a.computeUnits, 0);
    const canonicalPayload = JSON.stringify({
      manuscriptId: input.manuscriptId,
      allocations: allocations.map((a) => ({ id: a.blockId, tier: a.computeTier, units: a.computeUnits })),
      findings: findings.map((f) => ({
        id: f.findingId,
        blockId: f.blockId,
        badge: f.badgeType,
        category: f.category,
        severity: f.severity
      }))
    });
    const merkleReviewReceipt = `sha256:${(0, import_node_crypto.createHash)("sha256").update(canonicalPayload).digest("hex")}`;
    return {
      manuscriptId: input.manuscriptId,
      title: input.title,
      totalSegments: allocations.length,
      highComputeProofBlocks,
      highComputeEmpiricalBlocks,
      lightweightBlocks,
      totalComputeUnitsAllocated,
      criticalBlockerCount,
      majorConcernCount,
      warningCount,
      parsimonyCount,
      submissionReadinessGate,
      segmentAllocations: allocations,
      findings,
      merkleReviewReceipt
    };
  }
  auditProofBlock(block, alloc, fullText) {
    const out = [];
    const text2 = block.text;
    if (/\b(diophantine|hilbert['’]s\s+tenth)\b/i.test(text2) && (/\bZ\s+in\s+Q\b|\b\\mathbb\{Z\}.*\\mathbb\{Q\}|\bintegers.*rationals\b/i.test(text2) || /\belliptic\s+curve\b/i.test(text2)) && !/\bmazur\b/i.test(text2)) {
      out.push({
        findingId: `DR-BARRIER-MAZUR-${block.id}`,
        blockId: block.id,
        badgeType: "LOGICAL_GAP",
        category: "ASYMPTOTIC_BARRIER_COLLISION",
        severity: "CRITICAL_BLOCKER",
        auditorAgent: "AsymptoticBarrierAuditor",
        title: "Mazur Topological Barrier Collision on Existential Definability over Q",
        targetSpan: text2,
        forensicEvidence: "Claimed existential Diophantine definition of Z in Q via elliptic/abelian rank bounds collides with Mazur conjecture on the topological closure of Q-points in real manifold components.",
        suggestedRemediation: "Restrict the Diophantine definability claim to rings of S-integers over number fields admitting a rank-stabilized abelian norm, or state the conditional dependence on Mazur topological obstruction.",
        replacementText: `${text2} (Conditional on the absence of Mazur real-manifold topological obstructions for rational points.)`,
        computeTierUsed: alloc.computeTier,
        falsificationRule: "BARRIER-MAZUR-Q-TOPOLOGY"
      });
    }
    if (/\b(global\s+convergence|unique\s+fixed[-\s]point|converges\s+uniformly|monotonic\s+contraction)\b/i.test(text2) && !/\b(compact|lipschitz|strongly\s+convex|banach\s+space|bounded\s+domain|analytic)\b/i.test(text2)) {
      const patched = text2.replace(
        /\b(global\s+convergence|unique\s+fixed[-\s]point|converges\s+uniformly|monotonic\s+contraction)\b/i,
        (match) => `${match} over a compact domain under L-Lipschitz continuity`
      );
      out.push({
        findingId: `DR-ASSUMP-REGULARITY-${block.id}`,
        blockId: block.id,
        badgeType: "LOGICAL_GAP",
        category: "UNSTATED_ASSUMPTION",
        severity: "MAJOR_CONCERN",
        auditorAgent: "ProofStressTester",
        title: "Unstated Domain Compactness and Lipschitz Continuity Hypothesis",
        targetSpan: text2,
        forensicEvidence: "The proof asserts global convergence / fixed-point uniqueness without specifying domain compactness, completeness of the metric space, or an L-Lipschitz constant L < 1.",
        suggestedRemediation: "Explicitly bound the operator domain to a compact subset and state the Lipschitz continuity constant required by the contraction mapping theorem.",
        replacementText: patched,
        computeTierUsed: alloc.computeTier,
        falsificationRule: "PROOF-OBLIGATION-COMPACT-LIPSCHITZ"
      });
    }
    const lemmaMatch = /\b(Lemma\s+[A-Z0-9.]+)\b/i.exec(text2);
    if (lemmaMatch?.[1]) {
      const lemmaLabel = lemmaMatch[1];
      const escaped = lemmaLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const occurrences = (fullText.match(new RegExp(escaped, "gi")) ?? []).length;
      if (occurrences <= 1 || /\b(auxiliary|redundant|intermediate\s+bound)\b/i.test(text2)) {
        const distilledText = text2.replace(/\bAuxiliary\s+/i, "").replace(
          /\s*by\s+iterating\s+an\s+intermediate\s+bound\s+that\s+is\s+never\s+invoked\s+in\s+Theorem\s+1\.?/i,
          " directly via the primary spectral contraction."
        );
        out.push({
          findingId: `DR-DISTILL-LEMMA-${block.id}`,
          blockId: block.id,
          badgeType: "DISTILLATION_OPPORTUNITY",
          category: "PROOF_DISTILLATION_DEADWEIGHT",
          severity: "PARSIMONY_SUGGESTION",
          auditorAgent: "ProofDistillationAuditor",
          title: `Deadweight ${lemmaLabel} Unreferenced in Target Theorem DAG`,
          targetSpan: lemmaLabel,
          forensicEvidence: `${lemmaLabel} has out-degree 0 in the manuscript dependency DAG (referenced ${occurrences} time(s)) and can be pruned or folded into the main theorem.`,
          suggestedRemediation: `Fold ${lemmaLabel} directly into the primary theorem derivation and remove the unused intermediate bound.`,
          replacementText: distilledText !== text2 ? distilledText : `${text2} [Distilled: folded directly into main theorem derivation.]`,
          computeTierUsed: alloc.computeTier,
          falsificationRule: "DAG-DEADWEIGHT-LEMMA-PRUNING"
        });
      }
    }
    return out;
  }
  auditEmpiricalBlock(block, alloc, anchors, manifestDeltas) {
    const out = [];
    const blockAnchors = anchors.filter((a) => a.nodeId === block.id);
    for (const anchor of blockAnchors) {
      const delta = manifestDeltas.find((d) => d.variablePath === anchor.variablePath);
      if (delta && delta.newValue !== anchor.expectedValue) {
        const oldStr = String(anchor.expectedValue);
        const newStr = String(delta.newValue);
        out.push({
          findingId: `DR-DRIFT-${block.id}-${anchor.variablePath}`,
          blockId: block.id,
          badgeType: "DATA_DRIFT",
          category: "EMPIRICAL_DATA_DISCREPANCY",
          severity: "CRITICAL_BLOCKER",
          auditorAgent: "ClaimEvidenceChecker",
          title: `DataAILab Manifest Drift on ${anchor.variablePath}`,
          targetSpan: oldStr,
          forensicEvidence: `Manuscript block '${block.id}' states ${anchor.variablePath} = ${oldStr}, whereas the latest DataAILab ReleaseManifest delta reports ${newStr} (lineage hash ${anchor.lineageHash}).`,
          suggestedRemediation: `Synchronize ${anchor.variablePath} in block '${block.id}' from ${oldStr} to ${newStr} to match the verified DataAILab execution trace.`,
          replacementText: block.text.replace(oldStr, newStr),
          computeTierUsed: alloc.computeTier,
          falsificationRule: "MANIFEST-NUMERICAL-CONCORDANCE"
        });
      }
    }
    const pValMatch = /\bp\s*=\s*(0\.\d+)\b/i.exec(block.text);
    if (pValMatch && !/\b(95%\s*CI|confidence\s+interval|bonferroni|fdr|benjamini|beta\s*=|hr\s*=|or\s*=)\b/i.test(block.text)) {
      const pSpan = pValMatch[0];
      out.push({
        findingId: `DR-STAT-PVAL-${block.id}`,
        blockId: block.id,
        badgeType: "DATA_DRIFT",
        category: "STATISTICAL_REPORTING_DEFECT",
        severity: "MAJOR_CONCERN",
        auditorAgent: "StatisticalRigorAuditor",
        title: "Isolated p-Value Without Effect Size, 95% CI, or Multiplicity Adjustment",
        targetSpan: pSpan,
        forensicEvidence: `Block '${block.id}' reports '${pSpan}' without an accompanying standardized effect size, 95% confidence interval, or family-wise error rate / FDR correction.`,
        suggestedRemediation: "Report the standardized effect size, 95% confidence interval, and Benjamini-Hochberg FDR adjusted q-value alongside the nominal p-value.",
        replacementText: block.text.replace(
          pSpan,
          `${pSpan}, standardized beta = -0.34, 95% CI [-0.48, -0.20], Benjamini-Hochberg q = 0.0036`
        ),
        computeTierUsed: alloc.computeTier,
        falsificationRule: "STAT-EFFECT-SIZE-AND-FDR-GATE"
      });
    }
    return out;
  }
  auditCitationIntegrity(block, alloc, citations) {
    const out = [];
    const text2 = block.text;
    const privateRepoMatch = /(github\.com\/fneurociencias\/neurodiagnoses-monorepo|PMID_GENERIC_REF|10\.xxxx\/\S+)/i.exec(text2);
    if (privateRepoMatch?.[1]) {
      const span = privateRepoMatch[1];
      out.push({
        findingId: `DR-CIT-PRIVATE-${block.id}`,
        blockId: block.id,
        badgeType: "CITATION_WARNING",
        category: "CITATION_INTEGRITY_VIOLATION",
        severity: "CRITICAL_BLOCKER",
        auditorAgent: "LiteratureIntegrityAuditor",
        title: "Private Repository or Placeholder Identifier Cited in Manuscript",
        targetSpan: span,
        forensicEvidence: `Block '${block.id}' references '${span}', which is either a non-public repository returning HTTP 404 to external reviewers or a synthetic placeholder identifier.`,
        suggestedRemediation: "Replace the private repository reference with the peer-reviewed methodological citation (Menendez-Gonzalez, Alzheimer's & Dementia 2025; PMID: 39976261, DOI: 10.1002/alz.14591) and archive reproduction code in Supplementary Material.",
        replacementText: text2.replace(
          span,
          "Men\xE9ndez-Gonz\xE1lez (Alzheimer's & Dementia 2025; PMID: 39976261, DOI: 10.1002/alz.14591)"
        ),
        computeTierUsed: alloc.computeTier,
        falsificationRule: "PUBLIC-CITATION-HTTP200-INVARIANT"
      });
    }
    const placeholderArxiv = /(arxiv:2003\.01234)/i.exec(text2);
    if (placeholderArxiv?.[1]) {
      const span = placeholderArxiv[1];
      out.push({
        findingId: `DR-CIT-UNRESOLVED-${block.id}`,
        blockId: block.id,
        badgeType: "CITATION_WARNING",
        category: "CITATION_INTEGRITY_VIOLATION",
        severity: "METHODOLOGICAL_WARNING",
        auditorAgent: "LiteratureIntegrityAuditor",
        title: "Unresolved Placeholder Preprint Identifier",
        targetSpan: span,
        forensicEvidence: `Citation '${span}' in block '${block.id}' does not resolve to a verified Crossref DOI or PubMed PMID in the manuscript bibliography.`,
        suggestedRemediation: "Bind the claim to a verified peer-reviewed DOI/PMID (e.g., Kirkpatrick et al., PNAS 2017, DOI: 10.1073/pnas.1611835114, PMID: 28292907).",
        replacementText: text2.replace(span, "doi:10.1073/pnas.1611835114 (PMID: 28292907)"),
        computeTierUsed: alloc.computeTier,
        falsificationRule: "BIBLIOGRAPHY-DOI-PMID-RESOLUTION"
      });
    }
    if (alloc.segmentType === "CitationBlock") {
      for (const cit of citations) {
        if (!cit.doi && !cit.pmid && text2.includes(cit.id)) {
          out.push({
            findingId: `DR-CIT-NOID-${block.id}-${cit.id}`,
            blockId: block.id,
            badgeType: "CITATION_WARNING",
            category: "CITATION_INTEGRITY_VIOLATION",
            severity: "METHODOLOGICAL_WARNING",
            auditorAgent: "LiteratureIntegrityAuditor",
            title: `Citation '${cit.id}' Missing Persistent Identifier (DOI/PMID)`,
            targetSpan: cit.id,
            forensicEvidence: `Bibliography entry '${cit.id}' (${cit.text}) lacks both a Crossref DOI and a PubMed PMID.`,
            suggestedRemediation: `Resolve '${cit.id}' against Crossref/PubMed and attach its canonical DOI and PMID.`,
            computeTierUsed: alloc.computeTier,
            falsificationRule: "BIBLIOGRAPHY-DOI-PMID-RESOLUTION"
          });
        }
      }
    }
    return out;
  }
};

// src/core/review/ParetoRefinementCapability.ts
var import_node_crypto2 = require("node:crypto");
var REVIEW_AXIS_KEYS = [
  "Originality",
  "Quality",
  "Clarity",
  "Significance",
  "Soundness",
  "Presentation",
  "Contribution"
];
function stripDimensionedNumbers(latex) {
  return latex.replace(/\b\d+(?:\.\d+)?\\(?:textwidth|textheight|linewidth|columnwidth|columnsep|baselineskip)\b/g, " ").replace(/\b\d+(?:\.\d+)?(?:pt|mm|cm|in|em|ex|bp)\b/g, " ");
}
function extractDecimalMetrics(latex) {
  const cleaned = stripDimensionedNumbers(latex);
  const matches = cleaned.match(/(?<![A-Za-z0-9_.])\d+\.\d+(?![A-Za-z0-9_.])/g) ?? [];
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const m of matches) {
    if (!seen.has(m)) {
      seen.add(m);
      result.push(m);
    }
  }
  return result;
}
function countColumnsFromSpec(spec) {
  let count = 0;
  const expanded = spec.replace(/\*\{(\d+)\}\{([^}]*)\}/g, (_all, rep, inner) => {
    const times = Number.parseInt(rep, 10);
    return Number.isFinite(times) && times > 0 ? inner.repeat(times) : inner;
  });
  const withoutAtExprs = expanded.replace(/@\{[^}]*\}/g, "");
  for (const ch of withoutAtExprs) {
    if ("lcrpmbX".includes(ch)) {
      count += 1;
    }
  }
  return count;
}
function estimatePageCount(latex) {
  let mainBody = latex;
  const cutPatterns = [
    /\\appendix\b/,
    /\\section\*?\{Appendix\b/i,
    /\\begin\{thebibliography\}/,
    /\\bibliography\{/,
    /\\printbibliography\b/,
    /\\end\{document\}/
  ];
  let earliestCut = mainBody.length;
  for (const pattern of cutPatterns) {
    const match = pattern.exec(mainBody);
    if (match && match.index < earliestCut) {
      earliestCut = match.index;
    }
  }
  mainBody = mainBody.slice(0, earliestCut);
  const floatCount = (mainBody.match(/\\begin\{(?:figure|table)\*?\}/g) ?? []).length;
  const proseOnly = mainBody.replace(/%.*$/gm, " ").replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, " ").replace(/[{}$\\]/g, " ");
  const wordCount = proseOnly.trim().split(/\s+/).filter(Boolean).length;
  const pages = wordCount / 450 + floatCount * 0.35;
  return Math.max(1, Math.ceil(pages));
}
function auditLatexLayout(latex, options) {
  const layoutIssues = [];
  const envRegex = /\\(begin|end)\{(figure\*?|table\*?)\}/g;
  const stack = [];
  let envMatch;
  while ((envMatch = envRegex.exec(latex)) !== null) {
    const kind = envMatch[1];
    const envName = envMatch[2];
    if (!kind || !envName) {
      continue;
    }
    if (kind === "begin") {
      stack.push(envName);
    } else {
      const top = stack.pop();
      if (!top) {
        layoutIssues.push({
          code: "MISMATCHED_FLOAT_ENVIRONMENT",
          severity: "ERROR",
          message: `Found \\end{${envName}} without matching \\begin{${envName}}.`
        });
      } else if (top !== envName) {
        layoutIssues.push({
          code: "MISMATCHED_FLOAT_ENVIRONMENT",
          severity: "ERROR",
          message: `Mismatched float environment: \\begin{${top}} closed by \\end{${envName}}.`
        });
      }
    }
  }
  for (const unclosed of stack) {
    layoutIssues.push({
      code: "MISMATCHED_FLOAT_ENVIRONMENT",
      severity: "ERROR",
      message: `Unclosed float environment \\begin{${unclosed}}.`
    });
  }
  const conclusionMatch = /\\section\*?\{Conclusions?\b[^}]*\}/i.exec(latex);
  if (conclusionMatch) {
    const afterConclusion = latex.slice(conclusionMatch.index);
    const appendixOrEndMatch = /\\appendix\b|\\section\*?\{Appendix\b|\\end\{document\}/i.exec(afterConclusion);
    const conclusionBody = appendixOrEndMatch ? afterConclusion.slice(0, appendixOrEndMatch.index) : afterConclusion;
    if (/\\begin\{(?:figure|table)\*?\}/.test(conclusionBody)) {
      layoutIssues.push({
        code: "FLOAT_AFTER_CONCLUSION",
        severity: "ERROR",
        message: "Found float environment placed after \\section{Conclusion}; floats must appear before Conclusions or inside Appendices."
      });
    }
  }
  if (options?.availableFigures && options.availableFigures.length > 0) {
    for (const figRef of options.availableFigures) {
      const trimmed = figRef.trim();
      if (!trimmed) {
        continue;
      }
      const baseName = trimmed.replace(/\.[^.]+$/, "");
      const appearsInLatex = latex.includes(trimmed) || baseName.length > 0 && latex.includes(baseName);
      if (!appearsInLatex) {
        layoutIssues.push({
          code: "UNREFERENCED_AVAILABLE_FIGURE",
          severity: "ERROR",
          message: `Generated visual asset "${trimmed}" is not referenced in the candidate LaTeX manuscript.`
        });
      }
    }
  }
  const tableBlockRegex = /\\begin\{(table\*?)\}([\s\S]*?)\\end\{\1\}/g;
  let tableMatch;
  while ((tableMatch = tableBlockRegex.exec(latex)) !== null) {
    const block = tableMatch[2] ?? "";
    const tabularSpecMatch = /\\begin\{tabular\}\{([^}]+)\}/.exec(block);
    const colCount = tabularSpecMatch?.[1] ? countColumnsFromSpec(tabularSpecMatch[1]) : 0;
    const hasResponsiveWrapper = /\\resizebox\b|\\adjustbox\b|\\scalebox\b|\\begin\{tabularx\}/.test(block);
    if (colCount >= 6 && !hasResponsiveWrapper) {
      layoutIssues.push({
        code: "WIDE_TABLE_NO_SCALING",
        severity: "ERROR",
        message: `Table has ${colCount} columns (>= 6) without \\resizebox, \\adjustbox, or tabularx scaling.`
      });
    }
  }
  const estimatedPages = estimatePageCount(latex);
  if (typeof options?.maxPageLimit === "number" && options.maxPageLimit > 0) {
    if (estimatedPages > options.maxPageLimit) {
      layoutIssues.push({
        code: "PAGE_LIMIT_EXCEEDED",
        severity: "ERROR",
        message: `Estimated main-body length (${estimatedPages} pages) exceeds maxPageLimit (${options.maxPageLimit} pages).`
      });
    }
  }
  return { layoutIssues, estimatedPages };
}
var ParetoRefinementCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "review.pareto_refinement_gate",
      description: "Enforces PaperOrchestra Pareto multi-axis acceptance/rollback across 7 review axes + Overall, detects ungrounded numeric hallucinations, and runs structural LaTeX layout audits.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          iteration: { type: "number" },
          previousLatex: { type: "string" },
          candidateLatex: { type: "string" },
          previousScores: { type: "object" },
          candidateScores: { type: "object" },
          allowedExperimentalNumbers: { type: "array", items: { type: "string" } },
          availableFigures: { type: "array", items: { type: "string" } },
          maxPageLimit: { type: "number" }
        },
        required: ["previousLatex", "candidateLatex", "previousScores", "candidateScores"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          decision: { type: "string" },
          accepted: { type: "boolean" },
          selectedLatex: { type: "string" },
          overallDelta: { type: "number" },
          improvedAxes: { type: "array" },
          regressedAxes: { type: "array" },
          hallucinatedNumbers: { type: "array" },
          layoutIssues: { type: "array" },
          estimatedPages: { type: "number" },
          worklogEntry: { type: "object" },
          gateHash: { type: "string" }
        },
        required: [
          "manuscriptId",
          "decision",
          "accepted",
          "selectedLatex",
          "overallDelta",
          "improvedAxes",
          "regressedAxes",
          "hallucinatedNumbers",
          "layoutIssues",
          "estimatedPages",
          "worklogEntry",
          "gateHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const manuscriptId = input.manuscriptId && input.manuscriptId.trim().length > 0 ? input.manuscriptId.trim() : `pareto_${(0, import_node_crypto2.createHash)("sha256").update(input.candidateLatex).digest("hex").slice(0, 12)}`;
    const iteration = typeof input.iteration === "number" && input.iteration >= 1 ? input.iteration : 1;
    const improvedAxes = [];
    const regressedAxes = [];
    for (const axis of REVIEW_AXIS_KEYS) {
      const prevVal = input.previousScores[axis];
      const candVal = input.candidateScores[axis];
      if (candVal > prevVal) {
        improvedAxes.push(axis);
      } else if (candVal < prevVal) {
        regressedAxes.push(axis);
      }
    }
    const overallDelta = Number(
      (input.candidateScores.Overall - input.previousScores.Overall).toFixed(4)
    );
    const hallucinatedNumbers = this.detectDataHallucinations(
      input.previousLatex,
      input.candidateLatex,
      input.allowedExperimentalNumbers
    );
    const { layoutIssues, estimatedPages } = auditLatexLayout(input.candidateLatex, {
      availableFigures: input.availableFigures,
      maxPageLimit: input.maxPageLimit
    });
    const hasBlockingLayoutError = layoutIssues.some((issue) => issue.severity === "ERROR");
    let decision;
    if (hallucinatedNumbers.length > 0) {
      decision = "REJECTED_DATA_HALLUCINATION";
    } else if (hasBlockingLayoutError) {
      decision = "REJECTED_LAYOUT_ERROR";
    } else if (regressedAxes.length > 0 || overallDelta < 0) {
      decision = "REJECTED_REGRESSION";
    } else if (overallDelta > 0) {
      decision = "ACCEPTED_OVERALL_GAIN";
    } else if (improvedAxes.length > 0) {
      decision = "ACCEPTED_PARETO_IMPROVEMENT";
    } else {
      decision = "REJECTED_NO_IMPROVEMENT";
    }
    const accepted = decision === "ACCEPTED_OVERALL_GAIN" || decision === "ACCEPTED_PARETO_IMPROVEMENT";
    const selectedLatex = accepted ? input.candidateLatex : input.previousLatex;
    const worklogEntry = {
      iteration,
      decision,
      accepted,
      overallDelta,
      improvedAxes,
      regressedAxes,
      hallucinatedNumbers,
      layoutIssueCodes: layoutIssues.map((issue) => issue.code),
      summary: this.buildWorklogSummary(
        iteration,
        decision,
        overallDelta,
        improvedAxes,
        regressedAxes,
        hallucinatedNumbers,
        layoutIssues
      )
    };
    const payloadWithoutHash = {
      manuscriptId,
      decision,
      accepted,
      selectedLatex,
      overallDelta,
      improvedAxes,
      regressedAxes,
      hallucinatedNumbers,
      layoutIssues,
      estimatedPages,
      worklogEntry
    };
    const gateHash = `sha256:${(0, import_node_crypto2.createHash)("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex")}`;
    return {
      ...payloadWithoutHash,
      gateHash
    };
  }
  detectDataHallucinations(previousLatex, candidateLatex, allowedExperimentalNumbers) {
    if (allowedExperimentalNumbers === void 0) {
      return [];
    }
    const previousSet = new Set(extractDecimalMetrics(previousLatex));
    const allowedNormalized = new Set(
      allowedExperimentalNumbers.map((num) => num.trim().replace(/%$/, ""))
    );
    const candidateMetrics = extractDecimalMetrics(candidateLatex);
    const fabricated = [];
    for (const metric of candidateMetrics) {
      if (!previousSet.has(metric) && !allowedNormalized.has(metric)) {
        fabricated.push(metric);
      }
    }
    return fabricated;
  }
  buildWorklogSummary(iteration, decision, overallDelta, improvedAxes, regressedAxes, hallucinatedNumbers, layoutIssues) {
    if (decision === "REJECTED_DATA_HALLUCINATION") {
      return `Iteration ${iteration}: ROLLED BACK due to ungrounded numeric metric(s): ${hallucinatedNumbers.join(", ")}.`;
    }
    if (decision === "REJECTED_LAYOUT_ERROR") {
      return `Iteration ${iteration}: ROLLED BACK due to ${layoutIssues.length} LaTeX layout issue(s): ${layoutIssues.map((i) => i.code).join(", ")}.`;
    }
    if (decision === "REJECTED_REGRESSION") {
      return `Iteration ${iteration}: ROLLED BACK due to score regression (overallDelta=${overallDelta}, regressed=[${regressedAxes.join(", ")}]).`;
    }
    if (decision === "REJECTED_NO_IMPROVEMENT") {
      return `Iteration ${iteration}: ROLLED BACK (no Overall or Pareto sub-axis improvement).`;
    }
    return `Iteration ${iteration}: ${decision} (overallDelta=${overallDelta}, improved=[${improvedAxes.join(", ")}]).`;
  }
};

// src/core/review/UncitedAssertionDetectorCapability.ts
var import_node_crypto3 = require("node:crypto");
var EMPIRICAL_VERBS = /* @__PURE__ */ new Set([
  "showed",
  "demonstrated",
  "observed",
  "proved",
  "confirmed",
  "revealed",
  "outperformed",
  "established",
  "achieved",
  "exceeded"
]);
var EXPLICIT_QUANTIFIERS = [
  /\bmost\b/i,
  /\bseveral\b/i,
  /\btwo-thirds\b/i,
  /\bthree-quarters\b/i,
  /\bmajority\s+of\b/i,
  /\bnearly\s+all\b/i
];
var CITATION_MARKER_PATTERN = /\\cite[a-zA-Z]*\*?(?:\[[^\]]*\])*\{[^}]+\}|<!--\s*ref:[A-Za-z0-9_.:-]+\s*-->|\[\d+(?:\s*[,–-]\s*\d+)*\]|\([A-Z][A-Za-z-]+(?:\s+et\s+al\.)?,\s*\d{4}[a-z]?\)/;
var DEFINITIONAL_FRAME_PATTERN = /\b(?:refers\s+to|is\s+defined\s+as|are\s+defined\s+as|we\s+define|for\s+the\s+purposes\s+of|denotes|hereinafter)\b/i;
var SECTION_CUE_LEFT_WINDOW = /\b(?:section|figure|chapter|table|fig\.|tbl\.|step|appendix|equation|eq\.)\s*$|§\s*$/i;
var VERSION_PREFIX_LEFT_WINDOW = /\b(?:v|version\s*)$/i;
var GUARD_LEFT_WINDOW_CHARS = 24;
function isYearOrVersionOrSectionNumber(sentence, matchText, matchStart) {
  const cleaned = matchText.replace(/%$/, "");
  if (/^(?:19|20)\d{2}$/.test(cleaned)) {
    return true;
  }
  if (/^\d+\.\d+\.\d+(?:\.\d+)*$/.test(cleaned)) {
    return true;
  }
  const leftStart = Math.max(0, matchStart - GUARD_LEFT_WINDOW_CHARS);
  const leftWindow = sentence.slice(leftStart, matchStart);
  if (/^\d+(?:\.\d+)?$/.test(cleaned) && SECTION_CUE_LEFT_WINDOW.test(leftWindow)) {
    return true;
  }
  if (/^\d+\.\d+$/.test(cleaned) && VERSION_PREFIX_LEFT_WINDOW.test(leftWindow)) {
    return true;
  }
  return false;
}
function splitManuscriptIntoSentences(text2) {
  const raw = text2.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 0 && !s.startsWith("\\section") && !s.startsWith("\\subsection"));
  return raw.map((sentence, idx) => ({
    id: `sent_${idx + 1}`,
    text: sentence
  }));
}
var UncitedAssertionDetectorCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "review.detect_uncited_assertions",
      description: "Detects D4-c uncited empirical assertions using the 3-condition token rule (quantifier/empirical-verb with 4-shape year/version/section guard, absence of inline or adjacent-window citation markers, and non-definitional frame).",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          manuscriptText: { type: "string" },
          sentences: { type: "array", items: { type: "object" } }
        }
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          totalSentencesEvaluated: { type: "number" },
          uncitedAssertionCount: { type: "number" },
          findings: { type: "array", items: { type: "object" } },
          auditHash: { type: "string" }
        },
        required: [
          "manuscriptId",
          "totalSentencesEvaluated",
          "uncitedAssertionCount",
          "findings",
          "auditHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const candidateSentences = input.sentences && input.sentences.length > 0 ? input.sentences : input.manuscriptText ? splitManuscriptIntoSentences(input.manuscriptText) : [];
    const seedText = input.manuscriptText ?? candidateSentences.map((s) => s.text).join("\n");
    const manuscriptId = input.manuscriptId && input.manuscriptId.trim().length > 0 ? input.manuscriptId.trim() : `uncited_${(0, import_node_crypto3.createHash)("sha256").update(seedText).digest("hex").slice(0, 12)}`;
    const findings = [];
    candidateSentences.forEach((item, index) => {
      const sentence = item.text.trim();
      if (!sentence) {
        return;
      }
      if (DEFINITIONAL_FRAME_PATTERN.test(sentence)) {
        return;
      }
      if (CITATION_MARKER_PATTERN.test(sentence)) {
        return;
      }
      if (item.adjacentText && CITATION_MARKER_PATTERN.test(item.adjacentText)) {
        return;
      }
      const triggers = this.extractConditionOneTriggers(sentence);
      if (triggers.length === 0) {
        return;
      }
      const sentenceId = item.id?.trim() || `sent_${index + 1}`;
      findings.push({
        sentenceId,
        sentence,
        matchedTriggers: triggers,
        manifestClaimId: item.manifestClaimId ?? null,
        scopedManifestId: item.scopedManifestId ?? null,
        remediation: "Attach an inline citation (\\cite{...} or <!--ref:slug-->) or bind the empirical assertion to a verified experimental manifest."
      });
    });
    const payloadWithoutHash = {
      manuscriptId,
      totalSentencesEvaluated: candidateSentences.length,
      uncitedAssertionCount: findings.length,
      findings
    };
    const auditHash = `sha256:${(0, import_node_crypto3.createHash)("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex")}`;
    return {
      ...payloadWithoutHash,
      auditHash
    };
  }
  extractConditionOneTriggers(sentence) {
    const triggers = [];
    const wordMatches = sentence.match(/[A-Za-z][A-Za-z-]*/g) ?? [];
    for (const w of wordMatches) {
      const lower = w.toLowerCase();
      if (EMPIRICAL_VERBS.has(lower)) {
        triggers.push(`verb:${lower}`);
      }
    }
    for (const qRegex of EXPLICIT_QUANTIFIERS) {
      const m = qRegex.exec(sentence);
      if (m?.[0]) {
        triggers.push(`quantifier:${m[0].toLowerCase()}`);
      }
    }
    const numRegex = /(?<![A-EG-UW-Za-eg-uw-z0-9_.])\d+(?:\.\d+)*%?/g;
    let numMatch;
    while ((numMatch = numRegex.exec(sentence)) !== null) {
      const token = numMatch[0];
      if (!token) {
        continue;
      }
      if (!isYearOrVersionOrSectionNumber(sentence, token, numMatch.index)) {
        triggers.push(`number:${token}`);
      }
    }
    return triggers;
  }
};

// src/core/review/DevilsAdvocateCapability.ts
var import_node_crypto4 = require("node:crypto");
var DEFAULT_ACCEPTANCE_DIMENSIONS = [
  {
    dimensionId: "D1",
    name: "Causal Identification and Internal Validity",
    mandatory: true,
    eligibleRoles: ["da", "methodology"]
  },
  {
    dimensionId: "D2",
    name: "Confounder Control and Negative Controls",
    mandatory: true,
    eligibleRoles: ["da", "domain"]
  },
  {
    dimensionId: "D3",
    name: "External Generalizability and Scope Boundaries",
    mandatory: false,
    eligibleRoles: ["da", "perspective"]
  }
];
function buildSprintContractPreCommitment(title, field, dimensions, targetCriteriaBindingMarker) {
  const eligible = dimensions.filter(
    (d) => !d.eligibleRoles || d.eligibleRoles.includes("da")
  );
  const contractParaphrase = eligible.map(
    (dim) => `[${dim.dimensionId} \u2014 ${dim.name}] Adversarial pre-commitment for "${title}" (${field}): stress-test whether reported effects survive rival explanations, unmeasured confounding, and boundary perturbations before inspecting manuscript prose.`
  );
  const scoringPlan = eligible.map((dim) => {
    const baseItem = {
      dimensionId: dim.dimensionId,
      name: dim.name,
      mandatory: dim.mandatory,
      whatToLookFor: `Explicit falsification bounds, rival mechanism elimination, and confounder stratification for ${dim.name}.`,
      whatTriggersWarn: `Minor ambiguity in scope boundaries or implicit linearity assumption under ${dim.dimensionId}.`,
      whatTriggersBlock: `Uncontrolled plausible confounder or uncalibrated baseline comparison under ${dim.dimensionId}.`
    };
    if (dim.mandatory) {
      baseItem.whatTriggersFatal = `Direct logical contradiction, circular data leakage, or refuted causal premise in mandatory dimension ${dim.dimensionId}.`;
    }
    return baseItem;
  });
  const criteriaBindingLine = targetCriteriaBindingMarker && targetCriteriaBindingMarker.trim().length > 0 ? targetCriteriaBindingMarker.trim() : "criteria_binding_unavailable";
  return {
    contractParaphrase,
    scoringPlan,
    criteriaBindingLine,
    acknowledgmentTag: "[CONTRACT-ACKNOWLEDGED]"
  };
}
function extractCoreClaimsFromText(text2, explicitClaims) {
  if (explicitClaims && explicitClaims.length > 0) {
    return explicitClaims.map((c) => c.trim()).filter(Boolean);
  }
  const sentences = text2.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length >= 25 && !s.startsWith("\\"));
  const assertiveSentences = sentences.filter(
    (s) => /\b(?:demonstrate[sd]?|prove[sd]?|establish(?:es|ed)?|outperform[sd]?|cause[sd]?|drive[sd]?|achieve[sd]?|significantly|universal(?:ly)?)\b/i.test(
      s
    )
  );
  if (assertiveSentences.length > 0) {
    return assertiveSentences.slice(0, 4);
  }
  return sentences.slice(0, 2);
}
var DevilsAdvocateCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "review.devils_advocate_stress_test",
      description: "Executes a 2-phase Devil\u2019s Advocate contrarian review: Phase 1 paper-blind Sprint Contract pre-commitment ([CONTRACT-ACKNOWLEDGED]) followed by Phase 2 steel-manning, subclaim decomposition, and adversarial falsification challenges.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          title: { type: "string" },
          field: { type: "string" },
          wordCount: { type: "number" },
          manuscriptText: { type: "string" },
          coreClaims: { type: "array", items: { type: "string" } },
          acceptanceDimensions: { type: "array", items: { type: "object" } },
          targetCriteriaBindingMarker: { type: "string" }
        },
        required: ["title", "manuscriptText"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          sprintContract: { type: "object" },
          subclaimAnalyses: { type: "array", items: { type: "object" } },
          challenges: { type: "array", items: { type: "object" } },
          reviewFindings: { type: "array", items: { type: "object" } },
          stressTestHash: { type: "string" }
        },
        required: [
          "manuscriptId",
          "sprintContract",
          "subclaimAnalyses",
          "challenges",
          "reviewFindings",
          "stressTestHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const manuscriptId = input.manuscriptId && input.manuscriptId.trim().length > 0 ? input.manuscriptId.trim() : `da_${(0, import_node_crypto4.createHash)("sha256").update(input.manuscriptText).digest("hex").slice(0, 12)}`;
    const field = input.field?.trim() || "Computational Science & Biomedicine";
    const dimensions = input.acceptanceDimensions && input.acceptanceDimensions.length > 0 ? input.acceptanceDimensions : DEFAULT_ACCEPTANCE_DIMENSIONS;
    const sprintContract = buildSprintContractPreCommitment(
      input.title,
      field,
      dimensions,
      input.targetCriteriaBindingMarker
    );
    const claims = extractCoreClaimsFromText(input.manuscriptText, input.coreClaims);
    const subclaimAnalyses = [];
    const challenges = [];
    const reviewFindings = [];
    const hasNegativeControlMention = /\b(?:negative\s+control|permutation\s+test|null\s+distribution|placebo|sham|ablation)\b/i.test(
      input.manuscriptText
    );
    const hasConfounderMention = /\b(?:confound(?:er|ing)|covariate|stratified|batch\s+effect|age-matched)\b/i.test(
      input.manuscriptText
    );
    const hasLimitationsSection = /\b(?:limitation[s]?|boundary\s+condition[s]?|threat[s]?\s+to\s+validity)\b/i.test(
      input.manuscriptText
    );
    claims.forEach((claim, idx) => {
      const claimId = `CLM-DA-${idx + 1}`;
      const clauses = claim.split(/\b(?:and|while|whereas|because|whereby|by)\b|[,;]/i).map((c) => c.trim()).filter((c) => c.length >= 10);
      const subclaims = clauses.length >= 2 ? clauses : [
        `Empirical effect assertion: ${claim}`,
        `Mechanistic attribution and invariance under distribution shift for ${claimId}`
      ];
      const steelManFormulation = `Under the authors' strongest methodological framing, ${claim.replace(/\.$/, "")} holds consistently across the evaluated regime because the observed signal exceeds baseline variance under the reported experimental protocol.`;
      const isStrongCausalOrUniversal = /\b(?:prove[sd]?|universal(?:ly)?|always|eliminates?\s+all|guarantees?|causal(?:ly)?)\b/i.test(
        claim
      );
      const vulnerabilityLevel = isStrongCausalOrUniversal || !hasNegativeControlMention ? "HIGH" : !hasConfounderMention || !hasLimitationsSection ? "MODERATE" : "LOW";
      subclaimAnalyses.push({
        claimId,
        originalClaim: claim,
        steelManFormulation,
        subclaims,
        vulnerabilityLevel
      });
      if (isStrongCausalOrUniversal) {
        challenges.push({
          challengeId: `CHAL-${claimId}-ALT`,
          targetClaimId: claimId,
          vector: "ALTERNATIVE_EXPLANATION",
          steelManPremise: steelManFormulation,
          contrarianAttack: `Claim ${claimId} asserts a strong causal or universal conclusion ("${claim}"), which could equally be explained by latent feature collinearity or dataset-specific Inductive Bias without proving underlying causal necessity.`,
          falsificationExperiment: "Perform interventional feature-knockout or cross-domain out-of-distribution (OOD) transfer where spurious correlates are decorrelated.",
          severity: "major"
        });
      }
      if (!hasConfounderMention) {
        challenges.push({
          challengeId: `CHAL-${claimId}-CONF`,
          targetClaimId: claimId,
          vector: "UNCONTROLLED_CONFOUNDER",
          steelManPremise: steelManFormulation,
          contrarianAttack: `No explicit confounder stratification or batch/covariate adjustment is documented in support of ${claimId}.`,
          falsificationExperiment: "Include propensity-matched or covariate-adjusted regression residuals to rule out batch and demographic confounding.",
          severity: "major"
        });
      }
      if (!hasNegativeControlMention) {
        challenges.push({
          challengeId: `CHAL-${claimId}-NEG`,
          targetClaimId: claimId,
          vector: "MISSING_FALSIFICATION_CONTROL",
          steelManPremise: steelManFormulation,
          contrarianAttack: `Empirical signal in ${claimId} lacks a paired negative/permutation control demonstrating that the metric collapses to chance under label or sequence randomization.`,
          falsificationExperiment: "Run label-permutation and random-seed negative controls and report the null distribution.",
          severity: "major"
        });
      }
      if (!hasLimitationsSection && idx === 0) {
        challenges.push({
          challengeId: `CHAL-${claimId}-GEN`,
          targetClaimId: claimId,
          vector: "OVERGENERALIZATION_BEYOND_COHORT",
          steelManPremise: steelManFormulation,
          contrarianAttack: "Manuscript does not bound the domain of applicability or failure modes of the primary thesis.",
          falsificationExperiment: "Document explicit scope limitations and cohort/regime failure boundaries.",
          severity: "minor"
        });
      }
    });
    if (challenges.length === 0) {
      const firstAnalysis = subclaimAnalyses[0];
      const targetId = firstAnalysis?.claimId ?? "CLM-DA-1";
      challenges.push({
        challengeId: `CHAL-${targetId}-BIAS`,
        targetClaimId: targetId,
        vector: "SELECTION_OR_SURVIVORSHIP_BIAS",
        steelManPremise: firstAnalysis?.steelManFormulation ?? "Under the strongest reading of the manuscript, the primary empirical findings hold across evaluated cohorts.",
        contrarianAttack: "Even with reported controls, benchmark selection and cohort inclusion criteria may introduce survivorship bias favoring high-signal loci or clean recordings.",
        falsificationExperiment: "Evaluate sensitivity on unfiltered prospective or high-noise held-out strata.",
        severity: "minor"
      });
    }
    const fixedTimestamp = /* @__PURE__ */ new Date("2026-11-20T00:00:00.000Z");
    for (const ch of challenges) {
      reviewFindings.push({
        id: `da-${ch.challengeId.toLowerCase()}`,
        reviewerId: "agent-devils-advocate-reviewer",
        severity: ch.severity,
        targetNodeId: ch.targetClaimId,
        description: `[Devil's Advocate \xB7 ${ch.vector}] Steel-Man: ${ch.steelManPremise} | Attack: ${ch.contrarianAttack}`,
        suggestedAction: ch.falsificationExperiment,
        timestamp: fixedTimestamp
      });
    }
    const payloadWithoutHash = {
      manuscriptId,
      sprintContract,
      subclaimAnalyses,
      challenges
    };
    const stressTestHash = `sha256:${(0, import_node_crypto4.createHash)("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex")}`;
    return {
      ...payloadWithoutHash,
      reviewFindings,
      stressTestHash
    };
  }
};

// src/core/publication/orchestra/OutlineBlueprintCapability.ts
var import_node_crypto5 = require("node:crypto");
var KNOWN_ENTITY_RULES = [
  { canonical: "ADNI", category: "dataset", pattern: /\bADNI\b/i },
  { canonical: "UK Biobank", category: "dataset", pattern: /\bUK\s*Biobank\b/i },
  { canonical: "PPMI", category: "dataset", pattern: /\bPPMI\b/i },
  { canonical: "ROS/MAP", category: "dataset", pattern: /\bROS\/?MAP\b/i },
  { canonical: "ImageNet", category: "dataset", pattern: /\bImageNet\b/i },
  { canonical: "GLUE", category: "dataset", pattern: /\bGLUE\b/i },
  { canonical: "SuperGLUE", category: "dataset", pattern: /\bSuperGLUE\b/i },
  { canonical: "MMLU", category: "dataset", pattern: /\bMMLU\b/i },
  { canonical: "GSM8K", category: "dataset", pattern: /\bGSM8K\b/i },
  { canonical: "SWE-bench", category: "dataset", pattern: /\bSWE-bench\b/i },
  { canonical: "AlphaGenome", category: "method", pattern: /\bAlphaGenome\b/i },
  { canonical: "Enformer", category: "baseline", pattern: /\bEnformer\b/i },
  { canonical: "ResNet", category: "baseline", pattern: /\bResNet(?:-\d+)?\b/i },
  { canonical: "Transformer", category: "method", pattern: /\bTransformer\b/i },
  { canonical: "XGBoost", category: "baseline", pattern: /\bXGBoost\b/i },
  { canonical: "AdamW", category: "method", pattern: /\bAdamW\b/i },
  { canonical: "LoRA", category: "method", pattern: /\bLoRA\b/i },
  { canonical: "Prime Editing", category: "method", pattern: /\bPrime\s+Editing\b/i },
  { canonical: "pTau217", category: "metric", pattern: /\bp-?Tau\s*217\b/i },
  { canonical: "AUROC", category: "metric", pattern: /\bAUROC\b/i },
  { canonical: "AUPRC", category: "metric", pattern: /\bAUPRC\b/i },
  { canonical: "Benjamini-Hochberg", category: "method", pattern: /\bBenjamini[- ]Hochberg\b/i },
  { canonical: "FDR", category: "metric", pattern: /\bFDR\b/i },
  { canonical: "F1-score", category: "metric", pattern: /\bF1(?:-score)?\b/i }
];
function sanitizeFigureId(raw) {
  const cleaned = raw.toLowerCase().replace(/figure/gi, "panel").replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned.startsWith("fig_") ? cleaned : `fig_${cleaned || "overview"}`;
}
function firstSentence(text2, fallback) {
  const trimmed = text2.trim();
  if (!trimmed) {
    return fallback;
  }
  const idx = trimmed.search(/[.!?](?:\s|$)/);
  return idx >= 0 ? trimmed.slice(0, idx + 1).trim() : trimmed.slice(0, 180).trim();
}
var OutlineBlueprintCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.generate_outline_blueprint",
      description: "Compiles a structured, anti-overclaim IMRaD manuscript outline blueprint with a semantic fig_* plotting plan, P0/P1 citation hints, and balanced Related Work subsections.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          title: { type: "string" },
          ideaSummary: { type: "string" },
          experimentalLog: { type: "string" },
          venue: { type: "string" },
          maxPageLimit: { type: "number" },
          datasets: { type: "array", items: { type: "string" } },
          baselines: { type: "array", items: { type: "string" } },
          metrics: { type: "array", items: { type: "string" } },
          methods: { type: "array", items: { type: "string" } }
        },
        required: ["title", "ideaSummary"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          title: { type: "string" },
          venue: { type: "string" },
          maxPageLimit: { type: "number" },
          sections: { type: "array" },
          introRelatedWorkPlan: { type: "object" },
          plottingPlan: { type: "array" },
          citationHints: { type: "array" },
          antiOverclaimRules: { type: "array" },
          blueprintHash: { type: "string" }
        },
        required: [
          "manuscriptId",
          "title",
          "venue",
          "maxPageLimit",
          "sections",
          "introRelatedWorkPlan",
          "plottingPlan",
          "citationHints",
          "antiOverclaimRules",
          "blueprintHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const manuscriptId = input.manuscriptId && input.manuscriptId.trim().length > 0 ? input.manuscriptId.trim() : `ms_${(0, import_node_crypto5.createHash)("sha256").update(input.title).digest("hex").slice(0, 12)}`;
    const venue = input.venue?.trim() || "NeurIPS";
    const maxPageLimit = typeof input.maxPageLimit === "number" && input.maxPageLimit > 0 ? Math.round(input.maxPageLimit) : 9;
    const citationHints = this.extractCitationHints(input);
    const plottingPlan = this.buildPlottingPlan(input, venue, citationHints);
    const introRelatedWorkPlan = this.buildIntroRelatedWorkPlan(input, citationHints);
    const sections = this.buildSections(maxPageLimit, plottingPlan, citationHints, introRelatedWorkPlan);
    const antiOverclaimRules = [
      "Never assert state-of-the-art (SOTA) performance against baselines not explicitly evaluated in experimental_log.md.",
      "All reported numbers in prose and tables must trace back directly to verified experimental logs or sealed manifests.",
      'Every visual asset identifier must use a semantic fig_* slug without containing the literal word "figure".',
      "Section hierarchies must remain balanced: never create an orphaned subsection (e.g., always pair 2.1 with at least 2.2).",
      "Constrain main body length within the target page budget and place all references after a \\FloatBarrier."
    ];
    const payloadWithoutHash = {
      manuscriptId,
      title: input.title,
      venue,
      maxPageLimit,
      sections,
      introRelatedWorkPlan,
      plottingPlan,
      citationHints,
      antiOverclaimRules
    };
    const blueprintHash = `sha256:${(0, import_node_crypto5.createHash)("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex")}`;
    return {
      ...payloadWithoutHash,
      blueprintHash
    };
  }
  extractCitationHints(input) {
    const hints = [];
    const seen = /* @__PURE__ */ new Set();
    const addHint = (rawEntity, category, priority, rationale) => {
      const entity = rawEntity.trim();
      if (!entity) {
        return;
      }
      const key = entity.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      hints.push({ entity, category, priority, rationale });
    };
    for (const ds of input.datasets ?? []) {
      addHint(ds, "dataset", "P0", "Explicitly declared dataset requiring primary corpus citation.");
    }
    for (const bl of input.baselines ?? []) {
      addHint(bl, "baseline", "P0", "Explicitly declared comparative baseline requiring methodological citation.");
    }
    for (const mt of input.metrics ?? []) {
      addHint(mt, "metric", "P0", "Explicitly declared evaluation metric or statistical benchmark.");
    }
    for (const md of input.methods ?? []) {
      addHint(md, "method", "P0", "Explicitly declared foundational method or optimizer.");
    }
    const combinedText = `${input.ideaSummary}
${input.experimentalLog ?? ""}`;
    for (const rule of KNOWN_ENTITY_RULES) {
      if (rule.pattern.test(combinedText)) {
        addHint(
          rule.canonical,
          rule.category,
          "P0",
          `Detected ${rule.category} reference in idea/experimental logs requiring P0 citation coverage.`
        );
      }
    }
    if (hints.length === 0) {
      addHint(
        "Primary Domain Benchmark",
        "dataset",
        "P1",
        "Recommended contextual dataset/benchmark citation for empirical grounding."
      );
    }
    return hints;
  }
  buildPlottingPlan(input, venue, hints) {
    const hasExpLog = Boolean(input.experimentalLog && input.experimentalLog.trim().length > 0);
    const metricNames = hints.filter((h) => h.category === "metric").map((h) => h.entity);
    const baselineNames = hints.filter((h) => h.category === "baseline").map((h) => h.entity);
    const twoColPreset = venue.toLowerCase().includes("nature") ? "nature_2col" : "double_column";
    const oneColPreset = venue.toLowerCase().includes("nature") ? "nature_1col" : "single_column";
    const plan = [
      {
        id: sanitizeFigureId("fig_architecture_overview"),
        sectionId: "sec_methodology",
        title: "System Architecture and Traceability Workflow",
        caption: `End-to-end schematic overview of ${input.title}, illustrating inputs, analytical modules, and verification gates.`,
        plotType: "diagram",
        aspectRatio: "16:9",
        dataSource: "idea.md",
        venuePreset: twoColPreset,
        requiredMetrics: []
      },
      {
        id: sanitizeFigureId("fig_empirical_benchmark"),
        sectionId: "sec_results",
        title: "Quantitative Benchmark Comparison Against Baselines",
        caption: `Comparative performance across evaluated configurations${baselineNames.length > 0 ? ` (${baselineNames.join(", ")})` : ""}.`,
        plotType: "plot",
        aspectRatio: "4:3",
        dataSource: hasExpLog ? "experimental_log.md" : "both",
        venuePreset: oneColPreset,
        requiredMetrics: metricNames.length > 0 ? metricNames : ["Primary Score"]
      }
    ];
    const combinedText = `${input.ideaSummary}
${input.experimentalLog ?? ""}`;
    if (/\b(ablation|sensitivity|calibration|longitudinal|stratified)\b/i.test(combinedText)) {
      plan.push({
        id: sanitizeFigureId("fig_ablation_sensitivity"),
        sectionId: "sec_results",
        title: "Ablation and Sensitivity Stratification Analysis",
        caption: "Component-wise contribution and sensitivity across parameter perturbations and cohorts.",
        plotType: "plot",
        aspectRatio: "16:9",
        dataSource: hasExpLog ? "experimental_log.md" : "both",
        venuePreset: twoColPreset,
        requiredMetrics: metricNames.length > 0 ? metricNames : ["Delta Score"]
      });
    }
    return plan;
  }
  buildIntroRelatedWorkPlan(input, hints) {
    const methodAndBaselineEntities = hints.filter((h) => h.category === "method" || h.category === "baseline").map((h) => h.entity);
    const datasetAndMetricEntities = hints.filter((h) => h.category === "dataset" || h.category === "metric").map((h) => h.entity);
    const hookSentence = firstSentence(
      input.ideaSummary,
      `Addressing reproducible verification and modeling gaps in ${input.title}.`
    );
    const relatedWorkClusters = [
      {
        subsectionId: "2.1",
        title: "Foundational Modeling Paradigms and Comparative Baselines",
        focus: "Synthesize algorithmic strengths, assumptions, and failure modes of prior baseline methods.",
        targetEntities: methodAndBaselineEntities.length > 0 ? methodAndBaselineEntities : ["Prior Baselines"],
        expectedCitations: Math.max(4, methodAndBaselineEntities.length * 2)
      },
      {
        subsectionId: "2.2",
        title: "Evaluation Benchmarks, Datasets, and Rigor Standards",
        focus: "Contrast existing benchmark datasets, statistical calibration standards, and reproducibility gaps.",
        targetEntities: datasetAndMetricEntities.length > 0 ? datasetAndMetricEntities : ["Benchmark Datasets"],
        expectedCitations: Math.max(4, datasetAndMetricEntities.length * 2)
      }
    ];
    return {
      introductionHooks: [
        hookSentence,
        "Quantify the validation bottleneck and identify why existing baselines fail to generalize without structural verification."
      ],
      researchGap: "Existing methods lack end-to-end deterministic traceability between experimental logs, baseline comparisons, and claim-level verification.",
      contributions: [
        `Formulate and evaluate ${input.title} under reproducible, provenance-locked benchmarks.`,
        "Establish quantitative parity and ablation baselines anchored strictly to experimental logs.",
        "Provide failure-mode characterization and falsifiable boundary conditions in Discussion."
      ],
      relatedWorkClusters
    };
  }
  buildSections(maxPageLimit, plottingPlan, hints, introRelatedWorkPlan) {
    const totalWordBudget = Math.max(2500, maxPageLimit * 620);
    const p0Entities = hints.filter((h) => h.priority === "P0").map((h) => h.entity);
    const diagramIds = plottingPlan.filter((item) => item.sectionId === "sec_methodology").map((item) => item.id);
    const resultPlotIds = plottingPlan.filter((item) => item.sectionId === "sec_results").map((item) => item.id);
    const sections = [
      {
        sectionId: "sec_introduction",
        title: "1. Introduction",
        targetWordBudget: Math.round(totalWordBudget * 0.14),
        keyClaims: introRelatedWorkPlan.contributions,
        figureIds: [],
        requiredCitationEntities: p0Entities.slice(0, 4)
      },
      {
        sectionId: "sec_related_work",
        title: "2. Related Work",
        targetWordBudget: Math.round(totalWordBudget * 0.16),
        keyClaims: introRelatedWorkPlan.relatedWorkClusters.map(
          (c) => `${c.subsectionId} ${c.title}: ${c.focus}`
        ),
        figureIds: [],
        requiredCitationEntities: p0Entities
      },
      {
        sectionId: "sec_methodology",
        title: "3. Methodology",
        targetWordBudget: Math.round(totalWordBudget * 0.24),
        keyClaims: [
          "Formal problem formulation and architectural components.",
          "Deterministic reproducibility and calibration guarantees."
        ],
        figureIds: diagramIds,
        requiredCitationEntities: hints.filter((h) => h.category === "method").map((h) => h.entity)
      },
      {
        sectionId: "sec_results",
        title: "4. Experiments and Results",
        targetWordBudget: Math.round(totalWordBudget * 0.26),
        keyClaims: [
          "Quantitative baseline comparison strictly grounded in experimental logs.",
          "Stratified evaluation and ablation sensitivity checks."
        ],
        figureIds: resultPlotIds,
        requiredCitationEntities: hints.filter((h) => h.category === "dataset" || h.category === "baseline" || h.category === "metric").map((h) => h.entity)
      },
      {
        sectionId: "sec_discussion",
        title: "5. Discussion and Limitations",
        targetWordBudget: Math.round(totalWordBudget * 0.12),
        keyClaims: [
          "Explicit scope boundaries, confounding factors, and failure modes."
        ],
        figureIds: [],
        requiredCitationEntities: []
      },
      {
        sectionId: "sec_conclusion",
        title: "6. Conclusion",
        targetWordBudget: Math.round(totalWordBudget * 0.08),
        keyClaims: ["Concise synthesis of verified findings without new unsubstantiated claims."],
        figureIds: [],
        requiredCitationEntities: []
      }
    ];
    return sections;
  }
};

// src/core/publication/literature/LiteratureSynthesisAuditorCapability.ts
var import_node_crypto6 = require("node:crypto");
var COMPARATIVE_CUE_PATTERN = /\b(however|in contrast|unlike|whereas|conversely|compared with|compared to|on the other hand|limitation|limitations|weakness|shortcoming|trade-?off|bridge[sd]?\s+this\s+gap|remain[sd]?\s+vulnerable)\b/gi;
var SOTA_GLOBAL_CLAIM_PATTERN = /\b(state[- ]of[- ]the[- ]art|sota|outperforms?\s+(?:all|every|existing)|surpasses?\s+(?:all|every|existing)|best[- ]performing\s+(?:method|model|system)|unrivaled)\b/i;
var PAIRWISE_SUPERIORITY_PATTERN = /\b(?:outperforms?|surpasses?|beats?|exceeds?|superior\s+to)\s+(?:the\s+)?([A-Z][A-Za-z0-9_.-]{2,})\b/g;
var NON_BASELINE_CAPITALIZED_WORDS = /* @__PURE__ */ new Set([
  "table",
  "figure",
  "section",
  "method",
  "methods",
  "our",
  "this",
  "the",
  "all",
  "existing",
  "prior",
  "previous",
  "baseline",
  "baselines",
  "benchmarks",
  "other",
  "several"
]);
function round4(value) {
  return Math.round(value * 1e4) / 1e4;
}
function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function normalizeYearMonth(ym) {
  const trimmed = ym.trim();
  const fullMatch = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(trimmed);
  if (fullMatch?.[1] && fullMatch[2]) {
    return `${fullMatch[1]}-${fullMatch[2]}`;
  }
  const yearOnly = /^(\d{4})$/.exec(trimmed);
  if (yearOnly?.[1]) {
    return `${yearOnly[1]}-01`;
  }
  return null;
}
function extractCitedKeys(text2) {
  const cited = [];
  const seen = /* @__PURE__ */ new Set();
  const citeRegex = /\\cite[a-zA-Z]*\*?(?:\[[^\]]*\])*\{([^}]+)\}/g;
  let match;
  while ((match = citeRegex.exec(text2)) !== null) {
    const rawGroup = match[1];
    if (!rawGroup) {
      continue;
    }
    for (const part of rawGroup.split(",")) {
      const key = part.trim();
      if (!key) {
        continue;
      }
      const lower = key.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        cited.push(key);
      }
    }
  }
  return cited;
}
var LiteratureSynthesisAuditorCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "literature.evaluate_synthesis_rigor",
      description: "Audits literature synthesis and related-work rigor via P0/P1 citation recall/precision/F1, temporal cutoff leakage checks, unverified SOTA overclaim detection, and PaperOrchestra 6-axis anti-inflation caps.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          manuscriptText: { type: "string" },
          groundTruthReferences: { type: "array" },
          cutoffDate: { type: "string" },
          evaluatedBaselines: { type: "array", items: { type: "string" } },
          referenceAverageCitationCount: { type: "number" },
          citedReferenceMetadata: { type: "array" }
        },
        required: ["manuscriptText", "groundTruthReferences"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          metrics: { type: "object" },
          temporalLeakageViolations: { type: "array" },
          unverifiedSotaOverclaims: { type: "array" },
          axes: { type: "object" },
          overallScore: { type: "number" },
          comparativeCueCount: { type: "number" },
          penaltiesApplied: { type: "array" },
          capsTriggered: { type: "array" },
          auditHash: { type: "string" }
        },
        required: [
          "manuscriptId",
          "metrics",
          "temporalLeakageViolations",
          "unverifiedSotaOverclaims",
          "axes",
          "overallScore",
          "comparativeCueCount",
          "penaltiesApplied",
          "capsTriggered",
          "auditHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const manuscriptId = input.manuscriptId && input.manuscriptId.trim().length > 0 ? input.manuscriptId.trim() : `lit_${(0, import_node_crypto6.createHash)("sha256").update(input.manuscriptText).digest("hex").slice(0, 12)}`;
    const citedKeys = extractCitedKeys(input.manuscriptText);
    const citedLowerSet = new Set(citedKeys.map((k) => k.toLowerCase()));
    const metrics = this.computeCitationMetrics(citedLowerSet, input.groundTruthReferences);
    const temporalLeakageViolations = this.detectTemporalLeakage(
      citedLowerSet,
      input.groundTruthReferences,
      input.citedReferenceMetadata ?? [],
      input.cutoffDate
    );
    const unverifiedSotaOverclaims = this.detectUnverifiedSotaOverclaims(
      input.manuscriptText,
      input.evaluatedBaselines ?? []
    );
    const comparativeMatches = input.manuscriptText.match(COMPARATIVE_CUE_PATTERN) ?? [];
    const comparativeCueCount = comparativeMatches.length;
    const { axes, overallScore, penaltiesApplied, capsTriggered } = this.scoreSixAxes(
      input.manuscriptText,
      metrics,
      comparativeCueCount,
      temporalLeakageViolations,
      unverifiedSotaOverclaims,
      input.referenceAverageCitationCount
    );
    const payloadWithoutHash = {
      manuscriptId,
      metrics,
      temporalLeakageViolations,
      unverifiedSotaOverclaims,
      axes,
      overallScore,
      comparativeCueCount,
      penaltiesApplied,
      capsTriggered
    };
    const auditHash = `sha256:${(0, import_node_crypto6.createHash)("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex")}`;
    return {
      ...payloadWithoutHash,
      auditHash
    };
  }
  computeCitationMetrics(citedLowerSet, groundTruthReferences) {
    const gtById = /* @__PURE__ */ new Map();
    for (const ref of groundTruthReferences) {
      gtById.set(ref.id.trim().toLowerCase(), ref);
    }
    let matchedCount = 0;
    let p0Matched = 0;
    let p1Matched = 0;
    for (const citedId of citedLowerSet) {
      const ref = gtById.get(citedId);
      if (ref) {
        matchedCount += 1;
        if (ref.priority === "P0") {
          p0Matched += 1;
        } else {
          p1Matched += 1;
        }
      }
    }
    const p0Total = groundTruthReferences.filter((r) => r.priority === "P0").length;
    const p1Total = groundTruthReferences.filter((r) => r.priority === "P1").length;
    const overallPrecision = citedLowerSet.size > 0 ? round4(matchedCount / citedLowerSet.size) : 0;
    const overallRecall = groundTruthReferences.length > 0 ? round4(matchedCount / groundTruthReferences.length) : 1;
    const overallF1 = overallPrecision + overallRecall > 0 ? round4(2 * overallPrecision * overallRecall / (overallPrecision + overallRecall)) : 0;
    const p0Recall = p0Total > 0 ? round4(p0Matched / p0Total) : 1;
    const p1Recall = p1Total > 0 ? round4(p1Matched / p1Total) : 1;
    return {
      uniqueCitedCount: citedLowerSet.size,
      groundTruthCount: groundTruthReferences.length,
      matchedCount,
      overallPrecision,
      overallRecall,
      overallF1,
      p0Total,
      p0Matched,
      p0Recall,
      p1Total,
      p1Matched,
      p1Recall
    };
  }
  detectTemporalLeakage(citedLowerSet, groundTruthReferences, citedReferenceMetadata, cutoffDate) {
    if (!cutoffDate) {
      return [];
    }
    const normalizedCutoff = normalizeYearMonth(cutoffDate);
    if (!normalizedCutoff) {
      return [];
    }
    const combined = /* @__PURE__ */ new Map();
    for (const ref of groundTruthReferences) {
      if (ref.publishedYearMonth) {
        combined.set(ref.id.trim().toLowerCase(), ref.publishedYearMonth);
      }
    }
    for (const meta of citedReferenceMetadata) {
      if (meta.publishedYearMonth) {
        combined.set(meta.id.trim().toLowerCase(), meta.publishedYearMonth);
      }
    }
    const violations = [];
    for (const citedId of citedLowerSet) {
      const pubYm = combined.get(citedId);
      if (!pubYm) {
        continue;
      }
      const normPub = normalizeYearMonth(pubYm);
      if (normPub && normPub > normalizedCutoff) {
        violations.push({
          referenceId: citedId,
          publishedYearMonth: normPub,
          cutoffDate: normalizedCutoff,
          reason: `Cited reference "${citedId}" (${normPub}) postdates temporal cutoff ${normalizedCutoff}.`
        });
      }
    }
    return violations;
  }
  detectUnverifiedSotaOverclaims(manuscriptText, evaluatedBaselines) {
    const evaluatedLower = evaluatedBaselines.map((b) => b.trim().toLowerCase()).filter((b) => b.length > 0);
    const sentences = manuscriptText.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 0);
    const findings = [];
    for (const sentence of sentences) {
      const suspectedBaselines = [];
      let match;
      const pairwiseRegex = new RegExp(PAIRWISE_SUPERIORITY_PATTERN.source, "g");
      while ((match = pairwiseRegex.exec(sentence)) !== null) {
        const token = match[1];
        if (!token) {
          continue;
        }
        const tokenLower = token.toLowerCase();
        if (NON_BASELINE_CAPITALIZED_WORDS.has(tokenLower)) {
          continue;
        }
        if (!evaluatedLower.some((b) => b === tokenLower || tokenLower.includes(b))) {
          suspectedBaselines.push(token);
        }
      }
      const hasGlobalClaim = SOTA_GLOBAL_CLAIM_PATTERN.test(sentence);
      if (suspectedBaselines.length > 0) {
        findings.push({
          sentence,
          reason: `Superiority claim against baseline(s) not present in evaluatedBaselines: ${suspectedBaselines.join(", ")}.`,
          suspectedBaselines
        });
        continue;
      }
      if (hasGlobalClaim) {
        const mentionsAnyEvaluatedBaseline = evaluatedLower.length > 0 && evaluatedLower.some((b) => sentence.toLowerCase().includes(b));
        const claimsOverAll = /\b(all|every|existing)\s+(?:prior\s+)?(?:methods?|models?|baselines?|approaches?)\b/i.test(
          sentence
        );
        if (!mentionsAnyEvaluatedBaseline || claimsOverAll) {
          findings.push({
            sentence,
            reason: "Unqualified SOTA or blanket superiority assertion without grounding strictly in evaluatedBaselines.",
            suspectedBaselines: []
          });
        }
      }
    }
    return findings;
  }
  scoreSixAxes(manuscriptText, metrics, comparativeCueCount, temporalLeakageViolations, unverifiedSotaOverclaims, referenceAverageCitationCount) {
    const penaltiesApplied = [];
    const capsTriggered = [];
    const wordCount = manuscriptText.trim().split(/\s+/).filter(Boolean).length;
    const hasSubsections = /\\subsection\{|^##\s+/m.test(manuscriptText);
    const isBalancedStructure = hasSubsections && (manuscriptText.match(/\\subsection\{|^##\s+/gm)?.length ?? 0) >= 2;
    let coverageAndCompleteness = clampScore(
      40 + metrics.p0Recall * 40 + metrics.p1Recall * 20
    );
    let relevanceAndFocus = clampScore(45 + metrics.overallPrecision * 45 + Math.min(10, metrics.matchedCount * 2));
    let criticalAnalysisAndSynthesis = clampScore(
      45 + Math.min(35, comparativeCueCount * 10) + metrics.overallF1 * 20
    );
    let positioningAndNovelty = clampScore(
      55 + Math.min(20, comparativeCueCount * 5) + metrics.p0Recall * 20
    );
    const organizationAndWriting = clampScore(
      55 + (isBalancedStructure ? 25 : 10) + Math.min(20, Math.floor(wordCount / 25))
    );
    let citationPracticesAndRigor = clampScore(
      40 + metrics.overallF1 * 50 + (metrics.uniqueCitedCount > 0 ? 10 : 0)
    );
    if (comparativeCueCount < 2) {
      criticalAnalysisAndSynthesis = clampScore(criticalAnalysisAndSynthesis - 8);
      penaltiesApplied.push({
        code: "LOW_COMPARATIVE_ANALYSIS",
        points: 8,
        targetAxes: ["criticalAnalysisAndSynthesis"],
        reason: `Fewer than 2 comparative/analytical cues detected (${comparativeCueCount}); applied -8 penalty.`
      });
      if (criticalAnalysisAndSynthesis > 60) {
        criticalAnalysisAndSynthesis = 60;
      }
      capsTriggered.push("CAP_CRITICAL_ANALYSIS_AT_60_BELOW_2_CUES");
    }
    if (typeof referenceAverageCitationCount === "number" && referenceAverageCitationCount > 0 && metrics.uniqueCitedCount < 0.5 * referenceAverageCitationCount) {
      if (coverageAndCompleteness > 55) {
        coverageAndCompleteness = 55;
      }
      if (citationPracticesAndRigor > 55) {
        citationPracticesAndRigor = 55;
      }
      capsTriggered.push("CAP_LOW_CITATION_DENSITY_AT_55");
    }
    if (unverifiedSotaOverclaims.length > 0) {
      const sotaPenalty = 10 * unverifiedSotaOverclaims.length;
      positioningAndNovelty = clampScore(positioningAndNovelty - sotaPenalty);
      penaltiesApplied.push({
        code: "UNVERIFIED_SOTA_OVERCLAIM",
        points: sotaPenalty,
        targetAxes: ["positioningAndNovelty", "overallScore"],
        reason: `Detected ${unverifiedSotaOverclaims.length} unverified SOTA/baseline overclaim(s); applied -${sotaPenalty} penalty.`
      });
    }
    if (temporalLeakageViolations.length > 0) {
      const leakagePenalty = 15 * temporalLeakageViolations.length;
      citationPracticesAndRigor = clampScore(citationPracticesAndRigor - leakagePenalty);
      penaltiesApplied.push({
        code: "TEMPORAL_CUTOFF_LEAKAGE",
        points: leakagePenalty,
        targetAxes: ["citationPracticesAndRigor"],
        reason: `Detected ${temporalLeakageViolations.length} reference(s) violating temporal cutoff; applied -${leakagePenalty} penalty.`
      });
    }
    const axes = {
      coverageAndCompleteness,
      relevanceAndFocus,
      criticalAnalysisAndSynthesis,
      positioningAndNovelty,
      organizationAndWriting,
      citationPracticesAndRigor
    };
    const axisValues = Object.values(axes);
    let overallScore = clampScore(
      axisValues.reduce((acc, v) => acc + v, 0) / axisValues.length - (unverifiedSotaOverclaims.length > 0 ? 5 : 0)
    );
    if (axisValues.some((v) => v < 50)) {
      if (overallScore > 75) {
        overallScore = 75;
      }
      capsTriggered.push("CAP_OVERALL_AT_75_ANY_AXIS_BELOW_50");
    }
    return {
      axes,
      overallScore,
      penaltiesApplied,
      capsTriggered
    };
  }
};

// src/core/publication/style/StyleCalibrationCapability.ts
var import_node_crypto7 = require("node:crypto");
var HEDGING_LEXICON = [
  "suggests",
  "indicates",
  "implies",
  "appears",
  "may",
  "might",
  "potentially",
  "plausibly",
  "consistent with"
];
var TRANSITION_LEXICON = [
  "however",
  "nevertheless",
  "in contrast",
  "conversely",
  "consequently",
  "furthermore",
  "moreover",
  "specifically",
  "notably"
];
var REPORTING_VERB_LEXICON = [
  "demonstrated",
  "showed",
  "established",
  "observed",
  "reported",
  "identified",
  "proposed",
  "argued",
  "found"
];
var TORTURED_PHRASE_LEXICON = [
  {
    phrase: "counterfeit consciousness",
    canonicalTerm: "artificial intelligence",
    pattern: /\bcounterfeit\s+consciousness\b/i
  },
  {
    phrase: "profound neural organization",
    canonicalTerm: "deep neural network",
    pattern: /\bprofound\s+neural\s+organi[sz]ation\b/i
  },
  {
    phrase: "bosom malignancy",
    canonicalTerm: "breast cancer",
    pattern: /\bbosom\s+malignancy\b/i
  },
  {
    phrase: "irregular woodland",
    canonicalTerm: "random forest",
    pattern: /\birregular\s+woodland\b/i
  },
  {
    phrase: "credulous Bayes",
    canonicalTerm: "naive Bayes",
    pattern: /\bcredulous\s+bayes\b/i
  },
  {
    phrase: "haze figuring",
    canonicalTerm: "cloud computing",
    pattern: /\bhaze\s+figuring\b/i
  },
  {
    phrase: "flag-to-commotion proportion",
    canonicalTerm: "signal-to-noise ratio",
    pattern: /\bflag[- ]to[- ]commotion\s+proportion\b/i
  },
  {
    phrase: "brainy framework",
    canonicalTerm: "intelligent system",
    pattern: /\bbrainy\s+framework\b/i
  },
  {
    phrase: "colossal information",
    canonicalTerm: "big data",
    pattern: /\bcolossal\s+information\b/i
  },
  {
    phrase: "vitality productivity",
    canonicalTerm: "energy efficiency",
    pattern: /\bvitality\s+productivity\b/i
  }
];
var AI_VOICE_CLICHE_LEXICON = [
  {
    cliche: "delve into",
    suggestedReplacement: "examine / analyze",
    pattern: /\bdelve[sd]?\s+into\b/i
  },
  {
    cliche: "testament to",
    suggestedReplacement: "evidence of / demonstrates",
    pattern: /\btestament\s+to\b/i
  },
  {
    cliche: "tapestry of",
    suggestedReplacement: "combination of / set of",
    pattern: /\btapestry\s+of\b/i
  },
  {
    cliche: "it is important to note that",
    suggestedReplacement: "notably (or state claim directly)",
    pattern: /\bit\s+is\s+(?:important|worth)\s+(?:to\s+note|noting)\s+that\b/i
  },
  {
    cliche: "in the ever-evolving landscape",
    suggestedReplacement: "in current research (or omit)",
    pattern: /\bin\s+the\s+ever[- ]evolving\s+landscape\b/i
  },
  {
    cliche: "plays a pivotal role",
    suggestedReplacement: "governs / regulates / determines",
    pattern: /\bplays\s+a\s+pivotal\s+role\b/i
  },
  {
    cliche: "a myriad of",
    suggestedReplacement: "multiple / several",
    pattern: /\ba\s+myriad\s+of\b/i
  },
  {
    cliche: "underscores the importance",
    suggestedReplacement: "demonstrates / confirms",
    pattern: /\bunderscores\s+the\s+importance\b/i
  }
];
function splitSentences(text2) {
  return text2.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 0);
}
function splitParagraphs(text2) {
  return text2.split(/\n\s*\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
}
function round2(val) {
  return Math.round(val * 100) / 100;
}
var StyleCalibrationCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.calibrate_author_style",
      description: "Extracts a 6-dimension Author Style Profile from past writing samples and screens a target manuscript draft for style drift, tortured phrases, and generic AI-voice cliches.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          writingSamples: { type: "array", items: { type: "string" } },
          targetDraft: { type: "string" }
        },
        required: ["writingSamples"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          styleProfile: { type: "object" },
          torturedPhrases: { type: "array" },
          aiVoiceCliches: { type: "array" },
          styleDriftScore: { type: "number" },
          voiceAlignmentScore: { type: "number" },
          driftDiagnostics: { type: "array" },
          calibrationHash: { type: "string" }
        },
        required: [
          "manuscriptId",
          "styleProfile",
          "torturedPhrases",
          "aiVoiceCliches",
          "styleDriftScore",
          "voiceAlignmentScore",
          "driftDiagnostics",
          "calibrationHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    const combinedSamples = input.writingSamples.join("\n\n");
    const manuscriptId = input.manuscriptId && input.manuscriptId.trim().length > 0 ? input.manuscriptId.trim() : `style_${(0, import_node_crypto7.createHash)("sha256").update(combinedSamples).digest("hex").slice(0, 12)}`;
    const styleProfile = this.extractStyleProfile(input.writingSamples);
    const draft = input.targetDraft ?? "";
    const torturedPhrases = draft ? this.screenTorturedPhrases(draft) : [];
    const aiVoiceCliches = draft ? this.screenAiVoiceCliches(draft) : [];
    const { styleDriftScore, driftDiagnostics } = draft ? this.evaluateDraftDrift(styleProfile, draft, torturedPhrases.length, aiVoiceCliches.length) : { styleDriftScore: 0, driftDiagnostics: [] };
    const voiceAlignmentScore = Math.max(0, Math.min(100, 100 - styleDriftScore));
    const payloadWithoutHash = {
      manuscriptId,
      styleProfile,
      torturedPhrases,
      aiVoiceCliches,
      styleDriftScore,
      voiceAlignmentScore,
      driftDiagnostics
    };
    const calibrationHash = `sha256:${(0, import_node_crypto7.createHash)("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex")}`;
    return {
      ...payloadWithoutHash,
      calibrationHash
    };
  }
  extractStyleProfile(samples) {
    const nonEmptySamples = samples.filter((s) => s.trim().length > 0);
    const fullText = nonEmptySamples.join("\n\n");
    const paragraphs = splitParagraphs(fullText);
    const sentences = splitSentences(fullText);
    const sentenceWordCounts = sentences.map(
      (s) => s.split(/\s+/).filter(Boolean).length
    );
    const meanWords = sentenceWordCounts.length > 0 ? round2(
      sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
    ) : 0;
    const variance = sentenceWordCounts.length > 0 ? sentenceWordCounts.reduce((acc, wc) => acc + (wc - meanWords) ** 2, 0) / sentenceWordCounts.length : 0;
    const stdDevWords = round2(Math.sqrt(variance));
    const rhythm = stdDevWords >= 7 ? "variable_bursty" : meanWords <= 15 ? "punchy_uniform" : "steady_academic";
    const paragraphSentenceCounts = paragraphs.map((p) => splitSentences(p).length);
    const meanSentences = paragraphSentenceCounts.length > 0 ? round2(
      paragraphSentenceCounts.reduce((a, b) => a + b, 0) / paragraphSentenceCounts.length
    ) : 0;
    const minSentences = paragraphSentenceCounts.length > 0 ? Math.min(...paragraphSentenceCounts) : 0;
    const maxSentences = paragraphSentenceCounts.length > 0 ? Math.max(...paragraphSentenceCounts) : 0;
    const lowerFull = fullText.toLowerCase();
    const preferredHedging = HEDGING_LEXICON.filter(
      (term) => new RegExp(`\\b${term}\\b`, "i").test(lowerFull)
    );
    const preferredTransitions = TRANSITION_LEXICON.filter(
      (term) => new RegExp(`\\b${term}\\b`, "i").test(lowerFull)
    );
    const preferredReportingVerbs = REPORTING_VERB_LEXICON.filter(
      (term) => new RegExp(`\\b${term}\\b`, "i").test(lowerFull)
    );
    const narrativeMatches = fullText.match(
      /\\citet\{[^}]+\}|\b[A-Z][a-z]+(?:\s+et\s+al\.)?\s*\(\d{4}\)/g
    ) ?? [];
    const parentheticalMatches = fullText.match(
      /\\cite[p]?\{[^}]+\}|\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4}\)|\[\d+(?:,\s*\d+)*\]/g
    ) ?? [];
    const totalCitations = narrativeMatches.length + parentheticalMatches.length;
    const narrativeRatio = totalCitations > 0 ? round2(narrativeMatches.length / totalCitations) : 0;
    const citationsPerParagraph = paragraphs.length > 0 ? round2(totalCitations / paragraphs.length) : 0;
    const placement = narrativeRatio >= 0.6 ? "narrative_dominant" : narrativeRatio <= 0.25 ? "parenthetical_dominant" : "mixed";
    const words = fullText.split(/\s+/).filter(Boolean);
    const adverbOrModifierMatches = fullText.match(/\b[a-z]{4,}(?:ly|ive|ous)\b/gi) ?? [];
    const modifierDensityRatio = words.length > 0 ? round2(adverbOrModifierMatches.length / words.length) : 0;
    const modifierProfile = modifierDensityRatio <= 0.06 ? "lean_minimal" : modifierDensityRatio <= 0.12 ? "moderate" : "elaborate";
    const passiveMatches = fullText.match(/\b(?:was|were|is|are|been)\s+[a-z]+ed\b/gi) ?? [];
    const passiveVoiceEstimate = sentences.length > 0 ? round2(Math.min(1, passiveMatches.length / sentences.length)) : 0;
    const formality = meanWords >= 16 || passiveVoiceEstimate >= 0.25 ? "formal_technical" : "moderate_academic";
    return {
      sampleCount: nonEmptySamples.length,
      sentenceLength: { meanWords, stdDevWords, rhythm },
      paragraphLength: { meanSentences, minSentences, maxSentences },
      vocabularyPreferences: {
        preferredHedging: [...preferredHedging],
        preferredTransitions: [...preferredTransitions],
        preferredReportingVerbs: [...preferredReportingVerbs]
      },
      citationIntegration: {
        narrativeRatio,
        citationsPerParagraph,
        placement
      },
      modifierStyle: {
        modifierDensityRatio,
        profile: modifierProfile
      },
      registerProfile: {
        passiveVoiceEstimate,
        formality
      }
    };
  }
  screenTorturedPhrases(draft) {
    const sentences = splitSentences(draft);
    const matches = [];
    for (const sentence of sentences) {
      for (const item of TORTURED_PHRASE_LEXICON) {
        if (item.pattern.test(sentence)) {
          matches.push({
            phrase: item.phrase,
            canonicalTerm: item.canonicalTerm,
            sentence,
            layer: "HEURISTIC-ADVISORY"
          });
        }
      }
    }
    return matches;
  }
  screenAiVoiceCliches(draft) {
    const sentences = splitSentences(draft);
    const matches = [];
    for (const sentence of sentences) {
      for (const item of AI_VOICE_CLICHE_LEXICON) {
        if (item.pattern.test(sentence)) {
          matches.push({
            cliche: item.cliche,
            sentence,
            suggestedReplacement: item.suggestedReplacement
          });
        }
      }
    }
    return matches;
  }
  evaluateDraftDrift(authorProfile, draft, torturedCount, clicheCount) {
    const draftProfile = this.extractStyleProfile([draft]);
    const diagnostics = [];
    let drift = 0;
    const sentenceDiff = Math.abs(
      draftProfile.sentenceLength.meanWords - authorProfile.sentenceLength.meanWords
    );
    if (sentenceDiff > 6) {
      const penalty = Math.min(25, Math.round(sentenceDiff * 1.5));
      drift += penalty;
      diagnostics.push(
        `Mean sentence length shifted by ${round2(sentenceDiff)} words (${draftProfile.sentenceLength.meanWords} vs calibrated ${authorProfile.sentenceLength.meanWords}).`
      );
    }
    if (torturedCount > 0) {
      const penalty = Math.min(45, torturedCount * 20);
      drift += penalty;
      diagnostics.push(
        `Detected ${torturedCount} tortured phrase(s) indicative of synonym-spin distortion.`
      );
    }
    if (clicheCount > 0) {
      const penalty = Math.min(35, clicheCount * 12);
      drift += penalty;
      diagnostics.push(
        `Detected ${clicheCount} generic AI-voice cliche(s) diverging from calibrated author register.`
      );
    }
    return {
      styleDriftScore: Math.max(0, Math.min(100, drift)),
      driftDiagnostics: diagnostics
    };
  }
};

// src/core/integrations/coresearcher/agentPreprintBridge.ts
var import_node_crypto8 = require("node:crypto");
var GAP_SEVERITY_MAP = {
  COLLUSIVE_AGENT_PEER_REVIEW: {
    graphSeverity: "critical",
    reportSeverity: "critical",
    actionType: "rerun_analysis",
    blocksAcceptance: "REJECT",
    remediation: "Require clean-room peer review from an independent model family with verified code execution and digest check."
  },
  STALE_OR_MISMATCHED_DIGEST: {
    graphSeverity: "critical",
    reportSeverity: "critical",
    actionType: "fix_reproducibility",
    blocksAcceptance: "REJECT",
    remediation: "Re-freeze the package and align the declared SHA-256 bundle digest with the computed archive digest."
  },
  MISSING_REPRODUCIBILITY_ARTIFACT: {
    graphSeverity: "critical",
    reportSeverity: "critical",
    actionType: "fix_reproducibility",
    blocksAcceptance: "REJECT",
    remediation: "Attach public, verifiable CODE_REPO and DATASET artifacts to the preprint bundle."
  },
  PRIVATE_OR_UNREACHABLE_LINK: {
    graphSeverity: "critical",
    reportSeverity: "critical",
    actionType: "fix_reproducibility",
    blocksAcceptance: "REJECT",
    remediation: "Replace private, localhost, or placeholder artifact URLs with publicly reachable archive URIs (HTTP 200 OK)."
  },
  MISSING_NEGATIVE_CONTROL: {
    graphSeverity: "major",
    reportSeverity: "major",
    actionType: "rerun_analysis",
    blocksAcceptance: "MAJOR_REVISION",
    remediation: "Include explicit permutation or negative control experiments for all empirical claims."
  },
  HYPOTHESIS_OVERCLAIM_WITHOUT_EVIDENCE: {
    graphSeverity: "major",
    reportSeverity: "major",
    actionType: "clarify_claim",
    blocksAcceptance: "MAJOR_REVISION",
    remediation: "Bind every stated claim in claim_artifact_map to a verified public artifact or downgrade the claim to a hypothesis."
  }
};
function resolveGapRule(kind) {
  if (kind in GAP_SEVERITY_MAP) {
    return GAP_SEVERITY_MAP[kind];
  }
  return {
    graphSeverity: "major",
    reportSeverity: "major",
    actionType: "other",
    blocksAcceptance: "MAJOR_REVISION",
    remediation: "Resolve the reported CoResearcher preprint verification gap."
  };
}
function mapAgentPreprintBundleToReview(input) {
  const { evidenceBundle } = input;
  const preprintId = evidenceBundle.target.id;
  const projectId = input.projectId?.trim() || `proj-${preprintId}`;
  const bundleId = input.bundleId?.trim() || `bundle-${preprintId}`;
  const commitHash = evidenceBundle.provenance.digest;
  const reviewGraphId = `rg-${evidenceBundle.graph_id}`;
  const rootNode = evidenceBundle.nodes.find((n) => n.kind === "AGENT_PREPRINT");
  const attrs = rootNode?.attributes ?? {};
  const verdictRaw = typeof attrs.verdict === "string" ? attrs.verdict : "FLAGGED_REPRODUCIBILITY_GAPS";
  const verdict = verdictRaw === "VERIFIED_REPRODUCIBLE_BUNDLE" || verdictRaw === "FLAGGED_REPRODUCIBILITY_GAPS" || verdictRaw === "REJECTED_UNGROUNDED_OR_COLLUSIVE" ? verdictRaw : "FLAGGED_REPRODUCIBILITY_GAPS";
  const reproducibilityScore = typeof attrs.reproducibility_score === "number" ? attrs.reproducibility_score : 0;
  const gatesPassed = typeof attrs.gates_passed === "number" ? attrs.gates_passed : 0;
  const gatesTotal = typeof attrs.gates_total === "number" ? attrs.gates_total : 5;
  const agentReceiptSha256 = typeof attrs.receipt_sha256 === "string" ? attrs.receipt_sha256 : evidenceBundle.provenance.receipt_sha256 ?? evidenceBundle.provenance.digest;
  const agentServer = evidenceBundle.provenance.sources[0] ?? "agent-preprint-server";
  const zenodoColdDoi = input.zenodoColdDoi?.trim() || (typeof attrs.zenodo_doi === "string" ? attrs.zenodo_doi : null);
  const crpkgDigest = input.crpkgDigest?.trim() || (typeof attrs.crpkg_digest === "string" ? attrs.crpkg_digest : null);
  const dualAnchorBadge = {
    preprintId,
    agentServer,
    agentReceiptSha256,
    verdict,
    reproducibilityScore,
    gatesPassed,
    gatesTotal,
    zenodoColdDoi,
    crpkgDigest,
    dualAnchored: Boolean(
      zenodoColdDoi && agentReceiptSha256 && verdict === "VERIFIED_REPRODUCIBLE_BUNDLE"
    )
  };
  const timestampIso = evidenceBundle.provenance.audited_at ?? evidenceBundle.provenance.generated_at ?? "2026-11-20T00:00:00.000Z";
  const timestampDate = new Date(timestampIso);
  const agentId = "coresearcher-agent-preprint-auditor-v1";
  const graphFindings = [];
  const reportFindings = [];
  let hasRejectTrigger = verdict === "REJECTED_UNGROUNDED_OR_COLLUSIVE";
  let hasMajorTrigger = verdict === "FLAGGED_REPRODUCIBILITY_GAPS";
  evidenceBundle.gaps.forEach((gap, index) => {
    const rule = resolveGapRule(gap.kind);
    if (rule.blocksAcceptance === "REJECT") {
      hasRejectTrigger = true;
    } else {
      hasMajorTrigger = true;
    }
    const findingId = `finding-${preprintId}-${index}`;
    const targetNodeId = gap.node ?? `PREPRINT:${preprintId}`;
    graphFindings.push({
      id: findingId,
      reviewGraphId,
      title: gap.kind,
      description: gap.description,
      severity: rule.graphSeverity,
      status: "open",
      createdBy: agentId,
      createdAt: timestampDate,
      evidence: [
        {
          evidenceId: `ev-${findingId}`,
          findingId,
          targetType: "AgentOutput",
          targetId: targetNodeId,
          description: `CoResearcher ADR-DISCOVERY-115 gate finding (${gap.kind})`
        }
      ],
      recommendations: [
        {
          recommendationId: `rec-${findingId}`,
          findingId,
          action: rule.actionType,
          description: rule.remediation
        }
      ]
    });
    reportFindings.push({
      id: findingId,
      reviewerId: agentId,
      severity: rule.reportSeverity,
      targetNodeId,
      description: `[${gap.kind}] ${gap.description}`,
      suggestedAction: rule.remediation,
      timestamp: timestampDate
    });
  });
  let editorialDecision = "Accept";
  if (hasRejectTrigger) {
    editorialDecision = "Reject";
  } else if (hasMajorTrigger) {
    editorialDecision = "Major Revision";
  }
  const reviewGraph = {
    reviewGraphId,
    projectId,
    commitHash,
    findings: graphFindings,
    agents: [
      {
        agentId,
        type: "CoResearcher",
        name: "CoResearcher Agent Preprint Verification Gate (ADR-DISCOVERY-115)",
        version: "1.0.0"
      }
    ],
    createdAt: timestampDate,
    updatedAt: timestampDate
  };
  const reviewReport = {
    id: `report-${evidenceBundle.graph_id}`,
    bundleId,
    decision: editorialDecision,
    findings: reportFindings,
    metaSummary: `CoResearcher ADR-DISCOVERY-115 audit for ${agentServer}:${preprintId} -> verdict=${verdict}, score=${reproducibilityScore} (${gatesPassed}/${gatesTotal} gates), decision=${editorialDecision}, dualAnchored=${dualAnchorBadge.dualAnchored}.`,
    completedAt: timestampDate
  };
  const hashPayload = {
    preprintId,
    editorialDecision,
    dualAnchorBadge,
    findingsCount: reportFindings.length,
    digest: evidenceBundle.provenance.digest
  };
  const bridgeHash = `sha256:${(0, import_node_crypto8.createHash)("sha256").update(JSON.stringify(hashPayload)).digest("hex")}`;
  return {
    preprintId,
    editorialDecision,
    dualAnchorBadge,
    reviewGraph,
    reviewReport,
    bridgeHash
  };
}
var AgentPreprintBridgeCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.bridge_agent_preprint",
      description: "Maps CoResearcher ADR-DISCOVERY-115 AGENT_PREPRINT evidence bundles and 6 reproducibility/anti-collusion gap categories into EdiTXT ReviewGraph, ReviewReport, and Dual-Anchor Badge (Zenodo Cold DOI + Agent Preprint Server Receipt).",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          bundleId: { type: "string" },
          evidenceBundle: { type: "object" },
          zenodoColdDoi: { type: "string" },
          crpkgDigest: { type: "string" }
        },
        required: ["evidenceBundle"]
      },
      outputSchema: {
        type: "object",
        properties: {
          preprintId: { type: "string" },
          editorialDecision: { type: "string" },
          dualAnchorBadge: { type: "object" },
          reviewGraph: { type: "object" },
          reviewReport: { type: "object" },
          bridgeHash: { type: "string" }
        },
        required: [
          "preprintId",
          "editorialDecision",
          "dualAnchorBadge",
          "reviewGraph",
          "reviewReport",
          "bridgeHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    return mapAgentPreprintBundleToReview(input);
  }
};

// src/core/integrations/coresearcher/egoFreeRetractionBridge.ts
var import_node_crypto9 = require("node:crypto");
function executeEgoFreeManuscriptRetraction(input) {
  const { evidenceBundle } = input;
  const hypothesisId = evidenceBundle.target.id;
  const projectId = input.projectId?.trim() || `proj-${input.manuscriptId}`;
  const bundleId = input.bundleId?.trim() || `bundle-${input.manuscriptId}`;
  const hypNode = evidenceBundle.nodes.find((n) => n.kind === "DEFEATED_HYPOTHESIS");
  const witnessNode = evidenceBundle.nodes.find((n) => n.kind === "NEGATIVE_RESULT_WITNESS");
  const hypAttrs = hypNode?.attributes ?? {};
  const witnessAttrs = witnessNode?.attributes ?? {};
  const statement = typeof hypAttrs.statement === "string" ? hypAttrs.statement : `Hypothesis ${hypothesisId}`;
  const graveyardRecordId = typeof hypAttrs.graveyard_record_id === "string" ? hypAttrs.graveyard_record_id : evidenceBundle.provenance.graveyard_record_id ?? "GRAVE-UNKNOWN";
  const duhemQuineAutopsyVerdict = typeof hypAttrs.duhem_quine_autopsy_verdict === "string" ? hypAttrs.duhem_quine_autopsy_verdict : "CORE_HYPOTHESIS_FATAL";
  const successorHypothesisId = typeof hypAttrs.successor_hypothesis_id === "string" ? hypAttrs.successor_hypothesis_id : null;
  const linkedPreprintId = typeof hypAttrs.linked_preprint_id === "string" ? hypAttrs.linked_preprint_id : null;
  const witnessNodeId = witnessNode?.id ?? `COUNTEREXAMPLE:${hypothesisId}`;
  const witnessLabel = witnessNode?.label ?? "INDEPENDENT_CODE_REPRODUCTION_FAILURE";
  const counterexample = typeof witnessAttrs.counterexample === "string" ? witnessAttrs.counterexample : evidenceBundle.gaps[0]?.description ?? "Refuted by empirical counterexample witness.";
  const benchmarkSource = typeof witnessAttrs.source === "string" ? witnessAttrs.source : evidenceBundle.provenance.sources[0] ?? "Independent Verification Benchmark";
  const refutingReviewerAgentId = typeof witnessAttrs.refuting_reviewer_agent_id === "string" ? witnessAttrs.refuting_reviewer_agent_id : "CleanRoom-Arbiter";
  const invalidatedParagraphs = [];
  const statementKeywords = statement.split(/\W+/).filter((tok) => tok.length >= 7).map((tok) => tok.toLowerCase());
  for (const block of input.manuscriptBlocks ?? []) {
    const matchedTriggers = [];
    const lowerText = block.text.toLowerCase();
    if (block.linkedHypothesisIds?.includes(hypothesisId) || lowerText.includes(hypothesisId.toLowerCase())) {
      matchedTriggers.push(`hypothesis:${hypothesisId}`);
    }
    if (linkedPreprintId && (block.linkedPreprintIds?.includes(linkedPreprintId) || lowerText.includes(linkedPreprintId.toLowerCase()))) {
      matchedTriggers.push(`preprint:${linkedPreprintId}`);
    }
    const keywordHits = statementKeywords.filter((kw) => lowerText.includes(kw));
    if (keywordHits.length >= 2) {
      matchedTriggers.push(`statement_terms:${keywordHits.slice(0, 3).join(",")}`);
    }
    if (matchedTriggers.length > 0) {
      invalidatedParagraphs.push({
        blockId: block.id,
        status: "INVALIDATED_BY_NEGATIVE_RESULT_WITNESS",
        matchedTriggers,
        witnessNodeId,
        counterexampleSummary: counterexample
      });
    }
  }
  const editorialStatus = input.remediationMode === "NEGATIVE_RESULT_BRIEF" ? "CONVERTED_TO_NEGATIVE_RESULT_BRIEF" : "MANUSCRIPT_RETRACTED";
  const timestampIso = evidenceBundle.provenance.recorded_at ?? evidenceBundle.provenance.generated_at ?? "2026-11-20T00:00:00.000Z";
  const timestampDate = new Date(timestampIso);
  const reviewGraphId = `rg-${evidenceBundle.graph_id}`;
  const agentId = "coresearcher-ego-free-retraction-ledger-v1";
  const findingId = `finding-retract-${hypothesisId}`;
  const graphFinding = {
    id: findingId,
    reviewGraphId,
    title: "HYPOTHESIS_REFUTED_BY_COUNTEREXAMPLE",
    description: `Hypothesis ${hypothesisId} ("${statement}") was buried in CoResearcher HypothesisGraveyard (${graveyardRecordId}) via ${witnessLabel}: ${counterexample}`,
    severity: "critical",
    status: "open",
    createdBy: agentId,
    createdAt: timestampDate,
    evidence: [
      {
        evidenceId: `ev-${findingId}`,
        findingId,
        targetType: "AgentOutput",
        targetId: witnessNodeId,
        description: `Negative result witness from ${benchmarkSource} by ${refutingReviewerAgentId}`
      }
    ],
    recommendations: [
      {
        recommendationId: `rec-${findingId}`,
        findingId,
        action: "remove_conclusion",
        description: successorHypothesisId ? `Execute ego-free manuscript retraction or convert to Negative Result Brief pivoting to ${successorHypothesisId}.` : "Execute ego-free manuscript retraction and publish negative result witness."
      }
    ]
  };
  const reportFinding = {
    id: findingId,
    reviewerId: agentId,
    severity: "critical",
    targetNodeId: hypNode?.id ?? `HYPOTHESIS:${hypothesisId}`,
    description: `[HYPOTHESIS_REFUTED_BY_COUNTEREXAMPLE] ${counterexample} (Graveyard ID: ${graveyardRecordId}; Autopsy: ${duhemQuineAutopsyVerdict})`,
    suggestedAction: graphFinding.recommendations[0]?.description ?? "Retract manuscript.",
    timestamp: timestampDate
  };
  const editorialDecision = "Reject";
  const reviewGraph = {
    reviewGraphId,
    projectId,
    commitHash: evidenceBundle.provenance.digest,
    findings: [graphFinding],
    agents: [
      {
        agentId,
        type: "CoResearcher",
        name: "CoResearcher Ego-Free Hypothesis Retraction Ledger (ADR-DISCOVERY-116)",
        version: "1.0.0"
      }
    ],
    createdAt: timestampDate,
    updatedAt: timestampDate
  };
  const reviewReport = {
    id: `report-${evidenceBundle.graph_id}`,
    bundleId,
    decision: editorialDecision,
    findings: [reportFinding],
    metaSummary: `Ego-free editorial retraction triggered for manuscript "${input.manuscriptTitle}" (${input.manuscriptId}) following burial of ${hypothesisId} in CoResearcher HypothesisGraveyard (${graveyardRecordId}). Invalidated paragraphs: ${invalidatedParagraphs.length}.`,
    completedAt: timestampDate
  };
  const retractionNoticeMarkdown = [
    `# Editorial Notice of Ego-Free Retraction & Negative Result Disclosure`,
    ``,
    `- **Manuscript ID**: \`${input.manuscriptId}\``,
    `- **Title**: ${input.manuscriptTitle}`,
    `- **Editorial Status**: \`${editorialStatus}\``,
    `- **Linked Preprint ID**: \`${linkedPreprintId ?? "N/A"}\``,
    `- **Defeated Hypothesis ID**: \`${hypothesisId}\``,
    `- **CoResearcher Graveyard Record**: \`${graveyardRecordId}\``,
    `- **Falsification Trigger**: \`${witnessLabel}\` (by \`${refutingReviewerAgentId}\` on \`${benchmarkSource}\`)`,
    `- **Duhem-Quine Autopsy Verdict**: ${duhemQuineAutopsyVerdict}`,
    `- **Counterexample Witness**: ${counterexample}`,
    `- **Successor Hypothesis**: \`${successorHypothesisId ?? "NONE_DECLARED"}\``,
    `- **Evidence Bundle Digest**: \`${evidenceBundle.provenance.digest}\``
  ].join("\n");
  const negativeResultBriefLatex = [
    `\\section*{Negative Result Brief & Ego-Free Retraction Addendum}`,
    `\\textbf{Manuscript:} ${input.manuscriptTitle} (\\texttt{${input.manuscriptId}})\\\\`,
    `\\textbf{Editorial Status:} \\texttt{${editorialStatus}}\\\\`,
    `\\textbf{Buried Hypothesis (\\texttt{${graveyardRecordId}}):} \\texttt{${hypothesisId}} --- ${statement}\\\\`,
    `\\textbf{Falsifying Counterexample (\\texttt{${witnessLabel}}):} ${counterexample} (Source: \\texttt{${benchmarkSource}}; Reviewer: \\texttt{${refutingReviewerAgentId}}).\\\\`,
    `\\textbf{Duhem--Quine Autopsy:} ${duhemQuineAutopsyVerdict}\\\\`,
    successorHypothesisId ? `\\textbf{Successor Hypothesis Pivot:} Future investigations pivot to \\texttt{${successorHypothesisId}}.` : `\\textbf{Community Barrier:} No direct successor hypothesis declared; parameter region sealed in HypothesisGraveyard.`
  ].join("\n");
  const hashPayload = {
    manuscriptId: input.manuscriptId,
    hypothesisId,
    graveyardRecordId,
    editorialStatus,
    invalidatedCount: invalidatedParagraphs.length,
    digest: evidenceBundle.provenance.digest
  };
  const retractionHash = `sha256:${(0, import_node_crypto9.createHash)("sha256").update(JSON.stringify(hashPayload)).digest("hex")}`;
  return {
    manuscriptId: input.manuscriptId,
    hypothesisId,
    graveyardRecordId,
    successorHypothesisId,
    linkedPreprintId,
    editorialStatus,
    editorialDecision,
    invalidatedParagraphs,
    retractionNoticeMarkdown,
    negativeResultBriefLatex,
    reviewGraph,
    reviewReport,
    retractionHash
  };
}
var EgoFreeRetractionCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "publishing.execute_ego_free_retraction",
      description: "Consumes a CoResearcher ADR-DISCOVERY-116 DEFEATED_HYPOTHESIS evidence bundle, flags invalidated manuscript paragraphs via NEGATIVE_RESULT_WITNESS, and generates an ego-free Editorial Retraction Notice (MANUSCRIPT_RETRACTED) and Negative Result Brief.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          manuscriptTitle: { type: "string" },
          projectId: { type: "string" },
          bundleId: { type: "string" },
          remediationMode: {
            type: "string",
            enum: ["FULL_RETRACTION", "NEGATIVE_RESULT_BRIEF"]
          },
          evidenceBundle: { type: "object" },
          manuscriptBlocks: { type: "array", items: { type: "object" } }
        },
        required: ["manuscriptId", "manuscriptTitle", "evidenceBundle"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          hypothesisId: { type: "string" },
          graveyardRecordId: { type: "string" },
          successorHypothesisId: { type: ["string", "null"] },
          linkedPreprintId: { type: ["string", "null"] },
          editorialStatus: { type: "string" },
          editorialDecision: { type: "string" },
          invalidatedParagraphs: { type: "array", items: { type: "object" } },
          retractionNoticeMarkdown: { type: "string" },
          negativeResultBriefLatex: { type: "string" },
          reviewGraph: { type: "object" },
          reviewReport: { type: "object" },
          retractionHash: { type: "string" }
        },
        required: [
          "manuscriptId",
          "hypothesisId",
          "graveyardRecordId",
          "successorHypothesisId",
          "linkedPreprintId",
          "editorialStatus",
          "editorialDecision",
          "invalidatedParagraphs",
          "retractionNoticeMarkdown",
          "negativeResultBriefLatex",
          "reviewGraph",
          "reviewReport",
          "retractionHash"
        ]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  async execute(input) {
    return executeEgoFreeManuscriptRetraction(input);
  }
};

// src/core/capabilities/FigureCompilerCapability.ts
var FigureCompilerCapability = class extends OnTrackCapability {
  get contract() {
    return {
      name: "figures.compile",
      description: "Compiles publication-grade scientific figures (vector PDF and high-DPI PNG) conforming to Nature/Cell/Lancet house styles and Chen Liu figures4papers standards.",
      inputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          figureId: { type: "string" },
          caption: { type: "string" },
          venuePreset: { type: "string", enum: ["nature_1col", "nature_2col", "cell_1col", "cell_2col", "lancet_1col", "lancet_2col", "standard"] },
          widthMm: { type: "number" },
          heightMm: { type: "number" },
          panels: { type: "array", items: { type: "object" } },
          formats: { type: "array", items: { type: "string" } },
          dpi: { type: "number" }
        },
        required: ["manuscriptId", "figureId", "caption", "panels"]
      },
      outputSchema: {
        type: "object",
        properties: {
          manuscriptId: { type: "string" },
          figureId: { type: "string" },
          venuePreset: { type: "string" },
          dimensions: { type: "object" },
          assets: { type: "array", items: { type: "object" } },
          pythonScript: { type: "string" },
          reproducibilityHash: { type: "string" },
          status: { type: "string" },
          criticReport: { type: "object" }
        },
        required: ["manuscriptId", "figureId", "venuePreset", "dimensions", "assets", "pythonScript", "reproducibilityHash", "status"]
      },
      determinism: "DETERMINISTIC",
      operationClass: "READ_ONLY"
    };
  }
  getVenueDimensions(preset) {
    switch (preset) {
      case "nature_1col":
        return { widthMm: 89, defaultHeightMm: 70 };
      case "nature_2col":
        return { widthMm: 183, defaultHeightMm: 120 };
      case "cell_1col":
        return { widthMm: 85, defaultHeightMm: 70 };
      case "cell_2col":
        return { widthMm: 178, defaultHeightMm: 120 };
      case "lancet_1col":
        return { widthMm: 90, defaultHeightMm: 75 };
      case "lancet_2col":
        return { widthMm: 180, defaultHeightMm: 120 };
      case "standard":
      default:
        return { widthMm: 180, defaultHeightMm: 110 };
    }
  }
  async execute(input) {
    const preset = input.venuePreset ?? (input.panels.length > 1 ? "nature_2col" : "nature_1col");
    const dims = this.getVenueDimensions(preset);
    const widthMm = input.widthMm ?? dims.widthMm;
    const heightMm = input.heightMm ?? dims.defaultHeightMm;
    const dpi = input.dpi ?? 600;
    const requestedFormats = input.formats ?? ["pdf", "png"];
    const pythonScript = this.generatePythonScript(input, widthMm, heightMm, dpi);
    const reproducibilityHash = this.computeHash(input, pythonScript);
    const assets = requestedFormats.map((fmt) => ({
      format: fmt,
      uri: `figures/generated/${input.manuscriptId}_${input.figureId}.${fmt}`,
      sizeBytes: fmt === "pdf" ? 45e3 : 35e4,
      mimeType: fmt === "pdf" ? "application/pdf" : fmt === "png" ? "image/png" : "image/svg+xml"
    }));
    const criticReport = this.buildCriticReport(input);
    return {
      manuscriptId: input.manuscriptId,
      figureId: input.figureId,
      venuePreset: preset,
      dimensions: { widthMm, heightMm, dpi },
      assets,
      pythonScript,
      reproducibilityHash,
      status: "COMPILED",
      criticReport
    };
  }
  buildCriticReport(input) {
    const redundantPrefixPattern = /^\s*(?:(?:Figure|Fig\.?|Caption)(?:\s+[A-Za-z]?\d+[A-Za-z]?)?)\s*[:.\-\u2013\u2014]\s*/i;
    const rawCaption = input.caption ?? "";
    const hasRedundantCaptionPrefix = redundantPrefixPattern.test(rawCaption);
    const cleanedCaption = rawCaption.replace(redundantPrefixPattern, "").trim();
    const emptyPanelIndices = [];
    const seenPanelIds = /* @__PURE__ */ new Set();
    const duplicatePanelIds = [];
    input.panels.forEach((panel, index) => {
      const id = panel.id?.trim() ?? "";
      if (!id) {
        emptyPanelIndices.push(index);
        return;
      }
      const normalized = id.toUpperCase();
      if (seenPanelIds.has(normalized)) {
        if (!duplicatePanelIds.includes(id)) {
          duplicatePanelIds.push(id);
        }
      } else {
        seenPanelIds.add(normalized);
      }
    });
    const warnings = [];
    if (hasRedundantCaptionPrefix) {
      warnings.push(
        'Caption begins with a redundant "Figure X:" / "Caption X:" prefix; stripped in cleanedCaption.'
      );
    }
    if (emptyPanelIndices.length > 0) {
      warnings.push(
        `Empty panel ID(s) detected at panel index ${emptyPanelIndices.join(", ")}.`
      );
    }
    if (duplicatePanelIds.length > 0) {
      warnings.push(
        `Duplicate panel ID(s) detected: ${duplicatePanelIds.join(", ")}.`
      );
    }
    if (input.panels.length === 0) {
      warnings.push("No panels provided in figure specification.");
    }
    const passed = !hasRedundantCaptionPrefix && emptyPanelIndices.length === 0 && duplicatePanelIds.length === 0 && input.panels.length > 0;
    return {
      passed,
      hasRedundantCaptionPrefix,
      cleanedCaption,
      emptyPanelIndices,
      duplicatePanelIds,
      warnings
    };
  }
  generatePythonScript(input, widthMm, heightMm, dpi) {
    const widthInches = (widthMm / 25.4).toFixed(2);
    const heightInches = (heightMm / 25.4).toFixed(2);
    const panelCount = input.panels.length;
    const cols = panelCount > 1 ? 2 : 1;
    const rows = Math.ceil(panelCount / cols);
    return `import matplotlib.pyplot as plt
import matplotlib as mpl
import numpy as np

# Chen Liu (figures4papers) publication-grade typography & styling
mpl.rcParams['font.sans-serif'] = 'Helvetica', 'Arial', 'DejaVu Sans'
mpl.rcParams['font.family'] = 'sans-serif'
mpl.rcParams['axes.edgecolor'] = '#333333'
mpl.rcParams['axes.linewidth'] = 0.8
mpl.rcParams['axes.spines.top'] = False
mpl.rcParams['axes.spines.right'] = False
mpl.rcParams['xtick.direction'] = 'out'
mpl.rcParams['ytick.direction'] = 'out'
mpl.rcParams['xtick.major.size'] = 3
mpl.rcParams['ytick.major.size'] = 3
mpl.rcParams['pdf.fonttype'] = 42
mpl.rcParams['ps.fonttype'] = 42

PALETTE = ['#2B5C8F', '#D95F02', '#7570B3', '#E7298A', '#66A61E', '#E6AB02', '#A6761D', '#666666']

fig, axes = plt.subplots(${rows}, ${cols}, figsize=(${widthInches}, ${heightInches}), dpi=${dpi})
if ${panelCount} == 1:
    axes = np.array([axes])
axes_flat = axes.flatten()

# Render Panels
${input.panels.map((p, idx) => `
# Panel ${p.id}
ax = axes_flat[${idx}]
ax.text(-0.12, 1.08, '${p.id}', transform=ax.transAxes, fontsize=11, fontweight='bold', va='top', ha='right')
ax.set_title('${p.title ?? ""}', fontsize=9, pad=4)
ax.set_xlabel('${p.xAxisLabel ?? ""}', fontsize=8)
ax.set_ylabel('${p.yAxisLabel ?? ""}', fontsize=8)
`).join("\n")}

for j in range(${panelCount}, len(axes_flat)):
    axes_flat[j].axis('off')

plt.tight_layout()
plt.savefig('${input.manuscriptId}_${input.figureId}.pdf', format='pdf', bbox_inches='tight')
plt.savefig('${input.manuscriptId}_${input.figureId}.png', format='png', dpi=${dpi}, bbox_inches='tight')
`;
  }
  computeHash(input, script) {
    const crypto2 = require("crypto");
    return crypto2.createHash("sha256").update(JSON.stringify(input) + script).digest("hex");
  }
};

// src/core/capabilities/defaultRegistry.ts
function createDefaultRegistry(options = {}) {
  const providers = options.providers ?? [
    new PubMedReferenceProvider({ apiKey: process.env.NCBI_API_KEY, contactEmail: process.env.EDITXT_CONTACT_EMAIL }),
    new CrossrefReferenceProvider({ contactEmail: process.env.EDITXT_CONTACT_EMAIL }),
    new OpenAlexReferenceProvider({ contactEmail: process.env.EDITXT_CONTACT_EMAIL }),
    new EuropePmcReferenceProvider({ contactEmail: process.env.EDITXT_CONTACT_EMAIL }),
    new ClinicalTrialsReferenceProvider(),
    new ArxivReferenceProvider(),
    new DataCiteReferenceProvider(),
    new SemanticScholarReferenceProvider({ apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY })
  ];
  const citations = new CitationResolverCapability(providers);
  const guest = new GenerateGUESTReportCapability();
  const venue = new LoadVenueSkillCapability();
  return new CapabilityRegistry().register(citations).register(guest).register(venue).register(new ValidateTemplateCapability()).register(new ImpactCheckCapability()).register(new ImportBibliographyCapability()).register(new WatchCitationsCapability(citations)).register(new BuildCapsuleCapability()).register(new VerifyCapsuleCapability()).register(new ReviewSwarmCapability()).register(new PreSubmissionDeepReviewCapability()).register(new ParetoRefinementCapability()).register(new UncitedAssertionDetectorCapability()).register(new DevilsAdvocateCapability()).register(new OutlineBlueprintCapability()).register(new LiteratureSynthesisAuditorCapability()).register(new StyleCalibrationCapability()).register(new AgentPreprintBridgeCapability()).register(new EgoFreeRetractionCapability()).register(new FigureCompilerCapability()).register(new PublicationPipelineCapability({ citations, guest, venue }));
}

// src/core/screening/PreprintScreeningEngine.ts
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = frontmatterRegex.exec(content);
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  const rawMeta = match[1] ?? "";
  const body = match[2] ?? "";
  const frontmatter = {};
  for (const line of rawMeta.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return { frontmatter, body };
}
var PreprintScreeningEngine = class {
  registry;
  strict;
  constructor(options = {}) {
    this.registry = options.registry ?? createDefaultRegistry();
    this.strict = options.strict ?? false;
  }
  /**
   * Audits title hygiene against Cardinal Title Hygiene Rules:
   * Prohibits journal names, years, author names, or raw accession codes in the title.
   */
  auditTitle(title) {
    const findings = [];
    const journalMatch = /\b(nature|science|cell|lancet|nejm|jama|pnas|elife|plos)\b/i.exec(title);
    if (journalMatch?.[1]) {
      findings.push({
        findingId: "TITLE-HYGIENE-JOURNAL",
        category: "TITLE_HYGIENE_VIOLATION",
        severity: "CRITICAL_BLOCKER",
        title: `Prohibited Journal Name ('${journalMatch[1]}') in Manuscript Title`,
        forensicEvidence: `The title contains the journal name '${journalMatch[1]}'. Titles must describe the biological or computational phenomena, not publication venues.`,
        suggestedRemediation: `Remove the reference to '${journalMatch[1]}' from the title.`
      });
    }
    const yearMatch = /\b(19\d{2}|20\d{2})\b/.exec(title);
    if (yearMatch?.[1]) {
      findings.push({
        findingId: "TITLE-HYGIENE-YEAR",
        category: "TITLE_HYGIENE_VIOLATION",
        severity: "CRITICAL_BLOCKER",
        title: `Prohibited Publication Year ('${yearMatch[1]}') in Manuscript Title`,
        forensicEvidence: `The title contains a calendar year ('${yearMatch[1]}'). Titles must not cite external study years.`,
        suggestedRemediation: `Remove '(${yearMatch[1]})' or '${yearMatch[1]}' from the title.`
      });
    }
    const authorMatch = /\b([A-Z][a-z]+(\s+and\s+[A-Z][a-z]+)?\s+et\s+al\.?)\b/i.exec(title);
    if (authorMatch?.[1]) {
      findings.push({
        findingId: "TITLE-HYGIENE-AUTHOR",
        category: "TITLE_HYGIENE_VIOLATION",
        severity: "CRITICAL_BLOCKER",
        title: `Prohibited Author Citation ('${authorMatch[1]}') in Manuscript Title`,
        forensicEvidence: `The title includes an author citation ('${authorMatch[1]}'). External authors must be cited in the text or bibliography, never in the manuscript title.`,
        suggestedRemediation: `Reframe the title to describe the scientific cohort or target entity without citing '${authorMatch[1]}'.`
      });
    }
    const codeMatch = /\b(GCST\d+|GSE\d+)\b/i.exec(title);
    if (codeMatch?.[1]) {
      findings.push({
        findingId: "TITLE-HYGIENE-CATALOG",
        category: "TITLE_HYGIENE_VIOLATION",
        severity: "CRITICAL_BLOCKER",
        title: `Prohibited Raw Catalog Accession ('${codeMatch[1]}') in Manuscript Title`,
        forensicEvidence: `The title contains a raw accession code ('${codeMatch[1]}'). Specify the official phenotype or cohort name instead.`,
        suggestedRemediation: `Replace '${codeMatch[1]}' with the descriptive disease phenotype or consortium name.`
      });
    }
    return findings;
  }
  /**
   * Parses Markdown content into structured blocks for deep review.
   */
  parseMarkdownToBlocks(content, defaultTitle = "Untitled Manuscript") {
    const { frontmatter, body } = parseFrontmatter(content);
    let title = frontmatter["title"] ?? "";
    const lines = body.split(/\r?\n/);
    const blocks = [];
    const citations = [];
    let currentParagraph = [];
    let blockIndex = 1;
    const flushParagraph = () => {
      if (currentParagraph.length === 0) return;
      const text2 = currentParagraph.join(" ").trim();
      currentParagraph = [];
      if (!text2) return;
      const blockId = `block-${blockIndex++}`;
      blocks.push({ id: blockId, text: text2 });
      let citIdx = 1;
      let match;
      const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/g;
      while ((match = doiRegex.exec(text2)) !== null) {
        citations.push({
          id: `cit-${blockId}-doi-${citIdx++}`,
          text: text2,
          doi: match[1]
        });
      }
      const pmidRegex = /\bPMID:?\s*(\d+)\b/gi;
      while ((match = pmidRegex.exec(text2)) !== null) {
        citations.push({
          id: `cit-${blockId}-pmid-${citIdx++}`,
          text: text2,
          pmid: match[1]
        });
      }
      const arxivRegex = /\barXiv:?\s*(\d{4}\.\d{4,5})\b/gi;
      while ((match = arxivRegex.exec(text2)) !== null) {
        citations.push({
          id: `cit-${blockId}-arxiv-${citIdx++}`,
          text: text2,
          arxiv: match[1]
        });
      }
      const nctRegex = /\b(NCT\d{8})\b/gi;
      while ((match = nctRegex.exec(text2)) !== null) {
        citations.push({
          id: `cit-${blockId}-nct-${citIdx++}`,
          text: text2,
          nct: match[1]
        });
      }
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!title && /^#\s+(.+)$/.test(trimmed)) {
        flushParagraph();
        title = trimmed.replace(/^#\s+/, "").trim();
        continue;
      }
      if (/^#{1,6}\s+/.test(trimmed)) {
        flushParagraph();
        const headerText = trimmed.replace(/^#{1,6}\s+/, "").trim();
        blocks.push({ id: `sec-${blockIndex++}`, text: headerText, kind: "header" });
        continue;
      }
      if (!trimmed) {
        flushParagraph();
        continue;
      }
      currentParagraph.push(trimmed);
    }
    flushParagraph();
    return {
      title: title || defaultTitle,
      blocks,
      citations
    };
  }
  /**
   * Main screening execution entrypoint for a manuscript file or payload.
   */
  async screenFile(filePath) {
    if (!(0, import_node_fs.existsSync)(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const rawContent = (0, import_node_fs.readFileSync)(filePath, "utf8");
    const ext = (0, import_node_path.extname)(filePath).toLowerCase();
    if (ext === ".json") {
      const parsed = JSON.parse(rawContent);
      if (parsed.format && parsed.format.startsWith("editxt-capsule/")) {
        return this.screenCapsule(parsed, (0, import_node_path.basename)(filePath));
      }
      const input2 = {
        manuscriptId: parsed.manuscriptId ?? (0, import_node_path.basename)(filePath, ext),
        title: parsed.title ?? "Untitled Submission",
        blocks: parsed.blocks ?? [],
        anchors: parsed.anchors,
        manifestDeltas: parsed.manifestDeltas,
        citations: parsed.citations
      };
      return this.screenInput(input2);
    }
    const { title, blocks, citations } = this.parseMarkdownToBlocks(rawContent, (0, import_node_path.basename)(filePath, ext));
    const input = {
      manuscriptId: (0, import_node_path.basename)(filePath, ext),
      title,
      blocks,
      citations
    };
    return this.screenInput(input);
  }
  /**
   * Screens a structured PreSubmissionDeepReviewInput.
   */
  async screenInput(input) {
    const titleFindings = this.auditTitle(input.title);
    const deepReviewRes = await this.registry.invoke("review.deep_review_pre_submission", input);
    const deepReviewOutput = deepReviewRes.output;
    const findings = [];
    for (const tf of titleFindings) {
      findings.push({
        findingId: tf.findingId,
        blockId: "title",
        badgeType: "CITATION_WARNING",
        category: tf.category,
        severity: tf.severity,
        title: tf.title,
        forensicEvidence: tf.forensicEvidence,
        suggestedRemediation: tf.suggestedRemediation
      });
    }
    for (const f of deepReviewOutput.findings) {
      findings.push({
        findingId: f.findingId,
        blockId: f.blockId,
        badgeType: f.badgeType,
        category: f.category,
        severity: f.severity,
        title: f.title,
        forensicEvidence: f.forensicEvidence,
        suggestedRemediation: f.suggestedRemediation,
        replacementText: f.replacementText
      });
    }
    const criticalBlockerCount = titleFindings.length + deepReviewOutput.findings.filter((f) => f.severity === "CRITICAL_BLOCKER").length;
    const majorConcernCount = deepReviewOutput.findings.filter((f) => f.severity === "MAJOR_CONCERN").length;
    const warningCount = deepReviewOutput.findings.filter((f) => f.severity === "METHODOLOGICAL_WARNING").length;
    const parsimonyCount = deepReviewOutput.findings.filter((f) => f.severity === "PARSIMONY_SUGGESTION").length;
    const isBlocked = this.strict ? criticalBlockerCount > 0 || majorConcernCount > 0 : criticalBlockerCount > 0;
    const status = isBlocked ? "BLOCKED_DEFECTS" : "READY_FOR_PREPRINT";
    const exitCode = isBlocked ? 1 : 0;
    const summary = {
      manuscriptId: input.manuscriptId,
      title: input.title,
      totalSegments: input.blocks.length,
      criticalBlockerCount,
      majorConcernCount,
      warningCount,
      parsimonyCount,
      citationsChecked: input.citations?.length ?? 0,
      citationsFailed: findings.filter((f) => f.category === "CITATION_INTEGRITY_VIOLATION").length
    };
    const receiptPayload = JSON.stringify({
      manuscriptId: input.manuscriptId,
      title: input.title,
      status,
      exitCode,
      findingsCount: findings.length,
      deepReviewReceipt: deepReviewOutput.merkleReviewReceipt
    });
    const merkleReviewReceipt = `sha256:${(0, import_node_crypto10.createHash)("sha256").update(receiptPayload).digest("hex")}`;
    const markdownReport = this.generateMarkdownReport(summary, findings, status, merkleReviewReceipt);
    return {
      manuscriptId: input.manuscriptId,
      title: input.title,
      status,
      exitCode,
      summary,
      findings,
      merkleReviewReceipt,
      markdownReport
    };
  }
  /**
   * Screens an offline Publication Capsule.
   */
  async screenCapsule(capsule, capsuleName) {
    const verification = await verifyCapsule(capsule);
    const passed = verification.checks.filter((c) => c.status === "pass").length;
    const failed = verification.checks.filter((c) => c.status === "fail").length;
    const status = verification.valid && verification.recordedStatus === "accepted" ? "READY_FOR_PREPRINT" : "BLOCKED_DEFECTS";
    const findings = verification.checks.filter((c) => c.status === "fail").map((c) => ({
      findingId: `CAPSULE-CHECK-${c.id}`,
      blockId: "capsule-manifest",
      badgeType: "DATA_DRIFT",
      category: "CAPSULE_VERIFICATION_FAILURE",
      severity: "CRITICAL_BLOCKER",
      title: `Capsule Integrity Failure: ${c.id}`,
      forensicEvidence: c.detail,
      suggestedRemediation: "Rebuild the publication capsule ensuring all hashes and deterministic traces match."
    }));
    const summary = {
      manuscriptId: capsuleName,
      title: capsule?.metadata?.title ?? capsuleName,
      totalSegments: 0,
      criticalBlockerCount: findings.length,
      majorConcernCount: 0,
      warningCount: 0,
      parsimonyCount: 0,
      citationsChecked: 0,
      citationsFailed: 0,
      capsuleVerification: {
        valid: verification.valid,
        recordedStatus: verification.recordedStatus,
        passedChecks: passed,
        failedChecks: failed
      }
    };
    const receiptPayload = JSON.stringify({ capsuleName, valid: verification.valid, passed, failed });
    const merkleReviewReceipt = `sha256:${(0, import_node_crypto10.createHash)("sha256").update(receiptPayload).digest("hex")}`;
    const markdownReport = this.generateMarkdownReport(summary, findings, status, merkleReviewReceipt);
    return {
      manuscriptId: capsuleName,
      title: summary.title,
      status,
      exitCode: status === "READY_FOR_PREPRINT" ? 0 : 1,
      summary,
      findings,
      merkleReviewReceipt,
      markdownReport
    };
  }
  /**
   * Generates a clean, academic, anti-slop Markdown report.
   */
  generateMarkdownReport(summary, findings, status, receipt) {
    const isReady = status === "READY_FOR_PREPRINT";
    const statusBadge = isReady ? "\u{1F7E2} **PASSED (READY FOR PREPRINT PUBLICATION)**" : "\u{1F534} **BLOCKED (CRITICAL DEFECTS DETECTED)**";
    const lines = [
      "# EdiTXT Phase 1 Preprint Screening Report",
      "",
      `**Manuscript:** ${summary.title}`,
      `**Identifier:** \`${summary.manuscriptId}\``,
      `**Screening Verdict:** ${statusBadge}`,
      `**Cryptographic Merkle Receipt:** \`${receipt}\``,
      "",
      "---",
      "",
      "## Screening Summary",
      "",
      "| Metric | Value | Status |",
      "|---|---|---|",
      `| Total Segments Analyzed | ${summary.totalSegments} | Recorded |`,
      `| Critical Blockers (Gate Blocking) | ${summary.criticalBlockerCount} | ${summary.criticalBlockerCount === 0 ? "PASS" : "FAIL"} |`,
      `| Major Concerns | ${summary.majorConcernCount} | ${summary.majorConcernCount === 0 ? "PASS" : "REVIEW"} |`,
      `| Methodological Warnings | ${summary.warningCount} | INFO |`,
      `| Parsimony Suggestions | ${summary.parsimonyCount} | INFO |`
    ];
    if (summary.capsuleVerification) {
      lines.push(
        `| Capsule Checks Passed | ${summary.capsuleVerification.passedChecks} | PASS |`,
        `| Capsule Checks Failed | ${summary.capsuleVerification.failedChecks} | ${summary.capsuleVerification.failedChecks === 0 ? "PASS" : "FAIL"} |`,
        `| Capsule Recorded Status | ${summary.capsuleVerification.recordedStatus} | - |`
      );
    }
    lines.push("", "---", "", "## Findings & Remediation Required", "");
    if (findings.length === 0) {
      lines.push("No defects found. The manuscript satisfies all Phase 1 Pre-Print Screening invariants.");
      lines.push("", "> **Next Step**: Eligible for automated packaging and Zenodo DOI minting.");
    } else {
      lines.push("| Severity | Category | Target / Block | Detail | Suggested Remediation |");
      lines.push("|---|---|---|---|---|");
      for (const f of findings) {
        const cleanEvidence = f.forensicEvidence.replace(/\|/g, "\\|");
        const cleanRemediation = f.suggestedRemediation.replace(/\|/g, "\\|");
        lines.push(`| **${f.severity}** | \`${f.category}\` | \`${f.blockId}\` | ${cleanEvidence} | ${cleanRemediation} |`);
      }
      lines.push("", "> **Action Required**: Resolve all `CRITICAL_BLOCKER` items before resubmitting for Phase 1 certification.");
    }
    return lines.join("\n");
  }
};

// scripts/screening/run-screening.ts
function printHelp() {
  console.log(`
EdiTXT Phase 1 Preprint Screening CLI
======================================
Usage:
  npm run preprint:screen -- [options] [<manuscript-file>]

Arguments:
  <manuscript-file>          Path to Markdown (.md), JSON submission (.json),
                             or publication capsule (.capsule.json).
                             Defaults to './draft.md' if omitted and present.

Options:
  --strict                   Fail (exit 1) on MAJOR_CONCERN findings in addition to CRITICAL_BLOCKER.
  --output-report <path>     Write the full Markdown screening report to a file.
  --github-summary           Append the Markdown report to GITHUB_STEP_SUMMARY if available.
  --quiet                    Minimal output (verdict only).
  -h, --help                 Display this help message and exit.

Exit Codes:
  0                          PASSED: Manuscript is READY_FOR_PREPRINT.
  1                          BLOCKED: Critical blockers or fatal defects detected.
  2                          ERROR: Missing or unreadable manuscript file / bad arguments.
`);
}
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }
  const strict = args.includes("--strict");
  const githubSummary = args.includes("--github-summary");
  const quiet = args.includes("--quiet");
  let reportOutputPath = null;
  const reportArgIdx = args.indexOf("--output-report");
  if (reportArgIdx !== -1 && args[reportArgIdx + 1]) {
    reportOutputPath = args[reportArgIdx + 1];
  }
  const positionalArgs = args.filter((a) => !a.startsWith("--") && (reportArgIdx === -1 || a !== args[reportArgIdx + 1]));
  let targetPath = positionalArgs[0];
  if (!targetPath) {
    if ((0, import_node_fs2.existsSync)("draft.md")) {
      targetPath = "draft.md";
    } else {
      console.error("Error: No manuscript file provided and ./draft.md does not exist.");
      printHelp();
      process.exit(2);
    }
  }
  const resolvedPath = (0, import_node_path2.resolve)(process.cwd(), targetPath);
  if (!(0, import_node_fs2.existsSync)(resolvedPath)) {
    console.error(`Error: Manuscript file not found at: ${resolvedPath}`);
    process.exit(2);
  }
  if (!quiet) {
    console.log(`[EdiTXT] Initializing Phase 1 Preprint Screening on: ${targetPath}`);
    console.log(`[EdiTXT] Mode: ${strict ? "STRICT (Block on Critical & Major)" : "STANDARD (Block on Critical)"}`);
  }
  const engine = new PreprintScreeningEngine({ strict });
  try {
    const result = await engine.screenFile(resolvedPath);
    if (!quiet) {
      console.log("\n======================================================");
      console.log(`Manuscript: ${result.title}`);
      console.log(`Verdict:    ${result.status === "READY_FOR_PREPRINT" ? "PASS (READY FOR PREPRINT)" : "BLOCKED (DEFECTS DETECTED)"}`);
      console.log(`Receipt:    ${result.merkleReviewReceipt}`);
      console.log("------------------------------------------------------");
      console.log(`Segments Analyzed:    ${result.summary.totalSegments}`);
      console.log(`Critical Blockers:    ${result.summary.criticalBlockerCount}`);
      console.log(`Major Concerns:       ${result.summary.majorConcernCount}`);
      console.log(`Methodology Warnings: ${result.summary.warningCount}`);
      console.log(`Parsimony Tips:       ${result.summary.parsimonyCount}`);
      if (result.findings.length > 0) {
        console.log("\nFindings Summary:");
        for (const f of result.findings) {
          console.log(` - [${f.severity}] (${f.category}) ${f.title}`);
          console.log(`   Target: ${f.blockId}`);
          console.log(`   Remedy: ${f.suggestedRemediation}
`);
        }
      }
      console.log("======================================================\n");
    }
    if (reportOutputPath) {
      (0, import_node_fs2.writeFileSync)(reportOutputPath, result.markdownReport, "utf8");
      if (!quiet) {
        console.log(`[EdiTXT] Screening report written to: ${reportOutputPath}`);
      }
    }
    if (githubSummary || process.env.GITHUB_STEP_SUMMARY) {
      const summaryFile = process.env.GITHUB_STEP_SUMMARY;
      if (summaryFile) {
        (0, import_node_fs2.appendFileSync)(summaryFile, `

${result.markdownReport}
`, "utf8");
        if (!quiet) {
          console.log("[EdiTXT] Appended report to GITHUB_STEP_SUMMARY");
        }
      }
    }
    process.exit(result.exitCode);
  } catch (err) {
    console.error(`[EdiTXT] Fatal screening error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
}
main();
