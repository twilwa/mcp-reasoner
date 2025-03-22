import { v4 as uuidv4 } from 'uuid';
import { ThoughtNode, ReasoningRequest, ReasoningResponse, CONFIG } from '../types.js';
import { BaseStrategy } from './base.js';

export class ConstraintSatisfactionStrategy extends BaseStrategy {
  private domains: Map<string, any[]>; // Variable domains
  private constraints: Map<string, Function[]>; // Constraint functions
  private assignments: Map<string, any>; // Current variable assignments
  
  constructor(stateManager: any) {
    super(stateManager);
    this.domains = new Map();
    this.constraints = new Map();
    this.assignments = new Map();
  }
  
  public async processThought(request: ReasoningRequest): Promise<ReasoningResponse> {
    const nodeId = uuidv4();
    const parentNode = request.parentId ? 
      await this.getNode(request.parentId) : undefined;
      
    // Create node with CSP specific properties
    const node: ThoughtNode = {
      id: nodeId,
      thought: request.thought,
      depth: request.thoughtNumber - 1,
      score: 0,
      children: [],
      parentId: request.parentId,
      isComplete: !request.nextThoughtNeeded,
      evaluations: request.evaluations || {},
      constraints: request.constraints || {}
    };
    
    // Evaluate and score the node
    node.score = this.evaluateThought(node, parentNode);
    await this.saveNode(node);
    
    // Update parent if exists
    if (parentNode) {
      parentNode.children.push(node.id);
      await this.saveNode(parentNode);
    }
    
    // Extract and process constraints
    if (node.constraints) {
      for (const [variable, domain] of Object.entries(node.constraints.domains || {})) {
        this.domains.set(variable, domain as any[]);
      }
      
      for (const [variable, value] of Object.entries(node.constraints.assignments || {})) {
        this.assignments.set(variable, value);
      }
      
      // Update constraints would happen here in a full implementation
    }
    
    // Check constraint satisfaction
    const constraintsSatisfied = this._checkConstraints();
    const unassignedVariables = this._getUnassignedVariables();
    
    // Prepare response with CSP specific data
    return {
      nodeId: node.id,
      thought: node.thought,
      score: node.score,
      depth: node.depth,
      isComplete: node.isComplete,
      nextThoughtNeeded: request.nextThoughtNeeded,
      constraintsSatisfied,
      unassignedVariables,
      currentAssignments: Object.fromEntries(this.assignments),
      bestScore: Math.max(node.score, parentNode?.score || 0)
    };
  }
  
  private _checkConstraints(): boolean {
    // Check if all current assignments satisfy all constraints
    // This is a simplified version
    
    for (const [variable, constraintFunctions] of this.constraints.entries()) {
      if (this.assignments.has(variable)) {
        const value = this.assignments.get(variable);
        
        for (const constraint of constraintFunctions) {
          if (!constraint(value, Object.fromEntries(this.assignments))) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  private _getUnassignedVariables(): string[] {
    // Return variables that have domains but no assignments
    const unassigned: string[] = [];
    
    for (const variable of this.domains.keys()) {
      if (!this.assignments.has(variable)) {
        unassigned.push(variable);
      }
    }
    
    return unassigned;
  }
  
  private _selectUnassignedVariable(): string | null {
    // Simple variable selection: choose the one with smallest domain
    let bestVariable: string | null = null;
    let smallestDomainSize = Number.POSITIVE_INFINITY;
    
    for (const variable of this.domains.keys()) {
      if (!this.assignments.has(variable)) {
        const domainSize = this.domains.get(variable)?.length || 0;
        if (domainSize < smallestDomainSize) {
          smallestDomainSize = domainSize;
          bestVariable = variable;
        }
      }
    }
    
    return bestVariable;
  }
  
  public async getBestPath(): Promise<ThoughtNode[]> {
    // In CSP, the best path is one that satisfies all constraints
    // while maximizing the quality of the solution
    
    // Get all nodes
    const allNodes = await this.stateManager.getAllNodes();
    
    // Filter to complete nodes that satisfy constraints
    const satisfyingNodes = allNodes.filter(node => 
      node.isComplete && node.constraints?.satisfied === true
    );
    
    if (satisfyingNodes.length === 0) {
      // No completely satisfying solution, return highest scoring node
      const bestNode = allNodes.reduce(
        (best, current) => current.score > best.score ? current : best,
        allNodes[0] || null
      );
      
      if (bestNode) {
        return this.stateManager.getPath(bestNode.id);
      }
      return [];
    }
    
    // Return the path to the highest-scoring satisfying node
    const bestNode = satisfyingNodes.reduce(
      (best, current) => current.score > best.score ? current : best,
      satisfyingNodes[0]
    );
    
    return this.stateManager.getPath(bestNode.id);
  }
  
  public async getMetrics(): Promise<any> {
    const baseMetrics = await super.getMetrics();
    return {
      ...baseMetrics,
      variablesCount: this.domains.size,
      assignedVariables: this.assignments.size,
      constraintsSatisfied: this._checkConstraints(),
      averageDomainSize: Array.from(this.domains.values())
        .reduce((sum, domain) => sum + domain.length, 0) / Math.max(1, this.domains.size)
    };
  }
  
  public async clear(): Promise<void> {
    await super.clear();
    this.domains.clear();
    this.constraints.clear();
    this.assignments.clear();
  }
} 