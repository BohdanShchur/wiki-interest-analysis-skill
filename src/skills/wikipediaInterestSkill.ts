import { AnalysisRequest, AnalysisResult } from '../domain/models.js';
import { requestSchema } from '../domain/schemas.js';
import { ValidationError } from '../domain/errors.js';
import { AnalysisServiceImpl } from '../services/analysisService.js';

export type SkillContext = AnalysisRequest;

export async function invokeWikipediaInterestSkill(context: SkillContext): Promise<AnalysisResult> {
  const parsed = requestSchema.safeParse(context);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((issue) => issue.message).join('; '));
  }

  const service = new AnalysisServiceImpl();
  return service.run(parsed.data);
}
