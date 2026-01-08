/**
 * Request Queue for LLM Requests
 * 
 * Handles traffic spikes by queuing requests instead of failing.
 * Features:
 * - Priority queue (urgent requests first)
 * - Configurable concurrency
 * - Timeout handling
 * - Queue statistics
 */

import { LLMRequest, LLMResponse } from './router';

interface QueuedRequest {
  id: string;
  request: LLMRequest;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  timeout: number;
  resolve: (response: LLMResponse) => void;
  reject: (error: Error) => void;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgWaitTime: number;
}

// Queue storage
const requestQueue: QueuedRequest[] = [];
let isProcessing = false;
let processingCount = 0;

// Statistics
let completedCount = 0;
let failedCount = 0;
let totalWaitTime = 0;

// Configuration
const MAX_CONCURRENT = 3; // Maximum concurrent requests
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100;

// Request processor function (will be set by router)
let requestProcessor: ((request: LLMRequest) => Promise<LLMResponse>) | null = null;

/**
 * Set the request processor function
 */
export function setRequestProcessor(
  processor: (request: LLMRequest) => Promise<LLMResponse>
): void {
  requestProcessor = processor;
}

/**
 * Add a request to the queue
 */
export function enqueueRequest(
  request: LLMRequest,
  priority: 'high' | 'normal' | 'low' = 'normal',
  timeout: number = DEFAULT_TIMEOUT
): Promise<LLMResponse> {
  return new Promise((resolve, reject) => {
    // Check queue size
    if (requestQueue.length >= MAX_QUEUE_SIZE) {
      reject(new Error('Request queue is full. Please try again later.'));
      return;
    }
    
    const queuedRequest: QueuedRequest = {
      id: generateRequestId(),
      request,
      priority,
      timestamp: Date.now(),
      timeout,
      resolve,
      reject,
    };
    
    // Insert based on priority
    const insertIndex = findInsertIndex(priority);
    requestQueue.splice(insertIndex, 0, queuedRequest);
    
    console.log(`[Queue] Request ${queuedRequest.id} added (${priority}). Queue size: ${requestQueue.length}`);
    
    // Start processing if not already running
    processQueue();
    
    // Set timeout
    setTimeout(() => {
      const index = requestQueue.findIndex(r => r.id === queuedRequest.id);
      if (index !== -1) {
        requestQueue.splice(index, 1);
        reject(new Error('Request timed out in queue'));
        failedCount++;
      }
    }, timeout);
  });
}

/**
 * Find the correct insertion index based on priority
 */
function findInsertIndex(priority: 'high' | 'normal' | 'low'): number {
  if (priority === 'high') {
    // Insert after other high priority requests
    const firstNonHigh = requestQueue.findIndex(r => r.priority !== 'high');
    return firstNonHigh === -1 ? requestQueue.length : firstNonHigh;
  }
  
  if (priority === 'normal') {
    // Insert after high and normal priority requests
    const firstLow = requestQueue.findIndex(r => r.priority === 'low');
    return firstLow === -1 ? requestQueue.length : firstLow;
  }
  
  // Low priority goes to the end
  return requestQueue.length;
}

/**
 * Process queued requests
 */
async function processQueue(): Promise<void> {
  if (isProcessing && processingCount >= MAX_CONCURRENT) return;
  if (requestQueue.length === 0) return;
  if (!requestProcessor) {
    console.error('[Queue] No request processor set');
    return;
  }
  
  isProcessing = true;
  
  while (requestQueue.length > 0 && processingCount < MAX_CONCURRENT) {
    const queuedRequest = requestQueue.shift();
    if (!queuedRequest) break;
    
    processingCount++;
    const waitTime = Date.now() - queuedRequest.timestamp;
    totalWaitTime += waitTime;
    
    console.log(`[Queue] Processing ${queuedRequest.id} (waited ${waitTime}ms)`);
    
    // Process request asynchronously
    processRequest(queuedRequest);
  }
  
  if (processingCount === 0) {
    isProcessing = false;
  }
}

/**
 * Process a single request
 */
async function processRequest(queuedRequest: QueuedRequest): Promise<void> {
  try {
    const response = await requestProcessor!(queuedRequest.request);
    queuedRequest.resolve(response);
    completedCount++;
    console.log(`[Queue] Request ${queuedRequest.id} completed`);
  } catch (error) {
    queuedRequest.reject(error as Error);
    failedCount++;
    console.log(`[Queue] Request ${queuedRequest.id} failed`);
  } finally {
    processingCount--;
    // Continue processing queue
    if (requestQueue.length > 0) {
      processQueue();
    } else if (processingCount === 0) {
      isProcessing = false;
    }
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get queue statistics
 */
export function getQueueStats(): QueueStats {
  const totalCompleted = completedCount + failedCount;
  return {
    pending: requestQueue.length,
    processing: processingCount,
    completed: completedCount,
    failed: failedCount,
    avgWaitTime: totalCompleted > 0 ? Math.round(totalWaitTime / totalCompleted) : 0,
  };
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
  return requestQueue.length;
}

/**
 * Check if queue is accepting requests
 */
export function isQueueAvailable(): boolean {
  return requestQueue.length < MAX_QUEUE_SIZE;
}

/**
 * Clear the queue (emergency use only)
 */
export function clearQueue(): void {
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      request.reject(new Error('Queue cleared'));
    }
  }
  console.log('[Queue] Queue cleared');
}

/**
 * Reset queue statistics
 */
export function resetQueueStats(): void {
  completedCount = 0;
  failedCount = 0;
  totalWaitTime = 0;
  console.log('[Queue] Statistics reset');
}
