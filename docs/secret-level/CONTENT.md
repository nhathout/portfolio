# ✍️ the content checklist

**Every word she reads lives in `data/memories.json`.** (Start from
`data/memories.example.json` — it now contains *all* of it, already filled in
with the current copy. Edit that one file, then re-encrypt; see the README.)

Anything you delete from the file falls back to the built-in copy in
`src/world.js`, so the game never breaks — but the built-ins are mine, not
yours. The rows marked **TODO** below are the ones still holding a placeholder.

| where it lives in the file | what it is |
|---|---|
| `meta` | her name, the title screen |
| `points.<id>.title` / `.lines` | every memory spot, door and person |
| `noah.greet_la` / `.chat` / `.after` | pixel-Noah's lines |
| `mookie.lines`, `pets.<id>` | the animals |
| `npcs.<id>` | background townsfolk |
| `figs.all`, `pumpkins.all` | the collectible payoffs |
| `finale.prompt` / `.lines` / `.title` / `.subtitle` | **the reveal** |
| `party.surprise` / `.cake` / `.after` | 🎂 the birthday party skit |
| `credits.title` / `.sub` / `.groups` / `.end` | the end-credits reel |

---

## Mini LA — outdoors

| id | what | needed for the ending? | status |
|---|---|---|---|
| `la_home` | door | **yes** | 🔴 **TODO** |
| `la_taco` | door | **yes** | 🔴 **TODO** |
| `la_theater` | door | **yes** | 🔴 **TODO** |
| `innout` | door | **yes** | 🔴 **TODO** |
| `jack_home` | door | **yes** | 🟢 written |
| `la_beach` | spot | **yes** | 🔴 **TODO** |
| `la_lifeguard` | spot | bonus | 🟢 written |
| `beach_horse` | spot | bonus | 🔴 **TODO** |
| `la_surf` | spot | bonus | 🔴 **TODO** |
| `garden` | spot | bonus | 🔴 **TODO** |
| `la_pool` | spot | bonus | 🟢 written |
| `jack_garden` | spot | bonus | 🟢 written |
| `jack_firepit` | spot | bonus | 🔴 **TODO** |
| `jack_bus` | spot | bonus | 🟢 written |
| `la_neighbor` | townsfolk | bonus | 🟢 written |

## Little Everywhere

| id | what | needed for the ending? | status |
|---|---|---|---|
| `route_figtree` | spot | **yes** | 🟢 written |
| `route_quad` | spot | **yes** | 🔴 **TODO** |
| `route_pond` | spot | **yes** | 🔴 **TODO** |
| `lm_greece` | spot | bonus | 🔴 **TODO** |
| `lm_egypt` | spot | bonus | 🔴 **TODO** |
| `lm_italy` | spot | bonus | 🔴 **TODO** |
| `lm_moldova` | spot | bonus | 🔴 **TODO** |
| `lm_russia` | spot | bonus | 🔴 **TODO** |
| `lm_aruba` | spot | bonus | 🟢 written |
| `travel_station` | spot | bonus | 🟢 written |
| `route_hiker` | townsfolk | bonus | 🟢 written |
| `route_admirer` | townsfolk | bonus | 🟢 written |

## Mini Boston — outdoors

| id | what | needed for the ending? | status |
|---|---|---|---|
| `bu` | door | **yes** | 🔴 **TODO** |
| `cafe` | door | **yes** | 🔴 **TODO** |
| `neu` | door | **yes** | 🔴 **TODO** |
| `apartment` | door | **yes** | 🔴 **TODO** |
| `parents_home` | door | **yes** | 🟢 written |
| `aruba_beach` | spot | **yes** | 🟢 written |
| `aruba_turtle` | spot | **yes** | 🟢 written |
| `esplanade` | spot | **yes** | 🔴 **TODO** |
| `radio` | spot | bonus | 🔴 **TODO** |
| `bos_student` | townsfolk | bonus | 🟢 written |
| `bos_runner` | townsfolk | bonus | 🟢 written |
| `bos_oldman` | townsfolk | bonus | 🟢 written |
| `bos_neighbor` | townsfolk | bonus | 🟢 written |

## 🏡 her house (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `home_marina` | person | **yes** | 🟢 written |
| `home_mom` | person | **yes** | 🟢 written |
| `home_bro` | person | **yes** | 🟢 written |
| `home_leo` | animal | **yes** | 🟢 written |
| `home_charlie` | animal | **yes** | 🟢 written |

## 🌻 Jack's house (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `home_jack` | person | **yes** | 🟢 written |
| `home_jackwife` | person | **yes** | 🟢 written |
| `home_chakra` | animal | **yes** | 🟢 written |

