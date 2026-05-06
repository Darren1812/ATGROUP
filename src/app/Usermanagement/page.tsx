"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";
import { RefreshCw, UserPlus, Edit2, Trash2, X, Save, Users } from "lucide-react";

interface User {
  id: number;
  name: string;
  department?: string;
  role?: string;
  email?: string;
  position?: string;
  mobile?: string;
  status: boolean; // true for online, false for offline
}

export default function OnlineUsersTable() {
  const addToast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // NOTE: This assumes NEXT_PUBLIC_API_BASE_URL is correctly set in your environment
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/all-users`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();

      // Make sure to access the array inside the object
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    password: "",
    department: "",
    role: "",
    email: "",
    position: "",
    mobile: "",
    name_use: "",
    approval: "",
    sign: "",
    bod: "",
    status: false
  });

  const addUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newUser,
          status: false
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        addToast(err || "Failed to add user", "error");
        return;
      }

      addToast("✅ User created successfully", "success");
      setShowAddModal(false);
      setNewUser({ name: "", password: "", department: "", role: "", email: "", position: "", mobile: "", name_use: "", approval: "", sign: "", bod: "", status: false });
      fetchUsers(); // refresh table

    } catch {
      addToast("Error creating user", "error");
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const deleteUser = async (id: number) => {
    if (!confirm("Confirm delete?")) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      addToast("Failed to delete user", "error");
      return;
    }

    addToast("Deleted user", "success");
    fetchUsers();
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/update/${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: selectedUser.name,
        department: selectedUser.department,
        role: selectedUser.role,
        email: selectedUser.email,
        position: selectedUser.position,
        mobile: selectedUser.mobile,
        status: selectedUser.status // if want allow user to change later
      }),
    });

    if (!res.ok) {
      addToast("Failed to update user", "error");
      return;
    }

    addToast("Updated user", "success");
    setShowEditModal(false);
    fetchUsers();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-light text-slate-800 tracking-tight">
                  User Management
                </h1>
                <p className="text-slate-500 mt-1">Manage user accounts and permissions</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-slate-800 text-white rounded-lg shadow-sm hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span>{loading ? 'Loading...' : 'Refresh'}</span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-all"
                >
                  <UserPlus size={16} />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium">Total Users</p>
                    <p className="text-2xl font-light text-slate-800">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium">Offline</p>
                    <p className="text-2xl font-light text-slate-800">
                      {users.filter(u => !u.status).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
            {loading && users.length === 0 ? (
              <div className="p-12 text-center">
                <RefreshCw className="animate-spin mx-auto text-slate-400 mb-4" size={32} />
                <p className="text-slate-500">Loading user data...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium">No users found</p>
                <p className="text-slate-400 text-sm mt-1">Add your first user to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          #{user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {user.department || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                            {user.role || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                            }`}>
                            {user.status ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowEditModal(true)
                              }}
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    {/* Increased max-w to 2xl to support two columns */}
    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">Add New User</h2>
        <button
          onClick={() => setShowAddModal(false)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Grid Layout: 2 columns on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </div>

          {/* Name Use (Display Name) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name (name_use)</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Johnny"
              value={newUser.name_use}
              onChange={(e) => setNewUser({ ...newUser, name_use: e.target.value })}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="john@company.com"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Sales / IT"
              value={newUser.department}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Admin / User"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Manager"
              value={newUser.position}
              onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="+60..."
              value={newUser.mobile}
              onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
            />
          </div>

          {/* Bod (Birthdate) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth (Bod)</label>
            <input
              type="text" // Using text as per your DB schema, but you could use type="date"
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="YYYY-MM-DD"
              value={newUser.bod}
              onChange={(e) => setNewUser({ ...newUser, bod: e.target.value })}
            />
          </div>

          {/* Sign */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Signature String</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Digital Sign ID"
              value={newUser.sign}
              onChange={(e) => setNewUser({ ...newUser, sign: e.target.value })}
            />
          </div>

          {/* Approval */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Approval Authority</label>
            <input
              className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Level 1"
              value={newUser.approval}
              onChange={(e) => setNewUser({ ...newUser, approval: e.target.value })}
            />
          </div>

          {/* Status (Boolean) */}
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="status"
              className="w-5 h-5 accent-emerald-600 rounded"
              checked={newUser.status}
              onChange={(e) => setNewUser({ ...newUser, status: e.target.checked })}
            />
            <label htmlFor="status" className="text-sm font-medium text-slate-700">Active Account</label>
          </div>

        </div>
      </div>

      <div className="flex gap-3 justify-end p-6 border-t border-slate-200">
        <button
          className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          onClick={() => setShowAddModal(false)}
        >
          Cancel
        </button>
        <button
          onClick={addUser}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          <UserPlus size={16} />
          Create User
        </button>
      </div>
    </div>
  </div>
)}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                  value={selectedUser.name ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  placeholder="Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <input
                  className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                  value={selectedUser.department ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                  placeholder="Department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <input
                  className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                  value={selectedUser.role ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  placeholder="Role"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                  value={selectedUser.email ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  placeholder="Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                <input
                  className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                  value={selectedUser.position ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, position: e.target.value })}
                  placeholder="Position"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mobile</label>
                <input
                  className="border border-slate-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
                  value={selectedUser.mobile ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, mobile: e.target.value })}
                  placeholder="Mobile"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-slate-200">
              <button
                className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={updateUser}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}