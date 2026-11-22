# EdiTxt Preprints
**Diamond Open Access Preprint Server (International Archives Series)**

[![Zenodo Community](https://img.shields.io/badge/Zenodo-Community%20imedpub-blue)](https://zenodo.org/communities/imedpub)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Diamond Open Access](https://img.shields.io/badge/Diamond%20OA-0%E2%82%AC%20APC-success)](https://preprints.imedpub.org)

EdiTxt Preprints is a Diamond Open Access (0 € APC) scientific preprint repository operated by **iMedPub** for the *International Archives* series. It provides instant screening, permanent DataCite DOI registration via Zenodo, and open discussion for multidisciplinary, medical, and computational research.

---

## 🏛️ Phase 1 Publishing Features
* **Automated Screening**: Immediate automated checks on citation integrity (anti-hallucination), title hygiene, public data/code access (HTTP 200 without auth), and numerical consistency.
* **Persistent Certification**: Clean submissions receive an immutable SHA-256 Merkle review receipt and an official **DataCite DOI via Zenodo** (`10.5281/zenodo.XXXXXX`) within minutes.
* **Open Discussion**: Transparent line-by-line discussions via GitHub Discussions.
* **Gateway to Formal Journals**: Passing EdiTxt Preprints is the foundation for submitting to the formal peer-reviewed journals of the *International Archives* series (Crossref prefix `10.3823`).

---

## 🚀 How to Submit a Preprint
1. Go to the **Issues** tab and click [New Issue](https://github.com/imedpub-ltd/editxt-preprints/issues/new?template=preprint_submission.yml) -> **Submit Preprint**.
2. Complete the form fields:
   * **Title**: Descriptive scientific title (free of external journal names or author citations).
   * **Authors & ORCIDs**: Listed authors, affiliations, and ORCID identifiers.
   * **Abstract**: Background, methods, results, and conclusions.
   * **Full Manuscript Content**: Main manuscript text or sections (Introduction, Methods, Results, Discussion).
   * **References / Bibliography**: Verified citation list with DOIs or PMIDs.
   * **Public Data / Code Repository**: Public URL (HTTP 200) for reproducible data or code.
3. Click **Submit new issue**. Automated GitHub Actions will immediately screen the manuscript, verify citations, and post the review audit in the issue thread.
4. Once screening passes, the preprint is committed to the repository, registered with an official DataCite DOI on Zenodo, and licensed under CC BY 4.0.
