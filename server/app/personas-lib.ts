import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const PERSONAS_DIR = path.resolve(process.cwd(), "../personas");

export interface ServerPersonaPackage {
  id: string;
  name: string;
  description?: string;
  tagline?: string;
  author?: string;
  systemPrompt: string;
  defaultEmotion?: string;
  welcomeDialog?: Array<{ emotion: string; text: string }>;
  emotions: Array<{ code: string; name: string; asset: string; criteria: string }>;
  assets: Record<string, string>;
  themeCss?: string;
}

export async function readPersonaPackage(id: string): Promise<ServerPersonaPackage | null> {
  const personaDir = path.join(PERSONAS_DIR, id);
  try {
    const manifestRaw = await readFile(path.join(personaDir, "persona.json"), "utf-8");
    const manifest = JSON.parse(manifestRaw) as {
      id: string;
      name: string;
      description?: string;
      tagline?: string;
      author?: string;
      systemPrompt: string;
      default_emotion?: string;
      welcome_dialog?: Array<{ emotion: string; text: string }>;
    };

    const criteriaRaw = await readFile(path.join(personaDir, "emotions/emotions_criteria.json"), "utf-8");
    const criteria = JSON.parse(criteriaRaw) as {
      emotions: Array<{ code: string; name: string; asset: string; criteria: string }>;
    };

    const assets: Record<string, string> = {};
    const emotionsDir = path.join(personaDir, "emotions");
    const files = await readdir(emotionsDir);
    for (const file of files) {
      if (file.endsWith(".json")) continue;
      const ext = path.extname(file).slice(1);
      const mime = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "application/octet-stream";
      const buffer = await readFile(path.join(emotionsDir, file));
      assets[`emotions/${file}`] = `data:${mime};base64,${buffer.toString("base64")}`;
    }

    let themeCss: string | undefined;
    try {
      themeCss = await readFile(path.join(personaDir, "theme.css"), "utf-8");
    } catch {
      // optional
    }

    return {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      tagline: manifest.tagline,
      author: manifest.author,
      systemPrompt: manifest.systemPrompt,
      defaultEmotion: manifest.default_emotion,
      welcomeDialog: manifest.welcome_dialog,
      emotions: criteria.emotions,
      assets,
      themeCss,
    };
  } catch {
    return null;
  }
}

export async function listPersonaIds(): Promise<string[]> {
  try {
    const dirs = await readdir(PERSONAS_DIR, { withFileTypes: true });
    const ids: string[] = [];
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      try {
        await readFile(path.join(PERSONAS_DIR, d.name, "persona.json"), "utf-8");
        ids.push(d.name);
      } catch {
        // skip invalid
      }
    }
    return ids;
  } catch {
    return [];
  }
}
