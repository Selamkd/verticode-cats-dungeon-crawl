import Phaser from 'phaser';

import { drawCatOnCanvas, type CatDirection } from '../helpers/drawCatOnCanvas';
import { CATS } from '../model/cats';
import { TILE_SIZE } from '../model/const';
import { PAL } from '../model/palette';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.createWallTexture();
    this.createFloorTexture();
    this.createFuseTextures();
    this.createLightTextures();
    this.createCatTextures();
    this.createParticleTextures();

    this.scene.start('Menu');
  }

  private createWallTexture() {
    const texture = this.textures.createCanvas('wall', TILE_SIZE, TILE_SIZE);
   if(!texture) return;
    const ctx = texture.context;

    ctx.fillStyle = PAL.wallMid;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = PAL.wallHi;
    ctx.fillRect(1, 1, TILE_SIZE - 2, 2);
    ctx.fillRect(1, 1, 2, TILE_SIZE - 2);

    ctx.fillStyle = PAL.wallDark;
    ctx.fillRect(1, TILE_SIZE - 3, TILE_SIZE - 2, 2);
    ctx.fillRect(TILE_SIZE - 3, 1, 2, TILE_SIZE - 2);

    for (let i = 0; i < 5; i++) {
      const bx = 2 + Math.random() * (TILE_SIZE - 6);
      const by = 4 + Math.random() * (TILE_SIZE - 8);
      const bw = 3 + Math.random() * 4;
      const bh = 2 + Math.random() * 3;

      ctx.fillStyle = Math.random() > 0.5 ? PAL.wallHi : PAL.wallDark;
      ctx.fillRect(bx, by, bw, bh);
    }

    ctx.fillStyle = PAL.wallDark;
    ctx.fillRect(0, TILE_SIZE / 2 - 1, TILE_SIZE, 2);

    texture.refresh();
  }

  private createFloorTexture() {
    const texture = this.textures.createCanvas('floor', TILE_SIZE, TILE_SIZE);
     if(!texture) return;
    const ctx = texture.context;

    ctx.fillStyle = PAL.floorA;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? PAL.floorB : '#111118';

      ctx.fillRect(
        Math.random() * TILE_SIZE,
        Math.random() * TILE_SIZE,
        1 + Math.random() * 2,
        1 + Math.random() * 2,
      );
    }

    ctx.strokeStyle = '#0e0e18';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

    texture.refresh();
  }

  private createFuseTextures() {
    for (const lit of [false, true]) {
      const key = lit ? 'fuseLit' : 'fuseOff';
      const texture = this.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
       if(!texture) return;
      const ctx = texture.context;

      const cx = TILE_SIZE / 2;
      const cy = TILE_SIZE / 2;

      if (lit) {
        const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, TILE_SIZE / 2);

        glow.addColorStop(0, PAL.fuseLit);
        glow.addColorStop(0.4, PAL.fuseGlow);
        glow.addColorStop(1, 'rgba(255,170,34,0)');

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      }

      ctx.fillStyle = lit ? PAL.fuseLit : PAL.fuseOff;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = lit ? '#fff8e0' : '#332210';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      if (lit) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = lit ? PAL.gold : '#44301a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.stroke();

      texture.refresh();
    }
  }

  private createLightTextures() {
    for (const size of [200, 120, 80]) {
      const key = `light${size}`;
      const texture = this.textures.createCanvas(key, size, size);
       if(!texture) return;
      const ctx = texture.context;

      const radius = size / 2;
      const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);

      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.3, 'rgba(255,255,255,0.7)');
      gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      texture.refresh();
    }
  }

  private createCatTextures() {
    const directions: CatDirection[] = ['down', 'up', 'left', 'right'];

    CATS.forEach((cat, catIndex) => {
      directions.forEach((direction) => {
        for (let frame = 0; frame < 3; frame++) {
          const key = `cat_${catIndex}_${direction}_${frame}`;
          const texture = this.textures.createCanvas(key, 32, 32);
   if(!texture) return;
          drawCatOnCanvas(texture.context, cat, direction, frame);
          texture.refresh();
        }
      });

      const portraitKey = `cat_portrait_${catIndex}`;
      const portrait = this.textures.createCanvas(portraitKey, 64, 64);
      if(!portrait) return;
      const ctx = portrait.context;

      ctx.save();
      ctx.scale(2, 2);
      drawCatOnCanvas(ctx, cat, 'down', 0);
      ctx.restore();

      portrait.refresh();
    });
  }

  private createParticleTextures() {
    const particle = this.textures.createCanvas('particle', 8, 8);
    if(!particle) return;
    const particleCtx = particle.context;

    const particleGradient = particleCtx.createRadialGradient(4, 4, 0, 4, 4, 4);
    particleGradient.addColorStop(0, 'rgba(255,220,120,0.8)');
    particleGradient.addColorStop(1, 'rgba(255,220,120,0)');

    particleCtx.fillStyle = particleGradient;
    particleCtx.fillRect(0, 0, 8, 8);

    particle.refresh();

    const dust = this.textures.createCanvas('dust', 4, 4);
    if(!dust) return;
    const dustCtx = dust.context;

    const dustGradient = dustCtx.createRadialGradient(2, 2, 0, 2, 2, 2);
    dustGradient.addColorStop(0, 'rgba(180,170,200,0.3)');
    dustGradient.addColorStop(1, 'rgba(180,170,200,0)');

    dustCtx.fillStyle = dustGradient;
    dustCtx.fillRect(0, 0, 4, 4);

    dust.refresh();
  }
}