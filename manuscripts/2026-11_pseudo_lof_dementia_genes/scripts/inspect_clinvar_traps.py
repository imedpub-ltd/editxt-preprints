import json
from pathlib import Path

D = Path(
    r"c:\Users\usuario\Neurodiagnoses Ecosystem\neurodiagnoses-monorepo\docs\manuscript_submission\2026-11_pseudo_lof_dementia_genes\data"
)
cv = json.load(open(D / "gnomad_clinvar_five_gene_audit.json", encoding="utf-8"))[
    "clinvar"
]
ev = json.load(open(D / "clinvar_gof_gene_plof_evidence.json", encoding="utf-8"))

for g in ["PSEN1", "PSEN2", "APP", "MAPT"]:
    pl = cv[g]["plof_pathogenic_records"]
    inf = cv[g]["inframe_pathogenic_records"]
    print(f"=== {g} ClinVar P/LP pLoF ({len(pl)}) & In-Frame ({len(inf)}) ===")
    for r in pl:
        vid = str(r["variant_id"])
        e = ev.get(vid, {})
        subs = [
            (
                s.get("submitter_name"),
                s.get("classification"),
                s.get("assertion_criteria"),
                s.get("date_last_evaluated"),
            )
            for s in (e.get("submissions") or [])
        ]
        cits = e.get("citation_references") or []
        print(
            f"  [pLoF] ID={vid} | {r['clinical_significance']} | {r['title']} | phen={r['phenotypes']} | cites={cits[:4]} | subs={subs}"
        )
    for r in inf:
        print(
            f"  [inframe] ID={r['variant_id']} | {r['clinical_significance']} | {r['title']} | phen={r['phenotypes']}"
        )
