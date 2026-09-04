import { z } from "zod";
import { zOptText, zRequiredText } from "./shared";

const emailOpt = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z
    .union([z.string().email("Enter a valid email"), z.literal("")])
    .nullish()
    .transform((v) => (v ? v : null)),
);

export const contactSchema = z.object({
  name: zRequiredText("Name"),
  address: zOptText,
  tin: zOptText,
  phone: zOptText,
  email: emailOpt,
  notes: zOptText,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const vehicleSchema = z.object({
  description: zRequiredText("Description"),
  reg_no: zOptText,
  make: zOptText,
  model: zOptText,
  customer_id: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().uuid().nullable(),
  ),
  notes: zOptText,
});
export type VehicleInput = z.infer<typeof vehicleSchema>;
