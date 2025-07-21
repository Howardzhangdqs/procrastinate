export interface TaskStep {
  step: string;
  description: string;
};

export type TaskSteps = TaskStep[];

export enum ErrorCode {
  SUCCESS,
  OUT_OF_ATTEMPTS,
  MODEL_ERROR,
};
