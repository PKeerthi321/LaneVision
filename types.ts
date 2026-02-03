
export interface Point {
  x: number;
  y: number;
}

export interface LaneLine {
  slope: number;
  intercept: number;
  points: Point[];
  coefficients?: [number, number, number];
}

export type FeasibilityStatus = 'CRITICAL' | 'CAUTION' | 'CLEAR';

export interface FrameMetrics {
  timestamp: number;
  confidence: number;
  leftLaneDetected: boolean;
  rightLaneDetected: boolean;
  edgeClarity: number;
  continuityScore: number;
  lightingScore: number;
  leftCurvature: number;
  rightCurvature: number;
  leftShiftFeasibility: FeasibilityStatus;
  rightShiftFeasibility: FeasibilityStatus;
}

export interface PipelineSettings {
  cannyLow: number;
  cannyHigh: number;
  blurRadius: number;
  roiHeight: number;
  roiWidth: number;
}

export enum DetectionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  CALIBRATING = 'CALIBRATING',
  ERROR = 'ERROR'
}
