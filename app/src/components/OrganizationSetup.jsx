"use client";

import { useState } from "react";
import { useSession } from "./SessionProvider";

export default function OrganizationSetup({ onOrganizationSet }) {
  const { session, supabase } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create organization in Supabase
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            industry: formData.industry,
            location: formData.location,
            created_by: session?.user?.id
          }
        ])
        .select()
        .single();

      if (orgError) throw orgError;

      // Create user-organization relationship
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([
          {
            organization_id: organization.id,
            user_id: session?.user?.id,
            role: 'admin'
          }
        ]);

      if (memberError) throw memberError;

      // Store organization ID in localStorage
      localStorage.setItem("current_org_id", organization.id);
      
      // Notify parent component
      onOrganizationSet(organization);

    } catch (err) {
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async () => {
    const orgId = prompt("Enter the Organization ID to join:");
    if (!orgId) return;

    setLoading(true);
    setError("");

    try {
      // Check if organization exists
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError) throw new Error("Organization not found");

      // Join organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([
          {
            organization_id: orgId,
            user_id: session?.user?.id,
            role: 'member'
          }
        ]);

      if (memberError) throw memberError;

      // Store organization ID in localStorage
      localStorage.setItem("current_org_id", orgId);
      
      // Notify parent component
      onOrganizationSet(organization);

    } catch (err) {
      setError(err.message || "Failed to join organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Organization Setup
        </h2>
        <p className="text-gray-600 mb-6">
          Create a new organization or join an existing one to get started.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Create New Organization
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Organization Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <input
                type="text"
                placeholder="Industry (e.g., Engineering, Manufacturing)"
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="text"
                placeholder="Location (e.g., New York, USA)"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Organization"}
              </button>
            </form>
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Join Existing Organization
            </h3>
            
            <button
              onClick={handleJoinOrganization}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "Join Organization"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}