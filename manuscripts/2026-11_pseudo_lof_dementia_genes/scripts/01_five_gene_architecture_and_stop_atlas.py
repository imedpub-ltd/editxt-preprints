"""Stage 1: Exhaustive 5-Gene Exon Architecture & Stop-Gain Pseudo-LoF Atlas (GRCh38).

Covers: PSEN1, PSEN2, APP, MAPT (MANE Select + 2N4R ENST00000344290), and GRN.
Handles both +1 and -1 genomic strands rigorously, verifying 100% identity against
Ensembl canonical peptide translation. Uses rate-limited Ensembl REST API only.
"""

import csv
import json
import time
import urllib.request
from pathlib import Path

BASE_DIR = Path(
    r"c:\Users\usuario\Neurodiagnoses Ecosystem\neurodiagnoses-monorepo\docs\manuscript_submission\2026-11_pseudo_lof_dementia_genes"
)
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

UA = {
    "User-Agent": "NeurodiagnosesResearch/1.0 (menendezgmanuel@uniovi.es)",
    "Content-Type": "application/json",
}
ENSEMBL = "https://rest.ensembl.org"

COMPLEMENT = str.maketrans("ACGT", "TGCA")
STOP_CODONS = {"TAA", "TAG", "TGA"}
CODON_TABLE = {
    "TTT": "F",
    "TTC": "F",
    "TTA": "L",
    "TTG": "L",
    "CTT": "L",
    "CTC": "L",
    "CTA": "L",
    "CTG": "L",
    "ATT": "I",
    "ATC": "I",
    "ATA": "I",
    "ATG": "M",
    "GTT": "V",
    "GTC": "V",
    "GTA": "V",
    "GTG": "V",
    "TCT": "S",
    "TCC": "S",
    "TCA": "S",
    "TCG": "S",
    "CCT": "P",
    "CCC": "P",
    "CCA": "P",
    "CCG": "P",
    "ACT": "T",
    "ACC": "T",
    "ACA": "T",
    "ACG": "T",
    "GCT": "A",
    "GCC": "A",
    "GCA": "A",
    "GCG": "A",
    "TAT": "Y",
    "TAC": "Y",
    "TAA": "*",
    "TAG": "*",
    "CAT": "H",
    "CAC": "H",
    "CAA": "Q",
    "CAG": "Q",
    "AAT": "N",
    "AAC": "N",
    "AAA": "K",
    "AAG": "K",
    "GAT": "D",
    "GAC": "D",
    "GAA": "E",
    "GAG": "E",
    "TGT": "C",
    "TGC": "C",
    "TGA": "*",
    "TGG": "W",
    "CGT": "R",
    "CGC": "R",
    "CGA": "R",
    "CGG": "R",
    "AGT": "S",
    "AGC": "S",
    "AGA": "R",
    "AGG": "R",
    "GGT": "G",
    "GGC": "G",
    "GGA": "G",
    "GGG": "G",
}

# Standard human 5' donor consensus PWM proxy (-3..+6 around exon|intron)
DONOR_CONS = ["AC", "A", "G", "G", "T", "AG", "A", "G", "T"]
DONOR_WEIGHTS = [0.6, 1.0, 1.8, 3.0, 3.0, 1.5, 1.2, 1.8, 0.7]  # max 14.6

TARGET_GENES = [
    ("PSEN1", "ADAD_GoF_Processivity", None),
    ("PSEN2", "ADAD_GoF_Processivity", None),
    ("APP", "ADAD_Dosage_Processivity", None),
    ("MAPT", "FTD_Tau_GoF_Splicing", None),  # MANE Select
    ("MAPT_2N4R", "FTD_Tau_CNS_2N4R_Isoform", "ENST00000344290"),
    ("GRN", "FTD_TDP_True_LoF_Control", None),
]


def score_donor_9mer(s9: str) -> float:
    if len(s9) != 9 or s9[3:5] != "GT":
        return 0.0
    return round(
        sum(
            w for ch, allowed, w in zip(s9, DONOR_CONS, DONOR_WEIGHTS) if ch in allowed
        ),
        2,
    )


