"use client";
import React, { useState } from "react";
import Papa from "papaparse";
import Alert from "@reach/alert";

export default function App() {
  const [emails, setEmails] = useState([]);
  const [emailStatuses, setEmailStatuses] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, seterror] = useState("");

  const checkDeliverability = async (email) => {
    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error("Error checking email deliverability:", error);
      return false;
    }
  };

  const isValidEmail = (email) => {
    // Basic email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleFileUpload = (event) => {
    seterror("");
    const file = event.target.files[0];

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        // Extract data and detect if first row is header
        const data = results.data;
        let startIndex = 0;

        // Check if the first row might be a header
        if (!isValidEmail(data[0][0])) {
          startIndex = 1; // Skip the first row if it's not a valid email
        }

        const extractedEmails = data
          .slice(startIndex)
          .map((row) => row[0])
          .filter((email) => email && isValidEmail(email));

        setEmails(extractedEmails);
        setEmailStatuses({}); // Clear previous statuses
        setIsChecking(false); // Reset checking status
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
      },
    });
  };

  const handleCheckAllEmails = () => {
    if (!emails.length) {
      seterror("Please upload a CSV file first.");
      return;
    }
    setIsChecking(true); // Set checking state to true
    const newStatuses = {};
    emails.forEach(async (email) => {
      newStatuses[email] = "Checking...";
      setEmailStatuses((prevStatuses) => ({
        ...prevStatuses,
        [email]: "Checking...",
      }));

      const isValid = await checkDeliverability(email);
      setEmailStatuses((prevStatuses) => ({
        ...prevStatuses,
        [email]: isValid ? "Valid" : "Invalid",
      }));
    });
    setIsChecking(false); // Reset checking state when done
    setChecked(true);
  };

  const handleDownloadValidEmails = () => {
    const validEmails = emails.filter(
      (email) => emailStatuses[email] === "Valid"
    );

    if (validEmails.length === 0) {
      alert("No valid emails to download.");
      return;
    }

    const csv = Papa.unparse(
      validEmails.map((email) => [email]),
      {
        header: false,
      }
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "valid_emails.csv";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col py-10 items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Mail Checker By Spiral Vector Team
      </h1>
      <div className="w-full max-w-screen-md bg-white p-8 rounded-lg shadow-md">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="mb-4 p-2 w-full border rounded bg-gray-50 text-gray-600"
          placeholder="Upload CSV file"
        />

        {error && <p className="text-red-500 bg-red-100 p-3 mb-4">{error}</p>}
        <button
          onClick={handleCheckAllEmails}
          className="w-full mb-4 p-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
        >
          Check All Emails
        </button>
        {checked && (
          <button
            onClick={handleDownloadValidEmails}
            className="w-full mb-4 p-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
          >
            Download Valid Emails
          </button>
        )}
        <ul className="list-disc pl-5  max-h-[70vh] overflow-y-auto px-5 py-5">
          {emails.map((email, index) => (
            <li key={index} className="flex justify-between items-center mb-2">
              <span className="text-gray-800">{email}</span>
              <span
                className={`ml-4 p-1 rounded ${
                  emailStatuses[email] === "Checking..."
                    ? "text-gray-600"
                    : emailStatuses[email] === "Valid"
                    ? "bg-green-500 text-white"
                    : emailStatuses[email] === "Invalid"
                    ? "bg-red-500 text-white"
                    : "text-gray-600"
                }`}
              >
                {emailStatuses[email] || ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
