import { CONFIG, ReasoningStrategy } from './types.js';
import { StateManager } from './state.js';
import { createStrategy } from './strategies/factory.js';
export class Reasoner {
    constructor() {
        this.stateManager = new StateManager(CONFIG.cacheSize);
        this.inContextExamples = new Map();
        // Initialize available strategies
        this.strategies = new Map();
        this.strategies.set(ReasoningStrategy.BEAM_SEARCH, createStrategy(ReasoningStrategy.BEAM_SEARCH, this.stateManager));
        this.strategies.set(ReasoningStrategy.MCTS, createStrategy(ReasoningStrategy.MCTS, this.stateManager));
        this.strategies.set(ReasoningStrategy.A_STAR, createStrategy(ReasoningStrategy.A_STAR, this.stateManager));
        this.strategies.set(ReasoningStrategy.CONSTRAINT_SATISFACTION, createStrategy(ReasoningStrategy.CONSTRAINT_SATISFACTION, this.stateManager));
        this.strategies.set(ReasoningStrategy.HYBRID, createStrategy(ReasoningStrategy.HYBRID, this.stateManager));
        // Set default strategy
        const defaultStrategy = CONFIG.defaultStrategy;
        const defaultStrategyImpl = this.strategies.get(defaultStrategy);
        this.currentStrategy = defaultStrategyImpl || this.strategies.get(ReasoningStrategy.BEAM_SEARCH);
        // Initialize example templates
        this._loadInContextExamples();
    }
    async processThought(request) {
        // Process game development specific requests
        if (this._isGameDevRequest(request)) {
            return this._processGameDevRequest(request);
        }
        // Switch strategy if requested
        if (request.strategyType && this.strategies.has(request.strategyType)) {
            const strategy = this.strategies.get(request.strategyType);
            if (strategy) {
                this.currentStrategy = strategy;
            }
        }
        // Process thought using current strategy
        const response = await this.currentStrategy.processThought(request);
        // Add strategy information to response
        return {
            ...response,
            strategyUsed: this.getCurrentStrategyName()
        };
    }
    async _processGameDevRequest(request) {
        // Apply game development specific configurations
        const problemType = request.problemType || 'mechanics';
        // Get default configuration for this problem type
        const defaultConfig = this._getDefaultConfigForProblemType(problemType);
        // Set appropriate strategy based on problem type if not explicitly specified
        if (!request.strategyType && defaultConfig) {
            request.strategyType = defaultConfig.strategy;
            const strategy = this.strategies.get(defaultConfig.strategy);
            if (strategy) {
                this.currentStrategy = strategy;
            }
        }
        // Apply default branching factor and exploration depth if not specified
        if (!request.branchingFactor && defaultConfig) {
            request.branchingFactor = defaultConfig.branchingFactor;
        }
        if (!request.evaluationMetrics && defaultConfig) {
            // Convert readonly array to regular array
            request.evaluationMetrics = [...defaultConfig.evaluationMetrics];
        }
        // Attach in-context examples if available and not already provided
        if (!request.inContextExamples && this.inContextExamples.has(problemType)) {
            request.inContextExamples = this.inContextExamples.get(problemType);
        }
        // Process with the selected strategy
        const response = await this.currentStrategy.processThought(request);
        // Add game development specific information
        return {
            ...response,
            strategyUsed: this.getCurrentStrategyName(),
            problemType: problemType,
            recommendedNextSteps: this._generateNextSteps(response, request),
            gameDevMetrics: {
                branchingFactor: request.branchingFactor,
                evaluationMetrics: request.evaluationMetrics,
                problemTypeAlignment: this._calculateProblemTypeAlignment(problemType, this.getCurrentStrategyName())
            }
        };
    }
    _getDefaultConfigForProblemType(problemType) {
        // Safe access to the config using known keys
        const knownTypes = ['mechanics', 'systems', 'procedural', 'ai', 'ui', 'visual'];
        const validType = knownTypes.includes(problemType) ?
            problemType : 'mechanics';
        return CONFIG.gameDevDefaults[validType];
    }
    _isGameDevRequest(request) {
        return 'problemType' in request;
    }
    _generateNextSteps(response, request) {
        // Generate recommended next steps based on the current state and problem type
        const nextSteps = [];
        // If incomplete, suggest continuing exploration
        if (!response.isComplete) {
            nextSteps.push("Continue exploration of the current solution path");
        }
        // If score is low, suggest alternative approaches
        if (response.score < 5) {
            nextSteps.push("Consider alternative approaches to improve solution quality");
        }
        // Problem-type specific suggestions
        switch (request.problemType) {
            case 'mechanics':
                nextSteps.push("Validate the mechanics against design goals");
                nextSteps.push("Create a prototype to test the solution");
                break;
            case 'systems':
                nextSteps.push("Check system coupling and cohesion");
                nextSteps.push("Evaluate performance implications");
                break;
            case 'ai':
                nextSteps.push("Run simulations to evaluate AI behavior");
                nextSteps.push("Test edge cases and failure modes");
                break;
            case 'ui':
                nextSteps.push("Create wireframes or mockups of the proposed UI");
                nextSteps.push("Conduct usability testing");
                break;
            case 'procedural':
                nextSteps.push("Generate sample content to evaluate quality");
                nextSteps.push("Analyze content variety and consistency");
                break;
            case 'visual':
                nextSteps.push("Create asset prototypes to validate pipeline");
                nextSteps.push("Test performance on target platforms");
                break;
        }
        return nextSteps;
    }
    _calculateProblemTypeAlignment(problemType, strategy) {
        // Calculate how well the current strategy aligns with the problem type
        // 0-1 scale, higher is better
        const alignmentMap = {
            'mechanics': {
                [ReasoningStrategy.BEAM_SEARCH]: 0.9,
                [ReasoningStrategy.MCTS]: 0.6,
                [ReasoningStrategy.A_STAR]: 0.7,
                [ReasoningStrategy.CONSTRAINT_SATISFACTION]: 0.5,
                [ReasoningStrategy.HYBRID]: 0.8
            },
            'systems': {
                [ReasoningStrategy.BEAM_SEARCH]: 0.7,
                [ReasoningStrategy.MCTS]: 0.5,
                [ReasoningStrategy.A_STAR]: 0.6,
                [ReasoningStrategy.CONSTRAINT_SATISFACTION]: 0.9,
                [ReasoningStrategy.HYBRID]: 0.8
            },
            'ai': {
                [ReasoningStrategy.BEAM_SEARCH]: 0.5,
                [ReasoningStrategy.MCTS]: 0.9,
                [ReasoningStrategy.A_STAR]: 0.6,
                [ReasoningStrategy.CONSTRAINT_SATISFACTION]: 0.4,
                [ReasoningStrategy.HYBRID]: 0.8
            },
            'ui': {
                [ReasoningStrategy.BEAM_SEARCH]: 0.7,
                [ReasoningStrategy.MCTS]: 0.4,
                [ReasoningStrategy.A_STAR]: 0.9,
                [ReasoningStrategy.CONSTRAINT_SATISFACTION]: 0.6,
                [ReasoningStrategy.HYBRID]: 0.7
            },
            'procedural': {
                [ReasoningStrategy.BEAM_SEARCH]: 0.5,
                [ReasoningStrategy.MCTS]: 0.9,
                [ReasoningStrategy.A_STAR]: 0.6,
                [ReasoningStrategy.CONSTRAINT_SATISFACTION]: 0.7,
                [ReasoningStrategy.HYBRID]: 0.8
            },
            'visual': {
                [ReasoningStrategy.BEAM_SEARCH]: 0.8,
                [ReasoningStrategy.MCTS]: 0.5,
                [ReasoningStrategy.A_STAR]: 0.6,
                [ReasoningStrategy.CONSTRAINT_SATISFACTION]: 0.4,
                [ReasoningStrategy.HYBRID]: 0.7
            }
        };
        return alignmentMap[problemType]?.[strategy] || 0.5;
    }
    _loadInContextExamples() {
        // Load predefined AoT examples for different problem types
        // These would be your carefully crafted examples showing how to apply each
        // algorithm to different game development problems
        // Mechanics examples (Beam Search)
        this.inContextExamples.set('mechanics', [
            {
                id: 'card-system-example',
                thought: '... detailed card system example with beam search steps ...',
                depth: 0,
                score: 9,
                children: [],
                parentId: undefined,
                isComplete: true,
                evaluations: {
                    extensibility: 9,
                    complexity: 7,
                    balance: 8
                }
            }
        ]);
        // AI examples (MCTS)
        this.inContextExamples.set('ai', [
            {
                id: 'ai-behavior-example',
                thought: '... detailed AI behavior example with MCTS simulation steps ...',
                depth: 0,
                score: 8,
                children: [],
                parentId: undefined,
                isComplete: true,
                evaluations: {
                    strategic: 9,
                    feasibility: 7,
                    performance: 8
                },
                simulationResults: {
                // MCTS simulation data would go here
                }
            }
        ]);
        // Add examples for other problem types...
    }
    async getStats() {
        const nodes = await this.stateManager.getAllNodes();
        if (nodes.length === 0) {
            return {
                totalNodes: 0,
                averageScore: 0,
                maxDepth: 0,
                branchingFactor: 0,
                strategyMetrics: {}
            };
        }
        const scores = nodes.map(n => n.score);
        const depths = nodes.map(n => n.depth);
        const branchingFactors = nodes.map(n => n.children.length);
        const metrics = await this.getStrategyMetrics();
        return {
            totalNodes: nodes.length,
            averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            maxDepth: Math.max(...depths),
            branchingFactor: branchingFactors.reduce((a, b) => a + b, 0) / nodes.length,
            strategyMetrics: metrics
        };
    }
    async getStrategyMetrics() {
        const metrics = {};
        for (const [name, strategy] of this.strategies.entries()) {
            metrics[name] = await strategy.getMetrics();
            if (strategy === this.currentStrategy) {
                metrics[name] = {
                    ...metrics[name],
                    active: true
                };
            }
        }
        return metrics;
    }
    getCurrentStrategyName() {
        for (const [name, strategy] of this.strategies.entries()) {
            if (strategy === this.currentStrategy) {
                return name;
            }
        }
        return ReasoningStrategy.BEAM_SEARCH;
    }
    async getBestPath() {
        return this.currentStrategy.getBestPath();
    }
    async clear() {
        await this.stateManager.clear();
        // Clear all strategies
        for (const strategy of this.strategies.values()) {
            await strategy.clear();
        }
    }
    setStrategy(strategyType) {
        if (!this.strategies.has(strategyType)) {
            throw new Error(`Unknown strategy type: ${strategyType}`);
        }
        const strategy = this.strategies.get(strategyType);
        if (strategy) {
            this.currentStrategy = strategy;
        }
    }
    getAvailableStrategies() {
        return Array.from(this.strategies.keys());
    }
}
