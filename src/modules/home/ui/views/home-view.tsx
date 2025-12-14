'use client'

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";



const HomeView = () => {
    const router = useRouter()
    const { data: session, } = authClient.useSession()


    if (!session) {
        return (<div className="p-4 m-auto mt-22 max-w-xl ">
            <p><i>Loading...</i></p>
        </div>)
    }

    return (<div className="p-4 m-auto mt-22 max-w-xl">
        <p>Welcome, {session.user?.name || session.user?.email}!</p>
        <Button onClick={() => authClient.signOut({
            fetchOptions: {
                onSuccess: () => router.push('/sign-in'),
            }
        })}>Sign out</Button>
    </div>)

}


export default HomeView
