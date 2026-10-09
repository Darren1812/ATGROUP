"use client";

import React, { useEffect, useState, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";
import {
  RefreshCw,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Save,
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  Calendar,
  ChevronDown,
  Building2,
  UserCheck,
  UserX,
  Crown,
  Grid3x3,
  List,
  User,
  FileSignature,
  KeyRound,
  CheckCircle2,
  BadgeCheck,
  Briefcase,
  AtSign,
} from "lucide-react";

interface UserData {
  id: number;
  name: string;
  nameUse?: string;
  password?: string;
  department?: string;
  role?: string;
  email?: string;
  position?: string;
  mobile?: string;
  sign?: string;
  bod?: string;
  approval?: string;
  status: boolean;
}

const DEPARTMENT_COLORS: Record<
  string,
  { bg: string; text: string; border: string; gradient: string }
> = {
  Sales: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-600 to-blue-700",
  },
  IT: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-600 to-purple-700",
  },
  HR: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-600 to-emerald-700",
  },
  Finance: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-600 to-amber-700",
  },
  Marketing: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    gradient: "from-rose-600 to-rose-700",
  },
  Operations: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    gradient: "from-cyan-600 to-cyan-700",
  },
  Default: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    gradient: "from-slate-700 to-slate-800",
  },
};

const ROLE_BADGES: Record<string, { icon: any; color: string }> = {
  Admin: { icon: Crown, color: "text-purple-700 bg-purple-100 border-purple-200" },
  Manager: { icon: Shield, color: "text-blue-700 bg-blue-100 border-blue-200" },
  User: { icon: UserCheck, color: "text-slate-700 bg-slate-100 border-slate-200" },
  Default: { icon: Users, color: "text-slate-700 bg-slate-100 border-slate-200" },
};

const initialUserState: UserData = {
  id: 0,
  name: "",
  nameUse: "",
  password: "",
  department: "",
  role: "",
  email: "",
  position: "",
  mobile: "",
  sign: "",
  bod: "",
  approval: "",
  status: false,
};

