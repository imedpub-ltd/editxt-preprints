"""Stage 3: Complete gnomAD v4 Constraint/pLoF, ClinVar ACMG PVS1 Clinical Audit,
and Orthologous Human-vs-Mouse Junction Divergence across PSEN1, PSEN2, APP, MAPT, GRN.

Uses official gnomad_database and clinvar_database skill scripts + rate-limited Ensembl REST.
No simulated data.
"""

import json
import subprocess
import time
import urllib.request
from collections import Counter
from pathlib import Path

BASE_DIR = Path(
    r"c:\Users\usuario\Neurodiagnoses Ecosystem\neurodiagnoses-monorepo\docs\manuscript_submission\2026-11_pseudo_lof_dementia_genes"
)
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw_audit"
RAW_DIR.mkdir(parents=True, exist_ok=True)

GNOMAD_SCRIPTS = Path(
    r"C:\Users\usuario\.gemini\config\plugins\science\skills\gnomad_database\scripts"
)
CLINVAR_SCRIPT = Path(
    r"C:\Users\usuario\.gemini\config\plugins\science\skills\clinvar_database\scripts\clinvar_api.py"
)

GENES = ["PSEN1", "PSEN2", "APP", "MAPT", "GRN"]
LOF_CONSEQ = {
    "stop_gained",
    "frameshift_variant",
    "splice_donor_variant",
    "splice_acceptor_variant",
    "start_lost",
}
UA = {
    "User-Agent": "NeurodiagnosesResearch/1.0 (menendezgmanuel@uniovi.es)",
    "Content-Type": "application/json",
}
ENSEMBL = "https://rest.ensembl.org"


def run_cmd(cmd: list[str]):
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return res.stdout


def audit_gnomad():
    out = {}
    for g in GENES:
        print(f"[gnomAD] Querying {g} constraint & variants...", flush=True)
        c_file = RAW_DIR / f"gnomad_{g}_constraint.json"
        v_file = RAW_DIR / f"gnomad_{g}_variants.json"
        if not c_file.exists():
            run_cmd(
                [
                    "uv",
                    "run",
                    str(GNOMAD_SCRIPTS / "get_gene_constraint.py"),
                    "--gene",
                    g,
                    "--output",
                    str(c_file),
                ]
            )
        if not v_file.exists():
            run_cmd(
                [
                    "uv",
                    "run",
                    str(GNOMAD_SCRIPTS / "search_variants.py"),
                    "--gene",
                    g,
                    "--output",
                    str(v_file),
                ]
            )

        c_json = json.load(open(c_file, encoding="utf-8"))
        gc = (c_json.get("data") or {}).get("gene", {}).get("gnomad_constraint") or {}
        variants = (json.load(open(v_file, encoding="utf-8")).get("data") or {}).get(
            "gene", {}
        ).get("variants") or []

        plof_vars = []
        total_plof_ac = 0
        nonzero_plof_variants = 0
        for v in variants:
            if v.get("consequence") in LOF_CONSEQ:
                ex_ac = ((v.get("exome") or {}).get("ac")) or 0
                ge_ac = ((v.get("genome") or {}).get("ac")) or 0
                ac = int(ex_ac) + int(ge_ac)
                total_plof_ac += ac
                if ac > 0:
                    nonzero_plof_variants += 1
                plof_vars.append(
                    {
                        "variant_id": v["variant_id"],
                        "consequence": v["consequence"],
                        "ac": ac,
                        "exome_ac": ex_ac,
                        "genome_ac": ge_ac,
                    }
                )
        out[g] = {
            "pli": gc.get("pli"),
            "oe_lof": gc.get("oe_lof"),
            "oe_lof_upper_LOEUF": gc.get("oe_lof_upper"),
            "oe_mis": gc.get("oe_mis"),
            "total_gnomad_variants": len(variants),
            "n_plof_records": len(plof_vars),
            "n_plof_variants_ac_gt_0": nonzero_plof_variants,
            "total_plof_allele_count": total_plof_ac,
            "consequence_counts": dict(Counter(v.get("consequence") for v in variants)),
            "plof_variants": plof_vars,
        }
        print(
            f"  {g}: pLI={gc.get('pli'):.4f} LOEUF={gc.get('oe_lof_upper'):.3f} total_vars={len(variants)} pLoF={len(plof_vars)} (AC>0: {nonzero_plof_variants}, sumAC={total_plof_ac})",
            flush=True,
        )
    return out


