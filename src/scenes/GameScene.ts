import Phaser from 'phaser';
import { config } from '../config';
import { BeatClock } from '../audio/BeatClock';
import { SynthTrack } from '../audio/SynthTrack';
import { Pool } from '../core/Pool';
import { depthScale, projectX, projectY } from '../core/projection';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import type { PlayerStats } from '../data/stats';
import { STARTER_TRACK, TRACKS, type TrackDef } from '../data/tracks';
import { UPGRADES } from '../data/upgrades';
import { STARTER_WEAPON, WEAPONS } from '../data/weapons';
import { Backdrop } from '../render/Backdrop';
import { saveManager } from '../save/SaveData';
import { makeFormation } from '../systems/formations';
import { fmtTime, MONO, FONT } from './TitleScene';

const W = config.width;
const H = config.height;
const PLAYER_R = 34;

interface Enemy { sprite: Phaser.GameObjects.Image; def: EnemyDef; z: number; bx: number; by: number; hp: number; flash: number }
interface Bullet { sprite: Phaser.GameObjects.Image; z: number; bx: number; by: number; dmg: number; pierce: number; hits: Enemy[] }
interface Gem { sprite: Phaser.GameObjects.Image; z: number; bx: number; by: number; xp: number }

export class GameScene extends Phaser.Scene {
  private track!: TrackDef;
  private clock!: BeatClock;
  private synth?: SynthTrack;
  private ctx?: AudioContext;
  private backdrop!: Backdrop;

  private enemies!: Pool<Enemy>;
  private bullets!: Pool<Bullet>;
  private gems!: Pool<Gem>;
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;

  private car!: Phaser.GameObjects.Image;
  private underglow!: Phaser.GameObjects.Image;
  private pos = { x: W / 2, y: (config.playerMinY + config.playerMaxY) / 2 };
  private target = { x: W / 2, y: this.pos.y };
  private drag?: { px: number; py: number; tx: number; ty: number };
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private stats!: PlayerStats;
  private upgradeLevels: Record<string, number> = {};
  private hp = 100;
  private level = 1;
  private xp = 0;
  private xpNeeded = 5;
  private pendingLevels = 0;
  private choosing = false;
  private invuln = 0;
  private dead = false;
  private lastStep = -1;
  private surviveSec = 0;
  private spb = 0.625;

  private hud!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private debugText?: Phaser.GameObjects.Text;

  constructor() { super('Game'); }

