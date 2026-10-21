import { Request, Response, NextFunction } from "express";
import { UserCourse } from "../models/UserCourse";

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    };
}
export const checkCourseAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { courseId } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (req.user?.isAdmin) return next();

    // Aktywny, niewygasły zakup tego kursu
    const access = await UserCourse.exists({ userId: String(userId), courseId, status: "active", expiresAt: { $gte: new Date() } });
    if (!access) return res.status(403).json({ message: "Kein Zugriff auf diesen Kurs" });

    next();
};
