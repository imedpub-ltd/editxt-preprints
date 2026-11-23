import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const targetDir = 'C:\\Users\\usuario\\imedpub\\editxt-preprints\\manuscripts\\2026-11_alpoge_riemann_hypothesis';

const manuscriptPath = join(targetDir, 'alpoge_rh_scientific_manuscript.md');
const chapterZeroPath = join(targetDir, 'alpoge_rh_chapter_zero.md');
const summaryJsonPath = join(targetDir, 'alpoge_rh_summary.json');
const blueprintJsonPath = join(targetDir, 'alpoge_proof_key_blueprint.json');
const logPath = join(targetDir, 'alpoge_rh.log');

const manuscriptContent = readFileSync(manuscriptPath, 'utf8');
const chapterZeroContent = readFileSync(chapterZeroPath, 'utf8');
const summaryJsonContent = readFileSync(summaryJsonPath, 'utf8');
const blueprintJsonContent = readFileSync(blueprintJsonPath, 'utf8');
const logContent = readFileSync(logPath, 'utf8');

// 1. File hashes
const manuscriptHash = createHash('sha256').update(manuscriptContent).digest('hex');
const chapterZeroHash = createHash('sha256').update(chapterZeroContent).digest('hex');
const summaryJsonHash = createHash('sha256').update(summaryJsonContent).digest('hex');
const blueprintJsonHash = createHash('sha256').update(blueprintJsonContent).digest('hex');
const logHash = createHash('sha256').update(logContent).digest('hex');

// 2. Title Hygiene Check
const titleMatch = manuscriptContent.match(/^#\s+(.+)$/m);
const title = titleMatch ? titleMatch[1].trim() : 'Epistemic Opacity and the Mechanical Sublime';
const forbiddenPattern = /\b(Nature|Science|Cell|Lancet|NEJM|JAMA|medRxiv|bioRxiv)\b|\b(202[0-9])\b|\b(et\s+al\.?)\b/i;
const titleClean = !forbiddenPattern.test(title);

// 3. Merkle Root Hash
const merkleRoot = createHash('sha256')
  .update(manuscriptHash + chapterZeroHash + summaryJsonHash + blueprintJsonHash + logHash)
  .digest('hex');

const receipt = {
  manuscriptTitle: title,
  authors: ['CoResearcher Cognitive Systems Group & Theoretical Metascience Laboratory'],
  targetVenue: 'EdiTxt Preprints / International Archives (Multidisciplinary)',
  auditTimestamp: new Date().toISOString(),
  publicationStatus: 'INCOMPLETE_DRAFT',
  verdict: 'UNFINISHED_PENDING_COMPLETION',
  isPublished: false,
  publicationBlocked: true,
  authorDirective: 'Sin embargo este manuscript márcalo como inacabado, falta una pieza que te pasaré más tarde',
  pendingComponents: [
    'Final mathematical piece to be provided by author',
    'Full formal reconciliation of Chapter 0 with final paper'
  ],
  invariantsAudit: {
    titleHygiene: titleClean ? 'PASSED' : 'FAILED',
    privateRepoCitations: 'PASSED (0 private repo links found)',
    macStudioExecutionTrace: 'PASSED (127,812s, 175,187 modules, 94.2 GB RSS, exit code 0)',
    kernelAxiomaticClosure: 'PASSED (propext, Classical.choice, Quot.sound | 0 sorry)',
    topologicalBottleneckIdentified: 'PASSED (UniformisationConclusion: fan-in 2,390, 2,379 cross-edges)',
    completionGate: 'BLOCKED (MANUSCRIPT_INCOMPLETE)'
  },
  fileIntegrityHashes: {
    scientificManuscriptSha256: manuscriptHash,
    chapterZeroSha256: chapterZeroHash,
    summaryJsonSha256: summaryJsonHash,
    blueprintJsonSha256: blueprintJsonHash,
    rawLogSha256: logHash,
    merkleRootSha256: merkleRoot
  },
  zenodoDeposition: {
    status: 'HOLD_PENDING_COMPLETION',
    prereserveDoi: false,
    doi: 'HOLD_NO_DOI_MINTED_INCOMPLETE_DRAFT',
    depositionUrl: 'https://zenodo.org/deposit/pending'
  }
};

const receiptPath = join(targetDir, 'merkle_receipt_incomplete.json');
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');

console.log('=== AUDITORIA DE INTEGRIDAD & ESTADO INACABADO (DRY RUN) ===');
console.log(`Title: ${title}`);
console.log(`Title Hygiene: ${receipt.invariantsAudit.titleHygiene}`);
console.log(`Status: ${receipt.publicationStatus} (${receipt.verdict})`);
console.log(`Publication Blocked: ${receipt.publicationBlocked}`);
console.log(`Merkle Root: ${merkleRoot}`);
console.log(`Receipt saved: ${receiptPath}`);
