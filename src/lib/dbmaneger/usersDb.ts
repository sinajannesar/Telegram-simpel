import fs from 'fs/promises';
import path from 'path';


// Ensure this file exports the User type
export type User = {
  id: string;
  name: string;
};

interface UsersDB {
  users: User[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

export async function initUsersDb(): Promise<UsersDB> {
  try {
    await fs.access(DB_PATH);
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    const initialData: UsersDB = { users: [] };
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

export async function writeUsersDb(data: UsersDB): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}