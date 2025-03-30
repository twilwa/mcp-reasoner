import { BeamSearchStrategy } from './beam-search.js';
import { MonteCarloTreeSearchStrategy } from './mcts.js';
import { AStarSearchStrategy } from './a-star.js';
import { ConstraintSatisfactionStrategy } from './constraint-satisfaction.js';
import { HybridStrategy } from './hybrid.js';
import { ReasoningStrategy } from '../types.js';
// Function to create a strategy based on type
export function createStrategy(type, stateManager) {
    switch (type) {
        case ReasoningStrategy.BEAM_SEARCH:
            return new BeamSearchStrategy(stateManager);
        case ReasoningStrategy.MCTS:
            return new MonteCarloTreeSearchStrategy(stateManager);
        case ReasoningStrategy.A_STAR:
            return new AStarSearchStrategy(stateManager);
        case ReasoningStrategy.CONSTRAINT_SATISFACTION:
            return new ConstraintSatisfactionStrategy(stateManager);
        case ReasoningStrategy.HYBRID:
            return new HybridStrategy(stateManager);
        default:
            throw new Error(`Unknown strategy type: ${type}`);
    }
}
// Re-export ReasoningStrategy from types.js for backwards compatibility
export { ReasoningStrategy } from '../types.js';
