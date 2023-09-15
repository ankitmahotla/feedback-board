import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import CommentForm from "./CommentForm";
import axios from "axios";
import Attachment from "./Attachment";
import TimeAgo from "timeago-react";
import { useSession } from "next-auth/react";
import AttachFilesButton from "./AttachFilesButton";

export default function Comments({ feedbackId }) {
  const [comments, setComments] = useState([]);
  const { data: session } = useSession();
  const [isEditMode, setIsEditMode] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newUploads, setNewUploads] = useState([]);
  useEffect(() => {
    fetchComments();
  }, []);

  function fetchComments() {
    axios.get("/api/comment?feedbackId=" + feedbackId).then((res) => {
      setComments(res.data);
    });
  }

  function handleEdit(comment) {
    setIsEditMode(comment);
    setNewComment(comment.text);
    setNewUploads(comment.uploads);
  }

  function handleCancel() {
    setNewComment("");
    setNewUploads([]);
    setIsEditMode(null);
  }

  function handleRemoveUploadFile(e, link) {
    e.preventDefault();
    setNewUploads((prev) => prev.filter((l) => l !== link));
  }

  function handleNewLinks(links) {
    setNewUploads((prev) => [...prev, ...links]);
  }

  async function handleSave() {
    const newData = { text: newComment, uploads: newUploads };
    await axios.put("/api/comment", { id: isEditMode._id, ...newData });
    setComments((prev) => {
      return prev.map((comment) => {
        if (comment._id === isEditMode._id) {
          return { ...comment, ...newData };
        } else return comment;
      });
    });
    setIsEditMode(null);
    setNewComment("");
    setNewUploads([]);
  }
  return (
    <div className="p-8">
      {comments?.length > 0 &&
        comments.map((comment) => {
          const editingThis = isEditMode?._id === comment?._id;
          const notEditingThis = isEditMode?._id !== comment?._id;
          return (
            <div className="mb-8">
              <div className="flex gap-4">
                <Avatar url={comment.user.image} />
                <div>
                  {editingThis && (
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="border p-2 block w-full"
                    />
                  )}
                  {notEditingThis && (
                    <p className="text-gray-600">{comment.text}</p>
                  )}
                  <div className="text-gray-400 mt-2 text-sm">
                    {comment.user.name} &nbsp;&middot;&nbsp;{" "}
                    <TimeAgo datetime={comment.createdAt} locale="en_US" />
                    {notEditingThis &&
                      !!comment.user.email &&
                      comment.user.email === session?.user?.email && (
                        <>
                          &nbsp;&middot;&nbsp;
                          <span
                            onClick={() => handleEdit(comment)}
                            className="hover:underline cursor-pointer"
                          >
                            Edit
                          </span>
                        </>
                      )}
                    {editingThis && (
                      <>
                        &nbsp;&middot;&nbsp;
                        <span
                          className="hover:underline cursor-pointer"
                          onClick={handleCancel}
                        >
                          Cancel
                        </span>
                        &nbsp;&middot;&nbsp;
                        <span
                          onClick={handleSave}
                          className="hover:underline cursor-pointer"
                        >
                          Save Changes
                        </span>
                      </>
                    )}
                  </div>
                  {(editingThis ? newUploads : comment.uploads)?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {(editingThis ? newUploads : comment.uploads).map(
                        (link) => (
                          <Attachment
                            link={link}
                            handleRemoveUploadFile={handleRemoveUploadFile}
                            showRemoveButton={editingThis}
                          />
                        )
                      )}
                    </div>
                  )}
                  {editingThis && (
                    <div className="mt-2">
                      <AttachFilesButton onNewFiles={handleNewLinks} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      {!isEditMode && (
        <CommentForm feedbackId={feedbackId} onPost={fetchComments} />
      )}
    </div>
  );
}
