import { Request, Response } from "express";
import Course from "../models/Course";

export const getCourses = async (req: Request, res: Response) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};
