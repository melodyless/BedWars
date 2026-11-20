/**
 * Bedwars Advanced 3D Weapon & Tool System (Minecraft Authentic & High Fidelity)
 * Provides 3D voxel weapon meshes, dynamic combat slash animations,
 * blade arc VFX, and hit spark particle systems.
 */
(function() {
  const WeaponModelBuilder = {
    // Cached materials to maximize performance and minimize draw calls
    materialsCache: {},

    getSwordMaterials(tier = 'wood') {
      if (this.materialsCache['sword_' + tier]) {
        return this.materialsCache['sword_' + tier];
      }

      let bladeCoreColor, bladeEdgeColor, bladeSpineColor, bladeTipColor;
      let guardColor, guardAccentColor, gripColor, gripBandColor, pommelColor;
      let metalness = 0.1, roughness = 0.7, emissive = 0x000000, emissiveIntensity = 0;

      switch (tier) {
        case 'diamond':
          bladeCoreColor = 0x00d8f6;
          bladeEdgeColor = 0x7cf8ff;
          bladeSpineColor = 0xecfeff;
          bladeTipColor = 0xffffff;
          guardColor = 0x0f172a;
          guardAccentColor = 0x00f5ff;
          gripColor = 0x1e1e38;
          gripBandColor = 0x2e2e54;
          pommelColor = 0x00d8f6;
          metalness = 0.55;
          roughness = 0.12;
          emissive = 0x006b8f;
          emissiveIntensity = 0.45;
          break;
        case 'iron':
          bladeCoreColor = 0xe2e8f0;
          bladeEdgeColor = 0xffffff;
          bladeSpineColor = 0xf8fafc;
          bladeTipColor = 0xffffff;
          guardColor = 0x475569;
          guardAccentColor = 0xf59e0b; // Gold rivet inlay
          gripColor = 0x3d2716;
          gripBandColor = 0x5c3818;
          pommelColor = 0x94a3b8;
          metalness = 0.88;
          roughness = 0.22;
          break;
        case 'stone':
          bladeCoreColor = 0x64748b;
          bladeEdgeColor = 0x94a3b8;
          bladeSpineColor = 0x475569;
          bladeTipColor = 0xcbd5e1;
          guardColor = 0x334155;
          guardAccentColor = 0x64748b;
          gripColor = 0x44403c;
          gripBandColor = 0x57534e;
          pommelColor = 0x475569;
          metalness = 0.15;
          roughness = 0.85;
          break;
        case 'wood':
        default:
          bladeCoreColor = 0xb45309;
          bladeEdgeColor = 0xd97706;
          bladeSpineColor = 0x78350f;
          bladeTipColor = 0xfde68a;
          guardColor = 0x451a03;
          guardAccentColor = 0x78350f;
          gripColor = 0x542605;
          gripBandColor = 0x92400e;
          pommelColor = 0x78350f;
          metalness = 0.05;
          roughness = 0.82;
          break;
      }

      const mats = {
        bladeCore: new THREE.MeshStandardMaterial({ color: bladeCoreColor, metalness, roughness, emissive, emissiveIntensity }),
        bladeEdge: new THREE.MeshStandardMaterial({ color: bladeEdgeColor, metalness: metalness * 1.1, roughness: roughness * 0.7, emissive, emissiveIntensity: emissiveIntensity * 1.2 }),
        bladeSpine: new THREE.MeshStandardMaterial({ color: bladeSpineColor, metalness, roughness: roughness * 0.6, emissive, emissiveIntensity }),
        bladeTip: new THREE.MeshStandardMaterial({ color: bladeTipColor, metalness, roughness: 0.1, emissive, emissiveIntensity: emissiveIntensity * 1.5 }),
        guard: new THREE.MeshStandardMaterial({ color: guardColor, metalness: 0.6, roughness: 0.35 }),
        guardAccent: new THREE.MeshStandardMaterial({
          color: guardAccentColor,
          metalness: 0.8,
          roughness: 0.2,
          emissive: (tier === 'diamond' ? 0x00f5ff : 0x000000),
          emissiveIntensity: (tier === 'diamond' ? 0.6 : 0)
        }),
        grip: new THREE.MeshLambertMaterial({ color: gripColor }),
        gripBand: new THREE.MeshLambertMaterial({ color: gripBandColor }),
        pommel: new THREE.MeshStandardMaterial({
          color: pommelColor,
          metalness: (tier === 'iron' ? 0.8 : 0.3),
          roughness: 0.3,
          emissive: (tier === 'diamond' ? 0x00d8f6 : 0),
          emissiveIntensity: (tier === 'diamond' ? 0.4 : 0)
        })
      };

      this.materialsCache['sword_' + tier] = mats;
      return mats;
    },

    /**
     * Creates an authentic, detailed 3D Minecraft Sword
     * @param {string} tierOrId - 'wood', 'stone', 'iron', 'diamond' or item id 'sword_diamond'
     * @param {object} options - { isBot: boolean, enchanted: boolean }
     */
    createSword(tierOrId = 'wood', options = {}) {
      let tier = 'wood';
      if (typeof tierOrId === 'string') {
        const lower = tierOrId.toLowerCase();
        if (lower.includes('diamond')) tier = 'diamond';
        else if (lower.includes('iron')) tier = 'iron';
        else if (lower.includes('stone')) tier = 'stone';
        else tier = 'wood';
      }

      const mats = this.getSwordMaterials(tier);
      const sword = new THREE.Group();
      sword.name = 'sword_' + tier;

      // 1. Pommel (剑柄底端配重首)
      const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.046, 0.046), mats.pommel);
      pommel.position.set(0, -0.015, 0);
      sword.add(pommel);

      if (tier === 'diamond') {
        // Glowing gem facet on diamond sword pommel
        const pGem = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 0.052), mats.guardAccent);
        pGem.rotation.z = Math.PI / 4;
        pGem.position.set(0, -0.015, 0);
        sword.add(pGem);
      }

      // 2. Grip Handle (缠布剑柄)
      const gripCore = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.14, 0.032), mats.grip);
      gripCore.position.set(0, 0.075, 0);
      sword.add(gripCore);

      // 3 Leather wrap bands
      for (let i = 0; i < 3; i++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.02, 0.036), mats.gripBand);
        band.position.set(0, 0.035 + i * 0.04, 0);
        sword.add(band);
      }

      // 3. Crossguard (横向护手与飞翼)
      const guardBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.038, 0.046), mats.guard);
      guardBar.position.set(0, 0.16, 0);
      sword.add(guardBar);

      // Left Wing Quillon
      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.052, 0.042), mats.guard);
      leftWing.position.set(-0.085, 0.18, 0);
      sword.add(leftWing);

      // Right Wing Quillon
      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.052, 0.042), mats.guard);
      rightWing.position.set(0.085, 0.18, 0);
      sword.add(rightWing);

      // Center Inlaid Gem / Boss
      const centerBoss = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.052), mats.guardAccent);
      centerBoss.rotation.z = Math.PI / 4;
      centerBoss.position.set(0, 0.16, 0);
      sword.add(centerBoss);

      // 4. Blade Collar / Ricasso (剑根套扣)
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.03, 0.036), mats.guard);
      collar.position.set(0, 0.19, 0);
      sword.add(collar);

      // 5. Blade Core & Spine (剑身脊线与主刃)
      const bladeCore = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.44, 0.026), mats.bladeCore);
      bladeCore.position.set(0, 0.425, 0);
      sword.add(bladeCore);

      // Raised Central Spine (立体中脊高光线)
      const bladeSpine = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.44, 0.032), mats.bladeSpine);
      bladeSpine.position.set(0, 0.425, 0);
      sword.add(bladeSpine);

      // 6. Dual Cutting Edges (双面锋利切削刃)
      const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.42, 0.018), mats.bladeEdge);
      leftEdge.position.set(-0.031, 0.42, 0);
      sword.add(leftEdge);

      const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.42, 0.018), mats.bladeEdge);
      rightEdge.position.set(0.031, 0.42, 0);
      sword.add(rightEdge);

      // 7. Stepped Minecraft Pixel Blade Tip (阶梯锋芒剑尖)
      const tipStep1 = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.03, 0.024), mats.bladeCore);
      tipStep1.position.set(0, 0.66, 0);
      sword.add(tipStep1);

      const tipStep2 = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.03, 0.020), mats.bladeEdge);
      tipStep2.position.set(0, 0.69, 0);
      sword.add(tipStep2);

      const tipApex = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.024, 0.016), mats.bladeTip);
      tipApex.position.set(0, 0.715, 0);
      sword.add(tipApex);

      // 8. Sparkling Diamond / Enchantment Aura Particles
      if (tier === 'diamond' || options.enchanted) {
        const sparkleGeo = new THREE.BoxGeometry(0.012, 0.012, 0.012);
        const sparkleColor = (tier === 'diamond') ? 0x99ffff : 0xec4899;
        const sparkleMat = new THREE.MeshBasicMaterial({ color: sparkleColor });
        const sparkles = new THREE.Group();
        sparkles.name = 'sparkles';
        for (let s = 0; s < 4; s++) {
          const sp = new THREE.Mesh(sparkleGeo, sparkleMat);
          sp.position.set(
            (s % 2 === 0 ? 0.036 : -0.036),
            0.32 + s * 0.1,
            (s % 3 === 0 ? 0.015 : -0.015)
          );
          sparkles.add(sp);
        }
        sword.add(sparkles);
      }

      // Orientation and offset adjustments
      if (options.isBot) {
        sword.scale.set(0.85, 0.85, 0.85);
        sword.position.set(0, -0.58, 0.20);
        sword.rotation.x = -Math.PI / 3;
      } else {
        // First-person held weapon default orientation
        sword.scale.set(1.0, 1.0, 1.0);
        sword.position.set(0, 0.02, 0);
        // Angled naturally forward-left in hand
        sword.rotation.set(-0.35, 0.25, -0.45);
      }

      return sword;
    },

    /**
     * Creates an authentic recurved 3D Bow with dynamic draw states
     * @param {string} bowType - 'normal', 'power', 'punch'
     * @param {object} options - { isDrawing: boolean, drawProgress: number, isBot: boolean }
     */
    createBow(bowType = 'normal', options = {}) {
      const type = (bowType || 'normal').toLowerCase();
      const bow = new THREE.Group();
      bow.name = 'bow_' + type;

      let staveColor = 0x8b5a2b;
      let runeColor = 0xd97706;
      let stringColor = 0xffffff;
      let emissiveIntensity = 0;

      if (type.includes('power')) {
        staveColor = 0x581c87; // Arcane Royal Purple
        runeColor = 0xfbbf24;  // Gold runes
        stringColor = 0xf3e8ff;
        emissiveIntensity = 0.5;
      } else if (type.includes('punch')) {
        staveColor = 0x065f46; // Cyclone Emerald Green
        runeColor = 0x34d399;  // Turquoise wind runes
        stringColor = 0x67e8f9;
        emissiveIntensity = 0.5;
      }

      const staveMat = new THREE.MeshStandardMaterial({
        color: staveColor,
        metalness: 0.2,
        roughness: 0.6,
        emissive: staveColor,
        emissiveIntensity: emissiveIntensity * 0.4
      });

      const runeMat = new THREE.MeshStandardMaterial({
        color: runeColor,
        metalness: 0.8,
        roughness: 0.2,
        emissive: runeColor,
        emissiveIntensity
      });

      const gripMat = new THREE.MeshLambertMaterial({ color: 0x3d2716 });
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
      const stringMat = new THREE.MeshBasicMaterial({ color: stringColor });

      const isDrawing = !!options.isDrawing;
      const drawProg = THREE.MathUtils.clamp(options.drawProgress || 0, 0, 1);
      const flexAngle = isDrawing ? (0.15 * drawProg) : 0;
      const stringPullZ = isDrawing ? (-0.22 * drawProg) : 0;

      // 1. Center Handle Riser (弓把握柄与箭台)
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.16, 0.046), gripMat);
      bow.add(handle);

      const arrowShelf = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.03, 0.05), staveMat);
      arrowShelf.position.set(-0.026, 0.02, 0);
      bow.add(arrowShelf);

      // 2. Upper Recurve Limb (上弓臂 - 多段反曲几何)
      const upperLimb = new THREE.Group();
      upperLimb.position.set(0, 0.08, 0);
      upperLimb.rotation.x = -0.32 - flexAngle;

      const uLimb1 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.16, 0.036), staveMat);
      uLimb1.position.set(0, 0.08, -0.015);
      upperLimb.add(uLimb1);

      if (emissiveIntensity > 0) {
        const uRune = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.05, 0.038), runeMat);
        uRune.position.set(0, 0.08, -0.015);
        upperLimb.add(uRune);
      }

      // Upper Outer Tip
      const uTipGroup = new THREE.Group();
      uTipGroup.position.set(0, 0.16, -0.03);
      uTipGroup.rotation.x = -0.45;
      const uLimb2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), staveMat);
      uLimb2.position.set(0, 0.06, 0);
      uTipGroup.add(uLimb2);

      const uHorn = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.05, 0.026), tipMat);
      uHorn.position.set(0, 0.13, 0.005);
      uTipGroup.add(uHorn);
      upperLimb.add(uTipGroup);
      bow.add(upperLimb);

      // 3. Lower Recurve Limb (下弓臂 - 对称反曲几何)
      const lowerLimb = new THREE.Group();
      lowerLimb.position.set(0, -0.08, 0);
      lowerLimb.rotation.x = 0.32 + flexAngle;

      const lLimb1 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.16, 0.036), staveMat);
      lLimb1.position.set(0, -0.08, -0.015);
      lowerLimb.add(lLimb1);

      if (emissiveIntensity > 0) {
        const lRune = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.05, 0.038), runeMat);
        lRune.position.set(0, -0.08, -0.015);
        lowerLimb.add(lRune);
      }

      // Lower Outer Tip
      const lTipGroup = new THREE.Group();
      lTipGroup.position.set(0, -0.16, -0.03);
      lTipGroup.rotation.x = 0.45;
      const lLimb2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), staveMat);
      lLimb2.position.set(0, -0.06, 0);
      lTipGroup.add(lLimb2);

      const lHorn = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.05, 0.026), tipMat);
      lHorn.position.set(0, -0.13, 0.005);
      lTipGroup.add(lHorn);
      lowerLimb.add(lowerLimb);

      // 4. Dynamic Bowstring (动态开弦张力弓弦)
      if (isDrawing && drawProg > 0.05) {
        // V-shaped drawn string
        const upperStr = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.34, 0.008), stringMat);
        upperStr.position.set(0, 0.16, -0.08 + stringPullZ * 0.5);
        upperStr.rotation.x = -0.45;
        bow.add(upperStr);

        const lowerStr = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.34, 0.008), stringMat);
        lowerStr.position.set(0, -0.16, -0.08 + stringPullZ * 0.5);
        lowerStr.rotation.x = 0.45;
        bow.add(lowerStr);

        // 5. Nocked 3D Arrow (搭箭)
        const arrow = this.createArrow();
        arrow.position.set(0, 0, stringPullZ);
        arrow.rotation.y = Math.PI / 2;
        bow.add(arrow);
      } else {
        // Rest state straight taut string
        const bowStr = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.58, 0.008), stringMat);
        bowStr.position.set(0, 0, -0.08);
        bow.add(bowStr);
      }

      // Enchantment Particles
      if (emissiveIntensity > 0) {
        const pGeo = new THREE.BoxGeometry(0.012, 0.012, 0.012);
        const pMat = new THREE.MeshBasicMaterial({ color: runeColor });
        for (let k = 0; k < 3; k++) {
          const spark = new THREE.Mesh(pGeo, pMat);
          spark.position.set(
            (Math.random() - 0.5) * 0.06,
            (k - 1) * 0.18,
            -0.03 + (Math.random() - 0.5) * 0.04
          );
          bow.add(spark);
        }
      }

      if (options.isBot) {
        bow.scale.set(0.85, 0.85, 0.85);
        bow.position.set(-0.05, -0.52, 0.2);
        bow.rotation.set(-Math.PI / 4, Math.PI / 6, 0);
      } else {
        bow.rotation.set(-0.1, -Math.PI / 6, -Math.PI / 12);
        bow.position.set(0, 0, 0);
      }

      return bow;
    },

    /**
     * Creates an authentic 3D Pickaxe
     * @param {string} tierOrId - 'pickaxe_wood', 'pickaxe_iron', 'pickaxe_diamond'
     */
    createPickaxe(tierOrId = 'pickaxe_iron') {
      let tier = 'iron';
      if (tierOrId.includes('diamond')) tier = 'diamond';
      else if (tierOrId.includes('wood')) tier = 'wood';

      const pick = new THREE.Group();
      pick.name = 'pickaxe_' + tier;

      let headColor = 0xe2e8f0;
      let metalness = 0.85;
      let roughness = 0.25;
      let emissive = 0x000000;
      let emissiveIntensity = 0;

      if (tier === 'diamond') {
        headColor = 0x00d8f6;
        metalness = 0.5;
        roughness = 0.15;
        emissive = 0x0088aa;
        emissiveIntensity = 0.4;
      } else if (tier === 'wood') {
        headColor = 0xb45309;
        metalness = 0.05;
        roughness = 0.8;
      }

      const shaftMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
      const gripMat = new THREE.MeshLambertMaterial({ color: 0x3d2716 });
      const collarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
      const headMat = new THREE.MeshStandardMaterial({ color: headColor, metalness, roughness, emissive, emissiveIntensity });

      // Handle Shaft
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.56, 0.034), shaftMat);
      shaft.position.set(0, 0.25, 0);
      pick.add(shaft);

      // Grip Tape
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.18, 0.038), gripMat);
      grip.position.set(0, 0.1, 0);
      pick.add(grip);

      // Top Collar
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.06, 0.052), collarMat);
      collar.position.set(0, 0.5, 0);
      pick.add(collar);

      // Curved Double Pick Head
      const centerHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.05), headMat);
      centerHead.position.set(0, 0.51, 0);
      pick.add(centerHead);

      // Left Pick Horn
      const leftHorn = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.042, 0.042), headMat);
      leftHorn.position.set(-0.09, 0.49, 0);
      leftHorn.rotation.z = 0.22;
      pick.add(leftHorn);

      const leftTip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.03), headMat);
      leftTip.position.set(-0.18, 0.46, 0);
      leftTip.rotation.z = 0.45;
      pick.add(leftTip);

      // Right Pick Horn
      const rightHorn = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.042, 0.042), headMat);
      rightHorn.position.set(0.09, 0.49, 0);
      rightHorn.rotation.z = -0.22;
      pick.add(rightHorn);

      const rightTip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.03), headMat);
      rightTip.position.set(0.18, 0.46, 0);
      rightTip.rotation.z = -0.45;
      pick.add(rightTip);

      pick.rotation.set(-0.4, 0.2, -0.4);
      return pick;
    },

    /**
     * Creates an authentic 3D Shears model
     */
    createShears() {
      const shears = new THREE.Group();
      shears.name = 'shears';

      const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
      const boltMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const handleMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });

      // Pivot Bolt
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.042, 8), boltMat);
      bolt.rotation.x = Math.PI / 2;
      shears.add(bolt);

      // Blade 1
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.24, 0.015), steelMat);
      blade1.position.set(0.02, 0.11, -0.008);
      blade1.rotation.z = -0.18;
      shears.add(blade1);

      const edge1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.016), edgeMat);
      edge1.position.set(0.035, 0.11, -0.008);
      edge1.rotation.z = -0.18;
      shears.add(edge1);

      // Handle 1
      const hand1 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.14, 0.025), handleMat);
      hand1.position.set(-0.03, -0.08, -0.008);
      hand1.rotation.z = -0.25;
      shears.add(hand1);

      // Blade 2
      const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.24, 0.015), steelMat);
      blade2.position.set(-0.02, 0.11, 0.008);
      blade2.rotation.z = 0.18;
      shears.add(blade2);

      const edge2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.016), edgeMat);
      edge2.position.set(-0.035, 0.11, 0.008);
      edge2.rotation.z = 0.18;
      shears.add(edge2);

      // Handle 2
      const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.14, 0.025), handleMat);
      hand2.position.set(0.03, -0.08, 0.008);
      hand2.rotation.z = 0.25;
      shears.add(hand2);

      shears.rotation.set(-0.3, 0.2, -0.2);
      return shears;
    },

    /**
     * Creates an authentic 3D Arrow
     */
    createArrow() {
      const arrow = new THREE.Group();
      arrow.name = 'arrow';

      const shaftMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 });
      const tipMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const fletchMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

      // Shaft
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.55), shaftMat);
      arrow.add(shaft);

      // Arrowhead
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.07, 4), tipMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, 0, 0.29);
      arrow.add(tip);

      // 3-Fin Fletchings
      for (let f = 0; f < 3; f++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.045, 0.11), fletchMat);
        fin.position.set(0, 0, -0.22);
        fin.rotation.z = (f * Math.PI * 2) / 3;
        arrow.add(fin);
      }

      return arrow;
    },

    /**
     * Creates a dynamic blade slash arc ribbon mesh
     * @param {string} weaponId - id of the weapon for color coding
     */
    createSlashArcMesh(weaponId = 'sword_diamond') {
      const arcGroup = new THREE.Group();
      arcGroup.name = 'slash_arc';

      let arcColor = 0x00f5ff;
      if (weaponId.includes('iron')) arcColor = 0xffffff;
      else if (weaponId.includes('stone')) arcColor = 0xcbd5e1;
      else if (weaponId.includes('wood')) arcColor = 0xfde68a;

      // Curved crescent slash arc geometry
      const arcGeo = new THREE.RingGeometry(0.38, 0.54, 16, 1, -Math.PI * 0.45, Math.PI * 0.85);
      const arcMat = new THREE.MeshBasicMaterial({
        color: arcColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      arcMesh.rotation.x = Math.PI / 2;
      arcGroup.add(arcMesh);

      // Inner intense core streak
      const coreGeo = new THREE.RingGeometry(0.44, 0.49, 16, 1, -Math.PI * 0.35, Math.PI * 0.7);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.rotation.x = Math.PI / 2;
      arcGroup.add(coreMesh);

      arcGroup.position.set(0.1, -0.05, -0.45);
      arcGroup.rotation.set(0.3, -0.2, 0.4);
      return arcGroup;
    },

    /**
     * Spawns sharp weapon hit sparks and crit stars on entity hit
     * @param {VoxelWorld} world
     * @param {THREE.Vector3} pos
     * @param {number} colorHex
     */
    spawnHitSparks(world, pos, colorHex = 0xffffff) {
      if (!world || !world.scene || !world.particles) return;

      const sparkGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const sparkMat = new THREE.MeshBasicMaterial({ color: colorHex });

      for (let i = 0; i < 7; i++) {
        const sp = new THREE.Mesh(sparkGeo, sparkMat);
        sp.position.copy(pos).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          Math.random() * 0.6 + 0.2,
          (Math.random() - 0.5) * 0.4
        ));
        world.scene.add(sp);
        world.particles.push({
          mesh: sp,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4.5,
            Math.random() * 4.0 + 1.5,
            (Math.random() - 0.5) * 4.5
          ),
          life: 0.35
        });
      }
    },

    /**
     * Creates an authentic 3D Golden Apple
     */
    createGoldenApple(options = {}) {
      const apple = new THREE.Group();
      apple.name = 'golden_apple';

      const appleMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0x92400e,
        emissiveIntensity: 0.18
      });
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 });

      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 1), appleMat);
      body.scale.set(1.05, 0.95, 1.05);
      apple.add(body);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.07, 6), stemMat);
      stem.position.set(0.01, 0.13, 0);
      stem.rotation.z = -0.25;
      apple.add(stem);

      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.05), leafMat);
      leaf.position.set(0.035, 0.14, 0.01);
      leaf.rotation.set(0.3, 0.2, -0.4);
      apple.add(leaf);

      const sparkGeo = new THREE.BoxGeometry(0.014, 0.014, 0.014);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (let i = 0; i < 4; i++) {
        const sp = new THREE.Mesh(sparkGeo, sparkMat);
        sp.position.set(
          (Math.random() - 0.5) * 0.24,
          (Math.random() - 0.5) * 0.20,
          (Math.random() - 0.5) * 0.24
        );
        apple.add(sp);
      }

      if (options.isDropped) {
        apple.scale.set(1.3, 1.3, 1.3);
      } else {
        apple.position.set(0, 0.02, 0);
        apple.rotation.set(0.2, -0.3, 0.2);
      }

      return apple;
    },

    /**
     * Creates an authentic 3D Enchanted Golden Apple (Notch Apple)
     */
    createEnchantedGoldenApple(options = {}) {
      const apple = new THREE.Group();
      apple.name = 'enchanted_golden_apple';

      const appleMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        metalness: 0.8,
        roughness: 0.15,
        emissive: 0xd946ef,
        emissiveIntensity: 0.55
      });
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x3b0764 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.3 });

      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.125, 1), appleMat);
      body.scale.set(1.05, 0.95, 1.05);
      apple.add(body);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.07, 6), stemMat);
      stem.position.set(0.01, 0.13, 0);
      stem.rotation.z = -0.25;
      apple.add(stem);

      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.05), leafMat);
      leaf.position.set(0.035, 0.14, 0.01);
      leaf.rotation.set(0.3, 0.2, -0.4);
      apple.add(leaf);

      const sparkGeo = new THREE.BoxGeometry(0.014, 0.014, 0.014);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
      for (let i = 0; i < 6; i++) {
        const sp = new THREE.Mesh(sparkGeo, sparkMat);
        sp.position.set(
          (Math.random() - 0.5) * 0.26,
          (Math.random() - 0.5) * 0.24,
          (Math.random() - 0.5) * 0.26
        );
        apple.add(sp);
      }

      if (options.isDropped) {
        apple.scale.set(1.3, 1.3, 1.3);
      } else {
        apple.position.set(0, 0.02, 0);
        apple.rotation.set(0.2, -0.3, 0.2);
      }

      return apple;
    },

    /**
     * Creates an authentic 3D Fireball (Ghast Fire Charge)
     */
    createFireball(options = {}) {
      const fb = new THREE.Group();
      fb.name = 'fireball';

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.85,
        metalness: 0.1,
        emissive: 0xff3b00,
        emissiveIntensity: 1.15
      });
      const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 1), coreMat);
      fb.add(core);

      const crustMat = new THREE.MeshBasicMaterial({
        color: 0xff8c00,
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const crust = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), crustMat);
      fb.add(crust);

      const emberGeo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
      const emberMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
      for (let i = 0; i < 5; i++) {
        const em = new THREE.Mesh(emberGeo, emberMat);
        em.position.set(
          (Math.random() - 0.5) * 0.24,
          (Math.random() - 0.5) * 0.24,
          (Math.random() - 0.5) * 0.24
        );
        fb.add(em);
      }

      if (options.isProjectile) {
        fb.scale.set(1.5, 1.5, 1.5);
      } else {
        fb.position.set(0, 0.04, 0);
      }

      return fb;
    },

    /**
     * Creates an authentic 3D Ender Pearl
     */
    createEnderPearl(options = {}) {
      const pearl = new THREE.Group();
      pearl.name = 'ender_pearl';

      const outerMat = new THREE.MeshStandardMaterial({
        color: 0x064e3b,
        metalness: 0.6,
        roughness: 0.2,
        transparent: true,
        opacity: 0.88,
        emissive: 0x042f2e,
        emissiveIntensity: 0.35
      });
      const outer = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), outerMat);
      pearl.add(outer);

      const innerMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const inner = new THREE.Mesh(new THREE.DodecahedronGeometry(0.065, 0), innerMat);
      pearl.add(inner);

      const voidGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
      const voidMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      for (let i = 0; i < 4; i++) {
        const vp = new THREE.Mesh(voidGeo, voidMat);
        vp.position.set(
          (Math.random() - 0.5) * 0.22,
          (Math.random() - 0.5) * 0.22,
          (Math.random() - 0.5) * 0.22
        );
        pearl.add(vp);
      }

      if (options.isProjectile) {
        pearl.scale.set(1.2, 1.2, 1.2);
      } else {
        pearl.position.set(0, 0.03, 0);
      }

      return pearl;
    },

    /**
     * Creates a high-fidelity 3D dropped item for resource generators
     * @param {string} type - 'iron', 'gold', 'diamond', 'emerald', 'wool', 'gapple'
     */
    createDroppedItem(type = 'iron') {
      const itemGroup = new THREE.Group();
      itemGroup.name = 'item_' + type;

      switch (type) {
        case 'iron': {
          const ironMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.92, roughness: 0.18 });
          const barBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.38), ironMat);
          itemGroup.add(barBase);
          const barTop = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.03, 0.33), ironMat);
          barTop.position.set(0, 0.05, 0);
          itemGroup.add(barTop);
          break;
        }
        case 'gold': {
          const goldMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            metalness: 0.88,
            roughness: 0.2,
            emissive: 0xb45309,
            emissiveIntensity: 0.15
          });
          const barBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.38), goldMat);
          itemGroup.add(barBase);
          const barTop = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.03, 0.33), goldMat);
          barTop.position.set(0, 0.05, 0);
          itemGroup.add(barTop);
          break;
        }
        case 'diamond': {
          const diaMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            metalness: 0.45,
            roughness: 0.1,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.5
          });
          const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 0.08, 8), diaMat);
          crown.position.set(0, 0.04, 0);
          itemGroup.add(crown);
          const pavilion = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.18, 8), diaMat);
          pavilion.rotation.x = Math.PI;
          pavilion.position.set(0, -0.09, 0);
          itemGroup.add(pavilion);

          const spMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc });
          const sp1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), spMat);
          sp1.position.set(0.14, 0.08, 0);
          itemGroup.add(sp1);
          const sp2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), spMat);
          sp2.position.set(-0.14, -0.04, 0);
          itemGroup.add(sp2);
          break;
        }
        case 'emerald': {
          const emMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            metalness: 0.4,
            roughness: 0.15,
            emissive: 0x059669,
            emissiveIntensity: 0.5
          });
          const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.26, 6), emMat);
          itemGroup.add(prism);
          const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.06, 6), emMat);
          topCap.position.set(0, 0.16, 0);
          itemGroup.add(topCap);
          const botCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.06, 6), emMat);
          botCap.position.set(0, -0.16, 0);
          itemGroup.add(botCap);

          const spMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
          const sp1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), spMat);
          sp1.position.set(0.12, 0.1, 0.05);
          itemGroup.add(sp1);
          break;
        }
        case 'wool': {
          const woolMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.85 });
          const woolBlock = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), woolMat);
          itemGroup.add(woolBlock);
          break;
        }
        case 'gapple': {
          return this.createGoldenApple({ isDropped: true });
        }
        case 'potion_speed':
        case 'potion_jump':
        case 'potion_invisibility':
        case 'potion_regen':
        case 'potion': {
          return this.createPotion(type === 'potion' ? 'potion_speed' : type, { isDropped: true });
        }
        default: {
          const defMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
          itemGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), defMat));
        }
      }

      return itemGroup;
    },

    /**
     * Creates an authentic 3D Minecraft Potion Bottle
     */
    createPotion(potionType = 'potion_speed', options = {}) {
      const bottle = new THREE.Group();
      bottle.name = potionType;

      let liquidColor = 0x00d0f0;
      let emissiveColor = 0x0284c7;
      let opacityVal = 0.88;

      if (potionType === 'potion_speed' || potionType === 'speed') {
        liquidColor = 0x00d0f0;
        emissiveColor = 0x0284c7;
      } else if (potionType === 'potion_jump' || potionType === 'jump') {
        liquidColor = 0x22c55e;
        emissiveColor = 0x15803d;
      } else if (potionType === 'potion_invisibility' || potionType === 'invisibility') {
        liquidColor = 0xcbd5e1;
        emissiveColor = 0x7c3aed;
        opacityVal = 0.65;
      } else if (potionType === 'potion_regen' || potionType === 'regen') {
        liquidColor = 0xf43f5e;
        emissiveColor = 0xe11d48;
      }

      // 1. Translucent Glass Shell
      const glassMat = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1
      });

      // Glass Bottle Body
      const glassBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.15, 8), glassMat);
      glassBody.position.set(0, 0, 0);
      bottle.add(glassBody);

      // Glass Neck
      const glassNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.065, 8), glassMat);
      glassNeck.position.set(0, 0.105, 0);
      bottle.add(glassNeck);

      // Glass Lip ring
      const glassLip = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.022, 8), glassMat);
      glassLip.position.set(0, 0.142, 0);
      bottle.add(glassLip);

      // 2. Oak Cork Stopper
      const corkMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.045, 8), corkMat);
      cork.position.set(0, 0.165, 0);
      bottle.add(cork);

      // 3. Glowing Liquid Inside
      const liquidMat = new THREE.MeshStandardMaterial({
        color: liquidColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: opacityVal,
        roughness: 0.2
      });
      const liquidBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.125, 8), liquidMat);
      liquidBody.position.set(0, -0.012, 0);
      bottle.add(liquidBody);

      // 4. Floating Magical Sparkle Bubbles inside/around bottle
      const bubbleGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
      const bubbleMat = new THREE.MeshBasicMaterial({ color: liquidColor });
      for (let i = 0; i < 4; i++) {
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.position.set(
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.5) * 0.14,
          (Math.random() - 0.5) * 0.12
        );
        bottle.add(bubble);
      }

      if (options.isDropped) {
        bottle.scale.set(1.4, 1.4, 1.4);
      } else {
        bottle.position.set(0, 0.02, 0);
        bottle.rotation.set(0.15, -0.25, 0.1);
      }

      return bottle;
    }
  };

  window.WeaponModelBuilder = WeaponModelBuilder;
})();
