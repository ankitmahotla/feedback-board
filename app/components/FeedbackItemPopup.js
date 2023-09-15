import axios from "axios";
import Button from "./Button";
import Comments from "./Comments";
import Popup from "./Popup";
import { MoonLoader } from "react-spinners";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Tick from "./icons/Tick";
import Attachment from "./Attachment";
import Edit from "./icons/Edit";
import AttachFilesButton from "./AttachFilesButton";
import Trash from "./icons/Trash";

export default function FeedbackItemPopup({
  _id,
  title,
  setShow,
  description,
  votes,
  onVotesChange,
  uploads,
  user,
  onUpdate,
}) {
  const [votesLoading, setVotesLoading] = useState(false);
  function handleVoteButtonClick() {
    setVotesLoading(true);
    axios.post("/api/vote", { feedbackId: _id }).then(async () => {
      await onVotesChange();
      setVotesLoading(false);
    });
  }
  const { data: session } = useSession();
  const userVoted = votes?.find((v) => v.userEmail === session?.user?.email);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [newDescription, setNewDescription] = useState(description);
  const [newUploads, setNewUploads] = useState(uploads);

  function handleEdit() {
    setIsEditMode(true);
  }

  function handleRemoveUploadFile(ev, link) {
    ev.preventDefault();
    setNewUploads(newUploads.filter((u) => u !== link));
  }

  function handleCancel() {
    setIsEditMode(false);
    setNewTitle(title);
    setNewDescription(description);
    setNewUploads(uploads);
  }

  function handleNewUploads(links) {
    setNewUploads([...newUploads, ...links]);
  }

  function handleSave() {
    axios
      .put("/api/feedback", {
        id: _id,
        title: newTitle,
        description: newDescription,
        uploads: newUploads,
      })
      .then(() => {
        setIsEditMode(false);
        onUpdate({
          title: newTitle,
          description: newDescription,
          uploads: newUploads,
        });
      });
  }

  return (
    <Popup title={""} setShow={setShow}>
      <div className="p-8 pb-2">
        {isEditMode ? (
          <input
            className="block w-full border rounded-md mb-2 p-2"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        ) : (
          <h2 className="text-lg font-bold mb-2"> {title}</h2>
        )}
        {isEditMode ? (
          <textarea
            className="block w-full border rounded-md mb-2 p-2"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        ) : (
          <p
            className="text-gray-600"
            dangerouslySetInnerHTML={{
              __html: description.replace(/\n/gi, "<br />"),
            }}
          />
        )}

        {uploads?.length > 0 && (
          <div className="mt-4">
            <span className="text-sm text-gray-600"> Attachments:</span>
            <div className="flex gap-2">
              {(isEditMode ? newUploads : uploads).map((link) => (
                <Attachment
                  link={link}
                  showRemoveButton={isEditMode}
                  handleRemoveUploadFile={handleRemoveUploadFile}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end px-8 py-2 border-b">
        {isEditMode && (
          <>
            <AttachFilesButton onNewFiles={handleNewUploads} />
            <Button onClick={handleCancel}>
              <Trash className="w-4 h-4" /> Cancel
            </Button>
            <Button primary onClick={handleSave}>
              Save Changes
            </Button>
          </>
        )}
        {!isEditMode && session?.user?.email === user?.email && (
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4" /> Edit
          </Button>
        )}

        {!isEditMode && (
          <Button primary onClick={handleVoteButtonClick}>
            {votesLoading ? (
              <MoonLoader size={18} />
            ) : (
              <>
                {userVoted ? (
                  <>
                    <Tick /> Upvoted {votes?.length || "0"}
                  </>
                ) : (
                  <>
                    <span className="triangle-vote-up"></span>Upvotes{" "}
                    {votes?.length || "0"}
                  </>
                )}
              </>
            )}
          </Button>
        )}
      </div>
      <Comments feedbackId={_id} />
    </Popup>
  );
}
