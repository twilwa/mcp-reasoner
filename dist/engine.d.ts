import type { ReasoningRequest, ReasoningResponse } from './types.js';
interface EnhancedGameDevResponse extends ReasoningResponse {
    godotData?: Record<string, unknown>;
    blenderData?: Record<string, unknown>;
    visualizationData?: Record<string, unknown>;
    error?: boolean;
    errorMessage?: string;
}
export declare class ReasoningEngine {
    private reasoner;
    constructor();
    handle(request: ReasoningRequest): Promise<EnhancedGameDevResponse>;
    private _enhanceGameDevResponse;
    private _extractGodotData;
    private _extractBlenderData;
    private _generateVisualizationData;
    private _formatReasoningTree;
    private _formatMetricsData;
    private _formatTimelineData;
    getBestPath(): Promise<unknown[]>;
    getStats(): Promise<unknown>;
    clear(): Promise<void>;
}
export {};
