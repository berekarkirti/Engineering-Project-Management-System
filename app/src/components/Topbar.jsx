// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useSession } from "./SessionProvider";


// export default function Topbar({ onToggleSidebar }) {
//   const { session, supabase } = useSession();
//   const router = useRouter();
//   const [signingOut, setSigningOut] = useState(false);

//   const handleSignOut = async () => {
//     setSigningOut(true);
//     await supabase.auth.signOut();
//     router.push("/auth/sign-in");
//   };

//   const userEmail = session?.user?.email || "";

//   return (
//     <header className="sticky top-0 z-40 w-full shadow-sm">
//       {/* gradient band like your screenshots */}
//       <div className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]">
//         <div className="mx-auto max-w-[1400px] px-4 py-6 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             {/* mobile burger */}
//             <button
//               className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white"
//               onClick={onToggleSidebar}
//               aria-label="Toggle menu"
//             >
//               <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
//                 <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
//               </svg>
//             </button>
//             <h1 className="text-3xl font-semibold text-white">
//               Engineering Project Management System
//             </h1>
//           </div>

//           <div className="flex items-center gap-3">
//             {userEmail && (
//               <span className="hidden sm:inline text-white/90 text-md">{userEmail}</span>
//             )}
//             <button
//               onClick={handleSignOut}
//               disabled={signingOut}
//               className="px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-white text-sm"
//             >
//               {signingOut ? "Signing out…" : "Sign out"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./SessionProvider";

export default function Topbar() {
  const { session, supabase } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  const userEmail = session?.user?.email || "";

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      <div className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          {/* Stack on mobile, row on larger screens */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold leading-tight text-white">
              Engineering Project Management System
            </h1>

            <div className="flex w-full md:w-auto items-center gap-2 md:gap-3 justify-between md:justify-end">
              {userEmail && (
                <span
                  className="
                    inline-flex items-center rounded-full bg-white/10
                    px-3 py-1 text-white/90
                    text-xs sm:text-sm md:text-base
                    truncate max-w-[60vw] md:max-w-xs
                  "
                  title={userEmail}
                >
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="
                  inline-flex items-center rounded-full
                  px-3 sm:px-4 py-1.5 sm:py-2
                  bg-white/20 hover:bg-white/30
                  text-white text-xs sm:text-sm md:text-base
                  whitespace-nowrap disabled:opacity-60
                "
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
