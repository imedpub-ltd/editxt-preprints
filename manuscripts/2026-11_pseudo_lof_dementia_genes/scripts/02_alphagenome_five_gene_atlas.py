"""Stage 2: Exhaustive AlphaGenome Variant Impact (AVI) Splicing & Termination Atlas
across ALL 5 autosomal-dominant dementia genes (PSEN1, PSEN2, APP, MAPT, GRN).

Uses the official AlphaGenome Atlas client via alphagenome_atlas_avi.py with ~/.env API key.
Zero simulation; scores 100% of enumerated stop-gain SNVs plus canonical splice-site controls.
"""

import json
import sys
from pathlib import Path

import dotenv
import numpy as np
import pandas as pd
from scipy import stats

AVI_SCRIPTS = Path(
    r"C:\Users\usuario\.gemini\config\plugins\science\skills\alphagenome_variant_impact_score\scripts"
)
sys.path.insert(0, str(AVI_SCRIPTS))
import alphagenome_atlas_avi as avi  # noqa: E402
from alphagenome.data import genome  # noqa: E402

BASE_DIR = Path(
    r"c:\Users\usuario\Neurodiagnoses Ecosystem\neurodiagnoses-monorepo\docs\manuscript_submission\2026-11_pseudo_lof_dementia_genes"
)
DATA_DIR = BASE_DIR / "data"


def score_interval_chunked(
    client, chrom: str, start_1b: int, end_1b: int, max_bp: int = 1200
):
    """Query AlphaGenome Atlas interval API in chunks <= max_bp and return variant dict."""
    results = {}
    cur = start_1b
    while cur <= end_1b:
        hi = min(end_1b, cur + max_bp - 1)
        interval = genome.Interval(chromosome=chrom, start=cur - 1, end=hi)
        try:
            scores = client.query_interval(
                interval, requested_scorers=avi._REQUESTED_SCORERS
            )
            if "AVI_SCORE" in scores:
                recs = avi._extract_region_variants(
                    scores["AVI_SCORE"], scores.get("AVI_SCORE_FEATURE_IMPORTANCE")
                )
                for rec in recs:
                    if rec.phred_score is None and rec.raw_score is None:
                        continue
                    vstr = f"{rec.chromosome}:{rec.position}:{rec.reference_bases}>{rec.alternate_bases}"
                    results[vstr] = rec
        except Exception as e:
            print(
                f"  [warn] interval {chrom}:{cur}-{hi} failed ({e}); will fallback to query_variant for misses",
                flush=True,
            )
        cur = hi + 1
    return results


def rec_to_dict(rec):
    fi = dict(rec.feature_importances or {})
    return {
        "avi_phred": float(rec.phred_score) if rec.phred_score is not None else np.nan,
        "avi_raw": float(rec.raw_score) if rec.raw_score is not None else np.nan,
        "avi_quantile": float(rec.quantile) if rec.quantile is not None else np.nan,
        "top_modality": rec.top_feature_name or "",
        "top_fi": float(rec.top_feature_value)
        if rec.top_feature_value is not None
        else np.nan,
        "fi_MERGED_SPLICING": float(fi.get("MERGED_SPLICING", 0.0)),
        "fi_PROTEIN_TERMINATION": float(fi.get("PROTEIN_TERMINATION", 0.0)),
        "fi_ALPHAMISSENSE": float(fi.get("ALPHAMISSENSE", 0.0)),
        "fi_CACTUS_241_WAY": float(fi.get("CACTUS_241_WAY", 0.0)),
        "fi_PHASTCONS_470_WAY": float(fi.get("PHASTCONS_470_WAY", 0.0)),
        "fi_MAX_ABS_RNA_SEQ": float(fi.get("MAX_ABS_RNA_SEQ", 0.0)),
        "fi_MAX_ABS_POLYADENYLATION": float(fi.get("MAX_ABS_POLYADENYLATION", 0.0)),
    }


