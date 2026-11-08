export type FormState =
  | {
      errors?: Record<string, string>;
      values?: Record<string, string>;
      message?: string;
    }
  | undefined;
