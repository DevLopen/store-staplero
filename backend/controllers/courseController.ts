import { Request, Response } from "express";
import Course from "../models/Course";

// GET all courses
export const getCourses = async (req: Request, res: Response) => {
    try {
        const courses = await Course.find();
        res.json({ courses });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

// POST new course
export const createCourse = async (req: Request, res: Response) => {
    try {
        const { title, description } = req.body;
        const newCourse = new Course({ title, description, chapters: [] });
        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

// PUT update course (np. dodać rozdział)
export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedData = req.body; // np. { chapters: [...] }
        const updatedCourse = await Course.findByIdAndUpdate(id, updatedData, { new: true });
        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nicht gefunden" });

    await course.deleteOne();
    res.json({ message: "Kurs wurde gelöscht" });
};


export const addChapter = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const { title, description } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        course.chapters.push({
            id: `ch${Date.now()}`,
            title,
            description,
            order: course.chapters.length + 1,
            topics: [],
        });

        await course.save();

        res.json(course);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

export const updateChapter = async (req: Request, res: Response) => {
    try {
        const { courseId, chapterId } = req.params;
        const { title, description } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const chapter = course.chapters.find(ch => ch.id === chapterId);
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found" });
        }

        chapter.title = title;
        chapter.description = description;

        await course.save();

        res.json(course);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

export const deleteChapter = async (req: Request, res: Response) => {
    const { courseId, chapterId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nicht gefunden" });

    course.chapters = course.chapters.filter(ch => ch.id !== chapterId);
    await course.save();
    res.json(course);
};

export const addTopic = async (req: Request, res: Response) => {
    const { courseId, chapterId } = req.params;
    const { title, content, duration, videoUrl, minDurationSeconds, requireMinDuration } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nicht gefunden" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Chapter nicht gefunden" });

    const newTopic = {
        id: `t${Date.now()}`,
        title,
        content,
        duration,
        videoUrl: videoUrl || null,
        minDurationSeconds: minDurationSeconds || null,
        requireMinDuration: requireMinDuration || false,
        order: chapter.topics.length + 1
    };

    chapter.topics.push(newTopic);
    await course.save();

    res.json(course); // backend zwraca cały kurs
};

export const updateTopic = async (req: Request, res: Response) => {
    const { courseId, chapterId, topicId } = req.params;
    const { title, content, duration, videoUrl, minDurationSeconds, requireMinDuration } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nicht gefunden" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Chapter nicht gefunden" });

    const topic = chapter.topics.find(t => t.id === topicId);
    if (!topic) return res.status(404).json({ message: "Thema nicht gefunden" });

    topic.title = title ?? topic.title;
    topic.content = content ?? topic.content;
    topic.duration = duration ?? topic.duration;
    topic.videoUrl = videoUrl ?? topic.videoUrl;
    topic.minDurationSeconds = minDurationSeconds ?? topic.minDurationSeconds;
    topic.requireMinDuration = requireMinDuration ?? topic.requireMinDuration;

    await course.save();
    res.json(course);
};

export const deleteTopic = async (req: Request, res: Response) => {
    const { courseId, chapterId, topicId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nicht gefunden" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Chapter nicht gefunden" });

    chapter.topics = chapter.topics.filter(t => t.id !== topicId);
    await course.save();
    res.json(course);
};

