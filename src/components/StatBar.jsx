import React from "react";

const StatBar = ({
  redValue,
  blueValue,
  title,
  showPercentages = true,
}) => {
  // Ensure redValue and blueValue are numbers
  const red = Number(redValue) || 0;
  const blue = Number(blueValue) || 0;

  // Calculate the total value and percentages
  const totalValue = red + blue;
  
  // Calculate percentages
  const redPercent = totalValue === 0 ? 0 : (red / totalValue) * 100;
  const bluePercent = totalValue === 0 ? 0 : (blue / totalValue) * 100;

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
        marginBottom: "10px",
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
          {red}{" "}
          {showPercentages && totalValue > 0 && (
            <span style={percentageStyle}>[{redPercent.toFixed(0)}%]</span>
          )}
        </span>
        <span style={{ fontWeight: "bold" }}>{title}</span>
        <span style={{ color: "blue" }}>
          {blue}{" "}
          {showPercentages && totalValue > 0 && (
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
            width: totalValue === 0 ? "50%" : `${redPercent}%`,
            backgroundColor: red > 0 ? "red" : "#ddd",
            height: "100%",
            float: "left",
          }}
        />
        <div
          style={{
            width: totalValue === 0 ? "50%" : `${bluePercent}%`,
            backgroundColor: blue > 0 ? "blue" : "#ddd",
            height: "100%",
            float: "left",
          }}
        />
      </div>
    </div>
  );
};

export default StatBar;