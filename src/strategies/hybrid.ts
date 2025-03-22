import { v4 as uuidv4 } from 'uuid';
import { ThoughtNode, ReasoningRequest, ReasoningResponse, ReasoningStrategy, CONFIG } from '../types.js';
import { BaseStrategy } from './base.js';
import { BeamSearchStrategy } from './beam-search.js';
import { MonteCarloTreeSearchStrategy } from './mcts.js';
import { AStarSearchStrategy } from './a-star.js';
import { ConstraintSatisfactionStrategy } from './constraint-satisfaction.js';

export class HybridStrategy extends BaseStrategy {
  private strategies: Map<ReasoningStrategy, BaseStrategy>;
  private activeStrategy: BaseStrategy;
  private strategySwitchThresholds: Record<string, number>;
  
  constructor(stateManager: any) {
    super(stateManager);
    
    // Initialize all strategies
    this.strategies = new Map();
    this.strategies.set(ReasoningStrategy.BEAM_SEARCH, new BeamSearchStrategy(stateManager));
    this.strategies.set(ReasoningStrategy.MCTS, new MonteCarloTreeSearchStrategy(stateManager));
    this.strategies.set(ReasoningStrategy.A_STAR, new AStarSearchStrategy(stateManager));
    this.strategies.set(ReasoningStrategy.CONSTRAINT_SATISFACTION, new ConstraintSatisfactionStrategy(stateManager));
    
    // Start with Beam Search by default
    this.activeStrategy = this.strategies.get(ReasoningStrategy.BEAM_SEARCH)!;
    
    // Define thresholds for switching strategies
    this.strategySwitchThresholds = {
      // Switch to MCTS when uncertain (low scores, high variance)
      uncertaintyThreshold: 0.3,
      // Switch to A* when clear goal metrics are available
      goalClarityThreshold: 0.7,
      // Switch to CSP when many constraints are present
      constraintDensityThreshold: 5
    };
  }
  
  public async processThought(request: ReasoningRequest): Promise<ReasoningResponse> {
    // First check if we should switch strategies based on the current state
    await this._evaluateStrategySwitch(request);
    
    // Delegate to active strategy
    const response = await this.activeStrategy.processThought(request);
    
    // Add hybrid-specific information
    return {
      ...response,
      activeStrategy: this._getActiveStrategyName(),
      availableStrategies: Array.from(this.strategies.keys()),
      hybridInfo: {
        uncertaintyLevel: await this._calculateUncertainty(),
        goalClarity: await this._calculateGoalClarity(request),
        constraintDensity: await this._calculateConstraintDensity(request)
      }
    };
  }
  
  private async _evaluateStrategySwitch(request: ReasoningRequest): Promise<void> {
    // Calculate metrics to decide if we should switch strategies
    const uncertainty = await this._calculateUncertainty();
    const goalClarity = await this._calculateGoalClarity(request);
    const constraintDensity = await this._calculateConstraintDensity(request);
    
    // Decision logic for switching
    if (constraintDensity >= this.strategySwitchThresholds.constraintDensityThreshold) {
      // Many constraints - use CSP
      this._switchStrategy(ReasoningStrategy.CONSTRAINT_SATISFACTION);
    }
    else if (goalClarity >= this.strategySwitchThresholds.goalClarityThreshold) {
      // Clear goal metrics - use A*
      this._switchStrategy(ReasoningStrategy.A_STAR);
    }
    else if (uncertainty >= this.strategySwitchThresholds.uncertaintyThreshold) {
      // High uncertainty - use MCTS for exploration
      this._switchStrategy(ReasoningStrategy.MCTS);
    }
    else {
      // Default to beam search for straightforward problems
      this._switchStrategy(ReasoningStrategy.BEAM_SEARCH);
    }
    
    // Also honor explicit strategy requests
    if (request.strategyType) {
      this._switchStrategy(request.strategyType as ReasoningStrategy);
    }
  }
  
  private _switchStrategy(strategy: ReasoningStrategy): void {
    if (this.strategies.has(strategy)) {
      this.activeStrategy = this.strategies.get(strategy)!;
    }
  }
  
  private async _calculateUncertainty(): Promise<number> {
    // Estimate uncertainty based on score variance in recent nodes
    const nodes = await this.stateManager.getAllNodes();
    if (nodes.length < 2) return 0.5; // Default
    
    const recentNodes = nodes.slice(-10); // Last 10 nodes
    const scores = recentNodes.map(n => n.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Calculate variance
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    
    // Normalize to 0-1
    return Math.min(1, variance / 5); // Scale factor of 5 is arbitrary
  }
  
  private async _calculateGoalClarity(request: ReasoningRequest): Promise<number> {
    // Estimate how well-defined the goal criteria are
    
    // Check if evaluation metrics are defined
    const hasMetrics = request.evaluationMetrics && request.evaluationMetrics.length > 0;
    
    // Check if total thoughts is specified
    const hasEndpoint = request.totalThoughts > 0;
    
    // Check if we have heuristic evaluation functions
    const hasHeuristics = true; // Placeholder - in real implementation, check if custom heuristics exist
    
    // Weighted sum
    let clarity = 0;
    if (hasMetrics) clarity += 0.4;
    if (hasEndpoint) clarity += 0.3;
    if (hasHeuristics) clarity += 0.3;
    
    return clarity;
  }
  
  private async _calculateConstraintDensity(request: ReasoningRequest): Promise<number> {
    // Count the number of explicit constraints
    let constraintCount = 0;
    
    // Check request for explicit constraints
    if (request.constraints) {
      constraintCount += Object.keys(request.constraints).length;
    }
    
    // Check for implicitly specified constraints in the thought
    if (request.thought) {
      // This is simplistic - a real implementation would use NLP to identify constraints
      const constraintKeywords = ['must', 'should', 'required', 'necessary', 'constraint'];
      constraintKeywords.forEach(keyword => {
        if (request.thought.toLowerCase().includes(keyword)) {
          constraintCount++;
        }
      });
    }
    
    return constraintCount;
  }
  
  private _getActiveStrategyName(): ReasoningStrategy {
    for (const [name, strategy] of this.strategies.entries()) {
      if (strategy === this.activeStrategy) {
        return name;
      }
    }
    return ReasoningStrategy.BEAM_SEARCH; // Default
  }
  
  public async getBestPath(): Promise<ThoughtNode[]> {
    // Delegate to active strategy
    return this.activeStrategy.getBestPath();
  }
  
  public async getMetrics(): Promise<any> {
    const baseMetrics = await super.getMetrics();
    const activeMetrics = await this.activeStrategy.getMetrics();
    
    return {
      ...baseMetrics,
      activeStrategy: this._getActiveStrategyName(),
      activeStrategyMetrics: activeMetrics,
      hybridMetrics: {
        uncertainty: await this._calculateUncertainty(),
        strategySwitches: 0 // Placeholder - would track switches in real implementation
      }
    };
  }
  
  public async clear(): Promise<void> {
    await super.clear();
    // Clear all strategies
    for (const strategy of this.strategies.values()) {
      await strategy.clear();
    }
  }
} 