"use client";

import { Plus, Trash2 } from "lucide-react";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  getImageForModelAndFunctions,
  modelSpeedMap,
  ARENASTAFF_NAMES,
  ARENA_ADDRESS,
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
export default function ARENA() {
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
  const [rentalTitle, setRentalTitle] = useState("");
  const [totalMonths, setTotalMonths] = useState<number>(0);
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
  const [companyaddress, setcompanyaddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPosition, setStaffPosition] = useState("");
  const [staffMobile, setStaffMobile] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffSign, setStaffSign] = useState("");
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().substring(0, 10)
  ); // YYYY-MM-DD
  const [customer,] = useState("");
  const [feature1, setFeature1] = useState("");
  const [feature2, setFeature2] = useState("");

  // Document Fields 2
  const [customerAddress, setCustomerAddress] = useState("");

  const [items, setItems] = useState([
    {
      number: "1",
      title: "",
      content: "",
      itemname: "",
      i_model: "",
      modelname: "",
      i_function: "",
      i_selectedFunction: "",
      i_detail: "",
      proposedmodel_type: "",
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
      firstCopy_BW: "",
      firstCopy_CL: "",
      copyResolution: "",
      warm_Up: "",
      speed_BW: "",
      speed_CL: "",
      printingResolution: "",
      memory: "",
      hardDisk: "",
      feeder: "",
      feederCapacity: "",
      inputSpeed: "",
      scanningResolution: "",
      fileFormats: "",
      destinations: "",
      paperCapacity: "",
      paperSizes: "",
      paperWeights: "",
      powerConsumption: "",
      trays: "", // "3 Trays" or "5 Trays"
      threeTrays: "",
      fiveTrays: "",
      DYNAMIC_SPECS_JSON: ""
    },
  ]);

  const generateJSON = () => {
    const data = {
      TemplateName: "ARENA",
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
      Items: items,
      AfterData: {
        companyaddress: companyaddress,
        staffposition: staffPosition,
        staffsign: staffSign,
      },
      FeaturePage: featurePage,

    };

    return data;
  };

  const addNewItem = () => {
    setItems((prev) => [
      ...prev,
      {
        number: "",
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
        firstCopy_BW: "",
        firstCopy_CL: "",
        copyResolution: "",
        warm_Up: "",
        speed_BW: "",
        speed_CL: "",
        printingResolution: "",
        memory: "",
        hardDisk: "",
        feeder: "",
        feederCapacity: "",
        inputSpeed: "",
        scanningResolution: "",
        fileFormats: "",
        destinations: "",
        paperCapacity: "",
        paperSizes: "",
        paperWeights: "",
        powerConsumption: "",
        trays: "",
        threeTrays: "",
        fiveTrays: "",
        DYNAMIC_SPECS_JSON: ""
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
      setItems((prev) => {
        let updated = [...prev];

        if (field === "rental_scheme") {
          updated = updated.map((item) => ({ ...item, rental_scheme: value }));
          const numericValue = Number(value);
          if (!isNaN(numericValue)) setTotalMonths(numericValue);
        } else if (field === "meter_reading") {
          updated = updated.map((item) => ({ ...item, meter_reading: value }));
        } else {
          updated[index] = { ...updated[index], [field]: value };
        }

        return updated;
      });

      if (field === "itemname" || field === "modelname") {
        setRentalItems((prev) => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = { ...updated[index], CadanganModel: value };
          }
          return updated;
        });
      }

      if (field === "rental_scheme") setLastRentalScheme(value);
    },
    [setItems, setRentalItems]
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
    id?: number;
    modelName?: string;
    firstCopy_BW?: string;
    firstCopy_CL?: string;
    copyResolution?: string;
    warm_Up?: string;
    speed_BW?: string;
    speed_CL?: string;
    printingResolution?: string;
    memory?: string;
    hardDisk?: string;
    feeder?: string;
    feederCapacity?: string;
    inputSpeed?: string;
    scanningResolution?: string;
    fileFormats?: string;
    destinations?: string;
    paperCapacity?: string;
    paperSizes?: string;
    paperWeights?: string;
    powerConsumption?: string;
    fax?: string;
    inner?: string;
    stapling?: string;
    punching?: string;
    threeTrays?: string;
    fiveTrays?: string;
    booklet?: string;
    mrpv?: string;
    modemSpeed_F: string;
    compressionMethod_F: string;
    resolutionDpi_F: string;
    faxMemory_F: string;
    memoryBackup_F: string;
    paperOutputCapacity_BF: string;
    stapling_BF: string;
    paperOutputCapacity_SF: string;
    stapling_SF: string;
    paperOutputCapacity_IF: string;
    stapling_IF: string;

    [key: string]: string | number | undefined; // dynamic fields
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
        ["proposedmodel", "mrpv", "Fax", "Inner", "Booklet", "Puncher", "Trays_2_4", "i_detail", "Staple",
          "firstCopy_BW", "firstCopy_CL", "copyResolution", "warm_Up", "speed_BW", "speed_CL",
          "printingResolution", "memory", "hardDisk", "feeder", "feederCapacity", "inputSpeed_S",
          "inputSpeed_D", "scanningResolution", "fileFormats", "destinations", "paperCapacity",
          "paperSizes", "paperWeights", "powerConsumption"].forEach(field =>
            handleItemChange(index, field, "")
          );
        setModelFetchError(null);
        setModelDetailCache((prev) => {
          const copy = { ...prev };
          delete copy[index];
          modelDetailCacheRef.current = copy;
          return copy;
        });
        return;
      }

      setIsModelLoading(true);
      setModelFetchError(null);

      const encodedValue = encodeURIComponent(modelName);
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ModelDetails/name/${encodedValue}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const data: ModelDetail = await response.json(); // ✅ typed

        // Create cache entry with both new field names and aliases for backward compatibility
        const cacheEntry: ModelDetail & Record<string, string | number | undefined> = {
          ...data,
          // Add aliases for function toggle lookup
          Fax: data.fax,
          Inner: data.inner,
          Booklet: data.booklet,
          Puncher: data.punching,
          Staple: data.stapling,
          fax: data.fax,
          inner: data.inner,
          booklet: data.booklet,
          punching: data.punching,
          stapling: data.stapling,
          threeTrays: data.threeTrays,
          fiveTrays: data.fiveTrays,
        };

        setModelDetailCache((prev) => {
          const updated = { ...prev, [index]: cacheEntry };
          modelDetailCacheRef.current = updated;
          return updated;
        });

        // Map new API fields to component fields
        handleItemChange(index, "proposedmodel", data.modelName || "");
        // mrpv is not in the new API, so we'll leave it empty or you can remove this line
        handleItemChange(index, "Fax", data.fax || "");
        handleItemChange(index, "Inner", data.inner || "");
        handleItemChange(index, "Booklet", data.booklet || "");
        handleItemChange(index, "Puncher", data.punching || "");
        handleItemChange(index, "threeTrays", data.threeTrays || "");
        handleItemChange(index, "fiveTrays", data.fiveTrays || "");

        // Map specification fields for auto-fill
        handleItemChange(index, "firstCopy_BW", data.firstCopy_BW || "");
        handleItemChange(index, "firstCopy_CL", data.firstCopy_CL || "");
        handleItemChange(index, "copyResolution", data.copyResolution || "");
        handleItemChange(index, "warm_Up", data.warm_Up || "");
        handleItemChange(index, "speed_BW", data.speed_BW || "");
        handleItemChange(index, "speed_CL", data.speed_CL || "");
        handleItemChange(index, "printingResolution", data.printingResolution || "");
        handleItemChange(index, "memory", data.memory || "");
        handleItemChange(index, "hardDisk", data.hardDisk || "");
        handleItemChange(index, "feeder", data.feeder || "");
        handleItemChange(index, "feederCapacity", data.feederCapacity || "");
        handleItemChange(index, "inputSpeed", data.inputSpeed || "");
        handleItemChange(index, "scanningResolution", data.scanningResolution || "");
        handleItemChange(index, "fileFormats", data.fileFormats || "");
        handleItemChange(index, "destinations", data.destinations || "");
        handleItemChange(index, "paperCapacity", data.paperCapacity || "");
        handleItemChange(index, "paperSizes", data.paperSizes || "");
        handleItemChange(index, "paperWeights", data.paperWeights || "");
        handleItemChange(index, "powerConsumption", data.powerConsumption || "");
        handleItemChange(index, "mrpv", data.mrpv || "");
        handleItemChange(index, "modemSpeed_F", data.modemSpeed_F || "");
        handleItemChange(index, "compressionMethod_F", data.compressionMethod_F || "");
        handleItemChange(index, "resolutionDpi_F", data.resolutionDpi_F || "");
        handleItemChange(index, "faxMemory_F", data.faxMemory_F || "");
        handleItemChange(index, "memoryBackup_F", data.memoryBackup_F || "");
        handleItemChange(index, "paperOutputCapacity_BF", data.paperOutputCapacity_BF || "");
        handleItemChange(index, "stapling_BF", data.stapling_BF || "");
        handleItemChange(index, "paperOutputCapacity_SF", data.paperOutputCapacity_SF || "");
        handleItemChange(index, "stapling_SF", data.stapling_SF || "");
        handleItemChange(index, "paperOutputCapacity_IF", data.paperOutputCapacity_IF || "");
        handleItemChange(index, "stapling_IF", data.stapling_IF || "");
        // Construct i_detail from available fields
        // Since the data is now separated into individual fields, we construct i_detail from them
        const detailParts: string[] = [];
        if (data.fax) detailParts.push(data.fax);
        if (data.inner) detailParts.push(data.inner);
        if (data.stapling) detailParts.push(data.stapling);
        if (data.punching) detailParts.push(data.punching);
        if (data.threeTrays) detailParts.push(data.threeTrays);
        if (data.fiveTrays) detailParts.push(data.fiveTrays);
        if (data.booklet) detailParts.push(data.booklet);

        const currentDetail = items[index]?.i_detail?.trim() || "";
        const previousModelName = modelDetailCacheRef.current[index]?.modelName?.trim() || "";
        const currentModelName = modelName.trim();

        // Only update i_detail if it's empty or if we're fetching a different model
        if (!currentDetail || (previousModelName && previousModelName !== currentModelName)) {
          handleItemChange(index, "i_detail", detailParts.join("\n") || "");
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

  const handleFunctionToggle = (index: number, func: string) => {
    const item = items[index];

    // --- Current selected list ---
    const selectedList = item.i_selectedFunction
      ? item.i_selectedFunction.split(", ").filter(Boolean)
      : [];
    const isSelected = selectedList.includes(func);

    // --- Toggle select ---
    let newSelected: string[];
    if (isSelected) {
      if (DEFAULT_FUNCTIONS.includes(func)) {
        newSelected = selectedList; // prevent removing default
      } else {
        newSelected = selectedList.filter((f) => f !== func);
      }
    } else {
      newSelected = [...selectedList, func];
    }

    // Update selected display
    handleItemChange(index, "i_selectedFunction", newSelected.join(", "));
    const displayList = newSelected.map((f) => (f === "Inner" ? "Staple" : f));
    handleItemChange(index, "i_function", displayList.join(", "));

    // --- i_detail update (preserve your logic) ---
    let details = item.i_detail || "";
    const cacheRow = modelDetailCache[index] || {};
    const funcKeyAlt = func.replace(/\s|\/|-/g, "_");

    const funcValueRaw =
      cacheRow[func] ?? cacheRow[funcKeyAlt] ?? cacheRow[func.toLowerCase()] ?? "";

    const funcValue =
      typeof funcValueRaw === "string" ? funcValueRaw : String(funcValueRaw || "");

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

    handleItemChange(index, "i_detail", details);

    // =====================================================================
    // ===================== Build DYNAMIC_SPECS_JSON ======================
    // =====================================================================
    const dynamicSpecsArray: Array<{ title: string; specs_json: string }> = [];

    // Helper to filter empty fields
    const filterValues = (obj: Record<string, string | number | boolean | undefined>) =>
      Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined && v !== "")
      );
    // ----- Fax -----
    if (newSelected.includes("Fax")) {
      const faxData = filterValues({
        "Modem Speed": cacheRow.modemSpeed_F,
        "Compression Method": cacheRow.compressionMethod_F,
        "Resolution": cacheRow.resolutionDpi_F,
        "Fax Memory": cacheRow.faxMemory_F,
        "Memory Backup": cacheRow.memoryBackup_F,
      });

      dynamicSpecsArray.push({
        title: "Fax Specifications",
        specs_json: JSON.stringify(faxData),
      });
    }

    // ----- Booklet Finisher -----
    if (newSelected.includes("Booklet")) {
      const bfData = filterValues({
        "Paper Output Capacity": cacheRow.paperOutputCapacity_BF,
        "Stapling": cacheRow.stapling_BF,
      });

      dynamicSpecsArray.push({
        title: "Booklet Finisher",
        specs_json: JSON.stringify(bfData),
      });
    }

    // ----- Staple Finisher -----
    if (newSelected.includes("Staple")) {
      const sfData = filterValues({
        "Paper Output Capacity": cacheRow.paperOutputCapacity_SF,
        "Stapling": cacheRow.stapling_SF,
      });

      dynamicSpecsArray.push({
        title: "Staple Finisher",
        specs_json: JSON.stringify(sfData),
      });
    }

    // ----- Inner Finisher -----
    if (newSelected.includes("Inner")) {
      const ifData = filterValues({
        "Paper Output Capacity": cacheRow.paperOutputCapacity_IF,
        "Stapling": cacheRow.stapling_IF,
      });

      dynamicSpecsArray.push({
        title: "Inner Finisher",
        specs_json: JSON.stringify(ifData),
      });
    }

    // Save final JSON
    handleItemChange(
      index,
      "DYNAMIC_SPECS_JSON",
      JSON.stringify(dynamicSpecsArray)
    );

    // --- Image update ---
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

  const handleGenerateRentalSummary = async () => {
    const rentalData = {
      title: rentalTitle,
      brand: "ARENA",
      TotalMonths: totalMonths,
      items: rentalItems,
      PrintCostItems: printCostItems,
      UserNote: userNote,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/Document/generate-rental-summary`,
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
    addNewItem(); // original logic

    setItems((prev) => {
      const newItems = [...prev];

      // 新增 item 默认 number = 2
      newItems[newItems.length - 1].number = "2"; // 转回 string，避免 TS 错误

      return newItems;
    });

    setRentalItems((prev) => [
      ...prev,
      {
        Lokasi: customerName || "",
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
  const [featurePage, setFeaturePage] = useState("");
  useEffect(() => {
    if (featurePage) {
      setFeature1(featurePage);            // normal text
      setFeature2(featurePage.toUpperCase()); // UPPERCASE
    } else {
      setFeature1("");
      setFeature2("");
    }
  }, [featurePage]);

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-700 to-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🖨️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Proposal Generator for ARENA
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
                          Company Address
                        </label>

                        <select
                          value={companyaddress}
                          onChange={(e) => setcompanyaddress(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                        >
                          <option value="">Select company address</option>
                          {ARENA_ADDRESS.map((item, index) => (
                            <option key={index} value={item.address}>
                              {item.name}
                            </option>
                          ))}
                        </select>

                        {/* Show selected address in text area */}
                        {companyaddress && (
                          <textarea
                            value={companyaddress}
                            readOnly
                            rows={5}
                            className="w-full mt-3 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 resize-none"
                          />
                        )}
                      </div>


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
                          {ARENASTAFF_NAMES.map((name) => (
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
                  <div className="ml-10 bg-gradient-to-br from-blue-300 to-blue-50 border-2 border-blue-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
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
                          src="/images/ARENACoverpage.png"
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
                        <span className="text-blue-600 underline ml-2">
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
                  <div className="ml-10 bg-gradient-to-br from-blue-300 to-blue-50 border-2 border-blue-200/50 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-b pb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
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
                          <span className="font-bold">
                            Attention: To Whom It May Concern,
                          </span>
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
                        ARENA STABIL SDN BHD values{" "}
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
                        <p>for ARENA STABIL SDN BHD </p>
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trays
                          </label>
                          <select
                            value={item.paperCapacity} // store directly the full data
                            onChange={(e) => {
                              const selectedCapacity = e.target.value;
                              handleItemChange(index, "paperCapacity", selectedCapacity);
                            }}
                            className="w-full px-3 py-2 border border-red-500 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Tray Configuration</option>
                            {item.threeTrays && (
                              <option value={item.threeTrays}>{item.threeTrays}</option>
                            )}
                            {item.fiveTrays && (
                              <option value={item.fiveTrays}>{item.fiveTrays}</option>
                            )}
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
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Merged Live Preview and Document Preview (now w-2/3) */}
                  <td className="w-2/3 p-4">
                    <div className="ml-10 bg-gradient-to-br from-blue-300 to-blue-50 border-2 border-blue-200/50 rounded-xl p-6 shadow-lg">
                      <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-b pb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm">📄</span>
                        </div>
                        Document Preview
                      </h4>
                      <div className="mt-2 flex flex-col rounded-lg overflow-hidden">
                        <div className="">
                          <p className="w-1/2 text-black p-2 text-sm">
                            {item.i_model || "{i_model}"}
                          </p>
                        </div>
                        <div className="rounded-lg overflow-hidden p-2 mb-10">
                          {item.itemimage && (
                            <Image
                              src={item.itemimage}
                              alt="Item Image"
                              width={400}
                              height={300}
                              className="mt-5 h-48 object-contain"
                              unoptimized // ⚠️ disables Next.js image optimization
                            />
                          )}
                        </div>
                        {/* Bottom Section: Pricing Details */}
                        <div className="flex flex-col text-sm">
                          <h2 className="font-bold text-l">Copying</h2>
                          <div className="flex border border-blue-400 text-black">
                            <p className="w-1/2 p-2 font-medium border-r border-blue-400 text-black">
                              First Copy Out Time (BW)
                            </p>
                            <p className="w-1/2 p-2 ">
                              {item.firstCopy_BW || "-"}
                            </p>
                          </div>
                          <div className="flex border-l border-r border-blue-400 text-black">
                            <p className="w-1/2 p-2 font-medium border-r border-blue-400 text-black">
                              First Copy Out Time (CL)
                            </p>
                            <p className="w-1/2 p-2">
                              {item.firstCopy_CL || "-"}
                            </p>
                          </div>
                          <div className="flex border border-blue-400 text-black">
                            <p className="w-1/2 p-2 font-medium border-r border-blue-400 text-black">
                              Resolution
                            </p>
                            <p className="w-1/2 p-2">
                              {item.copyResolution || "-"}
                            </p>
                          </div>
                          <div className="flex border-l border-r border-b border-blue-400 text-black">
                            <p className="w-1/2 p-2 font-medium border-r border-blue-400 text-black">
                              Warm-Up Time (Quick Startup Mode)
                            </p>
                            <p className="w-1/2 p-2">
                              {item.warm_Up || "-"}
                            </p>
                          </div>

                          <h2 className="font-bold text-l mt-5">Printing</h2>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Speed (B/W)
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.speed_BW || "-"}
                            </p>
                          </div>
                          <div className="flex border-l border-r border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Speed (Color)
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.speed_CL || "-"}
                            </p>
                          </div>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Resolution
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.printingResolution || "-"}
                            </p>
                          </div>
                          <div className="flex border-l border-r border-blue-400">
                            <p className="w-1/2 p-2  text-black font-medium border-r border-blue-400">
                              Memory
                            </p>
                            <p className="w-1/2 p-2  text-black">
                              {item.memory || "-"}
                            </p>
                          </div>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Hard Disk
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.hardDisk || "-"}
                            </p>
                          </div>

                          <h2 className="font-bold text-l mt-5">Scanning</h2>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Feeder
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.feeder || "-"}
                            </p>
                          </div>
                          <div className="flex border-l border-r border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Feeder Capacity
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.feederCapacity || "-"}
                            </p>
                          </div>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Input Capacity
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.inputSpeed || "-"}
                            </p>
                          </div>
                          <div className="flex border-l border-r border-blue-400">
                            <p className="w-1/2 p-2  text-black font-medium border-r border-blue-400">
                              Resolution
                            </p>
                            <p className="w-1/2 p-2  text-black">
                              {item.scanningResolution || "-"}
                            </p>
                          </div>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              File Formats
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.fileFormats || "-"}
                            </p>
                          </div>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Scan Destinations
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.destinations || "-"}
                            </p>
                          </div>

                          <h2 className="font-bold text-l mt-5">General</h2>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Paper Capacity
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.paperCapacity || "-"}
                            </p>
                          </div>

                          <div className="flex border-l border-r border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Paper Sizes
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.paperSizes || "-"}
                            </p>
                          </div>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Paper Weights
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.paperWeights || "-"}
                            </p>
                          </div>
                          <div className="flex border-l border-r border-b border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Power Consumption
                            </p>

                            <p
                              className="w-1/2 p-2 text-black"
                              style={{ whiteSpace: "pre-line" }}   // 👈 让 \n 换行
                            >
                              {item.powerConsumption || "-"}
                            </p>
                          </div>

                          <p className="mt-5">For more detailed specifications, please refer to the Product Brochure.</p>
                          <h2 className="font-bold text-l mt-5">Pricing Schedule</h2>
                          <div className="flex border-b border-gray-300">
                            <p className="w-1/2 p-2 bg-blue-400 text-white font-medium border-r border-gray-300">
                              Quantity
                            </p>
                            <p className="w-1/2 p-2 bg-blue-400 text-white">
                              Model
                            </p>
                          </div>

                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              1 Unit {item.proposedmodel_type}
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.i_model}
                            </p>
                          </div>
                          <div className="flex border-r border-l  border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-300">
                              Monthly Rental/Unit
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.rental_unit}
                            </p>
                          </div>
                          <div className="flex border border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Meter Reading
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.meter_reading}
                            </p>
                          </div>
                          <div className="flex border-r border-l border-b border-blue-400">
                            <p className="w-1/2 p-2 text-black font-medium border-r border-blue-400">
                              Recommended Monthly Volume
                            </p>
                            <p className="w-1/2 p-2 text-black">
                              {item.mrpv}
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
                        {rentalItems.map((item, idx) => {
                          const hardwaretotal = item.JumlahHarga * totalMonths;
                          return (
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
                                      "Inner",
                                      "3 Trays",
                                      "5 Trays",
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
                                          const alreadySelected = group.every(
                                            (g) => newList.includes(g)
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
                                          const alreadySelected = group.every(
                                            (g) => newList.includes(g)
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
                                        copy[idx].Kuantiti = Number(
                                          e.target.value
                                        );
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
                                    step="0.01"
                                    placeholder="Monthly price"
                                    value={
                                      item.HargaBulanan !== undefined && item.HargaBulanan !== null
                                        ? item.HargaBulanan.toFixed(2)
                                        : ""
                                    }
                                    onChange={(e) =>
                                      setRentalItems((prev) => {
                                        const copy = [...prev];
                                        const value = parseFloat(e.target.value) || 0;
                                        copy[idx].HargaBulanan = value;
                                        copy[idx].JumlahHarga = value * copy[idx].Kuantiti;
                                        return copy;
                                      })
                                    }
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                                    min="0"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between items-center bg-blue 200/50 rounded-lg p-3 border-2 border-blue-300">
                                <span className="text-base font-bold text-grey-700">
                                  Jumlah Harga:
                                </span>
                                <span className="text-xl font-extrabold text-blue-800">
                                  RM {item.JumlahHarga.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-base font-bold text-gray-700">
                                  Jumlah Harga ({totalMonths} Bulan):
                                </span>
                                <span className="text-xl font-extrabold text-blue-800">
                                  RM {hardwaretotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
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
                        {printCostItems.map((p, idx) => {
                          // 1. Calculate the total price for the current item
                          const itemTotal =
                            p.EstimatedMonthlyMeterReading * p.PrintChargeRate;
                          const itemTotalMonthsPrice = itemTotal * totalMonths;

                          return (
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

                                  <select
                                    value={p.NameAndSpecification}
                                    onChange={(e) => {
                                      const selected = e.target.value;
                                      setPrintCostItems((prev) => {
                                        const copy = [...prev];
                                        copy[idx].NameAndSpecification = selected;

                                        // Logic to get the rate from meterOptions[0] (as previously agreed)
                                        const meter = meterOptions[0];

                                        if (
                                          selected ===
                                          "KADAR CETAKAN HITAM PUTIH" &&
                                          meter?.bw?.rm
                                        ) {
                                          copy[idx].PrintChargeRate = Number(
                                            meter.bw.rm
                                          );
                                        } else if (
                                          selected === "KADAR CETAKAN BERWARNA" &&
                                          meter?.color?.rm
                                        ) {
                                          copy[idx].PrintChargeRate = Number(
                                            meter.color.rm
                                          );
                                        }

                                        return copy;
                                      });
                                    }}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none bg-white"
                                  >
                                    <option value="">Select an option</option>
                                    <option value="KADAR CETAKAN HITAM PUTIH">
                                      KADAR CETAKAN HITAM PUTIH
                                    </option>
                                    <option value="KADAR CETAKAN BERWARNA">
                                      KADAR CETAKAN BERWARNA
                                    </option>
                                  </select>
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

                                {/* ✅ NEW: INDIVIDUAL JUMLAH HARGA ROW */}
                                <div className="pt-2">
                                  <div className="flex justify-between items-center px-4 py-3 bg-green-200/50 rounded-lg border border-green-300">
                                    <span className="text-base font-bold text-gray-700">
                                      Jumlah Harga:
                                    </span>
                                    <span className="text-xl font-extrabold text-green-800">
                                      RM {itemTotal.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-base font-bold text-gray-700">
                                  Jumlah Harga ({totalMonths} Bulan):
                                </span>
                                <span className="text-xl font-extrabold text-green-800">
                                  RM {itemTotalMonthsPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
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
