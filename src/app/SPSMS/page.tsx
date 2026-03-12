"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type DropdownItem = {
  id: number;
  label: string;
  price: number;
  quantity: number;
  damage: string;
  isIncluded: boolean;
};

type FreeGiftItem = {
  id: number;
  label: string;
  price: number;
  quantity: number; // New property for quantity
  isIncluded: boolean;
};

type Note = {
  id: number;
  content: string;
  timestamp: number;
};

type HalfAndHalfItem = {
  id: number;
  label: string;
  price: number;
  quantity: number;
  isIncluded: boolean; // Assuming it might have an include toggle
};

type ExtraItem = {
  id: number;
  label: string;
  price: number;
  quantity: number;
  damage: string;
  isIncluded: boolean;
};

type SubCard = {
  id: number;
  label: string;
  items: DropdownItem[];
  focPrices: Record<string, number>; // New property for FOC prices
  proposedRental?: number; // New property for Proposed Rental
  subCardOverallTotal?: number; // New property for overall total
  extraItems: ExtraItem[]; // New property for extra items
};

type FileCard = {
  name: string;
  subCards: SubCard[];
  id: number;
  months: number; // New property for months
  freeGiftItems: FreeGiftItem[]; // New property for free gift items
  notes: Note[]; // New property for notes
  halfAndHalfItems: HalfAndHalfItem[]; // New property for 一人一半 items
  aValue: number; // New property for user input <a>
  bValue: number; // New property for user input <b>
  cValue: number; // New property for user input <c> (PM1)
  dValue: number; // New property for user input <d> (PM2)
  budget: number; // New property for budget
  approvedPrice: number; // New property for approved price
};

