import { ThoughtNode, ReasoningRequest, ReasoningResponse, ReasoningStats, CONFIG, GameDevReasoningRequest, ReasoningStrategy } from './types.js';
import { StateManager } from './state.js';
import { createStrategy } from './strategies/factory.js';
import type { BaseStrategy, StrategyMetrics } from './strategies/base.js';

export class Reasoner {
  private stateManager: StateManager;
  private currentStrategy: BaseStrategy;
  private strategies: Map<ReasoningStrategy, BaseStrategy>;
  private inContextExamples: Map<string, ThoughtNode[]>; // Store AoT examples by problem type

  constructor() {
    this.stateManager = new StateManager(CONFIG.cacheSize);
    this.inContextExamples = new Map();
    
    // Initialize available strategies
    this.strategies = new Map();
    this.strategies.set(
      ReasoningStrategy.BEAM_SEARCH,
      createStrategy(ReasoningStrategy.BEAM_SEARCH, this.stateManager)
    );
    this.strategies.set(
      ReasoningStrategy.MCTS,
      createStrategy(ReasoningStrategy.MCTS, this.stateManager)
    );
    this.strategies.set(
      ReasoningStrategy.A_STAR,
      createStrategy(ReasoningStrategy.A_STAR, this.stateManager)
    );
    this.strategies.set(
      ReasoningStrategy.CONSTRAINT_SATISFACTION,
      createStrategy(ReasoningStrategy.CONSTRAINT_SATISFACTION, this.stateManager)
    );
    this.strategies.set(
      ReasoningStrategy.HYBRID,
      createStrategy(ReasoningStrategy.HYBRID, this.stateManager)
    );

    // Set default strategy
    const defaultStrategy = CONFIG.defaultStrategy as ReasoningStrategy;
    const defaultStrategyImpl = this.strategies.get(defaultStrategy);
    this.currentStrategy = defaultStrategyImpl || this.strategies.get(ReasoningStrategy.BEAM_SEARCH) as BaseStrategy;
      
    // Initialize example templates
    this._loadInContextExamples();
  }

  public async processThought(request: ReasoningRequest): Promise<ReasoningResponse> {
    // Process game development specific requests
    if (this._isGameDevRequest(request)) {
      return this._processGameDevRequest(request as GameDevReasoningRequest);
    }
    
    // Switch strategy if requested
    if (request.strategyType && this.strategies.has(request.strategyType as ReasoningStrategy)) {
      const strategy = this.strategies.get(request.strategyType as ReasoningStrategy);
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
  
  private async _processGameDevRequest(request: GameDevReasoningRequest): Promise<ReasoningResponse> {
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
        problemTypeAlignment: this._calculateProblemTypeAlignment(problemType, this.getCurrentStrategyName() as string)
      }
    };
  }
  
  private _getDefaultConfigForProblemType(problemType: string) {
    // Safe access to the config using known keys
    const knownTypes = ['mechanics', 'systems', 'procedural', 'ai', 'ui', 'visual'] as const;
    const validType = knownTypes.includes(problemType as any) ? 
      problemType : 'mechanics';
    
    return CONFIG.gameDevDefaults[validType as keyof typeof CONFIG.gameDevDefaults];
  }
  
  private _isGameDevRequest(request: ReasoningRequest): boolean {
    return 'problemType' in request;
  }
  
  private _generateNextSteps(response: ReasoningResponse, request: GameDevReasoningRequest): string[] {
    // Generate recommended next steps based on the current state and problem type
    const nextSteps: string[] = [];
    
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
  
  private _calculateProblemTypeAlignment(problemType: string, strategy: string): number {
    // Calculate how well the current strategy aligns with the problem type
    // 0-1 scale, higher is better
    
    const alignmentMap: Record<string, Record<string, number>> = {
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
  
  private _loadInContextExamples(): void {
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

  public async getStats(): Promise<ReasoningStats> {
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

  private async getStrategyMetrics(): Promise<Record<string, StrategyMetrics>> {
    const metrics: Record<string, StrategyMetrics> = {};
    
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

  public getCurrentStrategyName(): ReasoningStrategy {
    for (const [name, strategy] of this.strategies.entries()) {
      if (strategy === this.currentStrategy) {
        return name;
      }
    }
    return ReasoningStrategy.BEAM_SEARCH;
  }

  public async getBestPath(): Promise<ThoughtNode[]> {
    return this.currentStrategy.getBestPath();
  }

  public async clear(): Promise<void> {
    await this.stateManager.clear();
    // Clear all strategies
    for (const strategy of this.strategies.values()) {
      await strategy.clear();
    }
  }

  public setStrategy(strategyType: ReasoningStrategy): void {
    if (!this.strategies.has(strategyType)) {
      throw new Error(`Unknown strategy type: ${strategyType}`);
    }
    const strategy = this.strategies.get(strategyType);
    if (strategy) {
      this.currentStrategy = strategy;
    }
  }

  public getAvailableStrategies(): ReasoningStrategy[] {
    return Array.from(this.strategies.keys());
  }
}
