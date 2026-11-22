"""Stage 6a: Generate 4 Q1-publication-grade multi-panel figures (PDF + 300 DPI PNG)
strictly following scientific-figure-making house style. Zero simulated data.
"""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

BASE_DIR = Path(
    r"c:\Users\usuario\Neurodiagnoses Ecosystem\neurodiagnoses-monorepo\docs\manuscript_submission\2026-11_pseudo_lof_dementia_genes"
)
DATA_DIR = BASE_DIR / "data"
FIG_DIR = BASE_DIR / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)
SCRATCH = Path(
    r"C:\Users\usuario\.gemini\antigravity\brain\cff24611-f2bf-4dde-8f97-2f9e1bdb2d62\scratch"
)

PALETTE = {
    "blue_main": "#0F4D92",
    "blue_secondary": "#3775BA",
    "green_1": "#DDF3DE",
    "green_2": "#AADCA9",
    "green_3": "#8BCF8B",
    "red_1": "#F6CFCB",
    "red_2": "#E9A6A1",
    "red_strong": "#B64342",
    "neutral": "#CFCECE",
    "highlight": "#FFD700",
    "teal": "#42949E",
    "violet": "#9A4D8E",
    "dark": "#222222",
}


def apply_style():
    plt.rcParams.update(
        {
            "font.family": "sans-serif",
            "font.sans-serif": ["DejaVu Sans", "Helvetica", "Arial"],
            "font.size": 10.5,
            "axes.titlesize": 11.5,
            "axes.titleweight": "bold",
            "axes.labelsize": 10.5,
            "xtick.labelsize": 9.5,
            "ytick.labelsize": 9.5,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.linewidth": 1.3,
            "legend.frameon": False,
            "pdf.fonttype": 42,
            "ps.fonttype": 42,
        }
    )


def save_fig(fig, stem: str):
    fig.savefig(FIG_DIR / f"{stem}.pdf", dpi=300, bbox_inches="tight", pad_inches=0.08)
    fig.savefig(FIG_DIR / f"{stem}.png", dpi=300, bbox_inches="tight", pad_inches=0.08)
    plt.close(fig)
    print(f"Saved {stem}.{{pdf,png}}")


