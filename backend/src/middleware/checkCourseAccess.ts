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
console.log(courseId);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const access = await UserCourse.findOne({ userId, courseId });
    if (!access) return res.status(403).json({ message: "Kein Zugriff auf diesen Kurs" });

    next();
};
