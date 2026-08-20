"use client";

import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Building,
  User,
  Filter,
  Clock,
} from "lucide-react";
import { FilterChip } from "./shared";

export function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  activeFilterCount,
  clearAllFilters,
  filterorderNumber,
  setFilterorderNumber,
  filterCreatedAt,
  setFilterCreatedAt,
  filterFrom,
  setFilterFrom,
  filterCompanyName,
  setFilterCompanyName,
  filterPic,
  setFilterPic,
  picOptions,
  filterStatus,
  setFilterStatus,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
}: any) {
  return (
    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
      <div className='px-5 py-3.5 flex items-center gap-3'>
        <div className='relative flex-1 min-w-0'>
          <Search
            size={15}
            className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search item, location, company, PIC…'
            className='w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v: boolean) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all duration-200 whitespace-nowrap
            ${
              showFilters || activeFilterCount > 0
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className='flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-white text-indigo-600'>
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {(activeFilterCount > 0 || searchQuery) && (
          <button
            onClick={clearAllFilters}
            className='flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-all whitespace-nowrap'
          >
            <X size={14} /> Clear all
          </button>
        )}
      </div>

      {showFilters && (
        <div className='px-5 pb-5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <Building size={10} /> Order Number
            </label>
            <div className='relative'>
              <input
                type='text'
                value={filterorderNumber}
                onChange={(e) => setFilterorderNumber(e.target.value)}
                placeholder='Search Order Number...'
                className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                  ${filterorderNumber ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
              />
              {filterorderNumber && (
                <button
                  onClick={() => setFilterorderNumber("")}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <Building size={10} /> Created At
            </label>
            <div className='relative'>
              <input
                type='date'
                value={filterCreatedAt}
                onChange={(e) => setFilterCreatedAt(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition-all cursor-pointer
                ${
                  filterCreatedAt
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold"
                    : "border-slate-200 bg-slate-50 text-slate-500 focus:bg-white focus:border-indigo-400"
                }`}
              />
              {filterCreatedAt && (
                <button
                  onClick={() => setFilterCreatedAt("")}
                  className='absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
                  title='Clear date'
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <Building size={10} /> From
            </label>
            <div className='relative'>
              <input
                type='text'
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                placeholder='Search From...'
                className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                  ${filterFrom ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
              />
              {filterFrom && (
                <button
                  onClick={() => setFilterFrom("")}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <Building size={10} /> Company Name
            </label>
            <div className='relative'>
              <input
                type='text'
                value={filterCompanyName}
                onChange={(e) => setFilterCompanyName(e.target.value)}
                placeholder='Search company...'
                className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                  ${filterCompanyName ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
              />
              {filterCompanyName && (
                <button
                  onClick={() => setFilterCompanyName("")}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <User size={10} /> PIC
            </label>
            <div className='relative'>
              <select
                value={filterPic}
                onChange={(e) => setFilterPic(e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl appearance-none cursor-pointer pr-8 outline-none transition-all
                  ${filterPic ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
              >
                <option value=''>All PIC</option>
                {picOptions.map((p: string) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
              />
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <Filter size={10} /> Status
            </label>
            <div className='relative'>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl appearance-none cursor-pointer pr-8 outline-none transition-all
                  ${filterStatus ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
              >
                <option value=''>All Status</option>
                <option value='Waiting'>Waiting</option>
                <option value='Arrange'>Arranging</option>
                <option value='Assign'>Assigned</option>
                <option value='Complete'>Complete</option>
                <option value='AwaitingStock'>Awaiting Stock</option>
              </select>
              <ChevronDown
                size={13}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
              />
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <Clock size={10} /> Schedule From
            </label>
            <input
              type='date'
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                ${filterDateFrom ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
              <Clock size={10} /> Schedule To
            </label>
            <input
              type='date'
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                ${filterDateTo ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
            />
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <div
          className={`px-5 pb-3.5 flex flex-wrap gap-2 ${showFilters ? "" : "border-t border-slate-100 pt-3"}`}
        >
          {filterPic && (
            <FilterChip
              label={`PIC: ${filterPic}`}
              onRemove={() => setFilterPic("")}
            />
          )}
          {filterStatus && (
            <FilterChip
              label={`Status: ${filterStatus}`}
              onRemove={() => setFilterStatus("")}
            />
          )}
          {filterDateFrom && (
            <FilterChip
              label={`From: ${filterDateFrom}`}
              onRemove={() => setFilterDateFrom("")}
            />
          )}
          {filterDateTo && (
            <FilterChip
              label={`To: ${filterDateTo}`}
              onRemove={() => setFilterDateTo("")}
            />
          )}
        </div>
      )}
    </div>
  );
}