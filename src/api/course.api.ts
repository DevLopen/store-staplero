import { Course } from "@/types/course.types";

export const getCourse = async (courseId: string): Promise<Course> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        credentials: "include",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log("Fetch status:", res.status);
    const data = await res.json();
    console.log("Course data:", data);
    if (!res.ok) throw new Error("Fehler beim Laden des Kurses");
    return data;
};

