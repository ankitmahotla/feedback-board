import { useState } from "react";
import Button from "./Button";
import Popup from "./Popup";
import axios from "axios";
import Attachment from "./Attachment";
import AttachFilesButton from "./AttachFilesButton";
import { signIn, useSession } from "next-auth/react";

export default function FeedbackForm({ setShow, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploads, setUploads] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  async function handleCreatePost(e) {
    e.preventDefault();
    if (session) {
      setIsSubmitting(true);
      axios.post("/api/feedback", { title, description, uploads }).then(() => {
        setShow(false);
        onCreate();
      });
      setIsSubmitting(false);
    } else {
      localStorage.setItem(
        "post_after_login",
        JSON.stringify({ title, description, uploads })
      );
      await signIn("google");
    }
  }

  function handleRemoveUploadFile(ev, link) {
    ev.preventDefault();
    setUploads((prev) => {
      return prev.filter((val) => val !== link);
    });
  }

  function addNewUploads(newLinks) {
    setUploads((prevLinks) => {
      return [...prevLinks, ...newLinks];
    });
  }

  return (
    <Popup setShow={setShow} title={"Make a suggestion"}>
      <form className="p-8">
        <label className="block mt-4 mb-1">Title</label>
        <input
          className="w-full border p-2 rounded-md"
          type="text"
          placeholder="A short, descriptive title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="block mt-4 mb-1">Details</label>
        <textarea
          className="w-full border p-2 rounded-md h-24"
          placeholder="Please include any details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {uploads?.length > 0 && (
          <div>
            <label className="block mt-2 mb-1 text-slate-700">
              Attachments
            </label>
            <div className="flex gap-3">
              {uploads.map((link) => (
                <Attachment
                  showRemoveButton={true}
                  link={link}
                  handleRemoveUploadFile={(ev, link) =>
                    handleRemoveUploadFile(ev, link)
                  }
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2 justify-end">
          <AttachFilesButton onNewFiles={addNewUploads} />
          <Button onClick={handleCreatePost} primary disabled={isSubmitting}>
            {session ? "Create Post" : "Login and Post"}
          </Button>
        </div>
      </form>
    </Popup>
  );
}
