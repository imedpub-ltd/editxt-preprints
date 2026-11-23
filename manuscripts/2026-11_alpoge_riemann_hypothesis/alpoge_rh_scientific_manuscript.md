# Independent Formal Verification, Epistemic Spine Cartography, and Comparative Auditing of Riemann Hypothesis Proof Claims

**Author:** Manuel Menéndez-González  
**Affiliation:** Fundación de Neurociencias, Oviedo, Spain  
**Public Verification Dossier:** <https://github.com/Fundacion-de-Neurociencias/riemann-hypothesis-audit-dossier>  
**Automated Verification Platform:** CoResearcher (<https://github.com/Fundacion-de-Neurociencias/coresearcher>)

---

## Abstract

We report an independent computational verification, cryptographic provenance audit, deductive dependency cartography, and comparative manuscript evaluation of two contemporary claims addressing the Riemann Hypothesis (RH) and Generalized Riemann Hypothesis (GRH): (i) Levent Alpöge's AI-assisted Lean 4 formalization comprising `175,187` modules (`17,374,215` lines), and (ii) Alessandro Maria Masullo's `940`-page informal human manuscript. Compiled from source on an independent Apple M4 Max system (16-core ARM64, 64 GB unified memory) under Lean `v4.33.1`, `lake build Main` completed deterministically with `exit_code = 0` in `127,812` seconds (~35.5 hours), producing `183,889` `.olean` binary artifacts. Axiom tracing (`#print axioms`) over all five exported root theorems—anchored cleanly in canonical `Mathlib` definitions (`RiemannHypothesis` and `DirichletCharacter.LFunction`) across an external statement trusted computing base of only `28` lines ($R_{\text{TCB}} = 1.62 \times 10^{-6}$)—confirmed zero `sorry` placeholders, zero custom axioms, and exclusive reliance on `[propext, Classical.choice, Quot.sound]`. Conversely, forensic segmentation of the `940`-page informal draft uncovered a blocking deductive gap in Chapter 13 (stub sections `13.1`–`13.2` and an empty conclusive `Theorem 13.3.1.2`), alongside `19` unresolved cross-references and `10` draft placeholders. Graph-theoretic dependency analysis across the `818,755` formal theorems and lemmas locates the structural bottleneck at deductive depths `6`–`7` within `ReciprocityTheory` (`UniformisationConclusion`, fan-in `2,390`, `2,379` cross-layer shortcut arcs) and identifies six recurring mathematical engines led by unitary theta-lift chains and Galois modularity patching (`109,260` modules). Interpreting both artifacts through the Epistemia framework (`arXiv:2512.19466`) and resource-rational cognitive science (Griffiths, *The Laws of Thought*), we show why machine-checked validity (`VALID_OPAQUE`, Epistemia risk `0.245`) and human mathematical comprehension decouple orthogonally—and document transparent verification limits where independent second-kernel replay (`nanoda`) exceeded 64 GB single-threaded export budgets.

---

## 1. Introduction

On November 20, 2026, mathematics witnessed an acute epistemic divergence. Levent Alpöge publicly released a compressed Lean 4 codebase (<https://alpo.ge/>) asserting unconditional formal proofs of the Riemann Hypothesis and the Generalized Riemann Hypothesis for Dirichlet $L$-functions developed iteratively with Claude, accompanied by a four-page note acknowledging that prose expansion exceeded `250,000` pages. On the same day, Ravi Vakil posted a hurried announcement of Alessandro Maria Masullo's twelve-year, `940`-page human LaTeX manuscript proposing a spectral trace-formula proof of GRH for general Hecke $L$-functions (<https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/>).

This juxtaposition frames a central metascientific problem articulated by Quattrociocchi, Capraro, and Perc (`arXiv:2512.19466`) and grounded computationally by Griffiths (2026): classical mathematical peer review implicitly assumes that *deductive validity* and *human surveyability* move together. A multi-million-line formal corpus shatters that assumption, demanding an eight-gate verification protocol capable of separately certifying cryptographic provenance, statement fidelity, reference kernel compilation, informal manuscript completeness, and structural comprehensibility.

---

## 2. Cryptographic Provenance and Static Soundness Audit

### 2.1. Bit-Exact Input Pinning
Every primary source artifact was retrieved from public origins and verified locally by SHA-256 checksum:
- **Formal Archive (`https://alpo.ge/`, `lean.tar.gz`):** `239,275,554` bytes, SHA-256 `9631b4f020199e580ba86178cb56c6e9b09f690c2369a80dc4334aa93f49c7fc`, bit-identical against the public mirror `https://github.com/jsmorph/rh`.
- **Accompanying Note (`remark.pdf`):** `245,114` bytes, SHA-256 `3fc97784b71ddd44ff8aa0a177e99622a1c61b13cfa843a0989ee4a7a0cfeb8d`.
- **Root Specification Files:** `lean/src/Statements.lean` (`16` lines, SHA-256 `79ef7ca776e42abe1f46caee13ea09bd19f1e2d0b1620d8d5d200258f33b47bf`) and `lean/src/Main.lean` (`12` lines, SHA-256 `017645ca448f2fd1f6fd5c4c2cb2c6e96e472725be13f6e180ca6e1574360939`), verified identical between the original tarball and the compilation workspace.
- **Pinned Environment:** `leanprover/lean4:v4.33.1` with `Mathlib` revision `0df444a360eaa60ab8c11dca51a86af692955474`.
- **Informal Draft (`the-music-of-the-primes.pdf`):** `6,756,996` bytes (`940` pages, compiled with `pdfTeX-1.40.25`), SHA-256 `e039d3f6cf0a4b14f03c7edb85097752dd65c0a2fe543c76fe992be234f97bf`.

### 2.2. Full-Archive Static Soundness Inventory
Exhaustive streaming lexical analysis across all `175,190` archive files (`175,187` `.lean` sources totaling `17,374,215` lines and `1,030,531,854` bytes) recorded:
- `784,092` `theorem` declarations, `34,663` `lemma` declarations (`818,755` total), `212,819` `def`, `13,202` `abbrev`, `8,286` `structure`, `4,581` `instance`, `121` `inductive`, and `43` `class` declarations.
- **0** missing local imports across the full Unicode module graph, with `174,767` `.lean` files (`99.76%`, `17,330,139` lines) statically reachable from `Main.lean` and only `420` pruned deadweight files (`0.24%`).
- **0** custom `axiom`, `sorry`/`sorryAx`/`admit`, `native_decide`, `unsafe`, `@[implemented_by]`, `@[extern]`, `@[csimp]`, `opaque`, `debug.skipKernelTC`, or `addDeclWithoutChecking` hazards.
- Five calls to `Lean.modifyEnv` in `BuildAid/D1.lean`..`D5.lean` alter only `LibrarySuggestions.nameDenyListExt` (tactic search hints), and three metaprogramming helpers (`Imports.lean`, `OwnStruct.lean`, `CutCptCopy.lean`) invoke kernel-checked `Lean.addDecl`. Two `partial def` declarations exist exclusively inside metaprogramming helpers (`CutCptCopy.go`, `OwnStruct.copyAt`), never within mathematical theorem objects.

### 2.3. Statement Fidelity & Trusted Computing Base Ratio
Human auditability of *what* was proved concentrates in a minimal `28`-line external statement TCB (`Statements.lean` + `Main.lean`), giving $R_{\text{TCB}} = 1.62 \times 10^{-6}$ relative to the `17,330,139`-line active cone. Auditing total-function edge cases (`⁻¹`, `/`, `^`) reveals `0` open hazards in `Statements.lean` and `Main.lean`, while intermediate character-group inverses and prime-power bases in `CritLine.lean` and `ClaimStrip.lean` operate safely under explicit `p.Prime` guards and group inversion (never field division by zero). Semantic comparison confirms exact alignment for `DirichletLZerosOnLine` and `DirichletLNonvanishingRightOfHalf` and notes that Mathlib's `RiemannHypothesis` quantifies over $\mathbb{C} \setminus \{1, -2, -4, \dots\}$ (stronger as a standalone predicate than the critical strip $0 < \operatorname{Re}(s) < 1$, and classically equivalent via the functional equation and $\operatorname{Re}(s) \ge 1$ non-vanishing proved in `ClaimStrip.lean`). Two auxiliary `def LFunction` declarations reside inside isolated local namespaces (`GJLocalZeta`, `HeckeLFunction`) without shadowing `DirichletCharacter.LFunction`.

---

## 3. Independent Compilation, Axiom Audit, and Verification Limits

### 3.1. Reference Hardware Compilation Results
Clean compilation was executed independently on an **Apple M4 Max (16-core ARM64, 64 GB unified memory, macOS Darwin 25.5.0)** under `leanprover/lean4:v4.33.1`:
- **`lake build Statements`:** `exit_code = 0` in `31` seconds.
- **`lake build Main`:** `exit_code = 0` in **`127,812` seconds** (`35 h 30 min 12 s`), compiling `175,187 / 175,187` project modules (`183,889` `.olean` files total including cached `Mathlib` units, `98 GB` build footprint).
- **`#print axioms` Verification (`110` seconds, `exit_code = 0`):** Output captured verbatim in `certificates/alpoge_rh_axioms.log` (SHA-256 `590d5252e7e5a4e6d9faef1895216c77eb103d6667037d832eaedaa34fa3186d`). All five exported root theorems—`riemannHypothesis`, `riemannZeta_eq_zero_re`, `LFunction_ne_zero_of_half_lt_re`, `LFunction_eq_zero_re`, and `LFunction_eq_zero_re_of_isPrimitive`—depend strictly on:
  ```text
  [propext, Classical.choice, Quot.sound]
  ```

### 3.2. Transparent Boundaries & Open Escalation Gates
Scientific honesty requires stating explicitly what this verification **does not yet establish**:
1. **Single-Kernel Reliance & `--fresh` Escalation:** Running bundled `lake env leanchecker Main` returned `exit_code = 0`, checking `Main.lean` against precompiled `.olean` imports, but as documented in Lean `v4.33.1`'s source, default `leanchecker` detects environment hacking using Lean's own kernel rather than serving as an independent second-kernel implementation. Full transitive replay (`lake env leanchecker --fresh Main`) has been launched asynchronously to verify fresh import elaboration from clean state.
2. **Independent Second-Kernel Timeout/Resource Bottleneck:** We compiled both Rust external verifier `nanoda_bin` and `lean4export` against Lean `v4.33.1`. However, single-threaded NDJSON export via `lean4export Main` grew to `46.47 GB` on a 64 GB host, triggering virtual memory thrashing before reaching EOF. External second-kernel checking (`nanoda` or `lean4lean`) therefore remains open and will require either higher-RAM hardware or sharded declaration export.
3. **Unformalized Extrapolation to ERH:** While `remark.pdf` anticipates extension to the Extended Riemann Hypothesis (ERH), only RH and Dirichlet GRH are formalized in `Statements.lean` and verified in `Main.lean`.

---

## 4. Deductive Spine Cartography and Six Barrier-Breaking Motifs

To counteract the cognitive opacity of `17.37` million formal lines, topological dependency mining reconstructed the library strata and cross-layer bottlenecks:

| Library | Modules | Theorems/Lemmas | Depth Range | Primary Role |
| :--- | ---: | ---: | :---: | :--- |
| `Main` / `Statements` / `Supplements` | 5 | 9 | 0–3 | Root theorem exports and Mathlib-anchored targets |
| `Development` | 141,928 | 562,329 | 2–43 | Abelian/automorphic schemes, Weil bounds, Galois modularity, theta lifts |
| `Formalism` | 18,254 | 162,118 | 4–43 | Hermitian curvature, mass formulas, period integrals, Gamma factors |
| `GroundTheory` | 8,507 | 54,211 | 5–32 | Local/global fields, Tate thesis, Arakelov heights, $p$-adic Hodge theory |
| `ReciprocityTheory` | 3,845 | 27,722 | 6–36 | Reductive groups, birational geometry, toroidal compactification, descent |
| `CompanionTheory` | 2,027 | 9,419 | 5–30 | Unitary $p$-adic weights, product formulas, Pieri rules |
| `PositivityTheory` | 449 | 2,702 | 6–13 | Automorphic positivity functionals and nonvanishing criteria |
| `Lemmata` / `BuildAid` | 172 | 245 | 8–25 | Auxiliary lemmas and inert tactic denylists |

Rather than forming an unstructured graph, the dependency cone contracts sharply at **deductive depths 6–7** inside `ReciprocityTheory`. The top cross-layer pivot is `ReciprocityTheory.ReductiveGroups.ArithmeticGeometry.BirationalGeometry.ToroidalCompactification.UniformisationConclusion` (`depth = 6`, `in_degree = 2,390`, `2,379` cross-layer arcs, `0` theorems), alongside `ExtensionDescent.UnifUniqSt` (`in_degree = 2,284`, `2,283` cross-layer arcs). Source inspection shows `UniformisationConclusion.lean` couples CM-field involutions (`IsCMField E`, `Host.starRing`), group-object ring actions (`OAct`), semiabelian degeneration data (`Out.DegPre`), twisted trace forms (`TraceFormTwistIso`), and boundary unit criteria (`PsiUnitOn`, `GtAct`), acting as the geometric interface tying foundational schemes to downstream positivity proofs.

Empirical clustering across the active cone quantifies six barrier-breaking mathematical families:
1. **Galois Modularity & Cohomological Patching (`109,260` modules):** Bypasses elementary-method insufficiency via étale/$p$-adic Hodge comparisons, discrete series congruences, and Taylor–Wiles patching (`DenseThresholdCases`, `CrystallineSmoothLiftOfRelations`).
2. **Iterated Unitary Theta-Lift Chains (`15,750` modules):** Bypasses contour convexity/parity ceilings by chaining unitary theta lifts $U(X_0) \to \dots \to U(X_m)$ ($m \sim \sqrt{X}$) to simulate differential multiplicity natively over $\mathbb{Z}$.
3. **Bost Slope & Arakelov–Iwasawa Descent (`13,010` modules):** Bypasses unbounded height growth via Bost's slope inequality, a Behrend-chosen Iwasawa tower, and weakened Vandiver control (`GlobalArtinReciprocityHolds`, `HermitianHassePrinciple`).
4. **Guinand–Weil Explicit Formula & GGP/Bessel Positivity (`7,011` modules):** Bypasses local sign-indefiniteness by certifying explicit test functionals $W(\cdot) \ge 0$ via determinants and Rallis *seesaw* Bessel periods (`DeligneRibetHolds`, `PositivityTheory...AdFormOf`).
5. **Siegel Mass & Chowla–Selberg Divisibility (`4,618` modules):** Bypasses class-number denominator explosion via unitary Siegel mass formulas and graded Weyl module dominance (`DualWeylDominanceOf`).
6. **Stepanov Multiplicity Determinants & Rigidity (`1,808` modules):** Bypasses pointwise off-line zero bounds using multiplicity-one rigidity and Gelfand–Kazhdan duality (`GelfandKazhdanDualOfRigidity`, `StrongMultiplicityOne`).

---

## 5. Comparative Forensic Evaluation of Formal and Informal Proof Submissions

While the Lean corpus discharges every dependency syntactically (`0` `sorry`, `exit_code = 0`), auditing Masullo's `940`-page informal manuscript reveals the exact mirror-image failure mode. Although Chapters 1–12 develop Hardy–Sobolev spaces $W_I^{s,2}(G)$, periodic Schauder bases, and quotient stacks toward a trace formula (`Theorem 12.5.1.1`, p. 519), structural parsing uncovers **critical incompleteness in the conclusive chapters**:
- In Section `12.4.1` (pp. 514–515), author footnote 2 leaves a placeholder instruction to revise the $(\lambda, \varepsilon)$-cutoff and re-establish convergence of integral `(12.4.1.23)`.
- **Chapter 13 (*Zeros of Hecke L-functions*, pp. 521–522)** has empty stub headings for Sections `13.1` and `13.2`, references a nonexistent `"Theorem ??"`, and leaves the core bridge—**`Theorem 13.3.1.2 (Divisor of L(s, χ))`**—completely empty beneath footnotes `"2 Insert statement."` and `"3 State and prove the Main Theorems..."`.
- Across the `940` pages, forensic indexing located `19` broken `??` cross-references, `10` author draft TODO notes, and `13` empty/near-empty pages (`<400` characters). Without rigorous closure of the Montel limit interchange deducing $L'_f / L_f$ holomorphy from the regularized trace formula, the informal proof remains analytically open (`CLAIMED`, Epistemia risk `0.850`, verdict `SUSPEND_JUDGMENT`).

---

## 6. Epistemic Governance and Cognitive Metascience Implications

Evaluated through Quattrociocchi, Capraro & Perc (`arXiv:2512.19466`) and Griffiths (2026), these results expose two distinct epistemic regimes:
- **Machine-Without-Comprehension (`VALID_OPAQUE`, Epistemia risk `0.245`):** Alpöge's five formalized RH/GRH theorems clear single-kernel verification on a tiny `28`-line TCB (`R_TCB = 1.62e-6`), yet `17.37` million lines of proof exceed bounded human verification budgets (`ParsingAndComprehensionFault`). When evaluated as a full package including unformalized ERH prose expectations, epistemic governance enforces `SUSPEND_JUDGMENT` (Epistemia risk `0.4075`).
- **Intuition-Without-Convergence (`SUSPEND_JUDGMENT`, Epistemia risk `0.850`):** Masullo's manuscript provides human-surveyable intuition while lacking conclusive theorem proofs in Chapter 13.

In Griffiths' Marr-level cognitive framework, human scientists operate under resource-rational constraints, reasoning with compact representations (such as the six abstracted mathematical motifs and the `UniformisationConclusion` bottleneck hub) rather than millions of micro-rewrites. By pairing formal kernel certification with topological spine extraction and explicit **Contestability Cards**, autonomous scientific auditing preserves rigorous falsifiability without demanding super-human reading capacity.

---

## 7. Data and Code Availability

All primary cryptographic digests, reference hardware compilation records, raw `#print axioms` logs (`SHA-256: 590d5252...`), static soundness counts, stratified dependency spine summaries, interactive D3 explorer (`epistemic_spine_explorer.html`), and comparative forensic inventories for both targets are openly archived in the public verification dossier at <https://github.com/Fundacion-de-Neurociencias/riemann-hypothesis-audit-dossier>. Automated end-to-end execution of multi-gate scientific auditing is provided through **CoResearcher** at <https://github.com/Fundacion-de-Neurociencias/coresearcher>. Both repositories are publicly accessible without authentication.

---

## References

1. Alpöge, L. (2026). Formal Lean 4 Repository and Explanatory Remark on the Riemann Hypothesis and Generalized Riemann Hypothesis. <https://alpo.ge/> (Bit-exact community mirror: <https://github.com/jsmorph/rh>).
2. Griffiths, T. (2026). *The Laws of Thought: The Quest for a Mathematical Theory of the Mind*. Henry Holt and Co., ISBN `978-1250358356`.
3. Quattrociocchi, W., Capraro, V., & Perc, M. (2025). Epistemological Fault Lines Between Human and Artificial Intelligence. `arXiv:2512.19466` (<https://arxiv.org/abs/2512.19466>).
4. Vakil, R. (2026). Hurried Announcement: Alessandro Masullo GRH, linking Masullo, A. M., *The Music of the Primes*. <https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/>.
5. Menéndez-González, M. & Fundación de Neurociencias (2026). CoResearcher: An Open System for Coordinating Scientific Work Between Humans and AI Agents. <https://github.com/Fundacion-de-Neurociencias/coresearcher>.
