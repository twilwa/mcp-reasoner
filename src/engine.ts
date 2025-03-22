import { Reasoner } from './reasoner.js';
import type { ReasoningRequest, ReasoningResponse } from './types.js';

// Extended response type to include game dev specific data
interface EnhancedGameDevResponse extends ReasoningResponse {
    godotData?: Record<string, unknown>;
    blenderData?: Record<string, unknown>;
    visualizationData?: Record<string, unknown>;
    error?: boolean;
    errorMessage?: string;
}

export class ReasoningEngine {
    private reasoner: Reasoner;
    
    constructor() {
        this.reasoner = new Reasoner();
    }
    
    public async handle(request: ReasoningRequest): Promise<EnhancedGameDevResponse> {
        try {
            // Check if it's a standard MCP request or a game dev request
            const isGameDevRequest = 'problemType' in request;
            
            // Process the request through the reasoner
            const response = await this.reasoner.processThought(request);
            
            // Add visualization data for game dev requests
            if (isGameDevRequest) {
                return this._enhanceGameDevResponse(response);
            }
            
            return response;
        } catch (error) {
            console.error("Error in reasoning engine:", error);
            return {
                nodeId: '',
                thought: '',
                score: 0,
                depth: 0,
                isComplete: false,
                nextThoughtNeeded: false,
                error: true,
                errorMessage: (error instanceof Error) ? error.message : "Unknown error in reasoning engine"
            };
        }
    }
    
    private _enhanceGameDevResponse(response: ReasoningResponse): EnhancedGameDevResponse {
        return {
            ...response,
            godotData: this._extractGodotData(response),
            blenderData: this._extractBlenderData(response),
            visualizationData: this._generateVisualizationData(response)
        };
    }
    
    private _extractGodotData(response: ReasoningResponse): Record<string, unknown> {
        // Extract or transform data specifically for Godot
        // For example, convert thought paths into node hierarchies
        // This is a placeholder - actual implementation would depend on Godot integration details
        return {
            nodeStructure: {},
            resourcePaths: [],
            scriptSnippets: {}
        };
    }
    
    private _extractBlenderData(response: ReasoningResponse): Record<string, unknown> {
        // Extract or transform data specifically for Blender
        // For example, extract 3D structure information
        return {
            materialStructure: {},
            assetCategories: [],
            pipelineSteps: []
        };
    }
    
    private _generateVisualizationData(response: ReasoningResponse): Record<string, unknown> {
        // Generate data for visualizing the reasoning process
        // Could be used for debugging or educational purposes
        return {
            reasoningTreeData: this._formatReasoningTree(response),
            metricsData: this._formatMetricsData(response),
            timelineData: this._formatTimelineData(response)
        };
    }
    
    private _formatReasoningTree(response: ReasoningResponse): Record<string, unknown> {
        // Format the reasoning tree for visualization
        // Placeholder - actual implementation would depend on visualization needs
        return {};
    }
    
    private _formatMetricsData(response: ReasoningResponse): Record<string, unknown> {
        // Format metrics for visualization
        return {};
    }
    
    private _formatTimelineData(response: ReasoningResponse): Record<string, unknown> {
        // Format timeline data for visualization
        return {};
    }
    
    public async getBestPath(): Promise<unknown[]> {
        return this.reasoner.getBestPath();
    }
    
    public async getStats(): Promise<unknown> {
        return this.reasoner.getStats();
    }
    
    public async clear(): Promise<void> {
        return this.reasoner.clear();
    }
}