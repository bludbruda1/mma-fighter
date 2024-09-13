import React from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import PropTypes from "prop-types";

const Container = styled(Box)(({ theme }) => ({
  backgroundColor: "#e0e0e0",
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

const Column = styled(Box)(({ theme }) => ({
  flex: 1,
  textAlign: "center",
  padding: theme.spacing(1),
}));

const ResultCard = ({ round, time, method }) => {
  return (
    <Container display="flex">
      <Column>
        <Typography variant="subtitle2" color="textSecondary">
          ROUND
        </Typography>
        <Typography variant="h6">{round}</Typography>
      </Column>
      <Column>
        <Typography variant="subtitle2" color="textSecondary">
          TIME
        </Typography>
        <Typography variant="h6">{time}</Typography>
      </Column>
      <Column>
        <Typography variant="subtitle2" color="textSecondary">
          METHOD
        </Typography>
        <Typography variant="h6">{method}</Typography>
      </Column>
    </Container>
  );
};

ResultCard.propTypes = {
  round: PropTypes.number.isRequired,
  time: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
};

export default ResultCard;
