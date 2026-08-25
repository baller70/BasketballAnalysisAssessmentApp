# `grading/` — the inputs an independent grader needs, in git

**The scratchpad is not durable. Git is.** That line already opens the ledger,
and it is why `measure/` was committed. This directory extends it to the last
non-durable thing in the grading loop.

## What went wrong

A third independent grader was dispatched on screen 004 and **returned nothing**.
Not a quota death, not a bad brief — the container rolled back after dispatch and
took its inputs with it:

    capture   $SCRATCH/cap004f/004-create-account.png   GONE
    brief     $SCRATCH/BRIEF-004.md                     GONE
    server    port 3196                                 DOWN
    dist      .next-004f                                GONE

and, worse, the same rollback reverted the git checkout to `ce6a445`, a commit
from before `measure/` existed — so `python3 -m measure.report004` failed with
`No module named 'measure'` in a repo that demonstrably contains it three commits
later. The work was all on the remote and a `git merge --ff-only` restored it,
but the grader had already died with nothing to read.

That is the third or fourth rollback of the session. Captures, briefs,
`node_modules/.prisma` and every `.next-*` have each been wiped mid-run at least
once.

## What lives here

    canonical/<screen>.png   the design canonical, 853x1844 device px
    render/<screen>.png      the capture the grade was made against
    render/<screen>-report.txt   its `measure.report004` band table

A grader briefed against **these paths** can be dispatched at any time and will
still find its inputs after a rollback, because a rollback restores git.

## The first version of this directory did not work

It was created, the README above was written, `git add` was run, and **the PNGs
never went in**. `.gitignore:99` is a blanket `*.png`, so git accepted the
README and the report table and silently dropped the only two files the
directory exists to hold. A grader dispatched against these paths in the round
that followed found them anyway — because they were sitting untracked on
disk — which is exactly why nobody noticed. The next rollback would have taken
them again and the failure would have looked identical to the one this
directory was built to prevent.

**They are `git add -f`'d now.** Anything added here in future needs the `-f`,
and the check that it worked is `git ls-files docs/shotiq/grading/`, not the
absence of an error from `git add`.

## Rules for using it

* The render here is the one a specific grade refers to. **Replace it in the same
  commit as the ledger entry that quotes its numbers**, so a grade and the pixels
  it was given never drift apart.
* **And with the ledger's CURRENT ARTEFACT block**, which is now the third thing
  that moves with them. Rule 96 tells a post-restart recovery to require the
  render's md5 and its whole-screen figure to match what the ledger records — and
  for its first several firings the ledger recorded only the figure, so the exact
  half of that test did not exist. `node docs/shotiq/artefact-check.mjs` compares
  render md5, canonical md5 and the reported figure against that block and exits
  non-zero on any disagreement; `--update` rewrites it. Run the update in the same
  commit as the render, and the check any time a dist is in doubt. A STALE md5
  there is worse than none, because rule 96 would then reject a good dist.
* It is NOT a substitute for re-capturing. Re-measure from a fresh build when the
  source changes; this directory records what was graded, not what is current.
* Keep it to the screens actually in play. The full canonical set is ~92 PNGs and
  belongs wherever Kevin keeps design sources — committing all of it here to
  serve a grading loop would be storing the design library in a docs folder.
