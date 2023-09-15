"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import Button from "./Button";
import Logout from "./icons/Logout";
import Login from "./icons/Login";

export default function Header() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.email;
  function logout() {
    signOut();
  }
  function login() {
    signIn("google");
  }
  return (
    <div className="max-w-2xl mx-auto flex gap-4 justify-end items-center p-2">
      {isLoggedIn ? (
        <>
          <span>Hello, {session.user.name}</span>
          <Button className="border bg-white px-2 py-0" onClick={logout}>
            Logout <Logout />
          </Button>
        </>
      ) : (
        <>
          <span>Not Logged In</span>
          <Button primary={true} className="px-2 py-1" onClick={login}>
            Login <Login />
          </Button>
        </>
      )}
    </div>
  );
}
