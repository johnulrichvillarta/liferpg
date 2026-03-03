export type EquipmentSlot = 'head' | 'body' | 'legs' | 'weapon';

export interface EquipmentItem {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    classRestriction: string; // "Warrior", "Mage", "Rogue", "Paladin"
    stats: {
        health?: number;
        attack?: number;
    };
    iconUrl: string; // The local path to the generated PNG
}

export const EQUIPMENT_DATABASE: Record<string, EquipmentItem> = {
    // WARRIOR
    'eq_warrior_head': {
        id: 'eq_warrior_head',
        name: 'Iron Helm',
        description: 'A basic iron helmet for protection.',
        slot: 'head',
        classRestriction: 'Warrior',
        stats: { health: 20 },
        iconUrl: '/equipment/eq_warrior_head_1772441087232.png',
    },
    'eq_warrior_body': {
        id: 'eq_warrior_body',
        name: 'Iron Chestplate',
        description: 'Sturdy iron armor.",
        slot: 'body',
        classRestriction: 'Warrior',
        stats: { health: 40 },
        iconUrl: '/equipment/eq_warrior_body_1772440830811.png',
    },
    'eq_warrior_legs': {
        id: 'eq_warrior_legs',
        name: 'Iron Greaves',
        description: 'Heavy iron leg protection.',
        slot: 'legs',
        classRestriction: 'Warrior',
        stats: { health: 20 },
        iconUrl: '/equipment/eq_warrior_legs_1772440849384.png',
    },
    'eq_warrior_weapon': {
        id: 'eq_warrior_weapon',
        name: 'Broadsword',
        description: 'A reliable iron sword.',
        slot: 'weapon',
        classRestriction: 'Warrior',
        stats: { attack: 15 },
        iconUrl: '/equipment/eq_warrior_weapon_1772441099969.png',
    },

    // MAGE
    'eq_mage_head': {
        id: 'eq_mage_head',
        name: 'Pointed Hat',
        description: 'A classic wizard hat.',
        slot: 'head',
        classRestriction: 'Mage',
        stats: { attack: 5, health: 5 },
        iconUrl: '/equipment/eq_mage_head_1772441185099.png',
    },
    'eq_mage_body': {
        id: 'eq_mage_body',
        name: 'Silk Robe',
        description: 'Flowing enchanted silks.',
        slot: 'body',
        classRestriction: 'Mage',
        stats: { health: 15 },
        iconUrl: '/equipment/eq_mage_body_1772441197810.png',
    },
    'eq_mage_legs': {
        id: 'eq_mage_legs',
        name: 'Apprentice Pants',
        description: 'Comfortable cloth trousers.',
        slot: 'legs',
        classRestriction: 'Mage',
        stats: { health: 10 },
        iconUrl: '/equipment/eq_mage_legs_1772441210104.png',
    },
    'eq_mage_weapon': {
        id: 'eq_mage_weapon',
        name: 'Magic Staff',
        description: 'A wooden staff topped with a crystal.',
        slot: 'weapon',
        classRestriction: 'Mage',
        stats: { attack: 25 },
        iconUrl: '/equipment/eq_mage_weapon_1772441225868.png',
    },

    // ROGUE
    'eq_rogue_head': {
        id: 'eq_rogue_head',
        name: 'Thief Hood',
        description: 'Conceals your identity.',
        slot: 'head',
        classRestriction: 'Rogue',
        stats: { health: 10 },
        iconUrl: '/equipment/eq_rogue_head_1772441319410.png',
    },
    'eq_rogue_body': {
        id: 'eq_rogue_body',
        name: 'Dark Leather Armor',
        description: 'Fitted armor for stealth.',
        slot: 'body',
        classRestriction: 'Rogue',
        stats: { health: 25 },
        iconUrl: '/equipment/eq_rogue_body_1772441332801.png',
    },
    'eq_rogue_legs': {
        id: 'eq_rogue_legs',
        name: 'Stealth Boots',
        description: 'Silent steps.',
        slot: 'legs',
        classRestriction: 'Rogue',
        stats: { health: 15 },
        iconUrl: '/equipment/eq_rogue_legs_1772441351067.png',
    },
    'eq_rogue_weapon': {
        id: 'eq_rogue_weapon',
        name: 'Dual Daggers',
        description: 'Fast and deadly.',
        slot: 'weapon',
        classRestriction: 'Rogue',
        stats: { attack: 20 },
        iconUrl: '/equipment/eq_rogue_weapon_1772441366474.png',
    },

    // PALADIN
    'eq_paladin_head': {
        id: 'eq_paladin_head',
        name: 'Winged Helm',
        description: 'A blessed steel helmet.',
        slot: 'head',
        classRestriction: 'Paladin',
        stats: { health: 25 },
        iconUrl: '/equipment/eq_paladin_head_1772441443944.png',
    },
    'eq_paladin_body': {
        id: 'eq_paladin_body',
        name: 'Shining Plate',
        description: 'Impenetrable holy armor.',
        slot: 'body',
        classRestriction: 'Paladin',
        stats: { health: 50 },
        iconUrl: '/equipment/eq_paladin_body_1772441461498.png',
    },
    'eq_paladin_legs': {
        id: 'eq_paladin_legs',
        name: 'Steel Greaves (Placeholder)',
        description: 'Blessed leg protection.',
        slot: 'legs',
        classRestriction: 'Paladin',
        stats: { health: 25 },
        iconUrl: '/equipment/placeholder_paladin_legs.png',
    },
    'eq_paladin_weapon': {
        id: 'eq_paladin_weapon',
        name: 'Holy Sword (Placeholder)',
        description: 'A glowing broadsword.',
        slot: 'weapon',
        classRestriction: 'Paladin',
        stats: { attack: 18 },
        iconUrl: '/equipment/placeholder_paladin_weapon.png',
    }
};

/**
 * Calculates the total bonus stats for a user based on their equipped items.
 */
export function calculateEquipmentBonus(
    equippedHead: string | null,
    equippedBody: string | null,
    equippedLegs: string | null,
    equippedWeapon: string | null
) {
    let bonusHealth = 0;
    let bonusAttack = 0;

    const slots = [equippedHead, equippedBody, equippedLegs, equippedWeapon];

    for (const itemId of slots) {
        if (!itemId) continue;
        const item = EQUIPMENT_DATABASE[itemId];
        if (item) {
            bonusHealth += item.stats.health || 0;
            bonusAttack += item.stats.attack || 0;
        }
    }

    return { bonusHealth, bonusAttack };
}
