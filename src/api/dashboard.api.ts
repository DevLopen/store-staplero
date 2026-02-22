import apiFetch from "./http";
import { DashboardData } from "@/types/dashboard";

export const getDashboard = (): Promise<DashboardData> =>
  apiFetch("/dashboard");

export const getCertificate = (courseId: string) =>
  apiFetch(`/certificates/${courseId}`);

export const downloadCertificateUrl = (courseId: string): string => {
  const token = localStorage.getItem("token");
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return `${base}/certificates/${courseId}/download?token=${token}`;
};

export const verifyCertificate = (code: string) =>
  apiFetch(`/certificates/verify/${code}`);
