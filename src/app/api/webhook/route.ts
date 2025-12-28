import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { streamVideo } from "@/lib/stream-video";
import {
  CallSessionStartedEvent,
  CallSessionParticipantLeftEvent,
  CallEndedEvent,
  CallTranscriptionReadyEvent,
  CallRecordingReadyEvent,
} from "@stream-io/node-sdk";
import { and, eq, isNull, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function verifySignatureWithSDK(body: string, signature: string) {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");

  if (!signature || !apiKey) {
    console.log("Missing signature or API key");

    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 }
    );
  }

  const body = await req.text();

  if (!verifySignatureWithSDK(body, signature)) {
    console.log("Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    console.log("Invalid JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      console.log("Missing meetingId");

      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, "completed")),
          not(eq(meetings.status, "active")),
          not(eq(meetings.status, "cancelled")),
          not(eq(meetings.status, "processing"))
        )
      );

    if (!existingMeeting) {
      console.log("Meeting not found");

      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await db
      .update(meetings)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      console.log("agent not found");
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const call = streamVideo.video.call("default", meetingId);

    // const realtimeClient = await streamVideo.video.connectOpenAi({
    //   call,
    //   openAiApiKey: process.env.OPENAI_API_KEY!,
    //   agentUserId: existingAgent.id,
    // });

    // realtimeClient.updateSession({
    //   instructions: existingAgent.instructions,
    // });

    try {
      const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingAgent.id,
      });

      realtimeClient.updateSession({
        instructions: existingAgent.instructions,
      });
    } catch (err) {
      console.error("🔥 OpenAI connection error");
      console.error(err);

      // VERY important: log structured error if available
      if (typeof err === "object" && err !== null) {
        console.error("OpenAI error details:", JSON.stringify(err, null, 2));
      }

      throw err; // rethrow so you can see it fail loudly (optional)
    }
  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1];

    if (!meetingId) {
      console.log("Missing meetingId 2");

      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    const call = streamVideo.video.call("default", meetingId);
    await call.end();
  } else if (eventType === "call.session_ended") {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    await db
      .update(meetings)
      .set({ status: "processing", endedAt: new Date() })
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
  } else if (eventType === "call.transcription_ready") {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid?.split(":")[1];

    // Always ACK Stream
    if (!meetingId) {
      return NextResponse.json({ ok: true });
    }

    const [updatedMeeting] = await db
      .update(meetings)
      .set({ transcriptionUrl: event.call_transcription.url })
      .where(
        and(
          eq(meetings.id, meetingId),
          isNull(meetings.transcriptionUrl) // idempotency guard
        )
      )
      .returning();

    // If already processed, do nothing
    if (!updatedMeeting) {
      return NextResponse.json({ ok: true });
    }

    await inngest.send({
      id: `meeting-processing-${updatedMeeting.id}`,
      name: "meetings/processing",
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcriptionUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } // else if (eventType === "call.transcription_ready") {
  //   const event = payload as CallTranscriptionReadyEvent;
  //   const meetingId = event.call_cid.split(":")[1];

  //   if (!meetingId) {
  //     return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
  //   }

  //   const [updatedMeeting] = await db
  //     .update(meetings)
  //     .set({ transcriptionUrl: event.call_transcription.url })
  //     .where(eq(meetings.id, meetingId))
  //     .returning();

  //   if (!updatedMeeting) {
  //     return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  //   }

  //   await inngest.send({
  //     name: "meetings/processing",
  //     data: {
  //       meetingId: updatedMeeting.id,
  //       transcriptUrl: updatedMeeting.transcriptionUrl,
  //     },
  //   });
  // }
  else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid.split(":")[1];

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    await db
      .update(meetings)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(eq(meetings.id, meetingId));

    // TODO : Call ingest background job to summarise the transcript
  }

  console.log(eventType);
  return NextResponse.json({ status: "ok" });
}
