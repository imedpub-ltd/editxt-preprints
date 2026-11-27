# Independent Formal Verification, Epistemic Spine Cartography, and Comparative Auditing of Riemann Hypothesis Proof Claims

**Author:** Manuel Menéndez-González  
**Version:** Preprint v1.4 (2026-11-27)  
**Public Verification Dossier:** <https://github.com/Fundacion-de-Neurociencias/riemann-hypothesis-audit-dossier>  
**Automated Verification Platform:** CoResearcher (<https://github.com/Fundacion-de-Neurociencias/coresearcher>)

---

## Abstract

We report an independent computational verification, transitive fresh-environment kernel replay, cryptographic provenance audit, self-contained statement-fidelity inspection, non-exclusive dependency-graph cartography, and comparative epistemological analysis of two contemporary claims addressing the Riemann Hypothesis (RH) and Generalized Riemann Hypothesis (GRH): (i) Levent Alpöge's AI-assisted Lean 4 formalization comprising `175,187` modules (`17,374,215` lines), and (ii) Alessandro Maria Masullo's `940`-page unfinished informal human manuscript. Compiled from source on an independent Apple M4 Max workstation (16-core ARM64, 64 GB unified memory) under Lean `v4.33.1`, `lake build` completed deterministically with clean exit status in `127,812` seconds (~35.5 hours), producing `183,889` `.olean` binary artifacts (`98 GB` build footprint). Transitive fresh-environment replay via `lake env leanchecker --fresh` completed independently in `26,898` seconds (`7 h 28 min 18 s`, zero exit status), ruling out binary corruption, environment manipulation, and metaprogramming bypasses across all imported and exported declarations. We reproduce verbatim both the complete `28`-line external statement specification (anchored cleanly in canonical `Mathlib` definitions `RiemannHypothesis` and `DirichletCharacter.LFunction`; specification-to-proof ratio $1.62 \times 10^{-6}$) and the raw `#print axioms` output confirming exclusive reliance on `[propext, Classical.choice, Quot.sound]` with zero `sorry` placeholders or custom axioms, alongside the concrete module identities of every isolated auxiliary construct. Graph-theoretic dependency mapping across `818,755` formal theorems and lemmas distinguishes `0`-theorem syntactic interface hubs (led by `UniformisationConclusion`, depth `6`, fan-in `2,390`) from theorem-bearing bottlenecks and applies a transparent, non-exclusive keyword-indexing rule across module paths and initial theorem headers to index six recurring mathematical families. Conversely, forensic parsing of the `940`-page informal draft provides an illustrative contrast with an unclosed human manuscript containing stub sections `13.1`–`13.2`, an empty conclusive Theorem `13.3.1.2`, `19` unresolved cross-references, and `10` author draft placeholders. We formulate explicitly a parametrized, normative Epistemia risk index ($E_I = \operatorname{clip}_{[0,1]}(0.45\,G_{\text{fluency}} + 0.35\,D_{\text{cost}} + 0.20\,U_{\text{supp}})$, threshold $\tau_E = 0.35$) and prove rank-order invariance across monotone weight perturbations (`0.2450 < 0.4075 < 0.8500`). Cross-auditing a public community prose reconstruction (`RH-Alpoge-Reconstruction`, commit `b50dae1`) against our Phase 1 spine further reveals strong convergence on core arithmetic-geometry bottlenecks alongside quantitative distillation gaps (`148` passage-ledger rows pinning `60` passages to `114` declarations cleanly against `40e56ba`, `12/453` [`2.65%`] total and `8/345` [`2.32%`] proof-bearing statements linked, `0` direct ledger rows in `ReciprocityTheory`, `12/12` residual packages in `MECHANISM_PACKAGED`, `29` explicit omissions, `0/20` priority literature-boundary items fully reconciled, and a pending refactor-equivalence check onto `lsernau/grh-lean`). Finally, we document how a 64 GB workstation encounters a `46.47 GB` virtual-memory wall prior to the externally reported `61.57 GB` flat NDJSON serialization size, how module-by-module `.olean` replay with `lean4lean` (`67f63b0c`) closes all `175,187 / 175,187` project modules (`1,927,488` declarations, `0` failures in `204,972.82` s) under explicitly bounded precompiled-`Mathlib` and elevated-fuel assumptions (`17` escalated modules enumerated in full), and extract six methodological safeguards for automated auditing pipelines.

---

## 1. Introduction

On November 20, 2026, mathematical publishing confronted a sharp divergence in proof scale and human surveyability. Levent Alpöge publicly released a compressed Lean 4 codebase (<https://alpo.ge/>) asserting unconditional formal proofs of the Riemann Hypothesis and the Generalized Riemann Hypothesis for Dirichlet $L$-functions developed iteratively with Claude, accompanied by a four-page note noting that unfiltered prose expansion exceeded `250,000` pages. On the same day, Ravi Vakil posted a "hurried announcement" linking Alessandro Maria Masullo's twelve-year, `940`-page human LaTeX draft proposing a spectral trace-formula proof of GRH for general Hecke $L$-functions (<https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/>).

This juxtaposition illustrates a central metascientific tension highlighted by Quattrociocchi, Capraro, and Perc (`arXiv:2512.19466`) and grounded computationally by Griffiths (2026): classical mathematical peer review implicitly assumes that *deductive validity* and *human surveyability* move together. A `17.37`-million-line formal corpus breaks that assumption. Addressing it requires more than reporting a compiler exit code; it demands a dual scientific contribution:
1. **Self-Contained Multi-Stage Auditing:** Independently certifying cryptographic provenance, macro-resistant kernel compilation, transitive fresh-environment replay, bounded-RAM module replay (with complete disclosure of trust boundaries and fuel escalations), literal printing of the root statement specification and axiom trace, and verifiable structural completeness checks.
2. **Cognitive and Conceptual Translation:** Explaining clearly *what* the Riemann Hypothesis signifies, *how* asymmetric formal verification anchors trust without requiring line-by-line inspection of `17.37` million lines, *what* structural motifs dominate the dependency graph, and *why* formal certification separates Phase 1 (machine checking) from Phase 2 (human understanding).

---

## 2. What the Riemann Hypothesis Means: Deterministic Cancellation and Combinatorial Necessity

Before auditing seventeen million lines of formal code, clarity requires dispelling two persistent misconceptions surrounding the Riemann Hypothesis: that RH asserts "perfect randomness" among prime numbers, or that its validity reflects a delicate physical or metaphysical calibration of the cosmos.

### 2.1. Optimal Deterministic Cancellation Versus Apparent Randomness
The prime numbers contain no randomness whatsoever: they are uniquely fixed the instant addition (unit stepping, $+1$) and multiplication (packing units into equal-sized blocks) are defined over the integers $\mathbb{Z}$. Regardless of linguistic notation or numerical base, placing two identical discrete units side by side produces a tessellable, composite configuration; by sheer combinatorial necessity, the boundary between decomposable packings and irreducible primes emerges automatically once discrete multiplicity exists.

What the Riemann Hypothesis asserts—by confining all non-trivial zeros $\rho$ of $\zeta(s)$ (and analogously of Dirichlet $L$-functions $L(s,\chi)$ under GRH) to the critical line $\operatorname{Re}(s) = \frac{1}{2}$—is **optimal deterministic cancellation** across that additive–multiplicative boundary. By Helge von Koch's classical equivalence (von Koch, 1901), RH is equivalent to the sharp error bound on the prime counting function $\pi(x)$ relative to the logarithmic integral $\operatorname{Li}(x)$:
$$\pi(x) = \operatorname{Li}(x) + O\!\left(\sqrt{x}\log x\right).$$
Because square-root fluctuation scales mirror the deviation of an unbiased random walk, RH is frequently popularized as stating that primes behave "as randomly as coin flips." That analogy fails in two decisive respects:
1. **Absence of Macroscopic Oscillatory Bias:** Through the Riemann–von Mangoldt explicit formula, every non-trivial zero $\rho = \beta + i\gamma$ contributes an oscillatory term of amplitude $\sim x^{\beta}$ to prime counts. Even a *single* zero with $\beta > \frac{1}{2}$ would inject a persistent macroscopic wave creating vast prime-poor deserts followed by anomalous local accumulations.
2. **Rigid Spectral Repulsion Rather Than Independence:** The spacings between consecutive zeta zeros do *not* behave like independent Poisson random points. As conjectured by Montgomery (1973) and corroborated numerically across millions of zeros by Odlyzko (1987), normalized zero spacings exhibit strong **level repulsion** matching the eigenvalues of random Hermitian matrices in the Gaussian Unitary Ensemble (GUE).

Thus, RH describes not miraculously tuned chance, but a completely deterministic arithmetic structure whose internal rigidity forbids large-scale bias between additive stepping and multiplicative packing.

### 2.2. Bounded Physical Instantiation Versus Unbounded Arithmetic Law
A natural philosophical question follows: if the observable universe is finite, does an asymptotic statement reaching to infinity carry physical meaning? Answering clearly requires separating two distinct ontological planes:
- **The Unbounded Law of Formal Operations (the Medium):** Arithmetic operations ($+, \times, -, \div$) are unbounded by definition—logically, one can always add $+1$ upward or subdivide further downward. Within this formal domain, the combinatorial grammar governing primes and composites is completely immutable, independent of contingent physical constants ($G$, $\hbar$, $c$).
- **The Bounded Window of Physical Instantiation (the Vessel):** Physical reality instantiates only a finite slice of those operations delimited by hard empirical cutoffs: a lower spatial granularity floor near the Planck scale ($l_P \approx 1.616 \times 10^{-35}\,\text{m}$) and an upper information-processing ceiling. Over its history, the observable universe can have performed at most $\sim 10^{120}$ elementary logic operations on $\sim 10^{90}$ bits of matter and radiation (Lloyd, 2002), while its total cosmic event horizon entropy is bounded around $S_{\text{CEH}} \approx 2.6 \times 10^{122}\,k_B$ (Bekenstein, 1981; Egan & Lineweaver, 2010). Beyond those cutoffs, iterating $+1$ ceases to correspond to physically instantiated states and becomes pure symbolic structure.

From a strictly physicalist standpoint, numerical verification has already confirmed RH up to height $T = 3 \times 10^{12}$ (Platt & Trudgian, 2021); an off-line zero emerging only at some astronomical scale such as $10^{10^{500}}$ would lie forever outside the causal and computational capacity of the cosmos. Yet arithmetic provides a celebrated demonstration of why mathematicians cannot rest with finite verification inside the physical vessel: for more than a century, every computation ever performed supported $\pi(x) < \operatorname{li}(x)$. Nevertheless, Littlewood (1914) proved that $\pi(x) - \operatorname{li}(x)$ reverses sign infinitely often, with modern explicit bounds placing the first crossover below $e^{727.95134} \approx 1.397 \times 10^{316}$ (Saouter, Trudgian & Demichel, 2015)—vastly exceeding the $\sim 10^{80}$ baryons or $\sim 10^{122}$ horizon bits of the observable universe. No physical computer bounded by cosmic entropy could ever have witnessed that sign change by brute enumeration, yet the inversion was already inscribed in the laws of arithmetic.

This delineates a clean division of labor: **physics characterizes the finite vessel** between empirical cutoffs, whereas **mathematics characterizes the intrinsic law of the medium**, distinguishing scale-invariant structural invariants from finite-scale mirages. Confirming RH changes nothing causally inside physical bounds, yet certifies that the cancellation observed inside our computational horizon is a **necessary structural consequence** of arithmetic—rendering teleological or physicalist "fine-tuning" interpretations unnecessary. Given the axioms of addition and multiplication, any off-line zero entails a logical contradiction.

---

## 3. Making Machine Verification Intelligible: Anatomy of Formal Trust and Self-Contained Statement Audit

When a proof spans `17.37` million lines, human readers naturally ask an operational question: *how can we trust a computer check we cannot read line by line, and how might a claimed formal proof deceive us?*

### 3.1. Anatomy of Formal Trust: How a Machine Proof Could Fail
The decisive epistemic leverage of a dependent-type proof assistant like Lean 4 rests on **asymmetric auditing**: a human does *not* need to verify millions of proof steps to know *what* was proved, provided four distinct failure vectors are audited systematically (Table 1).

| Failure Vector | How a Claim Could Mislead | What Humans Must Read | Verification Outcome (v1.4) |
| :--- | :--- | :--- | :--- |
| **1. Specification / Statement Hacking** | Proving a weakened, shadowed, or vacuous theorem (e.g., redefining the $L$-function locally, omitting domain guards, or exploiting Lean's total division `x / 0 = 0`). | Verbatim **`28`-line external specification** (printed in Sec. 3.4) plus canonical `Mathlib` symbols. | **Cleared:** Literal specification reproduced below; `0` shadowing hazards; specification-to-proof ratio $1.62 \times 10^{-6}$. |
| **2. Proof Skipping or Axiom Smuggling** | Leaving unfinished holes (`sorry`), custom `axiom`s, unverified compiled code (`native_decide`, `@[implemented_by]`), or environment mutations. | Verbatim `#print axioms` output + transitive empty-env replay (Sec. 3.4–4.3). | **Cleared:** `0` holes, `0` custom axioms, `0` unsafe bypasses across `175,187` modules; strictly `[propext, Classical.choice, Quot.sound]`. |
| **3. Verifier Bug or Binary Tampering** | Soundness bug in Lean `v4.33.1` kernel or corrupted/manipulated `.olean` environment state. | Kernel replay logs, fuel flags, and external checker boundaries. | **Lean `v4.33.1` + Full `lean4lean` Cleared (Bounded):** Full build (`127,812` s) + `leanchecker --fresh` (`26,898` s); `lean4lean` cleared all `175,187 / 175,187` modules (`1,927,488` decls, `0` failures, `204,972.82` s) trusting precompiled `Mathlib`; clean-room flat NDJSON (`61.57 GB` externally) stalled at `46.47 GB` locally. |
| **4. Prose Scope Inflation** | Claiming broader theorems in prose (e.g., Extended RH) than compiled in Lean. | Comparison between accompanying prose note and formal root statements. | **Flagged:** RH and Dirichlet GRH compiled ($E_I = 0.2450$, opaque); ERH prose extrapolation suspends judgment ($E_I = 0.4075$, Eq. 2). |

### 3.2. Bit-Exact Input Pinning
Every primary source artifact was retrieved from public origins and verified locally by SHA-256 checksum:
- **Formal Archive (`https://alpo.ge/`):** `239,275,554` bytes, SHA-256 `9631b4f020199e580ba86178cb56c6e9b09f690c2369a80dc4334aa93f49c7fc`, bit-identical against the public mirror `https://github.com/jsmorph/rh`.
- **Accompanying Explanatory Note:** `245,114` bytes, SHA-256 `3fc97784b71ddd44ff8aa0a177e99622a1c61b13cfa843a0989ee4a7a0cfeb8d`.
- **Root Specification and Export Modules:** `16`-line statement file `lean/src/Statements.lean` (SHA-256 `79ef7ca776e42abe1f46caee13ea09bd19f1e2d0b1620d8d5d200258f33b47bf`) and `12`-line export file `lean/src/Main.lean` (SHA-256 `017645ca448f2fd1f6fd5c4c2cb2c6e96e472725be13f6e180ca6e1574360939`), verified identical between tarball and build workspace.
- **Pinned Environment:** `leanprover/lean4:v4.33.1` with `Mathlib` revision `0df444a360eaa60ab8c11dca51a86af692955474`.
- **Informal Draft (*The Music of the Primes*):** `6,756,996` bytes (`940` pages, compiled with `pdfTeX-1.40.25`), SHA-256 `e039d3f6cf0a4b14f03c7edb85097752dd65c0a2fe543c76fe992be234f97bf5`.

### 3.3. Lexical Pre-Screening Versus Kernel-Level Soundness
Before compilation, a fast lexical pass over all `175,190` archive files (`175,187` `.lean` sources totaling `17,374,215` lines and `1,030,531,854` bytes) indexed `784,092` `theorem`, `34,663` `lemma` (`818,755` total), `212,819` `def`, `13,202` `abbrev`, `8,286` `structure`, `4,581` `instance`, `121` `inductive`, and `43` `class` declarations, with `0` missing local imports (`174,767` reachable modules from `Main.lean` alongside `420` unimported deadweight files) and zero syntactic occurrences of custom `axiom`, `sorry`/`sorryAx`/`admit`, `native_decide`, `unsafe`, `@[implemented_by]`, `@[extern]`, `@[csimp]`, `opaque`, or kernel-bypass toggles.

Crucially, **syntactic lexical scanning alone cannot rule out custom macros or metaprogramming elaboration hacks in Lean 4**. The binding soundness guarantee comes strictly from kernel elaboration, verbatim `#print axioms` inspection, and empty-environment transitive replay (Sec. 3.4–4.3), while source inspection isolates and names every non-trivial auxiliary construct flagged inside the active import cone:
- **Five Tactic-Suggestion Denylist Entries (`BuildAid/D1.lean`–`D5.lean`):** Each file executes a single `run_cmd Lean.modifyEnv fun env => Lean.LibrarySuggestions.nameDenyListExt.addEntry env ...` call restricting automated library-suggestion search strings (`"CompanionTheory"`, `"CrystallineSemistableComparison"`, `"GlobalTheory"`, `"PositivityTheory"`, `"UpperTheory"`), carrying zero logical effect on theorem types or kernel proofs.
- **Three Metaprogramming Helpers and Two `meta`-Only `partial def`s:** (i) `Formalism/LocalToGlobal/IndefiniteReal/HeckeNonvanishing/Imports.lean` defines tactic `kexactB` via standard goal assignment (`g.assign`); (ii) `Formalism/LocalToGlobal/NumberFieldFamilies/OwnStruct.lean` defines `partial def copyAt` inside elaboration tactic `kcopy` and command `#kcopy_probe` to structurally coerce Lean record projections; and (iii) `Formalism/HermitianCurvature/HermitianCurvatureProofs/CutCptCopy.lean` defines `partial def go` inside command `cpt_copy_thms`, invoking kernel-checked `CoreM.addDecl` (never `addDeclWithoutChecking`). None enters the logical term language.

### 3.4. Self-Contained 28-Line Specification, Verbatim Axiom Trace, and Non-Shadowing Audit
To make this audit self-contained without requiring external repository lookups, we reproduce verbatim the complete `28`-line external Trusted Computing Base (`lean/src/Statements.lean`, lines `1–16`; `lean/src/Main.lean`, lines `1–12`):

```lean
-- File: lean/src/Statements.lean (16 lines; SHA-256: 79ef7ca776e42abe...)
import Mathlib

def RiemannZetaZerosOnLine : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 2

def DirichletLNonvanishingRightOfHalf : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    1 / 2 < s.re → (χ ≠ 1 ∨ s ≠ 1) → DirichletCharacter.LFunction χ s ≠ 0

def DirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

def PrimitiveDirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
    ∀ s : ℂ, 0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

-- File: lean/src/Main.lean (12 lines; SHA-256: 017645ca448f2fd1...)
import Statements
import Supplements.Kernels.MainTheoremsAll

theorem riemannHypothesis : RiemannHypothesis := rhOfAll
theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := rhOfAll
theorem LFunction_ne_zero_of_half_lt_re : DirichletLNonvanishingRightOfHalf := allChi
theorem LFunction_eq_zero_re : DirichletLZerosOnLine := claimAll.2.1
theorem LFunction_eq_zero_re_of_isPrimitive : PrimitiveDirichletLZerosOnLine := critAll
```

Relative to the `17,330,139` lines of active code reachable from `Main.lean`, this `28`-line external specification yields a specification-to-proof ratio of $R_{\text{TCB}} = 1.62 \times 10^{-6}$. Direct inspection confirms exact fidelity against canonical `Mathlib` predicates (`RiemannHypothesis`, `riemannZeta`, and `DirichletCharacter.LFunction`) and zero total-function division hazards (`x / 0 = 0`): denominators and inverses in the intermediate strip modules act exclusively on finite-character group elements and explicitly guarded prime powers (`p.Prime`). Two local definitions sharing the identifier `LFunction` appear strictly scoped inside internal namespaces—`GroundTheory.Automorphic.GodementJacquet.LFunction` in `GJLocalZeta.lean` (local $L$-polynomial factor `((LPolynomial π).eval (qs F s))⁻¹`) and `GroundTheory.Global.LFunction` in `HeckeLFunction.lean` (`LSeries χ.LCoeff s`)—and neither shadows `DirichletCharacter.LFunction` in `Statements.lean` or `Main.lean`.

---

## 4. Independent Compilation, Metamathematical Axiom Reading, and Resource Boundaries

### 4.1. Reference Hardware Compilation, Axiom Trace, and Transitive Fresh Replay
Clean compilation and transitive replay were executed independently on an **Apple M4 Max (16-core ARM64, 64 GB unified memory, macOS Darwin 25.5.0)** under `leanprover/lean4:v4.33.1`:
- **Root Specification Compilation:** Completed with zero exit status in `31` seconds.
- **Full Library Build (`lake build`):** Completed with zero exit status in **`127,812` seconds** (`35 h 30 min 12 s`), compiling `175,187 / 175,187` project modules (`183,889` `.olean` files total including cached `Mathlib` units; `98 GB` build directory footprint).
- **Axiom-Trace Verification (`#print axioms`, `110` seconds, zero exit status):** Archived in the public verification dossier (SHA-256 `590d5252e7e5a4e6d9faef1895216c77eb103d6667037d832eaedaa34fa3186d`). Verbatim transcript across all five root theorems:
  ```text
  'riemannHypothesis' depends on axioms: [propext, Classical.choice, Quot.sound]
  'riemannZeta_eq_zero_re' depends on axioms: [propext, Classical.choice, Quot.sound]
  'LFunction_ne_zero_of_half_lt_re' depends on axioms: [propext, Classical.choice, Quot.sound]
  'LFunction_eq_zero_re' depends on axioms: [propext, Classical.choice, Quot.sound]
  'LFunction_eq_zero_re_of_isPrimitive' depends on axioms: [propext, Classical.choice, Quot.sound]
  ```
- **Transitive Fresh-Environment Replay (`26,898` seconds / `7 h 28 min 18 s`, zero exit status):** Executed via `lake env leanchecker --fresh` (`2026-11-23T06:35:06Z` $\to$ `2026-11-23T14:03:24Z`; SHA-256 `ff8ea3d0b4db9f21f2a09513a5b20c1d2d6d106566030aa7f21e50156966f95c`), independently re-elaborating every imported and exported declaration—including `Mathlib` dependencies—starting from an empty kernel environment.
- **Full-Archive Bounded-RAM `lean4lean` Module Replay (`204,972.82` seconds / `56 h 56 min 13 s`, zero failures):** Executed sequentially module by module across all `175,187 / 175,187` project modules (`1,927,488` declarations checked; `2026-11-23T22:30:08Z` $\to$ `2026-11-26T08:18:04Z`; SHA-256 `2a1275314add679b47ee4de7ee7601388489fff7d7e074ec6a18d36116f35a14`) under the explicit architectural boundaries detailed in Sec. 4.3.

### 4.2. Metamathematical Significance of Standard Axiom Closure
To readers outside type theory, the three-item log `[propext, Classical.choice, Quot.sound]` may resemble routine compiler output; metamathematically, it settles a foundational question opened by Gödelian incompleteness. Because the Riemann Hypothesis is equivalent to a $\Pi_1^0$ arithmetical sentence—for example, Lagarias's elementary inequality $\sigma(n) \le H_n + e^{H_n}\log H_n$ for all $n \ge 1$ (Lagarias, 2002)—a counterexample would in principle be finitely checkable, leaving open the logical possibility that RH could hold in the standard natural numbers while remaining independent of standard mathematical axioms.

Lean 4's kernel implements dependent type theory augmented solely by three canonical principles: `propext` (propositional extensionality), `Classical.choice` (standard classical choice), and `Quot.sound` (quotient soundness). While this dependent type-theoretic foundation is stronger than elementary Peano Arithmetic (comparable in consistency strength to standard ZFC set theory with universe levels), it is completely standard across modern mathematics. Confirming that all five root theorems discharge strictly over `[propext, Classical.choice, Quot.sound]` certifies that RH and Dirichlet GRH require **no exotic large-cardinal hypotheses, no new physical postulates, and no unverified axioms**: their truth is already deductively contained within standard mathematical foundations.

### 4.3. Transparent Boundaries, Hardware Limits, and Bounded-RAM Modular Replay
Scientific honesty requires distinguishing clearly between what *our* independent 64 GB workstation run certifies end to end, what precompiled artifacts modular replay trusts, and how fuel escalation operates:
1. **Lean `v4.33.1` Transitive Empty-Environment Replay (Completed):** Both default compilation and transitive replay (`lake env leanchecker --fresh`, `26,898` s, zero exit status) ran from `mkEmptyEnvironment`, eliminating `.olean` tampering, batch-boundary inconsistency, and metaprogramming bypass risks under Lean `v4.33.1`.
2. **External High-Memory Export Size vs. Local `46.47 GB` OOM Wall:** While we compiled `nanoda` and Lean's flat exporter locally, single-threaded flat NDJSON export failed on our 64 GB host when process RSS expanded to `46.47 GB` and triggered virtual-memory thrashing. External high-memory runs documented by Andrew Sutherland (MIT) establish the completed flat NDJSON export size at `61,570,595,788` bytes (`61.57 GB`), requiring `82.6–98.8 GiB`+ peak RAM for clean-room flat replay (`nanoda`, `con-leche`).
3. **Modular `lean4lean` (`67f63b0c`) Architecture and Precompiled-`Mathlib` Trust Boundary:** To bypass the `61.57 GB` monolithic serialization wall on 64 GB RAM, we invoked unmodified `Lean4Lean.Replay.replayFromImports` (Carneiro, 2026) module by module over exact `.olean` lists in `3` parallel workers processing `10`-module chunks (`MIMALLOC_PURGE_DELAY=0`, system free-memory guard `>= 45%` maintaining `~15.47 GB` combined RSS / `88%` free RAM, and serial execution for apex modules). **Structural Scope Caveat:** Unlike monolithic flat export or `leanchecker --fresh`, per-module `replayFromImports` checks each project module's exported declarations assuming the integrity of precompiled upstream `Mathlib` `.olean` files and cross-batch imported `.olean` headers built during `lake build`. Moreover, `lean4lean` is a Lean-implemented port sharing C++ kernel design lineage rather than an independent clean-room Rust/C kernel.
4. **Exact Fuel-Escalation Protocol and Full Inventory of the 17 Escalated Modules:** Across `175,187` project modules, `175,170` passed within default limits (`timeout_s = 1800`), whereas `17` triggered automatic single-module retry (`timeout_s = 3600`) upon hitting the batch timeout (`rc = 124`) or Lean resource exceptions (`deterministicTimeout`, `deepRecursion`, `excessiveMemory`) under `--config:whnf=100000000000 --config:whnfEager=100000000000 --config:lazyDelta=100000000000 --config:recDepth=200000` (5 `Formalism` `decide +kernel` modules + 12 `Development.AbelianVarietyTheory` modules; zero in `ReciprocityTheory`):

| Module Path | Declarations | Runtime (ms) |
| :--- | ---: | ---: |
| `Formalism.PeriodIntegrals.UnitaryGroupMassFormula.ChebyshevPrimeBounds.SmallLoop` | 10 | 26,967 |
| `Formalism.PeriodIntegrals.UnitaryGroupMassFormula.DyadicPrimeIntervals.Run1` | 2 | 11,676 |
| `Formalism.PeriodIntegrals.UnitaryGroupMassFormula.DyadicPrimeIntervals.Run2` | 2 | 11,574 |
| `Formalism.PeriodIntegrals.UnitaryGroupMassFormula.DyadicPrimeIntervals.Run3` | 2 | 11,596 |
| `Formalism.PeriodIntegrals.UnitaryGroupMassFormula.DyadicPrimeIntervals.Run4` | 2 | 11,721 |
| `Development.AbelianVarietyTheory.Proofs.DivisorProofs.EncardComplexPointFibreEqEncardRingHomExtensions` | 1 | 3,063,222 (after `rc=124` retry) |
| `Development.AbelianVarietyTheory.Proofs.DivisorProofs.EncardComplexPointFibreEqEncardRingHomExtensionsStatement` | 1 | 3,271 |
| `Development.AbelianVarietyTheory.Proofs.DivisorProofs.EncardComplexPointsFiniteEtaleFreeEqRank` | 1 | 2,138 |
| `Development.AbelianVarietyTheory.Proofs.DivisorProofs.EncardComplexPointsFiniteEtaleFreeEqRankStatement` | 1 | 2,133 |
| `Development.AbelianVarietyTheory.Proofs.DivisorProofs.EncardMulLeOfQuotEmbed` | 1 | 2,137 |
| `Development.AbelianVarietyTheory.Proofs.DivisorProofs.EncardSelfDualLatticeBoundedMajorantLe` | 52 | 2,519 |
| `Development.AbelianVarietyTheory.Proofs.IwasawaDecomposition.ExistsMovedDataStateLocalisations` | 14 | 946,106 |
| `Development.AbelianVarietyTheory.Proofs.IwasawaDecomposition.ExistsMovedDataStateLocalisationsStatement` | 1 | 6,095 |
| `Development.AbelianVarietyTheory.Proofs.IwasawaDecomposition.ExistsMovedRowLiftDataToFittingStages` | 55 | 6,132 |
| `Development.AbelianVarietyTheory.Proofs.IwasawaDecomposition.ExistsMovedRowLiftDataToFittingStagesStatement` | 1 | 3,919 |
| `Development.AbelianVarietyTheory.Proofs.IwasawaDecomposition.ExistsMovesOfSelfDual` | 41 | 3,651 |
| `Development.AbelianVarietyTheory.Proofs.IwasawaDecomposition.ExistsMtTieCoord` | 12 | 3,064 |

Automated post-verification cleanup subsequently reclaimed temporary build/driver directories, leaving `188 GiB` free on disk alongside archived cryptographic receipts. Independently, the Lean FRO and Mathlib Initiative certified statement fidelity and compilation on November 21, 2026 (<https://leanprover-community.github.io/blog/posts/riemann-hypothesis/>), and Andrew Sutherland (<https://math.mit.edu/~drew/grh/>) documented high-RAM clean-room replays (`nanoda`, `con-leche`, `lean4lean`) highlighting the same five `Formalism` `decide +kernel` modules. While `remark.pdf` anticipates extension to the Extended Riemann Hypothesis (ERH), only RH and Dirichlet GRH are formalized in `Main.lean`.

---

## 5. Deductive Spine Cartography, Interface Hubs, and Keyword-Indexed Motifs

To survey the macro-architecture of `175,187` modules without reading `17.37` million lines, we extracted the transitive import DAG rooted at `Main.lean` and `Statements.lean` (`818,755` `theorem`/`lemma` declarations, maximum depth `43`):

| Library Layer | Modules | Theorems/Lemmas | Depth Range | Primary Role |
| :--- | ---: | ---: | :---: | :--- |
| Root Specification & Exports | 5 | 9 | 0–3 | Root exports and Mathlib-anchored targets |
| Core Development Layer | 141,928 | 562,329 | 2–43 | Abelian/automorphic schemes, Weil bounds, Galois modularity, theta lifts |
| Formalism Layer | 18,254 | 162,118 | 4–43 | Hermitian curvature, mass formulas, period integrals, Gamma factors |
| Ground Theory Layer | 8,507 | 54,211 | 5–32 | Local/global fields, Tate thesis, Arakelov heights, $p$-adic Hodge theory |
| Reciprocity Theory Layer | 3,845 | 27,722 | 6–36 | Reductive groups, birational geometry, toroidal compactification, descent |
| Companion Theory Layer | 2,027 | 9,419 | 5–30 | Unitary $p$-adic weights, product formulas, Pieri rules |
| Positivity Theory Layer | 449 | 2,702 | 6–13 | Automorphic positivity functionals and nonvanishing criteria |
| Auxiliary Lemmas & Build Aids | 172 | 245 | 8–25 | Shared auxiliary lemmas and inert tactic denylists |

### 5.1. Syntactic Interface Hubs Versus Theorem-Bearing Bottlenecks
High fan-in in a Lean dependency graph must not be conflated uncritically with conceptual difficulty: modules with `0` exported theorems often serve as syntactic interface bundles aggregating definitions and shared structures across subtrees. Separating the two roles cleanly at depths `6–9` reveals:
- **Zero-Theorem Syntactic Interface / Aggregator Hubs:** Led by `UniformisationConclusion` (depth `6`, fan-in `2,390`, `2,379` cross-layer edges, `0` theorems), `ExtensionDescent.UnifUniqSt` (depth `7`, fan-in `2,284`, `2,283` cross-layer edges, `0` theorems), `CTSmallCone` (depth `7`, fan-in `3,088`, `0` theorems), and `SiegelWeilAnisotropicHermitian` (depth `7`, fan-in `2,972`, `0` theorems). Direct source inspection confirms that `UniformisationConclusion.lean` packages CM-field involutions, group-object ring actions, semiabelian degeneration structures, twisted trace-form isomorphisms, and boundary unit predicates into a shared contract interface connecting foundational schemes to downstream positivity proofs.
- **Theorem-Bearing Cross-Layer Bottleneck Modules:** High-fan-in modules containing substantive proved obligations include `ExistsNormLeHeightPow` (depth `7`, fan-in `2,460`, `11` theorems bounding rapid-decay quotient heights), `CubeVal` (depth `7`, fan-in `811`, `12` theorems), `ValCalc` (depth `7`, fan-in `621`, `28` theorems), `LocalSituation` (depth `7`, fan-in `627`, `15` theorems), and `RankBoundMonotoneInDimension` (depth `7`, fan-in `431`, `111` theorems).

### 5.2. Transparent Non-Exclusive Keyword Classification of Proof Motifs
To characterize broad mathematical themes at corpus scale, we ran a deterministic, **non-exclusive case-insensitive substring matcher** over each module's dotted filesystem path and its first five syntactic `theorem`/`lemma` names across six predefined domain-concept keyword families (a single module matching multiple keyword tuples counts toward each, totaling `151,457` non-disjoint matches across `125,723` unique covered modules—`71.77%` of `175,187`, with `21,082` modules matching two or more lists simultaneously—while `49,464` modules, or `28.24%`, match none of the six lists under this heuristic). **Methodological Caveat:** Because AI-assisted module naming repeats directory templates across subtrees, these counts quantify lexical prevalence of named mathematical families rather than disjoint semantic partitions:
1. **Galois Modularity & Cohomological Patching (`109,260` matching modules, `62.4%`):** Keywords `Galois`, `Etale`, `AbelianVariety`, `Shimura`, `Modularity`, `PadicHodge`, `Birational`.
2. **Iterated Unitary Theta-Lift Chains (`15,750` modules, `9.0%`):** Keywords `ThetaLift`, `SiegelWeil`, `Unitary`, `ThetaCorrespondence`, implementing iterated lifts $U(X_0) \to \dots \to U(X_m)$ ($m \sim \sqrt{X}$) to track multiplicity natively over $\mathbb{Z}$.
3. **Bost Slope & Arakelov–Iwasawa Descent (`13,010` modules, `7.4%`):** Keywords `Bost`, `Slope`, `Iwasawa`, `Behrend`, `Hermitian`.
4. **Guinand–Weil & GGP/Bessel Positivity (`7,011` modules, `4.0%`):** Keywords `GGP`, `Bessel`, `PeriodIntegral`, `Seesaw`, `Rallis`, `Positivity`.
5. **Siegel Mass & Chowla–Selberg Divisibility (`4,618` modules, `2.6%`):** Keywords `SiegelMass`, `ChowlaSelberg`, `Weyl`, `MassFormula`.
6. **Stepanov Multiplicity Determinants & Rigidity (`1,808` modules, `1.0%`):** Keywords `Stepanov`, `Determinant`, `Multiplicity`, `AuxiliaryPoly`.

---

## 6. Illustrative Contrast with an Incomplete Informal Draft

We contrast Alpöge's compiled formal repository with Masullo's `940`-page informal manuscript solely as an **illustrative contrast in deductive closure** between a complete machine-checked codebase and a human draft explicitly labeled a "hurried announcement" by Ravi Vakil—not as a symmetric benchmark of completed informal mathematics. Although Chapters 1–12 develop Hardy–Sobolev spaces $W_I^{s,2}(G)$, periodic Schauder bases, and quotient stacks toward a trace formula (Theorem `12.5.1.1`, p. 519), forensic parsing reveals critical incompleteness in the closing chapters:
- Section `12.4.1` (pp. 514–515) retains author footnote 2 instructing revision of the $(\lambda, \varepsilon)$-cutoff in integral `(12.4.1.23)`.
- **Chapter 13 (*Zeros of Hecke L-functions*, pp. 521–522)** leaves Sections `13.1`–`13.2` as empty headings, cites a broken `"Theorem ??"`, and leaves **Theorem `13.3.1.2`** completely blank beneath footnotes `"2 Insert statement."` and `"3 State and prove the Main Theorems..."`.
- Across `940` pages, parsing finds `19` broken `??` references, `10` author TODO notes, and `13` stub pages (`<400` characters), leaving the Montel limit interchange from the regularized trace formula to $L'_f / L_f$ holomorphy open.

---

## 7. Parametrized Epistemia Index, Calibration, and Sensitivity Analysis

Operationalizing Quattrociocchi, Capraro & Perc (`arXiv:2512.19466`), William Thurston's distinction between verification and understanding (Thurston, 1994), and Griffiths's resource-rational cognitive framework (Griffiths, 2026) requires defining our governance index transparently so any reviewer can reproduce or contest every number.

### 7.1. Mathematical Specification and Worked Evaluation
We define the normalized Epistemia risk index $E_I \in [0, 1]$ as a bounded convex linear combination of three sub-metrics:
$$E_I = \operatorname{clip}_{[0,1]}\!\left(0.45\,G_{\text{fluency}} + 0.35\,D_{\text{cost}} + 0.20\,U_{\text{supp}}\right), \qquad \tau_E = 0.35,$$
where $\operatorname{clip}_{[0,1]}(x) = \min(1, \max(0, x))$ and each component is specified deterministically:
$$G_{\text{fluency}} = \min\!\left(1,\; \max\!\left(\frac{C_{\text{total}} - \min(C_{\text{anchored}}, C_{\text{total}})}{C_{\text{total}}},\; 0.25\,F_{\text{crit}}\right)\right),$$
$$D_{\text{cost}} = \min\!\left(1,\; \max\!\left(0.70 \cdot \mathbf{1}_{[\neg H_{\text{comp}}]},\; \max\!\left(0,\frac{L_{\text{TCB}}-L_{\max}}{L_{\max}}\right),\; \max\!\left(0,\frac{P_{\text{rev}}-P_{\max}}{P_{\max}}\right)\right)\right),$$
$$U_{\text{supp}} = \min\!\left(1,\; 0.50 \cdot \mathbf{1}_{[R_{\text{ref}}=0]} + \min(0.50,\; 0.25\,O_{\text{prose}})\right),$$
with default bounded human verification budgets $L_{\max}=200$ specification lines and $P_{\max}=50$ prose pages, where $C_{\text{total}}, C_{\text{anchored}} \in \mathbb{N}$ denote total evaluated claim units and the subset backed by verified formal proof cones (coding the compiled corpus as $C_{\text{total}} = 1$ unified deductive cone, versus $C_{\text{total}} = 4$ claim scopes when separating RH, Dirichlet nonvanishing, Dirichlet critical-line, and the unformalized ERH prose expectation in `remark.pdf`, or the four incomplete analytical closure axes in Masullo's draft), $F_{\text{crit}} \in \mathbb{N}$ counts unresolved critical/high defects, $H_{\text{comp}} \in \{\text{false},\text{true}\}$ indicates full human surveyability, $L_{\text{TCB}}$ and $P_{\text{rev}}$ denote external TCB line length and prose monograph pages audited, $R_{\text{ref}} \in \mathbb{N}$ counts independent audit/refutation checks executed, and $O_{\text{prose}} \in \mathbb{N}$ counts overclaims exceeding compiled artifacts. Evaluating the three targets yields exact reproducibility:
- **Alpöge Formal Cones:** $(C_{\text{total}}, C_{\text{anch}}, F_{\text{crit}}) = (1, 1, 0)$, $H_{\text{comp}}=\text{false}$, $(L_{\text{TCB}}, P_{\text{rev}}) = (28, 0)$, $(R_{\text{ref}}, O_{\text{prose}}) = (3, 0) \implies (G_{\text{fl}}, D_{\text{cost}}, U_{\text{supp}}) = (0.00, 0.70, 0.00) \implies E_I = \mathbf{0.2450}$ (machine-verified, human-opaque).
- **Alpöge + ERH Prose:** $(4, 3, 1)$, $H_{\text{comp}}=\text{false}$, $(28, 4)$, $(3, 1) \implies (0.25, 0.70, 0.25) \implies E_I = \mathbf{0.4075}$ (judgment suspended).
- **Masullo 940-Page Draft:** $(4, 0, 4)$, $H_{\text{comp}}=\text{false}$, $(0, 940)$, $(1, 1) \implies (1.00, 1.00, 0.25) \implies E_I = \mathbf{0.8500}$ (judgment suspended).

### 7.2. Normative Calibration Caveat and Rank-Order Sensitivity Check
The weights `(0.45, 0.35, 0.20)` and cutoff $\tau_E = 0.35$ are **normative engineering parameters** reflecting epistemic priority, *not* statistically calibrated probabilities estimated from a labeled corpus. Four-decimal outputs (`0.2450`, `0.4075`, `0.8500`) should therefore be read strictly as exact arithmetic evaluations of the equation above. Crucially, **the ordinal ranking is invariant across weights**: because `(0, 0.70, 0) \preceq (0.25, 0.70, 0.25) \preceq (1.00, 1.00, 0.25)` holds in weak Pareto dominance ($\le$ componentwise with strict inequality $<$ in two coordinates at each step: on $G_{\text{fl}}$ and $U_{\text{supp}}$ between rows 1–2, and on $G_{\text{fl}}$ and $D_{\text{cost}}$ between rows 2–3), *any* strictly positive weighting on the simplex preserves $E_I(\text{Alpöge formal cones}) < E_I(\text{Alpöge + ERH prose}) < E_I(\text{Masullo draft})$, and suspension triggers independently via $F_{\text{crit}} > 0$.

As Thurston (1994) argued, kernel verification completes only **Phase 1 (Certification)**; **Phase 2 (Cognitive Distillation)**—compressing `17.37` million machine-checked lines into human-surveyable mathematical expositions—remains the defining frontier challenge. Because open community Phase 2 reconstructions explicitly disclaim making an independent proof claim ($O_{\text{prose}} = 0$), they sit orthogonally to the primary claim evaluation in Table 4 (preserving its weak-Pareto ranking intact) and are instead audited via passage-to-code provenance and expositional closure metrics in Sec. 7.3.

### 7.3. Empirical Phase 2 Case Study: Cross-Auditing a Community Prose Reconstruction

To test how Phase 2 human-led and AI-assisted distillation interacts with Phase 1 certification in practice, we cross-audited the public reconstruction repository `jimjamzola/RH-Alpoge-Reconstruction` (Adriazola, 2026; `main` commit `b50dae1`) against our verified `175,187`-module spine (`certificates/phase2_prose_reconstruction_cross_audit.json`). Notably, Adriazola's documentation states candidly that none of the repository's internal audits compiled or ran the Lean kernel (`audit/README.md`). Evaluating its provenance ledgers, internal residual catalog, and external theorem boundary yields an empirical picture of Phase 2 distillation progress and limits (Table 5):

| Audit Dimension | Phase 1 Formal Baseline (Alpöge Corpus) | Phase 2 Community Reconstruction (`b50dae1`) | Methodological Implication |
| :--- | :--- | :--- | :--- |
| **Kernel Execution** | `lean v4.33.1` + `--fresh` + `lean4lean` (`175,187/175,187`, `0` fails) | `0` archive builds or kernel runs (`audit/README.md`) | Machine trust rests entirely on Phase 1 certification |
| **Passage-to-Code Pinning** | Exact root specs (`Statements.lean`, `Main.lean`, `0` shadows) | `148` rows (`60` passages $\to$ `114` decls in `75` files); `0` pin/hash mismatches vs. `40e56ba` | Reproducible ledger hygiene (`109` `ALIGNED`, `35` `EXPOSITION_ONLY`, `3` `UNMAPPED`, `1` `OFF_ROUTE`) |
| **Statement-Index Coverage** | `818,755` indexed formal declarations across `43` strata | **`12 / 453` (`2.65%`)** total environments linked; **`8 / 345` (`2.32%`)** proof-bearing (`97.35%` pending) | Passage ledger verifies selected anchors rather than end-to-end prose bijectivity |
| **Stratified Layer Reach** | Covers all `11` layers (including `3,845` `ReciprocityTheory` modules) | `Formalism`: `80`, `Development`: `63`, `Supplements`: `3`, `Main`: `2`; **`0` direct rows** in `ReciprocityTheory`, `GroundTheory`, `CompanionTheory`, `PositivityTheory` | Cross-layer interface hubs require explicit ledger traversal to prevent blind spots |
| **Internal Residuals & Omissions** | `0` `sorry`, `0` custom axioms across compiled graph | `12 / 12` residual packages (`PC-1..PC-7`, `SL-1..SL-5`) `MECHANISM_PACKAGED`; `0.0%` conventional closure; `29` explicit omissions | Residuals measure *expositional* packaging, unlike missing proofs in unfinished drafts |
| **External Boundary (`V1..V20`)** | Anchored cleanly to `Mathlib` `RiemannHypothesis` & `LFunction` | **`0 / 20`** fully reconciled on hypotheses + constants (`2` `partially compared`: `V5`, `V8`; `1` `OFF_ROUTE`: `V17`) | Literature-boundary hypothesis matching remains the decisive Phase 2 bottleneck |
| **Refactor Transition** | Original compressed archive (`9631b4f0...49c7fc`) | Shifted from `297`-pp. `40e56ba` text to `117`-pp. `canonical/main.pdf` on `lsernau/grh-lean` (`72fead1`; conditional, Appendix E) | Refactor readability demands root-statement invariance + kernel replay |

Four empirical findings stand out for future automated auditing and community reconstruction pipelines:
1. **Independent Structural Convergence Alongside Ledger Blind Spots:** Without inspecting our dependency graph, the reconstruction's priority boundary items and residual blocks independently converge on the exact topological bottlenecks isolated in Sec. 5: `ToroidalCompactification.{UniformisationConclusion, ValCalc, HeckeKer, CubeVal, IsHolPeriods, BCTools}` and `UnifUniqSt` map onto `V7` (`PublishedHodgeBundleTheorems`, `SiegelToroidalIntegral`, `ToroidalForFanKS`) and `PC-2` (`exists_good_tower`, `SupModel.comp_bound`); `SiegelWeilAnisotropicHermitian` and `RallisDM` map onto `V5`–`V6`/`V13` and `PC-4`; iterated unitary theta-lift chains align with `V4`/`PC-1`/`PC-5`; Bost-slope modules align with `V11`; and Galois modularity modules align with `V14`–`V15`. Yet `passage-ledger.tsv` concentrates on `Formalism` (`80`) and `Development` (`63`) with zero direct rows in `ReciprocityTheory`, illustrating why bottom-up DAG cartography helps guide human ledger coverage.
2. **Expositional Residuals Differ Sharply From Unfinished Draft Gaps:** Following early wave reports (`audit/Post_Closure_Internal_Residuals.md`, Nov. 21), the author clarified explicitly (`docs/STATUS.md`, Nov. 23) that `|R_internal| = 0` measures dependency identification and mechanism packaging (`12/12` `MECHANISM_PACKAGED`, `110` `CONDITIONAL` ledger rows, `29` explicit omissions led by `12` in `sec15_heights.tex` and `8` in `sec12_loss.tex`), *not* complete conventional prose proofs—a disciplined, transparent contrast against unflagged deductive gaps such as Masullo's Chapter 13.
3. **Localized Prose Bugs Can Coexist With Sound Formal Artifacts:** As documented in `docs/STATUS.md` (Nov. 26), community inspection of the earlier `297`-page prose draft uncovered three localized expositional errors (double counting in §14, a weight bound in §5, and single-Frobenius character claims in §17) even when the underlying Lean archive passed kernel verification—confirming empirically that formal soundness guarantees code validity, not faithfulness of derived prose summaries.
4. **Pending Equivalence Across Community Refactors:** Shifting the working manuscript (`canonical/main.pdf`, `117` pages) to Luke Sernau's readable Lean refactor (`lsernau/grh-lean` at `72fead1`; Sernau et al., 2026) improves human readability while remaining conditional on the arithmetic inputs cataloged in Appendix E; closing the trust chain between Phase 1 and Phase 2 ultimately requires programmatic signature equivalence on `Statements.lean`/`Main.lean` and kernel replay on the refactored codebase.

### 7.4. Methodological Lessons for Automated Auditing Pipelines
Conducting this end-to-end audit revealed six generalizable engineering safeguards for automated scientific review systems:
1. **Artifact-Bound Numerical Provenance:** Every hardware count, cryptographic SHA-256 digest, and metric in generated reports must be programmatically verified against signed JSON/log receipts prior to publication.
2. **Public Dossier Boundary Hygiene:** Separately sealing public verification dossiers with deterministic exclusion of private paths/identifiers, citation/heading hygiene checks, and live `HTTP 200 OK` URL checks prevents reproducibility failures.
3. **Memory-Aware Multi-Kernel Routing:** Resource-rational verification planners should estimate flat serialization pressure (`~61.57 GB`) against host RAM, routing 64 GB workstations to bounded-RAM modular `lean4lean` replay while explicitly documenting precompiled dependency boundaries and reserving clean-room flat-export kernels (`nanoda`, `con-leche`) for high-RAM nodes.
4. **Deductive Chapter-Bridge Auditing:** Structural parsing of informal manuscripts should automatically test whether named intermediate theorems (such as Theorem `12.5.1.1` in Masullo's draft) connect deductively into conclusive chapters rather than terminating in broken `??` placeholders.
5. **Self-Contained Evidence & Equation Disclosure:** Automated peer review must reject unprinted small-TCB claims, composite indices lacking closed-form equations and sensitivity checks, unnamed "benign" helpers, and undisclosed graph-classification heuristics.
6. **Phase-1-to-Phase-2 Ledger and Refactor-Equivalence Auditing:** Cross-auditing prose reconstructions against formal archives should track both total (`12/453`) and proof-bearing (`8/345`) bijection ratios, check layer blind spots across topological bottlenecks (`ReciprocityTheory`), separate expositional residuals from formal gaps, and mandate root-statement equivalence plus kernel replay whenever a reconstruction shifts onto a cleaned Lean refactor.

---

## 8. Data, Code Availability, and AI Transparency Disclosure

**Data and Code Availability.** All primary cryptographic digests, reference hardware compilation records, raw `#print axioms` trace (`SHA-256: 590d5252...`), transitive fresh-replay (`SHA-256: ff8ea3d0...`), and full-archive bounded-RAM `lean4lean` module-replay receipt (`175,187 / 175,187` modules, `1,927,488` declarations checked, `0` failures at `2026-11-26T08:18:04Z`, `lean4lean_summary.json` SHA-256 `2a127531...`), along with static soundness counts, stratified dependency spine summaries, Phase 2 cross-audit metrics (`certificates/phase2_prose_reconstruction_cross_audit.json`), interactive dependency explorer, progressive mathematical primer, and comparative forensic inventories are openly archived in the public verification dossier at <https://github.com/Fundacion-de-Neurociencias/riemann-hypothesis-audit-dossier> (v1.4 release tag: <https://github.com/Fundacion-de-Neurociencias/riemann-hypothesis-audit-dossier/releases/tag/v1.4>). Automated multi-stage execution was coordinated through **CoResearcher** at <https://github.com/Fundacion-de-Neurociencias/coresearcher>. All cited repositories are publicly accessible without authentication.

**Artificial Intelligence Disclosure.** Autonomous computational orchestration (Lean 4 build supervision, cryptographic checksum verification, bounded-RAM module-by-module kernel replay orchestration, dependency-graph extraction, and PDF structural parsing) was executed via CoResearcher, and generative AI assistants were employed for editorial polishing and LaTeX typesetting. All empirical measurements were extracted verbatim from deterministic execution logs on local hardware and bound programmatically against immutable JSON certificates, all bibliographic citations and external URLs were independently verified, and the author holds full epistemic and intellectual responsibility for all content.

---

## References

1. Adriazola, J. (2026). *Human-Readable Reconstruction of the Alpöge–Claude RH Argument* (commit `b50dae1`). <https://github.com/jimjamzola/RH-Alpoge-Reconstruction>.
2. Alpöge, L. (2026). Formal Lean 4 Repository and Explanatory Remark on the Riemann Hypothesis and Generalized Riemann Hypothesis. <https://alpo.ge/> (Explanatory note: <https://alpo.ge/remark.pdf>; bit-exact community mirror: <https://github.com/jsmorph/rh>).
3. Bekenstein, J. D. (1981). Universal upper bound on the entropy-to-energy ratio for bounded systems. *Physical Review D*, 23(2), 287–298. DOI: `10.1103/PhysRevD.23.287`.
4. Carneiro, M. (2026). `lean4lean`: A Lean 4 kernel implemented in Lean 4 (commit `67f63b0c`). <https://github.com/digama0/lean4lean>.
5. Egan, C. A., & Lineweaver, C. H. (2010). A larger estimate of the entropy of the universe. *The Astrophysical Journal*, 710(2), 1825–1834. DOI: `10.1088/0004-637X/710/2/1825` (<https://arxiv.org/abs/0909.3983>).
6. Griffiths, T. (2026). *The Laws of Thought: The Quest for a Mathematical Theory of the Mind*. Henry Holt and Co., ISBN `978-1250358356`.
7. Lagarias, J. C. (2002). An elementary problem equivalent to the Riemann hypothesis. *The American Mathematical Monthly*, 109(6), 534–543. DOI: `10.2307/2695443` (<https://arxiv.org/abs/math/0008177>).
8. Lean FRO & Mathlib Initiative (2026). Lean verification of the Riemann Hypothesis. *Lean Community Blog*, November 21, 2026. <https://leanprover-community.github.io/blog/posts/riemann-hypothesis/>.
9. Littlewood, J. E. (1914). Sur la distribution des nombres premiers. *Comptes Rendus de l'Académie des Sciences de Paris*, 158, 1869–1872.
10. Lloyd, S. (2002). Computational capacity of the universe. *Physical Review Letters*, 88(23), 237901. DOI: `10.1103/PhysRevLett.88.237901` (<https://arxiv.org/abs/quant-ph/0110141>).
11. Menéndez-González, M., & Fundación de Neurociencias (2026). CoResearcher: An Open System for Coordinating Scientific Work Between Humans and AI Agents. <https://github.com/Fundacion-de-Neurociencias/coresearcher>.
12. Montgomery, H. L. (1973). The pair correlation of zeros of the zeta function. *Proceedings of Symposia in Pure Mathematics*, 24, 181–193. DOI: `10.1090/pspum/024/9944`.
13. Odlyzko, A. M. (1987). On the distribution of spacings between zeros of the zeta function. *Mathematics of Computation*, 48(177), 273–308. DOI: `10.1090/S0025-5718-1987-0866115-0`.
14. Platt, D., & Trudgian, T. (2021). The Riemann hypothesis is true up to $3 \cdot 10^{12}$. *Bulletin of the London Mathematical Society*, 53(3), 792–797. DOI: `10.1112/blms.12460` (<https://arxiv.org/abs/2004.09765>).
15. Quattrociocchi, W., Capraro, V., & Perc, M. (2025). Epistemological Fault Lines Between Human and Artificial Intelligence. `arXiv:2512.19466` (<https://arxiv.org/abs/2512.19466>).
16. Saouter, Y., Trudgian, T., & Demichel, P. (2015). A still sharper region where $\pi(x) - \operatorname{li}(x)$ is positive. *Mathematics of Computation*, 84(295), 2433–2446. DOI: `10.1090/S0025-5718-2015-02930-5`.
17. Sernau, L., colleagues at Anthropic, & Claude (2026). `grh-lean`: Readable Lean 4 Refactor of the GRH Formalization (commit `72fead1`). <https://github.com/lsernau/grh-lean>.
18. Sutherland, A. (2026). RH Lean proof: verification files. Massachusetts Institute of Technology. <https://math.mit.edu/~drew/grh/>.
19. Thurston, W. P. (1994). On proof and progress in mathematics. *Bulletin of the American Mathematical Society*, 30(2), 161–177. DOI: `10.1090/S0273-0979-1994-00502-6` (<https://arxiv.org/abs/math/9404236>).
20. Vakil, R. (2026). Hurried Announcement: Alessandro Masullo GRH, linking Masullo, A. M., *The Music of the Primes*. <https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/>.
21. von Koch, H. (1901). Sur la distribution des nombres premiers. *Acta Mathematica*, 24, 159–182. DOI: `10.1007/BF02403071`.
