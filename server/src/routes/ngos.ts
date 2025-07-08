import express from 'express';
import { validate, schemas } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import {
  createNGOProfile,
  updateNGOProfile,
  getNGOProfile,
  getNGOs,
  getMyNGOReports,
  getNGOStats
} from '../controllers/ngoController';

const router = express.Router();

router.post('/profile', authenticate, validate(schemas.createNGOProfile), createNGOProfile);
router.put('/profile', authenticate, authorize('NGO'), updateNGOProfile);
router.get('/profile/:id', getNGOProfile);
router.get('/', getNGOs);
router.get('/my/reports', authenticate, authorize('NGO'), getMyNGOReports);
router.get('/my/stats', authenticate, authorize('NGO'), getNGOStats);

export default router;