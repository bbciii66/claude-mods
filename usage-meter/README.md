# Usage meter

A row above the Claude prompt box:

    5-hr ███░░░░░░░ 30%  resets in 3h 30m    Weekly █░░░░░░░░░ 9%  resets in 4d 23h
    Full resets: 1 · expires Oct 22 (in 10 days)   Cloud credit: $242 of $250 · expires Nov 5 (in 24 days)

The 5-hour and weekly bars update by themselves. Limit resets and cloud credit aren't shared with add-ons, so you type them:

    /meter resets 2                how many full resets (add an expiry like 10.22 if you want one)
    /meter fable 2                 how many Fable resets (expiry optional)
    /meter credit 242 250 11.5     credit left, total, expiry date
    /meter clear                   remove everything you entered

Resets and credit drop off the row on their own once their expiry date has passed.

## Install

At the prompt of a terminal session:

    /plugin install usage-meter --marketplace bbciii66/claude-mods

From a shell:

    claude plugin install usage-meter --marketplace bbciii66/claude-mods

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `bbciii66/claude-mods`, then Add plugin.
