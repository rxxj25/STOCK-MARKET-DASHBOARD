import { betterAuth } from "better-auth";
import { mongodbAdapter} from "better-auth/adapters/mongodb";
import { connectToDatabase} from "@/database/mongoose";
import { nextCookies} from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
    if(authInstance) return authInstance;

    try {
        const mongoose = await connectToDatabase();
        
        if(!mongoose) {
            console.warn('Running without database - auth features will be limited');
            // Better Auth requires a database adapter, so we'll create a minimal instance
            // that will fail gracefully when used
            authInstance = betterAuth({
                secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret',
                baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
                emailAndPassword: {
                    enabled: false,
                },
                plugins: [nextCookies()],
            });
            return authInstance;
        }

        const db = mongoose.connection.db;

        if(!db) {
            console.warn('MongoDB connection not found - running without database');
            authInstance = betterAuth({
                secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret',
                baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
                emailAndPassword: {
                    enabled: false,
                },
                plugins: [nextCookies()],
            });
            return authInstance;
        }

        authInstance = betterAuth({
            database: mongodbAdapter(db as any),
            secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret',
            baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
            emailAndPassword: {
                enabled: true,
                disableSignUp: false,
                requireEmailVerification: false,
                minPasswordLength: 8,
                maxPasswordLength: 128,
                autoSignIn: true,
            },
            plugins: [nextCookies()],
        });

        return authInstance;
    } catch (error) {
        console.warn('Error initializing auth, creating fallback instance:', error);
        // Return a minimal auth instance that will handle errors gracefully
        authInstance = betterAuth({
            secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret',
            baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
            emailAndPassword: {
                enabled: false,
            },
            plugins: [nextCookies()],
        });
        return authInstance;
    }
}

// Initialize auth, but handle errors gracefully
let auth: ReturnType<typeof betterAuth>;
try {
    auth = await getAuth();
} catch (error) {
    console.warn('Failed to initialize auth on module load:', error);
    // Create a minimal fallback
    auth = betterAuth({
        secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret',
        baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
        emailAndPassword: {
            enabled: false,
        },
        plugins: [nextCookies()],
    });
}

export { auth };
