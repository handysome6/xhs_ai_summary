/**
 * Analyze route - handles AI content analysis requests
 */
import { Router, Request, Response } from 'express';
import { asyncHandler, Errors } from '../middleware/error-handler';
import { analyzeContent, AnalysisInput } from '../services/ai-analyzer';

const router = Router();

/**
 * Analyze content with AI
 * POST /analyze
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, text, mediaCount } = req.body as AnalysisInput;

    // Validate request
    if (!text || typeof text !== 'string') {
      throw Errors.badRequest('Text content is required');
    }

    if (text.length < 10) {
      throw Errors.validation('Text content is too short for analysis');
    }

    try {
      const result = await analyzeContent({
        title: title || null,
        text,
        mediaCount: typeof mediaCount === 'number' ? mediaCount : 0,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw Errors.aiError(
        error instanceof Error ? error.message : 'AI analysis failed'
      );
    }
  })
);

export default router;
