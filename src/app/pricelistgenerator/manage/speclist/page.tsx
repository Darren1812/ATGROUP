"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface EquipmentSpec {
  id: number;
  specName: string;
  category: string;
  basicPrice: number;
  price60Months: number;
  price36Months: number;
}

const CATEGORY_OPTIONS = [
  {
    value: "Finisher",
    label: "Finisher",
    color: "bg-emerald-100 text-emerald-700",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    value: "Paper Feeder",
    label: "Paper Feeder",
    color: "bg-blue-100 text-blue-700",
    activeColor: "bg-blue-600 text-white border-blue-600",
  },
  {
    value: "Fax Kit",
    label: "Fax Kit",
    color: "bg-amber-100 text-amber-700",
    activeColor: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "Punch Kit",
    label: "Punch Kit",
    color: "bg-pink-100 text-pink-700",
    activeColor: "bg-pink-500 text-white border-pink-500",
  },
  {
    value: "Staple Kit",
    label: "Staple Kit",
    color: "bg-red-100 text-red-700",
    activeColor: "bg-red-500 text-white border-red-500",
  },
  {
    value: "Tray",
    label: "Tray",
    color: "bg-yellow-100 text-yellow-700",
    activeColor: "bg-yellow-500 text-white border-yellow-500",
  },
  {
    value: "Add On Kit",
    label: "Add on Kit",
    color: "bg-purple-100 text-purple-700",
    activeColor: "bg-purple-500 text-white border-purple-500",
  },
  {
    value: "Others",
    label: "Others",
    color: "bg-gray-100 text-gray-600",
    activeColor: "bg-gray-500 text-white border-gray-500",
  },
];

function getCategoryStyle(category: string) {
  return (
    CATEGORY_OPTIONS.find((c) => c.value === category)?.color ??
    "bg-gray-100 text-gray-600"
  );
}

