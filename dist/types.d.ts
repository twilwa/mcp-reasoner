export interface ThoughtNode {
    id: string;
    thought: string;
    score: number;
    depth: number;
    children: string[];
    parentId?: string;
    isComplete: boolean;
    evaluations?: Record<string, number>;
    simulationResults?: Record<string, unknown>;
    heuristicValue?: number;
    constraints?: Record<string, unknown>;
}
export interface ReasoningRequest {
    thought: string;
    thoughtNumber: number;
    totalThoughts: number;
    nextThoughtNeeded: boolean;
    parentId?: string;
    strategyType?: string;
    branchingFactor?: number;
    evaluations?: Record<string, number>;
    evaluationMetrics?: string[];
    constraints?: Record<string, unknown>;
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
    openSetSize?: number;
    closedSetSize?: number;
    estimatedDistanceToGoal?: number;
    totalCost?: number;
    constraintsSatisfied?: boolean;
    unassignedVariables?: string[];
    currentAssignments?: Record<string, unknown>;
    activeStrategy?: string;
    availableStrategies?: string[];
    hybridInfo?: Record<string, number>;
    recommendedNextSteps?: string[];
    problemType?: string;
    gameDevMetrics?: Record<string, unknown>;
}
export interface ReasoningStats {
    totalNodes: number;
    averageScore: number;
    maxDepth: number;
    branchingFactor: number;
    strategyMetrics?: Record<string, unknown>;
}
export declare enum ReasoningStrategy {
    BEAM_SEARCH = "beam_search",
    MCTS = "mcts",
    A_STAR = "a_star",// Add A* search
    CONSTRAINT_SATISFACTION = "csp",// Add constraint satisfaction
    HYBRID = "hybrid"
}
export interface GameDevConfig {
    problemType: string;
    branchingFactor: number;
    explorationDepth: number;
    evaluationMetrics: string[];
    godotIntegration: boolean;
    blenderIntegration: boolean;
    imageGeneration: boolean;
}
export interface GameDevReasoningRequest extends ReasoningRequest {
    problemType: string;
    godotConfig?: Record<string, unknown>;
    blenderConfig?: Record<string, unknown>;
    imageGenConfig?: Record<string, unknown>;
    evaluationMetrics?: string[];
    inContextExamples?: ThoughtNode[];
}
export declare const CONFIG: {
    readonly beamWidth: 3;
    readonly maxDepth: 5;
    readonly minScore: 0.5;
    readonly temperature: 0.7;
    readonly cacheSize: 1000;
    readonly defaultStrategy: "beam_search";
    readonly gameDevDefaults: {
        readonly mechanics: {
            readonly strategy: ReasoningStrategy.BEAM_SEARCH;
            readonly branchingFactor: 3;
            readonly explorationDepth: 3;
            readonly evaluationMetrics: readonly ["extensibility", "complexity", "balance"];
        };
        readonly systems: {
            readonly strategy: ReasoningStrategy.CONSTRAINT_SATISFACTION;
            readonly branchingFactor: 3;
            readonly explorationDepth: 2;
            readonly evaluationMetrics: readonly ["coupling", "cohesion", "performance"];
        };
        readonly procedural: {
            readonly strategy: ReasoningStrategy.MCTS;
            readonly branchingFactor: 4;
            readonly explorationDepth: 3;
            readonly evaluationMetrics: readonly ["variety", "playability", "consistency"];
        };
        readonly ai: {
            readonly strategy: ReasoningStrategy.MCTS;
            readonly branchingFactor: 4;
            readonly explorationDepth: 3;
            readonly evaluationMetrics: readonly ["strategic", "feasibility", "performance"];
        };
        readonly ui: {
            readonly strategy: ReasoningStrategy.A_STAR;
            readonly branchingFactor: 3;
            readonly explorationDepth: 2;
            readonly evaluationMetrics: readonly ["usability", "clarity", "aesthetics"];
        };
        readonly visual: {
            readonly strategy: ReasoningStrategy.BEAM_SEARCH;
            readonly branchingFactor: 2;
            readonly explorationDepth: 3;
            readonly evaluationMetrics: readonly ["quality", "performance", "style"];
        };
    };
};
