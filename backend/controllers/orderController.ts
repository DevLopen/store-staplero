import { Request, Response } from "express";
import Course from "../models/Course";
import { mockCourse } from "../data/courseData";

export const getCourses = async (req: Request, res: Response) => {
    try {
        // Jeśli nie ma kursów w DB, wrzucamy mock
        const courses = await Course.find();
        if (courses.length === 0) {
            await Course.create(mockCourse);
            return res.json([mockCourse]);
        }
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};
