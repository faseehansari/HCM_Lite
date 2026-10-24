import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import Employee from '../Modules/Employee.js';
import Attendance from '../Modules/Attendance.js';
import { sendNotification } from '../../utils/notificationHelper.js';

// RP (Relying Party) Configuration
const rpName = 'Tech Solutions HCM';
const rpID = 'localhost'; // Production par apna domain dein (e.g., 'yourdomain.com')
const expectedOrigin = `http://localhost:5000`; // Frontend origin

// Temporary in-memory store for challenges (Production mein Redis ya DB use hota hai)
const challengeStore = {};

// 1. Generate Registration Options (Fingerprint Register karne ke liye)
export const generateRegOptions = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: employee._id.toString(),
      userName: employee.email,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      }
    });

    challengeStore[employee._id.toString()] = options.challenge;
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Verify and Save Fingerprint Registration
export const verifyReg = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { credential } = req.body;
    const expectedChallenge = challengeStore[employeeId.toString()];

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      await Employee.findByIdAndUpdate(employeeId, {
        $push: {
          biometricCredentials: {
            credentialID: Buffer.from(credentialID).toString('base64'),
            credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
            counter,
          }
        }
      });

      delete challengeStore[employeeId.toString()];
      return res.json({ success: true, message: 'Fingerprint registered successfully!' });
    }

    res.status(400).json({ error: 'Fingerprint registration failed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Generate Authentication Options (Check-in ke waqt fingerprint mangne ke liye)
export const generateAuthOptions = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const employee = await Employee.findById(employeeId);
    if (!employee || !employee.biometricCredentials?.length) {
      return res.status(400).json({ error: 'No fingerprint registered for this employee.' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: employee.biometricCredentials.map(cred => ({
        id: Buffer.from(cred.credentialID, 'base64'),
        type: 'public-key',
        transports: cred.transports,
      })),
      userVerification: 'required',
    });

    challengeStore[employee._id.toString()] = options.challenge;
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Verify Fingerprint and Mark Check-In (Attendance via Biometric)
export const verifyAuthAndCheckIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { credential } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    const expectedChallenge = challengeStore[employeeId.toString()];
    const dbCred = employee.biometricCredentials.find(
      c => c.credentialID === credential.id
    );

    if (!dbCred) return res.status(400).json({ error: 'Credential not found.' });

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: Buffer.from(dbCred.credentialPublicKey, 'base64'),
        credentialID: Buffer.from(dbCred.credentialID, 'base64'),
        counter: dbCred.counter,
      },
    });

    if (verification.verified) {
      // Fingerprint match ho gaya! Ab attendance lagao.
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let attendance = await Attendance.findOne({ employeeId, date: today });
      const now = new Date();

      if (!attendance) {
        const officeStartTime = new Date();
        officeStartTime.setHours(9, 0, 0, 0);
        const status = now > officeStartTime ? 'Late' : 'Present';

        attendance = new Attendance({
          employeeId,
          date: today,
          checkIn: now,
          status
        });
        await attendance.save();

        if (employee.userId) {
          await sendNotification(
            employee.userId,
            'Biometric Check-In Successful',
            `Check-in recorded via fingerprint at ${now.toLocaleTimeString()}. Status: ${status}`,
            'ATTENDANCE'
          );
        }
      } else if (!attendance.checkOut) {
        attendance.checkOut = now;
        const diffMs = now - new Date(attendance.checkIn);
        attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        await attendance.save();

        if (employee.userId) {
          await sendNotification(
            employee.userId,
            'Biometric Check-Out Successful',
            `Check-out recorded via fingerprint at ${now.toLocaleTimeString()}`,
            'ATTENDANCE'
          );
        }
      }

      delete challengeStore[employeeId.toString()];
      return res.json({ success: true, message: 'Fingerprint verified & attendance marked successfully!', attendance });
    }

    res.status(400).json({ error: 'Fingerprint verification failed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};