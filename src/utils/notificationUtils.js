import { collection, query, getDocs, where, doc, getDoc } from "firebase/firestore";
import { db } from "../app/firebase";

const sendPushNotification = async (userId, notification) => {
  try {
    // Kullanıcının FCM token'ını al
    const userTokenDoc = await getDoc(doc(db, "userTokens", userId));
    if (!userTokenDoc.exists()) return;

    const fcmToken = userTokenDoc.data().fcmToken;
    if (!fcmToken) return;

    // Cloud Function'a bildirim gönderme isteği yap
    const response = await fetch('/api/sendNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
        title: notification.title,
        body: notification.body,
        data: {
          projectId: notification.projectId,
          categoryId: notification.categoryId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Bildirim gönderilemedi');
    }
  } catch (error) {
    console.error("Push notification error:", error);
  }
};

export const checkUpcomingPayments = async (userId) => {
  try {
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14); // 2 hafta sonrası

    const projectsRef = collection(db, "projects");
    const projectsQuery = query(
      projectsRef,
      where("userId", "==", userId),
      where("isArchived", "==", false)
    );

    const projectsSnapshot = await getDocs(projectsQuery);
    const notifications = [];

    for (const projectDoc of projectsSnapshot.docs) {
      const categoriesRef = collection(db, "categories");
      const categoriesQuery = query(
        categoriesRef,
        where("projectId", "==", projectDoc.id)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);

      for (const categoryDoc of categoriesSnapshot.docs) {
        const categoryData = categoryDoc.data();
        const installmentDates = categoryData.installmentDates || [];
        const installmentAmounts = categoryData.installmentAmounts || [];
        const installmentStatus = categoryData.installmentStatus || [];

        installmentDates.forEach((dateStr, index) => {
          const paymentDate = new Date(dateStr);
          
          // Ödenmemiş ve yaklaşan ödemeler için kontrol (2 hafta içindeki)
          if (!installmentStatus[index] && paymentDate > now && paymentDate < twoWeeksFromNow) {
            notifications.push({
              type: "payment",
              title: "Yaklaşan Ödeme Hatırlatması",
              body: `${projectDoc.data().name} projesinde ${categoryData.name} kategorisi için ${new Date(dateStr).toLocaleDateString("tr-TR")} tarihinde ${installmentAmounts[index].toLocaleString("tr-TR")} TL ödeme bulunmaktadır.`,
              date: paymentDate,
              projectId: projectDoc.id,
              categoryId: categoryDoc.id,
              amount: installmentAmounts[index],
              read: false,
              createdAt: new Date(),
            });
          }
        });
      }
    }

    // Bildirimleri oluştururken push notification da gönder
    for (const notification of notifications) {
      await sendPushNotification(userId, notification);
    }

    return notifications;
  } catch (error) {
    console.error("Ödeme kontrolü sırasında hata:", error);
    return [];
  }
}; 