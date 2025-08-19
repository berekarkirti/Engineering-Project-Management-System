"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Prefill an org name hint
    if (!orgName) setOrgName("My Organization");
    // Ensure there is no stale invalid org_id
    const existing = window.localStorage.getItem("current_org_id");
    if (existing && !/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(existing)) {
      window.localStorage.removeItem("current_org_id");
    }
  }, [orgName]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const orgId = generateUUID();
      window.localStorage.setItem("current_org_id", orgId);
      if (orgName) window.localStorage.setItem("current_org_name", orgName);
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create Organization</h1>
        <p className="text-sm text-gray-600 mb-6">
          Create a local organization context to view and manage projects.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700">Organization name</span>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:outline-none"
              placeholder="Acme Energy Ltd."
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full btn btn-primary !rounded-lg !py-3 bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create & Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}