export default function OnlineUsersTable() {
  const addToast = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // User States
  const [newUser, setNewUser] = useState<UserData>(initialUserState);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/all-users`
      );
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
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

  const departmentStats = useMemo(() => {
    const stats: Record<string, number> = {};
    users.forEach((user) => {
      const dept = user.department || "Unassigned";
      stats[dept] = (stats[dept] || 0) + 1;
    });
    return stats;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nameUse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.sign?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        selectedDepartment === "all" || user.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [users, searchTerm, selectedDepartment]);

  // Create User
  const addUser = async () => {
    if (!newUser.name || !newUser.password) {
      addToast("Full Name and Password are required", "error");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/register`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newUser, status: false }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        addToast(err || "Failed to add user", "error");
        return;
      }

      addToast("✅ User created successfully", "success");
      setShowAddModal(false);
      setNewUser(initialUserState);
      fetchUsers();
    } catch {
      addToast("Error creating user", "error");
    }
  };

  // Update User
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/update/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(selectedUser),
        }
      );

      if (!res.ok) {
        addToast("Failed to update user", "error");
        return;
      }

      addToast("User updated successfully", "success");
      setShowEditModal(false);
      fetchUsers();
    } catch {
      addToast("Error updating user", "error");
    }
  };

  // Delete User
  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/delete/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        addToast("Failed to delete user", "error");
        return;
      }

      addToast("User deleted successfully", "success");
      fetchUsers();
    } catch {
      addToast("Error deleting user", "error");
    }
  };

  const getDepartmentColor = (department?: string) => {
    return DEPARTMENT_COLORS[department || ""] || DEPARTMENT_COLORS.Default;
  };

  const getRoleBadge = (role?: string) => {
    return ROLE_BADGES[role || ""] || ROLE_BADGES.Default;
  };

  return (
    <div className='min-h-screen bg-slate-100/70 font-sans text-slate-800 antialiased'>
      {/* Enterprise System Header */}
      <header className='bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md'>
        <div className='max-w-[1600px] mx-auto px-6 py-4'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            {/* Title & System Breadcrumb */}
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-inner'>
                <Shield className='text-white' size={22} />
              </div>
              <div>
                <div className='flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider'>
                  <span>System Management</span>
                  <span>/</span>
                  <span className='text-slate-300'>User Directory</span>
                </div>
                <h1 className='text-xl font-bold tracking-tight text-white flex items-center gap-2'>
                  Users & Access Control
                  <span className='text-xs font-normal bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700'>
                    {users.length} Registered
                  </span>
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2.5'>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className='flex items-center gap-2 px-3.5 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition font-medium disabled:opacity-50'
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Reload</span>
              </button>

              <button
                onClick={() => {
                  setNewUser(initialUserState);
                  setShowAddModal(true);
                }}
                className='flex items-center gap-2 px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-semibold shadow-sm'
              >
                <UserPlus size={15} />
                <span>New User Account</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Filter Panel */}
      <div className='max-w-[1600px] mx-auto px-6 pt-6 pb-2'>
        <div className='bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3'>
          <div className='flex flex-col md:flex-row gap-3 items-center justify-between'>
            {/* Search input */}
            <div className='relative w-full md:w-96'>
              <Search
                size={16}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <input
                type='text'
                placeholder='Search ID, Name, Display Name, Sign, Email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-medium outline-none transition'
              />
            </div>

            {/* View Switch & Department Filter Toggle */}
            <div className='flex items-center gap-2 w-full md:w-auto justify-end'>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border font-medium transition ${
                  showFilters
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Filter size={14} />
                <span>Departments Filter</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              <div className='flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200'>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded text-xs font-medium transition ${
                    viewMode === "list"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title='System List View'
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded text-xs font-medium transition ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title='Grid Cards View'
                >
                  <Grid3x3 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Department Chips */}
          {showFilters && (
            <div className='pt-2 border-t border-slate-100 flex flex-wrap gap-1.5'>
              <button
                onClick={() => setSelectedDepartment("all")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  selectedDepartment === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({users.length})
              </button>
              {Object.entries(departmentStats).map(([dept, count]) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    selectedDepartment === dept
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {dept} ({count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className='max-w-[1600px] mx-auto px-6 py-4'>
        {loading && users.length === 0 ? (
          <div className='bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm'>
            <RefreshCw className='animate-spin mx-auto text-indigo-600 mb-3' size={36} />
            <p className='text-slate-600 font-semibold text-sm'>
              Loading system directory...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className='bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm'>
            <Users className='mx-auto text-slate-300 mb-3' size={40} />
            <h3 className='text-base font-bold text-slate-700'>No users found</h3>
            <p className='text-xs text-slate-400 mt-1'>
              Try adjusting your search criteria or register a new user.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* System Directory Table View (Therefore Solution Designer Style) */
          <div className='bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-slate-800 text-slate-200 text-[11px] uppercase tracking-wider font-bold'>
                    <th className='py-3 px-4 border-b border-slate-700 w-16'>ID</th>
                    <th className='py-3 px-4 border-b border-slate-700'>Full Name</th>
                    <th className='py-3 px-4 border-b border-slate-700'>Display Name (Use)</th>
                    <th className='py-3 px-4 border-b border-slate-700'>Sign Tag</th>
                    <th className='py-3 px-4 border-b border-slate-700'>Dept & Position</th>
                    <th className='py-3 px-4 border-b border-slate-700'>Role</th>
                    <th className='py-3 px-4 border-b border-slate-700'>Approval Authority</th>
                    <th className='py-3 px-4 border-b border-slate-700'>Contact</th>
                    <th className='py-3 px-4 border-b border-slate-700 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100 text-xs font-medium text-slate-700'>
                  {filteredUsers.map((user) => {
                    const deptColors = getDepartmentColor(user.department);
                    const roleBadge = getRoleBadge(user.role);
                    const RoleIcon = roleBadge.icon;

                    return (
                      <tr
                        key={user.id}
                        className='hover:bg-indigo-50/40 transition-colors group'
                      >
                        {/* ID */}
                        <td className='py-3 px-4 font-mono font-bold text-slate-400'>
                          #{user.id}
                        </td>

                        {/* Full Name */}
                        <td className='py-3 px-4 font-bold text-slate-900'>
                          <div className='flex items-center gap-2'>
                            <span>{user.name}</span>
                            {user.status ? (
                              <span className='w-2 h-2 rounded-full bg-emerald-500' title='Online'></span>
                            ) : (
                              <span className='w-2 h-2 rounded-full bg-slate-300' title='Offline'></span>
                            )}
                          </div>
                        </td>

                        {/* Display Name (nameUse) */}
                        <td className='py-3 px-4 text-slate-600'>
                          {user.nameUse ? (
                            <span className='font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200'>
                              {user.nameUse}
                            </span>
                          ) : (
                            <span className='text-slate-300 italic'>Not set</span>
                          )}
                        </td>

                        {/* Sign */}
                        <td className='py-3 px-4'>
                          {user.sign ? (
                            <span className='inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200'>
                              <FileSignature size={12} />
                              {user.sign}
                            </span>
                          ) : (
                            <span className='text-slate-300 italic'>-</span>
                          )}
                        </td>

                        {/* Dept & Position */}
                        <td className='py-3 px-4'>
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${deptColors.bg} ${deptColors.text} border ${deptColors.border}`}
                            >
                              {user.department || "Unassigned"}
                            </span>
                            <div className='text-[11px] text-slate-500 mt-0.5'>
                              {user.position || "Staff"}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className='py-3 px-4'>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${roleBadge.color}`}
                          >
                            <RoleIcon size={12} />
                            {user.role || "User"}
                          </span>
                        </td>

                        {/* Approval */}
                        <td className='py-3 px-4 text-slate-600'>
                          {user.approval ? (
                            <span className='text-slate-700 font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 text-[11px]'>
                              {user.approval}
                            </span>
                          ) : (
                            <span className='text-slate-300 italic'>None</span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className='py-3 px-4 text-[11px] text-slate-500 space-y-0.5'>
                          {user.email && (
                            <div className='flex items-center gap-1'>
                              <Mail size={12} className='text-slate-400' />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.mobile && (
                            <div className='flex items-center gap-1'>
                              <Phone size={12} className='text-slate-400' />
                              <span>{user.mobile}</span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className='py-3 px-4 text-right whitespace-nowrap'>
                          <div className='flex items-center justify-end gap-1'>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditModal(true);
                              }}
                              className='p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition'
                              title='Edit Account Details'
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className='p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition'
                              title='Delete User'
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid Card View */
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {filteredUsers.map((user) => {
              const deptColors = getDepartmentColor(user.department);
              const roleBadge = getRoleBadge(user.role);
              const RoleIcon = roleBadge.icon;

              return (
                <div
                  key={user.id}
                  className='bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-4 relative flex flex-col justify-between'
                >
                  <div>
                    {/* Header bar */}
                    <div className='flex items-start justify-between border-b border-slate-100 pb-3 mb-3'>
                      <div>
                        <div className='flex items-center gap-1.5'>
                          <h3 className='font-bold text-slate-900 text-sm'>
                            {user.name}
                          </h3>
                        </div>
                        <p className='text-xs text-slate-500 font-medium mt-0.5'>
                          {user.position || "No position"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadge.color}`}
                      >
                        <RoleIcon size={10} />
                        {user.role || "User"}
                      </span>
                    </div>

                    {/* Metadata Details */}
                    <div className='space-y-2 text-xs'>
                      <div className='flex items-center justify-between'>
                        <span className='text-slate-400'>Display Name:</span>
                        <span className='font-semibold text-slate-700'>
                          {user.nameUse || "-"}
                        </span>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-slate-400'>Sign Tag:</span>
                        <span className='font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100'>
                          {user.sign || "-"}
                        </span>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-slate-400'>Department:</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${deptColors.bg} ${deptColors.text}`}
                        >
                          {user.department || "Unassigned"}
                        </span>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-slate-400'>Approval:</span>
                        <span className='font-medium text-slate-700'>
                          {user.approval || "None"}
                        </span>
                      </div>

                      {user.email && (
                        <div className='flex items-center gap-1.5 text-slate-500 pt-1'>
                          <Mail size={12} className='text-slate-400' />
                          <span className='truncate'>{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className='pt-3 mt-3 border-t border-slate-100 flex gap-2 justify-end'>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditModal(true);
                      }}
                      className='px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1'
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className='px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition'
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200'>
            {/* Modal Top Bar */}
            <div className='bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800'>
              <div className='flex items-center gap-2.5'>
                <UserPlus size={18} className='text-indigo-400' />
                <h2 className='text-base font-bold text-white'>
                  Create New System User
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className='text-slate-400 hover:text-white p-1 transition'
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body - Structured Enterprise Sections */}
            <div className='p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50'>
              {/* Section 1: Core Credentials */}
              <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3'>
                <div className='flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold text-indigo-700 uppercase tracking-wider'>
                  <KeyRound size={14} />
                  <span>Account Credentials</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Full Name <span className='text-red-500'>*</span>
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='e.g. NURUL AINA BINTI ROSLI'
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Password <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='password'
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='••••••••'
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Display Name (Login Username / nameUse)
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='e.g. AINA'
                      value={newUser.nameUse}
                      onChange={(e) =>
                        setNewUser({ ...newUser, nameUse: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Digital Sign Tag (Sign)
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono'
                      placeholder='e.g. Aina'
                      value={newUser.sign}
                      onChange={(e) =>
                        setNewUser({ ...newUser, sign: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Department & Role Setup */}
              <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3'>
                <div className='flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold text-indigo-700 uppercase tracking-wider'>
                  <Briefcase size={14} />
                  <span>Organization & Authorization</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Department
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='e.g. Marketing / IT'
                      value={newUser.department}
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      System Role
                    </label>
                    <select
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white'
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                    >
                      <option value=''>Select Role</option>
                      <option value='Admin'>Admin</option>
                      <option value='Manager'>Manager</option>
                      <option value='User'>User</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Approval Level
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='e.g. L1 / Manager / Director'
                      value={newUser.approval}
                      onChange={(e) =>
                        setNewUser({ ...newUser, approval: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Personnel Information */}
              <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3'>
                <div className='flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold text-indigo-700 uppercase tracking-wider'>
                  <User size={14} />
                  <span>Personnel Profile</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Job Position / Title
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='e.g. Senior Executive'
                      value={newUser.position}
                      onChange={(e) =>
                        setNewUser({ ...newUser, position: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Email Address
                    </label>
                    <input
                      type='email'
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='aina@company.com'
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Mobile Number
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      placeholder='+60 12-345 6789'
                      value={newUser.mobile}
                      onChange={(e) =>
                        setNewUser({ ...newUser, mobile: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Date of Birth (BOD)
                    </label>
                    <input
                      type='date'
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={newUser.bod}
                      onChange={(e) =>
                        setNewUser({ ...newUser, bod: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className='flex gap-2 justify-end px-6 py-3 border-t border-slate-200 bg-white'>
              <button
                className='px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-xs font-bold'
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                className='flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-xs font-bold shadow-sm'
              >
                <Save size={14} />
                Save & Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200'>
            {/* Modal Top Bar */}
            <div className='bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800'>
              <div className='flex items-center gap-2.5'>
                <Edit2 size={18} className='text-indigo-400' />
                <h2 className='text-base font-bold text-white'>
                  Edit System User (#{selectedUser.id})
                </h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className='text-slate-400 hover:text-white p-1 transition'
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <div className='p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50'>
              {/* Credentials & Sign */}
              <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3'>
                <div className='flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold text-indigo-700 uppercase tracking-wider'>
                  <KeyRound size={14} />
                  <span>Account Credentials</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Full Name
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.name ?? ""}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Display Name (nameUse)
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.nameUse ?? ""}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, nameUse: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Digital Sign Tag (Sign)
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono'
                      value={selectedUser.sign ?? ""}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, sign: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Organization & Authorization */}
              <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3'>
                <div className='flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold text-indigo-700 uppercase tracking-wider'>
                  <Briefcase size={14} />
                  <span>Organization & Authorization</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Department
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.department ?? ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          department: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Role
                    </label>
                    <select
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white'
                      value={selectedUser.role ?? ""}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, role: e.target.value })
                      }
                    >
                      <option value=''>Select Role</option>
                      <option value='Admin'>Admin</option>
                      <option value='Manager'>Manager</option>
                      <option value='User'>User</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Approval Level
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.approval ?? ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          approval: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Contact Profile */}
              <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3'>
                <div className='flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold text-indigo-700 uppercase tracking-wider'>
                  <User size={14} />
                  <span>Personnel Profile</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Job Position
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.position ?? ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          position: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Email
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.email ?? ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Mobile
                    </label>
                    <input
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.mobile ?? ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          mobile: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Date of Birth
                    </label>
                    <input
                      type='date'
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
                      value={selectedUser.bod ?? ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          bod: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className='flex gap-2 justify-end px-6 py-3 border-t border-slate-200 bg-white'>
              <button
                className='px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-xs font-bold'
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className='flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-xs font-bold shadow-sm'
                onClick={updateUser}
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}