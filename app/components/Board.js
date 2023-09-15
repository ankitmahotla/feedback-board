import { useEffect, useRef, useState } from "react";
import FeedbackItem from "./FeedbackItem";
import FeedbackForm from "./FeedbackForm";
import Button from "./Button";
import FeedbackItemPopup from "./FeedbackItemPopup";
import axios from "axios";
import { useSession } from "next-auth/react";
import { MoonLoader } from "react-spinners";
import Search from "./icons/Search";
import { debounce } from "lodash";

export default function Board() {
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [showFeedbackItem, setShowFeedbackItem] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [fetchingFeedbacksState, setFetchingFeedbacksState] = useState(false);
  const everyThingLoaded = useRef(false);
  const fetchingFeedbacks = useRef(false);
  const [votes, setVotes] = useState([]);
  const { data: session } = useSession();
  const [sort, setSort] = useState("votes");
  const sortRef = useRef("votes");
  const loadedRows = useRef(0);
  const [searchPhrase, setSearchPhrase] = useState("");
  const searchPhraseRef = useRef("");
  const debouncedFetchFeedbacks = useRef(debounce(fetchFeedbacks, 500));
  const waitingRef = useRef(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    loadedRows.current = 0;
    sortRef.current = sort;
    searchPhraseRef.current = searchPhrase;
    everyThingLoaded.current = false;
    if (feedbacks?.length > 0) {
      setFeedbacks([]);
    }
    setWaiting(true);
    waitingRef.current = true;
    debouncedFetchFeedbacks.current();
  }, [sort, searchPhrase]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    fetchVotes();
  }, [feedbacks]);

  useEffect(() => {
    if (session?.user?.email) {
      const feedbackToVote = localStorage.getItem("Going to vote");
      if (feedbackToVote) {
        axios.post("/api/vote", { feedbackId: feedbackToVote }).then(() => {
          localStorage.removeItem("Going to vote");
          fetchVotes();
        });
      }
      const feedbackToPost = localStorage.getItem("post_after_login");
      if (feedbackToPost) {
        const feedbackData = JSON.parse(feedbackToPost);
        axios.post("/api/feedback", feedbackData).then(async (res) => {
          await fetchFeedbacks();
          setShowFeedbackItem(res.data);
          localStorage.removeItem("post_after_login");
        });
      }
      const commentToPost = localStorage.getItem("comment_to_post");
      if (commentToPost) {
        const commentData = JSON.parse(commentToPost);
        axios.post("/api/comment", commentData).then(() => {
          axios
            .get("/api/feedback?id=" + commentData.feedbackId)
            .then((res) => {
              setShowFeedbackItem(res.data);
              localStorage.removeItem("comment_to_post");
            });
        });
      }
    }
  }, [session?.user?.email]);

  function handleScroll() {
    const html = window.document.querySelector("html");
    const howMuchScrolled = html.scrollTop;
    const howMuchIsToScroll = html.scrollHeight;
    const leftToScroll =
      howMuchIsToScroll - howMuchScrolled - html.clientHeight;
    if (leftToScroll <= 100) fetchFeedbacks(true);
  }

  function registerScrollListener() {
    window.addEventListener("scroll", handleScroll);
  }
  function unregisterScrollListener() {
    window.removeEventListener("scroll", handleScroll);
  }

  useEffect(() => {
    registerScrollListener();
    return () => unregisterScrollListener();
  }, []);

  async function fetchFeedbacks(append = false) {
    if (fetchingFeedbacks.current) return;
    if (everyThingLoaded.current) return;
    fetchingFeedbacks.current = true;
    setFetchingFeedbacksState(true);
    axios
      .get(
        `/api/feedback?sort=${sortRef.current}&loadedRows=${loadedRows.current}&searchPhrase=${searchPhraseRef.current}`
      )
      .then((res) => {
        if (append) {
          setFeedbacks((prevData) => [...prevData, ...res.data]);
        } else {
          setFeedbacks(res.data);
        }
        if (res.data.length > 0) {
          loadedRows.current += res.data.length;
        }
        if (res.data.length === 0) {
          everyThingLoaded.current = true;
        }
        fetchingFeedbacks.current = false;
        setFetchingFeedbacksState(false);
        waitingRef.current = false;
        setWaiting(false);
      });
  }

  function openFeedbackPopup() {
    setShowFeedbackPopup(true);
  }

  function openFeedbackItem(feedback) {
    setShowFeedbackItem(feedback);
  }

  async function fetchVotes() {
    const ids = feedbacks.map((f) => f._id);
    const res = await axios.get("/api/vote?feedbackIds=" + ids.join(","));
    setVotes(res.data);
  }

  async function handleFeedbackUpdate(newData) {
    setShowFeedbackItem((prevData) => {
      return { ...prevData, ...newData };
    });
    await fetchFeedbacks();
  }

  return (
    <main className="bg-white md:max-w-2xl mx-auto md:shadow-lg md:rounded-lg md:mt-4 md:mb-8 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-400 to-blue-400 p-8">
        <h1 className="font-bold text-xl">Feedback Board</h1>
        {/* <p className="text-opacity-90 text-slate-700">
          Help me decide what should I build next or how can I improve.
        </p> */}
      </div>
      <div className="bg-gray-100 px-8 py-4 flex items-center border-bottom">
        <div className="grow flex items-center gap-4 text-gray-400">
          <select
            className="bg-transparent py-2 "
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="votes">Most Voted</option>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute top-3 left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchPhrase}
              onChange={(e) => setSearchPhrase(e.target.value)}
              className="bg-transparent p-2 pl-7"
            />
          </div>
        </div>
        <div>
          <Button onClick={openFeedbackPopup} primary>
            Make a suggestion
          </Button>
        </div>
      </div>
      <div className="px-8">
        {feedbacks?.length === 0 && !fetchingFeedbacksState && !waiting && (
          <div className="py-4 text-4xl text-gray-200">No feedbacks found</div>
        )}
        {feedbacks.map((feedback) => (
          <FeedbackItem
            votes={votes.filter(
              (v) => v.feedbackId.toString() === feedback._id.toString()
            )}
            {...feedback}
            onOpen={() => openFeedbackItem(feedback)}
            onVotesChange={fetchVotes}
          />
        ))}
        {(fetchingFeedbacksState || waiting) && (
          <div className="p-4">
            <MoonLoader size={24} />
          </div>
        )}
      </div>
      {showFeedbackPopup && (
        <FeedbackForm
          onCreate={fetchFeedbacks}
          setShow={setShowFeedbackPopup}
        />
      )}
      {showFeedbackItem && (
        <FeedbackItemPopup
          onUpdate={handleFeedbackUpdate}
          {...showFeedbackItem}
          setShow={setShowFeedbackItem}
          onVotesChange={fetchVotes}
          votes={votes.filter(
            (v) => v.feedbackId.toString() === showFeedbackItem._id.toString()
          )}
        />
      )}
    </main>
  );
}