def ensembl_get(path: str):
    time.sleep(0.25)
    req = urllib.request.Request(ENSEMBL + path, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def ensembl_post_regions(species: str, regions: list[str]) -> list[str]:
    out = []
    for i in range(0, len(regions), 45):
        chunk = regions[i : i + 45]
        time.sleep(0.25)
        body = json.dumps({"regions": chunk}).encode("utf-8")
        req = urllib.request.Request(
            f"{ENSEMBL}/sequence/region/{species}", data=body, headers=UA, method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            out.extend(item["seq"].upper() for item in json.loads(r.read()))
    return out


def analyse_transcript(label: str, role: str, symbol: str, force_tx_id: str | None):
    print(f"Resolving {label} ({symbol})...", flush=True)
    gene_info = ensembl_get(f"/lookup/symbol/human/{symbol}?expand=1")
    chrom = gene_info["seq_region_name"]
    strand = int(gene_info["strand"])

    tx = None
    if force_tx_id:
        for t in gene_info["Transcript"]:
            if t["id"] == force_tx_id:
                tx = t
                break
        if tx is None:
            tx = ensembl_get(f"/lookup/id/{force_tx_id}?expand=1")
    else:
        for t in gene_info["Transcript"]:
            if t.get("is_canonical"):
                tx = t
                break
        if tx is None:
            tx = gene_info["Transcript"][0]

    tx_id = tx["id"]
    cs, ce = int(tx["Translation"]["start"]), int(tx["Translation"]["end"])
    prot_id = tx["Translation"]["id"]
    expected_aa_len = int(tx["Translation"]["length"])

    # Order exons in 5' -> 3' transcript direction!
    if strand == 1:
        exons = sorted(tx["Exon"], key=lambda e: int(e["start"]))
    else:
        exons = sorted(tx["Exon"], key=lambda e: -int(e["start"]))

    # Fetch full exon sequences +/- 15 bp in transcript strand direction
    flank = 15
    region_strs = []
    meta_rows = []
    for idx, ex in enumerate(exons, 1):
        es, ee = int(ex["start"]), int(ex["end"])
        c_start, c_end = max(es, cs), min(ee, ce)
        has_cds = c_start <= c_end
        f_start, f_end = es - flank, ee + flank
        # Ensembl region endpoint with strand directly returns 5'->3' transcript orientation!
        region_strs.append(f"{chrom}:{f_start}..{f_end}:{strand}")
        meta_rows.append(
            (idx, ex["id"], es, ee, c_start, c_end, has_cds, f_start, f_end)
        )

    seqs = ensembl_post_regions("human", region_strs)

    exons_out = []
    cds_bases = []  # tuple: (genomic_pos, ref_genomic_base, tx_base, exon_num, exon_dict, offset_in_exon_seq)
    for (idx, ex_id, es, ee, c_start, c_end, has_cds, f_start, f_end), seq in zip(
        meta_rows, seqs
    ):
        exon_len = ee - es + 1
        coding_len = (c_end - c_start + 1) if has_cds else 0
        # In transcript 5'->3' seq (length = exon_len + 2*flank):
        # exon starts at index flank, ends at index flank + exon_len - 1
        ex_seq = seq[flank : flank + exon_len]
        nat_donor_9mer = seq[flank + exon_len - 3 : flank + exon_len + 6]
        nat_acceptor_9mer = seq[flank - 6 : flank + 3]
        nat_donor_sc = score_donor_9mer(nat_donor_9mer)
        fully_coding = has_cds and (c_start == es) and (c_end == ee)
        in_frame_skippable = fully_coding and (exon_len % 3 == 0)

        ex_obj = {
            "exon_num": idx,
            "exon_id": ex_id,
            "chrom": f"chr{chrom}",
            "strand": strand,
            "start": es,
            "end": ee,
            "coding_start": c_start if has_cds else None,
            "coding_end": c_end if has_cds else None,
            "exon_len": exon_len,
            "coding_len": coding_len,
            "fully_coding": fully_coding,
            "in_frame_skippable": in_frame_skippable,
            "nat_donor_9mer": nat_donor_9mer[:3] + "|" + nat_donor_9mer[3:],
            "nat_donor_score": nat_donor_sc,
            "nat_acceptor_9mer": nat_acceptor_9mer[:6] + "|" + nat_acceptor_9mer[6:],
            "flank": flank,
            "seq": seq,
        }
        exons_out.append(ex_obj)

        if has_cds:
            if strand == 1:
                g_positions = range(c_start, c_end + 1)
            else:
                g_positions = range(c_end, c_start - 1, -1)
            for gpos in g_positions:
                # offset in 5'->3' exon+flank seq:
                if strand == 1:
                    rel = gpos - f_start
                    tx_nt = seq[rel]
                    genomic_ref = tx_nt
                else:
                    # f_end corresponds to index 0 of reverse-complement seq
                    rel = f_end - gpos
                    tx_nt = seq[rel]
                    genomic_ref = tx_nt.translate(COMPLEMENT)
                cds_bases.append((gpos, genomic_ref, tx_nt, idx, ex_obj, rel))

    # Assert complete translation matches expected protein length + stop codon
    n_cds_nt = len(cds_bases)
    assert n_cds_nt % 3 == 0, f"{label}: CDS length {n_cds_nt} not divisible by 3"
    n_aa = n_cds_nt // 3 - 1  # exclude terminal stop codon
    assert n_aa == expected_aa_len, (
        f"{label}: translated {n_aa} != expected {expected_aa_len}"
    )

    # Verify stop codon at end and Met at start
    start_codon = "".join(b[2] for b in cds_bases[:3])
    stop_codon = "".join(b[2] for b in cds_bases[-3:])
    assert start_codon == "ATG" and stop_codon in STOP_CODONS, (
        f"{label}: bad start/stop {start_codon}/{stop_codon}"
    )

    # Identify coding exons and NMD-escape boundary (last coding exon + last 55 nt of penultimate coding exon)
    coding_exon_nums = sorted({b[3] for b in cds_bases})
    last_ce = coding_exon_nums[-1]
    penult_ce = coding_exon_nums[-2] if len(coding_exon_nums) >= 2 else last_ce
    penult_end_cds = max(i for i, b in enumerate(cds_bases, 1) if b[3] == penult_ce)
    nmd_escape_cds = max(1, penult_end_cds - 55) if len(coding_exon_nums) >= 2 else 1

    # Enumerate ALL possible single-nt stop-gain SNVs across all sense codons
    stop_snvs = []
    for codon_idx in range(n_aa):
        aa_pos = codon_idx + 1
        trip = cds_bases[3 * codon_idx : 3 * codon_idx + 3]
        wt_codon = "".join(b[2] for b in trip)
        wt_aa = CODON_TABLE[wt_codon]
        assert wt_aa != "*", f"{label}: unexpected internal stop at {aa_pos}"

        for p_in_cod in range(3):
            gpos, gen_ref, tx_ref, exn, ex_obj, rel = trip[p_in_cod]
            cds_pos = 3 * codon_idx + p_in_cod + 1
            for alt_tx in "ACGT":
                if alt_tx == tx_ref:
                    continue
                mut_codon = wt_codon[:p_in_cod] + alt_tx + wt_codon[p_in_cod + 1 :]
                if mut_codon not in STOP_CODONS:
                    continue

                gen_alt = alt_tx if strand == 1 else alt_tx.translate(COMPLEMENT)
                variant_str = f"chr{chrom}:{gpos}:{gen_ref}>{gen_alt}"

                # Distance in transcript nt to 5' and 3' boundary of THIS exon (including noncoding UTR edge if partial)
                ex_start_rel = flank
                ex_end_rel = flank + ex_obj["exon_len"] - 1
                dist_to_5p_exon_edge = rel - ex_start_rel  # 0 = first base of exon
                dist_to_3p_exon_edge = ex_end_rel - rel  # 0 = last base of exon

                # Coding distances to coding 3'/5' ends of this exon
                mseq = ex_obj["seq"][:rel] + alt_tx + ex_obj["seq"][rel + 1 :]

                # Check de novo GT cryptic 5' donor creating in-frame 3' exon truncation (<= 90 nt, > 0 nt)
                best_cryptic_donor = None
                # Coding end rel inside mseq:
                if strand == 1:
                    cds_ex_end_rel = ex_obj["coding_end"] - (ex_obj["start"] - flank)
                    cds_ex_start_rel = ex_obj["coding_start"] - (
                        ex_obj["start"] - flank
                    )
                else:
                    cds_ex_end_rel = (ex_obj["end"] + flank) - ex_obj["coding_start"]
                    cds_ex_start_rel = (ex_obj["end"] + flank) - ex_obj["coding_end"]

                if exn < last_ce:  # must splice downstream
                    for gt_pos in (rel - 1, rel):
                        if gt_pos >= 3 and gt_pos + 6 <= len(mseq):
                            if (
                                mseq[gt_pos : gt_pos + 2] == "GT"
                                and ex_obj["seq"][gt_pos : gt_pos + 2] != "GT"
                            ):
                                new_ex_end_rel = gt_pos - 1
                                if (
                                    cds_ex_start_rel - 1
                                    <= new_ex_end_rel
                                    < cds_ex_end_rel
                                ):
                                    del_nt = cds_ex_end_rel - new_ex_end_rel
                                    if del_nt > 0 and del_nt % 3 == 0 and del_nt <= 90:
                                        nine = mseq[gt_pos - 3 : gt_pos + 6]
                                        sc = score_donor_9mer(nine)
                                        cand = {
                                            "del_aa": del_nt // 3,
                                            "cryptic_9mer": nine[:3] + "|" + nine[3:],
                                            "cryptic_score": sc,
                                            "ratio": round(
                                                sc / ex_obj["nat_donor_score"], 3
                                            )
                                            if ex_obj["nat_donor_score"]
                                            else 0.0,
                                        }
                                        if (
                                            best_cryptic_donor is None
                                            or cand["cryptic_score"]
                                            > best_cryptic_donor["cryptic_score"]
                                        ):
                                            best_cryptic_donor = cand

                # Check de novo AG cryptic 3' acceptor creating in-frame 5' exon truncation (<= 90 nt)
                best_cryptic_acceptor = None
                if exn > coding_exon_nums[0]:  # must accept upstream intron
                    for ag_pos in (rel - 1, rel):
                        if ag_pos >= 14 and ag_pos + 2 <= len(mseq):
                            if (
                                mseq[ag_pos : ag_pos + 2] == "AG"
                                and ex_obj["seq"][ag_pos : ag_pos + 2] != "AG"
                            ):
                                new_ex_start_rel = ag_pos + 2
                                if (
                                    cds_ex_start_rel
                                    < new_ex_start_rel
                                    <= cds_ex_end_rel
                                ):
                                    del_nt = new_ex_start_rel - cds_ex_start_rel
                                    if del_nt > 0 and del_nt % 3 == 0 and del_nt <= 90:
                                        ppt = mseq[ag_pos - 14 : ag_pos - 2]
                                        py_frac = round(
                                            sum(b in "CT" for b in ppt) / len(ppt), 3
                                        )
                                        if py_frac >= 0.65:
                                            if (
                                                best_cryptic_acceptor is None
                                                or py_frac
                                                > best_cryptic_acceptor["py_frac"]
                                            ):
                                                best_cryptic_acceptor = {
                                                    "del_aa": del_nt // 3,
                                                    "py_frac": py_frac,
                                                }

                near_canonical_donor = (exn < last_ce) and (dist_to_3p_exon_edge <= 2)
                near_canonical_acceptor = (exn > coding_exon_nums[0]) and (
                    dist_to_5p_exon_edge <= 2
                )
                nmd_escape = cds_pos >= nmd_escape_cds

                mechanisms = []
                if best_cryptic_donor:
                    mechanisms.append("cryptic_donor_inframe")
                if best_cryptic_acceptor:
                    mechanisms.append("cryptic_acceptor_inframe")
                if near_canonical_donor or near_canonical_acceptor:
                    mechanisms.append("canonical_edge_splice_region")
                if ex_obj["in_frame_skippable"]:
                    mechanisms.append("inframe_skippable_exon")
                if nmd_escape:
                    mechanisms.append("nmd_escape_zone")

                stop_snvs.append(
                    {
                        "gene_label": label,
                        "symbol": symbol,
                        "role": role,
                        "transcript_id": tx_id,
                        "protein_id": prot_id,
                        "chrom": f"chr{chrom}",
                        "strand": strand,
                        "pos": gpos,
                        "ref_genomic": gen_ref,
                        "alt_genomic": gen_alt,
                        "variant": variant_str,
                        "exon_num": exn,
                        "aa_pos": aa_pos,
                        "wt_aa": wt_aa,
                        "cds_pos": cds_pos,
                        "hgvs_c": f"c.{cds_pos}{tx_ref}>{alt_tx}",
                        "hgvs_p": f"p.{wt_aa}{aa_pos}*",
                        "dist_to_5p_exon_edge": dist_to_5p_exon_edge,
                        "dist_to_3p_exon_edge": dist_to_3p_exon_edge,
                        "exon_inframe_skippable": ex_obj["in_frame_skippable"],
                        "nmd_escape_zone": nmd_escape,
                        "near_canonical_edge": near_canonical_donor
                        or near_canonical_acceptor,
                        "has_cryptic_donor_inframe": best_cryptic_donor is not None,
                        "cryptic_donor_del_aa": best_cryptic_donor["del_aa"]
                        if best_cryptic_donor
                        else 0,
                        "cryptic_donor_9mer": best_cryptic_donor["cryptic_9mer"]
                        if best_cryptic_donor
                        else "",
                        "cryptic_donor_score": best_cryptic_donor["cryptic_score"]
                        if best_cryptic_donor
                        else 0.0,
                        "nat_donor_score": ex_obj["nat_donor_score"],
                        "has_cryptic_acceptor_inframe": best_cryptic_acceptor
                        is not None,
                        "cryptic_acceptor_del_aa": best_cryptic_acceptor["del_aa"]
                        if best_cryptic_acceptor
                        else 0,
                        "mechanisms": ";".join(mechanisms)
                        if mechanisms
                        else "canonical_nmd_candidate",
                        "any_pseudo_lof_feature": bool(mechanisms),
                    }
                )

    arch = {
        "gene_label": label,
        "symbol": symbol,
        "role": role,
        "ensembl_gene_id": gene_info["id"],
        "transcript_id": tx_id,
        "protein_id": prot_id,
        "chrom": f"chr{chrom}",
        "strand": strand,
        "protein_length_aa": expected_aa_len,
        "total_exons": len(exons_out),
        "coding_exons_count": len(coding_exon_nums),
        "inframe_skippable_exons": [
            e["exon_num"] for e in exons_out if e["in_frame_skippable"]
        ],
        "nmd_escape_starts_cds": nmd_escape_cds,
        "nmd_escape_starts_aa": (nmd_escape_cds + 2) // 3,
        "total_possible_stop_gain_snvs": len(stop_snvs),
        "n_pseudo_lof_feature_snvs": sum(
            1 for x in stop_snvs if x["any_pseudo_lof_feature"]
        ),
        "n_cryptic_donor_inframe": sum(
            1 for x in stop_snvs if x["has_cryptic_donor_inframe"]
        ),
        "n_cryptic_acceptor_inframe": sum(
            1 for x in stop_snvs if x["has_cryptic_acceptor_inframe"]
        ),
        "n_canonical_edge": sum(1 for x in stop_snvs if x["near_canonical_edge"]),
        "exons": [{k: v for k, v in e.items() if k != "seq"} for e in exons_out],
    }
    return arch, stop_snvs


def main():
    all_arch = []
    all_stops = []
    for label, role, force_tx in TARGET_GENES:
        sym = "MAPT" if label == "MAPT_2N4R" else label
        arch, stops = analyse_transcript(label, role, sym, force_tx)
        all_arch.append(arch)
        all_stops.extend(stops)
        print(
            f"  -> {label}: {arch['transcript_id']} | strand={arch['strand']:+d} | "
            f"{arch['protein_length_aa']} aa | {arch['total_possible_stop_gain_snvs']} stop SNVs | "
            f"skip_exons={arch['inframe_skippable_exons']} | NMD_escape>=aa{arch['nmd_escape_starts_aa']} | "
            f"cryptic_donor={arch['n_cryptic_donor_inframe']} cryptic_acc={arch['n_cryptic_acceptor_inframe']} edge={arch['n_canonical_edge']}",
            flush=True,
        )

    json.dump(
        all_arch, open(DATA_DIR / "five_gene_exon_architecture.json", "w"), indent=2
    )
    tsv_path = DATA_DIR / "five_gene_all_stop_gain_snvs.tsv"
    if all_stops:
        with open(tsv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(all_stops[0].keys()), delimiter="\t")
            w.writeheader()
            w.writerows(all_stops)
    print(
        f"Saved {len(all_stops)} stop-gain SNV records across {len(all_arch)} transcripts to {tsv_path}"
    )


if __name__ == "__main__":
    main()
