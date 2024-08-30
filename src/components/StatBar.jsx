import React from "react";

const StatBar = ({
  redValue,
  totalValue,
  blueValue,
  title,
  showPercentages = true,
}) => {
  // Calculate the percentages
  const redPercent = (redValue / totalValue) * 100;
  const bluePercent = (blueValue / totalValue) * 100;

  const percentageStyle = {
    color: "#999", // light grey
    fontSize: "0.85em",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: "5px",
        }}
      >
        <span style={{ color: "red" }}>
          {redValue}{" "}
          {showPercentages && (
            <span style={percentageStyle}>[{redPercent.toFixed(0)}%]</span>
          )}
        </span>
        <span style={{ fontWeight: "bold" }}>{title}</span>
        <span style={{ color: "blue" }}>
          {blueValue}{" "}
          {showPercentages && (
            <span style={percentageStyle}>[{bluePercent.toFixed(0)}%]</span>
          )}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          backgroundColor: "#ddd",
          height: "8px",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${redPercent}%`,
            backgroundColor: "red",
            height: "100%",
            float: "left",
          }}
        />
        <div
          style={{
            width: `${bluePercent}%`,
            backgroundColor: "blue",
            height: "100%",
            float: "left",
          }}
        />
      </div>
    </div>
  );
};

export default StatBar;
