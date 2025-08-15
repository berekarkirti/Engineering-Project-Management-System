// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "../../../components/SessionProvider";

// export default function SignInPage() {
//   const router = useRouter();
//   const { session, supabase } = useSession();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (session) router.push("/dashboard");
//   }, [session, router]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setLoading(true);
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) setErrorMsg(error.message);
//     else router.push("/dashboard");
//     setLoading(false);
//   };

//   return (
//     <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
//       {/* card */}
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">
//         {/* brand bar */}
//         <div className="h-2 w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
//         <div className="p-7">
//           <h1 className="text-2xl font-semibold text-gray-900 mb-1">
//             Sign in
//           </h1>
//           <p className="text-sm text-gray-500 mb-6">
//             Welcome back to Engineering Project Management System
//           </p>

//           {errorMsg ? (
//             <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
//               {errorMsg}
//             </div>
//           ) : null}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <label className="block">
//               <span className="block text-sm font-medium text-gray-700">Email</span>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="mt-1 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:outline-none"
//                 placeholder="you@company.com"
//               />
//             </label>

//             <label className="block">
//               <span className="block text-sm font-medium text-gray-700">Password</span>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 className="mt-1 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:outline-none"
//                 placeholder="••••••••"
//               />
//             </label>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full btn btn-primary !rounded-lg !py-3 bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-60"
//             >
//               {loading ? "Signing in…" : "Sign in"}
//             </button>
//           </form>

//           <p className="mt-6 text-center text-sm text-gray-600">
//             Don’t have an account?{" "}
//             <Link href="/auth/sign-up" className="text-[#2B6CB0] hover:underline">
//               Sign up
//             </Link>
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "../../../components/SessionProvider";

/**
 * Responsive version of the SignInPage component.
 *
 * The component’s logic is identical to the original, but utility classes
 * have been updated with Tailwind breakpoints to ensure the layout adapts
 * gracefully from small to large screens. Padding, element heights and widths,
 * font sizes and margins scale at sm, md and lg breakpoints. No colours or
 * underlying behaviour have been modified.
 */
export default function SignInPage() {
  const router = useRouter();
  const { session, supabase } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    else router.push("/dashboard");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* card */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-2xl shadow-md overflow-hidden">
        {/* brand bar */}
        <div className="h-1 sm:h-2 w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
        <div className="p-5 sm:p-7 md:p-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Sign in
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-6">
            Welcome back to Engineering Project Management System
          </p>

          {errorMsg ? (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-xs sm:text-sm px-3 py-2">
              {errorMsg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 sm:mt-2 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:outline-none"
                placeholder="you@company.com"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 sm:mt-2 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:outline-none"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary !rounded-lg !py-3 sm:!py-4 bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm md:text-base text-gray-600">
            Don’t have an account?{" "}
            <Link href="/auth/sign-up" className="text-[#2B6CB0] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
