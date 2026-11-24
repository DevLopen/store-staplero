import { UserCourse } from "../models/UserCourse";

/**
 * Nadaje (albo przedłuża) dostęp do kursu online. Nie skraca dostępu, który jest jeszcze aktywny i dłuższy.
 * Osobny moduł, żeby z nadawania dostępu korzystały i zamówienia (order.service), i zaproszenia
 * (seatInvite.service) bez importu cyklicznego.
 */
export const assignCourseToUser = async (
  userId: string,
  courseId: string,
  orderNumber: string,
  expiresAt: Date
): Promise<Date> => {
  const existing = await UserCourse.findOne({ userId, courseId });
  if (existing) {
    // Nie skracamy dostępu, który jest jeszcze aktywny i dłuższy (np. 30 dni z wcześniejszego zakupu)
    if (existing.status === "active" && existing.expiresAt && existing.expiresAt > expiresAt) {
      expiresAt = existing.expiresAt;
    }
    existing.expiresAt = expiresAt;
    existing.status = "active";
    existing.purchaseDate = new Date();
    existing.orderNumber = orderNumber;
    await existing.save();
  } else {
    await UserCourse.create({ userId, courseId, purchaseDate: new Date(), expiresAt, status: "active", orderNumber });
  }
  return expiresAt;
};

export default { assignCourseToUser };
