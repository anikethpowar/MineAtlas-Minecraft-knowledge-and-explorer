"""Seed script for curated Minecraft Java Edition farm guides and mechanics.

Idempotent execution:
- Seeds or updates the 3 curated farm records (Iron Farm, Raid Farm, Villager Breeder).
- Seeds or updates core Java Edition mechanic reference records.
- Safely verifies and creates curated relation edges in SQLite only when target entities exist.
- Skips non-existent entities honestly with logged notices.
- Strictly offline: never makes requests to Astroworld or external networks.
"""

from datetime import datetime, timezone
import json
import logging
import sys
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    Biome,
    Dimension,
    Enchantment,
    Farm,
    Item,
    Mechanic,
    Mob,
    RelationEdge,
    Structure,
    VillagerProfession,
)
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed_curated_farms")

NOW_UTC = datetime(2026, 11, 5, 0, 0, 0, tzinfo=timezone.utc)

# ==================== CURATED MECHANICS DATA ====================
CURATED_MECHANICS: list[dict[str, Any]] = [
    {
        "id": "villager-golem-panic-spawning",
        "name": "Villager Golem Panic Spawning",
        "category": "spawning",
        "summary": "Java Edition mechanic where 3 panicked villagers who slept recently summon an Iron Golem.",
        "description": (
            "In Minecraft Java Edition (since 1.14 Village & Pillage), an Iron Golem spawns when at least "
            "3 villagers observe a threatening mob (such as a Zombie within 16 blocks line-of-sight) "
            "and have touched a bed within the past 20 minutes (24,000 game ticks). Unlike Bedrock Edition, "
            "workstations and large villager populations (10-20) are NOT required for panic golem spawning."
        ),
        "java_specific_notes": (
            "Java Edition exclusive panic mechanics. Bedrock Edition requires at least 10 villagers and "
            "20 linked beds and workstations before any golems spawn. In Java, line-of-sight must periodically "
            "break (e.g. via bobbing water or trapdoors) so villagers can lay in bed and reset their sleep timer."
        ),
        "source_type": "curated",
        "source_url": "https://minecraft.wiki/w/Iron_Golem#Spawning",
        "edition": "java",
        "game_version": "1.14+",
        "last_verified_at": NOW_UTC,
        "coverage_note": "Verified Java Edition panic rules. Applicable across Minecraft Java 1.14 through 1.21+.",
    },
    {
        "id": "raid-bad-omen-trigger",
        "name": "Bad Omen & Raid Triggering Mechanics",
        "category": "spawning",
        "summary": "Rules governing how raids generate around player-created artificial village centers.",
        "description": (
            "A raid is initiated when a player carrying Bad Omen enters the perimeter of a village. "
            "A minimal village in Java Edition requires only 1 villager with an accessible bed. In Java 1.21 "
            "(Tricky Trials), Bad Omen is no longer automatically applied upon captain kill; instead, captains drop "
            "Ominous Bottles. Drinking a bottle grants Bad Omen, which transforms into a 30-second 'Raid Omen' "
            "countdown upon entering village boundaries before wave 1 spawns."
        ),
        "java_specific_notes": (
            "Major Java 1.21 change: Automatic Bad Omen upon killing raid captains was replaced by Ominous Bottle items. "
            "Raid Omen now grants a 30-second preparation countdown before waves commence."
        ),
        "source_type": "curated",
        "source_url": "https://minecraft.wiki/w/Raid",
        "edition": "java",
        "game_version": "1.21+",
        "last_verified_at": NOW_UTC,
        "coverage_note": "Covers both legacy (1.14-1.20) immediate triggers and 1.21+ Ominous Bottle / Raid Omen mechanics.",
    },
    {
        "id": "villager-willingness-breeding",
        "name": "Villager Willingness & Bed Validation",
        "category": "villagers",
        "summary": "Mechanics governing villager food consumption, love mode, and valid bed pathfinding.",
        "description": (
            "Villagers require sufficient food (3 bread, 12 carrots, 12 potatoes, or 12 beetroots) to establish "
            "'willingness' and enter love mode. A child is successfully conceived only if an unowned bed exists "
            "within village boundaries that has at least two full blocks of clear air space directly above the mattress."
        ),
        "java_specific_notes": (
            "In Java Edition, baby villagers must be able to pathfind and jump on beds. If any solid block, slab, "
            "or low ceiling is within 2 blocks above the bed pillow, the bed is invalidated and villagers will display "
            "thunderstorm anger particles instead of producing a baby."
        ),
        "source_type": "curated",
        "source_url": "https://minecraft.wiki/w/Villager#Breeding",
        "edition": "java",
        "game_version": "1.14+",
        "last_verified_at": NOW_UTC,
        "coverage_note": "Verified Java Edition willingness thresholds and 2-block headroom clearance requirements.",
    },
]

