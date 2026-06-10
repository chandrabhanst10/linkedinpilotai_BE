import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  duplicatePost,
  retryPost,
} from './controller.js';
import { protect } from '../../middlewares/auth.js';
import { validateBody, validateQuery, validateParams } from '../../middlewares/validate.js';
import {
  schedulePostSchema,
  updatePostSchema,
  postsQuerySchema,
  postIdParamSchema,
} from './validation.js';

const router = express.Router();

router.use(protect);

router.post('/', validateBody(schedulePostSchema), createPost);
router.get('/', validateQuery(postsQuerySchema), getPosts);
router.get('/:id', validateParams(postIdParamSchema), getPostById);
router.put('/:id', validateParams(postIdParamSchema), validateBody(updatePostSchema), updatePost);
router.delete('/:id', validateParams(postIdParamSchema), deletePost);
router.post('/:id/duplicate', validateParams(postIdParamSchema), duplicatePost);
router.post('/:id/retry', validateParams(postIdParamSchema), retryPost);

export default router;
