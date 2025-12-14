'use client'

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";



const HomeView = () => {
    const trpc = useTRPC()
    const { data } = useQuery(trpc.hello.queryOptions({ text: 'Antonio' }))

    return (
        <div className="p-4 m-auto mt-22 max-w-xl">
            {data?.greeting}
        </div>
    )

}


export default HomeView