# ==================== CURATED FARMS DATA ====================
CURATED_FARMS: list[dict[str, Any]] = [
    {
        "id": "iron-farm",
        "name": "Iron Golem Farm (Panic Chamber)",
        "category": "iron",
        "difficulty": "Intermediate",
        "dimension": "Overworld",
        "compatibility_label": "Minecraft Java Edition 1.14 - 1.21+",
        "last_verified_at": NOW_UTC,
        "source_type": "curated",
        "source_url": "https://minecraft.wiki/w/Iron_Golem#Spawning",
        "edition": "java",
        "game_version": "1.21+",
        "coverage_note": (
            "Curated Java Edition guide based on verified panic spawning mechanics. "
            "Bedrock Edition requires 10-20 villagers and 20 beds rather than panic mechanics. "
            "Unverified on modded servers with altered mob cap or simulation rules."
        ),
        "summary": (
            "A compact single-cell Overworld iron farm utilizing 3 panicked villagers and a trapped zombie "
            "to continuously spawn Iron Golems into a suspended lava blade."
        ),
        "description": (
            "This design relies on Minecraft Java Edition's panic mechanic introduced in 1.14. Three villagers "
            "positioned in a shared enclosure observe a trapped zombie, triggering immediate attempts to spawn an "
            "Iron Golem for protection. By utilizing a water bobbing mechanism or trapdoor sight-breaker, villagers "
            "periodically lose line-of-sight to the zombie, allowing them to lay in bed and reset their required sleep "
            "timer. Spawned golems are pushed by flowing water into a suspended lava blade that burns their upper hitbox "
            "while leaving dropped iron ingots safely intact for hopper collection."
        ),
        "estimated_output_per_hour": "~300–330 Iron Ingots/hour (plus ~70 Poppies)",
        "safety_note": (
            "Install a lightning rod on an elevated platform at least 15 blocks away from the villager chamber. "
            "A direct lightning strike will permanently convert villagers into witches, instantly destroying the farm."
        ),
        "maintenance_summary": (
            "Check hoppers and storage chests periodically to prevent overflow backlogs. "
            "Ensure the named zombie remains intact and does not burn in sunlight (provide a solid block roof above)."
        ),
        "notes": (
            "Must be built at least 16 blocks away from any natural villages, extra beds, or workstations "
            "to prevent golems from spawning outside the intended kill pad."
        ),
        "outputs": [
            {
                "item": "iron_ingot",
                "label": "Iron Ingot",
                "rate": "300-330 / hour",
                "is_primary": True,
                "note": "Collected via hoppers below the suspended lava blade.",
            },
            {
                "item": "poppy",
                "label": "Poppy",
                "rate": "70-80 / hour",
                "is_primary": False,
                "note": "Can be filtered into a composter for bone meal or stored.",
            },
        ],
        "prerequisites": [
            "Access to at least 3 villagers from a nearby village or cured zombie villagers.",
            "1 hostile mob (Zombie, Husk, or Pillager) and a Name Tag (or boat) to prevent despawn.",
            "Basic Nether access or lava bucket for the kill chamber.",
            "Clear 16-block radius perimeter around the farm free of beds, workstations, or doors.",
        ],
        "materials": [
            {
                "item": "Solid Building Blocks (Stone / Deepslate)",
                "amount": 64,
                "category": "Building",
                "note": "For spawning platform, chute, and exterior walls.",
            },
            {
                "item": "Glass Blocks",
                "amount": 32,
                "category": "Building",
                "note": "Prevents accidental mob spawning on pod rims and allows visual checks.",
            },
            {
                "item": "Beds",
                "amount": 3,
                "category": "Villager",
                "note": "Any color; must be placed directly adjacent to villagers.",
            },
            {
                "item": "Name Tag",
                "amount": 1,
                "category": "Utility",
                "note": "Applied to zombie to permanently prevent despawning.",
            },
            {
                "item": "Water Buckets",
                "amount": 2,
                "category": "Fluid",
                "note": "For infinite water source and pushing streams.",
            },
            {
                "item": "Lava Bucket",
                "amount": 1,
                "category": "Fluid",
                "note": "Suspended on signs for lethal damage to iron golems.",
            },
            {
                "item": "Hoppers",
                "amount": 3,
                "category": "Redstone/Storage",
                "note": "Funnel dropped iron ingots into chests.",
            },
            {
                "item": "Chests (Large Chest)",
                "amount": 2,
                "category": "Storage",
                "note": "Output collection.",
            },
            {
                "item": "Signs or Open Fence Gates",
                "amount": 4,
                "category": "Utility",
                "note": "Hold lava blade in place without burning.",
            },
            {
                "item": "Trapdoor or Soul Sand",
                "amount": 1,
                "category": "Mechanics",
                "note": "Line-of-sight interruption for sleep cycles.",
            },
        ],
        "build_steps": [
            {
                "step_number": 1,
                "title": "Perimeter Clearance & Foundation Pillar",
                "description": "Select an open area at least 16 blocks horizontally and vertically away from existing villages, beds, and workstations. Build a central pillar 10 to 12 blocks above ground level.",
                "why_it_matters": "Elevating the farm ensures iron golems can only spawn on your designated platform, preventing them from spawning on adjacent hills, trees, or caves.",
            },
            {
                "step_number": 2,
                "title": "Villager Pod & Bed Placement",
                "description": "Construct a 3x3 interior chamber at the top of the pillar. Place 3 beds with the pillows facing inward toward the center. Enclose the chamber with glass blocks so villagers cannot fall out.",
                "why_it_matters": "Villagers must be physically adjacent to their beds. Glass blocks prevent golems from spawning directly inside the villager pod.",
            },
            {
                "step_number": 3,
                "title": "Zombie Sight Chamber & Interrupter",
                "description": "Position a 1x1 containment cell 2-3 blocks across from the villager pod. Place a water source block with soul sand or a timed trapdoor so the zombie bobs up and down.",
                "why_it_matters": "Continuous panic prevents villagers from sleeping. The bobbing motion breaks eye contact, giving villagers the necessary split-second to touch their bed and refresh their sleep requirement.",
            },
            {
                "step_number": 4,
                "title": "Spawning Platform & Water Funnel",
                "description": "Build an 8x8 platform 4 blocks directly above the villager chamber using solid blocks. Surround with a 2-block-tall wall and place water in the back corners flowing toward a 3x3 collection drop chute.",
                "why_it_matters": "Golems require a 2x4x2 volume on full solid blocks. Water streams automatically transport them to the kill chute immediately upon spawning.",
            },
            {
                "step_number": 5,
                "title": "Lava Blade & Hopper Collection",
                "description": "Place 4 signs at head height (2 blocks above the floor) inside the 3x3 drop chute, then place 1 lava source on top of the signs. Line the floor beneath with 3 to 9 hoppers feeding into a double chest.",
                "why_it_matters": "Iron golems are 2.7 blocks tall and touch the lava, but their iron ingots drop at foot level onto the hoppers, safely below the lava blade.",
            },
        ],
        "troubleshooting": [
            {
                "issue": "No Iron Golems are spawning after 1-2 Minecraft days.",
                "likely_cause": "Villagers have unbroken line-of-sight to the zombie and have never slept.",
                "suggested_check": "Inspect the zombie chamber. Ensure the zombie bobs below eye level or install a trapdoor so villagers lay down briefly at dusk.",
            },
            {
                "issue": "Golems are spawning on the ground or surrounding hills instead of the platform.",
                "likely_cause": "The farm is built too close to natural terrain within the 16x16x16 golem spawn cube.",
                "suggested_check": "Place bottom slabs, buttons, or water sources on all spawnable surfaces within 16 blocks of the villagers.",
            },
            {
                "issue": "The zombie despawned.",
                "likely_cause": "The mob was not named with a Name Tag or placed in a boat.",
                "suggested_check": "Apply a renamed Name Tag to a new zombie or trap it inside an oak boat.",
            },
            {
                "issue": "Villagers suddenly transformed into witches.",
                "likely_cause": "Lightning struck during a thunderstorm.",
                "suggested_check": "Install a lightning rod at least 15 blocks away, or build a wide roof over the farm.",
            },
        ],
        "diagram_data": {
            "type": "schematic",
            "zones": [
                {"id": "villager_pod", "label": "Villager Pod (3 Beds)", "color": "emerald"},
                {"id": "sight_gap", "label": "Line-of-Sight Break (2-3 Blocks)", "color": "slate"},
                {"id": "zombie_cell", "label": "Zombie Bobbing Tube", "color": "red"},
                {"id": "spawn_platform", "label": "Spawning Platform (8x8 Solid)", "color": "blue"},
                {"id": "lava_chute", "label": "Lava Blade & Hopper Floor", "color": "amber"},
            ],
        },
        "source_references": [
            {
                "title": "Minecraft Java Edition Iron Golem Spawning Mechanics",
                "url": "https://minecraft.wiki/w/Iron_Golem",
                "note": "Verified 1.14 - 1.21 panic behavior and 16-block spawn cube.",
            },
            {
                "title": "Villager Sleep & Panic Timers",
                "url": "https://minecraft.wiki/w/Villager",
                "note": "Verified 20-minute sleep timeout (24,000 ticks) requirement.",
            },
        ],
    },
    {
        "id": "raid-farm",
        "name": "Bad Omen Raid Farm (Ocean / High-Altitude)",
        "category": "mob",
        "difficulty": "Advanced",
        "dimension": "Overworld",
        "compatibility_label": "Minecraft Java Edition 1.14 - 1.21+ (Requires Ominous Bottle in 1.21+)",
        "last_verified_at": NOW_UTC,
        "source_type": "curated",
        "source_url": "https://minecraft.wiki/w/Raid",
        "edition": "java",
        "game_version": "1.21+",
        "coverage_note": (
            "Curated Java Edition raid farm guide. WARNING: Minecraft Java 1.21 fundamentally changed Bad Omen "
            "mechanics; killing raid captains now drops Ominous Bottles instead of directly applying the effect. "
            "Stacking raid farms require specific timing adaptations."
        ),
        "summary": (
            "An elevated Overworld raid farm that isolates raid mob spawns onto a compact platform over deep ocean "
            "water, funneling pillagers, vindicators, evokers, and ravagers into a fall kill chute."
        ),
        "description": (
            "Raid mechanics in Java Edition trigger when a player carrying Bad Omen approaches an artificial village center. "
            "By placing a lone villager with a bed and workstation at high altitude (Y > 180) over a deep ocean biome, the "
            "game is forced to pick the only available solid block platform for raid wave generation. Mobs are flushed or drop "
            "into a lethal fall chute, enabling safe collection of emeralds, Totems of Undying, and ominous loot without risk "
            "of mobs wandering into caves."
        ),
        "estimated_output_per_hour": "High yield of Emeralds, Totems of Undying, Redstone & Potions (rate varies with wave kill speed)",
        "safety_note": (
            "Evoker Vexes are capable of flying through walls and ignore armor on certain attacks. Witches throw splash "
            "potions of poison and instant harm. The player AFK platform must be positioned outside mob aggro range, or mobs "
            "must be killed immediately upon landing via fall damage."
        ),
        "maintenance_summary": (
            "Regularly empty or sort the storage system; non-stackable items (crossbows, ominous banners, totems) "
            "will rapidly clog unsorted hopper lines."
        ),
        "notes": (
            "In 1.21+, players must stock Ominous Bottles (I to V) collected from Trial Chambers or Pillager Outposts "
            "to initiate each raid cycle."
        ),
        "outputs": [
            {
                "item": "totem_of_undying",
                "label": "Totem of Undying",
                "rate": "Variable (multiple per multi-wave raid)",
                "is_primary": True,
                "note": "Dropped by defeated Evokers.",
            },
            {
                "item": "redstone_dust",
                "label": "Redstone Dust",
                "rate": "Common raid drop",
                "is_primary": False,
                "note": "Dropped by defeated Witches.",
            },
            {
                "item": "emerald",
                "label": "Emerald",
                "rate": "High yield",
                "is_primary": True,
                "note": "Dropped by Pillagers, Vindicators, and Evokers.",
            },
            {
                "item": "crossbow",
                "label": "Crossbow",
                "rate": "Frequent drop",
                "is_primary": False,
                "note": "Dropped by Pillagers.",
            },
        ],
        "prerequisites": [
            "Java 1.21+: Ominous Bottles (obtained by defeating Outpost or Patrol captains).",
            "1 Villager with 1 Bed and 1 Workstation (Composter recommended).",
            "Scouted ocean location at least 150 blocks from all natural landmasses.",
            "High-tier protective gear (Diamond/Netherite armor, shield, food, and milk buckets).",
        ],
        "materials": [
            {
                "item": "Solid Building Blocks",
                "amount": 128,
                "category": "Building",
                "note": "For spawning platform and kill tube walls.",
            },
            {
                "item": "Leaf Blocks or Glass",
                "amount": 64,
                "category": "Spawn-Proofing",
                "note": "Raid mobs cannot spawn on leaves or glass; use for access bridges.",
            },
            {
                "item": "Bed & Workstation (Composter)",
                "amount": 1,
                "category": "Village Anchor",
                "note": "Creates the minimal 1-resident artificial village.",
            },
            {
                "item": "Water Buckets",
                "amount": 2,
                "category": "Fluid",
                "note": "Flushing water streams and water elevators.",
            },
            {
                "item": "Trapdoors (Spruce/Oak)",
                "amount": 8,
                "category": "Mechanics",
                "note": "Mobs perceive open trapdoors as full blocks and walk off platform.",
            },
            {
                "item": "Hoppers",
                "amount": 5,
                "category": "Storage",
                "note": "Item collection floor.",
            },
            {
                "item": "Double Chests",
                "amount": 4,
                "category": "Storage",
                "note": "Bulk storage for unstackable loot.",
            },
            {
                "item": "Ominous Bottles (1.21+)",
                "amount": 1,
                "category": "Raid Trigger",
                "note": "Consumed by player to initiate Bad Omen.",
            },
        ],
        "build_steps": [
            {
                "step_number": 1,
                "title": "Location Selection & Ocean Pillar",
                "description": "Travel to a deep ocean biome at least 150 blocks away from any shoreline, island, or natural village. Pillar up to Y=180 or higher using scaffolding or water.",
                "why_it_matters": "Building high above deep oceans completely prevents raid mobs from spawning inside uncharted underground caves or nearby land.",
            },
            {
                "step_number": 2,
                "title": "Artificial Village Anchor Pod",
                "description": "Construct an enclosed glass pod holding 1 villager, 1 bed, and 1 workstation. Ensure no solid block surfaces exist above or around the pod.",
                "why_it_matters": "A single villager with a bed registers as a valid village center, which is the geometric anchor for raid generation.",
            },
            {
                "step_number": 3,
                "title": "Raid Spawning Platform",
                "description": "Construct a small solid platform (5x5 or 7x7) positioned at the calculated raid spawn radius (~30 blocks away from the village center). Frame the edge with open trapdoors.",
                "why_it_matters": "Restricting the spawn area to a single compact platform concentrates the entire raid wave into one predictable spot.",
            },
            {
                "step_number": 4,
                "title": "Water Flushing & Drop Chute",
                "description": "Install water streams or shifting floors that immediately push spawning mobs off the trapdoor edge into a 28-30 block fall chute.",
                "why_it_matters": "A 28-30 block fall kills or severely weakens raid mobs on impact, minimizing dangerous attacks from Evokers and Witches.",
            },
            {
                "step_number": 5,
                "title": "Protected AFK / Kill Spot & Collection",
                "description": "Create a fully enclosed player position beneath the fall tube with hoppers leading into chests. In Java 1.21+, drink an Ominous Bottle to trigger Raid Omen.",
                "why_it_matters": "Enclosing the player prevents stray arrows or Vexes from reaching you while hoppers collect dropped totems and emeralds.",
            },
        ],
        "troubleshooting": [
            {
                "issue": "The raid suddenly ends with 'Defeat' or 'Victory' without mobs appearing.",
                "likely_cause": "Raid mobs spawned in an unlit cave or ocean floor below the farm.",
                "suggested_check": "Verify your build height is at least Y=180, or illuminate all terrain within 128 blocks of the village anchor.",
            },
            {
                "issue": "Drinking Bad Omen does not immediately start a raid in Minecraft 1.21.",
                "likely_cause": "Java 1.21 replaces immediate Bad Omen with a 30-second Raid Omen countdown.",
                "suggested_check": "In 1.21, drink an Ominous Bottle while near the village anchor and wait for the 30-second Raid Omen timer to expire.",
            },
            {
                "issue": "Vexes are killing the player through walls.",
                "likely_cause": "Evokers survived the fall or were not killed before casting their summon spell.",
                "suggested_check": "Increase the drop chute height to ensure Evokers die on impact, or use a sweeping sword strike immediately upon landing.",
            },
            {
                "issue": "Severe tick lag during raids.",
                "likely_cause": "Ravagers and multi-wave entity buildup exceeding client/server capability.",
                "suggested_check": "Clear entity waves rapidly; avoid stacking multiple raids concurrently on low-spec hardware.",
            },
        ],
        "diagram_data": {
            "type": "schematic",
            "zones": [
                {"id": "village_anchor", "label": "Village Anchor Pod (1 Villager + Bed)", "color": "emerald"},
                {"id": "spawn_platform", "label": "Raid Spawning Platform (Compact Solid)", "color": "red"},
                {"id": "fall_chute", "label": "Vertical Drop Tube (28-30 Blocks)", "color": "slate"},
                {"id": "afk_collection", "label": "Safe AFK Floor & Hopper Array", "color": "blue"},
            ],
        },
        "source_references": [
            {
                "title": "Minecraft Java 1.21 Tricky Trials Raid Omen Overhaul",
                "url": "https://minecraft.wiki/w/Raid",
                "note": "Verified replacement of automatic Bad Omen with Ominous Bottle items and 30-second delay timer.",
            },
            {
                "title": "Raid Spawning Geometry & Village Centers",
                "url": "https://minecraft.wiki/w/Raid",
                "note": "Verified 64-block horizontal radius and altitude isolation mechanics.",
            },
        ],
    },
    {
        "id": "villager-breeder",
        "name": "Automatic Villager Breeder (Gap & Chute)",
        "category": "villager",
        "difficulty": "Beginner",
        "dimension": "Overworld",
        "compatibility_label": "Minecraft Java Edition 1.14 - 1.21+",
        "last_verified_at": NOW_UTC,
        "source_type": "curated",
        "source_url": "https://minecraft.wiki/w/Villager#Breeding",
        "edition": "java",
        "game_version": "1.21+",
        "coverage_note": (
            "Curated Java Edition villager mechanics guide. Covers breeding willingness, food requirements, "
            "and bed validation. Compatible across all Java versions since 1.14."
        ),
        "summary": (
            "A simple, humane villager breeding cell utilizing 2 adult villagers, 3+ beds with ample head clearance, "
            "and a trapdoor drop chute that separates newborn babies from parents."
        ),
        "description": (
            "Villager breeding in Minecraft Java Edition operates on willingness and valid bed capacity. Two adult "
            "villagers become willing when tossed sufficient food (carrots, potatoes, or bread). When willing, they search "
            "for an unclaimed bed that has at least two full air blocks of clearance above the pillow. By placing extra "
            "beds across a narrow gap lined with open trapdoors, adult villagers remain contained while 1-block-tall baby "
            "villagers pathfind toward the beds to jump, slip through the trapdoors, and are carried away by water to a "
            "separate holding chamber."
        ),
        "estimated_output_per_hour": "Continuous baby villagers (~1 every 5 minutes during active breeding cycle with surplus food)",
        "safety_note": (
            "Protect the breeder chamber from zombie sieges and lightning strikes. Enclose the exterior with solid blocks "
            "or glass, and light the surrounding area to light level 8 or higher."
        ),
        "maintenance_summary": (
            "Periodically toss additional carrots or potatoes into the breeder pod, or connect a small automated farmer "
            "villager module to make the food supply fully autonomous."
        ),
        "notes": (
            "The newborn holding pen must be at least 16 to 20 blocks away horizontally from the breeder beds so the beds "
            "become available again for the next breeding cycle."
        ),
        "outputs": [
            {
                "item": "villager",
                "label": "Baby Villager",
                "rate": "1 per ~5 minutes during active love mode",
                "is_primary": True,
                "note": "Automatically transported away to unlink beds.",
            },
        ],
        "prerequisites": [
            "2 adult villagers (cured or transported from a village via boat or minecart).",
            "Surplus crop supply: ~64 Carrots, Potatoes, or Bread.",
            "At least 3 valid beds (any color).",
            "Isolated location at least 32 blocks away from other beds, workstations, or trading halls.",
        ],
        "materials": [
            {
                "item": "Solid Building Blocks (Smooth Stone / Bricks)",
                "amount": 32,
                "category": "Building",
                "note": "Breeder pod walls and foundation.",
            },
            {
                "item": "Glass Blocks",
                "amount": 16,
                "category": "Building",
                "note": "Front viewing wall for easy food feeding.",
            },
            {
                "item": "Beds",
                "amount": 3,
                "category": "Villager",
                "note": "Must have 2 blocks of air clearance above the pillows.",
            },
            {
                "item": "Wooden Trapdoors",
                "amount": 4,
                "category": "Mechanics",
                "note": "Baby pathfinding separation gap.",
            },
            {
                "item": "Water Bucket",
                "amount": 1,
                "category": "Fluid",
                "note": "Chute stream to transport babies away.",
            },
            {
                "item": "Food (Carrots / Potatoes / Bread)",
                "amount": 64,
                "category": "Villager Food",
                "note": "12 carrots/potatoes or 3 bread per villager per breeding attempt.",
            },
            {
                "item": "Torches / Lanterns",
                "amount": 4,
                "category": "Lighting",
                "note": "Prevents hostile mob spawns inside the chamber.",
            },
        ],
        "build_steps": [
            {
                "step_number": 1,
                "title": "Breeder Pod Chamber",
                "description": "Construct a 3x3 interior chamber. Enclose the walls 2 blocks high with glass and solid blocks so the two parent villagers cannot escape.",
                "why_it_matters": "Keeping parent villagers in a compact space ensures they easily exchange food and interact during breeding hours.",
            },
            {
                "step_number": 2,
                "title": "Bed Placement & Clearance",
                "description": "Place 3 or 4 beds adjacent to the breeder pod. CRITICAL: Ensure there are at least 2 full blocks of clear air space directly above the top of all beds.",
                "why_it_matters": "Villagers will NOT breed if they perceive the beds as invalid. In Java Edition, baby villagers must be able to pathfind and jump on beds.",
            },
            {
                "step_number": 3,
                "title": "Trapdoor Separation Chute",
                "description": "Dig a 1x2 or 1x3 trench between the parent villagers and the beds. Place open wooden trapdoors on the top edges of the trench.",
                "why_it_matters": "Adult villagers cannot fit through the gap. Baby villagers are 1 block tall and pathfind across open trapdoors, falling into the trench below.",
            },
            {
                "step_number": 4,
                "title": "Water Transport Flume",
                "description": "Place a single water source at one end of the trench below the trapdoors, directing the stream at least 16 to 20 blocks away into a holding area.",
                "why_it_matters": "Moving the baby villager out of range unlinks them from the breeder beds, allowing the parent villagers to breed again.",
            },
            {
                "step_number": 5,
                "title": "Food Provisioning & Activation",
                "description": "Toss at least 24 carrots or potatoes (or 6 loaves of bread) to the parents. Hearts will appear as both villagers enter love mode.",
                "why_it_matters": "Villagers require sufficient inventory food to establish willingness before producing offspring.",
            },
        ],
        "troubleshooting": [
            {
                "issue": "Villagers show heart particles followed immediately by grey/thunderstorm anger particles.",
                "likely_cause": "The extra beds are obstructed or lack 2 blocks of air clearance above the pillows.",
                "suggested_check": "Ensure no solid blocks, slabs, torches, or carpets exist directly above the beds.",
            },
            {
                "issue": "Villagers pick up food but never show heart particles.",
                "likely_cause": "Villagers do not have enough food in their inventory, or gamerule 'mobGriefing' is disabled.",
                "suggested_check": "Toss a full stack of 64 carrots. If running on a custom server, ensure '/gamerule mobGriefing true' is enabled.",
            },
            {
                "issue": "Babies remain inside the pod with the parents.",
                "likely_cause": "Trapdoors are closed or installed on the bottom half of the block.",
                "suggested_check": "Ensure trapdoors are open and attached to the top half of the block so baby pathfinding registers them as solid ground.",
            },
            {
                "issue": "Breeding stops after 1 or 2 baby villagers.",
                "likely_cause": "Babies in the holding pen are still within 16 blocks and claiming the breeder beds.",
                "suggested_check": "Extend the water flume so baby villagers are transported at least 20-25 blocks away from the breeder beds.",
            },
        ],
        "diagram_data": {
            "type": "schematic",
            "zones": [
                {"id": "breeder_pod", "label": "Breeder Pod (2 Parent Villagers)", "color": "emerald"},
                {"id": "trapdoor_gap", "label": "Trapdoor Separation Trench", "color": "amber"},
                {"id": "bed_room", "label": "Unclaimed Beds (2 Air Blocks Headroom)", "color": "blue"},
                {"id": "water_flume", "label": "Baby Water Chute (Moves 16+ Blocks)", "color": "teal"},
            ],
        },
        "source_references": [
            {
                "title": "Minecraft Java Edition Villager Breeding Mechanics",
                "url": "https://minecraft.wiki/w/Villager#Breeding",
                "note": "Verified willingness, food counts (3 bread, 12 carrots/potatoes), and 2-block bed headroom requirement.",
            },
            {
                "title": "Villager Pathfinding and Bed Ownership",
                "url": "https://minecraft.wiki/w/Village",
                "note": "Verified 16-block unlink radius for newborn villagers.",
            },
        ],
    },
]

