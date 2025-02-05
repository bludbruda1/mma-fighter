import React, { useEffect, useState } from "react";
import "flag-icons/css/flag-icons.min.css";

// Custom fixes for country names
const COUNTRY_NAME_FIXES = {
  "United States": "United States of America",
  UK: "United Kingdom",
  UAE: "United Arab Emirates",
  Czechia: "Czech Republic",
};

const CountryFlags = ({ nationality }) => {
  const [countryData, setCountryData] = useState(null);

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/lipis/flag-icons/main/country.json"
        );
        const data = await response.json();
        setCountryData(data);
      } catch (error) {
        console.error("Error fetching country data:", error);
      }
    };

    fetchCountryData();
  }, []);

  if (!countryData) return <p>Loading country flags...</p>;

  let cleanNationality = nationality
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .trim();

  // Apply country name fixes if necessary
  cleanNationality = COUNTRY_NAME_FIXES[cleanNationality] || cleanNationality;

  // Find the country object based on the cleaned nationality
  const countryEntry = countryData.find(
    (country) => country.name.toLowerCase() === cleanNationality.toLowerCase()
  );

  if (!countryEntry) {
    console.warn(`No match found for: ${cleanNationality}`);
    return <p>No flag available for {cleanNationality}</p>;
  }

  const countryCode = countryEntry.code.toLowerCase();

  return (
    <span
      className={`fi fi-${countryCode}`}
      style={{ fontSize: "14px", marginRight: "6px" }}
    ></span>
  );
};

export default CountryFlags;
