import { z } from "zod";

const SettingsSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(50),
});

export default SettingsSchema;
