# Implementation prompt (copy into Claude Code)

Implement the "top-off demo" feature for Calado Predictivo, in this order.

1. First run `git pull`, then read `AGENTS.md`. The hackathon scope is closed: if something is not IN, say no.
2. Read `.scratch/top-off-demo/spec.md` (the spec) and the tickets in `.scratch/top-off-demo/issues/` (01 to 04). The spec is the source of truth.
3. Work on a feature branch, never on `main`. Implement the tickets in dependency order: 01, 02, 03, 04. 01 and 02 do not block each other, but both touch the single `App.jsx`, so do them one after the other.
4. One concern per commit, Conventional Commits, no AI attribution. Do not push and do not open PRs unless asked.
5. Smallest change that satisfies each ticket. No refactors, no new dependencies, no new endpoint, no tests (OUT of scope).
6. UI copy in Spanish. Use the domain terms verbatim: calado, bajante, falso flete, lucro cesante, Panamax, top-off, IMO, INA, BCR, AIS.
7. Never claim something works without a command and its observed result (`npm run lint`, `npm run build`, `curl`, or the UI). After each ticket, report the actual output.
8. If a ticket takes more than 30 minutes without closing, stop and report options.
9. Do not touch `spec-español.md` or the README roadmap. Do not read or write `.env` or credentials.

Points that are easy to get wrong:
- Never say or imply that cargo travels by train from Rosario: the vessel loads partially at Gran Rosario and sails south to complete its cargo at the port.
- The AIS indicator is never green, even with a linked IMO.
- The order text names the selected port, not a fixed Bahía Blanca.
- "34 ft" is the Panamax design draft (a model assumption). Never show it as a bare "34 pies"; it is not the Buenos Aires draft or the channel's guaranteed draft.
- Keep Quequén's premium above ~USD 37/tn, so Bahía Blanca stays the best option in the critical scenario.

At the end, report per ticket: what changed, the commands you ran and their observed results, and anything pending.
