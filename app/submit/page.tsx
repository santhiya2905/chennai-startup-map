import type { Metadata } from "next";
import SubmitStartupForm from "@/components/submit-startup-form";

export const metadata: Metadata = {
  title: "Submit a startup — Chennai Startup Map",
  description: "Suggest a Chennai startup for inclusion in the Chennai Startup Map.",
};

export default function SubmitPage() {
  return <SubmitStartupForm />;
}