export default function EquipmentAdminPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<EquipmentSpec[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // null = All
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form state
  const [currentId, setCurrentId] = useState<number>(0);
  const [specName, setSpecName] = useState<string>("");
  const [category, setCategory] = useState<string>("Finisher");
  const [basicPrice, setBasicPrice] = useState<number>(0);
  const [price60Months, setPrice60Months] = useState<number>(0);
  const [price36Months, setPrice36Months] = useState<number>(0);
  const [formError, setFormError] = useState("");
  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/EquipmentSpec`);
      if (res.ok) {
        const data = await res.json();
        const sorted = [...data].sort(
          (a: EquipmentSpec, b: EquipmentSpec) => a.id - b.id,
        );
        setEquipments(sorted);
      } else {
        const errorText = await res.text();
        alert(`Failed to fetch: ${errorText}`);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(0);
    setSpecName("");
    setCategory("Finisher");
    setBasicPrice(0);
    setPrice60Months(0);
    setPrice36Months(0);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EquipmentSpec) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setSpecName(item.specName);
    setCategory(item.category || "Finisher");
    setBasicPrice(item.basicPrice);
    setPrice60Months(item.price60Months);
    setPrice36Months(item.price36Months);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!specName.trim()) {
      alert("Equipment name is required.");
      return;
    }

    const payload = {
      id: currentId,
      specName,
      category,
      basicPrice: Number(basicPrice),
      price60Months: Number(price60Months),
      price36Months: Number(price36Months),
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const url = isEditing
        ? `${baseUrl}/api/EquipmentSpec/${currentId}`
        : `${baseUrl}/api/EquipmentSpec`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(
          isEditing
            ? "Equipment updated successfully."
            : "Equipment added successfully.",
        );

        setIsModalOpen(false);
        fetchEquipments();
        return;
      }

      if (res.status === 409) {
        const error = await res.json();
        setFormError(error.message);
        return;
      }

      const errorText = await res.text();
      alert(`Operation failed: ${errorText}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/EquipmentSpec/${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchEquipments();
      } else {
        alert("Failed to delete equipment.");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  // Derived
  const filtered = activeFilter
    ? equipments.filter((e) => e.category === activeFilter)
    : equipments;

  return (
    <div className='min-h-screen bg-slate-50 font-sans'>
      {/* ── Page Sub-header (light, sits below the existing site nav) ── */}
      <div className='bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between'>
        {/* 左侧：标题与图标 */}
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-slate-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={1.8}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-sm font-bold text-slate-800 leading-tight'>
              Equipment Specs
            </h1>
            <p className='text-[11px] text-slate-400 leading-tight'>
              Optional add-ons &amp; rental pricing
            </p>
          </div>
        </div>

        {/* 🚀 右侧：按钮组合容器 */}
        <div className='flex items-center gap-2'>
          {/* Back 按钮 */}
          <button
            onClick={() => router.back()}
            className='flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 19l-7-7 7-7'
              />
            </svg>
            Back
          </button>

          {/* Add Equipment 主按钮 */}
          <button
            onClick={openAddModal}
            className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2.5}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 4v16m8-8H4'
              />
            </svg>
            Add Equipment
          </button>
        </div>
      </div>

      <main className='px-8 py-5 max-w-7xl mx-auto'>
        {/* ── Filter Tabs ── */}
        <div className='flex flex-wrap items-center gap-2 mb-4'>
          {/* All */}
          <button
            onClick={() => setActiveFilter(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeFilter === null
                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            All
            <span
              className={`text-[11px] font-bold tabular-nums ${activeFilter === null ? "opacity-70" : "text-slate-400"}`}
            >
              {equipments.length}
            </span>
          </button>

          {/* Per-category */}
          {CATEGORY_OPTIONS.map((cat) => {
            const count = equipments.filter(
              (e) => e.category === cat.value,
            ).length;
            const isActive = activeFilter === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveFilter(isActive ? null : cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isActive
                    ? cat.activeColor + " shadow-sm"
                    : `bg-white border-slate-200 text-slate-600 hover:border-slate-300`
                }`}
              >
                {/* Colored dot when inactive */}
                {!isActive && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${cat.color.split(" ")[0].replace("bg-", "bg-").replace("100", "500")}`}
                  />
                )}
                {cat.label}
                <span
                  className={`text-[11px] font-bold tabular-nums ${isActive ? "opacity-70" : "text-slate-400"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Active filter label */}
          {activeFilter && (
            <span className='text-xs text-slate-400 ml-1'>
              — showing{" "}
              <span className='font-semibold text-slate-600'>
                {filtered.length}
              </span>{" "}
              of {equipments.length}
            </span>
          )}
        </div>

        {/* ── Main Table Card ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-20 text-slate-400 gap-3'>
              <svg
                className='w-7 h-7 animate-spin text-blue-400'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                />
              </svg>
              <span className='text-sm'>Loading equipment data…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 text-slate-400 gap-2'>
              <svg
                className='w-10 h-10 text-slate-300'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={1.2}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4'
                />
              </svg>
              <p className='text-sm font-medium'>
                {activeFilter
                  ? `No items in "${activeFilter}"`
                  : "No equipment yet"}
              </p>
              {!activeFilter && (
                <p className='text-xs text-slate-400'>
                  Click <strong>Add Equipment</strong> to get started.
                </p>
              )}
            </div>
          ) : (
            <table className='w-full text-left'>
              <thead>
                <tr className='border-b border-slate-100 bg-slate-50/70'>
                  <th className='px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-16'>
                    #
                  </th>
                  <th className='px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400'>
                    Equipment Name
                  </th>
                  <th className='px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400'>
                    Category
                  </th>
                  <th className='px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right'>
                    Purchase (RM)
                  </th>
                  <th className='px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right'>
                    36 Mo /mo
                  </th>
                  <th className='px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right'>
                    60 Mo /mo
                  </th>
                  <th className='px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-24'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`group border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 !== 0 ? "bg-slate-50/30" : ""}`}
                  >
                    <td className='px-5 py-3.5'>
                      <span className='text-xs font-mono font-semibold text-slate-300 group-hover:text-blue-300 transition-colors'>
                        {String(item.id).padStart(3, "0")}
                      </span>
                    </td>
                    <td className='px-5 py-3.5'>
                      <span className='text-sm font-semibold text-slate-800'>
                        {item.specName}
                      </span>
                    </td>
                    <td className='px-5 py-3.5'>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getCategoryStyle(item.category)}`}
                      >
                        {item.category || "—"}
                      </span>
                    </td>
                    <td className='px-5 py-3.5 text-right'>
                      <span className='text-sm font-medium text-slate-700 tabular-nums'>
                        {item.basicPrice > 0 ? (
                          item.basicPrice.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })
                        ) : (
                          <span className='text-slate-300'>—</span>
                        )}
                      </span>
                    </td>
                    <td className='px-5 py-3.5 text-right'>
                      <span className='text-sm font-semibold text-orange-500 tabular-nums'>
                        {item.price36Months > 0 ? (
                          item.price36Months.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })
                        ) : (
                          <span className='text-slate-300 font-normal'>—</span>
                        )}
                      </span>
                    </td>
                    <td className='px-5 py-3.5 text-right'>
                      <span className='text-sm font-semibold text-emerald-600 tabular-nums'>
                        {item.price60Months > 0 ? (
                          item.price60Months.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })
                        ) : (
                          <span className='text-slate-300 font-normal'>—</span>
                        )}
                      </span>
                    </td>
                    <td className='px-5 py-3.5 text-center'>
                      <div className='flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button
                          onClick={() => openEditModal(item)}
                          title='Edit'
                          className='p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z'
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          title='Delete'
                          className='p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z'
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Table Footer */}
          {!loading && equipments.length > 0 && (
            <div className='px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between'>
              <span className='text-xs text-slate-400'>
                {activeFilter ? (
                  <>
                    Filtered:{" "}
                    <span className='font-semibold text-slate-600'>
                      {filtered.length}
                    </span>{" "}
                    of {equipments.length} equipments
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <span className='font-semibold text-slate-600'>
                      {equipments.length}
                    </span>{" "}
                    equipment{equipments.length !== 1 ? "s" : ""}, sorted by ID
                  </>
                )}
              </span>
              <span className='text-xs text-slate-400'>
                IDs #{equipments[0]?.id} – #
                {equipments[equipments.length - 1]?.id}
              </span>
            </div>
          )}
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden'>
            <div
              className={`px-6 py-4 flex items-center justify-between border-b border-slate-100 ${isEditing ? "bg-blue-50" : "bg-slate-50"}`}
            >
              <div className='flex items-center gap-2'>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${isEditing ? "bg-blue-500" : "bg-slate-700"}`}
                >
                  {isEditing ? (
                    <svg
                      className='w-3.5 h-3.5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z'
                      />
                    </svg>
                  ) : (
                    <svg
                      className='w-3.5 h-3.5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className='text-sm font-bold text-slate-800'>
                    {isEditing ? "Edit Equipment" : "Add New Equipment"}
                  </h2>
                  {isEditing && (
                    <p className='text-[11px] text-slate-400'>
                      ID: {String(currentId).padStart(3, "0")}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className='p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                  Equipment Name <span className='text-red-400'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='e.g., Inner Finisher-K1'
                  value={specName}
                  onChange={(e) => setSpecName(e.target.value)}
                  className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-slate-800 placeholder-slate-300 bg-slate-50 transition'
                />
              </div>
              {formError && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm'>
                  {formError}
                </div>
              )}
              <div>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                  Category
                </label>
                <div className='flex flex-wrap gap-2'>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.value}
                      type='button'
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        category === cat.value
                          ? "border-blue-400 bg-blue-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-3 gap-3'>
                <div>
                  <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                    Purchase (RM)
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={basicPrice}
                    onChange={(e) =>
                      setBasicPrice(parseFloat(e.target.value) || 0)
                    }
                    className='w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-slate-800 bg-slate-50 transition'
                  />
                </div>
                <div>
                  <label className='block text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5'>
                    36 Mo /mo
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={price36Months}
                    onChange={(e) =>
                      setPrice36Months(parseFloat(e.target.value) || 0)
                    }
                    className='w-full px-3 py-2.5 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-sm text-orange-600 font-medium bg-orange-50/50 transition'
                  />
                </div>
                <div>
                  <label className='block text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1.5'>
                    60 Mo /mo
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={price60Months}
                    onChange={(e) =>
                      setPrice60Months(parseFloat(e.target.value) || 0)
                    }
                    className='w-full px-3 py-2.5 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-sm text-emerald-700 font-medium bg-emerald-50/50 transition'
                  />
                </div>
              </div>

              <div className='flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl shadow-sm transition-colors'
                >
                  {isEditing ? "Save Changes" : "Add Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmId !== null && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden'>
            <div className='px-6 py-5 flex flex-col items-center text-center gap-3'>
              <div className='w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-red-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
                  />
                </svg>
              </div>
              <div>
                <h3 className='text-sm font-bold text-slate-800'>
                  Delete Equipment?
                </h3>
                <p className='text-xs text-slate-500 mt-1 leading-relaxed'>
                  This will permanently remove ID{" "}
                  <span className='font-mono font-semibold text-slate-700'>
                    {String(deleteConfirmId).padStart(3, "0")}
                  </span>{" "}
                  and any linked pricing rules. This cannot be undone.
                </p>
              </div>
            </div>
            <div className='px-6 pb-5 flex gap-2'>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className='flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className='flex-1 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-xl shadow-sm transition-colors'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