def build_fig1():
    gc = json.load(
        open(DATA_DIR / "gnomad_clinvar_five_gene_audit.json", encoding="utf-8")
    )
    mane_gn = json.load(
        open(DATA_DIR / "gnomad_mane_filtered_summary.json", encoding="utf-8")
    )
    genes = ["PSEN1", "PSEN2", "APP", "MAPT", "GRN"]

    fig, (ax1, ax2) = plt.subplots(
        1, 2, figsize=(12.8, 4.9), gridspec_kw={"wspace": 0.34}
    )

    # Panel A: gnomAD pLI vs MANE pLoF allele count (paradox)
    x = np.arange(len(genes))
    plis = [gc["gnomad"][g]["pli"] for g in genes]
    loeufs = [gc["gnomad"][g]["oe_lof_upper_LOEUF"] for g in genes]
    mane_acs = [mane_gn[g]["mane_coding_plof_sum_ac"] for g in genes]
    bar_colors = [
        PALETTE["red_strong"] if g == "GRN" else PALETTE["blue_main"] for g in genes
    ]

    bars = ax1.bar(
        x - 0.18,
        plis,
        width=0.35,
        color=bar_colors,
        edgecolor="#222222",
        linewidth=0.8,
        label="pLI (LoF intolerance)",
    )
    bars2 = ax1.bar(
        x + 0.18,
        loeufs,
        width=0.35,
        color=PALETTE["neutral"],
        edgecolor="#444444",
        linewidth=0.8,
        label="LOEUF (o/e upper)",
    )
    ax1.axhline(
        0.9, color=PALETTE["red_strong"], linestyle="--", linewidth=0.9, alpha=0.65
    )
    ax1.text(
        4.45, 0.92, "pLI = 0.90", fontsize=8.5, color=PALETTE["red_strong"], ha="right"
    )

    for i, g in enumerate(genes):
        top_y = max(plis[i], loeufs[i])
        ax1.text(
            i,
            top_y + 0.04,
            f"AC={mane_acs[i]}",
            ha="center",
            va="bottom",
            fontsize=8.5,
            fontweight="bold",
            color="#222222",
        )

    ax1.set_xticks(x)
    ax1.set_xticklabels(genes, fontweight="bold")
    ax1.set_ylim(0, 1.18)
    ax1.set_ylabel("gnomAD v4 Constraint Metric")
    ax1.set_title(
        "A. Population Constraint Paradox (MANE Select pLoF)", loc="left", pad=10
    )
    ax1.legend(loc="upper center", bbox_to_anchor=(0.5, -0.13), ncol=2, fontsize=9)

    # Panel B: ClinVar P/LP proportion (Missense vs pLoF vs In-frame)
    y = np.arange(len(genes))
    miss = [gc["clinvar"][g]["missense_pathogenic_lp_count"] for g in genes]
    plof = [gc["clinvar"][g]["n_plof_pathogenic_lp"] for g in genes]
    infr = [gc["clinvar"][g]["n_inframe_pathogenic_lp"] for g in genes]
    tots = [max(1, m + p + inf) for m, p, inf in zip(miss, plof, infr)]

    p_miss = np.array([100.0 * m / t for m, t in zip(miss, tots)])
    p_plof = np.array([100.0 * p / t for p, t in zip(plof, tots)])
    p_infr = np.array([100.0 * inf / t for inf, t in zip(infr, tots)])

    ax2.barh(
        y, p_miss, color=PALETTE["blue_secondary"], height=0.58, label="Missense P/LP"
    )
    ax2.barh(
        y,
        p_infr,
        left=p_miss,
        color=PALETTE["teal"],
        height=0.58,
        label="In-frame indel P/LP",
    )
    ax2.barh(
        y,
        p_plof,
        left=p_miss + p_infr,
        color=PALETTE["red_strong"],
        height=0.58,
        label="pLoF / Canonical splice P/LP",
    )

    for i in range(len(genes)):
        lbl = f"n={tots[i]}  (pLoF: {plof[i]}/{tots[i]} = {p_plof[i]:.1f}%)"
        ax2.text(
            102,
            y[i],
            lbl,
            va="center",
            ha="left",
            fontsize=8.8,
            color="#222222",
            fontweight="bold" if genes[i] in ("PSEN1", "PSEN2", "GRN") else "normal",
        )

    ax2.set_yticks(y)
    ax2.set_yticklabels(genes, fontweight="bold")
    ax2.invert_yaxis()
    ax2.set_xlim(0, 152)
    ax2.set_xticks([0, 25, 50, 75, 100])
    ax2.set_xlabel("Share of ClinVar Pathogenic / Likely Pathogenic Variants (%)")
    ax2.set_title(
        "B. Clinical Variant Spectrum (ClinVar P/LP Audit)", loc="left", pad=10
    )
    ax2.legend(loc="upper center", bbox_to_anchor=(0.35, -0.13), ncol=3, fontsize=8.8)

    save_fig(fig, "fig1_five_gene_constraint_clinvar")


