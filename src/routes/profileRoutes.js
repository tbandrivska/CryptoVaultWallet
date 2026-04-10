import express from 'express';
import { getProfiles, createNewProfile } from '../controllers/profileController.js';

const router = express.Router();

router.get('/', getProfiles);
router.post('/', createNewProfile);

export default router;