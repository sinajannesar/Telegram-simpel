export interface User {
  id: number;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  roomId?: string | number; // اضافه کردن roomId برای ذخیره اتاق آخر کاربر
  createdAt: string;
}

// Mock users data
export const mockUsers: User[] = [
  {
    id: 1,
    email: "sinajannesar99@gmail.com",
    password: "123456",
    firstname: "احمد",
    lastname: "احمدی",
    roomId: "room_1", // اتاق پیش‌فرض
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    email: "user2@example.com", 
    password: "123456",
    firstname: "سارا",
    lastname: "محمدی",
    roomId: "room_2", // اتاق پیش‌فرض
    createdAt: "2024-01-02T00:00:00.000Z"
  }
];

export const findUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email === email);
};

export const findUserByCredentials = (email: string, password: string): User | undefined => {
  return mockUsers.find(user => user.email === email && user.password === password);
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  const newUser: User = {
    ...userData,
    id: Date.now(),
    roomId: `room_${Date.now()}`, // تولید roomId منحصر به فرد برای کاربر جدید
    createdAt: new Date().toISOString()
  };
  mockUsers.push(newUser);
  return newUser;
};

export const updateUserRoom = (email: string, roomId: string | number): void => {
  const user = findUserByEmail(email);
  if (user) {
    user.roomId = roomId;
  }
};

export const getUserDisplayName = (user: User): string => {
  return `${user.firstname} ${user.lastname}`;
};