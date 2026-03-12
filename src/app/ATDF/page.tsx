"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ToastProvider"; // Make sure ToastProvider is wrapped in layout
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import ProtectedRoute from "@/components/ProtectedRoute";

const highlightText = (text: string, keyword: string) => {
  if (!keyword) return text;

  // Escape special characters in the keyword to prevent regex errors
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <span key={i} className="bg-yellow-200">{part}</span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};

// Define a proper type for your QA
interface QAItem {
  id: number;
  question: string;
  answer: string;
}

interface NewQAItem {
  id: string;
  question: string;
  answer: string;
  selectedTable: string;
}

export default function ATDF() {
  const addToast = useToast(); // <-- use the toast hook
  const hasShownSuccess = React.useRef(false); // <-- add this
  const { user } = useAuth(); // Get user from AuthContext
  const isAdmin = user?.role === 'admin'; // Determine if user is admin

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<QAItem[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState("ATP"); // default table
  const tables = ["ATP", "ASN", "SKY", "ARENA", "ATPLAN"];
  const [isAskingGPT, setIsAskingGPT] = useState(false); // New state for managing GPT button clicks

  const [newQAs, setNewQAs] = useState<NewQAItem[]>([]); // Initialize newQAs state

  // State for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQAId, setEditingQAId] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");

  const newQuestionRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Ensure dark mode is off when this component mounts
    document.documentElement.classList.remove('dark');
  }, []);

  const switchTable = (direction: number) => {
    const currentIndex = tables.indexOf(selectedTable);
    const nextIndex = (currentIndex + direction + tables.length) % tables.length;
    setSelectedTable(tables[nextIndex]);
  };

  const fetchData = useCallback(async (searchKeyword: string) => {
    let apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/qna/${selectedTable}`;

    if (searchKeyword.trim() !== "") {
      apiUrl += `/search?keyword=${encodeURIComponent(searchKeyword)}`;
    } else {
      apiUrl += `/GET`;
    }

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data: QAItem[] = await response.json();
      setResults(data);

      // ✅ Show success only once
      if (!hasShownSuccess.current) {
        addToast("Data fetched successfully!", "success");
        hasShownSuccess.current = true;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error(error);
      addToast("Error fetching data: " + error.message, "error");
    }
  }, [selectedTable, addToast]);


  // ----------------------------------------------------------------------
  // 🚀 MODIFIED: useEffect now watches 'keyword' and uses a debounce
  // ----------------------------------------------------------------------
  useEffect(() => {
    // Debounce the fetch to avoid spamming the API while the user is typing
    const handler = setTimeout(() => {
      fetchData(keyword); // Pass the current keyword to fetchData
    }, 300); // 300ms delay

    // Cleanup function to clear the timeout if keyword changes before the delay is over
    return () => {
      clearTimeout(handler);
    };
  }, [fetchData, keyword]); // Now depends on 'fetchData' (which depends on selectedTable) and 'keyword'

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'q') {
        event.preventDefault();
        setShowImportModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  useEffect(() => {
    if (showImportModal) {
      setNewQAs([{ id: Date.now().toString(), question: "", answer: "", selectedTable: selectedTable }]); // Initialize with one empty QA
      newQuestionRef.current?.focus();
    }
  }, [showImportModal, selectedTable]);

  const handleCopy = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => addToast("Copied to clipboard!"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    addToast("Copied to clipboard!");
  };

  // ----------------------------------------------------------------------
  // 🛑 REMOVED: Client-side filtering logic is no longer needed
  // ----------------------------------------------------------------------
  // const filteredResults = results.filter(
  //   (item) =>
  //     item.question.toLowerCase().includes(keyword.toLowerCase()) ||
  //     item.answer.toLowerCase().includes(keyword.toLowerCase())
  // );

  const handleAddQA = async () => {
    // Validate all new Q&A items before submitting
    for (const qa of newQAs) {
      if (!qa.question.trim() || !qa.answer.trim()) {
        addToast("Please fill in all questions and answers", "error");
        return;
      }
    }

    try {
      for (const qa of newQAs) {
        const formData = new FormData();
        formData.append("question", qa.question);
        formData.append("answer", qa.answer);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/qna/${qa.selectedTable}/POST`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to add QA");
        }

        await response.json();
      }
      // Reset form and close modal
      setNewQAs([]); // Clear the newQAs array after successful submission

      setShowImportModal(false);

      // Refresh data using the current keyword (if any)
      fetchData(keyword);

      addToast("Questions added successfully!"); // Success toast
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error(error);
      addToast("Error: " + error.message, "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/qna/${selectedTable}/DELETE/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete QA");
      }

      await response.json();
      fetchData(keyword); // Refresh data using the current keyword (if any)
      addToast("Question deleted successfully!");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error(error);
      addToast("Error: " + error.message, "error");
    }
  };

  const handleEdit = async () => {
    if (!editingQAId || !editingQuestion.trim() || !editingAnswer.trim()) {
      addToast("Please enter both question and answer and select an item to edit.", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("question", editingQuestion);
      formData.append("answer", editingAnswer);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/qna/${selectedTable}/PUT/${editingQAId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to edit QA");
      }

      await response.json();

      // Reset form and close modal
      setEditingQAId(null);
      setEditingQuestion("");
      setEditingAnswer("");
      setShowEditModal(false);

      // Refresh data
      fetchData(keyword);

      addToast("Question updated successfully!");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error(error);
      addToast("Error: " + error.message, "error");
    }
  };

  const handleAddNewQA = () => {
    setNewQAs([...newQAs, { id: Date.now().toString(), question: "", answer: "", selectedTable: selectedTable }]);
  };

  const handleRemoveQA = (idToRemove: string) => {
    setNewQAs(newQAs.filter((qa: NewQAItem) => qa.id !== idToRemove));
  };

  const handleQAChange = (id: string, field: "question" | "answer" | "selectedTable", value: string) => {
    setNewQAs(newQAs.map((qa: NewQAItem) => (qa.id === id ? { ...qa, [field]: value } : qa)));
  };

  const handleAskGPT = (question: string, answer: string) => {
    if (isAskingGPT) return; // Prevent multiple clicks

    setIsAskingGPT(true);

    const gptBaseUrl = "https://chat.openai.com/"; // Replace with your desired GPT service URL
    const prompt = `Please help me improve the grammar and clarity of the following question and answer:\n\nQuestion: ${question}\nAnswer: ${answer}\n\nSuggest improvements:`;
    const encodedPrompt = encodeURIComponent(prompt);
    const gptUrl = `${gptBaseUrl}?q=${encodedPrompt}`;
    window.open(gptUrl, "_blank");

    // Re-enable button after a short delay
    setTimeout(() => {
      setIsAskingGPT(false);
    }, 2000); // 2 seconds
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-10">
        {/* Title with Import button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-700">TD HELPER</h1>
          {isAdmin && (
            <button
              className="px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition"
              onClick={() => setShowImportModal(true)}
            >
              Import
            </button>
          )}
        </div>

        {/* Table selection + keyword search */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-6 text-gray-500">
          <div className="flex items-center mb-4 space-x-2">
            <button
              type="button"
              onClick={() => switchTable(-1)}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
              ◀
            </button>

            {/* Text container with fade effect */}
            <div className="relative w-32 h-8 flex items-center justify-center overflow-hidden">
              <span
                key={selectedTable} // Key triggers re-render for transition
                className="absolute transition-opacity duration-300 opacity-0 animate-fade-in"
              >
                {selectedTable}
              </span>
            </div>

            <button
              type="button"
              onClick={() => switchTable(1)}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
              ▶
            </button>
          </div>


          <label className="block text-gray-600 font-semibold mb-2">
            Enter a keyword to search:
          </label>
          <div className="relative w-64">
            <textarea
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Type your keyword here..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>


        {/* Results */}
        <div className="space-y-4">
          {results.length > 0 ? ( // 🚀 UPDATED: Use 'results' directly since the API returns filtered data
            results.map((item) => (
              <div
                key={item.id}
                className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition transform animate-fade-slide-up"
              >
                <h3 className="text-sm font-semibold text-blue-800">
                  {item.question.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      <span className="inline-block transition-colors duration-300">
                        {highlightText(line, keyword)}
                      </span>
                      <br />
                    </React.Fragment>
                  ))}
                </h3>

                <div className="flex justify-between items-start gap-4 mt-2">
                  {/* Answer textarea */}
                  <textarea
                    value={item.answer}
                    onChange={(e) => {
                      setResults((prevResults) =>
                        prevResults.map((qa) =>
                          qa.id === item.id ? { ...qa, answer: e.target.value } : qa
                        )
                      );
                    }}
                    className="text-sm text-gray-600 w-full px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none transition-colors duration-300"
                    rows={5}
                  />

                  {/* Button group */}
                  <div className="flex flex-col space-y-2">
                    {/* Ask GPT button */}
                    <button
                      onClick={() => handleAskGPT(item.question, item.answer)}
                      disabled={isAskingGPT} // Disable button when a request is in progress
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m9.193 9.193l-.707.707M18 11a5 5 0 11-10 0 5 5 0 0110 0z"></path></svg>
                      Ask GPT
                    </button>
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(item.answer)}
                      className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm text-gray-600 transition-colors duration-300"
                    >
                      Copy
                    </button>
                    {isAdmin && (
                      <>
                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setEditingQAId(item.id);
                            setEditingQuestion(item.question);
                            setEditingAnswer(item.answer);
                            setShowEditModal(true);
                          }}
                          className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm transition-colors duration-300"
                        >
                          Edit
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors duration-300"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No matching questions found.</p>
          )}
        </div>


        {/* Import Modal */}
        {showImportModal && isAdmin && ( // Only show import modal if admin
          <div
            className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <div className="bg-white p-6 rounded-xl w-3/4 h-[90vh] flex flex-col relative">
              {/* Close button */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowImportModal(false)}
              >
                ✕
              </button>
              <h2 className="text-gray-500 text-xl font-bold mb-4">
                Import Question & Answer
              </h2>

              <div className="overflow-y-auto pr-4 flex-grow">
                {newQAs.map((qa: NewQAItem, index: number) => (
                  <div key={qa.id} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-gray-700 font-semibold mb-3">Q&A Item {index + 1}</h3>
                    {/* Question */}
                    <label className="text-gray-500 block mb-2 font-semibold">
                      Question:
                    </label>
                    <textarea
                      ref={newQuestionRef}
                      value={qa.question} // Corrected: Bind to individual qa.question
                      onChange={(e) => handleQAChange(qa.id, "question", e.target.value)}
                      className="text-gray-500 w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    {/* Answer */}
                    <label className="text-gray-500 block mb-2 font-semibold">
                      Answer:
                    </label>
                    <textarea
                      value={qa.answer} // Corrected: Bind to individual qa.answer
                      onChange={(e) => handleQAChange(qa.id, "answer", e.target.value)}
                      className="text-gray-500 w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />

                    {/* Table selection for individual QA */}
                    <label className="text-gray-500 block mb-2 font-semibold">
                      Category (Table):
                    </label>
                    <select
                      value={qa.selectedTable}
                      onChange={(e) => handleQAChange(qa.id, "selectedTable", e.target.value)}
                      className="text-gray-500 w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {tables.map((table) => (
                        <option key={table} value={table}>
                          {table}
                        </option>
                      ))}
                    </select>

                    {newQAs.length > 1 && isAdmin && ( // Only show remove if admin
                      <button
                        onClick={() => handleRemoveQA(qa.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                {isAdmin && (
                  <button
                    onClick={handleAddNewQA}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Add More Q&A
                  </button>
                )}
                {/* Add button */}
                {isAdmin && (
                  <button
                    onClick={handleAddQA}
                    className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && isAdmin && ( // Only show edit modal if admin
          <div
            className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <div className="bg-white p-6 rounded-xl w-1/2 relative">
              {/* Close button */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
              <h2 className="text-gray-500 text-xl font-bold mb-4">
                Edit Question & Answer
              </h2>

              {/* Question */}
              <label className="text-gray-500 block mb-2 font-semibold">
                Question:
              </label>
              <textarea
                value={editingQuestion}
                onChange={(e) => setEditingQuestion(e.target.value)}
                className="text-gray-500 w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              {/* Answer */}
              <label className="text-gray-500 block mb-2 font-semibold">
                Answer:
              </label>
              <textarea
                value={editingAnswer}
                onChange={(e) => setEditingAnswer(e.target.value)}
                className="text-gray-500 w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />

              {/* Update button */}
              {isAdmin && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition"
                >
                  Update
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}