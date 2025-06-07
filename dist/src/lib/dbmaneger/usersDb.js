import fs from 'fs/promises';
import path from 'path';
const DB_PATH = path.join(process.cwd(), 'data', 'users.json');
export async function initUsersDb() {
    try {
        await fs.access(DB_PATH);
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch (_a) {
        const initialData = { users: [] };
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}
export async function writeUsersDb(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}
