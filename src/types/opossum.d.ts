declare module "opossum" {
  export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    volumeThreshold?: number;
    capacity?: number;
    enabled?: boolean;
  }

  export default class CircuitBreaker<TArgs extends unknown[], TResult> {
    constructor(action: (...args: TArgs) => Promise<TResult>, options?: CircuitBreakerOptions);
    fire(...args: TArgs): Promise<TResult>;
  }
}
