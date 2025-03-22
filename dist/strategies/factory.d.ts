import type { StateManager } from '../state.js';
import type { BaseStrategy } from './base.js';
import { ReasoningStrategy } from '../types.js';
export declare function createStrategy(type: ReasoningStrategy, stateManager: StateManager): BaseStrategy;
export { ReasoningStrategy } from '../types.js';
