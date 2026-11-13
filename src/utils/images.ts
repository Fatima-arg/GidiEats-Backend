import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';

const PALETTE = [
  '#f97316', '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#facc15',
  '#22c55e', '#6366f1', '#fb923c', '#0ea5e9', '#d946ef'
];

const colorFor = (seed: string) => {
  const hash = crypto.createHash('md5').update(seed).digest();
  return PALETTE[hash[0] % PALETTE.length];
};

const initials = (name: string) => {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? '').join('');
};

export const generateSvg = (name: string, label?: string): string => {
  const bg = colorFor(name);
  const text = label ?? initials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="${bg}"/>
  <rect x="35" y="35" width="530" height="330" rx="18" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="6"/>
  <text x="300" y="215" font-family="Helvetica, Arial, sans-serif" font-size="110" font-weight="bold" fill="rgba(255,255,255,0.95)" text-anchor="middle" dominant-baseline="middle">${text}</text>
  <text x="300" y="305" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.85)" text-anchor="middle">GidiEats</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

export const writePlaceholder = (dir: string, name: string): string => {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const filename = `${safe}.svg`;
  const filePath = path.join(dir, filename);
  const bg = colorFor(name);
  const text = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'FD';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="${bg}"/>
  <rect x="35" y="35" width="530" height="330" rx="18" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="6"/>
  <text x="300" y="215" font-family="Helvetica, Arial, sans-serif" font-size="110" font-weight="bold" fill="rgba(255,255,255,0.95)" text-anchor="middle" dominant-baseline="middle">${text}</text>
  <text x="300" y="305" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.85)" text-anchor="middle">${name}</text>
</svg>`;
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, svg, 'utf8');
  }
  return `/uploads/${filename}`;
};

export const ensureImageDir = () => {
  const dir = path.resolve(process.cwd(), env.uploadDir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};