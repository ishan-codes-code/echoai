'use client'

import { ErrorState } from "@/components/error-state"
import { LoadingState } from "@/components/loading-state"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import MeetingIdViewHeader from "../components/meeting-id-view-header"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"
import UpdateMeetingDialog from "../components/update-meeting-dialog"
import { useState } from "react"

interface Props {
    meetingId: string
}

const MeetingIdView = ({ meetingId }: Props) => {
    const router = useRouter()
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const { data } = useSuspenseQuery(trpc.meetings.getOne.queryOptions({ id: meetingId }))

    const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false)

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Are you sure?",
        "The following action will remove this meeting"
    )


    const removeMeeting = useMutation(trpc.meetings.remove.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}))
            //TODO: free tier usage
            router.push("/meetings")
        },
        // onError: (error) => {
        //     toast.error(error.message)
        // }
    }))

    const handleRemoveAgent = async () => {
        const ok = await confirmRemove();

        if (!ok) return

        await removeMeeting.mutateAsync({ id: meetingId })

    }

    return (
        <>
            <RemoveConfirmation />
            <UpdateMeetingDialog
                open={updateMeetingDialogOpen}
                onOpenChange={setUpdateMeetingDialogOpen}
                initialValues={data}
            />
            <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <MeetingIdViewHeader
                    meetingId={meetingId}
                    meetingName={data.name}
                    onEdit={() => setUpdateMeetingDialogOpen(true)}
                    onRemove={handleRemoveAgent}
                />
            </div>
        </>
    )
}

export const MeetingIdViewLoading = () => {
    return <LoadingState title="Loading Meeting" description="This may take few seconds." />
}
export const MeetingIdViewError = () => {
    return <ErrorState title="Error Loading Meeting" description="Something went wrong" />
}



export default MeetingIdView