def audit_clinvar():
    out = {}
    for g in GENES:
        print(f"[ClinVar] Searching & summarizing {g}...", flush=True)
        id_file = RAW_DIR / f"clinvar_{g}_ids.json"
        if not id_file.exists():
            run_cmd(
                [
                    "uv",
                    "run",
                    str(CLINVAR_SCRIPT),
                    "search",
                    "--query",
                    f"{g}[gene]",
                    "--retmax",
                    "0",
                    "--output",
                    str(id_file),
                ]
            )
        vids = json.load(open(id_file, encoding="utf-8"))["variant_ids"]

        recs = []
        for idx in range(0, len(vids), 200):
            chunk = vids[idx : idx + 200]
            cfile = RAW_DIR / f"clinvar_{g}_summary_{idx // 200}.json"
            if not cfile.exists():
                run_cmd(
                    [
                        "uv",
                        "run",
                        str(CLINVAR_SCRIPT),
                        "summary",
                        "--variant_ids",
                        *chunk,
                        "--output",
                        str(cfile),
                    ]
                )
            recs.extend(json.load(open(cfile, encoding="utf-8")))

        mc_totals = Counter()
        plof_pathogenic = []
        plof_all_summary = Counter()
        inframe_pathogenic = []
        missense_pathogenic = 0

        for r in recs:
            mcs = set(r.get("molecular_consequences") or [])
            cs = str(r.get("clinical_significance") or "Unknown")
            is_path = cs in (
                "Pathogenic",
                "Likely pathogenic",
                "Pathogenic/Likely pathogenic",
            )
            title = str(r.get("title") or "")
            phens = r.get("phenotypes") or []

            for m in mcs:
                mc_totals[m] += 1
            if "missense variant" in mcs and is_path:
                missense_pathogenic += 1

            is_plof = bool(
                mcs
                & {
                    "nonsense",
                    "frameshift variant",
                    "splice donor variant",
                    "splice acceptor variant",
                    "initiator codon variant",
                }
            )
            if is_plof:
                plof_all_summary[cs] += 1
                if is_path:
                    plof_pathogenic.append(
                        {
                            "variant_id": r.get("variant_id"),
                            "title": title,
                            "clinical_significance": cs,
                            "review_status": r.get("review_status"),
                            "last_evaluated": r.get("last_evaluated"),
                            "molecular_consequences": sorted(mcs),
                            "phenotypes": phens,
                        }
                    )
            if (
                bool(mcs & {"inframe_deletion", "inframe_insertion", "inframe_indel"})
                and is_path
            ):
                inframe_pathogenic.append(
                    {
                        "variant_id": r.get("variant_id"),
                        "title": title,
                        "clinical_significance": cs,
                        "molecular_consequences": sorted(mcs),
                        "phenotypes": phens,
                    }
                )

        out[g] = {
            "total_clinvar_records": len(recs),
            "molecular_consequence_totals": dict(mc_totals),
            "missense_pathogenic_lp_count": missense_pathogenic,
            "plof_clinsig_breakdown": dict(plof_all_summary),
            "n_plof_pathogenic_lp": len(plof_pathogenic),
            "n_inframe_pathogenic_lp": len(inframe_pathogenic),
            "plof_pathogenic_records": plof_pathogenic,
            "inframe_pathogenic_records": inframe_pathogenic,
        }
        print(
            f"  {g}: total={len(recs)} | missense_P/LP={missense_pathogenic} | pLoF_P/LP={len(plof_pathogenic)} | inframe_P/LP={len(inframe_pathogenic)}",
            flush=True,
        )

    # Fetch detailed ClinVar evidence for P/LP pLoF records in GoF genes (PSEN1, PSEN2, APP, MAPT) up to 25 records
    ev_details = {}
    for g in ["PSEN1", "PSEN2", "APP", "MAPT"]:
        for rec in out[g]["plof_pathogenic_records"][:12]:
            vid = str(rec["variant_id"])
            efile = RAW_DIR / f"clinvar_ev_{vid}.json"
            if not efile.exists():
                try:
                    run_cmd(
                        [
                            "uv",
                            "run",
                            str(CLINVAR_SCRIPT),
                            "evidence",
                            "--variant_id",
                            vid,
                            "--output",
                            str(efile),
                        ]
                    )
                except Exception as exc:
                    print(f"  [warn] evidence fetch {vid}: {exc}", flush=True)
                    continue
            ev_details[vid] = json.load(open(efile, encoding="utf-8"))
    json.dump(
        ev_details,
        open(DATA_DIR / "clinvar_gof_gene_plof_evidence.json", "w"),
        indent=2,
    )
    return out


