"""Step A2: Refine gnomAD pLoF audit strictly to GRCh38 MANE Select coding/splice spans
and build the public-only input bundle for Mac Studio M4 Max orthogonal validation.
"""

import json
import time
import urllib.request
from pathlib import Path

import pandas as pd

BASE_DIR = Path(
    r"c:\Users\usuario\Neurodiagnoses Ecosystem\neurodiagnoses-monorepo\docs\manuscript_submission\2026-11_pseudo_lof_dementia_genes"
)
DATA_DIR = BASE_DIR / "data"
UA = {
    "User-Agent": "NeurodiagnosesResearch/1.0 (menendezgmanuel@uniovi.es)",
    "Content-Type": "application/json",
}
ENSEMBL = "https://rest.ensembl.org"
COMPLEMENT = str.maketrans("ACGT", "TGCA")


def ensembl_get(path: str):
    time.sleep(0.25)
    req = urllib.request.Request(ENSEMBL + path, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    arch_list = json.load(
        open(DATA_DIR / "five_gene_exon_architecture.json", encoding="utf-8")
    )
    arch = {a["gene_label"]: a for a in arch_list}
    gc_audit = json.load(
        open(DATA_DIR / "gnomad_clinvar_five_gene_audit.json", encoding="utf-8")
    )
    gn = gc_audit["gnomad"]

    # 1. Filter gnomAD pLoF strictly to MANE Select coding exons +/- 5 bp
    mane_plof_summary = {}
    for g in ["PSEN1", "PSEN2", "APP", "MAPT", "GRN"]:
        a = arch[g]
        coding_spans = [
            (int(e["coding_start"]) - 5, int(e["coding_end"]) + 5)
            for e in a["exons"]
            if e["coding_len"] > 0
        ]
        in_mane = []
        outside_mane = []
        for pv in gn[g]["plof_variants"]:
            pos = int(pv["variant_id"].split("-")[1])
            if any(lo <= pos <= hi for lo, hi in coding_spans):
                in_mane.append(pv)
            else:
                outside_mane.append(pv)
        mane_plof_summary[g] = {
            "gene_wide_plof_records": len(gn[g]["plof_variants"]),
            "gene_wide_plof_sum_ac": sum(x["ac"] for x in gn[g]["plof_variants"]),
            "mane_coding_plof_records": len(in_mane),
            "mane_coding_plof_ac_gt_0": sum(1 for x in in_mane if x["ac"] > 0),
            "mane_coding_plof_sum_ac": sum(x["ac"] for x in in_mane),
            "non_mane_plof_records": len(outside_mane),
            "non_mane_plof_sum_ac": sum(x["ac"] for x in outside_mane),
            "top_mane_plof": sorted(in_mane, key=lambda x: -x["ac"])[:5],
        }
        print(
            f"[MANE gnomAD] {g:5s}: gene_wide={mane_plof_summary[g]['gene_wide_plof_records']:3d} "
            f"(AC={mane_plof_summary[g]['gene_wide_plof_sum_ac']:4d}) -> "
            f"MANE_only={mane_plof_summary[g]['mane_coding_plof_records']:3d} "
            f"(AC>0={mane_plof_summary[g]['mane_coding_plof_ac_gt_0']:3d}, sumAC={mane_plof_summary[g]['mane_coding_plof_sum_ac']:4d})"
        )
    json.dump(
        mane_plof_summary,
        open(DATA_DIR / "gnomad_mane_filtered_summary.json", "w"),
        indent=2,
    )

    # 2. Fetch public canonical protein FASTA sequences for all 5 MANE proteins (for Mac Studio ESM-2)
    proteins = {}
    for g in ["PSEN1", "PSEN2", "APP", "MAPT", "GRN"]:
        pid = arch[g]["protein_id"]
        seq = ensembl_get(
            f"/sequence/id/{pid}?type=protein&content-type=application/json"
        )["seq"].upper()
        assert len(seq) == arch[g]["protein_length_aa"]
        proteins[g] = {
            "protein_id": pid,
            "transcript_id": arch[g]["transcript_id"],
            "seq": seq,
        }
        print(f"[Protein FASTA] {g} ({pid}): {len(seq)} aa")

    # 3. Inspect all cryptic-donor candidates & top splicing hotspots from Stage 2
    df = pd.read_csv(DATA_DIR / "alphagenome_five_gene_stop_gains.tsv", sep="\t")
    mane_df = df[df["gene_label"].isin(["PSEN1", "PSEN2", "APP", "MAPT", "GRN"])].copy()

    # Select targets for ASO thermodynamic tiling: all 6 cryptic-donor candidates + top exonic splicing hotspots (>=0.50)
    aso_targets_df = (
        mane_df[
            mane_df["has_cryptic_donor_inframe"]
            | (mane_df["fi_MERGED_SPLICING"] >= 0.50)
        ]
        .sort_values("fi_MERGED_SPLICING", ascending=False)
        .drop_duplicates(subset=["variant"])
    )

    print(
        f"\nBatch-fetching +/- 30 nt public pre-mRNA sequences for {len(aso_targets_df)} ASO hotspot targets...",
        flush=True,
    )
    regions_batch = []
    rows_meta = []
    for _, r in aso_targets_df.iterrows():
        chrom = str(r["chrom"]).replace("chr", "")
        pos = int(r["pos"])
        strand = int(r["strand"])
        regions_batch.append(f"{chrom}:{pos - 30}..{pos + 30}:{strand}")
        rows_meta.append(r)

    time.sleep(0.25)
    body = json.dumps({"regions": regions_batch}).encode("utf-8")
    req = urllib.request.Request(
        f"{ENSEMBL}/sequence/region/human", data=body, headers=UA, method="POST"
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        seqs61 = [item["seq"].upper() for item in json.loads(resp.read())]

    aso_targets = []
    for r, s61 in zip(rows_meta, seqs61):
        tx_ref = r["hgvs_c"][-3]
        tx_alt = r["hgvs_c"][-1]
        assert s61[30] == tx_ref, f"Mismatch at {r['variant']}: {s61[30]} != {tx_ref}"
        mut61 = s61[:30] + tx_alt + s61[31:]
        dist_3p = int(r["dist_to_3p_exon_edge"])
        aso_targets.append(
            {
                "gene_label": r["gene_label"],
                "variant": r["variant"],
                "exon_num": int(r["exon_num"]),
                "hgvs_c": r["hgvs_c"],
                "hgvs_p": r["hgvs_p"],
                "avi_phred": float(r["avi_phred"]),
                "fi_MERGED_SPLICING": float(r["fi_MERGED_SPLICING"]),
                "has_cryptic_donor_inframe": bool(r["has_cryptic_donor_inframe"]),
                "cryptic_donor_del_aa": int(r["cryptic_donor_del_aa"]),
                "cryptic_donor_9mer": str(r["cryptic_donor_9mer"])
                if pd.notna(r["cryptic_donor_9mer"])
                else "",
                "dist_to_3p_exon_edge": dist_3p,
                "wt_61nt_tx5_3": s61,
                "mut_61nt_tx5_3": mut61,
                "snv_idx0": 30,
            }
        )

    # Build protein deletion panel for ESM-2 on Mac Studio M4 Max GPU
    # Include all 6 cryptic-donor in-frame deletions + classic exon skips + APP KPI skip + 20 random 5-aa PSEN1 controls
    import random

    rng = random.Random(42)
    del_panel = []

    cryptic_dels = mane_df[mane_df["has_cryptic_donor_inframe"]].copy()
    for _, r in cryptic_dels.iterrows():
        g = r["gene_label"]
        aa0 = int(r["aa_pos"])
        k_del = int(r["cryptic_donor_del_aa"])
        wt = proteins[g]["seq"]
        # Variant may preserve wt[aa0-1] if donor starts at codon pos 2/3, or delete starting at aa0 (K109_L113del = 5 aa)
        # Check whether cryptic GT is inside aa0 or next aa; in K109* (pos 0/1 of 109? Wait: c.324G is codon108-3, so aa 109..113 are removed!)
        start_aa1 = aa0
        mut = wt[: start_aa1 - 1] + wt[start_aa1 - 1 + k_del :]
        del_panel.append(
            {
                "id": f"{g}_{r['hgvs_p']}_del",
                "category": "cryptic_donor_deletion",
                "gene": g,
                "aa_start": start_aa1,
                "del_len": k_del,
                "deleted_seq": wt[start_aa1 - 1 : start_aa1 - 1 + k_del],
                "wt_seq": wt,
                "mut_seq": mut,
            }
        )

    # Add PSEN1 Exon 9 skip (aa 290..319, 87bp/29aa starting in exon 9) and PSEN2 Exon 9 skip & 20 random 5-aa PSEN1 null controls
    # Compute exact aa range for in-frame skippable exons in PSEN1 Exon 9 & PSEN2 Exon 9/10 & APP Exon 7
    ps1_wt = proteins["PSEN1"]["seq"]
    # PSEN1 ΔE9 removes residues Ser290_Ser319delinsCys or ~87bp (29aa). Let's locate exact boundary using Exon 8+9 coding lengths:
    ps1_ex_starts = {}
    cum = 0
    for e in arch["PSEN1"]["exons"]:
        if e["coding_len"] > 0:
            ps1_ex_starts[e["exon_num"]] = (cum // 3 + 1, (cum + e["coding_len"]) // 3)
            cum += e["coding_len"]
    e9_s, e9_e = ps1_ex_starts[9]
    del_panel.append(
        {
            "id": "PSEN1_Exon9_skip",
            "category": "known_inframe_exon_skip",
            "gene": "PSEN1",
            "aa_start": e9_s,
            "del_len": e9_e - e9_s + 1,
            "deleted_seq": ps1_wt[e9_s - 1 : e9_e],
            "wt_seq": ps1_wt,
            "mut_seq": ps1_wt[: e9_s - 1] + ps1_wt[e9_e:],
        }
    )

    # 20 random 5-aa non-HL1 PSEN1 deletion controls
    used_starts = set(range(100, 120))
    while len([x for x in del_panel if x["category"] == "psen1_random_5aa_null"]) < 20:
        s_aa = rng.randint(25, len(ps1_wt) - 30)
        if s_aa in used_starts:
            continue
        used_starts.add(s_aa)
        del_panel.append(
            {
                "id": f"PSEN1_rand5aa_{s_aa}",
                "category": "psen1_random_5aa_null",
                "gene": "PSEN1",
                "aa_start": s_aa,
                "del_len": 5,
                "deleted_seq": ps1_wt[s_aa - 1 : s_aa + 4],
                "wt_seq": ps1_wt,
                "mut_seq": ps1_wt[: s_aa - 1] + ps1_wt[s_aa + 4 :],
            }
        )

    mac_bundle = {
        "proteins": proteins,
        "deletion_panel": del_panel,
        "aso_targets": aso_targets,
    }
    json.dump(mac_bundle, open(DATA_DIR / "macstudio_public_input.json", "w"), indent=2)
    print(
        f"Saved public Mac Studio input bundle: {len(del_panel)} deletion constructs, {len(aso_targets)} ASO hotspot targets."
    )


if __name__ == "__main__":
    main()
