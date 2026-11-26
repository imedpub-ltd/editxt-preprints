# Comparative Forensic Audit: Machine-Formalized Proof vs. Informal Human Manuscript

On November 20, 2026, two distinct claims targeting the Riemann Hypothesis (RH) and Generalized Riemann Hypothesis (GRH) emerged simultaneously:
1. **Alpöge (+ Claude AI):** A `175,187`-file Lean 4 formalization claiming RH and Dirichlet GRH (`https://alpo.ge/`), accompanied only by a 4-page explanatory note (`remark.pdf`).
2. **Alessandro Maria Masullo:** A `940`-page, 12-year solo human LaTeX manuscript claiming general GRH for Hecke $L$-functions (`the-music-of-the-primes.pdf`), announced via Ravi Vakil's blog (`https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/`).

Evaluating both side by side exposes the central methodological tension of contemporary mathematical science.

---

## 1. Empirical Side-by-Side Comparison

| Dimension | Alpöge (+ Claude, Lean 4 Corpus) | Masullo (940-Page Human Manuscript) |
| :--- | :--- | :--- |
| **Mathematical Target** | RH (`RiemannHypothesis`) + Dirichlet GRH (`DirichletCharacter.LFunction`) | General GRH for Hecke $L$-functions over arbitrary number fields $F$ |
| **Authorship Model** | Human mathematician + AI agent collaboration | Solo human mathematician (12 years; partial prior feedback noted) |
| **Scale & Medium** | `175,187` `.lean` files (`17,374,215` lines, `1.03 GB` source); `183,889` `.olean` artifacts (`98 GB` build) | `6,756,996` bytes PDF (`940` pages, 14 chapters + 5 appendices, `0` lines of Lean 4) |
| **Cryptographic Pinning** | `lean.tar.gz` SHA-256: `9631b4f0...49c7fc` (bit-exact across `alpo.ge` & mirror) | `the-music-of-the-primes.pdf` SHA-256: `e039d3f6...34f97bf` |
| **Core Mathematical Program** | Unitary Langlands functoriality, iterated theta lifts ($m \sim \sqrt{X}$), Stepanov determinants, GGP/Bessel positivity, Bost slope, Iwasawa descent, Siegel mass, Galois patching | Connes/Deninger trace program, Hardy–Sobolev spaces $W_I^{s,2}(G)$, periodic Schauder bases, nuclear LF-spaces, `CGWH` quotient stacks, regularized $S$-local/global trace formula |
| **Formal & Structural Integrity** | **0** `sorry`/`axiom`/`native_decide`/`unsafe`; `lake build Main` exit `0` (`127,812s`); `leanchecker --fresh Main` exit `0` (`26,898s`); `#print axioms` strictly `[propext, Classical.choice, Quot.sound]`; bounded-RAM `lean4lean` (`67f63b0c`) cleared all `175,187/175,187` modules (`1,927,488` decls, `0` failures in `204,972.82s`: `175,170` default + `17` elevated-fuel) | **Critical incompleteness:** Chapter 13 (conclusive RH/GRH chapter, pp. 521–522) has empty `13.1`/`13.2`, broken `"Theorem ??"`, and completely blank `Theorem 13.3.1.2 (Divisor of L(s, χ))` |
| **Draft & Citation Hygiene** | 0 broken local Lean imports; 28-line external TCB matches Mathlib definitions cleanly | `19` unresolved `??` references, `10` author draft TODO markers (*"Insert statement"*, *"Return here"*), `13` empty/stub pages |
| **Human Surveyability** | Near-zero directly in prose (`remark.pdf` notes Claude's natural-language summary exceeded `250,000` pages) | High strategic clarity in Chapter 1 letters to Sarnak and Chapters 2–12 exposition, but fails deductive closure |
| **Trust Ladder Status** | `KERNEL_CHECKED` (Lean `v4.33.1` full build + `--fresh` replay `exit_code = 0`; full-archive `lean4lean` `175,187/175,187` passed with C++ design lineage caveat; clean-room `nanoda` pending high-RAM host) | `CLAIMED` (incomplete draft; blocked before audit acceptance) |
| **Epistemia Risk & Judgment** | **`0.245`** (`VALID_OPAQUE` on the 5 formalized theorems); **`0.4075`** (`SUSPEND_JUDGMENT` on unformalized ERH remark) | **`0.850`** (`SUSPEND_JUDGMENT` — critical missing proof in Chapter 13) |

---

## 2. Forensic Evidence in the Informal Manuscript's Conclusive Gap

Textual inspection of `the-music-of-the-primes.pdf` confirms that Chapters 1–12 carefully construct a nuclear-space functional-analytic framework culminating in **Theorem 12.5.1.1 (Trace Formula)** on page 519. However, the bridge from that trace formula to zero-free regions collapses in Chapters 12.4 and 13:
1. **Unresolved Cutoff Modification (pp. 514–515, Ch. 12.4):** Author footnote 2 reads: *"Return here and change the choice of smooth $(\lambda,\varepsilon)$-cutoff into a smoothening of $\mathbf{1}_{[1/\lambda'',\lambda]}$ with $\lambda''$ not tied to $\lambda$. Then study the convergence of the integral in (12.4.1.23)..."*
2. **Stubbed Chapter 13 Sections (pp. 521–522):** Section `13.1 (Recollections on the Explicit Formulas)` and Section `13.2 (Holomorphic families of test functions)` contain headings only with zero mathematical body.
3. **Blank Conclusive Theorem (p. 522):** After quoting Theorem `13.3.1.1` (marked *"1 Correct statement"*), the text writes: *"Upon combining Theorem 13.3.1.1 and Theorem `??`, we obtain the following: **Theorem 13.3.1.2 (Divisor of $L(s, \chi)$).**"* No statement or proof follows—only footnotes 2 and 3 (*"2 Insert statement."*, *"3 State and prove the Main Theorems, also explaining how to deduce them by approximation $\varphi \to e^{-s|\log(t)|}$ as $\operatorname{Re}(s) > 1$."*).
4. **Analytic Interchanging Risk:** Deducing holomorphy of $L'_f / L_f$ in $\mathbb{C}_{>a}$ from the compactly supported trace formula via parameterized families $\varphi_{h,\varepsilon,z}$ and Montel's theorem requires rigorously commuting $\varepsilon \to 0$ and $h \to \mathbf{1}_{(1,+\infty)}$ past infinite non-Archimedean and spectral sums—the very closure missing from Chapter 13 (alongside post-announcement analytical issues reported to Ravi Vakil).

In formal proof engineering, a missing conclusive theorem between a major intermediate proposition and the target conjecture is identically equivalent to placing `sorry` at the root theorem.

---

## 3. Epistemic Synthesis: Symmetry Without Illusion

The contrast between Alpöge and Masullo establishes two inverse failure modes predicted by Quattrociocchi, Capraro & Perc (*Epistemia*, `arXiv:2512.19466`) and Griffiths (*The Laws of Thought*, 2026):
- **Intuition Without Convergence (Masullo):** Satisfies classical human expectations of narrative legibility and big-picture program design, tempting readers via structural fluency even where conclusive limit-exchange proofs remain missing (`SUSPEND_JUDGMENT`).
- **Machine Without Comprehension (Alpöge):** Discharges all `175,187` formal modules cleanly under Lean `v4.33.1` over an astonishingly small 28-line external statement TCB, yet produces an artifact whose algorithmic complexity vastly overwhelms unaided human review budgets (`VALID_OPAQUE`).

Neither extreme suffices on its own. Scientific epistemology in the era of AI co-scientists requires preserving hard formal verification gates while building structural maps—like the topological spine and motif cartography in this dossier—so human mathematicians can systematically audit, understand, and refine machine-verified discoveries.
