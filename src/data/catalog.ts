import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AutomobilePart } from "../types/dto.js";

const dataPath = join(process.cwd(), "automobileParts.json");
const raw = readFileSync(dataPath, "utf-8");

export const catalog: AutomobilePart[] = JSON.parse(raw) as AutomobilePart[];