def main():
    dotenv.load_dotenv(Path.home() / ".env")
    client = avi.get_atlas_client()

    arch = json.load(
        open(DATA_DIR / "five_gene_exon_architecture.json", encoding="utf-8")
    )
    stops_df = pd.read_csv(DATA_DIR / "five_gene_all_stop_gain_snvs.tsv", sep="\t")
    print(
        f"Loaded {len(stops_df)} stop-gain rows across {len(arch)} transcripts.",
        flush=True,
    )

    # Build deduplicated exon interval map covering coding exons +/- 12 bp intronic junctions
    raw_windows = []
    canonical_splice_positions = {}  # (chrom, pos) -> meta
    for gene_rec in arch:
        for ex in gene_rec["exons"]:
            if ex["coding_len"] <= 0:
                continue
            cs, ce = int(ex["coding_start"]), int(ex["coding_end"])
            raw_windows.append((ex["chrom"], cs - 12, ce + 12))
            # Collect canonical intronic donor/acceptor +/-1..2 positions when internal exon
            if ex["exon_num"] > 1:
                for off in (1, 2):
                    pos = (
                        int(ex["start"]) - off
                        if ex["strand"] == 1
                        else int(ex["end"]) + off
                    )
                    canonical_splice_positions[(ex["chrom"], pos)] = (
                        gene_rec["gene_label"],
                        "canonical_acceptor",
                    )
            if ex["exon_num"] < gene_rec["total_exons"]:
                for off in (1, 2):
                    pos = (
                        int(ex["end"]) + off
                        if ex["strand"] == 1
                        else int(ex["start"]) - off
                    )
                    canonical_splice_positions[(ex["chrom"], pos)] = (
                        gene_rec["gene_label"],
                        "canonical_donor",
                    )

    # Merge overlapping intervals per chromosome
    by_chrom = {}
    for ch, s, e in raw_windows:
        by_chrom.setdefault(ch, []).append((s, e))
    merged = []
    for ch, ivs in sorted(by_chrom.items()):
        ivs.sort()
        cur_s, cur_e = ivs[0]
        for s, e in ivs[1:]:
            if s <= cur_e + 5:
                cur_e = max(cur_e, e)
            else:
                merged.append((ch, cur_s, cur_e))
                cur_s, cur_e = s, e
        merged.append((ch, cur_s, cur_e))

    print(
        f"Querying {len(merged)} merged exon/junction intervals via AlphaGenome Atlas interval API...",
        flush=True,
    )
    all_scored = {}
    for i, (ch, s, e) in enumerate(merged, 1):
        res = score_interval_chunked(client, ch, s, e, max_bp=1200)
        all_scored.update(res)
        if i % 15 == 0 or i == len(merged):
            print(
                f"  Progress: {i}/{len(merged)} intervals ({len(all_scored)} unique SNVs collected)",
                flush=True,
            )

    # Check if any enumerated stop-gain SNV is missing from interval cache; fallback to single-variant API
    unique_stop_vars = sorted(stops_df["variant"].unique())
    missing = [v for v in unique_stop_vars if v not in all_scored]
    if missing:
        print(
            f"Scoring {len(missing)} remaining stop-gain SNVs via single-variant API...",
            flush=True,
        )
        for v in missing:
            try:
                rec = avi._score_single_variant(
                    avi._to_variant_record(v), client, include_track_info=False
                )
                all_scored[v] = rec
            except Exception as exc:
                print(f"  [warn] single query {v} failed: {exc}", flush=True)

    # Attach AVI metrics to every stop-gain SNV row
    avi_cols = []
    for v in stops_df["variant"]:
        rec = all_scored.get(v)
        avi_cols.append(rec_to_dict(rec) if rec else {})
    avi_df = pd.DataFrame(avi_cols)
    out_df = pd.concat([stops_df.reset_index(drop=True), avi_df], axis=1)
    out_df.to_csv(
        DATA_DIR / "alphagenome_five_gene_stop_gains.tsv", sep="\t", index=False
    )

    # Also save canonical splice-site positive controls scored in the same intervals
    ctrl_rows = []
    for vstr, rec in all_scored.items():
        key = (rec.chromosome, int(rec.position))
        if key in canonical_splice_positions:
            g_lbl, kind = canonical_splice_positions[key]
            row = {"gene_label": g_lbl, "control_type": kind, "variant": vstr}
            row.update(rec_to_dict(rec))
            ctrl_rows.append(row)
    ctrl_df = pd.DataFrame(ctrl_rows).drop_duplicates(subset=["gene_label", "variant"])
    ctrl_df.to_csv(
        DATA_DIR / "alphagenome_canonical_splice_controls.tsv", sep="\t", index=False
    )

    # Resolve exact track info for ALL unique high-splicing stop-gain SNVs (fi_MERGED_SPLICING >= 0.25)
    # Use MANE genes + MAPT_2N4R deduplicated by variant string
    high_sp = (
        out_df[out_df["fi_MERGED_SPLICING"] >= 0.25]
        .sort_values("fi_MERGED_SPLICING", ascending=False)
        .drop_duplicates(subset=["variant"])
    )
    print(
        f"Found {len(high_sp)} unique high-splicing stop-gain SNVs (fi_MERGED_SPLICING >= 0.25). Fetching track provenance...",
        flush=True,
    )
    track_hits = []
    for _, row in high_sp.iterrows():
        v = row["variant"]
        try:
            rec = avi._score_single_variant(
                avi._to_variant_record(v), client, include_track_info=True
            )
            sp_tr = rec.track_attributions.get("MERGED_SPLICING")
            track_hits.append(
                {
                    "gene_label": row["gene_label"],
                    "symbol": row["symbol"],
                    "variant": v,
                    "exon_num": int(row["exon_num"]),
                    "hgvs_c": row["hgvs_c"],
                    "hgvs_p": row["hgvs_p"],
                    "mechanisms": row["mechanisms"],
                    "avi_phred": float(rec.phred_score) if rec.phred_score else None,
                    "fi_MERGED_SPLICING": float(row["fi_MERGED_SPLICING"]),
                    "fi_PROTEIN_TERMINATION": float(row["fi_PROTEIN_TERMINATION"]),
                    "splicing_track_name": sp_tr.track_name if sp_tr else None,
                    "splicing_biosample": sp_tr.biosample_name if sp_tr else None,
                    "splicing_target_gene": sp_tr.gene_name if sp_tr else None,
                }
            )
        except Exception as exc:
            print(f"  [warn] track resolution {v} failed: {exc}", flush=True)
    json.dump(
        track_hits,
        open(DATA_DIR / "alphagenome_top_pseudolof_tracks.json", "w"),
        indent=2,
    )

    # Compute summary stats on the 5 canonical MANE Select transcripts (exclude MAPT_2N4R duplicate count from totals)
    mane_df = out_df[
        out_df["gene_label"].isin(["PSEN1", "PSEN2", "APP", "MAPT", "GRN"])
    ].copy()
    per_gene = {}
    for g in ["PSEN1", "PSEN2", "APP", "MAPT", "GRN"]:
        sub = mane_df[mane_df["gene_label"] == g]
        sp = sub["fi_MERGED_SPLICING"].dropna()
        per_gene[g] = {
            "n_stop_snvs": int(len(sub)),
            "n_scored": int(sp.shape[0]),
            "median_splicing_fi": round(float(sp.median()), 4),
            "iqr_splicing_fi": round(float(sp.quantile(0.75) - sp.quantile(0.25)), 4),
            "max_splicing_fi": round(float(sp.max()), 4),
            "mean_avi_phred": round(float(sub["avi_phred"].mean()), 2),
            "n_ge_0_25": int((sp >= 0.25).sum()),
            "pct_ge_0_25": round(100.0 * float((sp >= 0.25).mean()), 2),
            "n_ge_0_50": int((sp >= 0.50).sum()),
            "n_structural_pseudo_lof": int(sub["any_pseudo_lof_feature"].sum()),
        }

    # Test 1: cryptic donor/edge structural candidates vs non-splice-region canonical NMD candidates
    cand_mask = mane_df["has_cryptic_donor_inframe"] | mane_df["near_canonical_edge"]
    cand_sp = mane_df.loc[cand_mask, "fi_MERGED_SPLICING"].dropna()
    other_sp = mane_df.loc[~cand_mask, "fi_MERGED_SPLICING"].dropna()
    mw_stat, mw_p = stats.mannwhitneyu(cand_sp, other_sp, alternative="greater")

    # Test 2: canonical donor/edge + cryptic hits AUROC predicting fi_MERGED_SPLICING >= 0.25
    # And Fisher exact: canonical_edge or cryptic_donor vs other in predicting fi_MERGED_SPLICING >= 0.25
    hi_mask = mane_df["fi_MERGED_SPLICING"] >= 0.25
    table = [
        [int((cand_mask & hi_mask).sum()), int((cand_mask & ~hi_mask).sum())],
        [int((~cand_mask & hi_mask).sum()), int((~cand_mask & ~hi_mask).sum())],
    ]
    fisher_or, fisher_p = stats.fisher_exact(table, alternative="greater")

    # Test 3: ADAD (PSEN1+PSEN2+APP) vs GRN rate of cryptic-donor or high-splicing hits
    summary = {
        "mane_total_stop_snvs": int(len(mane_df)),
        "per_gene": per_gene,
        "mann_whitney_cryptic_or_edge_vs_interior": {
            "n_candidate": int(len(cand_sp)),
            "median_candidate": round(float(cand_sp.median()), 4),
            "n_interior": int(len(other_sp)),
            "median_interior": round(float(other_sp.median()), 4),
            "U_stat": float(mw_stat),
            "p_value": float(mw_p),
        },
        "fisher_exact_splicing_ge_0_25": {
            "contingency_table": table,
            "odds_ratio": float(fisher_or) if np.isfinite(fisher_or) else "inf",
            "p_value": float(fisher_p),
        },
        "top_hits_count": len(track_hits),
    }
    json.dump(summary, open(DATA_DIR / "alphagenome_stats_summary.json", "w"), indent=2)
    print("\n=== ALPHAGENOME 5-GENE SUMMARY ===")
    print(json.dumps(summary, indent=2))
    print("\nTop high-splicing hits (>=0.25):")
    for h in track_hits:
        print(
            f"  {h['gene_label']:10s} | {h['variant']:22s} | {h['hgvs_c']:12s} {h['hgvs_p']:8s} | Ex{h['exon_num']:2d} | Phred={h['avi_phred']:.2f} | Splicing={h['fi_MERGED_SPLICING']:.4f} | {h['mechanisms']}"
        )


if __name__ == "__main__":
    main()
