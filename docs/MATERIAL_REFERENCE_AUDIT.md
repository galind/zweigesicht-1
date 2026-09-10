# Material reference audit

Prepared 9 September 2026 from `explorer/src/viewer/materials.ts`, `assets/generated/assembly-manifest.json`, and the local maker references `Front_2_Werk.png` and `shockindication5.png`. This is a visual family/texture audit. The maker images do not supply calibrated color, roughness, anisotropy, coating thickness, alloy assay, or reflectance values; numerical material values remain authored and unverified.

This report began against the earlier name-only material regex and was reconciled after the lead added exact definition assignments and procedural finishes. Statements below distinguish the **initial mapping** from the **current implementation**. Exact definition identity now wins, and name rules are fallbacks.

## Observed families and surface character

The maker movement reference visibly separates the movement into a small number of strong families:

- The main plate is a warm rose-gold tone with a diffuse, finely grained/frosted field.
- The dominant flying bridges are bright steel. Broad faces read satin or finely brushed, while bevels, rims, countersinks, and selected edges read substantially brighter and more polished.
- Train wheels and visible barrel bodies are warm gold. The broad barrel surfaces show directional/circular texture rather than one flat metallic fill.
- Many movement screw heads and the hairspring are blue. The reference also contains bright steel fasteners, so blue cannot be assigned from any occurrence of “screw” or “pin.”
- Jewels are saturated ruby/purple, with reflective metal chatons around some settings.
- The exploded shock indicator contains bright/brushed steel plates and forks, small warm brass/gold pins, blue upper parts/hands, and a red/pink cylindrical mass.

These observations support distinct material families and procedural surface direction. They do not establish exact RGB values or physical material constants.

## Primary plate and bridge definitions

| Definition ID | Exact source name | Initial mapping | Current implementation |
|---|---|---|---|
| `d_0_1_1_195` | `ml01 Grundplatine` | Default gray/steel. The old `/grundplatte/` expression did **not** match `Grundplatine`; this was the central plain-gray plate bug. | Explicit `frosted`; warm rose-gold family with procedural grain. |
| `d_0_1_1_222` | `ml01 Unruhbrücke` | Bridge by name | Explicit `bridge`; procedural straight grain. |
| `d_0_1_1_99` | `ml01 Räderbrücke` | Bridge by name | Explicit `bridge`; procedural straight grain. |
| `d_0_1_1_228` | `ml01 Federhausbrücke` | Bridge by name | Explicit `bridge`; procedural straight grain. |

The smaller `d_0_1_1_230` `ml01 Minutenbrücke` and the context parts `d_0_1_1_133` `ml01 Ankerbrücke`, `d_0_1_1_219` `ml01 Zeigerwerksbrücke`, and `d_0_1_1_240` `ml01 Aufzugsbrücke` are also explicit `bridge` assignments. The shader adds procedural face grain and roughness/normal variation while existing CAD chamfers catch brighter reflections. This is a meaningful improvement over a single flat material, but the numeric texture scale and response remain authored rather than measured.

## Barrel, ratchet, and crown definitions

| Definition ID | Exact source name | Initial mapping | Current implementation |
|---|---|---|---|
| `d_0_1_1_85` | `ml01 Federhaustrommel II z80 m0,15` | Gold via `trommel` | Explicit `barrel`; procedural circular texture. |
| `d_0_1_1_90` | `ml01 Federhaustrommel I z80 m0,15` | Gold via `trommel` | Explicit `barrel`; procedural circular texture. |
| `d_0_1_1_86` | `ml01 Federhausdeckel II` | Gold via `federhausdeckel` | Explicit `barrel`; exact lid/drum finish difference remains unresolved. |
| `d_0_1_1_91` | `ml01 Federhausdeckel` | Gold via `federhausdeckel` | Explicit `barrel`; same caveat as cover II. |
| `d_0_1_1_131` | `ml01 Sperrrad z62 m0,20` | Steel via `sperrrad` | Explicit `ratchet`; cool steel family with circular texture. Exact finish remains reference-limited. |
| `d_0_1_1_249` | `ml01 Kronrad z45 m0,15` | Steel via `kronrad` | Explicit `ratchet`; maker-visible cool steel crown wheel with circular texture. |
| `d_0_1_1_251` | `ml01 Kronradplatte` | Steel via `kronrad` | Explicit `bridge`, so the structural plate no longer inherits wheel texture. |

