"use client";

import { useState } from "react";
import Image from "next/image";
const ContractsPage = () => {
    // Shared list of Canon models, now with group labels
    const canonModels = [
        { name: "[SELECT MODEL]", group: "Select" },
        { name: "Canon imagePROGRAF TX-5420", group: "44\" Size" },
        { name: "Canon imagePROGRAF TX-5420 MFP Z36", group: "44\" Size" },

        { name: "Canon imagePROGRAF TC-21", group: "A1 Size" },
        { name: "Canon imagePROGRAF TC-21M", group: "A1 Size" },
        { name: "Canon imagePROGRAF TM-5240", group: "A1 Size" },
        { name: "Canon imagePROGRAF TM-5240 MFP Lm24", group: "A1 Size" },
        { name: "Canon imagePROGRAF TM-5250", group: "A1 Size" },
        { name: "Canon imagePROGRAF TM-5250 MFP Lm24", group: "A1 Size" },
        { name: "Canon imagePROGRAF TM-5255", group: "A1 Size" },
        { name: "Canon imagePROGRAF TX-5220", group: "A1 Size" },

        { name: "Canon imagePROGRAF TM-5340", group: "A0 Size" },
        { name: "Canon imagePROGRAF TM-5340 MFP Lm36", group: "A0 Size" },
        { name: "Canon imagePROGRAF TM-5350", group: "A0 Size" },
        { name: "Canon imagePROGRAF TM-5350 MFP Lm36", group: "A0 Size" },
        { name: "Canon imagePROGRAF TM-5355", group: "A0 Size" },
        { name: "Canon imagePROGRAF TM-5355 MFP Z36", group: "A0 Size" },
        { name: "Canon imagePROGRAF TX-5320", group: "A0 Size" },
        { name: "Canon imagePROGRAF TX-5320 MFP Z36", group: "A0 Size" },
        { name: "Canon imagePROGRAF TZ-5320", group: "A0 Size" },
        { name: "Canon imagePROGRAF TZ-5320 MFP Z36", group: "A0 Size" },
    ];

    interface Plotter {
        id: number;
        modelName: string;
        segments: string;
        hotSwapInkTanks: string;
        hotSwapMedia: string;
        autoRollLoad: string;
        autoMediaDetection: string;
        borderlessPrinting: string;
        usbThumbDriveSupport: string;
        securePrinting: string;
        printType: string;
        maxPrintResolution: string;
        numberofNozz: string;
        lineAccuracy: string;
        inkDropletSize: string;
        osCompatibility: string;
        inkType: string;
        colours: string;
        inkTankSize: string;
        memory: string;
        hardDisk: string;
        display: string;
        plainPaperCADDrawing: string;
        heavyweightCoatedPaperPoster: string;
        mediaFeedRollPaper: string;
        mediaFeedCutSheet: string;
        mediaThickness: string;
        outsideDiameterRollPaper: string;
        coreSize: string;
        printableMediaWidthRollPaper: string;
        cutsheet: string;
        rollUnit: string;
        supportedScannerModel: string;
        scanSpeed: string;
        opticalResolution: string;
        scanFormat: string;
        printerWeightWithStand: string;
        scannerWeight: string;
        inkTank: string;
        printHead: string;
        cutterBlade: string;
        maintenanceCartridge: string;
        sellingPrice: string;
        specialPrice: string;
        catogories: string;
    }


    // Group the models for rendering the <select> with <optgroup>
    const groupedModels = canonModels.reduce<Record<string, { name: string; group: string }[]>>(
        (acc, model) => {
            const group = model.group;
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(model);
            return acc;
        },
        {}
    );

    // Dropdown selections state (updated to store the model name string)
    // Note: The initial state should match the string value of the first option, which is "[SELECT MODEL]"
    const initialModelName = canonModels[0].name;

    const [selected1, setSelected1] = useState(initialModelName);
    const [selected2, setSelected2] = useState(initialModelName);
    const [selected3, setSelected3] = useState(initialModelName);

    // ... (Keep API results state and fetchPlotterData function unchanged)
    const [plotter1, setPlotter1] = useState<Plotter | null>(null);
    const [plotter2, setPlotter2] = useState<Plotter | null>(null);
    const [plotter3, setPlotter3] = useState<Plotter | null>(null);

    const fetchPlotterData = async (
        modelName: string,
        setter: React.Dispatch<React.SetStateAction<Plotter | null>>
    ) => {
        // Prevent API call if no model is selected
        if (modelName === "[SELECT MODEL]") {
            setter(null);
            return;
        }

        try {
            // Note: process.env.NEXT_PUBLIC_API_BASE_URL must be defined in your environment
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Plotter/byModelName/${modelName}`);

            if (!res.ok) {
                // Handle non-200 responses
                setter(null);
                return;
            }

            const data: Plotter[] = await res.json();
            // Assuming the API returns an array, use the first item
            setter(data[0] || null);
        } catch (err) {
            console.error("Error fetching plotter:", err);
            setter(null);
        }
    };

    const fetchPlotterImage = async (
        modelName: string,
        setter: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        if (modelName === "[SELECT MODEL]") {
            setter(null);
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Plotter/image/${modelName}`
            );

            if (!res.ok) {
                setter(null);
                return;
            }

            // Convert the image binary to a blob URL
            const blob = await res.blob();
            const imgUrl = URL.createObjectURL(blob);
            setter(imgUrl);
        } catch (error) {
            console.error("Error fetching image:", error);
            setter(null);
        }
    };
    const [image1, setImage1] = useState<string | null>(null);
    const [image2, setImage2] = useState<string | null>(null);
    const [image3, setImage3] = useState<string | null>(null);
    const [highlightedCells1, setHighlightedCells1] = useState<Set<string>>(new Set());
    const [highlightedCells2, setHighlightedCells2] = useState<Set<string>>(new Set());
    const [highlightedCells3, setHighlightedCells3] = useState<Set<string>>(new Set());
    const cellIdToFeatureHeader: Record<string, string> = {
        // Prices
        "cell-2": "Selling Price",
        "cell-3": "Special Price",

        // Categories & segments
        "cell-5": "Categories",
        "cell-6": "Segments",

        // Unique Features of Canon LFP
        "cell-8": "Hot Swap Ink Tanks",
        "cell-9": "Hot-Swap Media (Roll Paper) (Dual Roll)",
        "cell-10": "Automatic Roll Loading",
        "cell-11": "Automatic Media (Roll Paper) Width Detection",
        "cell-12": "Borderless Printing",
        "cell-13": "USB Thumb Drive Support",
        "cell-14": "Secure Printing",

        // Machine Specifications
        "cell-16": "Printer Type, Size",
        "cell-17": "Max.Print Resolution",
        "cell-18": "Number of Nozzles",
        "cell-19": "Line Accuracy",
        "cell-20": "Ink Droplet Size",
        "cell-21": "OS Compatibility",

        // Ink System
        "cell-23": "Ink Type",
        "cell-24": "Colours",
        "cell-25": "Ink Tank Size",

        // Memory
        "cell-27": "Memory",
        "cell-28": "Hard Disk",

        // Interface
        "cell-30": "Display",

        // Print Speed
        "cell-32": "Plain Paper | CAD Drawing",
        "cell-33": "Heavyweight Coated Paper HG | Poster",

        // Media Handling
        "cell-35": "Media Feed | Roll Paper",
        "cell-36": "Media Feed | Cut Sheet",
        "cell-37": "Media Thickness | Roll Paper/ Cut Sheet",
        "cell-38": "Outside Diameter Roll Paper",
        "cell-39": "Core Size",
        "cell-40": "Printable Media Width | Roll Paper",
        "cell-41": "Printable Media Width | Cut Sheet",
        "cell-42": "Roll Unit(s)",

        // Scanner Specifications
        "cell-44": "Supported Scanner Model",
        "cell-45": "Scan Speed",
        "cell-46": "Optical Resolution",
        "cell-47": "Scan Format",

        // Dimensions & Weight
        "cell-49": "Printer Weight | With Stand",
        "cell-50": "Scanner (WxDxH) Weight",

        // Consumables
        "cell-52": "Ink Tank",
        "cell-53": "Print Head",
        "cell-54": "Cutter Blade",
        "cell-55": "Maintenance Cartridge"
    };
    const handleClick = async () => {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300);

        // Collect selected models
        const modelNames = [selected1, selected2, selected3].filter(name => name !== "[SELECT MODEL]");

        if (modelNames.length < 2) {
            alert("Please select at least 2 models.");
            return;
        }

        // Collect highlighted features
        const highlights: { featureHeader: string; modelName: string }[] = [];

        const mapHighlights = (highlightedCells: Set<string>, modelName: string) => {
            highlightedCells.forEach(cellId => {
                const featureHeader = cellIdToFeatureHeader[cellId];
                if (featureHeader) {
                    highlights.push({ featureHeader, modelName });
                }
            });
        };

        mapHighlights(highlightedCells1, selected1);
        mapHighlights(highlightedCells2, selected2);
        mapHighlights(highlightedCells3, selected3);

        // POST to API
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Plotter/compare-to-docx`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modelNames, highlights }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("API error:", text);
                alert(`Failed: ${text}`);
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            // Trigger download
            const a = document.createElement("a");
            a.href = url;
            a.download = `Plotter_Comparison_${new Date().toISOString().replace(/[:.]/g, "-")}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error(err);
            alert("Failed to generate DOCX.");
        }
    };

    const handleCellClick = (
        cellId: string,
        setter: React.Dispatch<React.SetStateAction<Set<string>>>,
        currentSet: Set<string>
    ) => {
        const newSet = new Set(currentSet);
        if (newSet.has(cellId)) {
            newSet.delete(cellId);
        } else {
            newSet.add(cellId);
        }
        setter(newSet);
    };

    const renderCell = (
        content: React.ReactNode,
        cellId: string,
        highlightedCells: Set<string>,
        setHighlightedCells: React.Dispatch<React.SetStateAction<Set<string>>>,
        extraClass = ""
    ) => {
        const isHighlighted = highlightedCells.has(cellId);
        return (
            <td
                className={`${extraClass} ${isHighlighted ? "bg-red-200/50" : ""} cursor-pointer`}
                onClick={() => handleCellClick(cellId, setHighlightedCells, highlightedCells)}
            >
                {content || ""}
            </td>
        );
    };
    // Component for displaying plotter details (moved outside if possible, but kept here for completeness)
    const PlotterDetails = ({
        data,
        highlightedCells,
        setHighlightedCells
    }: {
        data: Plotter | null,
        highlightedCells: Set<string>,
        setHighlightedCells: React.Dispatch<React.SetStateAction<Set<string>>>
    }) => {
        if (!data) return <p className="text-gray-400 text-sm">No data loaded. Please select a model.</p>;

        return (
            <div className="w-full overflow-x-auto">
                <table className="table-auto w-full text-sm text-center ">
                    <tbody>
                        <tr>{renderCell("", "cell-0", highlightedCells, setHighlightedCells)}</tr>
                        <tr className="bg-white">{renderCell("", "cell-1", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.sellingPrice, "cell-2", highlightedCells, setHighlightedCells, "text-xl h-7 font-bold")}</tr>
                        <tr>{renderCell(data.specialPrice, "cell-3", highlightedCells, setHighlightedCells, "text-xl h-7 font-bold text-red-600")}</tr>

                        {/* Model Name & Categories */}
                        <tr className="bg-white">{renderCell("", "cell-4", highlightedCells, setHighlightedCells, "pt-4 h-7")}</tr>
                        <tr>{renderCell(data.catogories, "cell-5", highlightedCells, setHighlightedCells, "h-5")}</tr>
                        <tr>{renderCell(data.segments, "cell-6", highlightedCells, setHighlightedCells, "h-5")}</tr>

                        {/* UNIQUE FEATURES OF CANON LFP */}
                        <tr className="bg-white">{renderCell("", "cell-7", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.hotSwapInkTanks, "cell-8", highlightedCells, setHighlightedCells, "h-5")}</tr>
                        <tr>{renderCell(data.hotSwapMedia, "cell-9", highlightedCells, setHighlightedCells, "h-5")}</tr>
                        <tr>{renderCell(data.autoRollLoad, "cell-10", highlightedCells, setHighlightedCells, "h-5")}</tr>
                        <tr>{renderCell(data.autoMediaDetection, "cell-11", highlightedCells, setHighlightedCells, "h-9")}</tr>
                        <tr>{renderCell(data.borderlessPrinting, "cell-12", highlightedCells, setHighlightedCells, "h-5")}</tr>
                        <tr>{renderCell(data.usbThumbDriveSupport, "cell-13", highlightedCells, setHighlightedCells, "h-5")}</tr>
                        <tr>{renderCell(data.securePrinting, "cell-14", highlightedCells, setHighlightedCells, "h-5")}</tr>

                        {/* MACHINE SPECIFICATIONS */}
                        <tr className="bg-white">{renderCell("", "cell-15", highlightedCells, setHighlightedCells, "pt-4 h-12")}</tr>
                        <tr>{renderCell(data.printType, "cell-16", highlightedCells, setHighlightedCells,)}</tr>
                        <tr>{renderCell(data.maxPrintResolution, "cell-17", highlightedCells, setHighlightedCells,)}</tr>
                        <tr>{renderCell(data.numberofNozz, "cell-18", highlightedCells, setHighlightedCells, "h-13")}</tr>
                        <tr>{renderCell(data.lineAccuracy, "cell-19", highlightedCells, setHighlightedCells,)}</tr>
                        <tr>{renderCell(data.inkDropletSize, "cell-20", highlightedCells, setHighlightedCells,)}</tr>
                        <tr>{renderCell(data.osCompatibility, "cell-21", highlightedCells, setHighlightedCells,)}</tr>

                        {/* INK SYSTEM */}
                        <tr className="bg-white">{renderCell("", "cell-22", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>
                            {renderCell(
                                data.inkType ? (
                                    <span dangerouslySetInnerHTML={{ __html: data.inkType }} />
                                ) : (
                                    "-"
                                ),
                                "cell-23", highlightedCells, setHighlightedCells,
                            )}
                        </tr>
                        <tr>{renderCell(data.colours, "cell-24", highlightedCells, setHighlightedCells,)}</tr>
                        <tr>{renderCell(data.inkTankSize, "cell-25", highlightedCells, setHighlightedCells,)}</tr>

                        {/* MEMORY */}
                        <tr className="bg-white">{renderCell("", "cell-26", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.memory, "cell-27", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.hardDisk, "cell-28", highlightedCells, setHighlightedCells)}</tr>

                        {/* INTERFACE */}
                        <tr className="bg-white">{renderCell("", "cell-29", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.display, "cell-30", highlightedCells, setHighlightedCells)}</tr>

                        {/* PRINT SPEED */}
                        <tr className="bg-white">{renderCell("", "cell-31", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.plainPaperCADDrawing, "cell-32", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.heavyweightCoatedPaperPoster, "cell-33", highlightedCells, setHighlightedCells)}</tr>

                        {/* MEDIA HANDLING */}
                        <tr className="bg-white">{renderCell("", "cell-34", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.mediaFeedRollPaper, "cell-35", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.mediaFeedCutSheet, "cell-36", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.mediaThickness, "cell-37", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.outsideDiameterRollPaper, "cell-38", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.coreSize, "cell-39", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.printableMediaWidthRollPaper, "cell-40", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.cutsheet, "cell-41", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.rollUnit, "cell-42", highlightedCells, setHighlightedCells)}</tr>

                        {/* SCANNER SPECIFICATIONS */}
                        <tr className="bg-white">{renderCell("", "cell-43", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.supportedScannerModel, "cell-44", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.scanSpeed, "cell-45", highlightedCells, setHighlightedCells, "pt4 h-13")}</tr>
                        <tr>{renderCell(data.opticalResolution, "cell-46", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.scanFormat, "cell-47", highlightedCells, setHighlightedCells)}</tr>

                        {/* DIMENSIONS & WEIGHT */}
                        <tr className="bg-white">{renderCell("", "cell-48", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.printerWeightWithStand, "cell-49", highlightedCells, setHighlightedCells, "h-20 whitespace-pre-line")}</tr>
                        <tr>{renderCell(data.scannerWeight, "cell-50", highlightedCells, setHighlightedCells, "h-15")}</tr>

                        {/* CONSUMABLES */}
                        <tr className="bg-white">{renderCell("", "cell-51", highlightedCells, setHighlightedCells, "pt-4 h-11")}</tr>
                        <tr>{renderCell(data.inkTank, "cell-52", highlightedCells, setHighlightedCells, "h-15 whitespace-pre-line")}</tr>
                        <tr>{renderCell(data.printHead, "cell-53", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.cutterBlade, "cell-54", highlightedCells, setHighlightedCells)}</tr>
                        <tr>{renderCell(data.maintenanceCartridge, "cell-55", highlightedCells, setHighlightedCells)}</tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const [isClicked, setIsClicked] = useState(false);

    return (
        <main className="p-4 md:p-8 min-h-screen">
            <div className="flex flex-col h-screen">
                <section className="flex-1 bg-white p-6 rounded-2xl shadow">
                    {/* Title */}
                    <div className="flex flex-col items-center mt-20 space-y-2">
                        <h1 className="text-6xl font-bold text-black">
                            Compare Plotter Models Here
                        </h1>

                        <p>
                            Get more details:{" "}
                            <a
                                href="https://my.canon/en/business/products/search?category=printing&subCategory=wide-format-printers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:underline"
                            >
                                Canon Malaysia
                            </a>
                            {" "}||{" "}
                            <a
                                href="https://www.hp.com/my-en/shop/printers/business-printers/designjet.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:underline"
                            >
                                HP Malaysia
                            </a>
                        </p>
                    </div>

                    {/* 4 Columns Comparison Section - Flexbox for Horizontal Alignment */}
                    <div className="mt-10 px-4">
                        <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-4 items-center">
                            {/* Column 0: Specification Labels (Fixed Width) */}
                            <div className="flex flex-col items-center p-4 rounded-lg w-[300px] flex-shrink-0">
                                <button
                                    onClick={handleClick}
                                    className={`
                                    relative
                                    px-6 py-3
                                    font-bold text-white
                                    rounded-lg
                                    border-2 border-red-600
                                    bg-red-300 
                                    transform transition-transform duration-150
                                    ${isClicked ? "rotate-[15deg] -translate-y-1" : "rotate-0 translate-y-0"}
                                    hover:scale-105 hover:shadow-lg
                                    `}
                                >
                                    GENERATE
                                </button>
                                <p className="text-red-500 mt-4 text-xs font-bold">Remind: The document generate will only compare the first two model</p>
                            </div>



                            {/* Column 1: Model 1 Details - Updated Dropdown Rendering */}
                            <div className="flex flex-col items-center p-4 rounded-lg flex-shrink-0 w-1/4 min-w-[300px]">
                                <div className="w-full mb-4">
                                    {image1 ? (
                                        <Image
                                            src={image1}
                                            alt="Plotter"
                                            className="rounded-lg"
                                            width={800}      // specify the width you want
                                            height={600}     // specify the height you want
                                            style={{ width: "100%", height: "auto" }} // maintain responsive layout
                                        />
                                    ) : (
                                        <div className="w-full h-[200px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className="w-full mb-4 sticky top-0 bg-white z-10">
                                    <select
                                        value={selected1}
                                        onChange={(e) => {
                                            setSelected1(e.target.value);
                                            fetchPlotterData(e.target.value, setPlotter1);
                                            fetchPlotterImage(e.target.value, setImage1);
                                        }}
                                        className="mb-4 p-2 border rounded border-gray-300 w-full"
                                    >
                                        {/* Render grouped options */}
                                        {Object.keys(groupedModels).map((groupName) => (
                                            <optgroup key={groupName} label={groupName}>
                                                {groupedModels[groupName].map((model) => (
                                                    <option key={model.name} value={model.name}>
                                                        {model.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* Column 2: Model 2 Details - Updated Dropdown Rendering */}
                            <div className="flex flex-col items-center p-4 rounded-lg flex-shrink-0 w-1/4 min-w-[300px]">
                                <div className="w-full mb-4">
                                    {image2 ? (
                                        <Image
                                            src={image2}
                                            alt="Plotter"
                                            className="rounded-lg"
                                            width={800}
                                            height={600}
                                            style={{ width: "100%", height: "auto" }}
                                        />

                                    ) : (
                                        <div className="w-full h-[200px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className="w-full mb-4 sticky top-0 bg-white z-10">
                                    <select
                                        value={selected2}
                                        onChange={(e) => {
                                            setSelected2(e.target.value);
                                            fetchPlotterData(e.target.value, setPlotter2);
                                            fetchPlotterImage(e.target.value, setImage2);
                                        }}
                                        className="mb-4 p-2 border rounded border-gray-300 w-full"
                                    >
                                        {/* Render grouped options */}
                                        {Object.keys(groupedModels).map((groupName) => (
                                            <optgroup key={groupName} label={groupName}>
                                                {groupedModels[groupName].map((model) => (
                                                    <option key={model.name} value={model.name}>
                                                        {model.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* Column 3: Model 3 Details - Updated Dropdown Rendering */}
                            <div className="flex flex-col items-center p-4 rounded-lg flex-shrink-0 w-1/4 min-w-[300px]">
                                <div className="w-full mb-4">
                                    {image3 ? (
                                        <Image
                                            src={image3}
                                            alt="Plotter"
                                            className="rounded-lg"
                                            width={800}
                                            height={600}
                                            style={{ width: "100%", height: "auto" }}
                                        />
                                    ) : (
                                        <div className="w-full h-[200px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className="w-full mb-4 sticky top-0 bg-white z-10">
                                    <select
                                        value={selected3}
                                        onChange={(e) => {
                                            setSelected3(e.target.value);
                                            fetchPlotterData(e.target.value, setPlotter3);
                                            fetchPlotterImage(e.target.value, setImage3);
                                        }}
                                        className="mb-4 p-2 border rounded border-gray-300 w-full"
                                    >
                                        {/* Render grouped options */}
                                        {Object.keys(groupedModels).map((groupName) => (
                                            <optgroup key={groupName} label={groupName}>
                                                {groupedModels[groupName].map((model) => (
                                                    <option key={model.name} value={model.name}>
                                                        {model.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-4">
                            {/* Column 0: Specification Labels (Fixed Width) */}
                            <div className="flex flex-col items-center p-4 rounded-lg shadow-xl bg-white w-[300px] flex-shrink-0">
                                <table className=" table-auto w-full text-sm text-left ">
                                    <tbody>
                                        {/* MACHINE PRICE */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">MACHINE PRICE</td>
                                        </tr>
                                        <tr>
                                            <td className="h-7 ">Selling Price</td>
                                        </tr>
                                        <tr>
                                            <td className="h-7 ">Special Price</td>
                                        </tr>

                                        {/* Model Name & Categories */}
                                        <tr className="font-bold border-gray-300">
                                            <td className="pt-4 h-7 "></td>
                                        </tr>
                                        <tr>
                                            <td className="h-5 ">Categories</td>
                                        </tr>
                                        <tr>
                                            <td className="h-5 ">Segments</td>
                                        </tr>

                                        {/* UNIQUE FEATURES OF CANON LFP */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">UNIQUE FEATURES OF CANON LFP</td>
                                        </tr>
                                        <tr><td className="h-5 ">Hot Swap Ink Tanks</td></tr>
                                        <tr><td className="h-5 ">Hot-Swap Media (Roll Paper) (Dual Roll)</td></tr>
                                        <tr><td className="h-5 ">Automatic Roll Loading</td></tr>
                                        <tr><td className="h-5 ">Automatic Media (Roll Paper) Width Detection</td></tr>
                                        <tr><td className="h-5 ">Borderless Printing</td></tr>
                                        <tr><td className="h-5 ">USB Thumb Drive Support</td></tr>
                                        <tr><td className="h-5 ">Secure Printing</td></tr>

                                        {/* MACHINE SPECIFICATIONS */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">MACHINE SPECIFICATIONS</td>
                                        </tr>
                                        <tr><td className="h-5 ">Printer Type, Size</td></tr>
                                        <tr><td className="h-5 ">Max.Print Resolution</td></tr>
                                        <tr><td className="h-13 ">Number of Nozzles</td></tr>
                                        <tr><td className="h-5 ">Line Accuracy</td></tr>
                                        <tr><td className="h-5 ">Ink Droplet Size</td></tr>
                                        <tr><td className="h-5 ">OS Compatibility</td></tr>

                                        {/* INK SYSTEM */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">INK SYSTEM</td>
                                        </tr>
                                        <tr><td className="h-5 ">Ink Type</td></tr>
                                        <tr><td className="h-5 ">Colours</td></tr>
                                        <tr><td className="h-5 ">Ink Tank Size</td></tr>

                                        {/* MEMORY */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">MEMORY</td>
                                        </tr>
                                        <tr><td className="h-5 ">Memory</td></tr>
                                        <tr><td className="h-5 ">Hard Disk</td></tr>

                                        {/* INTERFACE */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">INTERFACE</td>
                                        </tr>
                                        <tr><td className="h-5 ">Display</td></tr>

                                        {/* PRINT SPEED */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">PRINT SPEED</td>
                                        </tr>
                                        <tr><td className="h-5 ">Plain Paper | CAD Drawing</td></tr>
                                        <tr><td className="h-5 ">Heavyweight Coated Paper HG | Poster</td></tr>

                                        {/* MEDIA HANDLING */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">MEDIA HANDLING</td>
                                        </tr>
                                        <tr><td className="h-5 ">Media Feed | Roll Paper</td></tr>
                                        <tr><td className="h-5 ">Media Feed | Cut Sheet</td></tr>
                                        <tr><td className="h-5 ">Media Thickness | Roll Paper/ Cut Sheet</td></tr>
                                        <tr><td className="h-5 ">Outside Diameter Roll Paper</td></tr>
                                        <tr><td className="h-5 ">Core Size</td></tr>
                                        <tr><td className="h-5 ">Printable Media Width | Roll Paper</td></tr>
                                        <tr><td className="h-5 ">Printable Media Width | Cut Sheet</td></tr>
                                        <tr><td className="h-5 ">Roll Unit(s)</td></tr>

                                        {/* SCANNER SPECIFICATIONS */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">SCANNER SPECIFICATIONS</td>
                                        </tr>
                                        <tr><td className="h-5 ">Supported Scanner Model</td></tr>
                                        <tr><td className="h-13 ">Scan Speed</td></tr>
                                        <tr><td className="h-5 ">Optical Resolution</td></tr>
                                        <tr><td className="h-5 ">Scan Format</td></tr>

                                        {/* DIMENSIONS & WEIGHT */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">DIMENSIONS (WxDxH) & WEIGHT</td>
                                        </tr>
                                        <tr><td className="h-20 ">Printer Weight | With Stand</td></tr>
                                        <tr><td className="h-15 ">Scanner (WxDxH) Weight</td></tr>

                                        {/* CONSUMABLES */}
                                        <tr className="bg-gray-100 font-bold border-b border-gray-300">
                                            <td className="pt-4 h-11 ">CONSUMABLES</td>
                                        </tr>
                                        <tr><td className="h-15 ">Ink Tank</td></tr>
                                        <tr><td className="h-5 ">Print Head</td></tr>
                                        <tr><td className="h-5 ">Cutter Blade</td></tr>
                                        <tr><td className="h-5 ">Maintenance Cartridge</td></tr>
                                    </tbody>
                                </table>
                            </div>



                            {/* Column 1: Model 1 Details - Updated Dropdown Rendering */}
                            <div className="flex flex-col items-center p-4 rounded-lg shadow-xl bg-white flex-shrink-0 w-1/4 min-w-[300px]">
                                <PlotterDetails
                                    key={selected1}
                                    data={plotter1}
                                    highlightedCells={highlightedCells1}
                                    setHighlightedCells={setHighlightedCells1}
                                />
                            </div>

                            {/* Column 2: Model 2 Details - Updated Dropdown Rendering */}
                            <div className="flex flex-col items-center p-4 rounded-lg shadow-xl bg-white flex-shrink-0 w-1/4 min-w-[300px]">
                                <PlotterDetails
                                    key={selected2}
                                    data={plotter2}
                                    highlightedCells={highlightedCells2}
                                    setHighlightedCells={setHighlightedCells2}
                                />
                            </div>

                            {/* Column 3: Model 3 Details - Updated Dropdown Rendering */}
                            <div className="flex flex-col items-center p-4 rounded-lg shadow-xl bg-white flex-shrink-0 w-1/4 min-w-[300px]">
                                <PlotterDetails
                                    key={selected3}
                                    data={plotter3}
                                    highlightedCells={highlightedCells3}
                                    setHighlightedCells={setHighlightedCells3}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};


export default ContractsPage;
