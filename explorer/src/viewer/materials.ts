import * as THREE from 'three';
/** Authored interpretations of maker Front_2_Werk; no measured finish claim. */
export function finishFor(name: string) {
  if (/^030-|rubin|ellipse|hebestein/i.test(name))
    return { color: 0x9c2c54, metalness: 0.15, roughness: 0.19 };
  if (/^010-|^020-|stift|schraub/i.test(name))
    return { color: 0x365f8a, metalness: 0.85, roughness: 0.24 };
  if (/werkplatte|grundplatte/i.test(name))
    return { color: 0xb39278, metalness: 0.62, roughness: 0.48 };
  if (/brücke|bruecke|deckplättchen|kronrad|sperrrad/i.test(name))
    return { color: 0xb8c2c8, metalness: 0.84, roughness: 0.33 };
  if (/spirale/i.test(name))
    return { color: 0x344e76, metalness: 0.75, roughness: 0.28 };
  if (
    /trommel|federhausdeckel|federkern|rad|unruhreif|chaton|rolle/i.test(name)
  )
    return { color: 0xc5a351, metalness: 0.78, roughness: 0.32 };
  if (/feder|trieb|welle|hebel|anker|flitter/i.test(name))
    return { color: 0x9faeb9, metalness: 0.84, roughness: 0.26 };
  return { color: 0x9ca8ab, metalness: 0.7, roughness: 0.33 };
}
export function createMaterial(name: string) {
  return new THREE.MeshStandardMaterial(finishFor(name));
}
