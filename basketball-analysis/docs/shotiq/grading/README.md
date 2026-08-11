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

## Rules for using it

* The render here is the one a specific grade refers to. **Replace it in the same
  commit as the ledger entry that quotes its numbers**, so a grade and the pixels
  it was given never drift apart.
* It is NOT a substitute for re-capturing. Re-measure from a fresh build when the
  source changes; this directory records what was graded, not what is current.
* Keep it to the screens actually in play. The full canonical set is ~92 PNGs and
  belongs wherever Kevin keeps design sources — committing all of it here to
  serve a grading loop would be storing the design library in a docs folder.