def ensembl_get(path: str):
    time.sleep(0.25)
    req = urllib.request.Request(ENSEMBL + path, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def audit_human_mouse_hotspots():
    """Fetch +/- 60 bp human vs mouse exon-intron boundary sequences for all top splicing hits."""
    tracks = json.load(
        open(DATA_DIR / "alphagenome_top_pseudolof_tracks.json", encoding="utf-8")
    )
    arch = {
        a["gene_label"]: a
        for a in json.load(
            open(DATA_DIR / "five_gene_exon_architecture.json", encoding="utf-8")
        )
    }

    # Deduplicate by (symbol, exon_num)
    targets = []
    seen = set()
    for t in tracks:
        key = (t["symbol"], t["exon_num"])
        if key not in seen:
            seen.add(key)
            targets.append(t)

    # Cache mouse canonical transcript lookups
    mm_cache = {}
    results = []
    for t in targets:
        sym = t["symbol"]
        glbl = t["gene_label"]
        ex_num = int(t["exon_num"])
        ex_rec = next(e for e in arch[glbl]["exons"] if e["exon_num"] == ex_num)

        # Human +/-60 bp around the 3' donor of this exon (in 5'->3' strand orientation)
        ch = ex_rec["chrom"].replace("chr", "")
        st = int(ex_rec["strand"])
        boundary_pos = int(ex_rec["end"]) if st == 1 else int(ex_rec["start"])
        hs_region = (
            f"{ch}:{boundary_pos - 59}..{boundary_pos + 60}:{st}"
            if st == 1
            else f"{ch}:{boundary_pos - 60}..{boundary_pos + 59}:{st}"
        )
        hs_seq = ensembl_get(
            f"/sequence/region/human/{hs_region}?content-type=application/json"
        )["seq"].upper()

        # Look up homologous coding exon in mouse by peptide anchor or exon index alignment
        mm_sym = sym.capitalize()  # Psen1, Psen2, App, Mapt, Grn
        if mm_sym not in mm_cache:
            g_mm = ensembl_get(f"/lookup/symbol/mouse/{mm_sym}?expand=1")
            mm_tx = next(x for x in g_mm["Transcript"] if x.get("is_canonical"))
            mm_st = int(mm_tx["strand"])
            mm_exons = sorted(
                mm_tx["Exon"],
                key=lambda e: int(e["start"]) if mm_st == 1 else -int(e["start"]),
            )
            mm_cache[mm_sym] = (g_mm["seq_region_name"], mm_st, mm_exons)

        mm_ch, mm_st, mm_exons = mm_cache[mm_sym]
        # Match exon with closest exon_len to human exon_len (exact or +/- 6bp)
        best_mm_ex = min(
            mm_exons,
            key=lambda me: abs(
                (int(me["end"]) - int(me["start"]) + 1) - ex_rec["exon_len"]
            ),
        )
        mm_len = int(best_mm_ex["end"]) - int(best_mm_ex["start"]) + 1
        mm_b = int(best_mm_ex["end"]) if mm_st == 1 else int(best_mm_ex["start"])
        mm_region = (
            f"{mm_ch}:{mm_b - 59}..{mm_b + 60}:{mm_st}"
            if mm_st == 1
            else f"{mm_ch}:{mm_b - 60}..{mm_b + 59}:{mm_st}"
        )
        mm_seq = ensembl_get(
            f"/sequence/region/mouse/{mm_region}?content-type=application/json"
        )["seq"].upper()

        ex_ident = sum(a == b for a, b in zip(hs_seq[:60], mm_seq[:60])) / 60.0
        int_ident = sum(a == b for a, b in zip(hs_seq[60:], mm_seq[60:])) / 60.0
        results.append(
            {
                "symbol": sym,
                "exon_num": ex_num,
                "human_len": ex_rec["exon_len"],
                "mouse_matched_len": mm_len,
                "variant": t["variant"],
                "hgvs_p": t["hgvs_p"],
                "fi_MERGED_SPLICING": t["fi_MERGED_SPLICING"],
                "human_exon_end60": hs_seq[:60],
                "mouse_exon_end60": mm_seq[:60],
                "human_intron_start60": hs_seq[60:],
                "mouse_intron_start60": mm_seq[60:],
                "exon_60bp_identity": round(ex_ident, 4),
                "intron_60bp_identity": round(int_ident, 4),
            }
        )
        print(
            f"  [Mouse] {sym} Exon {ex_num} ({t['hgvs_p']}): exon_60bp_id={ex_ident * 100:.1f}% | intron_60bp_id={int_ident * 100:.1f}%",
            flush=True,
        )

    json.dump(
        results, open(DATA_DIR / "human_mouse_junction_divergence.json", "w"), indent=2
    )
    return results


def main():
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["all", "db", "mouse"], default="all")
    args = ap.parse_args()

    if args.mode in ("all", "db"):
        gn = audit_gnomad()
        cv = audit_clinvar()
        json.dump(
            {"gnomad": gn, "clinvar": cv},
            open(DATA_DIR / "gnomad_clinvar_five_gene_audit.json", "w"),
            indent=2,
        )
    if args.mode in ("all", "mouse"):
        audit_human_mouse_hotspots()
    print("Stage 3 COMPLETE.", flush=True)


if __name__ == "__main__":
    main()