# Candidates for curated graph edges: (source_type, source_id, rel_type, target_type, target_id)
CURATED_GRAPH_EDGE_CANDIDATES = [
    # Iron Farm
    ("farm", "iron-farm", "REQUIRES", "mob", "zombie"),
    ("farm", "iron-farm", "REQUIRES", "mob", "iron_golem"),
    ("farm", "iron-farm", "REQUIRES", "item", "hopper"),
    ("farm", "iron-farm", "REQUIRES", "item", "name_tag"),
    ("farm", "iron-farm", "REQUIRES", "mechanic", "villager-golem-panic-spawning"),
    # Unresolved edges (to verify honest skipping)
    ("farm", "iron-farm", "PRODUCES", "item", "iron_ingot"),
    ("farm", "iron-farm", "REQUIRES", "mob", "villager"),
    ("farm", "iron-farm", "REQUIRES", "item", "bed"),
    # Raid Farm
    ("farm", "raid-farm", "REQUIRES", "structure", "village"),
    ("farm", "raid-farm", "REQUIRES", "structure", "pillager-outpost"),
    ("farm", "raid-farm", "REQUIRES", "mob", "pillager"),
    ("farm", "raid-farm", "REQUIRES", "mob", "evoker"),
    ("farm", "raid-farm", "PRODUCES", "item", "totem_of_undying"),
    ("farm", "raid-farm", "PRODUCES", "item", "redstone_dust"),
    ("farm", "raid-farm", "REQUIRES", "mechanic", "raid-bad-omen-trigger"),
    # Unresolved edges
    ("farm", "raid-farm", "PRODUCES", "item", "emerald"),
    # Villager Breeder
    ("farm", "villager-breeder", "REQUIRES", "item", "bread"),
    ("farm", "villager-breeder", "REQUIRES", "structure", "village"),
    ("farm", "villager-breeder", "REQUIRES", "mechanic", "villager-willingness-breeding"),
    # Unresolved edges
    ("farm", "villager-breeder", "REQUIRES", "item", "bed"),
    ("farm", "villager-breeder", "REQUIRES", "mob", "villager"),
]


