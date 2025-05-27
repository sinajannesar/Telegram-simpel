import { z } from 'zod';

export const formDataSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phonenumber: z.string().min(10, 'Phone number must be at least 10 digits'),
});