def build_fig2():
    df = pd.read_csv(DATA_DIR / "alphagenome_five_gene_stop_gains.tsv", sep="\t")
    mane = df[df["gene_label"].isin(["PSEN1", "PSEN2", "APP", "MAPT", "GRN"])].copy()
    ex4_scan = pd.read_csv(SCRATCH / "avi_exon4_scan.tsv", sep="\t")

    fig, (ax1, ax2) = plt.subplots(
        1,
        2,
        figsize=(13.6, 5.2),
        gridspec_kw={"wspace": 0.28, "width_ratios": [1.15, 1.0]},
    )

    # Panel A: Jittered scatter of all 1,092 MANE stop-gain SNVs
    genes = ["PSEN1", "PSEN2", "APP", "MAPT", "GRN"]
    rng = np.random.default_rng(7)
    for idx, g in enumerate(genes):
        sub = mane[mane["gene_label"] == g]
        sp = sub["fi_MERGED_SPLICING"].values
        jitter = rng.uniform(-0.24, 0.24, size=len(sub))
        is_crypt_edge = (
            sub["has_cryptic_donor_inframe"] | sub["near_canonical_edge"]
        ).values
        is_skip = sub["exon_inframe_skippable"].values & (~is_crypt_edge)
        is_other = (~is_crypt_edge) & (~is_skip)

        ax1.scatter(
            idx + jitter[is_other],
            sp[is_other],
            s=14,
            alpha=0.40,
            color=PALETTE["neutral"],
            edgecolors="none",
            label="Interior canonical-NMD stop-gain" if idx == 0 else None,
        )
        ax1.scatter(
            idx + jitter[is_skip],
            sp[is_skip],
            s=22,
            alpha=0.75,
            color=PALETTE["teal"],
            edgecolors="none",
            label="In-frame skippable exon stop-gain" if idx == 0 else None,
        )
        ax1.scatter(
            idx + jitter[is_crypt_edge],
            sp[is_crypt_edge],
            s=40,
            alpha=0.92,
            color=PALETTE["red_strong"],
            edgecolors="#222222",
            linewidth=0.5,
            zorder=4,
            label="Cryptic donor or <=2 bp exon-edge" if idx == 0 else None,
        )

    ax1.axhline(0.25, color=PALETTE["blue_secondary"], linestyle="--", linewidth=0.95)
    ax1.text(
        -0.45,
        0.265,
        "Splicing >= 0.25 threshold",
        fontsize=8.2,
        color=PALETTE["blue_secondary"],
    )
    ax1.axhline(0.5068, color="#666666", linestyle=":", linewidth=0.9)
    ax1.text(4.42, 0.522, "GRN max = 0.507", fontsize=8.0, color="#444444", ha="right")

    # Annotate select biological landmarks cleanly with non-overlapping coords
    notes = [
        (0, 1.1523, "PSEN1 R308* (Ex9)", (0.36, 1.26)),
        (0, 1.1248, "PSEN1 S102*", (0.36, 1.07)),
        (0, 0.7569, "PSEN1 K109*\n(0.757)", (0.45, 0.80)),
        (0, 0.5266, "PSEN1 Q29*\n(Ex3 -3 donor)", (0.45, 0.61)),
        (1, 1.0947, "PSEN2 W47*", (1.35, 1.14)),
        (2, 1.1596, "APP Y321*", (2.35, 1.19)),
        (3, 1.2237, "MAPT G725*", (3.32, 1.24)),
    ]
    # Note jitter is random per point; find actual x for those exact rows by using center idx for clean pointers
    for gx, gy, txt, (tx, ty) in notes:
        ax1.annotate(
            txt,
            xy=(gx, gy),
            xytext=(tx, ty),
            fontsize=7.6,
            fontweight="bold",
            color="#222222",
            arrowprops=dict(arrowstyle="-", color="#555555", lw=0.7),
            ha="left",
            va="center",
        )

    ax1.set_xticks(range(len(genes)))
    ax1.set_xticklabels(
        [f"{g}\n(n={len(mane[mane['gene_label'] == g])})" for g in genes],
        fontweight="bold",
    )
    ax1.set_xlim(-0.55, 4.75)
    ax1.set_ylim(-0.04, 1.36)
    ax1.set_ylabel("AlphaGenome AVI Splicing Attribution (fi_MERGED_SPLICING)")
    ax1.set_title(
        "A. Pan-Dementia Stop-Gain Splicing Atlas (n = 1,092 SNVs)", loc="left", pad=10
    )
    ax1.legend(loc="upper center", bbox_to_anchor=(0.48, -0.15), ncol=2, fontsize=8.5)

    # Panel B: Exon 4 3' boundary saturation mutagenesis (chr14:73171020-73171055)
    pos_max = (
        ex4_scan.groupby("position")
        .agg(
            max_sp=("fi_MERGED_SPLICING", "max"),
            max_phred=("avi_phred", "max"),
        )
        .reset_index()
    )
    # Annotate exact variant value for K109* (73171034:A>T = 0.7569), S102* (73171014 outside), Q112* (73171043:C>T = 0.0737)
    xs = (
        pos_max["position"].values - 73171047
    )  # 0 = last exonic base of Exon 4! +1 = first intronic G
    ax2.axvspan(
        -24.5,
        -3.5,
        color=PALETTE["green_1"],
        alpha=0.55,
        label="Optimized 22-nt ASO window (avoids +1/+2 GU)",
    )
    ax2.axvline(0.5, color=PALETTE["dark"], linestyle="--", linewidth=1.0)
    ax2.text(0.8, 1.18, "Intron 4 ->", fontsize=8.2, fontweight="bold", color="#222222")
    ax2.text(
        -0.2,
        1.18,
        "<- Exon 4",
        fontsize=8.2,
        fontweight="bold",
        ha="right",
        color="#222222",
    )

    cols_b = [
        PALETTE["red_strong"]
        if p == 73171034
        else (PALETTE["blue_main"] if p <= 73171047 else PALETTE["teal"])
        for p in pos_max["position"]
    ]
    ax2.bar(
        xs,
        pos_max["max_sp"],
        width=0.76,
        color=cols_b,
        edgecolor="#222222",
        linewidth=0.5,
    )

    ax2.annotate(
        "p.K109* (c.325A>T)\nSplicing = 0.757 (Phred 51.3)\nCryptic donor CCG|GTAGGA",
        xy=(-13, 0.757),
        xytext=(-25.5, 0.96),
        fontsize=8.0,
        fontweight="bold",
        color=PALETTE["red_strong"],
        arrowprops=dict(arrowstyle="->", color=PALETTE["red_strong"], lw=1.0),
    )
    ax2.annotate(
        "p.Q112* (0.074)",
        xy=(-4, 0.074),
        xytext=(-10.5, 0.34),
        fontsize=8.0,
        color=PALETTE["blue_main"],
        arrowprops=dict(arrowstyle="->", color=PALETTE["blue_main"], lw=0.8),
    )
    ax2.annotate(
        "Canonical donor\n(+1..+6)",
        xy=(2, 1.151),
        xytext=(-6.0, 1.10),
        fontsize=8.0,
        ha="right",
        color="#222222",
        arrowprops=dict(arrowstyle="->", color="#444444", lw=0.8),
    )

    ax2.set_xlim(-28, 9)
    ax2.set_ylim(0, 1.28)
    ax2.set_xlabel(
        "Position Relative to Exon 4 3' Splice Boundary (nt; 0 = chr14:73171047)"
    )
    ax2.set_ylabel("Max Splicing Attribution per Position")
    ax2.set_title(
        "B. PSEN1 Exon 4–Intron 4 Saturation Scan (108 SNVs)", loc="left", pad=10
    )
    ax2.legend(loc="upper center", bbox_to_anchor=(0.5, -0.15), ncol=1, fontsize=8.8)

    save_fig(fig, "fig2_alphagenome_stopgain_splicing_atlas")


