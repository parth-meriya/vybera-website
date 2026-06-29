import admin from 'firebase-admin';

/**
 * Dispatch notification across multiple channels (In-App, Email, WhatsApp)
 * based on user preferences.
 */
export async function dispatchNotification(db, { userId, type, title, message }) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return false;
    
    const userData = userSnap.data();
    
    // Default preferences if not configured
    const prefs = userData.notificationPreferences || {
      push: { order: true, spin: true, promo: true },
      email: { order: true, spin: true, promo: true },
      whatsapp: { order: true, spin: true, promo: true }
    };

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestampStr = new Date().toISOString();

    // Mapping type categories
    let category = 'promo';
    if (type === 'order' || type === 'coupon') category = 'order';
    else if (type === 'spin' || type === 'FREE_TEE' || type === 'points') category = 'spin';

    // 1. In-App Notification (always sent if push setting is true for category)
    const isPushEnabled = prefs.push ? (prefs.push[category] !== false) : true;
    
    if (isPushEnabled) {
      await userRef.update({
        notifications: admin.firestore.FieldValue.arrayUnion({
          id: notifId,
          type: type,
          title: title,
          message: message,
          createdAt: timestampStr,
          read: false,
        })
      });
    }

    // 2. Mock Email alert status
    const isEmailEnabled = prefs.email ? (prefs.email[category] !== false) : true;
    const emailStatus = isEmailEnabled ? `Sent (Mocked to ${userData.email})` : 'Disabled';

    // 3. Mock WhatsApp alert status
    const isWhatsappEnabled = prefs.whatsapp ? (prefs.whatsapp[category] !== false) : true;
    const whatsappStatus = isWhatsappEnabled && userData.phoneNumber 
      ? `Sent (Mocked to +91${userData.phoneNumber})` 
      : (userData.phoneNumber ? 'Disabled' : 'No Phone Number');

    // 4. Log the multi-channel dispatch
    await db.collection('notificationLogs').add({
      userId,
      userEmail: userData.email,
      userName: userData.name || 'Customer',
      title,
      message,
      type,
      channels: {
        push: isPushEnabled ? 'Delivered' : 'Disabled',
        email: emailStatus,
        whatsapp: whatsappStatus
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error dispatching notification:', error);
    return false;
  }
}