  create() {
    this.track = TRACKS[STARTER_TRACK];
    const weapon = WEAPONS[STARTER_WEAPON];
    this.stats = { maxHp: 100, moveSpeed: 520, magnet: 60, ...weapon.base };
    this.upgradeLevels = {};
    this.hp = this.stats.maxHp;
    this.level = 1; this.xp = 0; this.xpNeeded = this.needFor(1);
    this.pendingLevels = 0; this.choosing = false; this.invuln = 0; this.dead = false;
    this.lastStep = -1; this.surviveSec = 0;
    this.pos = { x: W / 2, y: (config.playerMinY + config.playerMaxY) / 2 };
    this.target = { ...this.pos };

    this.backdrop = new Backdrop(this);

    // Pools
    const mkImage = (tex: string) => this.add.image(0, 0, tex).setVisible(false);
    this.enemies = new Pool<Enemy>(
      () => ({ sprite: mkImage('spinner'), def: ENEMIES.spinner, z: 0, bx: 0, by: 0, hp: 1, flash: 0 }),
      (e) => e.sprite.setVisible(true), (e) => e.sprite.setVisible(false), 40);
    this.bullets = new Pool<Bullet>(
      () => ({ sprite: mkImage(weapon.texture).setBlendMode(Phaser.BlendModes.ADD), z: 1, bx: 0, by: 0, dmg: 1, pierce: 0, hits: [] }),
      (b) => { b.hits.length = 0; b.sprite.setVisible(true); }, (b) => b.sprite.setVisible(false), 80);
    this.gems = new Pool<Gem>(
      () => ({ sprite: mkImage('gem').setBlendMode(Phaser.BlendModes.ADD), z: 0, bx: 0, by: 0, xp: 1 }),
      (g) => g.sprite.setVisible(true), (g) => g.sprite.setVisible(false), 60);

    this.burst = this.add.particles(0, 0, 'glow', {
      emitting: false, lifespan: 420, speed: { min: 60, max: 280 },
      scale: { start: 1.1, end: 0 }, blendMode: 'ADD', tint: [0xff3fa4, 0x00ffe1, 0xfff35c],
    }).setDepth(40);

    // Player
    this.underglow = this.add.image(0, 0, 'glow').setTint(0x00ffe1).setBlendMode(Phaser.BlendModes.ADD).setScale(4, 1.6).setAlpha(0.7).setDepth(29);
    this.car = this.add.image(0, 0, 'car').setDepth(30);

    this.setupInput();
    this.setupHud();

    // Audio + beat clock (derived from audio time, not frame time)
    const sm = this.sound as Phaser.Sound.WebAudioSoundManager;
    this.ctx = sm.context as AudioContext | undefined;
    this.spb = 60 / this.track.bpm;
    if (this.ctx) {
      const ctx = this.ctx;
      void ctx.resume();
      const latency = (ctx.outputLatency || ctx.baseLatency || 0);
      this.clock = new BeatClock(() => ctx.currentTime - latency, this.track.bpm, this.track.offset);
      const startAt = ctx.currentTime + 0.5;
      this.clock.start(startAt);
      this.synth = new SynthTrack(ctx, this.track);
      this.synth.start(startAt);
    } else {
      this.clock = new BeatClock(() => this.time.now / 1000, this.track.bpm, this.track.offset);
      this.clock.start(this.time.now / 1000 + 0.5);
    }

    this.game.events.on('upgrade-picked', this.onUpgradePicked, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('upgrade-picked', this.onUpgradePicked, this);
      this.synth?.stop();
    });
  }

  // ---------- setup ----------
  private setupInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.dead) return;
      this.drag = { px: p.x, py: p.y, tx: this.target.x, ty: this.target.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      this.target.x = this.drag.tx + (p.x - this.drag.px) * 1.4;
      this.target.y = this.drag.ty + (p.y - this.drag.py) * 1.4;
    });
    this.input.on('pointerup', () => { this.drag = undefined; });
  }

  private setupHud() {
    this.hud = this.add.graphics().setDepth(100);
    this.levelText = this.add.text(16, 30, '', { fontFamily: MONO, fontSize: '16px', color: '#fff35c' }).setDepth(100);
    this.timeText = this.add.text(W - 16, 12, '', { fontFamily: MONO, fontSize: '18px', color: '#00ffe1' }).setOrigin(1, 0).setDepth(100);
    if (config.debug) this.debugText = this.add.text(16, H - 70, '', { fontFamily: MONO, fontSize: '12px', color: '#9f9' }).setDepth(100);
  }

  // ---------- main loop ----------
  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const beat = this.clock.beat();
    this.backdrop.update(dt, beat, this.track.bpm, this.pos.x - W / 2);
    this.updatePlayer(dt, beat);
    if (this.dead || beat < 0) { this.drawHud(beat); return; }

    this.surviveSec += dt;
    const stepNow = Math.floor(beat * 4);
    if (stepNow - this.lastStep > 16) this.lastStep = stepNow - 1;
    while (this.lastStep < stepNow) {
      this.lastStep++;
      this.onStep(this.lastStep, beat);
    }

    this.updateBullets(dt);
    this.updateEnemies(dt, beat);
    this.updateGems(dt);
    this.resolveBulletHits();
    this.drawHud(beat);

    if (this.pendingLevels > 0 && !this.choosing) this.openLevelUp();
  }

  private onStep(step: number, beatNow: number) {
    const late = (beatNow - step / 4) * this.spb; // seconds past the exact step time

    // Weapon pulses ride the beat grid
    if (step % this.stats.fireSteps === 0) this.fire();

    // Beat-quantized spawns
    const bar = Math.floor(step / 16);
    let section = this.track.sections[0];
    for (const s of this.track.sections) if (s.fromBar <= bar) section = s;
    for (const rule of section.rules) {
      const every = Math.max(1, Math.round(rule.everyBeats * 4));
      if (step % every !== 0) continue;
      this.spawnFormation(rule.kind, rule.count ?? 1, bar, late);
      if (rule.kind === 'single' && Math.random() < config.spawnDensity - 1) this.spawnFormation('single', 1, bar, late);
    }
  }

  private spawnFormation(kind: Parameters<typeof makeFormation>[0], count: number, bar: number, late: number) {
    const def = ENEMIES.spinner;
    const speed = 1 / (def.travelBeats * this.spb);
    for (const p of makeFormation(kind, count)) {
      const e = this.enemies.spawn();
      e.def = def;
      e.bx = p.bx; e.by = p.by;
      e.z = 0.01 + late * speed;
      e.hp = Math.ceil(def.hp * (1 + bar * 0.04));
      e.flash = 0;
      e.sprite.setTexture(def.texture).clearTint();
    }
  }

  private fire() {
    const n = this.stats.projectiles;
    for (let i = 0; i < n; i++) {
      const b = this.bullets.spawn();
      b.z = 1;
      b.bx = this.pos.x + (i - (n - 1) / 2) * 34;
      b.by = this.pos.y - 18;
      b.dmg = this.stats.damage;
      b.pierce = this.stats.pierce;
    }
  }

  // ---------- entities ----------
  private updatePlayer(dt: number, beat: number) {
    const k = this.keys;
    const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      this.target.x += (dx / len) * this.stats.moveSpeed * dt;
      this.target.y += (dy / len) * this.stats.moveSpeed * dt;
    }
    this.target.x = Phaser.Math.Clamp(this.target.x, 50, W - 50);
    this.target.y = Phaser.Math.Clamp(this.target.y, config.playerMinY, config.playerMaxY);

    const prevX = this.pos.x;
    const f = 1 - Math.exp(-16 * dt);
    this.pos.x += (this.target.x - this.pos.x) * f;
    this.pos.y += (this.target.y - this.pos.y) * f;

    const bob = Math.sin(Math.max(beat, 0) * Math.PI * 2) * 3;
    this.car.setPosition(this.pos.x, this.pos.y + bob);
    this.car.setRotation(Phaser.Math.Clamp((this.pos.x - prevX) * 0.02, -0.35, 0.35));
    this.underglow.setPosition(this.pos.x, this.pos.y + 38 + bob);
    this.invuln = Math.max(0, this.invuln - dt);
    this.car.setAlpha(this.invuln > 0 ? (Math.floor(this.invuln * 20) % 2 ? 0.35 : 1) : 1);
  }

  private updateBullets(dt: number) {
    const w = WEAPONS[STARTER_WEAPON];
    const speed = 1 / (w.bulletTravelBeats * this.spb);
    for (let i = this.bullets.active.length - 1; i >= 0; i--) {
      const b = this.bullets.active[i];
      b.z -= speed * dt;
      if (b.z <= 0.02) { this.bullets.releaseAt(i); continue; }
      const s = depthScale(b.z);
      b.sprite.setPosition(projectX(b.bx, b.z), projectY(b.by, b.z)).setScale(s * 1.1, s * (1 + (1 - b.z) * 0.6)).setDepth(10.5 + b.z * 10);
    }
  }

  private updateEnemies(dt: number, beat: number) {
    for (let i = this.enemies.active.length - 1; i >= 0; i--) {
      const e = this.enemies.active[i];
      e.z += (1 / (e.def.travelBeats * this.spb)) * dt;

      if (e.z >= 0.95 && e.z <= 1.08 && !this.dead) {
        const d = Math.hypot(e.bx - this.pos.x, e.by - this.pos.y);
        if (d < e.def.radius + PLAYER_R) {
          this.hitPlayer(e.def.contactDamage);
          this.explode(e, 8);
          this.enemies.releaseAt(i);
          continue;
        }
      }
      if (e.z > 1.12) { this.enemies.releaseAt(i); continue; }

      const s = depthScale(e.z);
      e.flash = Math.max(0, e.flash - dt);
      if (e.flash > 0) e.sprite.setTintFill(0xffffff); else e.sprite.clearTint();
      e.sprite
        .setPosition(projectX(e.bx, e.z), projectY(e.by, e.z))
        .setScale(s * e.def.spriteScale)
        .setRotation((Math.max(beat, 0) * Math.PI) / 2) // quarter turn per beat
        .setAlpha(Math.min(1, e.z * 6))
        .setDepth(10 + e.z * 10);
    }
  }

  private updateGems(dt: number) {
    const gemSpeed = 1 / (6 * this.spb);
    for (let i = this.gems.active.length - 1; i >= 0; i--) {
      const g = this.gems.active[i];
      g.z += gemSpeed * dt;
      const d = Math.hypot(g.bx - this.pos.x, g.by - this.pos.y);
      if (g.z > 0.5 && d < this.stats.magnet + 140) {
        const pull = 1 - Math.exp(-(g.z > 0.8 ? 6 : 2) * dt);
        if (d < this.stats.magnet + 60 || g.z > 0.85) {
          g.bx += (this.pos.x - g.bx) * pull;
          g.by += (this.pos.y - g.by) * pull;
        }
      }
      if (g.z >= 0.9 && !this.dead && d < PLAYER_R + 20 + this.stats.magnet * 0.5) {
        this.addXp(g.xp);
        this.gems.releaseAt(i);
        continue;
      }
      if (g.z > 1.1) { this.gems.releaseAt(i); continue; }
      const s = depthScale(g.z);
      g.sprite.setPosition(projectX(g.bx, g.z), projectY(g.by, g.z)).setScale(s * 1.1).setAlpha(Math.min(1, g.z * 6)).setDepth(10.2 + g.z * 10);
    }
  }

  private resolveBulletHits() {
    const w = WEAPONS[STARTER_WEAPON];
    for (let bi = this.bullets.active.length - 1; bi >= 0; bi--) {
      const b = this.bullets.active[bi];
      let consumed = false;
      for (let ei = this.enemies.active.length - 1; ei >= 0 && !consumed; ei--) {
        const e = this.enemies.active[ei];
        if (Math.abs(b.z - e.z) > 0.06 || b.hits.includes(e)) continue;
        const r = e.def.radius + w.bulletRadius;
        const dx = b.bx - e.bx, dy = b.by - e.by;
        if (dx * dx + dy * dy > r * r) continue;

        b.hits.push(e);
        e.hp -= b.dmg;
        e.flash = 0.06;
        if (e.hp <= 0) {
          this.explode(e, 14);
          const gem = this.gems.spawn();
          gem.bx = e.bx; gem.by = e.by; gem.z = e.z; gem.xp = e.def.xp;
          this.enemies.releaseAt(ei);
        }
        if (b.hits.length > b.pierce) consumed = true;
      }
      if (consumed) this.bullets.releaseAt(bi);
    }
  }

  private explode(e: Enemy, n: number) {
    this.burst.explode(n, projectX(e.bx, e.z), projectY(e.by, e.z));
  }

  // ---------- player state ----------
  private hitPlayer(dmg: number) {
    if (this.invuln > 0) return;
    this.hp -= dmg;
    this.invuln = 0.9;
    this.cameras.main.shake(140, 0.012);
    this.cameras.main.flash(90, 255, 63, 164);
    if (this.hp <= 0) this.gameOver();
  }

  private needFor(level: number) { return Math.round(5 * Math.pow(1.3, level - 1)); }

  private addXp(amount: number) {
    this.xp += amount * config.xpMultiplier;
    while (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level++;
      this.xpNeeded = this.needFor(this.level);
      this.pendingLevels++;
    }
  }

  private openLevelUp() {
    const eligible = UPGRADES.filter((u) => (this.upgradeLevels[u.id] ?? 0) < u.maxLevel);
    if (eligible.length === 0) {
      this.pendingLevels--;
      this.hp = Math.min(this.stats.maxHp, this.hp + 25);
      return;
    }
    const choices = Phaser.Utils.Array.Shuffle([...eligible]).slice(0, config.levelUpChoices);
    this.choosing = true;
    this.ctx?.suspend(); // freezes the audio clock, so the beat clock and music stay in sync
    this.scene.pause();
    this.scene.launch('LevelUp', { choices, levels: this.upgradeLevels });
  }

  private onUpgradePicked(id: string) {
    const up = UPGRADES.find((u) => u.id === id);
    if (up) {
      const before = this.stats.maxHp;
      up.apply(this.stats);
      this.upgradeLevels[id] = (this.upgradeLevels[id] ?? 0) + 1;
      this.hp = Math.min(this.stats.maxHp, this.hp + (this.stats.maxHp - before));
    }
    this.pendingLevels--;
    this.choosing = false;
    void this.ctx?.resume();
    this.scene.resume();
  }

  private gameOver() {
    this.dead = true;
    this.synth?.stop();
    const newBest = saveManager.recordRun(this.surviveSec, this.level);
    const cx = W / 2;
    this.add.rectangle(cx, H / 2, W, H, 0x05010f, 0.7).setDepth(200);
    const t = this.add.text(cx, H / 2 - 40, 'SIGNAL LOST', { fontFamily: FONT, fontSize: '64px', color: '#ff3fa4' }).setOrigin(0.5).setDepth(201);
    t.setShadow(0, 0, '#00ffe1', 16, true, true);
    this.add.text(cx, H / 2 + 20, `survived ${fmtTime(this.surviveSec)}   level ${this.level}${newBest ? '   NEW BEST!' : ''}`, {
      fontFamily: MONO, fontSize: '20px', color: '#fff35c',
    }).setOrigin(0.5).setDepth(201);
    const again = this.add.text(cx, H / 2 + 70, 'tap or press SPACE to retry', { fontFamily: MONO, fontSize: '16px', color: '#00ffe1' }).setOrigin(0.5).setDepth(201);
    this.tweens.add({ targets: again, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    this.time.delayedCall(700, () => {
      const restart = () => this.scene.restart();
      this.input.once('pointerdown', restart);
      this.input.keyboard?.once('keydown-SPACE', restart);
    });
  }

  // ---------- HUD ----------
  private drawHud(beat: number) {
    const g = this.hud;
    g.clear();
    g.fillStyle(0x1a0a3a, 0.8).fillRect(0, 0, W, 6);
    g.fillStyle(0xfff35c, 1).fillRect(0, 0, W * Phaser.Math.Clamp(this.xp / this.xpNeeded, 0, 1), 6);
    g.fillStyle(0x1a0a3a, 0.8).fillRect(16, 12, 200, 12);
    g.fillStyle(this.hp / this.stats.maxHp > 0.3 ? 0xff3fa4 : 0xff2244, 1).fillRect(16, 12, 200 * Phaser.Math.Clamp(this.hp / this.stats.maxHp, 0, 1), 12);
    g.lineStyle(2, 0x00ffe1, 0.8).strokeRect(16, 12, 200, 12);
    // beat indicator
    const phase = beat < 0 ? 0 : beat - Math.floor(beat);
    g.fillStyle(0x00ffe1, 0.25 + Math.pow(1 - phase, 3) * 0.75).fillCircle(W - 24, 44, 8);

    this.levelText.setText(`LV ${this.level}`);
    this.timeText.setText(fmtTime(this.surviveSec));
    this.debugText?.setText(
      `variant ${config.variantId}  beat ${beat.toFixed(2)}  fps ${Math.round(this.game.loop.actualFps)}\n` +
      `enemies ${this.enemies.active.length} bullets ${this.bullets.active.length} gems ${this.gems.active.length}`);
  }
}
