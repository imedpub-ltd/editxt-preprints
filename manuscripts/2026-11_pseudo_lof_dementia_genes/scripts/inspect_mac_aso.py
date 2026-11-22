import json
from pathlib import Path

D = Path(
    r"c:\Users\usuario\Neurodiagnoses Ecosystem\neurodiagnoses-monorepo\docs\manuscript_submission\2026-11_pseudo_lof_dementia_genes\data"
)
m = json.load(open(D / "macstudio_orthogonal_validation.json", encoding="utf-8"))
print("ESM2 status:", m["esm2_status"])
print("Perm stats:", m["permutation_summary"])
print("\n=== DELETION PANEL ===")
for p in m["deletion_panel"][:8]:
    print(
        f"  {p['id']:25s} | del={p['deleted_seq']:12s} ({p['del_len']:2d}aa) | KD={p['deleted_mean_kd']:+5.2f} chg={p['deleted_net_charge']:+d} | "
        f"dPLL={p.get('esm2_delta_pll'):+.5f} | L2={p.get('esm2_embedding_l2_shift'):.4f} | flankPLL={p.get('esm2_flank10_mut_pll'):.4f}"
    )

print("\n=== ALL OPTIMIZED ASOs ===")
for a in m["aso_optimization"]:
    op = a["optimal_aso"]
    print(
        f"  {a['gene_label']:10s} {a['variant']:22s} {a['hgvs_p']:7s} | Sp={a['fi_MERGED_SPLICING']:.4f} crypt={str(a['has_cryptic_donor_inframe']):5s} | "
        f"ASO({op['length']}nt)={op['aso_5_to_3_rna']} | mut_dG={op['mut_dG37']:6.2f} wt_dG={op['wt_dG37']:6.2f} "
        f"ddG={op['ddG_selectivity_kcal']:+5.2f} dTm={op['dTm_C']:+5.1f}C avoids_GU={op['avoids_canonical_donor_GU']} stem={op['max_self_comp_bp']}"
    )
