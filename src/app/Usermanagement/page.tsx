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
  Briefcase,
  Shield,
  Calendar,
  ChevronDown,
  Building2,
  UserCheck,
  UserX,
  Crown,
  TrendingUp,
  Grid3x3,
  List,
  Download,
  Upload,
  User,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  department?: string;
  role?: string;
  email?: string;
  position?: string;
  mobile?: string;
  name_use?: string;
  status: boolean;
}

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Sales: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-600",
  },
  IT: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-500 to-purple-600",
  },
  HR: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-emerald-600",
  },
  Finance: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-500 to-amber-600",
  },
  Marketing: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    gradient: "from-rose-500 to-rose-600",
  },
  Operations: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    gradient: "from-cyan-500 to-cyan-600",
  },
  Boss: {
    bg: "bg-amber-50",
    text: "text-amber-800", // Darker text for better contrast on gold
    border: "border-amber-300",
    gradient: "from-amber-400 via-yellow-500 to-amber-600", // "Gold" effect
  },
  "Software Engineer": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    gradient: "from-orange-400 to-orange-600",
  },
  Default: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    gradient: "from-slate-500 to-slate-600",
  },
};

const ROLE_BADGES: Record<string, { icon: any; color: string }> = {
  Admin: { icon: Crown, color: "text-purple-600 bg-purple-100" },
  Manager: { icon: Shield, color: "text-blue-600 bg-blue-100" },
  User: { icon: UserCheck, color: "text-slate-600 bg-slate-100" },
  Default: { icon: Users, color: "text-slate-600 bg-slate-100" },
};

