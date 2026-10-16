import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and de-duplicate conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;

export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Run a function and return a result instead of throwing. */
export function tryCatch<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() } as Result<T>;
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

/** Await a function and return a result instead of rejecting. */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() } as Result<T>;
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}
