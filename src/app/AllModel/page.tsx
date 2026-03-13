"use client";
import Image from "next/image";
import React, { useState, useEffect, ReactNode } from 'react';
import {
    X, Loader2, Zap, Printer, Layers,
    Search,
    Menu,
    Settings2,
    FileText,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // For smooth pop-out
import { catalog } from "../../constants/printerData";
interface SpecData {
    speed_BW?: string;
    speed_CL?: string;
    warm_Up?: string;
    memory?: string;
    hardDisk?: string;
    firstCopy_BW?: string;
    firstCopy_CL?: string;

    feeder?: string;
    feederCapacity?: string;
    inputSpeed?: string;
    fileFormats?: string;
    destinations?: string;

    paperSizes?: string;
    paperWeights?: string;
    threeTrays?: string;
    fiveTrays?: string;

    mrpv?: string;
    powerConsumption?: string;

    inner?: string;
    stapling_IF?: string;
    paperOutputCapacity_SF?: string;
    stapling_SF?: string;
    booklet?: string;
    stapling_BF?: string;

    modemSpeed_F?: string;
    compressionMethod_F?: string;
    resolutionDpi_F?: string;
    faxMemory_F?: string;
}
interface Product {
    name: string;
    price: string;
}

interface ProductImage {
    id: number;
    label?: string;
}

interface ProductCardProps {
    product: Product;
    images: ProductImage[];
    onViewSpecs: (modelName: string) => void;
    apiBase?: string;
}
const ProductPage = () => {
    const [activeSection, setActiveSection] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- NEW STATES FOR SPECIFICATIONS ---
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [specData, setSpecData] = useState<SpecData | null>(null);
    const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

    // --- FETCH SPECIFICATIONS FUNCTION ---
    const handleViewSpecs = async (modelName: string) => {
        setSelectedProduct(modelName);
        setIsLoadingSpecs(true);
        setSpecData(null); // Reset previous data

        try {
            const response = await fetch(`${API_BASE}/api/ModelDetails/name/${encodeURIComponent(modelName)}`);
            if (response.ok) {
                const data = await response.json();
                setSpecData(data);
            } else {
                console.error("Failed to fetch specifications");
            }
        } catch (error) {
            console.error("Error fetching specs:", error);
        } finally {
            setIsLoadingSpecs(false);
        }
    };

    // Observer for scroll tracking
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { threshold: 0.2, rootMargin: "0px 0px -50% 0px" }
        );
        catalog.forEach((group) => {
            const el = document.getElementById(group.series.replace(/\s+/g, ''));
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-white text-[#121212] font-sans lg:flex scroll-smooth">

            {/* MOBILE NAVIGATION HEADER */}
            <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Index</p>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {catalog.map((group) => (
                        <a key={group.series} href={`#${group.series.replace(/\s+/g, '')}`}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${activeSection === group.series.replace(/\s+/g, '') ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                            {group.series}
                        </a>
                    ))}
                </div>
            </div>

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:flex w-72 flex-col border-r border-zinc-100 p-10 sticky top-0 h-screen bg-white z-20">
                <div className="mb-16">
                    <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-zinc-300 mb-2">Navigation</p>
                    <h2 className="text-xl font-medium tracking-tighter">Product Index</h2>
                </div>
                <nav className="flex-1 space-y-1 relative">
                    {catalog.map((group) => {
                        const sectionId = group.series.replace(/\s+/g, '');
                        return (
                            <a key={sectionId} href={`#${sectionId}`}
                                className={`group flex items-center gap-4 py-3 pl-6 transition-all relative ${activeSection === sectionId ? 'text-black font-semibold' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                {activeSection === sectionId && <div className="absolute left-0 w-[7px] h-[7px] bg-black rounded-full -translate-x-[3px]" />}
                                <span className="text-[11px] uppercase tracking-[0.2em]">{group.series}</span>
                            </a>
                        );
                    })}
                </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 px-6 md:px-12 lg:px-20 py-10 lg:py-16">
                <header className="flex flex-col md:flex-row justify-between items-start mb-16 gap-6 border-b border-zinc-100 pb-12">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-light tracking-tighter mb-4">Office <span className="italic font-serif text-zinc-400">Solutions</span></h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Authorized Canon Dealer</p>
                    </div>
                </header>

                {catalog.map((group, groupIndex) => (
                    <section key={groupIndex} id={group.series.replace(/\s+/g, '')} className="mb-24 lg:mb-40 scroll-mt-32">
                        <div className="flex items-baseline gap-4 mb-10">
                            <h2 className="text-2xl lg:text-3xl font-light">{group.series}</h2>
                            <div className="h-[1px] flex-1 bg-zinc-100"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                            {group.products.map((product, pIndex) => (
                                <ProductCard
                                    key={pIndex}
                                    product={product}
                                    // Pass the series images to every product in that series
                                    images={group.seriesImages || []}
                                    onViewSpecs={handleViewSpecs}
                                    apiBase={API_BASE}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            {/* --- ENHANCED SPECIFICATION MODAL --- */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
                            onClick={() => setSelectedProduct(null)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative bg-white w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl rounded-xl"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="bg-black p-2 rounded-lg">
                                        <Printer size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-zinc-900 leading-tight">{selectedProduct}</h2>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Comprehensive Specification Data</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto bg-white">
                                {isLoadingSpecs ? (
                                    <div className="h-96 flex flex-col items-center justify-center">
                                        <Loader2 className="animate-spin text-zinc-900 mb-4" size={32} />
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Building Datasheet...</p>
                                    </div>
                                ) : specData ? (
                                    <div className="p-6 md:p-10 space-y-12">

                                        {/* 1. CORE ENGINE SPECS */}
                                        <section>
                                            <SectionHeader icon={<Zap size={16} />} title="Core Performance" />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <DataBox label="Print Speed (BW/CL)" value={`${specData.speed_BW} / ${specData.speed_CL}`} />
                                                <DataBox label="Warm-up Time" value={specData.warm_Up} />
                                                <DataBox label="Memory / Storage" value={`${specData.memory} / ${specData.hardDisk}`} />
                                                <DataBox label="First Copy (BW/CL)" value={`${specData.firstCopy_BW} / ${specData.firstCopy_CL}`} />
                                            </div>
                                        </section>

                                        {/* 2. SCANNING & DOCUMENT FEEDER */}
                                        <section>
                                            <SectionHeader icon={<Search size={16} />} title="Digital Imaging & Scanning" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <DataRow label="Feeder Type" value={specData.feeder} />
                                                    <DataRow label="Feeder Capacity" value={specData.feederCapacity} />
                                                    <DataRow label="Scan Speed (ipm)" value={specData.inputSpeed} />
                                                </div>
                                                <div className="space-y-4">
                                                    <DataRow label="File Formats" value={specData.fileFormats} isLongText />
                                                    <DataRow label="Destinations" value={specData.destinations} isLongText />
                                                </div>
                                            </div>
                                        </section>

                                        {/* 3. PAPER HANDLING & TRAYS */}
                                        <section>
                                            <SectionHeader icon={<Layers size={16} />} title="Media & Paper Management" />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="space-y-4">
                                                    <DataRow label="Supported Sizes" value={specData.paperSizes} />
                                                    <DataRow label="Paper Weights" value={specData.paperWeights} />
                                                </div>
                                                <div className="space-y-4">
                                                    <DataRow label="Standard Configuration" value={specData.threeTrays} />
                                                    <DataRow label="Max Expansion" value={specData.fiveTrays} />
                                                </div>
                                                <div className="space-y-4 bg-zinc-50 p-4 rounded-lg">
                                                    <DataRow label="Monthly Vol (MRPV)" value={specData.mrpv} />
                                                    <DataRow label="Power Consump." value={specData.powerConsumption} />
                                                </div>
                                            </div>
                                        </section>

                                        {/* 4. FINISHING OPTIONS (The complex data) */}
                                        <section className="bg-zinc-900 text-white p-6 md:p-8 rounded-2xl shadow-xl">
                                            <SectionHeader icon={<Settings2 size={16} className="text-white" />} title="Advanced Finishing Modules" dark />
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                                                {/* Inner Finisher */}
                                                <div className="space-y-3 border-l border-zinc-700 pl-4">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Inner Finisher</p>
                                                    <p className="text-xs text-zinc-300">{specData.inner || "N/A"}</p>
                                                    <div className="text-xs italic text-zinc-400 leading-relaxed">{specData.stapling_IF}</div>
                                                </div>
                                                {/* Staple Finisher */}
                                                <div className="space-y-3 border-l border-zinc-700 pl-4">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Staple Finisher (External)</p>
                                                    <p className="text-xs text-zinc-300">{specData.paperOutputCapacity_SF || "N/A"}</p>
                                                    <div className="text-xs italic text-zinc-400 leading-relaxed">{specData.stapling_SF}</div>
                                                </div>
                                                {/* Booklet Finisher */}
                                                <div className="space-y-3 border-l border-zinc-700 pl-4">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Booklet Finisher</p>
                                                    <p className="text-xs text-zinc-300">{specData.booklet || "N/A"}</p>
                                                    <div className="text-xs italic text-zinc-400 leading-relaxed">{specData.stapling_BF}</div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* 5. FAX SPECIFICATIONS */}
                                        {specData.modemSpeed_F && (
                                            <section className="border-t border-zinc-100 pt-12">
                                                <SectionHeader icon={<FileText size={16} />} title="Fax Specifications (Optional)" />
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    <DataBox label="Modem Speed" value={specData.modemSpeed_F} light />
                                                    <DataBox label="Compression" value={specData.compressionMethod_F} light />
                                                    <DataBox label="Fax Resolution" value={specData.resolutionDpi_F} light />
                                                    <DataBox label="Fax Memory" value={specData.faxMemory_F} light />
                                                </div>
                                            </section>
                                        )}

                                    </div>
                                ) : (
                                    <div className="h-96 flex items-center justify-center text-zinc-400">Data mismatch or model not found.</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- SUBSIDIARY COMPONENTS FOR CLEANER CODE ---
const ProductCard = ({ product, images, onViewSpecs,  }: ProductCardProps) => {
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImgIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="group">
            <div className="relative aspect-[4/5] bg-[#fcfcfc] border border-zinc-100 mb-6 overflow-hidden rounded-sm">

                {/* Image Display */}
                <div className="absolute inset-0 flex items-center justify-center p-8 transition-transform duration-700">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PrinteImage/view/${images[currentImgIndex]?.id}`}
                        alt={product.name}
                        width={500}
                        height={500}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
                {/* Left/Right Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 backdrop-blur shadow-sm hover:bg-black hover:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 backdrop-blur shadow-sm hover:bg-black hover:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </>
                )}

                {/* Configuration Label (e.g., "With Booklet Finisher") */}
                <div className="absolute top-4 left-4">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded">
                        {images[currentImgIndex]?.label || "Standard"}
                    </span>
                </div>

                {/* Specifications Button */}
                <button
                    onClick={() => onViewSpecs(product.name)}
                    className="absolute bottom-4 left-4 right-4 py-3 bg-white border border-zinc-200 text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all shadow-xl z-10"
                >
                    View Specifications
                </button>
            </div>

            <div className="space-y-2">
                <p className="text-[9px] text-zinc-400 font-mono uppercase">{product.price}</p>
                <h3 className="text-sm font-medium leading-tight">{product.name}</h3>
            </div>
        </div>
    );
};
const SectionHeader = ({
    icon,
    title,
    dark = false,
}: {
    icon: ReactNode;
    title: string;
    dark?: boolean;
}) => (<div className="flex items-center gap-3 mb-6">
    <span className={dark ? "text-white" : "text-zinc-900"}>{icon}</span>
    <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] ${dark ? "text-white" : "text-zinc-900"}`}>{title}</h3>
    <div className={`h-[1px] flex-1 ${dark ? "bg-zinc-700" : "bg-zinc-100"}`} />
</div>
);

const DataBox = ({ label, value, light = false }: { label: string, value?: string, light?: boolean }) => (
    <div className={`${light ? 'bg-zinc-50' : 'bg-white'} border border-zinc-100 p-4 rounded-xl`}>
        <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-1">{label}</p>
        <p className="text-xs font-bold text-zinc-900">{value && value !== "-" ? value : "Not Specified"}</p>
    </div>
);

const DataRow = ({ label, value, isLongText = false }: { label: string, value?: string, isLongText?: boolean }) => (
    <div className="flex flex-col gap-1 border-b border-zinc-50 pb-3">
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide">{label}</span>
        <span className={`text-xs text-zinc-700 leading-relaxed ${isLongText ? 'whitespace-pre-line' : ''}`}>
            {value && value !== "-" ? value : "Standard"}
        </span>
    </div>
);

export default ProductPage;