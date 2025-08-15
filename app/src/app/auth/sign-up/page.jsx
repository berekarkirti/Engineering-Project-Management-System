// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "../../../components/SessionProvider";

// export default function SignUpPage() {
//   const { supabase } = useSession();
//   const router = useRouter();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setSuccessMsg("");
//     setLoading(true);

//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { data: { name } },
//     });

//     if (error) setErrorMsg(error.message);
//     else {
//       setSuccessMsg("Account created! Please sign in.");
//       setTimeout(() => router.push("/auth/sign-in"), 1200);
//     }
//     setLoading(false);
//   };

//   return (
//     <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">
//         <div className="h-2 w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
//         <div className="p-7">
//           <h1 className="text-2xl font-semibold text-gray-900 mb-1">
//             Create account
//           </h1>
//           <p className="text-sm text-gray-500 mb-6">
//             Get started with the Engineering Project Management System
//           </p>

//           {errorMsg ? (
//             <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
//               {errorMsg}
//             </div>
//           ) : null}
//           {successMsg ? (
//             <div className="mb-4 rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">
//               {successMsg}
//             </div>
//           ) : null}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <label className="block">
//               <span className="block text-sm font-medium text-gray-700">Name</span>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 required
//                 className="mt-1 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:outline-none"
//                 placeholder="Your name"
//               />
//             </label>

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
//               {loading ? "Signing up…" : "Sign up"}
//             </button>
//           </form>

//           <p className="mt-6 text-center text-sm text-gray-600">
//             Already have an account?{" "}
//             <Link href="/auth/sign-in" className="text-[#2B6CB0] hover:underline">
//               Sign in
//             </Link>
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// }


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "../../../components/SessionProvider";

/**
 * Responsive version of the SignUpPage component.
 *
 * This variant keeps the original functionality intact but introduces
 * Tailwind breakpoint utility classes to adapt spacing, sizing and
 * typography across different viewport sizes. On larger screens the
 * card widens and paddings increase; font sizes step up from xs/sm
 * through md values. Error and success alerts as well as form spacing
 * adjust proportionally. Colours, logic and behaviour remain unchanged.
 */
export default function SignUpPage() {
  const { supabase } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) setErrorMsg(error.message);
    else {
      setSuccessMsg("Account created! Please sign in.");
      setTimeout(() => router.push("/auth/sign-in"), 1200);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-1 sm:h-2 w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
        <div className="p-5 sm:p-7 md:p-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Create account
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-6">
            Get started with the Engineering Project Management System
          </p>

          {errorMsg ? (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-xs sm:text-sm px-3 py-2">
              {errorMsg}
            </div>
          ) : null}
          {successMsg ? (
            <div className="mb-4 rounded-lg bg-green-50 text-green-700 text-xs sm:text-sm px-3 py-2">
              {successMsg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 sm:mt-2 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:outline-none"
                placeholder="Your name"
              />
            </label>

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
              {loading ? "Signing up…" : "Sign up"}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm md:text-base text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="text-[#2B6CB0] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
