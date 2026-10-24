import express from 'express';
import { generateRegOptions, verifyReg, generateAuthOptions, verifyAuthAndCheckIn } from '../Controllers/biometricAuthController.js';
import { verifyToken } from '../Middelwear/auth.js';

const router = express.Router();

router.post('/register-options', verifyToken, generateRegOptions);
router.post('/register-verify', verifyToken, verifyReg);
router.post('/auth-options', verifyToken, generateAuthOptions);
router.post('/auth-verify', verifyToken, verifyAuthAndCheckIn);

export default router;