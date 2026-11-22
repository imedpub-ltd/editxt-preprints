# EdiTxt Preprints
**The Sovereign Diamond Open Access Preprint Server of iMedPub (International Archives Series)**

[![Zenodo Community](https://img.shields.io/badge/Zenodo-Community%20imedpub-blue)](https://zenodo.org/communities/imedpub)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Diamond Open Access](https://img.shields.io/badge/Diamond%20OA-0%E2%82%AC%20APC-success)](https://preprints.imedpub.org)

EdiTxt Preprints is the open, zero-cost (0 € APC), agentic-friendly preprint server operated by **iMedPub** (International Medical Publisher). It hosts and certificates multidisciplinary, medical, and neurological scientific preprints backed by verified execution traces and primary bibliographic links.

---

## 🏛️ Phase 1 Publishing Features
* **Zero-Minute AI Screening**: Immediate automated checks on citation integrity (anti-hallucination), title hygiene, public data/code access (HTTP 200 without auth), and numerical consistency.
* **Instant Certification**: Clean submissions receive an immutable SHA-256 Merkle review receipt and an official **DataCite DOI via Zenodo** (`10.5281/zenodo.XXXXXX`) within minutes.
* **Community Peer-Review**: Open line-by-line discussions via GitHub Discussions (alphaXiv style).
* **Gateway to Formal Journals**: Passing EdiTxt Preprints is the required first step to submit to the formal peer-reviewed journals of the *International Archives* series (Crossref prefix `10.3823`).

---

## 🚀 How to Submit a Preprint
1. Open a **Pull Request** in this repository adding your manuscript in Markdown or LaTeX under `preprints/YYYY/your-paper-slug/`.
2. Ensure your data and code repositories are publicly accessible (`HTTP 200`).
3. Automated GitHub Actions will run the screening engine and post an audit summary directly on your Pull Request.
4. Upon approval, your preprint is merged, minted on Zenodo, and published at [preprints.imedpub.org](https://preprints.imedpub.org).
