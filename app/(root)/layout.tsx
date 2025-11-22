import Header from "@/components/Header";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    // Check if database is available
    const hasDatabase = !!process.env.MONGODB_URI;
    
    let session = null;
    try {
        session = await auth.api.getSession({ headers: await headers() });
    } catch (error) {
        console.warn('Auth session check failed (running without database):', error);
    }

    // Only redirect to sign-in if database is configured and no session exists
    if(hasDatabase && !session?.user) {
        redirect('/sign-in');
    }

    // Use mock user if no database/auth
    const user = session?.user ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    } : {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
    };

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}
export default Layout
