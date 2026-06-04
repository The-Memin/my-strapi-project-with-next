"use server"

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import z from "zod";
import { registerUserService } from "@/lib/strapi";
import { SignupFormSchema, type FormState } from "@/validations/auth";

const cookieConfig = {
    maxAge: 60 * 60 * 24 *7, // 1 week
    path: "/",
    httpOnly: true, // only accessibleby the server
    domain: process.env.NODE_HOST ?? 'localhost',
    secure: process.env.NODE_ENV === 'production'
    

}

export async function registerUserAction(prevState: FormState, formData: FormData): Promise<FormState>{
    console.log("Hello from register user action")

    const fields = {
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        email:    formData.get('email')    as string,
    }

    const validateFields = SignupFormSchema.safeParse(fields);

    if (!validateFields.success) {
        const flattenedErrors = z.flattenError(validateFields.error);
        console.log("Validation errors: ", flattenedErrors.fieldErrors);
        return {
            success: false,
            message: "Validation error",
            strapiErrors: null,
            zodErrors: flattenedErrors.fieldErrors,
            data: fields
        }
    }

    const response = await registerUserService(validateFields.data);

    if (!response || response.error) {
        return {
            success: false,
            message: "Registration error",
            strapiErrors: response.error,
            zodErrors: null,
            data: fields
        }
    }

    const cookieStore = await cookies()
    cookieStore.set('jwt', response.jwt, cookieConfig)

    redirect('/dashboard')
}