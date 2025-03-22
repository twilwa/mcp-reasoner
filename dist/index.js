#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Reasoner } from './reasoner.js';
import { ReasoningStrategy } from './strategies/factory.js';
// Initialize server
const server = new Server({
    name: "mcp-reasoner",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize reasoner
const reasoner = new Reasoner();
// Process input and ensure correct types
function processInput(input) {
    const result = {
        thought: String(input.thought || ""),
        thoughtNumber: Number(input.thoughtNumber || 0),
        totalThoughts: Number(input.totalThoughts || 0),
        nextThoughtNeeded: Boolean(input.nextThoughtNeeded),
        strategyType: input.strategyType
    };
    // Validate
    if (!result.thought) {
        throw new Error("thought must be provided");
    }
    if (result.thoughtNumber < 1) {
        throw new Error("thoughtNumber must be >= 1");
    }
    if (result.totalThoughts < 1) {
        throw new Error("totalThoughts must be >= 1");
    }
    return result;
}
// Register the tool
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
            name: "mcp-reasoner",
            description: "Advanced reasoning tool with multiple strategies including Beam Search and Monte Carlo Tree Search",
            inputSchema: {
                type: "object",
                properties: {
                    thought: {
                        type: "string",
                        description: "Current reasoning step"
                    },
                    thoughtNumber: {
                        type: "integer",
                        description: "Current step number",
                        minimum: 1
                    },
                    totalThoughts: {
                        type: "integer",
                        description: "Total expected steps",
                        minimum: 1
                    },
                    nextThoughtNeeded: {
                        type: "boolean",
                        description: "Whether another step is needed"
                    },
                    strategyType: {
                        type: "string",
                        enum: Object.values(ReasoningStrategy),
                        description: "Reasoning strategy to use (beam_search or mcts)"
                    }
                },
                required: ["thought", "thoughtNumber", "totalThoughts", "nextThoughtNeeded"]
            }
        }]
}));
// Handle requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "mcp-reasoner") {
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({ error: "Unknown tool", success: false })
                }],
            isError: true
        };
    }
    try {
        // Process and validate input
        const step = processInput(request.params.arguments);
        // Process thought with selected strategy
        const response = await reasoner.processThought({
            thought: step.thought,
            thoughtNumber: step.thoughtNumber,
            totalThoughts: step.totalThoughts,
            nextThoughtNeeded: step.nextThoughtNeeded,
            strategyType: step.strategyType
        });
        // Get reasoning stats
        const stats = await reasoner.getStats();
        // Return enhanced response
        const result = {
            thoughtNumber: step.thoughtNumber,
            totalThoughts: step.totalThoughts,
            nextThoughtNeeded: step.nextThoughtNeeded,
            thought: step.thought,
            nodeId: response.nodeId,
            score: response.score,
            strategyUsed: response.strategyUsed,
            stats: {
                totalNodes: stats.totalNodes,
                averageScore: stats.averageScore,
                maxDepth: stats.maxDepth,
                branchingFactor: stats.branchingFactor,
                strategyMetrics: stats.strategyMetrics
            }
        };
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(result)
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : String(error),
                        success: false
                    })
                }],
            isError: true
        };
    }
});
// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch(error => {
    process.stderr.write(`Error starting server: ${error}\n`);
    process.exit(1);
});
