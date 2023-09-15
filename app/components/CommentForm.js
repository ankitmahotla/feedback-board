import { useState } from "react";
import Button from "./Button";
import AttachFilesButton from "./AttachFilesButton";
import Attachment from "./Attachment";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";

export default function CommentForm({ feedbackId, onPost }) {
  const [commentText, setCommentText] = useState("");
  const [uploads, setUploads] = useState([]);
  const { data: session } = useSession();

  function addNewUploads(newLinks) {
    setUploads((prevLinks) => {
      return [...prevLinks, ...newLinks];
    });
  }

  function removeUpload(ev, link) {
    ev.preventDefault();
    ev.stopPropagation();
    setUploads((prev) => {
      return prev.filter((val) => val !== link);
    });
  }

  async function handleCommentSubmit(ev) {
    ev.preventDefault();
    const commentData = {
      text: commentText,
      uploads,
      feedbackId,
    };
    if (session) {
      await axios.post("/api/comment", commentData);
      setCommentText("");
      setUploads([]);
      onPost();
    } else {
      localStorage.setItem("comment_to_post", JSON.stringify(commentData));
      signIn("google");
    }
  }

  return (
    <form>
      <textarea
        className="border rounded-md w-full p-2"
        placeholder="Let us know what you think..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
      />
      {uploads?.length > 0 && (
        <div className="">
          <div className="text-sm text-gray-600 mb-2 mt-3">Files:</div>
          <div className="flex gap-3">
            {uploads.map((link) => {
              return (
                <Attachment
                  link={link}
                  handleRemoveUploadFile={(ev, link) => removeUpload(ev, link)}
                  showRemoveButton={true}
                />
              );
            })}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 mt-2">
        <AttachFilesButton onNewFiles={addNewUploads} />
        <Button
          onClick={handleCommentSubmit}
          primary
          disabled={commentText === ""}
        >
          {session ? "Comment" : "Login to comment"}
        </Button>
      </div>
    </form>
  );
}
