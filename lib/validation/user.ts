import { z } from "zod";
import { zOptText } from "./shared";

export const staffUserSchema = z.object({
  full_name: zOptText,
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.string().email("Enter a valid email"),
  ),
  password: z.string().min(8, "Use at least 8 characters"),
});
export type StaffUserInput = z.infer<typeof staffUserSchema>;
