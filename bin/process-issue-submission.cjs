#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .slice(0, 50);
}

function parseIssueBody(body) {
  const sections = {};
  const regex = /###\s+([^\r\n]+)[\r\n]+([\s\S]*?)(?=###|$)/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const header = match[1].trim();
    const content = match[2].trim();
    sections[header] = content;
  }
  return sections;
}

function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.error('Error: GITHUB_EVENT_PATH not found or invalid.');
    process.exit(1);
  }

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const issue = event.issue;
  if (!issue) {
    console.error('Error: No issue found in event payload.');
    process.exit(1);
  }

  const body = issue.body || '';
  const sections = parseIssueBody(body);

  const title = sections['Preprint Title'] || issue.title.replace(/^\[PREPRINT\]:\s*/, '').trim();
  const authors = sections['Authors & ORCIDs'] || 'Anonymous Author';
  const abstract = sections['Abstract'] || '';
  const manuscriptBody = sections['Full Manuscript Content (Markdown or Text)'] || '';
  const publicRepo = sections['Public Data / Code Repository (HTTP 200)'] || '';

  const slug = slugify(title) || `preprint-${issue.number}`;
  const manuscriptDir = path.resolve(process.cwd(), 'manuscripts', slug);
  fs.mkdirSync(manuscriptDir, { recursive: true });

  const manuscriptPath = path.join(manuscriptDir, 'manuscript.md');

  // Build clean manuscript Markdown
  let fullMarkdown = `# ${title}\n\n`;
  fullMarkdown += `**Authors**: ${authors}\n\n`;
  if (publicRepo) {
    fullMarkdown += `**Data & Code Repository**: [${publicRepo}](${publicRepo})\n\n`;
  }
  fullMarkdown += `## Abstract\n${abstract}\n\n`;
  if (manuscriptBody) {
    fullMarkdown += `${manuscriptBody}\n`;
  } else {
    fullMarkdown += `## Note\nManuscript abstract submitted via EdiTxt Preprints Issue #${issue.number}.\n`;
  }

  fs.writeFileSync(manuscriptPath, fullMarkdown, 'utf8');
  console.log(`[EdiTXT] Staged manuscript at: ${manuscriptPath}`);

  // Execute Screening CLI
  const screeningCli = path.resolve(__dirname, 'screening-cli.cjs');
  let output = '';
  let exitCode = 0;
  try {
    output = execFileSync('node', [screeningCli, manuscriptPath, '--github-summary'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (err) {
    exitCode = err.status || 1;
    output = (err.stdout || '') + '\n' + (err.stderr || '');
  }

  const passed = exitCode === 0 && output.includes('READY FOR PREPRINT');

  // Format Comment for GitHub Issue
  let comment = `### 🧬 EdiTxt AI & Reproducibility Screening Gate\n\n`;
  comment += `**Preprint**: *${title}*\n`;
  comment += `**Status**: ${passed ? '✅ **PASSED (READY FOR PREPRINT)**' : '⚠️ **ACTION REQUIRED (CHANGES REQUESTED)**'}\n\n`;
  comment += output;

  if (passed) {
    comment += `\n\n---\n`;
    comment += `🎉 **Screening Successful!** This manuscript complies with all Diamond Open Access criteria, title hygiene standards, and reproducibility invariants.\n`;
    comment += `🚀 Zenodo DOI reservation and publication pipeline triggered.`;
  } else {
    comment += `\n\n---\n`;
    comment += `💡 **How to proceed**: You can edit the issue above to address the highlighted findings. EdiTxt will automatically re-screen the submission upon update.`;
  }

  fs.writeFileSync('screening_comment.md', comment, 'utf8');
  fs.writeFileSync('screening_verdict.txt', passed ? 'PASS' : 'FAIL', 'utf8');
  fs.writeFileSync('screening_slug.txt', slug, 'utf8');
  fs.writeFileSync('screening_path.txt', manuscriptPath, 'utf8');

  console.log(`[EdiTXT] Verdict: ${passed ? 'PASS' : 'FAIL'}`);
  process.exit(exitCode);
}

main();