export default function SPSMSPage() {
  const [showModal, setShowModal] = useState(false);
  const [fileName, setFileName] = useState("");
  const [formMonths, setFormMonths] = useState(1); // New state for months input
  const [files, setFiles] = useState<FileCard[]>([]);
  const [damagePercents, setDamagePercents] = useState<Record<number, number>>({});
  const [subCardQuantities, setSubCardQuantities] = useState<{ [key: number]: number }>({});
  const [showDropdown, setShowDropdown] = useState<Record<string, boolean>>({}); // key: `${fileIndex}-${subIndex}-${itemIndex}`
  const [filteredProducts, setFilteredProducts] = useState<Record<string, DropdownItem[]>>({}); // key: `${fileIndex}-${subIndex}-${itemIndex}`

  // New state for Free Gift dropdowns and filtered products
  const [showFreeGiftDropdown, setShowFreeGiftDropdown] = useState<Record<string, boolean>>({}); // key: `${fileIndex}-${subIndex}-${itemIndex}`
  const [filteredFreeGiftProducts, setFilteredFreeGiftProducts] = useState<Record<string, FreeGiftItem[]>>({}); // key: `${fileIndex}-${subIndex}-${itemIndex}`

  // New state for notes modal
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentFileIndexForNotes, setCurrentFileIndexForNotes] = useState<number | null>(null);
  const [currentNoteContent, setCurrentNoteContent] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // New state for Extra Item dropdowns and filtered products
  const [showExtraDropdown, setShowExtraDropdown] = useState<Record<string, boolean>>({}); // key: `${fileIndex}-${subIndex}-${itemIndex}`
  const [filteredExtraProducts, setFilteredExtraProducts] = useState<Record<string, ExtraItem[]>>({}); // key: `${fileIndex}-${subIndex}-${itemIndex}`

  // Handle change
  const handleDamagePercentChange = (subId: number, value: number) => {
    setDamagePercents((prev) => ({
      ...prev,
      [subId]: value >= 0 && value <= 100 ? value : 50, // fallback to 50 if invalid
    }));
  };


  // Predefined product list
  const productList: DropdownItem[] = [
    { id: 1, label: "Apples", price: 5, quantity: 1, damage: "", isIncluded: true },
    { id: 2, label: "Bananas", price: 51930, quantity: 1, damage: "", isIncluded: true },
    { id: 3, label: "Milk", price: 979, quantity: 1, damage: "", isIncluded: true },
    { id: 4, label: "Bread", price: 3741, quantity: 1, damage: "", isIncluded: true },
    { id: 5, label: "Eggs", price: 5987, quantity: 1, damage: "", isIncluded: true },
    { id: 6, label: "canon 1", price: 4914, quantity: 1, damage: "", isIncluded: true },
    { id: 7, label: "canon 2", price: 6, quantity: 1, damage: "", isIncluded: true },
    { id: 8, label: "canon 3", price: 6, quantity: 1, damage: "", isIncluded: true },
    { id: 9, label: "canon 4", price: 6, quantity: 1, damage: "", isIncluded: true },
    { id: 10, label: "canon 5", price: 6, quantity: 1, damage: "", isIncluded: true },
    { id: 11, label: "canon 6", price: 6, quantity: 1, damage: "", isIncluded: true },
    { id: 12, label: "canon 7", price: 6, quantity: 1, damage: "", isIncluded: true },
    { id: 13, label: "canon 8", price: 6, quantity: 1, damage: "", isIncluded: true },
    { id: 14, label: "canon 9", price: 6, quantity: 1, damage: "", isIncluded: true },
  ];

  // Predefined free gift product list (can be the same as productList or different)
  const freeGiftProductList: FreeGiftItem[] = productList.map(item => ({
    id: item.id,
    label: item.label,
    price: item.price, // Retain original price
    quantity: 1, // Default quantity for free gifts
    isIncluded: true,
  }));


  // Predefined Extra Item product list
  const extraProductList: ExtraItem[] = productList.map(item => ({
    id: item.id,
    label: item.label,
    price: item.price,
    quantity: 1,
    damage: "",
    isIncluded: true,
  }));

  const INTEREST_RATES: Record<number, number> = {
    12: 0.10, // 10%
    24: 0.10, // 10%
    36: 0.15, // 15%
    48: 0.20, // 20%
    60: 0.25, // 25%
  };

  // Handle input focus to show dropdown
  const handleInputFocus = (fileIndex: number, subIndex: number, itemIndex: number, currentLabel: string) => {
    const key = `${fileIndex}-${subIndex}-${itemIndex}`;
    setShowDropdown(prev => ({ ...prev, [key]: true }));
    setFilteredProducts(prev => ({
      ...prev, [key]: productList.filter(p =>
        p.label.toLowerCase().includes(currentLabel.toLowerCase())
      )
    }));
  };

  // Handle input blur to hide dropdown after a short delay (to allow click on item)
  const handleInputBlur = (fileIndex: number, subIndex: number, itemIndex: number) => {
    const key = `${fileIndex}-${subIndex}-${itemIndex}`;
    setTimeout(() => {
      setShowDropdown(prev => ({ ...prev, [key]: false }));
    }, 200);
  };

  // Handle product selection from dropdown
  const handleProductSelect = (
    fileIndex: number,
    subIndex: number,
    itemIndex: number,
    product: DropdownItem
  ) => {
    handleItemChange(fileIndex, subIndex, itemIndex, product.label);
    const key = `${fileIndex}-${subIndex}-${itemIndex}`;
    setShowDropdown(prev => ({ ...prev, [key]: false }));
  };

  // New handlers for Free Gift items (now at FileCard level)
  const handleFreeGiftInputFocus = (fileIndex: number, itemIndex: number, currentLabel: string) => {
    const key = `${fileIndex}-freeGift-${itemIndex}`;
    setShowFreeGiftDropdown(prev => ({ ...prev, [key]: true }));
    setFilteredFreeGiftProducts(prev => ({
      ...prev, [key]: freeGiftProductList.filter(p =>
        p.label.toLowerCase().includes(currentLabel.toLowerCase())
      )
    }));
  };

  const handleFreeGiftInputBlur = (fileIndex: number, itemIndex: number) => {
    const key = `${fileIndex}-freeGift-${itemIndex}`;
    setTimeout(() => {
      setShowFreeGiftDropdown(prev => ({ ...prev, [key]: false }));
    }, 200);
  };

  const handleFreeGiftProductSelect = (
    fileIndex: number,
    itemIndex: number,
    product: FreeGiftItem
  ) => {
    const updatedFiles = [...files];
    const currentFreeGiftItem = updatedFiles[fileIndex].freeGiftItems[itemIndex];

    // Update all properties if item is from productList
    updatedFiles[fileIndex].freeGiftItems[itemIndex] = {
      ...product,
      id: currentFreeGiftItem.id, // Preserve existing ID
      quantity: currentFreeGiftItem.quantity, // Keep existing quantity
      isIncluded: true, // Ensure isIncluded is true for products from the list
    };

    setFiles(updatedFiles);
    const key = `${fileIndex}-freeGift-${itemIndex}`;
    setShowFreeGiftDropdown(prev => ({ ...prev, [key]: false }));
  };

  // Handlers for Half and Half items

  // Handlers for Extra Items
  const handleExtraItemInputFocus = (fileIndex: number, subCardIndex: number, itemIndex: number, currentLabel: string) => {
    const key = `${fileIndex}-${subCardIndex}-extraItem-${itemIndex}`;
    setShowExtraDropdown(prev => ({ ...prev, [key]: true }));
    setFilteredExtraProducts(prev => ({
      ...prev, [key]: extraProductList.filter(p =>
        p.label.toLowerCase().includes(currentLabel.toLowerCase())
      )
    }));
  };

  const handleExtraItemInputBlur = (fileIndex: number, subCardIndex: number, itemIndex: number) => {
    const key = `${fileIndex}-${subCardIndex}-extraItem-${itemIndex}`;
    setTimeout(() => {
      setShowExtraDropdown(prev => ({ ...prev, [key]: false }));
    }, 200);
  };

  const handleExtraItemProductSelect = (
    fileIndex: number,
    subCardIndex: number,
    itemIndex: number,
    product: ExtraItem
  ) => {
    handleExtraItemChange(fileIndex, subCardIndex, itemIndex, product.label);
    const key = `${fileIndex}-${subCardIndex}-extraItem-${itemIndex}`;
    setShowExtraDropdown(prev => ({ ...prev, [key]: false }));
  };

  // Handlers for notes modal
  const handleOpenNotesModal = (fileIndex: number) => {
    setCurrentFileIndexForNotes(fileIndex);
    setShowNotesModal(true);
  };

  const handleCloseNotesModal = () => {
    setShowNotesModal(false);
    setCurrentFileIndexForNotes(null);
    setCurrentNoteContent('');
    setEditingNoteId(null);
  };

  const handleAddNote = () => {
    if (currentFileIndexForNotes !== null && currentNoteContent.trim() !== '') {
      const updatedFiles = [...files];
      const newNote: Note = {
        id: Date.now(),
        content: currentNoteContent.trim(),
        timestamp: Date.now(),
      };
      updatedFiles[currentFileIndexForNotes].notes.push(newNote);
      setFiles(updatedFiles);
      setCurrentNoteContent('');
    }
  };

  const handleEditNote = (note: Note) => {
    setCurrentNoteContent(note.content);
    setEditingNoteId(note.id);
  };

  const handleUpdateNote = () => {
    if (currentFileIndexForNotes !== null && editingNoteId !== null && currentNoteContent.trim() !== '') {
      const updatedFiles = [...files];
      const file = updatedFiles[currentFileIndexForNotes];
      const noteIndex = file.notes.findIndex(note => note.id === editingNoteId);
      if (noteIndex !== -1) {
        file.notes[noteIndex] = {
          ...file.notes[noteIndex],
          content: currentNoteContent.trim(),
          timestamp: Date.now(),
        };
        setFiles(updatedFiles);
        setCurrentNoteContent('');
        setEditingNoteId(null);
      }
    }
  };

  const handleDeleteNote = (noteId: number) => {
    if (currentFileIndexForNotes !== null) {
      const updatedFiles = [...files];
      updatedFiles[currentFileIndexForNotes].notes = updatedFiles[currentFileIndexForNotes].notes.filter(note => note.id !== noteId);
      setFiles(updatedFiles);
      setCurrentNoteContent('');
      setEditingNoteId(null);
    }
  };

  // Create a new form card
  const handleCreateFile = () => {
    if (fileName.trim() !== "") {
      setFiles([...files, { name: fileName, subCards: [], id: Date.now(), months: formMonths, freeGiftItems: [], notes: [], halfAndHalfItems: [], aValue: 0, bValue: 0, cValue: 0, dValue: 0, budget: 0, approvedPrice: 0 }]);
      setFileName("");
      setFormMonths(1); // Reset months after creation
      setShowModal(false);
    }
  };

  // Handle months change on FileCard
  const handleMonthsChange = (fileIndex: number, newMonths: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].months = newMonths;
    setFiles(updatedFiles);
  };

  // Add sub-card to a specific file
  const handleAddSubCard = (fileIndex: number) => {
    const updatedFiles = [...files];
    const newSubCard: SubCard = {
      id: Date.now() + Math.random(), // Enhanced uniqueness
      label: `Section ${updatedFiles[fileIndex].subCards.length + 1}`,
      items: [],
      focPrices: {}, // Initialize focPrices
      proposedRental: 0, // Initialize proposedRental
      extraItems: [], // Initialize extraItems
    };
    updatedFiles[fileIndex].subCards.push(newSubCard);
    setFiles(updatedFiles);
  };

  // Remove sub-card
  const handleRemoveSubCard = (fileIndex: number, subCardId: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards = updatedFiles[fileIndex].subCards.filter(
      (sub) => sub.id !== subCardId
    );
    setFiles(updatedFiles);
  };

  // Handle FOC price change for a specific sub-card
  const handleFocPriceChange = (
    fileIndex: number,
    subCardIndex: number,
    tier: string,
    newPrice: number
  ) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards[subCardIndex].focPrices = {
      ...updatedFiles[fileIndex].subCards[subCardIndex].focPrices,
      [tier]: newPrice,
    };
    setFiles(updatedFiles);
  };

  // Handle Proposed Rental change for a specific sub-card
  const handleProposedRentalChange = (
    fileIndex: number,
    subCardIndex: number,
    newRental: number
  ) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards[subCardIndex].proposedRental = newRental;
    setFiles(updatedFiles);
  };

  // Handle item change (dropdown selection)
  const handleItemChange = (
    fileIndex: number,
    subCardIndex: number,
    itemIndex: number,
    newLabel: string
  ) => {
    const updatedFiles = [...files];
    const key = `${fileIndex}-${subCardIndex}-${itemIndex}`;

    // Update the label of the current item
    updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex].label = newLabel;

    // Filter products based on the new label
    setFilteredProducts(prev => ({
      ...prev,
      [key]: productList.filter(p =>
        p.label.toLowerCase().includes(newLabel.toLowerCase())
      )
    }));

    const selectedProductFromList = productList.find(
      (p) => p.label === newLabel
    );

    if (selectedProductFromList) {
      // Update all properties if item is from productList
      updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex] = {
        ...selectedProductFromList,
        id: updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex].id, // Preserve existing ID
        quantity: updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex].quantity, // Keep existing quantity
        damage: updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex].damage, // Keep existing damage
        isIncluded: true, // Ensure isIncluded is true for products from the list
      };
    } else {
      // Only update label if it's a custom input (not in productList)
      updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex].label = newLabel;
      updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex].price = 0; // Reset price for custom items
      updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex].isIncluded = false; // Ensure isIncluded is false for custom items
    }
    setFiles(updatedFiles);
  };

  // Handle free gift item change (dropdown selection, now at FileCard level)
  const handleFreeGiftItemChange = (
    fileIndex: number,
    itemIndex: number,
    newLabel: string
  ) => {
    const updatedFiles = [...files];
    const key = `${fileIndex}-freeGift-${itemIndex}`;

    // Update the label of the current free gift item
    updatedFiles[fileIndex].freeGiftItems[itemIndex].label = newLabel;

    // Filter products based on the new label
    setFilteredFreeGiftProducts(prev => ({
      ...prev,
      [key]: freeGiftProductList.filter(p =>
        p.label.toLowerCase().includes(newLabel.toLowerCase())
      )
    }));

    const selectedProductFromList = freeGiftProductList.find(
      (p) => p.label === newLabel
    );

    if (selectedProductFromList) {
      // Update all properties if item is from productList
      updatedFiles[fileIndex].freeGiftItems[itemIndex] = {
        ...selectedProductFromList,
        id: updatedFiles[fileIndex].freeGiftItems[itemIndex].id, // Preserve existing ID
        quantity: updatedFiles[fileIndex].freeGiftItems[itemIndex].quantity, // Keep existing quantity
        isIncluded: true, // Ensure isIncluded is true for products from the list
      };
    } else {
      // Only update label if it's a custom input (not in productList)
      updatedFiles[fileIndex].freeGiftItems[itemIndex].label = newLabel;
      updatedFiles[fileIndex].freeGiftItems[itemIndex].price = 0; // Reset price for custom items
      updatedFiles[fileIndex].freeGiftItems[itemIndex].isIncluded = false; // Ensure isIncluded is false for custom items
    }
    setFiles(updatedFiles);
  };
  // Handle extra item change (dropdown selection)
  const handleExtraItemChange = (
    fileIndex: number,
    subCardIndex: number,
    itemIndex: number,
    newLabel: string
  ) => {
    const updatedFiles = [...files];
    const key = `${fileIndex}-${subCardIndex}-extraItem-${itemIndex}`;

    // Update the label of the current item
    updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].label = newLabel;

    // Filter products based on the new label
    setFilteredExtraProducts(prev => ({
      ...prev,
      [key]: extraProductList.filter(p =>
        p.label.toLowerCase().includes(newLabel.toLowerCase())
      )
    }));

    const selectedProductFromList = extraProductList.find(
      (p) => p.label === newLabel
    );

    if (selectedProductFromList) {
      // Update all properties if item is from productList
      updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex] = {
        ...selectedProductFromList,
        id: updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].id, // Preserve existing ID
        quantity: updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].quantity, // Keep existing quantity
        damage: updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].damage, // Keep existing damage
        isIncluded: true, // Ensure isIncluded is true for products from the list
      };
    } else {
      // Only update label if it's a custom input (not in productList)
      updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].label = newLabel;
      updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].price = 0; // Reset price for custom items
      updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].isIncluded = false; // Ensure isIncluded is false for custom items
    }
    setFiles(updatedFiles);
  };


  // Handle remove dropdown item
  const handleRemoveDropdownItem = (
    fileIndex: number,
    subCardIndex: number,
    itemId: number
  ) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards[subCardIndex].items = updatedFiles[
      fileIndex
    ].subCards[subCardIndex].items.filter((item) => item.id !== itemId);
    setFiles(updatedFiles);
  };

  // Handle remove free gift item (now at FileCard level)
  const handleRemoveFreeGiftItem = (
    fileIndex: number,
    itemId: number
  ) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].freeGiftItems = updatedFiles[
      fileIndex
    ].freeGiftItems.filter((item) => item.id !== itemId);
    setFiles(updatedFiles);
  };

  // Handle remove extra item
  const handleRemoveExtraItem = (
    fileIndex: number,
    subCardIndex: number,
    itemId: number
  ) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards[subCardIndex].extraItems = updatedFiles[
      fileIndex
    ].subCards[subCardIndex].extraItems.filter((item) => item.id !== itemId);
    setFiles(updatedFiles);
  };

  // Add a new blank item to a sub-card
  const handleAddBlankItem = (fileIndex: number, subCardIndex: number) => {
    const updatedFiles = [...files];
    const currentSubCardQuantity = subCardQuantities[updatedFiles[fileIndex].subCards[subCardIndex].id] || 1;
    updatedFiles[fileIndex].subCards[subCardIndex].items.push({
      id: Date.now() + Math.random(),
      label: "",
      price: 0,
      quantity: currentSubCardQuantity,
      damage: "",
      isIncluded: false,
    });
    setFiles(updatedFiles);
  };

  // Add a new blank free gift item to a FileCard
  const handleAddBlankFreeGiftItem = (fileIndex: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].freeGiftItems.push({
      id: Date.now() + Math.random(),
      label: "",
      price: 0,
      quantity: 1, // Initialize quantity for new free gift items
      isIncluded: true,
    });
    setFiles(updatedFiles);
  };

  // Add a new blank extra item to a sub-card
  const handleAddBlankExtraItem = (fileIndex: number, subCardIndex: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards[subCardIndex].extraItems.push({
      id: Date.now() + Math.random(),
      label: "",
      price: 0,
      quantity: 1,
      damage: "",
      isIncluded: false,
    });
    setFiles(updatedFiles);
  };

  // Handle include toggle for an item
  const handleIncludeToggle = (fileIndex: number, subCardIndex: number, itemIndex: number) => {
    const updatedFiles = [...files];
    const currentItem = updatedFiles[fileIndex].subCards[subCardIndex].items[itemIndex];
    currentItem.isIncluded = !currentItem.isIncluded;
    // Re-sort items: included items first, then not included
    updatedFiles[fileIndex].subCards[subCardIndex].items.sort((a, b) => {
      if (a.isIncluded && !b.isIncluded) return -1;
      if (!a.isIncluded && b.isIncluded) return 1;
      return 0;
    });
    setFiles(updatedFiles);
  };

  // Helper to calculate total price of items in a sub-card
  const calculateSubCardTotalPrice = (subCard: SubCard) => {
    return subCard.items.reduce((total, item) => total + (item.isIncluded ? item.price : 0), 0);
  };

  // Helper to calculate total price of NOT included items in a sub-card
  const calculateSubCardNotIncludedTotalPrice = (subCard: SubCard) => {
    return subCard.items.reduce((total, item) => total + (!item.isIncluded ? item.price : 0), 0);
  };

  // Helper to calculate total price of free gift items
  const calculateFreeGiftTotalPrice = (freeGiftItems: FreeGiftItem[]) => {
    return freeGiftItems.reduce((total, item) => total + (item.isIncluded ? item.price * item.quantity : 0), 0);
  };

  // Helper to calculate total price of extra items
  const calculateExtraItemsTotalPrice = (extraItems: ExtraItem[]) => {
    return extraItems.reduce((total, item) => total + (item.isIncluded ? item.price * item.quantity : 0), 0);
  };

  // Helper to calculate tier prices
  const calculateTierPrice = (total: number, months: number, tier: string, focPrices: Record<string, number>): number => {
    const interest = INTEREST_RATES[months] || 0; // Default to 0 if months not found
    const focTotal = (focPrices["FOC BW"] || 0) + (focPrices["FOC CL"] || 0);
    switch (tier) {
      case "Tier 1":
        return (total + focTotal) / months / 0.85 * (1 + interest);
      case "Tier 2":
        return (total + focTotal) / months;
      case "Tier 3":
        return (total + focTotal) / (months + 6);
      case "Tier 4":
        return (total + focTotal) / (months + 12);
      case "Tier 5":
        return (total + focTotal) / (months + 18);
      default:
        return 0;
    }
  };

  // Handle sub-card quantity change
  const handleSubCardQuantityChange = (fileIndex: number, subCardIndex: number, newQuantity: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards[subCardIndex].items.forEach(item => {
      item.quantity = newQuantity;
    });
    setFiles(updatedFiles);
    setSubCardQuantities(prev => ({
      ...prev,
      [updatedFiles[fileIndex].subCards[subCardIndex].id]: newQuantity
    }));
  };

  // Handle free gift quantity change
  const handleFreeGiftQuantityChange = (fileIndex: number, itemIndex: number, newQuantity: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].freeGiftItems[itemIndex].quantity = newQuantity;
    setFiles(updatedFiles);
  };

  // Handle extra item quantity change
  const handleExtraItemQuantityChange = (fileIndex: number, subCardIndex: number, itemIndex: number, newQuantity: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].subCards[subCardIndex].extraItems[itemIndex].quantity = newQuantity;
    setFiles(updatedFiles);
  };

  // Handle A value change for Half and Half table
  const handleAValueChange = (fileIndex: number, newValue: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].aValue = newValue;
    setFiles(updatedFiles);
  };

  // Handle B value change for Half and Half table
  const handleBValueChange = (fileIndex: number, newValue: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].bValue = newValue;
    setFiles(updatedFiles);
  };

  // Handle C value change for Half and Half table
  const handleCValueChange = (fileIndex: number, newValue: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].cValue = newValue;
    setFiles(updatedFiles);
  };

  // Handle D value change for Half and Half table
  const handleDValueChange = (fileIndex: number, newValue: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].dValue = newValue;
    setFiles(updatedFiles);
  };

  // Handle Budget change on FileCard
  const handleBudgetChange = (fileIndex: number, newBudget: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].budget = newBudget;
    setFiles(updatedFiles);
  };

  // Handle Approved Price change on FileCard
  const handleApprovedPriceChange = (fileIndex: number, newValue: number) => {
    const updatedFiles = [...files];
    updatedFiles[fileIndex].approvedPrice = newValue;
    setFiles(updatedFiles);
  };

  // Helper to format currency
  const formatCurrency = (amount: number): string => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper to calculate E value
  const calculateEValue = (file: FileCard): number => {
    return file.cValue * file.aValue * file.months;
  };

  // Helper to calculate F value
  const calculateFValue = (file: FileCard): number => {
    return file.dValue * file.bValue * file.months;
  };

  // Helper to calculate E/months value
  const calculateEMonthsValue = (file: FileCard): number => {
    return calculateEValue(file) / file.months;
  };

  // Helper to calculate F/months value
  const calculateFMonthsValue = (file: FileCard): number => {
    return calculateFValue(file) / file.months;
  };

  // Helper to calculate G value (E + F)
  const calculateGValue = (file: FileCard): number => {
    return calculateEValue(file) + calculateFValue(file);
  };

  // Helper to calculate G/months value
  const calculateGMonthsValue = (file: FileCard): number => {
    return calculateGValue(file) / file.months;
  };

  // Helper to calculate H value (Sum of all proposed rentals)
  const calculateHValue = (file: FileCard): number => {
    return file.subCards.reduce((total, subCard) => {
      const subCardQuantity = subCardQuantities[subCard.id] || 0;
      const proposedRentalValue = subCard.proposedRental || 0;
      return total + (proposedRentalValue * subCardQuantity * file.months);
    }, 0);
  };

  // Helper to calculate Submission Price (G + H)
  const calculateSubmissionPrice = (file: FileCard): number => {
    return calculateGValue(file) + calculateHValue(file);
  };

  // Helper to calculate (Submission Price / Budget) - 100%
  const calculateSubmissionBudgetPercentage = (file: FileCard): number => {
    if (file.budget === 0) {
      return 0; // Avoid division by zero
    }
    return ((calculateSubmissionPrice(file) / file.budget) - 1) * 100;
  };

  // Helper to calculate total Toner Cost (sum of all not included items price * quantity across all sub-cards)
  const calculateTonerCost = (file: FileCard): number => {
    return file.subCards.reduce((totalFileTonerCost, subCard) => {
      const subCardTonerCost = subCard.items.reduce((totalSubCardTonerCost, item) => {
        return totalSubCardTonerCost + (!item.isIncluded ? (item.price * item.quantity) : 0);
      }, 0);
      return totalFileTonerCost + subCardTonerCost;
    }, 0);
  };

  // Helper to calculate Cost Price
  const calculateCostPrice = (file: FileCard): number => {
    let totalTier2Price = 0;
    let totalFocBw = 0;
    let totalFocCl = 0;
    let totalExtraItems = 0;

    file.subCards.forEach(subCard => {
      const subCardQuantity = subCardQuantities[subCard.id] || 0;
      const tier2Price = calculateTierPrice(subCard.subCardOverallTotal || 0, file.months, "Tier 2", subCard.focPrices);
      totalTier2Price += (tier2Price * file.months * subCardQuantity);
      totalFocBw += (subCard.focPrices["FOC BW"] || 0);
      totalFocCl += (subCard.focPrices["FOC CL"] || 0);
      totalExtraItems += calculateExtraItemsTotalPrice(subCard.extraItems); // Sum extra items per subcard
    });

    return totalTier2Price + totalFocBw + totalFocCl + totalExtraItems + 14000;
  };

  // Helper to calculate Upfront Loss / Revenue
  const calculateUpfrontLossRevenue = (file: FileCard): number => {
    const cost = calculateCostPrice(file);
    const totalHardware = calculateHValue(file);
    return cost - totalHardware;
  };

  // Helper to calculate Percentage
  const calculatePercentage = (file: FileCard): number => {
    const upfrontLossRevenue = calculateUpfrontLossRevenue(file);
    const totalMeterValue = calculateGValue(file);

    if (totalMeterValue === 0) {
      return 0; // Avoid division by zero
    }

    return (upfrontLossRevenue / totalMeterValue) * 100;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-10">
        <h2 className="text-3xl font-bold text-gray-700 mb-6">SPSMS Dashboard</h2>

        <div className="bg-white shadow-md rounded-xl p-6 mb-6 text-gray-500">
          {/* Top row: search + button */}
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Search..."
              className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white font-semibold px-4 py-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Form
            </button>
          </div>

          <hr className="border-t border-gray-300 mb-4" />

          {/* Content area */}
          <div>
            {files.length === 0 ? (
              <div className="flex items-center justify-center">
                <p className="text-gray-300"> No Form Available</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pr-2">
                {files.map((file, fileIndex) => (
                  <div
                    key={file.id}
                    className="bg-gray-50 border rounded-2xl shadow-md p-6 "
                  >
                    Months:  <input
                      type="number"
                      value={file.months}
                      onChange={(e) => handleMonthsChange(fileIndex, parseInt(e.target.value) || 1)}
                      min="1"
                      className="text-sm text-gray-500 w-20 px-1 py-0.5 border border-gray-300 rounded-md"
                    />
                    Budget:  RM<input
                      type="number"
                      value={file.budget}
                      onChange={(e) => handleBudgetChange(fileIndex, parseFloat(e.target.value) || 0)}
                      min="0"
                      className="text-sm text-gray-500 w-32 px-1 py-0.5 border border-gray-300 rounded-md ml-4"
                    />
                    <button
                      onClick={() => handleOpenNotesModal(fileIndex)}
                      className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                    >
                      Notes ({file.notes.length})
                    </button>
                    {/* File title */}
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 flex items-center justify-center">
                      {file.name}
                    </h3>
                    {/* Display notes directly */}
                    {file.notes.length > 0 && (
                      <div className="mt-4 mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="font-semibold text-blue-800 mb-2">Notes:</p>
                        <ul className="list-disc list-inside text-sm text-blue-700">
                          {file.notes.map((note) => (
                            <li key={note.id} className="mb-1">
                              {note.content}
                              <span className="text-xs text-blue-500 ml-2">({new Date(note.timestamp).toLocaleDateString()})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Sub-cards + Add button */}
                    <div className="flex flex-wrap gap-4">
                      {file.subCards.map((sub, subIndex) => (
                        <div
                          key={sub.id}
                          className="relative bg-white border rounded-lg shadow px-6 py-4 min-h-[900px] w-[650px] flex flex-col"
                        >
                          <p className="text-gray-700 font-medium mb-2">
                            {sub.label}
                          </p>

                          {/* Remove sub-card button */}
                          <button
                            onClick={() => handleRemoveSubCard(fileIndex, sub.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full hover:bg-red-600"
                          >
                            ✕
                          </button>

                          {/* Dropdown items list */}
                          <div className="flex-1 overflow-y-auto space-y-1 text-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Include</th><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>{/* For remove button */}</tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sub.items.map((item, itemIndex) => (
                                  <tr key={item.id}><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {/* Item Dropdown */}
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={item.label} // This will be the displayed value
                                        onChange={(e) => {
                                          handleItemChange(fileIndex, subIndex, itemIndex, e.target.value);
                                        }}
                                        onFocus={(e) => handleInputFocus(fileIndex, subIndex, itemIndex, e.target.value)}
                                        onBlur={() => handleInputBlur(fileIndex, subIndex, itemIndex)}
                                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Search product..."
                                      />
                                      {showDropdown[`${fileIndex}-${subIndex}-${itemIndex}`] && filteredProducts[`${fileIndex}-${subIndex}-${itemIndex}`] && (filteredProducts[`${fileIndex}-${subIndex}-${itemIndex}`].length > 0) && (
                                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto mt-1">
                                          {filteredProducts[`${fileIndex}-${subIndex}-${itemIndex}`].map((productOpt) => (
                                            <li
                                              key={productOpt.id}
                                              onClick={() => handleProductSelect(fileIndex, subIndex, itemIndex, productOpt)}
                                              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                            >
                                              {productOpt.label}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  </td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {formatCurrency(item.price)}
                                    </td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <button
                                        onClick={() => handleIncludeToggle(fileIndex, subIndex, itemIndex)}
                                        className={`w-4 h-4 rounded-full ${item.isIncluded ? "bg-green-500" : "bg-red-500"} flex items-center justify-center`}
                                      >
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </button>
                                    </td><td className="px-2 py-2 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() =>
                                          handleRemoveDropdownItem(fileIndex, subIndex, item.id)
                                        }
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Remove
                                      </button>

                                    </td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Damage and Quantity Summary */}
                          <div className="mt-15">
                            <div className="mt-1 flex justify-between items-center">
                              {/* Damage % */}
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-700 font-medium">
                                  Damage ({damagePercents[sub.id] ?? 50}%):
                                </span>
                                <span className="text-red-600 font-semibold">
                                  {formatCurrency(
                                    calculateSubCardTotalPrice(sub) *
                                    ((damagePercents[sub.id] ?? 50) / 100)
                                  )}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={damagePercents[sub.id] ?? 50}
                                  onChange={(e) =>
                                    handleDamagePercentChange(sub.id, parseInt(e.target.value))
                                  }
                                  className="block w-16 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>

                              {/* Quantity */}
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-700 font-medium">Quantity:</span>
                                <input
                                  type="number"
                                  value={subCardQuantities[sub.id] || 1}
                                  onChange={(e) =>
                                    handleSubCardQuantityChange(
                                      fileIndex,
                                      subIndex,
                                      parseInt(e.target.value)
                                    )
                                  }
                                  min="1"
                                  className="block w-20 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>


                          {/* Add item button */}
                          <button
                            onClick={() => handleAddBlankItem(fileIndex, subIndex)}
                            className="mt-2 w-full py-1 text-sm bg-blue-100 text-blue-600 rounded-lg border border-blue-400 hover:bg-blue-200"
                          >
                            + Add Item
                          </button>
                          <hr className="mt-5 border-gray-200" />
                          {/* Calculate subCardOverallTotal */}
                          {(() => {
                            const subCardTotalIncludedPrice = calculateSubCardTotalPrice(sub);
                            const subCardDamagePercent = damagePercents[sub.id] ?? 50;
                            const totalDamageCost = subCardTotalIncludedPrice * (subCardDamagePercent / 100);
                            const totalNotIncludedCost = calculateSubCardNotIncludedTotalPrice(sub);
                            // Define subCardOverallTotal outside to be accessible by table rows
                            sub.subCardOverallTotal = totalDamageCost + totalNotIncludedCost;
                            return (
                              <p className="mt-2 text-right font-bold">Total : {formatCurrency(sub.subCardOverallTotal || 0)}</p>
                            );
                          })()}
                          <table>
                            <thead className="bg-gray-50">
                              <tr><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th><th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th></tr>
                            </thead>
                            <tbody>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Tier 1</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 1", sub.focPrices))}</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(((subCardQuantities[sub.id] || 0) * calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 1", sub.focPrices) * file.months))}</td></tr>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Tier 2</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 2", sub.focPrices))}</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency((calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 2", sub.focPrices) * file.months * (subCardQuantities[sub.id] || 0)))}</td></tr>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Tier 3</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 3", sub.focPrices))}</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency((calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 3", sub.focPrices) * file.months * (subCardQuantities[sub.id] || 0)))}</td></tr>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Tier 4</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 4", sub.focPrices))}</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency((calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 4", sub.focPrices) * file.months * (subCardQuantities[sub.id] || 0)))}</td></tr>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Tier 5</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 5", sub.focPrices))}</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency((calculateTierPrice(sub.subCardOverallTotal || 0, file.months, "Tier 5", sub.focPrices) * file.months * (subCardQuantities[sub.id] || 0)))}</td></tr>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">FOC BW</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                <input
                                  type="number"
                                  value={sub.focPrices["FOC BW"] || 0}
                                  onChange={(e) => handleFocPriceChange(fileIndex, subIndex, "FOC BW", parseFloat(e.target.value) || 0)}
                                  className="block w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  min="0"
                                /></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(sub.focPrices["FOC BW"] || 0)}</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(sub.focPrices["FOC BW"] || 0)}</td></tr>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">FOC CL</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                <input
                                  type="number"
                                  value={sub.focPrices["FOC CL"] || 0}
                                  onChange={(e) => handleFocPriceChange(fileIndex, subIndex, "FOC CL", parseFloat(e.target.value) || 0)}
                                  className="block w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  min="0"
                                /></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(sub.focPrices["FOC CL"] || 0)}</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(sub.focPrices["FOC CL"] || 0)}</td></tr>
                              <tr><td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Proposed Rental</td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"></td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                <input
                                  type="number"
                                  value={sub.proposedRental || 0}
                                  onChange={(e) => handleProposedRentalChange(fileIndex, subIndex, parseFloat(e.target.value) || 0)}
                                  className="block w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  min="0"
                                />
                              </td><td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(((sub.proposedRental || 0) * (subCardQuantities[sub.id] || 0) * file.months))}</td></tr>
                            </tbody>
                          </table>

                          {/* Extra Items Section */}
                          <div className="mt-4">
                            <p className="text-gray-700 font-medium mb-2">Extra Items</p>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>{/* For remove button */}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sub.extraItems.map((item, itemIndex) => (
                                  <tr key={item.id}>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {/* Item Dropdown */}
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={item.label}
                                          onChange={(e) => {
                                            handleExtraItemChange(fileIndex, subIndex, itemIndex, e.target.value);
                                          }}
                                          onFocus={(e) => handleExtraItemInputFocus(fileIndex, subIndex, itemIndex, e.target.value)}
                                          onBlur={() => handleExtraItemInputBlur(fileIndex, subIndex, itemIndex)}
                                          className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Search extra item..."
                                        />
                                        {showExtraDropdown[`${fileIndex}-${subIndex}-extraItem-${itemIndex}`] && filteredExtraProducts[`${fileIndex}-${subIndex}-extraItem-${itemIndex}`] && (filteredExtraProducts[`${fileIndex}-${subIndex}-extraItem-${itemIndex}`].length > 0) && (
                                          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {filteredExtraProducts[`${fileIndex}-${subIndex}-extraItem-${itemIndex}`].map((productOpt) => (
                                              <li
                                                key={productOpt.id}
                                                onClick={() => handleExtraItemProductSelect(fileIndex, subIndex, itemIndex, productOpt)}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                              >
                                                {productOpt.label}
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {formatCurrency(item.price)}
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleExtraItemQuantityChange(fileIndex, subIndex, itemIndex, parseInt(e.target.value) || 1)
                                        }
                                        min="1"
                                        className="block w-16 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {formatCurrency(item.price * item.quantity)}
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() => handleRemoveExtraItem(fileIndex, subIndex, item.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {/* Total: {formatCurrency(calculateExtraItemsTotalPrice(sub.extraItems))} */}
                            <button
                              onClick={() => handleAddBlankExtraItem(fileIndex, subIndex)}
                              className="mt-2 w-full py-1 text-sm bg-blue-100 text-blue-600 rounded-lg border border-blue-400 hover:bg-blue-200"
                            >
                              + Add Extra Item
                            </button>
                          </div>

                          {/* Remove sub-card button */}
                          <button
                            onClick={() => handleRemoveSubCard(fileIndex, sub.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Add sub-card button */}
                      <button
                        onClick={() => handleAddSubCard(fileIndex)}
                        className="px-6 py-4 bg-blue-100 text-blue-600 font-semibold rounded-lg border-2 border-dashed border-blue-400 hover:bg-blue-200 h-80 w-64"
                      >
                        + Add
                      </button>
                    </div>


                    {/* Tables Container */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      {/* Half and Half Items Table */}
                      <div className="flex-1 p-4 border rounded-lg shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={2}>Meter Reading</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B/W</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <span className="mr-1">RM</span>
                                  <input
                                    type="number"
                                    value={file.aValue}
                                    onChange={(e) => handleAValueChange(fileIndex, parseFloat(e.target.value) || 0)}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                  />
                                </div>
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <span className="mr-1">RM</span>
                                  <input
                                    type="number"
                                    value={file.bValue}
                                    onChange={(e) => handleBValueChange(fileIndex, parseFloat(e.target.value) || 0)}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                  />
                                </div>
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposed Meter</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Meter</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Meter</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  <span className="mr-1">RM</span>
                                  <input
                                    type="number"
                                    value={file.cValue}
                                    onChange={(e) => handleCValueChange(fileIndex, parseFloat(e.target.value) || 0)}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                  />
                                </div>
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(file.aValue)}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateEValue(file))}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateEMonthsValue(file))}</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  <span className="mr-1">RM</span>
                                  <input
                                    type="number"
                                    value={file.dValue}
                                    onChange={(e) => handleDValueChange(fileIndex, parseFloat(e.target.value) || 0)}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                  />
                                </div>
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(file.bValue)}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateFValue(file))}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateFMonthsValue(file))}</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900"></td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">Total Meter</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateGValue(file))}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateGMonthsValue(file))}</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900"></td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">Total Hardware</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateHValue(file))}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500"></td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900"></td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">Submission Price</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateSubmissionPrice(file))}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{calculateSubmissionBudgetPercentage(file).toFixed(2)}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="flex-1 p-4 border rounded-lg shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation Field</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Toner Cost</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateTonerCost(file))}</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Approved Price</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className="mr-1">RM</span>
                                  <input
                                    type="number"
                                    value={file.approvedPrice}
                                    onChange={(e) => handleApprovedPriceChange(fileIndex, parseFloat(e.target.value) || 0)}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Cost</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateCostPrice(file))}</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Upfront Loss / Revenue</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calculateUpfrontLossRevenue(file))}</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">%</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{calculatePercentage(file).toFixed(2)}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Free Gift Items Table */}
                      <div className="flex-1 p-4 border rounded-lg shadow-sm bg-white">
                        <p className="text-gray-700 font-medium mb-2">Free Gift Items</p>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>{/* For remove button */}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {file.freeGiftItems.map((item, itemIndex) => (
                              <tr key={item.id}>
                                <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {/* Item Dropdown */}
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={item.label}
                                      onChange={(e) => {
                                        handleFreeGiftItemChange(fileIndex, itemIndex, e.target.value);
                                      }}
                                      onFocus={(e) => handleFreeGiftInputFocus(fileIndex, itemIndex, e.target.value)}
                                      onBlur={() => handleFreeGiftInputBlur(fileIndex, itemIndex)}
                                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Search free gift..."
                                    />
                                    {showFreeGiftDropdown[`${fileIndex}-freeGift-${itemIndex}`] && filteredFreeGiftProducts[`${fileIndex}-freeGift-${itemIndex}`] && (filteredFreeGiftProducts[`${fileIndex}-freeGift-${itemIndex}`].length > 0) && (
                                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                                        {filteredFreeGiftProducts[`${fileIndex}-freeGift-${itemIndex}`].map((productOpt) => (
                                          <li
                                            key={productOpt.id}
                                            onClick={() => handleFreeGiftProductSelect(fileIndex, itemIndex, productOpt)}
                                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                          >
                                            {productOpt.label}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(item.price)}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleFreeGiftQuantityChange(fileIndex, itemIndex, parseInt(e.target.value) || 1)
                                    }
                                    min="1"
                                    className="block w-16 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(item.price * item.quantity)}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleRemoveFreeGiftItem(fileIndex, item.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-2 text-right font-bold">
                          Total: {formatCurrency(calculateFreeGiftTotalPrice(file.freeGiftItems))}
                        </div>
                        <button
                          onClick={() => handleAddBlankFreeGiftItem(fileIndex)}
                          className="mt-2 w-full py-1 text-sm bg-blue-100 text-blue-600 rounded-lg border border-blue-400 hover:bg-blue-200"
                        >
                          + Add Free Gift Item
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-gray-500">
              <h2 className="text-xl font-bold text-gray-700 mb-4">
                Add New Form
              </h2>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter form name"
                className="w-full px-4 py-2 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <input
                type="number"
                value={formMonths}
                onChange={(e) => setFormMonths(parseInt(e.target.value) || 1)}
                placeholder="Enter number of months"
                min="1"
                className="w-full px-4 py-2 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && currentFileIndexForNotes !== null && (
          <div
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-gray-500">
              <h2 className="text-xl font-bold text-gray-700 mb-4">
                Notes for {files[currentFileIndexForNotes]?.name}
              </h2>
              <div className="space-y-4">
                {files[currentFileIndexForNotes]?.notes.map((note) => (
                  <div key={note.id} className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-800 mb-1">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-500 text-right">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </p>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="text-blue-600 hover:text-blue-800 text-xs mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                value={currentNoteContent}
                onChange={(e) => setCurrentNoteContent(e.target.value)}
                placeholder="Add a new note..."
                className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={handleCloseNotesModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                {editingNoteId !== null ? (
                  <button
                    onClick={handleUpdateNote}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    Update Note
                  </button>
                ) : (
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    Add Note
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute> 
  );
}