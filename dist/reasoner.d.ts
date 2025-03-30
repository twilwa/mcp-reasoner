import { ThoughtNode, ReasoningRequest, ReasoningResponse, ReasoningStats, ReasoningStrategy } from './types.js';
export declare class Reasoner {
    private stateManager;
    private currentStrategy;
    private strategies;
    private inContextExamples;
    constructor();
    processThought(request: ReasoningRequest): Promise<ReasoningResponse>;
    private _processGameDevRequest;
    private _getDefaultConfigForProblemType;
    private _isGameDevRequest;
    private _generateNextSteps;
    private _calculateProblemTypeAlignment;
    private _loadInContextExamples;
    getStats(): Promise<ReasoningStats>;
    private getStrategyMetrics;
    getCurrentStrategyName(): ReasoningStrategy;
    getBestPath(): Promise<ThoughtNode[]>;
    clear(): Promise<void>;
    setStrategy(strategyType: ReasoningStrategy): void;
    getAvailableStrategies(): ReasoningStrategy[];
}
