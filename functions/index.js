const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyUserForUpcomingInstallment = functions.pubsub
    .schedule("every 24 hours")
    .timeZone('Europe/Istanbul')
    .onRun(async () => {
      const today = new Date();
      const sevenDaysLater = new Date();
      const threeDaysLater = new Date();
      
      sevenDaysLater.setDate(today.getDate() + 7);
      threeDaysLater.setDate(today.getDate() + 3);

      const db = admin.firestore();
      const categoriesSnapshot = await db.collection("categories").get();

      const promises = [];

      categoriesSnapshot.forEach((categoryDoc) => {
        const categoryData = categoryDoc.data();
        const installmentDates = categoryData.installmentDates || [];
        const installmentAmounts = categoryData.installmentAmounts || [];

        installmentDates.forEach((installmentDate, index) => {
          const installmentDateObj = new Date(installmentDate);
          const amount = installmentAmounts[index];
          
          // Tarihleri karşılaştırmak için saat bilgisini kaldır
          const todayStr = today.toISOString().split('T')[0];
          const installmentStr = installmentDateObj.toISOString().split('T')[0];
          const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
          const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

          const projectId = categoryData.projectId;
          const projectRef = db.collection("projects").doc(projectId);

          // Farklı bildirim mesajları
          const createNotificationPromise = (daysLeft) => {
            return projectRef.get().then(async (projectDoc) => {
              if (!projectDoc.exists) return;

              const projectData = projectDoc.data();
              const userId = projectData.userId;

              let message;
              if (daysLeft === 0) {
                message = `${projectData.name} projesinde ${categoryData.name} kategorisi için BUGÜN ${amount.toLocaleString('tr-TR')} TL ödemeniz bulunmaktadır!`;
              } else {
                message = `${projectData.name} projesinde ${categoryData.name} kategorisi için ${daysLeft} gün sonra ${amount.toLocaleString('tr-TR')} TL ödemeniz bulunmaktadır.`;
              }

              // Bildirim verilerini hazırla
              const notificationData = {
                title: daysLeft === 0 ? "⚠️ Ödeme Günü!" : "🔔 Ödeme Hatırlatması",
                body: message,
                projectId: projectId,
                categoryId: categoryDoc.id,
                installmentDate: installmentDate,
                amount: amount,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              };

              // Kullanıcının FCM token'ını al
              const userTokenDoc = await db.collection('userTokens').doc(userId).get();
              if (!userTokenDoc.exists) return;

              const fcmToken = userTokenDoc.data().fcmToken;
              if (!fcmToken) return;

              // Bildirimi gönder
              const payload = {
                notification: {
                  title: notificationData.title,
                  body: notificationData.body,
                },
                data: {
                  projectId: projectId,
                  categoryId: categoryDoc.id,
                  installmentDate: installmentDate,
                  amount: amount.toString(),
                },
                token: fcmToken
              };

              // Bildirimi Firestore'a kaydet
              await db.collection('notifications').add({
                ...notificationData,
                userId: userId,
                read: false
              });

              return admin.messaging().send(payload);
            });
          };

          // 7 gün kala bildirim
          if (installmentStr === sevenDaysStr) {
            promises.push(createNotificationPromise(7));
          }
          
          // 3 gün kala bildirim
          if (installmentStr === threeDaysStr) {
            promises.push(createNotificationPromise(3));
          }
          
          // Ödeme günü bildirimi
          if (installmentStr === todayStr) {
            promises.push(createNotificationPromise(0));
          }
        });
      });

      await Promise.all(promises);
      return null;
    });

exports.archiveOldTransactions = functions.pubsub
  .schedule('0 0 * * *') // Her gün gece yarısı çalışır
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // 30 gün önceki tarihi hesapla
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      // Arşivlenmemiş ve 30 günden eski işlemleri bul
      const snapshot = await db
        .collection('transactions')
        .where('isArchived', 'in', [false, null])
        .where('createdAt', '<=', thirtyDaysAgo.toISOString())
        .get();

      // Toplu güncelleme için batch işlemi
      const batch = db.batch();
      
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isArchived: true,
          archivedAt: new Date().toISOString(),
        });
      });

      // Batch işlemini gerçekleştir
      await batch.commit();

      return null;
    } catch (error) {
      console.error('Arşivleme hatası:', error);
      return null;
    }
  });

exports.sendNotification = functions.https.onRequest(async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    const message = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Notification sending failed' });
  }
});
