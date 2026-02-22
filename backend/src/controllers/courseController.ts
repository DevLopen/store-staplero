import { Request, Response } from "express";
import { nanoid } from "nanoid";
import Course, { ContentBlock, Chapter, Topic } from "../models/Course";
import { AuthRequest } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = (prefix = "") => `${prefix}${nanoid(8)}`;

// ─── COURSES ──────────────────────────────────────────────────────────────────

export const getCourses = async (_req: Request, res: Response) => {
  try {
    const courses = await Course.find({}, "title description thumbnailUrl certificateEnabled chapters createdAt").lean();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.courseId).lean();
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnailUrl, certificateEnabled } = req.body;
    if (!title) return res.status(400).json({ message: "Tytuł kursu jest wymagany" });

    const course = await Course.create({
      title: title.trim(),
      description: description?.trim() ?? "",
      thumbnailUrl: thumbnailUrl ?? null,
      certificateEnabled: certificateEnabled ?? true,
      chapters: [],
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnailUrl, certificateEnabled } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { title, description, thumbnailUrl, certificateEnabled },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });
    res.json({ message: "Kurs usunięty" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── CHAPTERS ─────────────────────────────────────────────────────────────────

export const addChapter = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: "Tytuł rozdziału jest wymagany" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const newChapter: Chapter = {
      id: generateId("ch_"),
      title: title.trim(),
      description: description?.trim() ?? "",
      order: course.chapters.length + 1,
      topics: [],
    };

    course.chapters.push(newChapter);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateChapter = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title, description, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    if (title !== undefined) chapter.title = title.trim();
    if (description !== undefined) chapter.description = description.trim();
    if (order !== undefined) chapter.order = order;

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const reorderChapters = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { order }: { order: string[] } = req.body; // array of chapter ids in new order

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const reordered = order
      .map((id, idx) => {
        const ch = course.chapters.find(c => c.id === id);
        if (ch) ch.order = idx + 1;
        return ch;
      })
      .filter(Boolean) as Chapter[];

    course.chapters = reordered;
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteChapter = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    course.chapters = course.chapters.filter(ch => ch.id !== chapterId);
    // Recalculate order
    course.chapters.forEach((ch, idx) => { ch.order = idx + 1; });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getChapterById = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── TOPICS ───────────────────────────────────────────────────────────────────

export const addTopic = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title, duration, blocks } = req.body;
    if (!title) return res.status(400).json({ message: "Tytuł tematu jest wymagany" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    const newTopic: Topic = {
      id: generateId("t_"),
      title: title.trim(),
      blocks: (blocks ?? []).map((b: ContentBlock, idx: number) => ({
        ...b,
        id: b.id || generateId("b_"),
        order: b.order ?? idx,
      })),
      duration: duration ?? "",
      order: chapter.topics.length + 1,
    };

    chapter.topics.push(newTopic);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId, topicId } = req.params;
    const { title, duration, blocks, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    const topic = chapter.topics.find(t => t.id === topicId);
    if (!topic) return res.status(404).json({ message: "Temat nie znaleziony" });

    if (title !== undefined) topic.title = title.trim();
    if (duration !== undefined) topic.duration = duration;
    if (order !== undefined) topic.order = order;
    if (blocks !== undefined) {
      topic.blocks = blocks.map((b: ContentBlock, idx: number) => ({
        ...b,
        id: b.id || generateId("b_"),
        order: b.order ?? idx,
      }));
    }

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const reorderTopics = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const { order }: { order: string[] } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    const reordered = order
      .map((id, idx) => {
        const t = chapter.topics.find(tp => tp.id === id);
        if (t) t.order = idx + 1;
        return t;
      })
      .filter(Boolean) as Topic[];

    chapter.topics = reordered;
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId, topicId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    chapter.topics = chapter.topics.filter(t => t.id !== topicId);
    chapter.topics.forEach((t, idx) => { t.order = idx + 1; });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getTopicById = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, chapterId, topicId } = req.params;
    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    const topic = chapter.topics.find(t => t.id === topicId);
    if (!topic) return res.status(404).json({ message: "Temat nie znaleziony" });

    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
