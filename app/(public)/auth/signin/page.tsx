import Signin from "@/components/Auth/Signin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - A+ Essays",
  description: "Sign in to your A+ Essays account",
};

const SigninPage = () => {
  return <Signin />;
};

export default SigninPage;
