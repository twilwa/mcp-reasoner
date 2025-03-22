import { v4 as uuidv4 } from 'uuid';
import { ThoughtNode, ReasoningRequest, ReasoningResponse, CONFIG } from '../types.js';
import { BaseStrategy } from './base.js';

export class AStarSearchStrategy extends BaseStrategy {
  private openSet: Map<string, ThoughtNode>;
  private closedSet: Map<string, ThoughtNode>;
  
  constructor(stateManager: any) {
    super(stateManager);
    this.openSet = new Map();
    this.closedSet = new Map();
  }
  
  public async processThought(request: ReasoningRequest): Promise<ReasoningResponse> {
    const nodeId = uuidv4();
    const parentNode = request.parentId ? 
      await this.getNode(request.parentId) : undefined;
      
    // Create node with A* specific properties
    const node: ThoughtNode = {
      id: nodeId,
      thought: request.thought,
      depth: request.thoughtNumber - 1,
      score: 0,
      children: [],
      parentId: request.parentId,
      isComplete: !request.nextThoughtNeeded,
      evaluations: request.evaluations || {},
      heuristicValue: 0 // Will be calculated
    };
    
    // Evaluate and score the node
    node.score = this.evaluateThought(node, parentNode);
    
    // Calculate heuristic value (estimated cost to goal)
    node.heuristicValue = this._calculateHeuristic(node, request);
    
    await this.saveNode(node);
    
    // Update parent if exists
    if (parentNode) {
      parentNode.children.push(node.id);
      await this.saveNode(parentNode);
    }
    
    // A* specific logic
    this.openSet.set(node.id, node);
    
    // Process A* search step
    await this._processAStarStep();
    
    // Prepare response with A* specific data
    const currentPath = await this.stateManager.getPath(nodeId);
    const pathScore = currentPath.reduce((acc, n) => acc + n.score, 0);
    
    return {
      nodeId: node.id,
      thought: node.thought,
      score: node.score,
      depth: node.depth,
      isComplete: node.isComplete,
      nextThoughtNeeded: request.nextThoughtNeeded,
      openSetSize: this.openSet.size,
      closedSetSize: this.closedSet.size,
      estimatedDistanceToGoal: node.heuristicValue,
      totalCost: pathScore + (node.heuristicValue || 0), // f(n) = g(n) + h(n)
      bestScore: Math.max(...Array.from(this.openSet.values()).map(n => n.score))
    };
  }
  
  private async _processAStarStep(): Promise<void> {
    if (this.openSet.size === 0) return;
    
    // Find the node with the lowest f(n) = g(n) + h(n)
    let currentNode: ThoughtNode | null = null;
    let lowestF = Infinity;
    
    for (const node of this.openSet.values()) {
      const gScore = (await this.stateManager.getPath(node.id)).reduce((acc, n) => acc + n.score, 0);
      const fScore = gScore + (node.heuristicValue || 0);
      
      if (fScore < lowestF) {
        lowestF = fScore;
        currentNode = node;
      }
    }
    
    if (!currentNode) return;
    
    // Move current node from open to closed set
    this.openSet.delete(currentNode.id);
    this.closedSet.set(currentNode.id, currentNode);
    
    // If node is complete, we're done with this branch
    if (currentNode.isComplete) return;
    
    // Otherwise, we would expand neighbors in a full A* implementation
    // This is a simplified version as the full expansion would be handled
    // through user interactions in the MCP context
  }
  
  private _calculateHeuristic(node: ThoughtNode, request: ReasoningRequest): number {
    // This is a placeholder for a real heuristic function
    // In a game dev context, this could estimate distance to a complete solution
    // based on how many requirements are satisfied, etc.
    
    // For UI design problems, this might be based on usability metrics
    // For mechanics design, this might be based on player experience goals
    
    // A simple implementation - further from completion = higher heuristic value
    const totalSteps = request.totalThoughts || 10;
    const remainingSteps = totalSteps - node.depth;
    
    // Scale by node quality - better nodes likely need fewer additional steps
    const qualityFactor = 1 - (node.score / 10); // Assuming score is 0-10
    
    return remainingSteps * qualityFactor;
  }
  
  public async getBestPath(): Promise<ThoughtNode[]> {
    // In A*, the best path is typically to the goal node with lowest f-score
    // In our case, we'll return the path to the highest-scoring complete node
    
    let bestNode: ThoughtNode | null = null;
    let highestScore = -Infinity;
    
    // Check both open and closed sets
    for (const node of [...this.openSet.values(), ...this.closedSet.values()]) {
      if (node.isComplete && node.score > highestScore) {
        highestScore = node.score;
        bestNode = node;
      }
    }
    
    if (bestNode) {
      return this.stateManager.getPath(bestNode.id);
    }
    
    // Fallback: return the path to the node with the best f-score
    const allNodes = [...this.openSet.values(), ...this.closedSet.values()];
    if (allNodes.length === 0) return [];
    
    const nodeFScores = await Promise.all(
      allNodes.map(async node => {
        const path = await this.stateManager.getPath(node.id);
        const gScore = path.reduce((acc, n) => acc + n.score, 0);
        const fScore = gScore + (node.heuristicValue || 0);
        return { node, fScore };
      })
    );
    
    const bestFScore = nodeFScores.reduce(
      (best, current) => current.fScore < best.fScore ? current : best,
      { node: allNodes[0], fScore: Infinity }
    );
    
    return this.stateManager.getPath(bestFScore.node.id);
  }
  
  public async getMetrics(): Promise<any> {
    const baseMetrics = await super.getMetrics();
    return {
      ...baseMetrics,
      openSetSize: this.openSet.size,
      closedSetSize: this.closedSet.size,
      averageHeuristicValue: Array.from(this.openSet.values())
        .reduce((sum, node) => sum + (node.heuristicValue || 0), 0) / Math.max(1, this.openSet.size)
    };
  }
  
  public async clear(): Promise<void> {
    await super.clear();
    this.openSet.clear();
    this.closedSet.clear();
  }
} 