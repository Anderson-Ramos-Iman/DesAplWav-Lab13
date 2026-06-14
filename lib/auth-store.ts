import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  provider: "credentials" | "github";
};

type LoginAttempt = {
  count: number;
  lockedUntil?: string;
  lastFailedAt?: string;
};

type AuthStore = {
  users: StoredUser[];
  loginAttempts: Record<string, LoginAttempt>;
};

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "auth-store.json");
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

const defaultStore: AuthStore = {
  users: [],
  loginAttempts: {},
};

let queue = Promise.resolve();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureStoreFile() {
  await mkdir(STORE_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    await writeFile(STORE_FILE, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<AuthStore> {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf8");
  return JSON.parse(raw) as AuthStore;
}

async function writeStore(store: AuthStore) {
  await ensureStoreFile();
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function withStore<T>(task: (store: AuthStore) => Promise<T>) {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = await task(store);
    await writeStore(store);
    return result;
  });

  queue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

function getAttempt(store: AuthStore, email: string): LoginAttempt {
  const key = normalizeEmail(email);
  return store.loginAttempts[key] ?? { count: 0 };
}

export async function findUserByEmail(email: string) {
  const key = normalizeEmail(email);
  const store = await readStore();
  return store.users.find((user) => user.email === key) ?? null;
}

export async function createCredentialUser(params: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return withStore(async (store) => {
    const email = normalizeEmail(params.email);
    const existing = store.users.find((user) => user.email === email);

    if (existing) {
      throw new Error("USER_EXISTS");
    }

    const user: StoredUser = {
      id: randomUUID(),
      name: params.name.trim(),
      email,
      passwordHash: params.passwordHash,
      createdAt: new Date().toISOString(),
      provider: "credentials",
    };

    store.users.push(user);
    delete store.loginAttempts[email];
    return user;
  });
}

export async function recordFailedLogin(email: string) {
  return withStore(async (store) => {
    const key = normalizeEmail(email);
    const current = getAttempt(store, key);
    const count = current.count + 1;
    const lockedUntil =
      count >= MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCK_WINDOW_MS).toISOString()
        : current.lockedUntil;

    store.loginAttempts[key] = {
      count,
      lockedUntil,
      lastFailedAt: new Date().toISOString(),
    };

    return store.loginAttempts[key];
  });
}

export async function clearLoginAttempts(email: string) {
  return withStore(async (store) => {
    const key = normalizeEmail(email);
    delete store.loginAttempts[key];
    return true;
  });
}

export async function getLoginAttemptStatus(email: string) {
  const key = normalizeEmail(email);
  const store = await readStore();
  const attempt = store.loginAttempts[key];

  if (!attempt) {
    return {
      attempts: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      locked: false,
      lockedUntil: null as string | null,
    };
  }

  const lockedUntil = attempt.lockedUntil ?? null;
  const locked = Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
  const remainingAttempts = Math.max(MAX_LOGIN_ATTEMPTS - attempt.count, 0);

  return {
    attempts: attempt.count,
    remainingAttempts,
    locked,
    lockedUntil,
  };
}

export function isStillLocked(lockedUntil?: string | null) {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
}
