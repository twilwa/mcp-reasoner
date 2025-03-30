export interface ThoughtNode {
  id: string;
  thought: string;
  score: number;
  depth: number;
  children: string[];  // Store child IDs
  parentId?: string;   // Store parent ID
  isComplete: boolean;
  evaluations?: Record<string, number>; // Store evaluation scores
  simulationResults?: Record<string, unknown>;  // For MCTS: store simulation results
  heuristicValue?: number;            // For A*: store heuristic value
  constraints?: Record<string, unknown>;  // For CSP: store constraints
}

export interface ReasoningRequest {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  parentId?: string;   // For branching thoughts
  strategyType?: string; // Strategy to use for reasoning
  branchingFactor?: number; // Override default branching factor
  evaluations?: Record<string, number>; // Evaluation metrics
  evaluationMetrics?: string[]; // Metrics for scoring solutions
  constraints?: Record<string, unknown>; // Constraints for CSP
}

export interface ReasoningResponse {
  nodeId: string;
  thought: string;
  score: number;
  depth: number;
  isComplete: boolean;
  nextThoughtNeeded: boolean;
  possiblePaths?: number;
  bestScore?: number;
  strategyUsed?: string;
  openSetSize?: number; // For A*
  closedSetSize?: number; // For A*
  estimatedDistanceToGoal?: number; // For A*
  totalCost?: number; // For A*
  constraintsSatisfied?: boolean; // For CSP
  unassignedVariables?: string[]; // For CSP
  currentAssignments?: Record<string, unknown>; // For CSP
  activeStrategy?: string; // For Hybrid
  availableStrategies?: string[]; // For Hybrid
  hybridInfo?: Record<string, number>; // For Hybrid
  recommendedNextSteps?: string[]; // Game dev specific
  problemType?: string; // Game dev specific
  gameDevMetrics?: Record<string, unknown>; // Game dev specific
}

export interface ReasoningStats {
  totalNodes: number;
  averageScore: number;
  maxDepth: number;
  branchingFactor: number;
  strategyMetrics?: Record<string, unknown>;
}

export enum ReasoningStrategy {
  BEAM_SEARCH = "beam_search",
  MCTS = "mcts",
  A_STAR = "a_star",               // Add A* search
  CONSTRAINT_SATISFACTION = "csp", // Add constraint satisfaction
  HYBRID = "hybrid"                // Add hybrid approach
}

// Add game development specific configuration
export interface GameDevConfig {
  problemType: string;        // mechanics, systems, procedural, ai, ui, visual
  branchingFactor: number;    // How many alternatives to explore at each step
  explorationDepth: number;   // How deep to explore each branch
  evaluationMetrics: string[]; // Metrics for scoring solutions
  godotIntegration: boolean;  // Enable Godot-specific features
  blenderIntegration: boolean; // Enable Blender-specific features
  imageGeneration: boolean;   // Enable image generation support
}

// Add new request type for game development
export interface GameDevReasoningRequest extends ReasoningRequest {
  problemType: string;
  godotConfig?: Record<string, unknown>;
  blenderConfig?: Record<string, unknown>;
  imageGenConfig?: Record<string, unknown>;
  evaluationMetrics?: string[];
  inContextExamples?: ThoughtNode[]; // Support for AoT in-context examples
}

export const CONFIG = {
  beamWidth: 3,     // Keep top 3 paths
  maxDepth: 5,      // Reasonable depth limit
  minScore: 0.5,    // Threshold for path viability
  temperature: 0.7, // For thought diversity
  cacheSize: 1000,  // LRU cache size
  defaultStrategy: 'beam_search', // Default reasoning strategy
  gameDevDefaults: {
    mechanics: {
      strategy: ReasoningStrategy.BEAM_SEARCH,
      branchingFactor: 3,
      explorationDepth: 3,
      evaluationMetrics: ["extensibility", "complexity", "balance"]
    },
    systems: {
      strategy: ReasoningStrategy.CONSTRAINT_SATISFACTION,
      branchingFactor: 3,
      explorationDepth: 2,
      evaluationMetrics: ["coupling", "cohesion", "performance"]
    },
    procedural: {
      strategy: ReasoningStrategy.MCTS,
      branchingFactor: 4,
      explorationDepth: 3,
      evaluationMetrics: ["variety", "playability", "consistency"]
    },
    ai: {
      strategy: ReasoningStrategy.MCTS,
      branchingFactor: 4,
      explorationDepth: 3,
      evaluationMetrics: ["strategic", "feasibility", "performance"]
    },
    ui: {
      strategy: ReasoningStrategy.A_STAR,
      branchingFactor: 3,
      explorationDepth: 2,
      evaluationMetrics: ["usability", "clarity", "aesthetics"]
    },
    visual: {
      strategy: ReasoningStrategy.BEAM_SEARCH,
      branchingFactor: 2,
      explorationDepth: 3,
      evaluationMetrics: ["quality", "performance", "style"]
    }
  }
} as const;
