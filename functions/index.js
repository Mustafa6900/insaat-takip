const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyUserForUpcomingInstallment = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
      const today = new Date();
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(today.getDate() + 5);

      const db = admin.firestore();
      const categoriesSnapshot = await db.collection("categories").get();

      const promises = [];

      categoriesSnapshot.forEach((categoryDoc) => {
        const categoryData = categoryDoc.data();
        const installmentDates = categoryData.installmentDates || [];

        installmentDates.forEach((installmentDate) => {
          const installmentDateObj = new Date(installmentDate);
          if (
            installmentDateObj.toISOString().split("T")[0] ===
          fiveDaysLater.toISOString().split("T")[0]
          ) {
            const projectId = categoryData.projectId;
            const projectRef = db.collection("projects").doc(projectId);

            promises.push(
                projectRef.get().then((projectDoc) => {
                  if (!projectDoc.exists) return;

                  const projectData = projectDoc.data();
                  const userId = projectData.userId;
                  const payload = {
                    notification: {
                      title: "Upcoming Installment Due",
                      body: `Project: ${projectData.name}, Category: ${categoryData.name} - 5 days left for your installment on ${installmentDate}`,
                    },
                  };

                  return admin.messaging().sendToTopic(userId, payload);
                }),
            );
          }
        });
      });

      await Promise.all(promises);
      return null;
    });
