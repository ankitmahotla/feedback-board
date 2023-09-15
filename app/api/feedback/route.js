import { Feedback } from "@/app/models/Feedback";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Comment } from "@/app/models/Comment";

export async function POST(req) {
  const jsonBody = await req.json();
  const { title, description, uploads } = jsonBody;
  const mongoUrl = process.env.MONGODB_URI;
  mongoose.connect(mongoUrl);
  const session = await getServerSession(authOptions);
  const userEmail = session.user.email;
  const feedbackDoc = await Feedback.create({
    title,
    description,
    uploads,
    userEmail,
  });
  return Response.json(feedbackDoc);
}

export async function PUT(req) {
  const jsonBody = await req.json();
  const { title, description, uploads, id } = jsonBody;
  const mongoUrl = process.env.MONGODB_URI;
  mongoose.connect(mongoUrl);
  const session = await getServerSession(authOptions);
  if (!session) return Response.json(false);
  const newFeedbackDoc = await Feedback.updateOne(
    { _id: id, userEmail: session.user.email },
    { title, description, uploads }
  );
  return Response.json(newFeedbackDoc);
}

export async function GET(req) {
  const url = new URL(req.url);
  const mongoUrl = process.env.MONGODB_URI;
  mongoose.connect(mongoUrl);

  if (url.searchParams.get("id")) {
    return Response.json(await Feedback.findById(url.searchParams.get("id")));
  } else {
    const sortParam = url.searchParams.get("sort");
    const loadedRows = url.searchParams.get("loadedRows");
    const searchPhrase = url.searchParams.get("searchPhrase");
    let sortDef;
    if (sortParam === "latest") {
      sortDef = { createdAt: -1 };
    }
    if (sortParam === "oldest") {
      sortDef = { createdAt: 1 };
    }
    if (sortParam === "votes") {
      sortDef = { votesCountCached: -1 };
    }
    let filter = null;
    if (searchPhrase) {
      const comments = await Comment.find(
        { text: { $regex: ".*" + searchPhrase + ".*" } },
        "feedbackId",
        {
          limit: 20,
        }
      );
      filter = {
        $or: [
          { title: { $regex: ".*" + searchPhrase + ".*" } },
          { description: { $regex: ".*" + searchPhrase + ".*" } },
          { _id: comments.map((c) => c.feedbackId) },
        ],
      };
    }
    return Response.json(
      await Feedback.find(filter, null, {
        sort: sortDef,
        skip: loadedRows,
        limit: 10,
      }).populate("user")
    );
  }
}
