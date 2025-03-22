export var ReasoningStrategy;
(function (ReasoningStrategy) {
    ReasoningStrategy["BEAM_SEARCH"] = "beam_search";
    ReasoningStrategy["MCTS"] = "mcts";
    ReasoningStrategy["A_STAR"] = "a_star";
    ReasoningStrategy["CONSTRAINT_SATISFACTION"] = "csp";
    ReasoningStrategy["HYBRID"] = "hybrid"; // Add hybrid approach
})(ReasoningStrategy || (ReasoningStrategy = {}));
export const CONFIG = {
    beamWidth: 3, // Keep top 3 paths
    maxDepth: 5, // Reasonable depth limit
    minScore: 0.5, // Threshold for path viability
    temperature: 0.7, // For thought diversity
    cacheSize: 1000, // LRU cache size
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
};