export default function OnlineUsersTable() {
  const addToast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

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

  // Get unique departments and their counts
  const departmentStats = useMemo(() => {
    const stats: Record<string, number> = {};
    users.forEach((user) => {
      const dept = user.department || "Unassigned";
      stats[dept] = (stats[dept] || 0) + 1;
    });
    return stats;
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        selectedDepartment === "all" ||
        user.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [users, searchTerm, selectedDepartment]);

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
    status: false,
  });

  const addUser = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/register`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newUser,
            status: false,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        addToast(err || "Failed to add user", "error");
        return;
      }

      addToast("✅ User created successfully", "success");
      setShowAddModal(false);
      setNewUser({
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
        status: false,
      });
      fetchUsers();
    } catch {
      addToast("Error creating user", "error");
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const deleteUser = async (id: number) => {
    if (!confirm("Confirm delete?")) return;

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

    addToast("Deleted user", "success");
    fetchUsers();
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/update/${selectedUser.id}`,
      {
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
          status: selectedUser.status,
        }),
      }
    );

    if (!res.ok) {
      addToast("Failed to update user", "error");
      return;
    }

    addToast("Updated user", "success");
    setShowEditModal(false);
    fetchUsers();
  };

  const getDepartmentColor = (department?: string) => {
    return DEPARTMENT_COLORS[department || ""] || DEPARTMENT_COLORS.Default;
  };

  const getRoleBadge = (role?: string) => {
    return ROLE_BADGES[role || ""] || ROLE_BADGES.Default;
  };

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
        {/* Premium Header */}
        <div className="bg-white border-b border-slate-200/60 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <Users
                    className="text-white relative z-10"
                    size={28}
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                    User Management
                  </h1>
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    {users.length} total users across{" "}
                    {Object.keys(departmentStats).length} departments
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchUsers}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 font-semibold"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">
                    {loading ? "Loading..." : "Refresh"}
                  </span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 font-semibold"
                >
                  <UserPlus size={16} strokeWidth={2.5} />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by name, email, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                />
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                  showFilters
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Filter size={16} />
                Filters
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* Department Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Filter by Department
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDepartment("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedDepartment === "all"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    All Departments ({users.length})
                  </button>
                  {Object.entries(departmentStats).map(([dept, count]) => {
                    const colors = getDepartmentColor(dept);
                    return (
                      <button
                        key={dept}
                        onClick={() => setSelectedDepartment(dept)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                          selectedDepartment === dept
                            ? `${colors.bg} ${colors.text} ${colors.border} shadow-md`
                            : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        {dept} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {loading && users.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center">
              <RefreshCw
                className="animate-spin mx-auto text-indigo-600 mb-4"
                size={48}
              />
              <p className="text-slate-600 font-semibold text-lg">
                Loading users...
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Please wait while we fetch the data
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center">
              <div className="inline-flex p-6 rounded-full bg-slate-100 mb-4">
                <Users className="text-slate-300" size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-600 mb-2">
                No users found
              </h3>
              <p className="text-slate-400 text-sm">
                {searchTerm || selectedDepartment !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first user to get started"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => {
                const deptColors = getDepartmentColor(user.department);
                const roleBadge = getRoleBadge(user.role);
                const RoleIcon = roleBadge.icon;

                return (
                  <div
                    key={user.id}
                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-indigo-200 hover:-translate-y-1"
                  >
                    {/* Gradient Header */}
                    <div
                      className={`h-24 bg-gradient-to-r ${deptColors.gradient} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                      <div className="absolute right-4 top-4">
                        <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all">
                          <MoreVertical size={16} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="p-6 -mt-12 relative">
                      {/* Avatar */}
                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border-4 border-white mb-4">
                        <span
                          className={`bg-gradient-to-br ${deptColors.gradient} bg-clip-text text-transparent`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Name and Status */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            {user.name}
                          </h3>
                          {user.status ? (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                          {user.position || "No position"}
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${deptColors.bg} ${deptColors.text} rounded-lg text-xs font-bold border ${deptColors.border}`}
                        >
                          <User size={12} />
                          {user.department || "N/A"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${roleBadge.color}`}
                        >
                          <RoleIcon size={12} />
                          {user.role || "N/A"}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                        {user.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        {user.mobile && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            <span>{user.mobile}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all font-semibold text-sm border border-indigo-100"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const deptColors = getDepartmentColor(user.department);
                      const roleBadge = getRoleBadge(user.role);
                      const RoleIcon = roleBadge.icon;

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 bg-gradient-to-br ${deptColors.gradient} rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md`}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {user.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {user.position || "No position"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${deptColors.bg} ${deptColors.text} rounded-lg text-xs font-bold border ${deptColors.border}`}
                            >
                              <User size={12} />
                              {user.department || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${roleBadge.color}`}
                            >
                              <RoleIcon size={12} />
                              {user.role || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {user.email && (
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <Mail size={12} className="text-slate-400" />
                                  <span className="truncate max-w-[200px]">
                                    {user.email}
                                  </span>
                                </div>
                              )}
                              {user.mobile && (
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <Phone size={12} className="text-slate-400" />
                                  <span>{user.mobile}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditModal(true);
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
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
          )}
        </div>
      </div>

      {/* Add User Modal - Enhanced */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    Add New User
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    Create a new user account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Display Name
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="Johnny"
                    value={newUser.name_use}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name_use: e.target.value })
                    }
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="john@company.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Department
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium appearance-none bg-white cursor-pointer"
                    value={newUser.department}
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                  >
                    <option value="">Select Department</option>
                    <option value="Sales">Sales</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium appearance-none bg-white cursor-pointer"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                  >
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="User">User</option>
                  </select>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Position
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="Senior Manager"
                    value={newUser.position}
                    onChange={(e) =>
                      setNewUser({ ...newUser, position: e.target.value })
                    }
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Mobile
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="+60 12-345 6789"
                    value={newUser.mobile}
                    onChange={(e) =>
                      setNewUser({ ...newUser, mobile: e.target.value })
                    }
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    value={newUser.bod}
                    onChange={(e) =>
                      setNewUser({ ...newUser, bod: e.target.value })
                    }
                  />
                </div>

                {/* Approval Authority */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Approval
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="Approval"
                    value={newUser.approval}
                    onChange={(e) =>
                      setNewUser({ ...newUser, approval: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end p-6 border-t-2 border-slate-100 bg-slate-50">
              <button
                className="px-6 py-3 bg-white text-slate-700 rounded-xl hover:bg-slate-100 transition-all font-bold border-2 border-slate-200"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all font-bold shadow-lg shadow-indigo-200"
              >
                <UserPlus size={18} />
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal - Similar enhancement */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Edit2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Edit User</h2>
                  <p className="text-blue-100 text-sm">
                    Update user information
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Name
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                    value={selectedUser.name ?? ""}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Department
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium appearance-none bg-white"
                    value={selectedUser.department ?? ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        department: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Department</option>
                    <option value="Sales">Sales</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium appearance-none bg-white"
                    value={selectedUser.role ?? ""}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                  >
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="User">User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Position
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Mobile
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                    value={selectedUser.mobile ?? ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        mobile: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end p-6 border-t-2 border-slate-100 bg-slate-50">
              <button
                className="px-6 py-3 bg-white text-slate-700 rounded-xl hover:bg-slate-100 transition-all font-bold border-2 border-slate-200"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg shadow-blue-200"
                onClick={updateUser}
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}