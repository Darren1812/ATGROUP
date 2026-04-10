"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  getImageForModelAndFunctions,
  modelSpeedMap,
  STAFF_NAMES,
  MODEL_LIST,
  DEFAULT_FUNCTIONS
} from "../../constants/printerData";
import ReactSelect from "react-select";

type DateFormatType = "date1" | "date2" | "date3" | "date4";

const formatCustomDate = (
  dateString: string,
  formatType: DateFormatType
): string | null => {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return null;

  switch (formatType) {
    case "date1": // 22/09/2025
      return date.toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    case "date2": {
      // 20250922
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}${month}${day}`;
    }

    case "date3": {
      // 1st October 2025
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
        month: "long",
        year: "numeric",
      });

    default:
      return dateString;
  }
};
export default function C_ATP() {

  const generateFileName = (request: ReturnType<typeof generateJSON>) => {
    const customerName = request.BeforeData.customername || "UnknownCustomer";
    const customerInitials = customerName
      .split(" ")
      .map((w) => w[0].toUpperCase())
      .join("");

    const modelNames = request.Items
      .map((item) => item.i_model?.split(" ").pop() || "")
      .filter(Boolean);
    const modelsPart = modelNames.join("_");

    const basicFunctions = ["Copy", "Print", "Scan", "Store"];
    const additionalFunctions = request.Items
      .flatMap((item) => (item.i_function || "").split(",").map((f) => f.trim()))
      .filter((f) => f && !basicFunctions.includes(f));
    const functionPart =
      additionalFunctions.length > 0
        ? [...new Set(additionalFunctions)].join("_")
        : "Function";

    const templateMap: Record<string, string> = { C_ATP: "ATP", G_ATP: "ATP" };
    const templatePart = templateMap[request.TemplateName] || request.TemplateName;

    return ["Proposal", templatePart, customerInitials, modelsPart, functionPart]
      .filter(Boolean)
      .join("_") + ".docx";
  };


  const handleGenerate = async () => {
    const data = generateJSON();
    const filename = generateFileName(data);


    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Docx/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error("Failed to generate proposal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating proposal:", error);
      alert("Something went wrong while generating the document.");
    }
  };
  const [, setLastRentalScheme] = useState<string>("");

  // Document Placeholders
  const [totalMonths, setTotalMonths] = useState<number>(0);
  const [, setRentalItems] = useState([
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



  const [companyaddress, ] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPosition, setStaffPosition] = useState("");
  const [staffMobile, setStaffMobile] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffSign, setStaffSign] = useState("");
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().substring(0, 10)
  ); // YYYY-MM-DD
  const [customer, setCustomer] = useState("");
  const [feature1, setFeature1] = useState("");
  const [feature2, setFeature2] = useState("");

  // Document Fields 2
  const [customerAddress, setCustomerAddress] = useState("");

  const [items, setItems] = useState([
    {
      title: "",
      content: "",
      itemname: "",
      i_model: "",
      modelname: "",
      i_function: "",
      i_selectedFunction: "",
      i_detail: "",
      proposedmodel_type: "New",
      proposedmodel: "",
      mrpv: "",
      rental_unit: "",
      meter_reading: "",
      rental_scheme: "",
      KR_D: "",
      Tawaran_NT: "",
      i_detail_fontsize: "",
      itemimage: "",
      companyaddress: companyaddress,
      Refundable_D: "",
    },
  ]);

  const generateJSON = () => {
    const data = {
      TemplateName: "C_ATP",
      BeforeData: {
        companyaddress: companyaddress,
        customername: customerName,
        staffname: staffName,
        staffposition: staffPosition,
        staffmobile: staffMobile,
        staffemail: staffEmail,
        staffsign: staffSign,
        date1: formattedDates.date1,
        date2: formattedDates.date2,
        date3: formattedDates.date3,
        date4: formattedDates.date4,
        customeraddress: customerAddress,
        customer: customer,
        feature: feature1,
        featureb: feature2
      },
      Items: items, // 👈 now correctly bound
      AfterData: {
        companyaddress: companyaddress,
        staffname: staffName,
        staffposition: staffPosition,
        staffmobile: staffMobile,
        staffemail: staffEmail,
        staffsign: staffSign
      },
      FeaturePage: featurePage,

    };

    return data;
  };

  const addNewItem = () => {
    setItems((prev) => [
      ...prev,
      {
        title: "",
        content: "",
        itemname: "",
        i_model: "",
        modelname: "",
        i_function: "",
        i_selectedFunction: "",
        i_detail: "",
        proposedmodel_type: "New",
        proposedmodel: "",
        mrpv: "",
        rental_unit: "",
        meter_reading: "",
        rental_scheme: totalMonths ? totalMonths.toString() : "",
        KR_D: "",
        Tawaran_NT: "",
        i_detail_fontsize: "",
        itemimage: "",
        companyaddress: companyaddress,
        Refundable_D: "",
      },
    ]);
    setKrdOptions((prev) => [
      ...prev,
      {
        hitamPutih: { selected: false, helai: "1000", sekali: false },
        berwarna: { selected: false, helai: "500", sekali: false },
      },
    ]);
  };

  interface KRDOption {
    selected: boolean;
    helai: string;
    sekali: boolean;
  }

  interface KRDCategories {
    hitamPutih: KRDOption;
    berwarna: KRDOption;
  }

  const [, setKrdOptions] = useState<KRDCategories[]>(
    items.map(() => ({
      hitamPutih: { selected: false, helai: "1000", sekali: false },
      berwarna: { selected: false, helai: "500", sekali: false },
    }))
  );
  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        companyaddress: companyaddress,
      }))
    );
  }, [companyaddress]);


  const handleItemChange = useCallback(
    (index: number, field: string, value: string) => {
      // 1. Update the 'items' state array
      setItems((prev) => {
        let updated = [...prev];

        // Logic for fields that update *all* items (rental_scheme, meter_reading)
        if (field === "rental_scheme") {
          updated = updated.map((item) => ({ ...item, rental_scheme: value }));
          const numericValue = Number(value);
          if (!isNaN(numericValue)) setTotalMonths(numericValue);
        } else if (field === "meter_reading") {
          updated = updated.map((item) => ({ ...item, meter_reading: value }));
        } else {
          // This 'else' block correctly handles single-item updates for all other fields,
          // including 'Refundable_D', 'itemname', 'modelname', etc.
          updated[index] = { ...updated[index], [field]: value };
        }

        return updated;
      });

      // 2. Perform secondary updates for 'rentalItems' state (if needed)
      if (field === "itemname" || field === "modelname") {
        setRentalItems((prev) => {
          const updated = [...prev];
          if (updated[index]) {
            // Note: Ensure 'CadanganModel' is the correct property name here
            updated[index] = { ...updated[index], CadanganModel: value };
          }
          return updated;
        });
      }

      // 3. Perform final state updates (if needed)
      if (field === "rental_scheme") setLastRentalScheme(value);
    },
    [setItems, setRentalItems] // Dependencies for useCallback
  );
  // New states for API loading/error feedback
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // --- Proposed Model Auto Fetch States ---
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);

  // Function to fetch user data from the API
  const fetchStaffInfo = useCallback(async (name: string) => {
    if (name.trim() === "") {
      setStaffPosition("");
      setStaffMobile("");
      setStaffEmail("");
      setStaffSign("");
      setFetchError(null);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    const encodedName = encodeURIComponent(name);
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Docx/userinfo?name=${encodedName}`;

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
      setStaffSign(data.sign || "");
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
      setStaffSign("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  interface ModelDetail {
    ProposedModel?: string;
    MonthlyRecommendedPrintVolume?: string;
    Fax?: string;
    Inner?: string;
    Booklet?: string;
    Puncher?: string;
    ["3 Trays"]?: string;
    ["5 Trays"]?: string;
    Details?: string;
    [key: string]: string | undefined; // dynamic fields
  }

  const [modelDetailCache, setModelDetailCache] = useState<Record<number, ModelDetail>>({});

  const modelDetailCacheRef = useRef(modelDetailCache);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStaffInfo(staffName);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [staffName, fetchStaffInfo]);
  // ✅ Modified fetchModelDetails
  const fetchModelDetails = useCallback(
    async (modelName: string, index: number) => {
      if (modelName.trim() === "") {
        // clear fields
        ["proposedmodel", "mrpv", "Fax", "Inner", "Booklet", "Puncher", "Trays_2_4", "i_detail", "Staple"].forEach(field =>
          handleItemChange(index, field, "")
        );
        setModelFetchError(null);
        setModelDetailCache((prev) => {
          const copy = { ...prev };
          delete copy[index];
          return copy;
        });
        return;
      }

      setIsModelLoading(true);
      setModelFetchError(null);

      const tableName = "ASN_29Series";
      const columnName = "Model";
      const encodedValue = encodeURIComponent(modelName);
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/DynamicInsert/find?tableName=${tableName}&columnName=${columnName}&searchValue=${encodedValue}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const data: ModelDetail = await response.json(); // ✅ typed

        setModelDetailCache((prev) => ({ ...prev, [index]: data }));

        handleItemChange(index, "proposedmodel", data.ProposedModel || "");
        handleItemChange(index, "mrpv", data.MonthlyRecommendedPrintVolume || "");
        handleItemChange(index, "Fax", data.Fax || "");
        handleItemChange(index, "Inner", data.Inner || "");
        handleItemChange(index, "Booklet", data.Booklet || "");
        handleItemChange(index, "Puncher", data.Puncher || "");
        handleItemChange(index, "3 Trays", data["3 Trays"] || "");
        handleItemChange(index, "5 Trays", data["5 Trays"] || "");

        // ✅ Use ref to safely access latest cache
        const lastModelData = modelDetailCacheRef.current[index]?.Details?.trim() || "";
        const currentDetail = items[index]?.i_detail?.trim() || "";

        if (!currentDetail || currentDetail === lastModelData) {
          handleItemChange(index, "i_detail", data.Details || "");
        }
      } catch (error) {
        setModelFetchError(
          `Error fetching model details: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        setIsModelLoading(false);
      }
    },
    [handleItemChange, items]
  );



  // useEffect hook to call the API whenever staffName changes

  const [currentModel, setCurrentModel] = useState({ value: "", index: -1 });

  const handleModelChange = (value: string, index: number) => {
    // --- 1️⃣ Always update i_model
    handleItemChange(index, "modelname", value);

    // --- 2️⃣ Determine the matching speed from the model code
    const matchedKey = Object.keys(modelSpeedMap).find((key) =>
      value.includes(key)
    );

    const speed = matchedKey ? modelSpeedMap[matchedKey] : "";

    // --- 3️⃣ Update rentalItems safely
    setRentalItems((prev) => {
      // Defensive copy
      const updated = [...prev];
      if (!updated[index]) return prev;

      const current = { ...updated[index] };

      // --- 4️⃣ Auto-fill related fields intelligently
      current.CadanganModel = value;

      // Only update Kelajuan if empty or matches previous auto-fill
      if (
        !current.Kelajuan ||
        Object.values(modelSpeedMap).includes(current.Kelajuan)
      ) {
        current.Kelajuan = speed;
      }

      updated[index] = current;
      return updated;
    });

    // --- 5️⃣ Keep your existing local state update
    setCurrentModel({ value, index });
  };

  // Debounce effect — same logic as staffName

  const handleFunctionToggle = (index: number, func: string) => {
    const item = items[index];

    // 从 i_selectedFunction 取真正选择的 function
    const selectedList = item.i_selectedFunction
      ? item.i_selectedFunction.split(", ").filter(Boolean)
      : [];
    const isSelected = selectedList.includes(func);

    // 获取缓存
    const cacheRow = modelDetailCache[index] || {};
    const funcKeyAlt = func.replace(/\s|\/|-/g, "_");
    const funcValue =
      cacheRow[func] ??
      cacheRow[funcKeyAlt] ??
      cacheRow[func.toLowerCase()] ??
      "";

    let details = item.i_detail || "";

    if (isSelected) {
      if (funcValue) {
        const escaped = funcValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\n)${escaped}(\\n|$)`, "g");
        details = details.replace(regex, "\n").trim();
      }
    } else {
      if (funcValue && !details.includes(funcValue)) {
        details = details ? `${details}\n${funcValue}` : funcValue;
      }
    }

    let newSelected;
    if (isSelected) {
      // Don't allow removing default functions
      if (DEFAULT_FUNCTIONS.includes(func)) {
        newSelected = selectedList; // keep it
      } else {
        newSelected = selectedList.filter((f) => f !== func);
      }
    } else {
      newSelected = [...selectedList, func];
    }


    handleItemChange(index, "i_selectedFunction", newSelected.join(", "));

    const displayList = newSelected.map((f) =>
      f === "Inner" ? "Staple" : f
    );

    handleItemChange(index, "i_function", displayList.join(", "));
    handleItemChange(index, "i_detail", details);

    const newImage = getImageForModelAndFunctions(currentModel.value, newSelected);

    handleItemChange(index, "itemimage", newImage);
  };


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
    setKrdOptions((prev) => [
      ...prev,
      {
        hitamPutih: { selected: false, helai: "1000", sekali: false },
        berwarna: { selected: false, helai: "500", sekali: false },
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
  const [meterOptions, setMeterOptions] = useState<
    {
      bw: { selected: boolean; rm: string };
      color: { selected: boolean; rm: string };
    }[]
  >([]);

  const updateMeterDisplay = (
    index: number,
    updatedMeter: {
      bw: { selected: boolean; rm: string };
      color: { selected: boolean; rm: string };
    }
  ) => {
    // --- 1️⃣ Update only the meter option for the current item
    setMeterOptions((prev: typeof meterOptions) =>
      prev.map((opt, i) => (i === index ? updatedMeter : opt))
    );

    // --- 2️⃣ Build readable meter description for the selected item
    const lines: string[] = [];

    const formatRM = (val: string | number) => {
      const n = Number(val);
      if (isNaN(n)) return val.toString();
      return n.toLocaleString("en-MY", { minimumFractionDigits: 2 });
    };

    if (updatedMeter.bw.selected && updatedMeter.bw.rm) {
      lines.push(`RM ${formatRM(updatedMeter.bw.rm)} (B/W)`);
    }

    if (updatedMeter.color.selected && updatedMeter.color.rm) {
      lines.push(`RM ${formatRM(updatedMeter.color.rm)} (CL)`);
    }

    const result = lines.join("; ");

    // --- 3️⃣ Update ONLY the selected item’s meter_reading
    setItems((prev: typeof items) =>
      prev.map((item, i) =>
        i === index
          ? {
            ...item,
            meter_reading: result,
          }
          : item
      )
    );
  };


  // 🟢 Keep meterOptions length synced with items
  useEffect(() => {
    setMeterOptions((prev) => {
      if (prev.length !== items.length) {
        const newOptions = [...prev];
        const lastOption =
          prev[prev.length - 1] || {
            bw: { selected: false, rm: "" },
            color: { selected: false, rm: "" },
          };

        while (newOptions.length < items.length) {
          newOptions.push(JSON.parse(JSON.stringify(lastOption)));
        }

        return newOptions;
      }
      return prev;
    });
  }, [items.length]); // ✅ only run when item count changes

  // 🟢 Copy meter_reading ONLY when a new item is added and it’s empty
  useEffect(() => {
    if (items.length > 1) {
      setItems((prev) => {
        const newItems = [...prev];
        const lastIndex = prev.length - 1;
        const lastItem = prev[lastIndex - 1];
        const newItem = prev[lastIndex];

        // only copy if new item has no meter_reading yet
        if (!newItem.meter_reading && lastItem?.meter_reading) {
          newItems[lastIndex] = {
            ...newItem,
            meter_reading: lastItem.meter_reading,
          };
          return newItems;
        }

        return prev;
      });
    }
    // ✅ Run only when the *number* of items changes
  }, [items.length]);


  useEffect(() => {
    if (totalMonths > 0) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          rental_scheme: totalMonths.toString(),
        }))
      );
    }
  }, [totalMonths]);
  /*const calculateTotalPrice = (items: any[]) => {
    return items.reduce((total, item) => {
      // Calculation: EstimatedMonthlyMeterReading * PrintChargeRate
      const itemPrice =
        item.EstimatedMonthlyMeterReading * item.PrintChargeRate * totalMonths;
      return total + itemPrice;
    }, 0);
  };*/
  const [featurePage, setFeaturePage] = useState("");
  useEffect(() => {
    if (featurePage) {
      setFeature1(featurePage);            // normal text
      setFeature2(featurePage); // UPPERCASE
    } else {
      setFeature1("");
      setFeature2("");
    }
  }, [featurePage]);

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-700 to-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🖨️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Proposal Generator for ATP (Commercial)
                </h2>
              </div>
            </div>
          </div>
        </div>
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
                        <select
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select staff name</option>
                          {STAFF_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
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
                  <div className="ml-10 bg-gradient-to-br from-red-50 to-red-50 border-2 border-red-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-900 to-red-500 rounded-lg flex items-center justify-center mr-3">
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
                          width={1200}              // Required for layout stability
                          height={400}
                          className="w-full max-h-72 object-contain"
                          priority                  // Optional: load early for better performance
                        />
                      </div>

                    </div>
                    {/* END Header Image Section */}

                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-red-600 underline ml-2">
                          {customerName || "{customername}"}
                        </span>
                      </p>
                      <div className="bg-white p-3 rounded mt-2">
                        <p>
                          <strong>Prepared by:</strong>{" "}
                          {staffName || "{staffname}"}
                        </p>
                        <p>
                          <strong>mobile:</strong>{" "}
                          {staffMobile || "{staffmobile}"}
                        </p>
                        <p>
                          <strong>email:</strong> {staffEmail || "{staffemail}"}
                        </p>
                        <p>
                          <strong>Date:</strong> {formattedDates.date1}
                        </p>
                      </div>
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
                      <div>
                        <label className="block text-xl font-medium text-red-700 mt-10 mb-1">
                          Features Page
                        </label>

                        <select
                          value={featurePage}
                          onChange={(e) => setFeaturePage(e.target.value)}
                          className="w-full px-3 py-2 border border-red-500 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select feature</option>
                          <option value="imageRUNNER ADVANCE">imageRUNNER ADVANCE</option>
                          <option value="imageRUNNER ADVANCE DX">imageRUNNER ADVANCE DX</option>
                          <option value="imageFORCE">imageFORCE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Column 2: Document Preview (Adjusted to w-1/2 and styled like the document) */}
                <td className="w-3/5 p-4">
                  <div className="ml-10 bg-gradient-to-br from-red-50 to-red-50 border-2 border-red-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-b pb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-900 to-red-500 rounded-lg flex items-center justify-center mr-3">
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
                        <span className="text-red-600 underline ml-2">
                          {feature2 || "{feature2}"}
                        </span>
                      </p>

                      {/* **FIX APPLIED HERE: Split the problematic nested <p> content** */}
                      <p className="text-gray-700">
                        ATP Sales & Services Sdn. Bhd. values{" "}
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
                        With the Canon
                        <span className="text-red-600 underline ml-2">
                          {feature1 || "{feature1}"}
                        </span> model, we have
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
                        <p>ATP Sales & Services Sdn. Bhd. (1275709-U)   </p>
                        <div className="mt-8 w-48 pt-1">
                          <u className="font-bold">
                            {staffSign || "{staffsign}"}
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
                        {/* Proposed Models */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model
                          </label>

                          <ReactSelect
                            value={
                              item.modelname
                                ? { label: item.modelname, value: item.modelname }
                                : null
                            }
                            onChange={(selectedOption) => {
                              const selected = selectedOption ? selectedOption.value : "";

                              // 🟢 Format model display
                              const formatted = selected.replace("", "");

                              // 🟢 Update model fields
                              handleItemChange(index, "modelname", selected);
                              handleItemChange(index, "i_model", formatted);

                              // 🟢 Keep current selected functions
                              const currentFunctions = item.i_selectedFunction
                                ? item.i_selectedFunction.split(", ").filter(Boolean)
                                : [];

                              // 🟢 Compute new image based on model + functions
                              const newImage = getImageForModelAndFunctions(formatted, currentFunctions);

                              // 🟢 Update item image
                              handleItemChange(index, "itemimage", newImage);

                              // 🟢 Trigger any existing logic
                              handleModelChange(selected, index);
                              fetchModelDetails(selected, index);
                            }}
                            options={MODEL_LIST.map((model) => ({
                              label: model.name,
                              value: model.fullName,
                            }))}
                            placeholder="Select model..."
                            isClearable
                            className="basic-multi-select"
                            classNamePrefix="select"
                          />

                          {/* Loading & Error states */}
                          {isModelLoading && (
                            <p className="text-xs text-blue-500 mt-1">Fetching model data...</p>
                          )}
                          {modelFetchError && (
                            <p className="text-xs text-red-500 mt-1">{modelFetchError}</p>
                          )}

                          {/* Textarea */}
                          <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">
                            Editable Model Name
                          </label>
                          <textarea
                            value={item.i_model || ""}
                            onChange={(e) => {
                              handleItemChange(index, "i_model", e.target.value);
                            }}
                            rows={3}
                            placeholder="Enter or edit model name"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                          />
                        </div>


                        {/* Function */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Function
                          </label>

                          {/* Ensure default selection */}
                          {!item.i_selectedFunction || item.i_selectedFunction.trim() === ""
                            ? (handleItemChange(index, "i_selectedFunction", DEFAULT_FUNCTIONS.join(", ")), null)
                            : null}

                          <div className="flex flex-wrap gap-2 mt-2">
                            {[
                              ...DEFAULT_FUNCTIONS, // default ones
                              "Fax",
                              "Inner",
                              "Booklet",
                              "Puncher",
                              "3 Trays",
                              "5 Trays",
                              "Staple",
                            ].map((func) => {
                              // determine if selected from i_selectedFunction
                              const selected = item.i_selectedFunction
                                ?.split(", ")
                                .includes(func);

                              return (
                                <button
                                  key={func}
                                  type="button"
                                  onClick={() => handleFunctionToggle(index, func)}
                                  className={`px-3 py-1 rounded-lg border text-sm font-semibold transition-all duration-200 focus:outline-none ${selected
                                    ? "bg-grey-500 text-blue-400 border-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-300 hover:border-blue-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                    : "bg-white text-gray-700 border-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-300 hover:border-gray-400 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                    }`}
                                >
                                  {func}
                                </button>
                              );
                            })}
                          </div>
                          {/* Display: replace Inner → Staple */}
                          <input
                            type="text"
                            value={
                              item.i_selectedFunction
                                ? item.i_selectedFunction
                                  .split(", ")
                                  .map((f) => (f === "Inner" ? "Staple" : f))
                                  .join(", ")
                                : ""
                            }
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="(New)">New</option>
                            <option value="(Showroom Unit)">Showroom Unit</option>
                            <option value="">Nope</option>
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
                        {/* Rental/Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Rental/Unit
                          </label>
                          <input
                            type="text"
                            value={item.rental_unit}
                            onChange={(e) => {
                              const rawValue = e.target.value;

                              // Allow only numbers, commas, and dots
                              const cleanValue = rawValue.replace(/[^0-9.]/g, "");

                              // Let user type freely (don’t format yet)
                              handleItemChange(index, "rental_unit", cleanValue);

                              // Update calculations live
                              const numericValue = parseFloat(cleanValue.replace(/,/g, "")) || 0;
                              setRentalItems((prev) => {
                                const copy = [...prev];
                                if (!copy[index]) return prev;

                                const quantity = Number(copy[index].Kuantiti) || 0;
                                const total = numericValue * quantity;

                                copy[index] = {
                                  ...copy[index],
                                  HargaBulanan: Number(numericValue.toFixed(2)),
                                  JumlahHarga: Number(total.toFixed(2)),
                                };
                                return copy;
                              });
                            }}
                            onBlur={(e) => {
                              // Format with commas and 2 decimals on blur
                              const numericValue = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                              const formatted = numericValue.toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                              handleItemChange(index, "rental_unit", formatted);
                            }}
                            placeholder="Enter Rental/Unit"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        {/* Rental Scheme */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rental Duration
                          </label>

                          <input
                            type="text"
                            list={`rental-duration-${index}`}
                            value={item.rental_scheme}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "rental_scheme",
                                e.target.value
                              )
                            }
                            placeholder="Enter or select rental duration"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />

                          {/* Datalist provides dropdown suggestions but still allows typing freely */}
                          <datalist id={`rental-duration-${index}`}>
                            <option value="24" />
                            <option value="36" />
                            <option value="48" />
                            <option value="60" />
                          </datalist>
                        </div>
                        {/* Meter Reading */}
                        <div className="flex flex-col gap-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meter Reading
                          </label>

                          {(() => {
                            // Initialize structure (same as KR_D style)
                            const option = meterOptions[index] || {
                              bw: { selected: false, rm: "" },
                              color: { selected: false, rm: "" },
                            };

                            return (
                              <>
                                {/* B/W Option */}
                                <div className="flex items-center gap-2 text-sm">
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={option.bw.selected}
                                      onChange={(e) =>
                                        updateMeterDisplay(index, {
                                          ...option,
                                          bw: {
                                            ...option.bw,
                                            selected: e.target.checked,
                                          },
                                        })
                                      }
                                    />
                                    B/W
                                  </label>

                                  <span className="text-gray-600">RM</span>
                                  <input
                                    type="text"
                                    value={option.bw.rm}
                                    onChange={(e) =>
                                      updateMeterDisplay(index, {
                                        ...option,
                                        bw: { ...option.bw, rm: e.target.value },
                                      })
                                    }
                                    placeholder="0.00"
                                    className="w-20 border rounded px-2 text-center"
                                  />
                                </div>

                                {/* Color Option */}
                                <div className="flex items-center gap-2 text-sm">
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={option.color.selected}
                                      onChange={(e) =>
                                        updateMeterDisplay(index, {
                                          ...option,
                                          color: {
                                            ...option.color,
                                            selected: e.target.checked,
                                          },
                                        })
                                      }
                                    />
                                    CL
                                  </label>

                                  <span className="text-gray-600">RM</span>
                                  <input
                                    type="text"
                                    value={option.color.rm}
                                    onChange={(e) =>
                                      updateMeterDisplay(index, {
                                        ...option,
                                        color: {
                                          ...option.color,
                                          rm: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder="0.00"
                                    className="w-20 border rounded px-2 text-center"
                                  />
                                </div>

                                {/* Display formatted output (editable like KR_D) */}
                                {items[index]?.meter_reading && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                      Custom Meter Reading Description
                                    </label>
                                    <textarea
                                      value={items[index].meter_reading}
                                      onChange={(e) => handleItemChange(index, "meter_reading", e.target.value)}

                                      rows={2}
                                      className="w-full text-xs border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        {/* Refundable Deposit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Refundable Deposit
                          </label>
                          <input
                            type="text"
                            value={item.Refundable_D}
                            onChange={(e) => {
                              const rawValue = e.target.value;

                              // Allow only numbers and dots
                              const cleanValue = rawValue.replace(/[^0-9.]/g, "");

                              // Update the raw value (unformatted)
                              handleItemChange(index, "Refundable_D", cleanValue);
                            }}
                            onBlur={(e) => {
                              const numericValue = parseFloat(e.target.value.replace(/,/g, "")) || 0;

                              // Format like 1,234.00
                              const formatted = numericValue.toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });

                              handleItemChange(index, "Refundable_D", formatted);
                            }}
                            placeholder="Enter refundable deposit"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                      </div>
                    </div>
                  </td>

                  {/* Column 2: Merged Live Preview and Document Preview (now w-2/3) */}
                  <td className="w-2/3 p-4">
                    <div className="ml-10 bg-gradient-to-br from-red-50 to-red-50 border-2 border-red-200/50 rounded-xl p-6 shadow-lg">
                      <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-b pb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-900 to-red-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm">📄</span>
                        </div>
                        Document Preview
                      </h4>
                      <h5>Pricing Schedule: </h5><p>{item.itemname}</p>
                      <div className="mt-2 flex flex-col border border-gray-600 rounded-lg overflow-hidden">
                        <div className="flex border-b border-gray-600">
                          <p className="w-1/2 p-2 bg-gray-300 font-medium border-r border-gray-600 text-white">
                            Proposed Model
                          </p>
                          <p className="w-1/2 bg-gray-300 text-white p-2 text-sm">
                            {item.i_model || "{i_model}"}
                          </p>
                        </div>
                        <div className="flex border-b border-gray-600">
                          <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-600">
                            Function
                          </p>
                          <p className="w-1/2 p-2 bg-gray-50 text-sm">
                            {item.i_function || "{i_function}"}
                          </p>
                        </div>
                        {/* Top Section: Model/Function/Image */}
                        <div className="flex border-b border-gray-600">
                          {/* Left Column: Image (w-1/2) */}
                          <div className="w-1/2 p-4 border-r border-gray-600 text-center bg-gray-50">
                            <div className="rounded-lg overflow-hidden shadow-md bg-gray-50 p-2">
                              Configuration & Feature available (depend on configuration)
                              {item.itemimage && (
                                <Image
                                  src={item.itemimage}
                                  alt="Item Image"
                                  width={400}
                                  height={300}
                                  className="mt-5 w-full h-auto max-h-48 object-contain"
                                  unoptimized // ⚠️ disables Next.js image optimization
                                />
                              )}
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
                          <div className="flex border-b border-gray-600">
                            <p className="w-1/2 p-2 bg-gray-50 font-medium border-r border-gray-600">
                              Proposed Model {""} {item.proposedmodel_type}
                            </p>
                            <p className="w-1/2 p-2 bg-gray-50">
                              {item.proposedmodel || "{proposedmodel}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-600">
                            <p className="w-1/2 p-2 bg-blue-200 text-white font-medium border-r border-gray-600">
                              Monthly Rental/Unit
                            </p>
                            <p className="w-1/2 p-2 bg-blue-200 text-white">
                              {item.rental_unit || "{rental_unit}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-600">
                            <p className="w-1/2 p-2 bg-blue-200 text-white font-medium border-r border-gray-600">
                              Rental Duration
                            </p>
                            <p className="w-1/2 p-2 bg-blue-200 text-white">
                              {item.rental_scheme || "{rental_scheme}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-600">
                            <p className="w-1/2 p-2 bg-blue-200 text-white font-medium border-r border-gray-600">
                              Meter Reading
                            </p>
                            <p className="w-1/2 p-2 bg-blue-200 text-white">
                              {item.meter_reading || "{meter_reading}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-600">
                            <p className="w-1/2 p-2 bg-blue-200 text-white font-medium border-r border-gray-600">
                              Refundable Deposit
                            </p>
                            <p className="w-1/2 p-2 bg-blue-200 text-white">
                              {item.Refundable_D || "{Refundable_D}"}
                            </p>
                          </div>
                          <div className="flex border-b border-gray-600">
                            <p className="w-1/2 p-2 bg-orange-300 text-white font-medium border-r border-gray-600">
                              Delivery & installation charges
                            </p>
                            <p className="w-1/2 p-2 bg-orange-300 text-white text-center">
                              Waived
                            </p>
                          </div>
                          <div className="flex border-b border-gray-600">
                            <p className="w-1/2 p-2 bg-orange-300 text-white font-medium border-r border-gray-600">
                              Delivery lead time
                            </p>
                            <p className="w-1/2 p-2 bg-orange-300 text-white text-center">
                              14 Working Days and subject to availability of stock upon confirmation
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
                  <div className="ml-10 bg-gradient-to-br from-red-50 to-red-50 border-2 border-red-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
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
                        <u className="font-bold">
                          {staffSign || "{staffsign}"}
                        </u>
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
