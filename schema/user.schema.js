import { object, string } from "zod";

export const createUserSchema = object({
  body: object({
    firstName: string({ required_error: "First Name is required" }),
    lastName: string({ required_error: "Last Name is required" }),
    email: string({ required_error: "Email is required" }).email(
      "Invalid email"
    ),
    password: string({ required_error: "Password is required" })
      .min(5, "Password must be more than 8 characters")
      .max(150, "Password must be less than 150 characters"),
    passwordConfirm: string({ required_error: "Please confirm your password" }),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  }),
});

export const loginUserSchema = object({
  body: object({
    email: string({ required_error: "Email is required" }).email(
      "Invalid email or password"
    ),
    password: string({ required_error: "Password is required" }).min(
      8,
      "Invalid email or password"
    ),
  }),
});

export const resetPasswordSchema = object({
  body: object({
    password: string({ required_error: "Password is required" })
      .min(5, "Password must be more than 8 characters")
      .max(150, "Password must be less than 150 characters"),
    passwordConfirm: string({ required_error: "Please confirm your password" }),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  }),
});

export const changePasswordSchema = object({
  body: object({
    email: string({ required_error: "Email is required" }).email(
      "Invalid email"
    ),
    oldPassword: string({ required_error: "Please confirm your old password" })
      .min(5, "Password must be more than 8 characters")
      .max(150, "Password must be less than 150 characters"),
    newPassword: string({ required_error: "Please confirm your new password" }),
  }).refine((data) => data.oldPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Old and New Passwords are same",
  }),
});

// export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];
// export type LoginUserInput = TypeOf<typeof loginUserSchema>["body"];
