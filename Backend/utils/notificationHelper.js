import Notification from '../src/Modules/Notification.js';

export const sendNotification = async (recipientId, title, message, type = 'GENERAL') => {
  try {
    await Notification.create({
      recipient: recipientId,
      title,
      message,
      type
    });
  } catch (err) {
    console.error('Notification Error:', err.message);
  }
};