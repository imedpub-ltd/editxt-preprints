# Eight-Gate Epistemic Verification Protocol (Logical & Methodological Specification)

This document specifies **what** each verification gate tests, **what cryptographic or formal guarantee** it establishes, and **what boundaries** remain open—independent of internal proprietary scoring formulas or automated implementation details. Automated end-to-end execution of this verification standard is provided through **CoResearcher** (<https://github.com/Fundacion-de-Neurociencias/coresearcher>).

---

## Conceptual Architecture: Why Syntax Alone Is Insufficient

Modern AI-assisted mathematics splits classical scientific validation along two orthogonal axes:
1. **Formal Soundness (Type-Theoretic Closure):** Does the dependency graph discharge every proof obligation down to foundational axioms without `sorry` or axiom smuggling?
2. **Epistemic Comprehensibility & Fidelity (Cognitive Closure):** Does the formally proved statement genuinely capture the mathematical theorem claimed in prose, without goalpost shifting, vacuous definitions, or unbridgeable human comprehension opacity?

To prevent both *false-positive acceptance of uncompiled/drifted claims* and *blind deference to opaque million-line proof artifacts*, the verification protocol separates the audit into eight sequential gates and a calibration framework grounded in Quattrociocchi, Capraro & Perc (*arXiv:2512.19466*) and Griffiths (2026).

---

## The Eight Verification Gates

### Gate 1 — Cryptographic Provenance & Bit-Exact Pinning
- **Question Answered:** Are all third-party artifacts identical to their primary public releases and immutable across independent mirrors?
- **Verification Target:** SHA-256 digests of raw archives (`lean.tar.gz`), accompanying notes (`remark.pdf`, `the-music-of-the-primes.pdf`), root source files (`Statements.lean`, `Main.lean`), pinned toolchain (`lean-toolchain`), and pinned dependency manifest (`lake-manifest.json`).
- **What It Proves:** Zero tampering between public release, local static scanning, and remote cluster compilation.

### Gate 2 — Exhaustive Static Soundness Scan
- **Question Answered:** Does the proof archive contain any backdoors, incomplete placeholders, compiler escapes, or unverified axioms anywhere in the 175,187-file tree or the active import cone?
- **Verification Target:** Lexical/AST strip of comments and string literals followed by exhaustive classification of `axiom`, `sorry`/`sorryAx`/`admit`, `native_decide`, `unsafe`, `@[implemented_by]`/`@[extern]`/`@[csimp]`, `opaque`, kernel bypasses (`debug.skipKernelTC`, `addDeclWithoutChecking`, `setEnv`), broken local imports, and symbol shadowing.
- **What It Proves:** The static text contains no explicit axiom smuggling or unfinished holes. It also isolates benign environment extensions (e.g., `LibrarySuggestions.nameDenyListExt`) and kernel-checked metaprogramming helpers (`Lean.addDecl`) for manual inspection.
- **What It Does Not Prove:** Static cleanliness cannot guarantee type-checking success, termination, universe consistency, or absence of elaboration timeouts.

### Gate 3 — Small-TCB Closure & Statement Fidelity (Vacuity / Goalpost-Shifting Audit)
- **Question Answered:** Do the root theorems actually state the classical Riemann Hypothesis and Generalized Riemann Hypothesis in canonical mathematical definitions, without hidden side-conditions, vacuous divisions (`0⁻¹`), or weakened domains?
- **Verification Target:**
  - External Statement Trusted Computing Base (TCB) size: ratio $R_{\text{TCB}}$ of audited root statement lines (`Statements.lean` + `Main.lean` = 28 lines) to total active-cone code (`17,330,139` lines), checking for tiny human-readable specifications ($R_{\text{TCB}} = 1.62 \times 10^{-6}$).
  - Semantic equivalence check mapping root Lean predicates to standard Mathlib symbols (`RiemannHypothesis`, `riemannZeta`, `DirichletCharacter.LFunction`, `IsPrimitive`) and auditing total-function edge cases (`⁻¹`, `/`, `^`).
- **What It Proves:** No goalpost shifting, no shadowed definitions, and no vacuous hypotheses in the exported theorems.

### Gate 4 — Asymptotic Barrier & Machinery-Floor Audit
- **Question Answered:** Does the claimed proof strategy possess genuine structural mechanisms capable of bypassing classical impossibility barriers, or is it an under-powered "margin" attempt?
- **Verification Target:** Classifies proof architecture against historical obstructions—specifically the **Selberg Parity Barrier** and the **Convexity / Off-Diagonal Interference Ceiling** ($\operatorname{Re}(s) = 0.75$ for classical moment methods)—and checks whether the actual dependencies deploy sufficiently rich algebraic-arithmetic machinery (automorpic representations, étale/p-adic Hodge theory, arithmetic intersection, Galois deformation).
- **What It Proves:** Distinguishes plausible frontier mathematical strategies (`AUTOMORPHIC_LANGLANDS_FUNCTORIALITY`) from elementary/convexity paths provably blocked above the critical line.

### Gate 5 — Full Kernel Compilation & Axiom-Trace Certification
- **Question Answered:** Does the reference type-checker compile every module in the dependency tree from scratch to `exit_code = 0`, and which axioms appear in `#print axioms` for each exported theorem?
- **Verification Target:** Independent clean build (`lake build Statements` followed by `lake build Main`) on dedicated hardware (`Apple M4 Max`, 16-core ARM64, 64 GB RAM, `leanprover/lean4:v4.33.1`), followed by executing `#print axioms` over all five root theorems.
- **What It Proves:** Within Lean `v4.33.1`'s type theory, all five theorems (`riemannHypothesis`, `riemannZeta_eq_zero_re`, `LFunction_ne_zero_of_half_lt_re`, `LFunction_eq_zero_re`, `LFunction_eq_zero_re_of_isPrimitive`) compile cleanly and depend exclusively on `[propext, Classical.choice, Quot.sound]`, with `0 sorryAx` and `0` custom axioms.
- **Explicit Boundary:** Confirms single-kernel validity under Lean `v4.33.1`. Independent transitive replay (`leanchecker --fresh Main`) and external second-kernel replay (`nanoda`) remain distinct escalation gates.

### Gate 6 — Topological Dependency Spine & Barrier-Motif Cartography
- **Question Answered:** How is a 17.37-million-line formal corpus organized structurally, and where are the critical architectural bottlenecks bridging sub-theories?
- **Verification Target:** Dependency stratification across project libraries, measurement of direct fan-in and cross-layer shortcut arcs in the deductive DAG, and empirical indexing of domain-specific barrier-breaking sub-trees across the active proof cone.
- **What It Proves:** Maps which formal components act as load-bearing structural hubs vs. auxiliary leaf lemmas, providing a human-navigable blueprint of the proof's skeleton without needing to read 17 million lines of tactics.

### Gate 7 — Symmetric Informal Manuscript Forensics
- **Question Answered:** Does an informal human prose manuscript claiming the same theorem achieve deductive closure, or does it contain textual `sorry` equivalents?
- **Verification Target:** Structural segmentation of PDF/LaTeX manuscripts (940 pages in Masullo's draft), counting unresolved cross-references (`??`), explicit author placeholders (*"Insert statement"*, *"State and prove"*, *"Return here"*), empty/stub pages in conclusive chapters, and analytical limit-interchange dependencies (Montel's theorem / trace cutoffs).
- **What It Proves:** Identifies structural incompleteness in informal drafts even when their overarching mathematical strategy reads coherently and fluently.

### Gate 8 — Epistemia Governance, Trust Ladder & Contestability
- **Question Answered:** Given formal status, scope fidelity, and human verification budgets, what epistemic verdict should a scientific system issue?
- **Governance Regimes:**
  - `VALID_OPAQUE` (when formal proofs clear kernel checks over small TCB statements, yet internal comprehension and proof scale far exceed Bounded Human Verification Budgets).
  - `SUSPEND_JUDGMENT` (enforced via metacognitive abstention whenever informal manuscripts have critical missing theorems, or whenever accompanying prose extrapolates to unformalized claims such as the Extended Riemann Hypothesis).
- **Mandate:** Every verdict ships with an explicit **Contestability Card** naming (1) the single weakest pivot, (2) the refutation attempts executed, and (3) concrete empirical revocation conditions.

---

## Three-Tier Epistemic Trust Ladder Summary

1. **`CLAIMED`:** Masullo 940-page draft — coherent spectral strategy (`CGWH` stacks, Hardy-Sobolev spaces), but incomplete Chapter 13 blocks closure (`SUSPEND_JUDGMENT`).
2. **`STATEMENT_AUDITED`:** Alpöge static corpus prior to compilation — cleanly formatted Mathlib targets, 0 static `sorry`/`axiom`, yet unproven by kernel until compiled.
3. **`KERNEL_CHECKED` (Lean `v4.33.1`, Single Kernel):** Alpöge 5 formalized theorems post-compilation (`127,812s`, `exit_code = 0`, `[propext, Classical.choice, Quot.sound]`) — certified **`VALID_OPAQUE`**, while full `--fresh` replay continues asynchronously and independent second-kernel (`nanoda`) replay remains an open engineering resource bottleneck (`46.47 GB` NDJSON threshold).