`d_0_1_1_87` `ml01 Federkern1` initially became gold because `federkern` matched the generic gold branch before the later `feder` branch. It is now explicitly `steel`. The family is a reasonable correction; its exact finish remains unverified because the references do not expose enough of the arbor/core.

## Setting and winding parts without source color

These renderable definitions have no `sourceColorRgb` in the assembly manifest and therefore depend entirely on authored classification:

| Definition ID | Exact source name | Initial result | Current implementation |
|---|---|---|---|
| `d_0_1_1_143` | `ml01 Aufzugwelle` | Steel via `welle` | Explicit `steel`; finish unmeasured. |
| `d_0_1_1_174` | `ml01 Kupplungshebel` | Steel via `hebel` | Explicit `steel`. |
| `d_0_1_1_248` | `ml01 Winkelhebel` | Steel via `hebel` | Explicit `steel`. |
| `d_0_1_1_249` | `ml01 Kronrad z45 m0,15` | Steel via `kronrad` | Explicit `ratchet`; maker-visible cool steel wheel. |
| `d_0_1_1_251` | `ml01 Kronradplatte` | Steel via `kronrad` | Explicit `bridge`, separated from wheel treatment. |
| `d_0_1_1_240` | `ml01 Aufzugsbrücke` | Steel via `brücke` | Explicit `bridge`; procedural straight grain. |

Assembly-only definitions `d_0_1_1_171` `ml01 ZSTRad verpresst`, `d_0_1_1_175` `ml01 Stoppfeder vernietet`, `d_0_1_1_245` `ml01 Zeigerstellungsfeder verstiftet`, `d_0_1_1_247` `ml01 Winkelhebel vestiftet`, and `d_0_1_1_250` `ml01 Kronradplatte verstiftet` do not render their own mesh; assign materials to their leaf descendants.

Two source-gray winding wheels were falsely turned gold by the initial generic `/rad/` branch: `d_0_1_1_97` `ml01 Kupplungsrad z17 m0,15` and `d_0_1_1_172` `ml01 Zeigerstellrad z19 m0,177`. Both are now explicitly `steel`.

## Screws, steel pins, and brass pins

The `010-*` catalog definitions are screw forms. None carries source color. The current fallback makes non-`ss` `010-*` definitions blue, while exact steel assignments and the `ss` exclusion protect reviewed exterior parts:

| Definition IDs | Exact source names |
|---|---|
| `d_0_1_1_9`, `d_0_1_1_107`, `d_0_1_1_181`, `d_0_1_1_201` | `010-linsenk s60x105 k90x25`; `010-linsenk s50x55 k80x25`; `010-linsenk s60x80 k90x25`; `010-linsenk s70x120 k100x30` |
| `d_0_1_1_123`, `d_0_1_1_226` | `010-linzyl s50x75 k95x25`; `010-linzyl s40x70 k80x20` |
| `d_0_1_1_136`, `d_0_1_1_138`, `d_0_1_1_139`, `d_0_1_1_166`, `d_0_1_1_168`, `d_0_1_1_169`, `d_0_1_1_170`, `d_0_1_1_189`, `d_0_1_1_191`, `d_0_1_1_192` | `010-zyl s80x220 k160x50`; `010-zyl s80x190 k160x50`; `010-zyl s70x110 k180x30`; `010-zyl s60x58 k115x25`; `010-zyl s60x140 k115x23`; `010-zyl s80x220 k125x50`; `010-zyl s80x180 k125x50`; `010-zyl s80x140 k160x40`; `010-zyl s80x95 k110x18`; `010-zyl s80x120 k220x35` |
| `d_0_1_1_122`, `d_0_1_1_253`, `d_0_1_1_255`, `d_0_1_1_180` | `010-zylsenk s80x120 k125x40`; `010-zylsenk s60x150 k115x23`; `010-zylans s80x90 k160x45 a96x50`; `010-linzylans s70x90 k90x75 a125x25 ab98x93` |
| `d_0_1_1_53`, `d_0_1_1_57`, `d_0_1_1_61` | `010-linzylans s120x180 k230x160 a140x210 ss`; `010-linsenk s100x120 k140x50 ss`; `010-linzylans s120x160 k190x90 a140x120` |

