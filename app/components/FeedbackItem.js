"use client";
import { useState } from "react";
import Popup from "./Popup";
import Button from "./Button";
import { signIn, useSession } from "next-auth/react";
import axios from "axios";
import { MoonLoader } from "react-spinners";

export default function FeedbackItem({
  onOpen,
  _id,
  title,
  description,
  votes,
  onVotesChange,
}) {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isVotesLoading, setIsVotesLoading] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.email;
  function handleVote(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    if (!isLoggedIn) {
      localStorage.setItem("Going to vote", _id);
      setShowLoginPopup(true);
    } else {
      setIsVotesLoading(true);
      axios.post("/api/vote", { feedbackId: _id }).then(async (res) => {
        await onVotesChange();
        setIsVotesLoading(false);
      });
    }
  }

  async function handleGoogleLogin(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    await signIn("google");
  }
  const shortDesc = description.substring(0, 200);
  const userVoted = !!votes?.find((v) => v.userEmail === session?.user?.email);
  return (
    <a
      href=""
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      className="my-8 flex gap-8 items-center"
    >
      <div className="flex-grow">
        <h2 className="font-bold">{title}</h2>
        <p className="text-gray-600 text-sm ">
          {shortDesc}
          {shortDesc.length < description.length && "..."}
        </p>
      </div>
      <div>
        {showLoginPopup && (
          <Popup
            narrow
            setShow={setShowLoginPopup}
            title={"Login to submit your vote"}
          >
            <Button onClick={handleGoogleLogin} primary>
              Login with Google
            </Button>
          </Popup>
        )}

        <Button
          primary={userVoted}
          onClick={handleVote}
          className="shadow-md border"
        >
          {!isVotesLoading ? (
            <>
              <span className="triangle-vote-up"></span>
              {votes?.length || "0"}
            </>
          ) : (
            <MoonLoader size={18} />
          )}
        </Button>
      </div>
    </a>
  );
}
