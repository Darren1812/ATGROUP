"use client";

import { Plus, Trash2 } from "lucide-react";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from 'next/image';
import ProtectedRoute from "@/components/ProtectedRoute";

type DateFormatType = "date1" | "date2" | "date3" | "date4";

// **********************************************
// NOTE: REPLACE THIS WITH YOUR ACTUAL BASE URL
const API_BASE_URL = "https://localhost:7253/api/Docx";
// **********************************************

// A utility function to convert a date string (YYYY-MM-DD) into custom formats
const formatCustomDate = (
  dateString: string,
  formatType: DateFormatType
): string | null => {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return null;

  switch (formatType) {
    case "date1": // e.g., 22/09/2025
      return date.toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    case "date2": {
      // e.g., 20250922
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}${month}${day}`;
    }

    case "date3": {
      // e.g., 1st October 2025
      const dayOfMonth = date.getDate();
      let suffix = "th";
      if (dayOfMonth === 1 || dayOfMonth === 21 || dayOfMonth === 31)
        suffix = "st";
      else if (dayOfMonth === 2 || dayOfMonth === 22) suffix = "nd";
      else if (dayOfMonth === 3 || dayOfMonth === 23) suffix = "rd";

      // Use UK English for day-month-year order
      const formattedDateString = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Replace numeric day with suffixed version
      return formattedDateString.replace(
        String(dayOfMonth),
        dayOfMonth + suffix
      );
    }

    case "date4": // e.g., Sep 2025
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

    default:
      return dateString;
  }
};
export default function G_ATP() {

  const [items, setItems] = useState([
    {
      title: "",
      content: "",
      itemname: "",
      i_model: "",
      i_function: "",
      i_detail: "",
      proposedmodel_type: "New",
      proposedmodel: "",
      mrpv: "",
      Rental: "",
      Rental_D: "",
      Meter_c: "",
      Tawaran_NT: "",
      i_detail_fontsize: "",
    },
  ]);

  const generateJSON = () => {
    const data = {
      TemplateName: "G_ATP",
      BeforeData: {
        customername: customerName,
        staffname: staffName,
        staffposition: staffPosition,
        staffmobile: staffMobile,
        staffemail: staffEmail,
        date: formattedDates.date1,
        date2: formattedDates.date2,
        date3: formattedDates.date3,
        date4: formattedDates.date4,
        customeraddress: customerAddress,
        customer: customer,
      },
      Items: items, // 👈 now correctly bound
      AfterData: {
        staffname: staffName,
        staffposition: staffPosition,
        staffmobile: staffMobile,
        staffemail: staffEmail,
      },
    };

    return data;
  };

  const handleGenerate = async () => {
    const data = generateJSON(); // now returns correct ProposalRequest

    try {
      const response = await fetch("https://localhost:7253/api/Docx/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to generate proposal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Proposal.docx";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating proposal:", error);
      alert("Something went wrong while generating the document.");
    }
  };
  const handleItemChange = (index: number, field: string, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (field === "itemname") {
      setRentalItems((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].CadanganModel = value;
        }
        return updated;
      });
    }
  };

  const addNewItem = () => {
    setItems((prev) => [
      ...prev,
      {
        title: "",
        content: "",
        itemname: "",
        i_model: "",
        i_function: "",
        i_detail: "",
        proposedmodel_type: "New",
        proposedmodel: "",
        mrpv: "",
        Rental: "",
        Rental_D: "",
        Meter_c: "",
        Tawaran_NT: "",
        i_detail_fontsize: "",
      },
    ]);
  };


  // Document Placeholders
  const [rentalTitle, setRentalTitle] = useState("");
  const [totalMonths, setTotalMonths] = useState(24);
  const [rentalItems, setRentalItems] = useState([
    {
      Lokasi: "",
      Spesifikasi: "",
      Kelajuan: "",
      CadanganModel: "",
      Kuantiti: 1,
      HargaBulanan: 0,
      JumlahHarga: 0,
    },
  ]);

  const [printCostItems, setPrintCostItems] = useState([
    {
      NameAndSpecification: "",
      EstimatedMonthlyMeterReading: 0,
      PrintChargeRate: 0,
    },
  ]);

  const [userNote, setUserNote] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPosition, setStaffPosition] = useState("");
  const [staffMobile, setStaffMobile] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().substring(0, 10)
  ); // YYYY-MM-DD
  const [customer, setCustomer] = useState("");

  // Document Fields 2
  const [customerAddress, setCustomerAddress] = useState("");

  // Item Details
  // New states for API loading/error feedback
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Function to fetch user data from the API
  const fetchStaffInfo = useCallback(async (name: string) => {
    if (name.trim() === "") {
      // Clear previous staff info if the name field is emptied
      setStaffPosition("");
      setStaffMobile("");
      setStaffEmail("");
      setFetchError(null);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    const encodedName = encodeURIComponent(name);
    const url = `${API_BASE_URL}/userinfo?name=${encodedName}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Attempt to read the message from the API response (e.g., "User not found.")
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();

      // Update the state fields with the data from the API
      setStaffPosition(data.position || "");
      setStaffMobile(data.mobile || "");
      setStaffEmail(data.email || "");
    } catch (error) {
      // Display an error message to the user
      setFetchError(
        `Error fetching staff info: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // Optionally clear the auto-fill fields if fetch failed
      setStaffPosition("");
      setStaffMobile("");
      setStaffEmail("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useEffect hook to call the API whenever staffName changes
  useEffect(() => {
    // Debouncing: Wait a short time before calling the API after typing stops
    const delayDebounceFn = setTimeout(() => {
      fetchStaffInfo(staffName);
    }, 500); // Wait 500ms after the last keystroke

    return () => clearTimeout(delayDebounceFn); // Cleanup function to cancel the timeout
  }, [staffName, fetchStaffInfo]);

  // Use useMemo to calculate the different date formats
  const formattedDates = useMemo(() => {
    return {
      date1:
        formatCustomDate(dateInput, "date1" as DateFormatType) || "{date1}",
      date2:
        formatCustomDate(dateInput, "date2" as DateFormatType) || "{date2}",
      date3:
        formatCustomDate(dateInput, "date3" as DateFormatType) || "{date3}",
      date4:
        formatCustomDate(dateInput, "date4" as DateFormatType) || "{date4}",
    };
  }, [dateInput]);

  const handleGenerateRentalSummary = async () => {
    const rentalData = {
      title: rentalTitle,
      TotalMonths: totalMonths,
      items: rentalItems,
      PrintCostItems: printCostItems,
      UserNote: userNote,
    };

    try {
      const response = await fetch(
        "https://localhost:7253/Document/generate-rental-summary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(rentalData),
        }
      );

      if (!response.ok) throw new Error("Failed to generate rental summary");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        `${rentalTitle.replace(/\s+/g, "_")}.docx` || "Rental_Summary.docx";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating rental summary:", error);
      alert("Something went wrong while generating the rental summary.");
    }
  };
  const removeRentalItem = (index: number) => {
    setRentalItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removePrintCostItem = (index: number) => {
    setPrintCostItems((prev) => prev.filter((_, idx) => idx !== index));
  };
  const handleAddItemWithRental = () => {
    addNewItem(); // call your original function

    setRentalItems((prev) => [
      ...prev,
      {
        Lokasi: customerName || "", // auto-fill from your companyname variable
        Spesifikasi: "",
        Kelajuan: "",
        CadanganModel: "",
        Kuantiti: 1,
        HargaBulanan: 0,
        JumlahHarga: 0,
      },
    ]);
  };
  useEffect(() => {
    setRentalItems((prev) =>
      prev.map((rental) => ({
        ...rental,
        Lokasi: customerName,
      }))
    );
  }, [customerName]);

  return (
    <ProtectedRoute>
      <div>
        <div className="max-w-screen-xl mx-auto p-4 w-450 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 mb-6 text-gray-500 border border-gray-200/50 mx-auto">
          <table className="w-full">
            <tbody>
              {/*Heading 1*/}
              <tr>
                {/* Column 1: Header Input Fields (Adjusted to w-1/2) */}
                <td className="w-1/2 p-4 ">
                  <div className="h-200 ml-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">H</span>
                      </div>
                      Header 1
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Name
                        </label>
                        <input
                          type="text"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="Enter name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        {isLoading && (
                          <p className="text-xs text-blue-500 mt-1">
                            Loading staff info...
                          </p>
                        )}
                        {fetchError && (
                          <p className="text-xs text-red-500 mt-1">
                            {fetchError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Position
                        </label>
                        <input
                          type="text"
                          value={staffPosition}
                          onChange={(e) => setStaffPosition(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Mobile
                        </label>
                        <input
                          type="text"
                          value={staffMobile}
                          onChange={(e) => setStaffMobile(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Email
                        </label>
                        <input
                          type="email"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={dateInput}
                          onChange={(e) => setDateInput(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Current value:{" "}
                          <span className="font-semibold text-blue-600">
                            {dateInput}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Column 2: Live Preview (w-1/2) */}
                <td className="w-1/2 p-4">
                  <div className="ml-10 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm">👁</span>
                      </div>
                      Live Preview
                    </h4>

                    {/* Header Image Preview */}
                    <div className="rounded-xl p-4 mb-6 border border-gray-300 bg-gray-50">
                      {" "}
                      {/* Simplified the container styling */}
                      <div className="rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src="/images/header1.png"
                          alt="Header Image Template"
                          width={1200}      // set width and height for layout stability
                          height={300}
                          className="w-full max-h-120 object-contain"
                        />
                      </div>
                    </div>
                    {/* END Header Image Section */}

                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Digital Imaging Solution Proposal for:</strong>
                        <span className="text-red-600 underline ml-2">
                          {customerName || "{customername}"}
                        </span>
                      </p>
                      <div className="bg-white p-3 rounded mt-2">
                        <p>
                          <strong>Prepared by:</strong>{" "}
                          {staffName || "{staffname}"}
                        </p>
                        <p>({staffPosition || "{staffposition}"})</p>
                        <p>
                          <strong>mobile:</strong>{" "}
                          {staffMobile || "{staffmobile}"}
                        </p>
                        <p>
                          <strong>email:</strong> {staffEmail || "{staffemail}"}
                        </p>
                      </div>
                      <p>
                        <strong>Date:</strong> {formattedDates.date1}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
              {/* Heading 2 */}
              <tr>
                {/* Column 1: Header Input Fields (Adjusted to w-1/2) */}
                <td className="w-1/2 p-4">
                  <div className="h-200 ml-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">H</span>
                      </div>
                      Header 2
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Our Ref
                        </label>
                        <input
                          type="text"
                          value={`${formattedDates.date2}/001`}
                          readOnly
                          placeholder="Auto-generated reference"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="text"
                          value={formattedDates.date3}
                          readOnly
                          placeholder="Auto-generated date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Address
                        </label>
                        <textarea
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Enter customer address"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer
                        </label>
                        <input
                          type="text"
                          value={customer}
                          onChange={(e) => setCustomer(e.target.value)}
                          placeholder="Enter customer name"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="text"
                          value={formattedDates.date4}
                          readOnly
                          placeholder="Auto-generated date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Column 2: Document Preview (Adjusted to w-1/2 and styled like the document) */}
                <td className="w-3/5 p-4">
                  <div className="ml-10 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-b pb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm">📄</span>
                      </div>
                      Document Preview
                    </h4>
                    {/* Document Style Container (A4-like box) */}
                    <div className="w-150 bg-white border border-gray-300 p-8 shadow-inner overflow-hidden text-xs space-y-3">
                      <div className="space-y-1">
                        <p className="flex justify-left">
                          <span className="font-bold">Our Ref</span>
                          <span className="ml-2 text-blue-700">
                            {formattedDates.date2 || "{date2}"}/001
                          </span>
                        </p>
                        <p className="flex justify-left">
                          <span>{formattedDates.date3 || "{date3}"}</span>
                        </p>
                      </div>

                      <div className="pt-4 space-y-1">
                        <p className="font-bold text-sm text-red-600">  
                          {customerName || "{customername}"}
                        </p>
                        <div className="whitespace-pre-wrap">
                          {customerAddress || "{customeraddress}"}
                        </div>
                        <p>
                          <span className="font-bold">Attention:</span>{" "}
                          {customer || "{customer}"}
                        </p>
                      </div>

                      {/* Salutation and main text preview (UNCHANGED) */}
                      <p className="pt-4">Dear Sir/Madam,</p>

                      <p className="font-bold pt-2">
                        ACQUISITION OF CANON DIGITAL OFFICE SOLUTION - CANON
                        IMAGERUNNER ADVANCE DX SERIES
                      </p>

                      {/* **FIX APPLIED HERE: Split the problematic nested <p> content** */}
                      <p className="text-gray-700">
                        ATP Sales & Services Sdn Bhd values{" "}
                        <span className="text-red-600 underline">
                          {customerName || "{customername}"}
                        </span>{" "}
                        business and takes pride in being able to contribute to
                        your continued success... at{" "}
                        <span className="text-red-600 underline">
                          {customerName || "{customername}"}
                        </span>
                        .
                      </p>

                      {/* This paragraph was previously nested. It now stands alone. */}
                      <p className="pt-4 text-gray-700">
                        With the Canon imageRUNNER ADVANCE DX model, we have
                        realized an ambitious goal. Now small departments and
                        workgroups can enjoy stunningly simplified and productive
                        workflow... all in a compact footprint.
                      </p>

                      <p className="pt-4">
                        We are confident our proposed solution will meet your
                        organization’s immediate and future requirements. We shall
                        look forward to your approval on the implementation of our
                        proposed solution by{" "}
                        <span className="text-blue-700">
                          {formattedDates.date4 || "{date4}"}
                        </span>
                        .
                      </p>
                      <p className="pt-4">Thank you.</p>

                      {/* Signature Block Preview (UNCHANGED) */}
                      <div className="pt-8 text-[10px] space-y-1">
                        <p>Yours faithfully,</p>
                        <p>for ATP Sales & Services Sdn. Bhd. (1275709-U)</p>
                        <div className="mt-8 w-48 pt-1">
                          <u className="font-bold">
                            {staffName || "{staffname}"}
                          </u>
                          <p>{staffPosition || "{staffposition}"}</p>
                          <p>Mobile: {staffMobile || "{staffmobile}"}</p>
                          <p>Email: {staffEmail || "{staffemail}"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/*Item page */}
              {items.map((item, index) => (
                <tr key={index}>
                  {/* Column 1: Item Input Fields (Keep as w-1/3) */}
                  <td className="w-1/3 p-4 align-top">
                    <div className="ml-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">
                            {index + 1}
                          </span>
                        </div>
                        Item {index + 1}
                      </h3>

                      <div className="space-y-4">
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              handleItemChange(index, "title", e.target.value)
                            }
                            placeholder="Enter title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                          </label>
                          <input
                            type="text"
                            value={item.content}
                            onChange={(e) =>
                              handleItemChange(index, "content", e.target.value)
                            }
                            placeholder="Enter content"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={item.itemname}
                            onChange={(e) =>
                              handleItemChange(index, "itemname", e.target.value)
                            }
                            placeholder="Enter item name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        {/* Proposed Models */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proposed Models
                          </label>
                          <textarea
                            value={item.i_model}
                            onChange={(e) =>
                              handleItemChange(index, "i_model", e.target.value)
                            }
                            placeholder="Enter proposed models"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            rows={3}
                          />
                        </div>

                        {/* Function */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Function
                          </label>

                          {/* Ensure default selection */}
                          {!item.i_function || item.i_function.trim() === ""
                            ? (handleItemChange(
                              index,
                              "i_function",
                              "Copy, Print, Scan, Store"
                            ),
                              null)
                            : null}

                          <div className="flex flex-wrap gap-2">
                            {[
                              "Copy",
                              "Print",
                              "Scan",
                              "Store",
                              "Fax",
                              "Staple",
                              "Puncher",
                              "Booklet",
                            ].map((func) => {
                              const selected = item.i_function
                                ?.split(", ")
                                .includes(func);
                              return (
                                <button
                                  key={func}
                                  type="button"
                                  onClick={() => {
                                    const selectedList = item.i_function
                                      ? item.i_function.split(", ")
                                      : [];
                                    if (selectedList.includes(func)) {
                                      const newList = selectedList.filter(
                                        (f) => f !== func
                                      );
                                      handleItemChange(
                                        index,
                                        "i_function",
                                        newList.join(", ")
                                      );
                                    } else {
                                      const newList = [...selectedList, func];
                                      handleItemChange(
                                        index,
                                        "i_function",
                                        newList.join(", ")
                                      );
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-lg border ${selected
                                    ? "bg-grey-500 text-blue-400 border-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-300 hover:border-blue-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                    : "bg-white text-gray-700 border-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-300 hover:border-gray-400 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                    }`}
                                >
                                  {func}
                                </button>
                              );
                            })}
                          </div>

                          <input
                            type="text"
                            value={item.i_function}
                            readOnly
                            placeholder="Selected functions"
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        {/* Details */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Details/Features
                            <label
                              htmlFor={`i_detail_fontsize_${index}`}
                              className="ml-5 text-xs font-medium text-gray-500 whitespace-nowrap"
                            >
                              Detail Font Size (pt):
                            </label>
                            <input
                              id={`i_detail_fontsize_${index}`}
                              type="number"
                              min="8"
                              max="14"
                              value={item.i_detail_fontsize || "9"}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "i_detail_fontsize",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. 9"
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 bg-white"
                            />
                          </label>
                          <textarea
                            value={item.i_detail}
                            onChange={(e) =>
                              handleItemChange(index, "i_detail", e.target.value)
                            }
                            placeholder="Enter details"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            rows={3}
                          />
                        </div>

                        {/* Proposed Model Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proposed Model Type
                          </label>
                          <select
                            value={item.proposedmodel_type}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "proposedmodel_type",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="New">New</option>
                            <option value="Refurbished">Refurbished</option>
                          </select>
                        </div>

                        {/* Proposed Model */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proposed Model
                          </label>
                          <textarea
                            value={item.proposedmodel}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "proposedmodel",
                                e.target.value
                              )
                            }
                            placeholder="Enter proposed model"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            rows={3}
                          />
                        </div>

                        {/* Monthly Recommended Print Volume */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Recommended Print Volume
                          </label>
                          <input
                            type="text"
                            value={item.mrpv}
                            onChange={(e) =>
                              handleItemChange(index, "mrpv", e.target.value)
                            }
                            placeholder="Enter Monthly Recommended Print Volume"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        {/* Meter Charges */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meter Charges
                          </label>
                          <input
                            type="text"
                            value={item.Meter_c}
                            onChange={(e) =>
                              handleItemChange(index, "Meter_c", e.target.value)
                            }
                            placeholder="Enter meter charges"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        {/* Rental/Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rental/Unit
                          </label>
                          <input
                            type="text"
                            value={item.Rental}
                            onChange={(e) =>
                              handleItemChange(index, "Rental", e.target.value)
                            }
                            placeholder="Enter rental duration"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        {/* Rental Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rental Duration
                          </label>
                          <input
                            type="text"
                            value={item.Rental_D}
                            onChange={(e) =>
                              handleItemChange(index, "Rental_D", e.target.value)
                            }
                            placeholder="Enter refundable deposit"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tawaran Nilai Tambah
                          </label>
                          <input
                            type="text"
                            value={item.Tawaran_NT}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "Tawaran_NT",
                                e.target.value
                              )
                            }
                            placeholder="Enter Tawaran Nilai Tambah"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Merged Live Preview and Document Preview (now w-2/3) */}
                  <td className="w-2/3 p-4">
                    <div className="ml-10 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-xl p-6 shadow-lg">
                      <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-b pb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm">📄</span>
                        </div>
                        Document Preview
                      </h4>
                      <h3 className="ml-2 font-bold text-red-500">
                        {item.title || "Title"}
                      </h3>
                      <h4 className="ml-4">{item.content || "content"}</h4>
                      <h3 className="ml-2 mt-2 font-bold">
                        Pricing Schedule: {item.itemname || "{itemname}"}
                      </h3>
                      {/* This container tries to replicate the internal structure of the document's table */}

                      <div className="mt-2 flex flex-col border border-gray-300 rounded-lg overflow-hidden">
                        <div className="flex border-b border-gray-300">
                          <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                            Proposed Model
                          </p>
                          <p className="w-1/2 p-2 bg-gray-50 text-sm">
                            {item.i_model || "{i_model}"}
                          </p>
                        </div>
                        <div className="flex border-b border-gray-300">
                          <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                            Function
                          </p>
                          <p className="w-1/2 p-2 bg-gray-50 text-sm">
                            {item.i_function || "{i_function}"}
                          </p>
                        </div>
                        {/* Top Section: Model/Function/Image */}
                        <div className="flex border-b border-gray-300">
                          {/* Left Column: Image (w-1/2) */}
                          <div className="w-1/2 p-4 border-r border-gray-300 text-center bg-gray-50">
                            <div className="rounded-lg overflow-hidden shadow-md bg-gray-50 p-2">
                              Configuration & Feature available (depend on configuration)
                              <Image
                                src="/images/C_ATP/c_atpitem.png"
                                alt="Item Image"
                                width={600}
                                height={300}
                                className="mt-5 w-full h-auto max-h-48 object-contain"
                              />
                            </div>

                          </div>

                          {/* Right Column: Function & Details (w-1/2) */}
                          <div className="w-1/2 p-4 bg-gray-50">
                            <p className="font-semibold text-sm mb-2">
                              Details/Features:
                            </p>
                            <div
                              className="whitespace-pre-wrap text-xs text-gray-700 border border-gray-200 p-2 rounded-md bg-white overflow-y-auto"
                              style={{ maxHeight: "200px" }}
                            >
                              {item.i_detail ||
                                "Enter details above to preview the full list here..."}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Pricing Details */}
                        <div className="flex flex-col text-sm">
                          <div className="flex border-b border-gray-300">
                            <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                              Proposed Model {""}({item.proposedmodel_type})
                            </p>
                            <p className="w-1/2 p-2 bg-gray-50">
                              {item.proposedmodel || "{proposedmodel}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-300">
                            <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                              Monthly Recommended Print Volume
                            </p>
                            <p className="w-1/2 p-2 bg-gray-50">
                              {item.mrpv || "{mrpv}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-300">
                            <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                              Meter Charges
                            </p>
                            <p className="w-1/2 p-2 bg-gray-50">
                              {item.Meter_c || "{Meter_c}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-300">
                            <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                              Rental/Unit
                            </p>
                            <p className="w-1/2 p-2 bg-gray-50">
                              {item.Rental || "{Rental}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-300">
                            <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                              Rental Duration
                            </p>
                            <p className="w-1/2 p-2 bg-gray-50">
                              {item.Rental_D || "{Rental_D}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-300">
                            <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-300">
                              Tawaran Nilai Tambah
                            </p>
                            <p className="w-1/2 p-2 bg-gray-50">
                              {item.Tawaran_NT || "{Tawaran_NT}"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Remove button */}
                    {items.length > 1 && ( // Only show remove button if there is more than 1 item
                      <div className="text-right mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to remove this item?"
                              )
                            ) {
                              setItems((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }
                          }}
                          className="
                            px-4 py-2
                            text-sm font-semibold
                            rounded-lg
                            border-2 border-red-300
                            text-red-600
                            bg-white
                            hover:bg-red-50
                            hover:border-red-400
                            hover:text-red-700
                            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
                            transition-all duration-200
                        "
                        >
                          🗑 Remove Item
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {/* Add button */}
              <tr>
                <td colSpan={3} className="text-center py-4">
                  <button
                    onClick={handleAddItemWithRental}
                    className="
                    // Base Styling
                    px-6 py-2
                    text-sm font-semibold
                    rounded-lg
                    border-2 border-gray-300
                    transition-all duration-200
                    w-auto

                    // Color Scheme: Neutral Base with Indigo Accent
                    text-gray-700
                    bg-white
                    shadow-sm

                    // Hover Effect
                    hover:bg-indigo-50
                    hover:border-indigo-400
                    hover:text-indigo-600
                    hover:shadow-md

                    // Focus Ring
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
                "
                  >
                    ➕ Add Another Item
                  </button>
                </td>
              </tr>
              {/* Summary Page */}
              <tr>
                <td colSpan={2} className="p-4">
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b-4 border-blue-500 pb-4">
                      Summary Table
                    </h2>

                    {/* Basic Information */}
                    <div className="space-y-6 mb-8">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={rentalTitle}
                          onChange={(e) => setRentalTitle(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                          placeholder="Enter rental title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Total Months
                        </label>
                        <input
                          type="number"
                          value={totalMonths}
                          onChange={(e) => setTotalMonths(Number(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                          placeholder="Enter total months"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Rental Items Section */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-8 bg-blue-500 rounded"></span>
                          Hardware Table
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setRentalItems((prev) => [
                              ...prev,
                              {
                                Lokasi: "",
                                Spesifikasi: "",
                                Kelajuan: "",
                                CadanganModel: "",
                                Kuantiti: 1,
                                HargaBulanan: 0,
                                JumlahHarga: 0,
                              },
                            ])
                          }
                          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          <Plus size={18} />
                          Add Item
                        </button>
                      </div>

                      <div className="space-y-4">
                        {rentalItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 relative hover:shadow-md transition-shadow"
                          >
                            <button
                              type="button"
                              onClick={() => removeRentalItem(idx)}
                              className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-full transition-all"
                              title="Remove item"
                            >
                              <Trash2 size={20} />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Lokasi
                                </label>
                                <input
                                  placeholder="Enter location"
                                  value={item.Lokasi}
                                  onChange={(e) =>
                                    setRentalItems((prev) => {
                                      const copy = [...prev];
                                      copy[idx].Lokasi = e.target.value;
                                      return copy;
                                    })
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                />
                              </div>

                              {/* Spesifikasi */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Spesifikasi
                                </label>

                                {/* Show current selection */}
                                <input
                                  type="text"
                                  value={item.Spesifikasi}
                                  readOnly
                                  placeholder="Selected specifications"
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                                />

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {[
                                    "4 in 1 copy",
                                    "3 in 1 copy",
                                    "Copy",
                                    "Print",
                                    "Scan",
                                    "Fax",
                                    "Puncher",
                                    "Booklet",
                                    "Staple",
                                  ].map((spec) => {
                                    const selected =
                                      item.Spesifikasi?.split(", ").includes(
                                        spec
                                      );

                                    const handleClick = () => {
                                      const selectedList = item.Spesifikasi
                                        ? item.Spesifikasi.split(", ")
                                        : [];
                                      let newList = [...selectedList];

                                      // --- handle grouping logic ---
                                      if (spec === "4 in 1 copy") {
                                        const group = [
                                          "4 in 1",
                                          "Copy",
                                          "Print",
                                          "Scan",
                                          "Fax",
                                        ];
                                        const alreadySelected = group.every((g) =>
                                          newList.includes(g)
                                        );
                                        if (alreadySelected) {
                                          // remove all if deselecting
                                          newList = newList.filter(
                                            (s) => !group.includes(s)
                                          );
                                        } else {
                                          // add all group items
                                          newList = Array.from(
                                            new Set([...newList, ...group])
                                          );
                                        }
                                      } else if (spec === "3 in 1 copy") {
                                        const group = [
                                          "3 in 1",
                                          "Copy",
                                          "Print",
                                          "Scan",
                                        ];
                                        const alreadySelected = group.every((g) =>
                                          newList.includes(g)
                                        );
                                        if (alreadySelected) {
                                          newList = newList.filter(
                                            (s) => !group.includes(s)
                                          );
                                        } else {
                                          newList = Array.from(
                                            new Set([...newList, ...group])
                                          );
                                        }
                                      } else {
                                        // toggle individual item
                                        if (newList.includes(spec)) {
                                          newList = newList.filter(
                                            (s) => s !== spec
                                          );
                                        } else {
                                          newList.push(spec);
                                        }
                                      }

                                      setRentalItems((prev) => {
                                        const copy = [...prev];
                                        copy[idx].Spesifikasi =
                                          newList.join(", ");
                                        return copy;
                                      });
                                    };

                                    return (
                                      <button
                                        key={spec}
                                        type="button"
                                        onClick={handleClick}
                                        className={`px-3 py-1 rounded-lg border ${selected
                                          ? "bg-grey-500 text-blue-400 border-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-300 hover:border-blue-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                          : "bg-white text-gray-700 border-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-300 hover:border-gray-400 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                          }`}
                                      >
                                        {spec}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Kelajuan */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Kelajuan
                                </label>
                                <select
                                  value={item.Kelajuan}
                                  onChange={(e) =>
                                    setRentalItems((prev) => {
                                      const copy = [...prev];
                                      copy[idx].Kelajuan = e.target.value;
                                      return copy;
                                    })
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                >
                                  <option value="">Select speed</option>
                                  <option value="22ppm">22ppm</option>
                                  <option value="24ppm">24ppm</option>
                                  <option value="25ppm">25ppm</option>
                                  <option value="26ppm">26ppm</option>
                                  <option value="30ppm">30ppm</option>
                                  <option value="33ppm">33ppm</option>
                                  <option value="35ppm">35ppm</option>
                                  <option value="40ppm">40ppm</option>
                                  <option value="43ppm">43ppm</option>
                                  <option value="45ppm">45ppm</option>
                                  <option value="50ppm">50ppm</option>
                                  <option value="55ppm">55ppm</option>
                                  <option value="60ppm">60ppm</option>
                                  <option value="65ppm">65ppm</option>
                                  <option value="70ppm">70ppm</option>
                                  <option value="80ppm">80ppm</option>
                                  <option value="86ppm">86ppm</option>
                                  <option value="95ppm">95ppm</option>
                                  <option value="105ppm">105ppm</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Cadangan Model
                                </label>
                                <input
                                  placeholder="Enter suggested model"
                                  value={item.CadanganModel}
                                  onChange={(e) =>
                                    setRentalItems((prev) => {
                                      const copy = [...prev];
                                      copy[idx].CadanganModel = e.target.value;
                                      return copy;
                                    })
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Kuantiti
                                </label>
                                <input
                                  type="number"
                                  placeholder="Quantity"
                                  value={item.Kuantiti}
                                  onChange={(e) =>
                                    setRentalItems((prev) => {
                                      const copy = [...prev];
                                      copy[idx].Kuantiti = Number(e.target.value);
                                      copy[idx].JumlahHarga =
                                        copy[idx].HargaBulanan *
                                        copy[idx].Kuantiti;
                                      return copy;
                                    })
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                  min="1"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Harga Bulanan
                                </label>
                                <input
                                  type="number"
                                  placeholder="Monthly price"
                                  value={item.HargaBulanan}
                                  onChange={(e) =>
                                    setRentalItems((prev) => {
                                      const copy = [...prev];
                                      copy[idx].HargaBulanan = Number(
                                        e.target.value
                                      );
                                      copy[idx].JumlahHarga =
                                        copy[idx].HargaBulanan *
                                        copy[idx].Kuantiti;
                                      return copy;
                                    })
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                  min="0"
                                />
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                              <p className="text-sm font-bold text-gray-700">
                                Jumlah Harga:{" "}
                                <span className="text-blue-600">
                                  RM {item.JumlahHarga.toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Print Cost Items Section */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-8 bg-green-500 rounded"></span>
                          Meter Budget Table
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setPrintCostItems((prev) => [
                              ...prev,
                              {
                                NameAndSpecification: "",
                                EstimatedMonthlyMeterReading: 0,
                                PrintChargeRate: 0,
                              },
                            ])
                          }
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          <Plus size={18} />
                          Add Item
                        </button>
                      </div>

                      <div className="space-y-4">
                        {printCostItems.map((p, idx) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 relative hover:shadow-md transition-shadow"
                          >
                            <button
                              type="button"
                              onClick={() => removePrintCostItem(idx)}
                              className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-full transition-all"
                              title="Remove item"
                            >
                              <Trash2 size={20} />
                            </button>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  NAMA DAN SPESIFIKASI BARANG
                                </label>
                                <input
                                  placeholder="Enter name and specification"
                                  value={p.NameAndSpecification}
                                  onChange={(e) =>
                                    setPrintCostItems((prev) => {
                                      const copy = [...prev];
                                      copy[idx].NameAndSpecification =
                                        e.target.value;
                                      return copy;
                                    })
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none bg-white"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    ANGGARAN KADAR BACAAN METER
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Enter meter reading"
                                    value={p.EstimatedMonthlyMeterReading}
                                    onChange={(e) =>
                                      setPrintCostItems((prev) => {
                                        const copy = [...prev];
                                        copy[idx].EstimatedMonthlyMeterReading =
                                          Number(e.target.value);
                                        return copy;
                                      })
                                    }
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none bg-white"
                                    min="0"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    KADAR CAJ CETAKAN BAGI
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter charge rate"
                                    value={p.PrintChargeRate}
                                    onChange={(e) =>
                                      setPrintCostItems((prev) => {
                                        const copy = [...prev];
                                        copy[idx].PrintChargeRate = Number(
                                          e.target.value
                                        );
                                        return copy;
                                      })
                                    }
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none bg-white"
                                    min="0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* User Note */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Note :
                      </label>
                      <textarea
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-y min-h-32"
                        placeholder="Enter any additional notes here..."
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRentalSummary}
                    className="
                    // Base Styling
                    px-6 py-2 mt-4
                    text-sm font-semibold text-red-800 
                    rounded-lg
                    border-2 border-red-800
                    transition-all duration-200
                    w-auto

                    // Color Scheme: Neutral Base with Indigo Accent
                    text-gray-700
                    bg-red-100
                    shadow-sm

                    // Hover Effect
                    hover:bg-red-50
                    hover:border-red-400
                    hover:text-red-400
                    hover:shadow-md

                    // Focus Ring
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
                  "
                  >
                    Confirm Summary Table
                  </button>
                </td>
              </tr>
              {/* Last Page */}
              <tr>
                {/* Column 1: Last Page Input Fields (w-1/2) */}
                <td className="w-1/2 p-4">
                  {/* Removed 'ml-10' to help centering if this is inside a w-full table */}
                  <div className="h-182 ml-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">F</span>
                      </div>
                      Last Page
                    </h3>
                    <div className="space-y-4">
                      {/* Staff Name Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Name
                        </label>
                        <input
                          type="text"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="Enter name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isLoading && (
                          <p className="text-xs text-blue-500 mt-1">
                            Loading staff info...
                          </p>
                        )}
                        {fetchError && (
                          <p className="text-xs text-red-500 mt-1">
                            {fetchError}
                          </p>
                        )}
                      </div>

                      {/* Staff Position Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Position
                        </label>
                        <input
                          type="text"
                          value={staffPosition}
                          onChange={(e) => setStaffPosition(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Staff Mobile Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Mobile
                        </label>
                        <input
                          type="text"
                          value={staffMobile}
                          onChange={(e) => setStaffMobile(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Staff Email Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Email
                        </label>
                        <input
                          type="email"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Column 2: Live Preview (Updated to w-1/2 and shows Last Page content) */}
                <td className="w-1/2 p-4">
                  <div className="ml-10 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm">👁</span>
                      </div>
                      Live Preview (Last Page)
                    </h4>
                    <div className="bg-white border border-gray-300 p-4 rounded-lg overflow-hidden text-xs space-y-3">
                      <u>Advantage:</u>
                      <p>
                        <b>Cost Saving:</b> Lower Rental & Lower Meter Clicks,
                        (Value Package) Saved monthly printing costing.{" "}
                      </p>
                      <p>
                        <b>Fast Service Response: </b>Our customer service and
                        service engineers are fast response to support in order to
                        minimize the machine downtime.{" "}
                      </p>
                      <p>
                        <b>Compact Design:</b> Latest model design (Color Touch
                        screen).{" "}
                      </p>
                      <p>
                        <b>Embedded software:</b> Able self-diagnose internal part
                        lifespan (able to reduce machine downtime){" "}
                      </p>
                      <p>
                        <b>Security:</b>
                        Ensure device is safe from unknown firmware installation
                        with system verification at startup.
                      </p>
                      <br></br>
                      {/* Content matching the Last Page template (image_8d096c.png) */}
                      <p className="font-bold text-red-500">
                        WHY us? Why ATP Sales & Services Sdn Bhd?
                      </p>
                      <p className="text-gray-600 italic">
                        *Kindly refer to attached file for company profile*
                      </p>

                      <div className="mt-2 pl-3">
                        <p className="font-bold underline text-xs">
                          ATP&apos;s Company Profile Summary:
                        </p>

                        <ul className="list-disc ml-5 space-y-0.5 text-gray-700">
                          <li>Authorized Platinum Partner of CANON.</li>
                          <li>
                            Main CANON products distributor in Johor, dealers buy
                            from us too.
                          </li>
                          <li>More than 10 years partnership with CANON.</li>
                          <li>Highest Market Share Award Year 2018 &amp; 2019.</li>
                          <li>
                            &quot;Highest Growth Award&quot; Year 2022,
                            &quot;Million Dollar Award&quot; Year 2022 and 2023.
                          </li>
                          <li>
                            Trusted Partner by CANON, we help to serve Banks and
                            Corporates across Johor.
                          </li>
                          <li>Our Technical team is trained by CANON.</li>
                          <li>
                            We have been taking care of many Major accounts with
                            high standard of service.
                          </li>
                        </ul>
                      </div>

                      <p className="pt-4 text-sm">
                        Thank you very much for your precious time considering
                        Canon Marketing as your solution business partner.
                        <br />
                        Should you need clarification, please do not hesitate to
                        call me at the undersigned.
                      </p>

                      <p>Best Regards,</p>

                      {/* Signature Block (matching image_8d096c.png) */}
                      <div className="pt-2 text-[10px] space-y-0.5">
                        <u className="font-bold">{staffName || "{staffname}"}</u>
                        <p>{staffPosition || "{staffposition}"}</p>
                        <p>Mobile: {staffMobile || "{staffmobile}"}</p>
                        <p>Email: {staffEmail || "{staffemail}"}</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <button
            onClick={handleGenerate}
            className="
            // Base Styling: Clean and Structured
            px-6 py-3
            text-sm font-semibold
            rounded-lg
            border-2 border-gray-300 // Soft, noticeable border
            transition-all duration-200
            w-auto // Ensure it only takes up necessary width

            // Color Scheme: Neutral Base with Blue Accent
            text-gray-700
            bg-white
            shadow-sm // Minimal shadow for depth

            // Hover Effect: Subtle color change and elevation
            hover:bg-indigo-50
            hover:border-indigo-400
            hover:text-indigo-600
            hover:shadow-md

            // Focus Ring (for accessibility and clean emphasis)
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
        "
          >
            Generate Proposal
          </button>{" "}
        </div>
      </div>
    </ProtectedRoute>
  );
}
