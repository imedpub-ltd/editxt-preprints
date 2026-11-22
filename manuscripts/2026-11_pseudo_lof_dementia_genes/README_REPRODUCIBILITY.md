# Reproducibility Package: Five-Gene Dementia Pseudo-LoF & Antisense Landscape

This self-contained archive provides the scripts, derived datasets, and formal declarative catalog (`GeneForge Language`, `.gfl`) required to reproduce all quantitative findings, statistical tests, structural distance calculations, language-model fold-perturbation analyses, and publication figures reported in the accompanying manuscript.

## Directory Layout

- `scripts/`
  1. `01_five_gene_architecture_and_stop_atlas.py` — Queries Ensembl GRCh38 REST API for the canonical MANE Select transcripts (`PSEN1`, `PSEN2`, `APP`, `MAPT`, `GRN`) plus adult brain `MAPT` isoform 2N4R, validates peptide translations, enumerates all possible stop-gain SNVs (`n = 1,092` MANE Select; `1,307` total), classifies NMD boundaries and skippable exons, and scans for *de novo* in-frame cryptic splice motifs.
  2. `02_alphagenome_five_gene_atlas.py` — Queries the public AlphaGenome Atlas API across all 62 exon/junction intervals (scoring 100% of the 1,092 MANE Select stop-gain SNVs plus controls), extracts tissue/modality tracks for all `fi_MERGED_SPLICING >= 0.25` hits, and computes Mann-Whitney U and Fisher exact statistics.
  3. `03_gnomad_clinvar_five_gene_audit.py` — Queries gnomAD v4.1 GraphQL constraint and variant calls (`--mode db`), NCBI ClinVar variant summaries (`--mode db`), and Ensembl GRCh38-GRCm39 human-mouse exon/intron homologs (`--mode mouse`).
  4. `03b_mane_gnomad_refinement.py` — Filters raw gene-wide gnomAD pLoF records strictly to MANE Select coding exons (`+/- 5 bp`) and exports protein deletion panels and 61-nt ASO pre-mRNA target tiles (`macstudio_public_input.json`).
  5. `inspect_clinvar_traps.py` — Fetches detailed ClinVar submitter assertions, assertion criteria, and PMID citation lists for all Pathogenic / Likely Pathogenic pLoF records in `PSEN1` and `PSEN2`.
  6. `04_macstudio_orthogonal_validation.py` — Computes ESM-2 (`facebook/esm2_t12_35M_UR50D`, PyTorch MPS/CUDA/CPU) full-sequence embedding L2 shifts and pseudo-log-likelihood deltas against 20 random 5-aa `PSEN1` internal deletion nulls, and performs SantaLucia (1998) nearest-neighbor thermodynamic optimization of 22-mer steric-blocking ASO windows avoiding canonical `+1/+2 GU` splice donors.
  7. `inspect_mac_aso.py` — Summarizes ESM-2 deletion tolerance results and lead steric-blocking ASO candidates.
  8. `06_generate_publication_figures.py` — Reconstructs publication figures 1–4 (`PDF` and `PNG`) directly from the empirical datasets in `data/`.
- `data/` — Derived JSON and TSV empirical outputs produced by scripts 01–04 and structural geometry audit (`6iyc_hl1_analysis.json`, computed from public RCSB PDB entry `6IYC`), plus static validation output (`geneforge_gfl_validation.json`).
- `gfl/` — Formal GeneForge Language catalog (`five_gene_pseudolof_aso_catalog.gfl`) encoding variant classifications and ASO candidates.

## Software Requirements & Environment

- Python `>= 3.10`
- Core libraries: `numpy`, `scipy`, `matplotlib`, `requests` (standard library `urllib`, `json`, `csv`, `statistics`, `pathlib`)
- Orthogonal protein language modeling (script `04`): `torch` (`mps`, `cuda`, or `cpu`), `transformers` (downloads public HuggingFace weights `facebook/esm2_t12_35M_UR50D`)
- Optional cryo-EM parsing: `biopython` or direct PDB/mmCIF coordinate parser against public RCSB `6IYC`

## Execution Order

Run from the root of this extracted supplementary directory using relative paths:

```bash
python scripts/01_five_gene_architecture_and_stop_atlas.py
python scripts/02_alphagenome_five_gene_atlas.py
python scripts/03_gnomad_clinvar_five_gene_audit.py --mode db
python scripts/03b_mane_gnomad_refinement.py
python scripts/inspect_clinvar_traps.py
python scripts/03_gnomad_clinvar_five_gene_audit.py --mode mouse
python scripts/04_macstudio_orthogonal_validation.py --input data/macstudio_public_input.json --output data/macstudio_orthogonal_validation.json
python scripts/06_generate_publication_figures.py
```

Note: Live API steps (`01`–`03`, `inspect_clinvar_traps`) require outbound HTTPS access to Ensembl, AlphaGenome Atlas, gnomAD, and NCBI E-utilities; offline reproduction of all manuscript statistics and figures can be executed directly using the pre-computed empirical tables in `data/` via `python scripts/06_generate_publication_figures.py`.
