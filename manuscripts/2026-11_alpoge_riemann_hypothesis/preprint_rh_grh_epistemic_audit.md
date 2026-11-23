# Independent Formal Verification, Epistemic Spine Cartography, and Comparative Auditing of Riemann Hypothesis Proof Claims

**Author:** Manuel Menéndez-González  
**Affiliation:** Fundación de Neurociencias, Oviedo, Spain  
**Public Verification Dossier:** <https://github.com/Fundacion-de-Neurociencias/riemann-hypothesis-audit-dossier>  
**Automated Verification Platform:** CoResearcher (<https://github.com/Fundacion-de-Neurociencias/coresearcher>)

---

## Abstract

We report an independent computational verification, cryptographic provenance audit, deductive dependency cartography, human-comprehensible verification anatomy, and comparative manuscript evaluation of two contemporary claims addressing the Riemann Hypothesis (RH) and Generalized Riemann Hypothesis (GRH): (i) Levent Alpöge's AI-assisted Lean 4 formalization comprising `175,187` modules (`17,374,215` lines), and (ii) Alessandro Maria Masullo's `940`-page informal human manuscript. Compiled from source on an independent Apple M4 Max workstation (16-core ARM64, 64 GB unified memory) under Lean `v4.33.1`, `lake build Main` completed deterministically with `exit_code = 0` in `127,812` seconds (~35.5 hours), producing `183,889` `.olean` binary artifacts. Axiom tracing (`#print axioms`) over all five exported root theorems—anchored cleanly in canonical `Mathlib` definitions (`RiemannHypothesis` and `DirichletCharacter.LFunction`) across a human-readable external statement trusted computing base of only `28` lines ($R_{\text{TCB}} = 1.62 \times 10^{-6}$)—confirmed zero `sorry` placeholders, zero custom axioms, and exclusive reliance on `[propext, Classical.choice, Quot.sound]`. Conversely, forensic segmentation of the `940`-page informal draft uncovered a blocking deductive gap in Chapter 13 (stub sections `13.1`–`13.2` and an empty conclusive `Theorem 13.3.1.2`), alongside `19` unresolved cross-references and `10` draft placeholders. Graph-theoretic dependency analysis across the `818,755` formal theorems and lemmas locates the structural bottleneck at deductive depths `6`–`7` within `ReciprocityTheory` (`UniformisationConclusion`, fan-in `2,390`, `2,379` cross-layer shortcut arcs) and identifies six recurring algebraic-arithmetic engines led by Galois modularity patching (`109,260` modules) and iterated unitary theta-lift chains (`15,750` modules). Beyond computational certification, we translate both what RH signifies—optimal deterministic cancellation rooted in combinatorial necessity rather than randomness or physical fine-tuning, contrasting unbounded arithmetic law against finite physical instantiation bounds—and how formal verification itself guarantees trust. Interpreting both artifacts through the Epistemia framework (`arXiv:2512.19466`), Thurston's distinction between verification and understanding, and resource-rational cognitive science (Griffiths, *The Laws of Thought*), we show why machine-checked validity (`VALID_OPAQUE`, Epistemia risk `0.245`) and human comprehension decouple orthogonally—and document transparently where our local 64 GB workstation hit a `46.47 GB` memory ceiling during single-threaded second-kernel export (`nanoda`), contrasting it with parallel high-memory community kernel replays.

---

## 1. Introduction

On November 20, 2026, mathematics witnessed an acute epistemic divergence. Levent Alpöge publicly released a compressed Lean 4 codebase (<https://alpo.ge/>) asserting unconditional formal proofs of the Riemann Hypothesis and the Generalized Riemann Hypothesis for Dirichlet $L$-functions developed iteratively with Claude, accompanied by a four-page note (`remark.pdf`) acknowledging that unfiltered prose expansion exceeded `250,000` pages. On the same day, Ravi Vakil posted a hurried announcement of Alessandro Maria Masullo's twelve-year, `940`-page human LaTeX manuscript proposing a spectral trace-formula proof of GRH for general Hecke $L$-functions (<https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/>).

This juxtaposition crystallizes a central metascientific challenge articulated by Quattrociocchi, Capraro, and Perc (`arXiv:2512.19466`) and grounded computationally by Griffiths (2026): classical mathematical peer review implicitly assumes that *deductive validity* and *human surveyability* move together. A `17.37`-million-line formal corpus shatters that assumption. Addressing it requires more than returning a binary compiler exit code; it demands a dual scientific contribution:
1. **Rigorous Multi-Gate Auditing:** Independently certifying cryptographic provenance, static soundness, statement fidelity, reference-kernel compilation, and informal manuscript completeness under transparent resource boundaries.
2. **Cognitive and Conceptual Translation:** Making intelligible to mathematicians, scientists, and philosophers *what* the Riemann Hypothesis signifies, *how* formal verification certifies truth without requiring human inspection of millions of lines, *how* the proof's core algebraic machinery works, and *why* formal certification marks the beginning—not the end—of human understanding.

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

From a strictly physicalist standpoint, numerical verification has already confirmed RH up to height $T = 3 \times 10^{12}$ (Platt & Trudgian, 2021); an off-line zero emerging only at some astronomical scale such as $10^{10^{500}}$ would lie forever outside the causal and computational capacity of the cosmos. Yet arithmetic provides a celebrated demonstration of why mathematicians cannot rest with finite verification inside the physical vessel: for more than a century, every computation ever performed supported $\pi(x) < \operatorname{li}(x)$. Nevertheless, Littlewood (1914) proved that $\pi(x) - \operatorname{li}(x)$ reverses sign infinitely often, with modern explicit bounds placing the first crossover below $e^{727.95134} \approx 1.397 \times 10^{316}$ (Saouter, Trudgian & Demichel, 2015)—vastly exceeding the $\sim 10^{80}$ particles or $\sim 10^{122}$ horizon bits of the observable universe. No physical computer bounded by cosmic entropy could ever have witnessed that sign change by brute enumeration, yet the inversion was already inscribed in the laws of arithmetic.

This delineates a clean division of labor: **physics characterizes the finite vessel** between empirical cutoffs, whereas **mathematics characterizes the intrinsic law of the medium**, distinguishing scale-invariant structural invariants from finite-scale mirages. Confirming RH changes nothing causally inside physical bounds, yet certifies that the cancellation observed inside our computational horizon is a **necessary structural consequence** of arithmetic—rendering teleological or physicalist "fine-tuning" interpretations unnecessary. Given the axioms of addition and multiplication, any off-line zero entails a logical contradiction.

---

## 3. Making Machine Verification Intelligible: Anatomy of Formal Trust and Static Audit

When a proof spans `17.37` million lines, human readers naturally ask an operational question: *how can we trust a computer check we cannot read line by line, and how might a claimed formal proof deceive us?*

### 3.1. Anatomy of Formal Trust: How a Machine Proof Could Fail
The decisive epistemic leverage of a dependent-type proof assistant like Lean 4 rests on **asymmetric auditing**: a human does *not* need to verify millions of proof steps to know *what* was proved, provided four distinct failure vectors are audited systematically (Table 1).

| Potential Failure Vector | How a Formal Proof Claim Could Mislead | What Humans Must Read | What Our Verification Gates Establish |
| :--- | :--- | :--- | :--- |
| **1. Specification / Statement Hacking** | Proving a weakened, shadowed, or vacuous theorem (e.g., redefining `LFunction`, omitting domain guards, or exploiting Lean's total-function convention where `x / 0 = 0`). | Only the **`28`-line external TCB** (`Statements.lean` + `Main.lean`) plus standard `Mathlib` definitions (`RiemannHypothesis`, `DirichletCharacter.LFunction`). | **Cleared (Gate 3):** Exact semantic match verified with `0` shadowing hazards and $R_{\text{TCB}} = 1.62 \times 10^{-6}$. |
| **2. Proof Skipping or Axiom Smuggling** | Leaving unfinished holes (`sorry`), inserting custom `axiom`s, trusting unverified compiled code (`native_decide`, `@[implemented_by]`), or mutating the environment (`addDeclWithoutChecking`). | Automated audit summary + verbatim `#print axioms` output. | **Cleared (Gates 2 & 5):** `0` holes, `0` custom axioms, `0` unsafe bypasses across `175,187` modules; `#print axioms` returns strictly `[propext, Classical.choice, Quot.sound]`. |
| **3. Verifier / Kernel Soundness Bug** | A theoretical soundness defect in the reference Lean `v4.33.1` kernel itself accepting an invalid derivation. | Kernel replay logs and independent checker reports. | **Partially Cleared Locally / Open Escalation (Gate 5):** Reference Lean `v4.33.1` build + `leanchecker` passed locally; `--fresh` replay running; external `nanoda` export hit `46.47 GB` RAM limit on our 64 GB host (independent high-RAM community replays noted in Section 4.3). |
| **4. Prose Scope Inflation** | Claiming broader theorems in accompanying text (e.g., full Extended Riemann Hypothesis) than were actually formalized in code. | Direct comparison between prose claims (`remark.pdf`) and `Statements.lean`. | **Flagged (Gate 8):** Only RH and Dirichlet GRH are compiled (`VALID_OPAQUE`, risk `0.245`); full package including unformalized ERH triggers `SUSPEND_JUDGMENT` (risk `0.4075`). |

### 3.2. Bit-Exact Input Pinning
Every primary source artifact was retrieved from public origins and verified locally by SHA-256 checksum:
- **Formal Archive (`https://alpo.ge/`, `lean.tar.gz`):** `239,275,554` bytes, SHA-256 `9631b4f020199e580ba86178cb56c6e9b09f690c2369a80dc4334aa93f49c7fc`, bit-identical against the public mirror `https://github.com/jsmorph/rh`.
- **Accompanying Note (`remark.pdf`):** `245,114` bytes, SHA-256 `3fc97784b71ddd44ff8aa0a177e99622a1c61b13cfa843a0989ee4a7a0cfeb8d`.
- **Root Specification Files:** `lean/src/Statements.lean` (`16` lines, SHA-256 `79ef7ca776e42abe1f46caee13ea09bd19f1e2d0b1620d8d5d200258f33b47bf`) and `lean/src/Main.lean` (`12` lines, SHA-256 `017645ca448f2fd1f6fd5c4c2cb2c6e96e472725be13f6e180ca6e1574360939`), verified identical between the original tarball and the compilation workspace.
- **Pinned Environment:** `leanprover/lean4:v4.33.1` with `Mathlib` revision `0df444a360eaa60ab8c11dca51a86af692955474`.
- **Informal Draft (`the-music-of-the-primes.pdf`):** `6,756,996` bytes (`940` pages, compiled with `pdfTeX-1.40.25`), SHA-256 `e039d3f6cf0a4b14f03c7edb85097752dd65c0a2fe543c76fe992be234f97bf`.

### 3.3. Full-Archive Static Soundness Inventory
Exhaustive streaming lexical analysis across all `175,190` archive files (`175,187` `.lean` sources totaling `17,374,215` lines and `1,030,531,854` bytes) recorded:
- `784,092` `theorem` declarations, `34,663` `lemma` declarations (`818,755` total), `212,819` `def`, `13,202` `abbrev`, `8,286` `structure`, `4,581` `instance`, `121` `inductive`, and `43` `class` declarations.
- **0** missing local imports across the full Unicode module graph, with `174,767` `.lean` files (`99.76%`, `17,330,139` lines) statically reachable from `Main.lean` and only `420` pruned deadweight files (`0.24%`).
- **0** custom `axiom`, `sorry`/`sorryAx`/`admit`, `native_decide`, `unsafe`, `@[implemented_by]`, `@[extern]`, `@[csimp]`, `opaque`, `debug.skipKernelTC`, or `addDeclWithoutChecking` hazards.
- Five calls to `Lean.modifyEnv` in `BuildAid/D1.lean`..`D5.lean` alter only `LibrarySuggestions.nameDenyListExt` (tactic search hints), and three metaprogramming helpers (`Imports.lean`, `OwnStruct.lean`, `CutCptCopy.lean`) invoke kernel-checked `Lean.addDecl`. Two `partial def` declarations exist exclusively inside metaprogramming helpers (`CutCptCopy.go`, `OwnStruct.copyAt`), never within mathematical theorem objects.

### 3.4. Statement Fidelity and Trusted Computing Base Ratio
Human auditability of *what* was proved concentrates in a minimal `28`-line external statement TCB (`Statements.lean` + `Main.lean`), giving $R_{\text{TCB}} = 1.62 \times 10^{-6}$ relative to the `17,330,139`-line active cone. Auditing total-function edge cases (`⁻¹`, `/`, `^`) reveals `0` open hazards in `Statements.lean` and `Main.lean`, while intermediate character-group inverses and prime-power bases in `CritLine.lean` and `ClaimStrip.lean` operate safely under explicit `p.Prime` guards and group inversion (never field division by zero). Semantic comparison confirms exact alignment for `DirichletLZerosOnLine` and `DirichletLNonvanishingRightOfHalf` and notes that Mathlib's `RiemannHypothesis` quantifies over $\mathbb{C} \setminus \{1, -2, -4, \dots\}$ (stronger as a standalone predicate than the critical strip $0 < \operatorname{Re}(s) < 1$, and classically equivalent via the functional equation and $\operatorname{Re}(s) \ge 1$ non-vanishing proved in `ClaimStrip.lean`). Two auxiliary `def LFunction` declarations reside inside isolated local namespaces (`GJLocalZeta`, `HeckeLFunction`) without shadowing `DirichletCharacter.LFunction`.

---

## 4. Independent Compilation, Metamathematical Axiom Reading, and Resource Boundaries

### 4.1. Reference Hardware Compilation Results
Clean compilation was executed independently on an **Apple M4 Max (16-core ARM64, 64 GB unified memory, macOS Darwin 25.5.0)** under `leanprover/lean4:v4.33.1`:
- **`lake build Statements`:** `exit_code = 0` in `31` seconds.
- **`lake build Main`:** `exit_code = 0` in **`127,812` seconds** (`35 h 30 min 12 s`), compiling `175,187 / 175,187` project modules (`183,889` `.olean` files total including cached `Mathlib` units, `98 GB` build footprint).
- **`#print axioms` Verification (`110` seconds, `exit_code = 0`):** Output captured verbatim in `certificates/alpoge_rh_axioms.log` (SHA-256 `590d5252e7e5a4e6d9faef1895216c77eb103d6667037d832eaedaa34fa3186d`). All five exported root theorems—`riemannHypothesis`, `riemannZeta_eq_zero_re`, `LFunction_ne_zero_of_half_lt_re`, `LFunction_eq_zero_re`, and `LFunction_eq_zero_re_of_isPrimitive`—depend strictly on:
  ```text
  [propext, Classical.choice, Quot.sound]
  ```

### 4.2. Metamathematical Significance of Standard Axiom Closure
To readers outside type theory, the three-item log `[propext, Classical.choice, Quot.sound]` may resemble routine compiler output; metamathematically, it settles a foundational question opened by Gödelian incompleteness. Because the Riemann Hypothesis is equivalent to a $\Pi_1^0$ arithmetical sentence—for example, Lagarias's elementary inequality $\sigma(n) \le H_n + e^{H_n}\log H_n$ for all $n \ge 1$ (Lagarias, 2002)—a counterexample would in principle be finitely checkable, leaving open the logical possibility that RH could hold in the standard natural numbers while remaining independent of standard mathematical axioms.

Lean 4's kernel implements dependent type theory augmented solely by three canonical principles:
- **`propext`** (propositional extensionality: logically equivalent propositions are equal),
- **`Classical.choice`** (standard classical choice / non-constructive existence), and
- **`Quot.sound`** (quotient soundness for algebraic and analytic equivalence classes).

While this dependent type-theoretic foundation is stronger than elementary Peano Arithmetic (comparable in consistency strength to standard ZFC set theory with universe levels), it is completely standard across modern mathematics. Confirming that all five root theorems discharge strictly over `[propext, Classical.choice, Quot.sound]` certifies that RH and Dirichlet GRH require **no exotic large-cardinal hypotheses, no new physical postulates, and no unverified axioms**: their truth is already deductively contained within standard mathematical foundations.

### 4.3. Transparent Boundaries, Hardware Limits, and Parallel Community Checks
Scientific honesty requires distinguishing clearly between what *our* independent 64 GB workstation run established, where it encountered physical resource ceilings, and what independent community groups subsequently reported on higher-memory infrastructure:
1. **Single-Kernel Reliance & `--fresh` Escalation (Local Audit):** Running bundled `lake env leanchecker Main` returned `exit_code = 0`, checking `Main.lean` against precompiled `.olean` imports; however, default `leanchecker` checks environment integrity using Lean's own kernel rather than serving as an independent re-implementation. Full transitive replay (`lake env leanchecker --fresh Main`) was launched asynchronously on our host to verify fresh import elaboration from clean state.
2. **Physical Memory Wall During External Kernel Export (Local Audit):** We compiled both the Rust external verifier `nanoda_bin` and `lean4export` against Lean `v4.33.1`. Single-threaded NDJSON export via `lean4export Main` expanded to `46.47 GB` on our 64 GB host, triggering virtual memory thrashing before EOF. Echoing Section 2.2's vessel-versus-medium duality, a finite physical workstation can verify an infinite asymptotic theorem *only* through compact deductive stratification, and immediately confronts its own physical memory wall when forced to serialize the proof flatly for an external checker.
3. **Parallel Institutional Multi-Kernel Reports (External Context):** Independently of our 64 GB workstation audit, the Lean FRO and Mathlib Initiative issued a joint verification statement certifying statement fidelity and Lean compilation on November 21, 2026 (<https://leanprover-community.github.io/blog/posts/riemann-hypothesis/>), and Andrew Sutherland (MIT) publicly documented high-memory independent replays using external kernels including `nanoda`, `con-leche`, and `lean4lean` (<https://math.mit.edu/~drew/grh/>). Those external high-RAM results corroborate kernel-level soundness while leaving the central problem of **human epistemic comprehension** completely unresolved.
4. **Unformalized Extrapolation to ERH:** While `remark.pdf` anticipates extension to the Extended Riemann Hypothesis (ERH), only RH and Dirichlet GRH are formalized in `Statements.lean` and verified in `Main.lean`.

---

## 5. Deductive Spine Cartography and Six Barrier-Breaking Motifs

To make the inner logic of `17.37` million lines of code accessible to human mathematicians, we combine a three-step conceptual bridge with full topological mining of the compiled dependency DAG (detailed further in our companion *Mathematical Architecture Primer*):
- **Intuition (Why Classical Tools Stall):** Proving RH reduces via the Guinand–Weil explicit formula to certifying non-negativity of a family of spectral test functionals. Over function fields, Stepanov's auxiliary-polynomial method detects zero multiplicity by taking algebraic derivatives—an operation with no naive analog over the integers $\mathbb{Z}$.
- **Mechanism (Pure Algebraic Architecture, Not Mysticism):** Rather than invoking an exotic physical operator, Alpöge's codebase generalizes classical divisibility ideas (in the lineage of Chebyshev and Stepanov) through arithmetic geometry and automorphic forms: it builds iterated chains of unitary *theta lifts* $U(X_0) \to \dots \to U(X_m)$ ($m \sim \sqrt{X}$) to simulate differential multiplicity natively over $\mathbb{Z}$, transforms the resulting Gan–Gross–Prasad (GGP) periods into Bessel periods via Rallis's *seesaw* identity, and controls arithmetic heights and denominators via Bost's slope inequality, Siegel mass formulas, and Galois modularity patching.
- **Empirical Footprint in the Lean DAG:** Topological mining across `818,755` theorems and lemmas reconstructs the exact library stratification (Table 2).

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

## 6. Comparative Forensic Evaluation of Formal and Informal Proof Submissions

While the Lean corpus discharges every dependency syntactically (`0` `sorry`, `exit_code = 0`), auditing Masullo's `940`-page informal manuscript reveals the exact mirror-image failure mode. Although Chapters 1–12 develop Hardy–Sobolev spaces $W_I^{s,2}(G)$, periodic Schauder bases, and quotient stacks toward a trace formula (`Theorem 12.5.1.1`, p. 519), structural parsing uncovers **critical incompleteness in the conclusive chapters**:
- In Section `12.4.1` (pp. 514–515), author footnote 2 leaves a placeholder instruction to revise the $(\lambda, \varepsilon)$-cutoff and re-establish convergence of integral `(12.4.1.23)`.
- **Chapter 13 (*Zeros of Hecke L-functions*, pp. 521–522)** has empty stub headings for Sections `13.1` and `13.2`, references a nonexistent `"Theorem ??"`, and leaves the core bridge—**`Theorem 13.3.1.2 (Divisor of L(s, χ))`**—completely empty beneath footnotes `"2 Insert statement."` and `"3 State and prove the Main Theorems..."`.
- Across the `940` pages, forensic indexing located `19` broken `??` cross-references, `10` author draft TODO notes, and `13` empty/near-empty pages (`<400` characters). Without rigorous closure of the Montel limit interchange deducing $L'_f / L_f$ holomorphy from the regularized trace formula, the informal proof remains analytically open (`CLAIMED`, Epistemia risk `0.850`, verdict `SUSPEND_JUDGMENT`).

---

## 7. Epistemic Governance, Understanding Versus Certification, and the Distillation Horizon

Evaluated through Quattrociocchi, Capraro & Perc (`arXiv:2512.19466`), William Thurston's classic essay *On Proof and Progress in Mathematics* (Thurston, 1994), and Griffiths's resource-rational cognitive science (Griffiths, 2026), these results expose two complementary epistemic regimes:
- **Machine-Without-Comprehension (`VALID_OPAQUE`, Epistemia risk `0.245`):** Alpöge's five formalized RH/GRH theorems clear single-kernel verification on a minimal `28`-line TCB ($R_{\text{TCB}} = 1.62 \times 10^{-6}$), yet `17.37` million lines of formal tactics vastly exceed bounded human verification budgets (`ParsingAndComprehensionFault`). When evaluated as a complete package including unformalized ERH prose expectations, epistemic governance enforces `SUSPEND_JUDGMENT` (Epistemia risk `0.4075`).
- **Intuition-Without-Convergence (`SUSPEND_JUDGMENT`, Epistemia risk `0.850`):** Masullo's manuscript provides human-surveyable prose intuition while lacking conclusive theorem proofs in Chapter 13.

As Thurston (1994) argued three decades before AI-scale theorem proving, mathematics does not advance merely by accumulating certified truth values; it advances through **human understanding**—compact mental schemas that explain *why* a result holds and transfer across problems. In Griffiths's Marr-level framework, bounded biological minds operate under strict resource-rational constraints, reasoning over compressed conceptual abstractions (such as the six algebraic motifs and the `UniformisationConclusion` hub) rather than millions of micro-rewrites.

Consequently, verifying a `17.37`-million-line formal proof completes only **Phase 1 (Certification)** of mathematical progress. **Phase 2 (Cognitive Distillation)**—compressing millions of machine-verified lines into transparent, human-surveyable expositions—has immediately emerged as the defining challenge of the field, reflected both in early community prose-reconstruction drafts (such as preliminary third-party guides by Michael Rubinstein, Jimmie Adriazola, and Robin Zhang tracked at <https://riemannhypothesisclaude.org/>) and in automated structural cartography. By pairing bit-exact kernel certification with stratified dependency spine extraction, interactive D3 navigation, a progressive mathematical primer, and explicit **Contestability Cards**, our framework provides reproducible empirical scaffolding for turning `VALID_OPAQUE` artifacts into genuine human comprehension.

---

## 8. Data and Code Availability

All primary cryptographic digests, reference hardware compilation records, raw `#print axioms` logs (`SHA-256: 590d5252...`), static soundness counts, stratified dependency spine summaries, interactive D3 explorer (`epistemic_spine_explorer.html`), progressive mathematical primer (`mathematical_architecture_primer.md`), and comparative forensic inventories for both targets are openly archived in the public verification dossier at <https://github.com/Fundacion-de-Neurociencias/riemann-hypothesis-audit-dossier>. Automated end-to-end execution of multi-gate scientific auditing is provided through **CoResearcher** at <https://github.com/Fundacion-de-Neurociencias/coresearcher>. Both repositories are publicly accessible without authentication.

---

## References

1. Alpöge, L. (2026). Formal Lean 4 Repository and Explanatory Remark on the Riemann Hypothesis and Generalized Riemann Hypothesis. <https://alpo.ge/> (Explanatory note: <https://alpo.ge/remark.pdf>; bit-exact community mirror: <https://github.com/jsmorph/rh>).
2. Bekenstein, J. D. (1981). Universal upper bound on the entropy-to-energy ratio for bounded systems. *Physical Review D*, 23(2), 287–298. DOI: `10.1103/PhysRevD.23.287`.
3. Egan, C. A., & Lineweaver, C. H. (2010). A larger estimate of the entropy of the universe. *The Astrophysical Journal*, 710(2), 1825–1834. DOI: `10.1088/0004-637X/710/2/1825` (<https://arxiv.org/abs/0909.3983>).
4. Griffiths, T. (2026). *The Laws of Thought: The Quest for a Mathematical Theory of the Mind*. Henry Holt and Co., ISBN `978-1250358356`.
5. Lagarias, J. C. (2002). An elementary problem equivalent to the Riemann hypothesis. *The American Mathematical Monthly*, 109(6), 534–543. DOI: `10.2307/2695443` (<https://arxiv.org/abs/math/0008177>).
6. Lean FRO & Mathlib Initiative (2026). Lean verification of the Riemann Hypothesis. *Lean Community Blog*, November 21, 2026. <https://leanprover-community.github.io/blog/posts/riemann-hypothesis/>.
7. Littlewood, J. E. (1914). Sur la distribution des nombres premiers. *Comptes Rendus de l'Académie des Sciences de Paris*, 158, 1869–1872.
8. Lloyd, S. (2002). Computational capacity of the universe. *Physical Review Letters*, 88(23), 237901. DOI: `10.1103/PhysRevLett.88.237901` (<https://arxiv.org/abs/quant-ph/0110141>).
9. Menéndez-González, M., & Fundación de Neurociencias (2026). CoResearcher: An Open System for Coordinating Scientific Work Between Humans and AI Agents. <https://github.com/Fundacion-de-Neurociencias/coresearcher>.
10. Montgomery, H. L. (1973). The pair correlation of zeros of the zeta function. *Proceedings of Symposia in Pure Mathematics*, 24, 181–193. DOI: `10.1090/pspum/024/9944`.
11. Odlyzko, A. M. (1987). On the distribution of spacings between zeros of the zeta function. *Mathematics of Computation*, 48(177), 273–308. DOI: `10.1090/S0025-5718-1987-0866115-0`.
12. Platt, D., & Trudgian, T. (2021). The Riemann hypothesis is true up to $3 \cdot 10^{12}$. *Bulletin of the London Mathematical Society*, 53(3), 792–797. DOI: `10.1112/blms.12460` (<https://arxiv.org/abs/2004.09765>).
13. Quattrociocchi, W., Capraro, V., & Perc, M. (2025). Epistemological Fault Lines Between Human and Artificial Intelligence. `arXiv:2512.19466` (<https://arxiv.org/abs/2512.19466>).
14. Saouter, Y., Trudgian, T., & Demichel, P. (2015). A still sharper region where $\pi(x) - \operatorname{li}(x)$ is positive. *Mathematics of Computation*, 84(295), 2433–2446. DOI: `10.1090/S0025-5718-2015-02930-5`.
15. Sutherland, A. (2026). RH Lean proof: verification files. Massachusetts Institute of Technology. <https://math.mit.edu/~drew/grh/>.
16. Thurston, W. P. (1994). On proof and progress in mathematics. *Bulletin of the American Mathematical Society*, 30(2), 161–177. DOI: `10.1090/S0273-0979-1994-00502-6` (<https://arxiv.org/abs/math/9404236>).
17. Vakil, R. (2026). Hurried Announcement: Alessandro Masullo GRH, linking Masullo, A. M., *The Music of the Primes*. <https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/>.
18. von Koch, H. (1901). Sur la distribution des nombres premiers. *Acta Mathematica*, 24, 159–182. DOI: `10.1007/BF02403071`.
