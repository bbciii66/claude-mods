# Ben's Claude Code mods

Two small mods for the Claude desktop app and Claude Code.

## Ember glow

A warm-black theme (with a warm cream light mode) in Claude orange. A soft orange glow pulses slowly in the corners, a slowly turning starburst sits near the top, and a small pixel crab walks along a thin strip just above the usage bar. All the art stays at the edges, away from the chat text.

The look shows in the desktop app. The terminal draws no themes.

### What the crab and glow tell you

| State | Crab | Glow and burst |
|---|---|---|
| Working | Stops with a thought bubble | Hotter glow, faster burst |
| Answer done | Hops with sparkles | Back to normal |
| Waiting for you (approval) | Waves both claws, with a bouncing "!" | Amber, throbbing |
| Error | Flips onto its back, turns red | Dim red, slow |
| Asleep (after 5 quiet minutes) | Curls up with floating "z"s | Slows right down |
| Long run finished (over 3 minutes) | A small gold baby crab joins him for a minute | The burst turns gold for a minute |

### Helper agents

Each helper agent Claude runs gets its own small star wheel at the right end of the strip. It spins while the helper works, flashes amber if it needs you, and stops (dimmed) when done. Finished wheels fade out after 90 seconds. Hover a wheel to see its task and how long it ran. A count such as "3 helpers working" or "3 helpers finished" sits beside the wheels, and the crab stops short of it so they never overlap.

### Commands

| Command | What it does |
|---|---|
| `/look` | Lists the looks. |
| `/look <name>` | Switches this chat's look: `ember` (default), `teal`, `violet`, `blue` or `tokyo`. |
| `/look off` | Back to the app's own look, with no theme. |
| `/crab` | Turns the crab off or back on for this chat. `/crab on` and `/crab off` also work. |

Each look has a dark and a light version, with its own glow, burst and crab colors. `tokyo` is a night-city look with neon cyan, violet and pink, pink glow rings, yellow text for Claude and cyan for your own messages. The choice is saved per chat, so a new chat starts in `ember`. With the crab off and no helpers running, the strip disappears and the chat gets its room back. Helper wheels still show while helpers run.

## Usage meter

A row above the prompt box with your 5-hour and weekly plan usage and reset countdowns. When no 5-hour window is running it shows the 5-hour bar as idle.

Full limit resets, Fable resets and cloud credit aren't shared with add-ons, so you type them in:

| Command | What it does |
|---|---|
| `/meter resets <how many> [expiry]` | Full limit resets. The expiry date (for example `12.10`) is optional. |
| `/meter fable <how many> [expiry]` | Fable resets, same format. |
| `/meter credit <left> <total> <expiry>` | Cloud credit left, the total, and its expiry date. |
| `/meter clear` | Removes everything you entered. |

Anything whose expiry date has passed drops off the row on its own.

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