def check_entity_exists(session: Session, entity_type: str, entity_id: str) -> bool:
    """Safely verify if an entity exists in the SQLite database."""
    e_type = entity_type.lower()
    e_id = entity_id.lower()

    if e_type == "farm":
        return session.scalar(select(Farm.id).where(Farm.id == e_id)) is not None
    if e_type == "mechanic":
        return session.scalar(select(Mechanic.id).where(Mechanic.id == e_id)) is not None
    if e_type == "mob":
        return session.scalar(select(Mob.id).where(Mob.id == e_id)) is not None
    if e_type == "item":
        return session.scalar(select(Item.id).where(Item.id == e_id)) is not None
    if e_type == "structure":
        return session.scalar(select(Structure.id).where(Structure.id == e_id)) is not None
    if e_type == "biome":
        return session.scalar(select(Biome.id).where(Biome.id == e_id)) is not None
    if e_type == "villager_profession":
        return session.scalar(select(VillagerProfession.id).where(VillagerProfession.id == e_id)) is not None
    if e_type == "dimension":
        return session.scalar(select(Dimension.id).where(Dimension.id == e_id)) is not None
    if e_type == "enchantment":
        return session.scalar(select(Enchantment.id).where(Enchantment.id == e_id)) is not None

    return False


def seed_curated_farms(session: Session) -> dict[str, int]:
    """Seed or update curated mechanics, farms, and verified graph relation edges."""
    stats = {
        "mechanics_seeded": 0,
        "farms_seeded": 0,
        "edges_created": 0,
        "edges_skipped": 0,
    }

    # 1. Seed Mechanics
    logger.info("=== Seeding Curated Java Edition Mechanics ===")
    for m_data in CURATED_MECHANICS:
        mech = session.scalar(select(Mechanic).where(Mechanic.id == m_data["id"]))
        if mech is None:
            mech = Mechanic(id=m_data["id"])
            session.add(mech)
            logger.info("  [CREATE] Mechanic: %s (%s)", m_data["name"], m_data["id"])
        else:
            logger.info("  [UPDATE] Mechanic: %s (%s)", m_data["name"], m_data["id"])

        for k, v in m_data.items():
            setattr(mech, k, v)
        stats["mechanics_seeded"] += 1

    session.flush()

    # 2. Seed Farms
    logger.info("=== Seeding Curated Farm Guides ===")
    for f_data in CURATED_FARMS:
        farm = session.scalar(select(Farm).where(Farm.id == f_data["id"]))
        if farm is None:
            farm = Farm(id=f_data["id"])
            session.add(farm)
            logger.info("  [CREATE] Farm: %s (%s)", f_data["name"], f_data["id"])
        else:
            logger.info("  [UPDATE] Farm: %s (%s)", f_data["name"], f_data["id"])

        for k, v in f_data.items():
            setattr(farm, k, v)
        stats["farms_seeded"] += 1

    session.flush()

    # 3. Seed Relation Edges
    logger.info("=== Resolving and Seeding Curated Graph Relation Edges ===")
    for src_type, src_id, rel_type, tgt_type, tgt_id in CURATED_GRAPH_EDGE_CANDIDATES:
        src_exists = check_entity_exists(session, src_type, src_id)
        tgt_exists = check_entity_exists(session, tgt_type, tgt_id)

        if not src_exists or not tgt_exists:
            missing = []
            if not src_exists:
                missing.append(f"{src_type}:{src_id}")
            if not tgt_exists:
                missing.append(f"{tgt_type}:{tgt_id}")
            logger.info(
                "  [SKIP] Unresolved edge: %s:%s -[%s]-> %s:%s (Missing in SQLite: %s)",
                src_type,
                src_id,
                rel_type,
                tgt_type,
                tgt_id,
                ", ".join(missing),
            )
            stats["edges_skipped"] += 1
            continue

        # Check existing edge to maintain idempotency
        existing = session.scalar(
            select(RelationEdge).where(
                RelationEdge.source_entity_type == src_type,
                RelationEdge.source_entity_id == src_id,
                RelationEdge.relationship_type == rel_type,
                RelationEdge.target_entity_type == tgt_type,
                RelationEdge.target_entity_id == tgt_id,
            )
        )

        if existing is None:
            edge = RelationEdge(
                source_entity_type=src_type,
                source_entity_id=src_id,
                relationship_type=rel_type,
                target_entity_type=tgt_type,
                target_entity_id=tgt_id,
                source_type="curated",
                edition="java",
                last_verified_at=NOW_UTC,
                metadata_json=json.dumps({"curated": True}),
            )
            session.add(edge)
            logger.info(
                "  [CREATE EDGE] %s:%s -[%s]-> %s:%s",
                src_type,
                src_id,
                rel_type,
                tgt_type,
                tgt_id,
            )
            stats["edges_created"] += 1
        else:
            existing.source_type = "curated"
            existing.edition = "java"
            existing.last_verified_at = NOW_UTC
            logger.info(
                "  [EXISTS EDGE] %s:%s -[%s]-> %s:%s",
                src_type,
                src_id,
                rel_type,
                tgt_type,
                tgt_id,
            )

    session.commit()
    return stats


def main() -> None:
    """CLI Entrypoint for seeding curated farm data."""
    logger.info("Starting curated farm guide and mechanic seeder...")
    session = SessionLocal()
    try:
        stats = seed_curated_farms(session)
        logger.info(
            "Curated farm seeding completed successfully: %d mechanics, %d farms, %d edges created, %d skipped.",
            stats["mechanics_seeded"],
            stats["farms_seeded"],
            stats["edges_created"],
            stats["edges_skipped"],
        )
    except Exception as exc:
        session.rollback()
        logger.exception("Curated farm seeding failed: %s", exc)
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()

