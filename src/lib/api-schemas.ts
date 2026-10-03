import { z } from "zod";

export const planInputSchema = z.object({
  text: z.string().trim().min(1).max(120_000),
  examDate: z.string().date(),
  dailyMinutes: z.number().int().min(5).max(480),
});

export const planResponseSchema = z.object({
  bits: z.array(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    takeaway: z.string().min(1),
    weight: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })).min(1),
});

export const bitInputSchema = z.object({
  id: z.string().optional(),
  planId: z.string().optional(),
  order: z.number().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  takeaway: z.string().optional(),
  estMinutes: z.number().optional(),
  weight: z.number().optional(),
  scheduledDate: z.string().optional(),
  status: z.enum(["todo", "done"]).optional(),
}).passthrough();

export const cardsInputSchema = z.object({ bit: bitInputSchema });

export const cardsResponseSchema = z.object({
  cards: z.array(z.object({
    front: z.string().min(1),
    back: z.string().min(1),
    sourceSnippet: z.string().min(1),
  })).min(3).max(5),
});

export const quizInputSchema = z.object({ bit: bitInputSchema });

const quizQuestionSchema = z.object({
  type: z.enum(["mcq", "tf", "fill", "short"]),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).optional(),
  answer: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  topic: z.string().min(1),
});

export const quizResponseSchema = z.object({
  questions: z.array(quizQuestionSchema).length(4).superRefine((questions, context) => {
    const counts = questions.reduce<Record<string, number>>((result, question) => {
      result[question.type] = (result[question.type] ?? 0) + 1;
      return result;
    }, {});
    if (counts.mcq !== 2 || counts.tf !== 1 || counts.fill !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Questions must contain 2 mcq, 1 tf, and 1 fill item." });
    }
    questions.forEach((question, index) => {
      if (question.type === "mcq" && question.options?.length !== 4) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [index, "options"], message: "MCQ questions require exactly 4 options." });
      }
      if (question.type === "tf" && question.options?.length !== 2) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [index, "options"], message: "True/false questions require exactly 2 options." });
      }
      if (question.type === "fill" && question.options) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [index, "options"], message: "Fill questions must not include options." });
      }
    });
  }),
});

export const refineInputSchema = z.object({
  card: z.object({
    front: z.string().min(1),
    back: z.string().min(1),
    sourceSnippet: z.string().optional(),
  }).passthrough(),
  action: z.enum(["explain", "example", "simplify", "split"]),
});

export const refineResponseSchema = z.object({ result: z.string().min(1) });

export const extractResponseSchema = z.object({
  text: z.string(),
  pages: z.number().int().positive(),
});