def build_fig3():
    # Load Orthologous Human vs Mouse stats (filtered: abs(len diff)<=15 AND exonic id >= 0.70 for true coding orthologs)
    hm_rows = json.load(
        open(DATA_DIR / "human_mouse_junction_divergence.json", encoding="utf-8")
    )
    matched = [
        r
        for r in hm_rows
        if abs(r["human_len"] - r["mouse_matched_len"]) <= 15
        and r["exon_60bp_identity"] >= 0.70
    ]

    fig, (ax1, ax2) = plt.subplots(
        1,
        2,
        figsize=(13.2, 5.1),
        gridspec_kw={"wspace": 0.35, "width_ratios": [1.05, 1.0]},
    )

    # Panel A: Mechanistic Audit of All 11 ClinVar P/LP pLoF Variants in GoF ADAD Genes (PSEN1=8, PSEN2=3)
    cats = [
        "PSEN1 ΔE9 in-frame\nexon 9 skip (87 bp)",
        "PSEN1 Int4del cryptic\nsplice (c.338+1del)",
        "PSEN1 Notch LoF\n(Acne Inversa c.725del)",
        "PSEN2 in-frame/donor\n(c.886+2_4del, c.356+2T>C)",
        "Putative ACMG PVS1 traps\n(PSEN1 K101*, PSEN2 K115fs)",
    ]
    counts = [5, 1, 1, 2, 2]
    colors = [
        PALETTE["blue_main"],
        PALETTE["blue_secondary"],
        PALETTE["teal"],
        PALETTE["violet"],
        PALETTE["red_strong"],
    ]
    y = np.arange(len(cats))
    bars = ax1.barh(
        y, counts, color=colors, height=0.58, edgecolor="#222222", linewidth=0.8
    )
    annots = [
        "5  (c.869-2A>G/-1G>A/-2A>T/-1G>T, del)",
        "1  (p.L113_I114insT -> AD3)",
        "1  (NOT AD -> Hidradenitis #613737)",
        "2  (Invitae Sherloc LP for AD4)",
        "2  (PSEN1 c.300dup [0 cites]; PSEN2 c.342_343del)",
    ]
    for i, txt in enumerate(annots):
        ax1.text(
            counts[i] + 0.12,
            y[i],
            txt,
            va="center",
            ha="left",
            fontsize=8.6,
            fontweight="bold" if i == 4 else "normal",
            color=PALETTE["red_strong"] if i == 4 else "#222222",
        )

    ax1.set_yticks(y)
    ax1.set_yticklabels(cats, fontweight="bold", fontsize=9.0)
    ax1.invert_yaxis()
    ax1.set_xlim(0, 9.2)
    ax1.set_xticks([0, 1, 2, 3, 4, 5])
    ax1.set_xlabel("ClinVar Pathogenic / Likely Pathogenic pLoF Count")
    ax1.set_title(
        "A. Audit of All 11 ClinVar P/LP pLoF Records in PSEN1/PSEN2",
        loc="left",
        pad=10,
    )

    # Panel B: Paired Human vs Mouse 60-bp Exon-End vs Intron-Start Identity across true coding orthologs
    ex_vals = [r["exon_60bp_identity"] * 100.0 for r in matched]
    in_vals = [r["intron_60bp_identity"] * 100.0 for r in matched]
    for r in matched:
        ev, iv = r["exon_60bp_identity"] * 100.0, r["intron_60bp_identity"] * 100.0
        is_k109 = r["symbol"] == "PSEN1" and r["exon_num"] == 4
        col = PALETTE["red_strong"] if is_k109 else "#999999"
        lw = 2.4 if is_k109 else 0.9
        alp = 1.0 if is_k109 else 0.45
        ax2.plot(
            [0, 1],
            [ev, iv],
            color=col,
            linewidth=lw,
            alpha=alp,
            zorder=4 if is_k109 else 2,
        )
        ax2.scatter(
            [0, 1],
            [ev, iv],
            color=col,
            s=55 if is_k109 else 22,
            zorder=5 if is_k109 else 3,
        )

    # Plot group means cleanly
    m_ex, m_in = float(np.mean(ex_vals)), float(np.mean(in_vals))
    ax2.plot(
        [0, 1],
        [m_ex, m_in],
        color=PALETTE["blue_main"],
        linewidth=3.0,
        marker="D",
        markersize=7,
        zorder=6,
        label=f"Mean across {len(matched)} ortholog junctions ({m_ex:.1f}% -> {m_in:.1f}%)",
    )
    ax2.annotate(
        "PSEN1 Exon 4 (K109*)\n86.7% -> 38.3%",
        xy=(1, 38.3),
        xytext=(0.45, 23.0),
        fontsize=8.5,
        fontweight="bold",
        color=PALETTE["red_strong"],
        arrowprops=dict(arrowstyle="->", color=PALETTE["red_strong"], lw=1.0),
    )

    ax2.set_xticks([0, 1])
    ax2.set_xticklabels(
        ["Exon 3' End (60 bp)", "Intron 5' Start (60 bp)"], fontweight="bold"
    )
    ax2.set_xlim(-0.25, 1.35)
    ax2.set_ylim(15, 105)
    ax2.set_ylabel("Human vs. Mouse Sequence Identity (%)")
    ax2.set_title(
        "B. Orthologous Splice-Junction Divergence Across Hotspots", loc="left", pad=10
    )
    ax2.legend(loc="lower left", fontsize=8.4)

    save_fig(fig, "fig3_pvs1_audit_and_mouse_divergence")