The maker Front 2 reference supports blue heads for many movement screws, but not a universal definition-level rule. Current exact assignments keep exterior screw bars/caseback definitions `d_0_1_1_55`, `d_0_1_1_60`, and `d_0_1_1_68` steel; `d_0_1_1_53` and `d_0_1_1_57` also stay steel through exact assignment or the `ss` exclusion, and `d_0_1_1_61` is explicitly steel. Definition `d_0_1_1_9` remains shared by three movement and three dial instances, so a single per-definition finish may still be insufficient if reviewed configurations require different treatments.

The `020-*` definitions are pins/studs rather than screw heads. The initial rule turned them all blue; the current fallback preserves the manifest-supported split:

- Gray steel-family pins: `d_0_1_1_173` `020-120x120`; `d_0_1_1_220` `020-40x140`; `d_0_1_1_135` `020-40x80`; `d_0_1_1_124` `020-50x100`; `d_0_1_1_150` `020-50x130`; `d_0_1_1_157` `020-50x130 a40x50`; `d_0_1_1_103` `020-50x165`; `d_0_1_1_158` `020-50x165 a40x50`; `d_0_1_1_149` `020-50x200`; `d_0_1_1_148` `020-50x220`; and `d_0_1_1_162` `020-50x70`. Their source hint is approximately `[0.367, 0.406, 0.434]`.
- Brass-family pins marked `ms`: `d_0_1_1_163` `020-12x60 kon ms`; `d_0_1_1_118` `020-30x80 kon ms`; `d_0_1_1_179` `020-40x120 kon ms`; and `d_0_1_1_200` `020-40x135 ms`. Their source hint is approximately `[0.730, 0.394, 0.052]`, and the maker's exploded shock image visibly includes warm small pins.
- `d_0_1_1_72` `ml01 Riegelstift fest` is source-gray and now explicitly `steel`.

The shock mass `d_0_1_1_155` `si HMzylinder` uses neutral polished steel per the user's explicit material correction, corroborated by its gray CAD appearance. The red/pink cylinder in the exploded maker reference is treated as a presentation color cue, not physical-material evidence.

## Initial false classifications and current status

1. The initial `/grundplatte/` rule missed `d_0_1_1_195` `Grundplatine`, leaving the main plate gray. Current exact `frosted: [195]` fixes the central bug; the fallback now also contains `grundplatin`.
2. The initial `/grundplatte/` rule did match `d_0_1_1_147` `ml01 si Grundplatte` and assigned it the warm plate family. Current exact `bridge: [147]` makes the shock base plate steel/bridge, consistent with the exploded reference.
3. Initial `^020-` made every steel and brass pin blue. Current fallback maps `020-* ms` to brass and other `020-*` to steel.
4. Initial `stift`/`schraub` matching was overbroad for ordinary pins, screw bars, and the caseback. Current exact steel assignments cover `d_0_1_1_55`, `60`, `68`, and `72`; non-rendering `verstiftet` assemblies still make substring rules undesirable as a general design.
5. Initial generic `rad` made `d_0_1_1_97` and `172` gold. Both are now explicit steel.
6. Initial generic `unruhreif` made `d_0_1_1_110` gold. Current assignments separate steel rim `110` from brass/warm eccentric weights `111`.
7. Initial `federkern` fell into the gold wheel branch. Current `d_0_1_1_87` is explicit steel, while its exact finish remains unmeasured.
8. Initial `kronrad` conflated crown wheel and plate. Current `249` uses the circular `ratchet` profile and `251` uses the straight-grained `bridge` profile.

## Current assignment coverage

All **223 movement source leaf instances** resolve to a current profile; **222 are renderable** and the empty `030-Brilliant_200` definition is the sole non-rendering leaf. Exact-ID assignments cover 106 leaf instances and name fallbacks cover 117. Instance counts by resolved family are: steel 83, blue 49, brass 42, ruby 29, bridge 11, barrel 4, ratchet 3, frosted 1, and spring 1. These counts describe assignment coverage, not verified material correctness.

The current profiles implement frosted/grained plate treatment, straight-grained bridge fields, circular barrel/ratchet/wheel treatment, and unpatterned steel/blue/spring/ruby families. Exact texture scale, direction, roughness, anisotropy, color, and environment response require visual tuning against the maker reference and remain authored rather than measured.
