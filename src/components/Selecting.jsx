import React, { useState, useEffect } from "react";
import JsonData from "../fighters.json";

// Component for Select and Display
const SelectComponent = () => {
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Fetch the JSON data from the file
    fetch("/fighters.json")
      .then((response) => response.json())
      .then((jsonData) => setData(jsonData))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleChange = (event) => {
    const selectedId = Number(event.target.value);
    const selected = data?.find((x) => x.personid === selectedId);
    setSelectedItem(selected);
    console.log(data);
  };

  return (
    <div>
      <select onChange={handleChange} defaultValue="">
        <option value="" disabled>
          Select a name
        </option>
        {JsonData
          ? JsonData.map((item) => (
              <option key={item.personid} value={item.personid}>
                {item.firstname} {item.lastname}
              </option>
            ))
          : null}
      </select>

      {selectedItem && (
        <div>
          <h2>Details:</h2>
          <p>
            <strong>Name:</strong> {selectedItem.firstname}{" "}
            {selectedItem.lastname}
          </p>
          <p>
            <strong>Nationality:</strong> {selectedItem.nationality}
          </p>
          <p>
            <strong>Record:</strong> {selectedItem.wins}-{selectedItem.losses}-0
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectComponent;
