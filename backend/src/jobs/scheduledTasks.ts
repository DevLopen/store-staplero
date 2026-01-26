import cron from "node-cron";
import orderService from "../services/order.service";

/**
 * Setup all scheduled cron jobs
 */
export const setupCronJobs = () => {
    console.log("⏰ Setting up cron jobs...");

    // 1. Expire old courses - runs every day at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
        console.log("🔄 Running course expiration check...");
        try {
            await orderService.expireOldCourses();
            console.log("✅ Course expiration check completed");
        } catch (err) {
            console.error("❌ Course expiration check failed:", err);
        }
    });

    // 2. Send expiry reminders - runs every day at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
        console.log("📧 Sending course expiry reminders...");
        try {
            await orderService.sendExpiryReminders();
            console.log("✅ Expiry reminders sent");
        } catch (err) {
            console.error("❌ Failed to send expiry reminders:", err);
        }
    });

    // 3. Send practical course reminders - runs every day at 8:00 AM
    // This sends reminder 1 day before the practical course
    cron.schedule("0 8 * * *", async () => {
        console.log("📧 Sending practical course reminders...");
        try {
            await sendPracticalCourseReminders();
            console.log("✅ Practical course reminders sent");
        } catch (err) {
            console.error("❌ Failed to send practical course reminders:", err);
        }
    });

    console.log("✅ Cron jobs scheduled successfully");
};

/**
 * Send reminders for practical courses happening tomorrow
 */
// const sendPracticalCourseReminders = async () => {
//     const Order = (await import("../models/Order")).default;
//     const User = (await import("../models/User")).default;
//     const emailService = (await import("../services/email.service")).default;
//
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);
//
//     const endOfTomorrow = new Date(tomorrow);
//     endOfTomorrow.setHours(23, 59, 59, 999);
//
//     // Find all paid practical course orders for tomorrow
//     const orders = await Order.find({
//         type: "practical",
//         status: "paid",
//         "practicalCourseDetails.date": {
//             $gte: tomorrow.toISOString(),
//             $lte: endOfTomorrow.toISOString(),
//         },
//     });
//
//     for (const order of orders) {
//         const user = await User.findById(order.userId);
//         if (!user || !order.practicalCourseDetails) continue;
//
//         const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="utf-8">
//           <style>
//             body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//             .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//             .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
//             .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
//             .info-box { background: #FFF3CD; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0; border-radius: 4px; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1>⏰ Erinnerung: Ihr Kurs ist morgen!</h1>
//             </div>
//             <div class="content">
//               <h2>Hallo ${user.name}!</h2>
//
//               <div class="info-box">
//                 <p><strong>Ihr Staplerführerschein-Kurs findet morgen statt:</strong></p>
//                 <p><strong>Standort:</strong> ${order.practicalCourseDetails.locationName}</p>
//                 <p><strong>Adresse:</strong> ${order.practicalCourseDetails.locationAddress}</p>
//                 <p><strong>Uhrzeit:</strong> ${order.practicalCourseDetails.time}</p>
//               </div>
//
//               <p><strong>Bitte mitbringen:</strong></p>
//               <ul>
//                 <li>Personalausweis oder Reisepass</li>
//                 <li>Feste Schuhe und bequeme Kleidung</li>
//                 <li>Verpflegung für den Tag</li>
//               </ul>
//
//               <p>Bitte erscheinen Sie pünktlich 15 Minuten vor Kursbeginn!</p>
//               <p><strong>Wir freuen uns auf Sie!</strong><br>Ihr STAPLERO Team</p>
//             </div>
//           </div>
//         </body>
//       </html>
//     `;
//
//         await emailService.sendEmail({
//             from: process.env.FROM_EMAIL || "STAPLERO <noreply@staplero.de>",
//             to: user.email,
//             subject: "⏰ Erinnerung: Ihr Staplerführerschein-Kurs ist morgen!",
//             html,
//         });
//     }
// };

// Alternative: Manual trigger endpoints (optional)
// Add these to your routes if you want to trigger jobs manually

export const manualTriggers = {
    expireCourses: async () => {
        await orderService.expireOldCourses();
    },
    sendExpiryReminders: async () => {
        await orderService.sendExpiryReminders();
    },
    sendPracticalReminders: async () => {
        await sendPracticalCourseReminders();
    },
};