## 🍔 In-N-Out (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `innout_order` | spot | **yes** | 🔴 **TODO** |
| `innout_menu` | spot | bonus | 🟢 written |
| `innout_fries` | spot | bonus | 🟢 written |
| `io_cook` | townsfolk | bonus | 🟢 written |
| `io_cashier` | townsfolk | bonus | 🟢 written |
| `io_customer` | townsfolk | bonus | 🟢 written |

## 🏢 your apartment (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `jvue_home` | spot | **yes** | 🔴 **TODO** |
| `jvue_tank` | spot | **yes** | 🟢 written |
| `jvue_herbs` | spot | **yes** | 🟢 written |
| `jvue_boxes` | spot | bonus | 🟢 written |
| `jvue_tv` | spot | bonus | 🟢 written |

## 🏡 his parents' (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `home_hismom` | person | **yes** | 🔴 **TODO** |
| `home_dad` | person | **yes** | 🟢 written |
| `home_collie` | animal | **yes** | 🟢 written |
| `parents_gym` | spot | bonus | 🟢 written |
| `parents_stairs` | spot | bonus | 🟢 written |
| `parents_oven` | spot | bonus | 🟢 written |

## 🎓 Northeastern (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `neu_map` | spot | **yes** | 🟢 written |
| `neu_un` | spot | **yes** | 🟢 written |
| `neu_globe` | spot | bonus | 🟢 written |
| `neu_coop` | spot | bonus | 🟢 written |
| `neu_flags` | spot | bonus | 🟢 written |
| `neu_prof` | townsfolk | bonus | 🟢 written |
| `neu_husky` | townsfolk | bonus | 🟢 written |

## 🤖 BU robotics (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `bu_arm` | spot | **yes** | 🟢 written |
| `bu_printer` | spot | **yes** | 🟢 written |
| `bu_rover` | spot | bonus | 🟢 written |
| `bu_bench` | spot | bonus | 🟢 written |
| `bu_board` | spot | bonus | 🟢 written |
| `bu_grad` | townsfolk | bonus | 🟢 written |

## ☕ Cafe Bene (inside)

| id | what | needed for the ending? | status |
|---|---|---|---|
| `cafe_table` | spot | **yes** | 🔴 **TODO** |
| `cafe_hinge` | spot | **yes** | 🟢 written |
| `cafe_counter` | spot | bonus | 🟢 written |
| `cafe_pastry` | spot | bonus | 🟢 written |
| `cafe_barista` | townsfolk | bonus | 🟢 written |
| `cafe_regular` | townsfolk | bonus | 🟢 written |

## the big ones (not tied to a map)

| id | what | status |
|---|---|---|
| `meta.playerName` | her name — used everywhere, including the party banner | 🟢 set to "Sasha" |
| `meta.intro` | the three lines on arrival | 🟢 written |
| `noah.greet_la` | how he introduces the whole game | 🟢 written |
| `noah.chat` | small talk, cycles — **one placeholder left** | 🔴 TODO |
| `noah.after` | what he says once it's over | 🔴 TODO |
| `figs.all` | the payoff for every fig | 🟢 written |
| `pumpkins.all` | the PUMPKINN!! payoff | 🔴 TODO |
| `finale.prompt` | "meet me at our apartment" | 🟢 written |
| `finale.lines` | **THE REVEAL. the whole point of the game.** | 🔴 **TODO** |
| `finale.title` / `.subtitle` | the card that comes up after | 🟢 written |
| `party.surprise` / `.cake` / `.after` | the party skit — mine, rewrite in your voice | 🟡 placeholder-ish |
| `credits.sub` | the dedication line | 🟡 mine — put it in your words |
| `credits.groups` | who's in the reel — auto-built if you leave it out | 🟢 auto |

---

**26 of 84** map entries still hold a `[TODO Noah]` placeholder.
Grep the file for `TODO` to jump between them.

## testing the ending

| how | what it does |
|---|---|
| `?map=party` | jumps straight to the party + credits |
| `?dev` then **ESC** | adds a **🎂 test the ending** button to the pause menu |
| `?all` | marks everything found, so the finale triggers at the apartment window |
| `?gate` | forces the password screen (your local `memories.json` normally skips it) |
| `?reset=1` | wipes the save — needed to re-run the finale, since `save.finale` makes it fire only once |

## before you deploy

- [ ] Fill every `[TODO Noah: …]` in `data/memories.json`
- [ ] Write `finale.lines` — the reveal
- [ ] Rewrite `party.*` and `credits.sub` in your own voice
- [ ] Set the real password and re-encrypt (`python tools/crypt.py encrypt …`)
- [ ] Play it start to finish (`?all` fast-checks the finale + party)
- [ ] Check the party on a phone — it's one fixed screen, it should letterbox fine