def build_fig4():
    cy = json.load(open(DATA_DIR / "6iyc_hl1_analysis.json", encoding="utf-8"))
    mac = json.load(
        open(DATA_DIR / "macstudio_orthogonal_validation.json", encoding="utf-8")
    )

    fig, axes = plt.subplots(
        1,
        3,
        figsize=(16.5, 5.1),
        gridspec_kw={"wspace": 0.44, "width_ratios": [1.1, 1.0, 1.1]},
    )
    ax1, ax2, ax3 = axes

    # Panel A: PDB 6IYC HL1 Contact Profile (104-125)
    hl1 = [r for r in cy["hl1_per_residue"] if 104 <= r["resno"] <= 125]
    rnos = [r["resno"] for r in hl1]
    d_app = [r["nearest_APP"][0][0] for r in hl1]
    d_nct = [r["nearest_NCT"][0][0] for r in hl1]

    ax1.axvspan(
        108.6,
        113.4,
        color=PALETTE["red_1"],
        alpha=0.65,
        label="Deleted in K109_L113del (14.0 A R108-I114 span)",
    )
    ax1.plot(
        rnos,
        d_app,
        color=PALETTE["blue_main"],
        marker="o",
        markersize=4.5,
        linewidth=2.0,
        label="Min dist to APP-C83",
    )
    ax1.plot(
        rnos,
        d_nct,
        color=PALETTE["teal"],
        marker="s",
        markersize=4.0,
        linewidth=1.6,
        linestyle="--",
        label="Min dist to Nicastrin",
    )
    ax1.axhline(5.0, color="#666666", linestyle=":", linewidth=0.9)

    ax1.annotate(
        "I114-APP V20\n(3.77 A)",
        xy=(114, 3.77),
        xytext=(116.0, 2.2),
        fontsize=8.0,
        fontweight="bold",
        color=PALETTE["blue_main"],
        arrowprops=dict(arrowstyle="->", color=PALETTE["blue_main"], lw=0.9),
    )
    ax1.annotate(
        "D110-APP E6\n(4.54 A)",
        xy=(110, 4.54),
        xytext=(104.5, 1.8),
        fontsize=7.8,
        fontweight="bold",
        color=PALETTE["red_strong"],
        arrowprops=dict(arrowstyle="->", color=PALETTE["red_strong"], lw=0.9),
    )
    ax1.annotate(
        "R108-NCT K654\n(4.18 A)",
        xy=(108, 4.18),
        xytext=(104.2, 13.5),
        fontsize=7.8,
        color=PALETTE["teal"],
        arrowprops=dict(arrowstyle="->", color=PALETTE["teal"], lw=0.9),
    )

    ax1.set_xlim(103.5, 125.5)
    ax1.set_ylim(0, 24.5)
    ax1.set_xlabel("PSEN1 HL1 Residue Number (PDB: 6IYC Chain B)")
    ax1.set_ylabel("Minimum Heavy-Atom Distance (A)")
    ax1.set_title("A. 6IYC Cryo-EM Substrate & NCT Latch", loc="left", pad=10)
    ax1.legend(loc="upper left", fontsize=7.8)

    # Panel B: Mac Studio M4 Max MPS ESM-2 Embedding Shift L2
    panel = mac["deletion_panel"]
    rand5 = [
        x["esm2_embedding_l2_shift"]
        for x in panel
        if x["category"] == "psen1_random_5aa_null"
    ]
    key_items = [x for x in panel if x["category"] != "psen1_random_5aa_null"]
    short_b = {
        "PSEN1_p.K109*_del": "PSEN1 K109del",
        "PSEN1_p.Q112*_del": "PSEN1 Q112del",
        "PSEN1_p.Y181*_del": "PSEN1 Y181del",
        "PSEN2_p.K115*_del": "PSEN2 K115del",
        "APP_p.E202*_del": "APP E202del",
        "APP_p.E203*_del": "APP E203del",
        "PSEN1_Exon9_skip": "PSEN1 ΔEx9",
    }
    labels_b = [short_b.get(x["id"], x["id"]) for x in key_items] + ["PSEN1 5-aa null"]
    vals_b = [x["esm2_embedding_l2_shift"] for x in key_items] + [float(np.mean(rand5))]
    errs_b = [0.0] * len(key_items) + [float(np.std(rand5))]
    cols_b = [
        PALETTE["red_strong"]
        if "K109" in x["id"]
        else (
            PALETTE["blue_secondary"]
            if x["category"] == "cryptic_donor_deletion"
            else PALETTE["teal"]
        )
        for x in key_items
    ] + [PALETTE["neutral"]]

    xb = np.arange(len(labels_b))
    ax2.bar(
        xb,
        vals_b,
        yerr=errs_b,
        capsize=3.5,
        color=cols_b,
        width=0.62,
        edgecolor="#222222",
        linewidth=0.7,
    )
    ax2.annotate(
        "5th percentile\n(fold tolerated!)",
        xy=(0, vals_b[0]),
        xytext=(0.4, 0.145),
        fontsize=8.0,
        fontweight="bold",
        color=PALETTE["red_strong"],
        arrowprops=dict(arrowstyle="->", color=PALETTE["red_strong"], lw=0.9),
    )
    ax2.set_xticks(xb)
    ax2.set_xticklabels(labels_b, fontsize=8.0, rotation=34, ha="right")
    ax2.set_ylim(0, 0.29)
    ax2.set_ylabel("ESM-2 Embedding L2 Shift")
    ax2.set_title("B. Mac Studio MPS ESM-2 Shift", loc="left", pad=10)

    # Panel C: SantaLucia ASO Thermodynamic Selectivity vs Splicing Signal
    asos = mac["aso_optimization"]
    sp_vals = [a["fi_MERGED_SPLICING"] for a in asos]
    ddg_vals = [a["optimal_aso"]["ddG_selectivity_kcal"] for a in asos]
    dg_abs = [abs(a["optimal_aso"]["mut_dG37"]) for a in asos]
    avoids = [a["optimal_aso"]["avoids_canonical_donor_GU"] for a in asos]

    for a, sp, ddg, dga, av in zip(asos, sp_vals, ddg_vals, dg_abs, avoids):
        c = PALETTE["blue_main"] if av else PALETTE["neutral"]
        if a["variant"] == "chr14:73171034:A>T":
            c = PALETTE["red_strong"]
        ax3.scatter(
            sp,
            ddg,
            s=dga * 1.8,
            color=c,
            alpha=0.88,
            edgecolors="#222222",
            linewidth=0.6,
        )

    # Clean legend markers
    ax3.scatter(
        [],
        [],
        s=70,
        color=PALETTE["red_strong"],
        edgecolors="#222222",
        label="PSEN1 K109* lead ASO",
    )
    ax3.scatter(
        [],
        [],
        s=70,
        color=PALETTE["blue_main"],
        edgecolors="#222222",
        label="Avoids canonical GU donor",
    )
    ax3.scatter(
        [],
        [],
        s=70,
        color=PALETTE["neutral"],
        edgecolors="#222222",
        label="Overlaps canonical GU",
    )

    ann_asos = [
        ("chr14:73171034:A>T", "PSEN1 K109* (+3.63)", (0.60, 2.02)),
        ("chr14:73171014:C>G", "PSEN1 S102*", (0.28, 4.55)),
        ("chr14:73206439:A>T", "PSEN1 R308*", (0.93, 2.72)),
        ("chr21:26000085:G>C", "APP Y321* (+4.31)", (0.82, 4.70)),
        ("chr1:226883906:A>T", "PSEN2 K115* (+3.62)", (0.04, 2.72)),
    ]
    for v_id, txt, (tx, ty) in ann_asos:
        hit = next(x for x in asos if x["variant"] == v_id)
        ax3.annotate(
            txt,
            xy=(hit["fi_MERGED_SPLICING"], hit["optimal_aso"]["ddG_selectivity_kcal"]),
            xytext=(tx, ty),
            fontsize=7.6,
            fontweight="bold" if "K109" in txt else "normal",
            color=PALETTE["red_strong"] if "K109" in txt else "#222222",
            arrowprops=dict(arrowstyle="-", color="#555555", lw=0.7),
        )

    ax3.axhline(
        2.5, color=PALETTE["blue_secondary"], linestyle="--", linewidth=0.9, alpha=0.7
    )
    ax3.set_xlim(-0.04, 1.32)
    ax3.set_ylim(-1.6, 5.0)
    ax3.set_xlabel("AlphaGenome Splicing Attribution")
    ax3.set_ylabel("SantaLucia ASO Allele Selectivity ddG (WT - Mut, kcal/mol)")
    ax3.set_title("C. Allele-Selective Steric ASO Design", loc="left", pad=10)
    ax3.legend(loc="lower right", fontsize=7.8)

    save_fig(fig, "fig4_structure_6iyc_and_aso_thermodynamics")


def main():
    apply_style()
    build_fig1()
    build_fig2()
    build_fig3()
    build_fig4()


if __name__ == "__main__":
    main()
