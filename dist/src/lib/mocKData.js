// Mock users data
export const mockUsers = [
    {
        id: 1,
        email: "sinajannesar99@gmail.com",
        password: "123456",
        firstname: "احمد",
        lastname: "احمدی",
        createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
        id: 2,
        email: "user2@example.com",
        password: "123456",
        firstname: "سارا",
        lastname: "محمدی",
        createdAt: "2024-01-02T00:00:00.000Z"
    }
];
export const findUserByEmail = (email) => {
    return mockUsers.find(user => user.email === email);
};
export const findUserByCredentials = (email, password) => {
    return mockUsers.find(user => user.email === email && user.password === password);
};
export const createUser = (userData) => {
    const newUser = Object.assign(Object.assign({}, userData), { id: Date.now(), createdAt: new Date().toISOString() });
    mockUsers.push(newUser);
    return newUser;
};
