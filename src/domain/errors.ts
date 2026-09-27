export class SkillError extends Error {
  constructor(message: string, public readonly code = 'SKILL_ERROR') {
    super(message);
    this.name = 'SkillError';
  }
}

export class ValidationError extends SkillError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class TopicResolutionError extends SkillError {
  constructor(message: string) {
    super(message, 'TOPIC_RESOLUTION_ERROR');
    this.name = 'TopicResolutionError';
  }
}

export class PageviewApiError extends SkillError {
  constructor(message: string, public readonly status?: number) {
    super(message, 'PAGEVIEW_API_ERROR');
    this.name = 'PageviewApiError';
  }
}

export class DataQualityError extends SkillError {
  constructor(message: string) {
    super(message, 'DATA_QUALITY_ERROR');
    this.name = 'DataQualityError';
  }
}
