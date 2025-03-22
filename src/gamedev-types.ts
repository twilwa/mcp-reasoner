// Godot Integration Types
export interface GodotNodeStructure {
  type: string;
  name: string;
  properties: Record<string, unknown>;
  children: GodotNodeStructure[];
}

export interface GodotScriptData {
  path: string;
  className?: string;
  extends: string;
  content: string;
}

export interface GodotResourceData {
  path: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GodotConfig {
  projectPath?: string;
  targetVersion?: string;
  useTypeScript?: boolean;
  optimizeFor?: "2d" | "3d" | "both";
  nodeStructure?: GodotNodeStructure;
  scripts?: GodotScriptData[];
  resources?: GodotResourceData[];
}

// Blender Integration Types
export interface BlenderObjectData {
  name: string;
  type: string;
  meshData?: unknown;
  materialData?: unknown;
  transform?: unknown;
}

export interface BlenderMaterialData {
  name: string;
  properties: Record<string, unknown>;
  nodes?: unknown[]; // For node-based materials
}

export interface BlenderConfig {
  objectStructure?: BlenderObjectData[];
  materials?: BlenderMaterialData[];
  optimizeFor?: "game" | "rendering";
  targetFormat?: "gltf" | "fbx" | "obj";
  animationData?: unknown;
}

// Image Generation Types
export interface ImageGenPrompt {
  text: string;
  styleParams?: Record<string, unknown>;
  negativePrompt?: string;
}

export interface ImageGenConfig {
  prompts: ImageGenPrompt[];
  targetSize?: { width: number, height: number };
  batchSize?: number;
  iterations?: number;
  seed?: number;
}

// Problem Type Definitions
export interface MechanicsProblem {
  type: "mechanics";
  mechanic: string;
  designGoals: string[];
  constraints: string[];
  playerExperience: string[];
}

export interface SystemsProblem {
  type: "systems";
  system: string;
  interactionSystems: string[];
  performance: {
    memory: string;
    cpu: string;
  };
  scale: string;
}

export interface AIProblem {
  type: "ai";
  aiType: string;
  behaviorGoals: string[];
  performanceConstraints: string;
  adaptability: string;
}

export interface UIProblem {
  type: "ui";
  uiComponent: string;
  userFlow: string[];
  accessibility: string[];
  aestheticGoals: string[];
}

export interface ProceduralProblem {
  type: "procedural";
  contentType: string;
  variety: string;
  constraints: string[];
  aestheticGoals: string[];
}

export interface VisualProblem {
  type: "visual";
  assetType: string;
  styleGuide: string;
  technicalConstraints: string[];
  pipelineGoals: string[];
}

export type GameDevProblem = 
  MechanicsProblem | 
  SystemsProblem | 
  AIProblem | 
  UIProblem | 
  ProceduralProblem | 
  VisualProblem; 