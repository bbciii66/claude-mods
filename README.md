# Ben's Claude Code mods

Two small mods for the Claude desktop app and Claude Code.

## Ember glow

A warm-black theme (with a warm cream light mode) in Claude orange. A soft orange glow pulses slowly in the corners, a slowly turning starburst sits near the top, and a small pixel crab walks along the top of the usage bar. The crab stops and thinks (with a thought bubble) while Claude works on a message, and hops with sparkles when an answer is done. All the art stays at the edges, away from the chat text.

The look shows in the desktop app. The terminal draws no themes.

## Usage meter

A row above the prompt box with your 5-hour and weekly plan usage and reset countdowns. Full limit resets and cloud credit aren't shared with add-ons, so you type them with `/meter resets <how many> <expiry>` and `/meter credit <left> <total> <expiry>`, and `/meter clear` removes them. Expired items drop off the row on their own.

## Install

At the prompt of a terminal session:

```
/plugin install ember-glow --marketplace bbciii66/claude-mods
/plugin install usage-meter --marketplace bbciii66/claude-mods
```

From a shell:

```
claude plugin install ember-glow --marketplace bbciii66/claude-mods
claude plugin install usage-meter --marketplace bbciii66/claude-mods
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `bbciii66/claude-mods`, then Add plugin.
