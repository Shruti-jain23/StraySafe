import express from 'express';
import { validate, schemas } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import {
  createReport,
  getReports,
  getReport,
  updateReport,
  addReportUpdate,
  assignReport,
  getMyReports
} from '../controllers/reportController';

const router = express.Router();

router.post('/', authenticate, validate(schemas.createReport), createReport);
router.get('/', getReports);
router.get('/my', authenticate, getMyReports);
router.get('/:id', getReport);
router.put('/:id', authenticate, validate(schemas.updateReport), updateReport);
router.post('/:id/updates', authenticate, validate(schemas.addReportUpdate), addReportUpdate);
router.post('/:id/assign', authenticate, authorize('NGO', 'ADMIN'), assignReport);

export default router;