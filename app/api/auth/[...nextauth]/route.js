import NextAuth from "next-auth/next";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/libs/MongoClient";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
