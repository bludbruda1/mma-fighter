import React from "react";
import {
  Grid,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const FightCard = ({
  selectedItem1,
  selectedItem2,
  winnerIndex,
  championship,
  fighter1IsChamp,
  fighter2IsChamp,
}) => {
  // Helper function to render champion indicator
  const renderChampionBadge = () => {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "rgba(255, 215, 0, 0.1)",
          padding: "4px 12px",
          borderRadius: "4px",
          marginBottom: "8px",
          marginTop: championship ? "32px" : "8px",
          width: "fit-content",
          alignSelf: "center",
        }}
      >
        <EmojiEventsIcon
          sx={{
            color: "gold",
            fontSize: "1.5rem",
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            color: "gold",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Champion
        </Typography>
      </Box>
    );
  };

  return (
    <Card
      elevation={3}
      sx={{
        padding: "20px",
        maxWidth: 800,
        margin: "auto",
        marginTop: "20px",
        position: "relative",
      }}
    >
      {championship && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "gold",
            color: "black",
            padding: "8px",
            textAlign: "center",
            fontWeight: "bold",
            borderTopLeftRadius: "inherit",
            borderTopRightRadius: "inherit",
          }}
        >
          {championship.name}
        </Box>
      )}

      <CardContent sx={{ pt: championship ? 4 : 0 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          {/* Left Fighter Details */}
          <Grid
            item
            xs={12}
            md={4}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Show champion badge if fighter1 is champ */}
            {fighter1IsChamp && renderChampionBadge()}

            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{ marginBottom: "20px", fontWeight: "bold" }}
            >
              {selectedItem1.firstname} {selectedItem1.lastname}
              {winnerIndex === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Chip
                    label="Winner"
                    size="small"
                    color="success"
                    sx={{ marginTop: "8px" }}
                  />
                </Box>
              )}
            </Typography>

            <Card style={{ border: "none", boxShadow: "none" }}>
              <CardMedia
                component="img"
                style={{ objectFit: "contain" }}
                height="250"
                image={selectedItem1.image}
                sx={{ marginBottom: "20px" }}
              />
            </Card>

            <Typography
              variant="subtitle1"
              align="center"
              sx={{ marginTop: "10px", fontWeight: "bold" }}
            >
              Nationality: {selectedItem1.nationality}
            </Typography>
            <Typography variant="body2" align="center">
              Fighting Style: {selectedItem1.fightingStyle}
            </Typography>
            <Typography variant="body2" align="center">
              Record: {selectedItem1.wins}W-{selectedItem1.losses}L
            </Typography>
            <Typography variant="body2" align="center">
              Rank: {selectedItem1.ranking ?? "Unranked"}
            </Typography>
          </Grid>

          {/* VS Text in the middle */}
          <Grid item xs={12} md={2} style={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              VS
            </Typography>
          </Grid>

          {/* Right Fighter Details */}
          <Grid
            item
            xs={12}
            md={4}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Show champion badge if fighter2 is champ */}
            {fighter2IsChamp && renderChampionBadge()}

            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{ marginBottom: "20px", fontWeight: "bold" }}
            >
              {selectedItem2.firstname} {selectedItem2.lastname}
              {winnerIndex === 1 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Chip
                    label="Winner"
                    size="small"
                    color="success"
                    sx={{ marginTop: "8px" }}
                  />
                </Box>
              )}
            </Typography>

            <Card style={{ border: "none", boxShadow: "none" }}>
              <CardMedia
                component="img"
                style={{ objectFit: "contain" }}
                height="250"
                image={selectedItem2.image}
                sx={{ marginBottom: "20px" }}
              />
            </Card>

            <Typography
              variant="subtitle1"
              align="center"
              sx={{ marginTop: "10px", fontWeight: "bold" }}
            >
              Nationality: {selectedItem2.nationality}
            </Typography>
            <Typography variant="body2" align="center">
              Fighting Style: {selectedItem2.fightingStyle}
            </Typography>
            <Typography variant="body2" align="center">
              Record: {selectedItem2.wins}W-{selectedItem2.losses}L
            </Typography>
            <Typography variant="body2" align="center">
              Rank: {selectedItem2.ranking ?? "Unranked"}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FightCard;
