import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Vote } from "@/app/models/Vote";
import mongoose from "mongoose";
import { Feedback } from "@/app/models/Feedback";

async function recountVotes(feedbackId) {
  const count = await Vote.countDocuments({ feedbackId });
  await Feedback.updateOne({ _id: feedbackId }, { votesCountCached: count });
}

export async function POST(request) {
  mongoose.connect(process.env.MONGODB_URI);
  const jsonBody = await request.json();
  const { feedbackId } = jsonBody;
  const session = await getServerSession(authOptions);
  const { email: userEmail } = session.user;
  const existingVote = await Vote.findOne({ feedbackId, userEmail });

  if (existingVote) {
    await Vote.findByIdAndDelete(existingVote._id);
    await recountVotes(feedbackId);
    return Response.json(existingVote);
  } else {
    const voteDoc = await Vote.create({ feedbackId, userEmail });
    await recountVotes(feedbackId);
    return Response.json(voteDoc);
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  if (url.searchParams.get("feedbackIds")) {
    const feedbackIds = url.searchParams.get("feedbackIds").split(",");
    mongoose.connect(process.env.MONGODB_URI);
    const votes = await Vote.find({ feedbackId: { $in: feedbackIds } });
    return Response.json(votes);
  }
  return Response.json([]);
}
