import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getAllFighters,
  getGymById,
  getAllChampionships,
  getGameDate,
  getAllFights,
} from "../utils/indexedDB";
import { formatFightingStyle } from "../utils/uiHelpers";
import SortableTable from "../components/SortableTable";
import { Box, Container, Typography, Tooltip, Chip } from "@mui/material";
import { getFighterStatus, getStatusDisplay } from "../utils/fighterUtils";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import FilterPanel from "../components/FilterPanel";
import CountryFlag from "../components/CountryFlag";

const GymPage = () => {
  const { gameId, id } = useParams();
  const [gym, setGym] = useState(null);
  const [fighters, setFighters] = useState([]);
  const [fights, setFights] = useState([]);
  const [gameDate, setGameDate] = useState(null);
  const [orderBy, setOrderBy] = useState("firstname");
  const [order, setOrder] = useState("asc");

  const [filters, setFilters] = useState({
    weightClass: "all",
    fightingStyle: "all",
    nationality: "all",
    rankingStatus: "all",
    gender: "all",
  });

  const [filterOptions, setFilterOptions] = useState({
    weightClasses: [],
    fightingStyles: [],
    nationalities: [],
  });

  useEffect(() => {
    if (!gameId || !id) return;

    const fetchGymAndFighters = async () => {
      const gymData = await getGymById(gameId, parseInt(id));
      setGym(gymData);

      const allFighters = await getAllFighters(gameId);
      const gymFighters = allFighters.filter(
        (fighter) => fighter.gymId === parseInt(id)
      );
      setFighters(gymFighters);
    };

    fetchGymAndFighters();
  }, [gameId, id]);

  useEffect(() => {
    if (!gameId) return;

    const fetchData = async () => {
      try {
        const [fetchedFighters, currentGameDate, fetchedFights] =
          await Promise.all([
            getAllFighters(gameId),
            getAllChampionships(gameId),
            getGameDate(gameId),
            getAllFights(gameId),
          ]);

        setFighters(fetchedFighters);
        setGameDate(new Date(currentGameDate));
        setFights(fetchedFights);

        setFilterOptions({
          weightClasses: [...new Set(fetchedFighters.map((f) => f.weightClass))]
            .filter(Boolean)
            .sort(),
          fightingStyles: [
            ...new Set(
              fetchedFighters.map((f) => formatFightingStyle(f.fightingStyle))
            ),
          ]
            .filter(Boolean)
            .sort(),
          nationalities: [...new Set(fetchedFighters.map((f) => f.nationality))]
            .filter(Boolean)
            .sort(),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [gameId]);

  const applyFilters = useCallback(
    (fightersToFilter) => {
      return fightersToFilter.filter((fighter) => {
        if (
          filters.weightClass !== "all" &&
          fighter.weightClass !== filters.weightClass
        )
          return false;
        if (
          filters.fightingStyle !== "all" &&
          formatFightingStyle(fighter.fightingStyle) !== filters.fightingStyle
        )
          return false;
        if (
          filters.nationality !== "all" &&
          fighter.nationality !== filters.nationality
        )
          return false;

        const isRanked = fighter.ranking != null;
        if (filters.rankingStatus === "ranked" && !isRanked) return false;
        if (filters.rankingStatus === "unranked" && isRanked) return false;

        if (filters.gender !== "all" && fighter.gender !== filters.gender)
          return false;

        return true;
      });
    },
    [filters]
  );

  const compareValues = useCallback(
    (a, b, property) => {
      console.log("Sorting:", { a, b, property });
      console.log(a.firstname, a.lastname);
      console.log(b.firstname, b.lastname);
      if (property === "status") {
        const statusA = getFighterStatus(a, gameDate, fights) || {
          type: "UNKNOWN",
        };
        const statusB = getFighterStatus(b, gameDate, fights) || {
          type: "UNKNOWN",
        };
        const statusPriority = {
          INJURED: 3,
          IN_CAMP: 1,
          BOOKED: 2,
          ACTIVE: 0,
          UNKNOWN: 4,
        };
        const priorityA = statusPriority[statusA.type] ?? 4;
        const priorityB = statusPriority[statusB.type] ?? 4;

        if (priorityA !== priorityB) return priorityA - priorityB;
        return (a.firstname + a.lastname).localeCompare(
          b.firstname + b.lastname
        );
      }

      if (property === "record") {
        const winsA = a.wins ?? 0;
        const winsB = b.wins ?? 0;
        const lossesA = a.losses ?? 0;
        const lossesB = b.losses ?? 0;

        return winsB - winsA || lossesA - lossesB;
      }

      if (property === "fullname") {
        const fullName = `${a.firstname} ${a.lastname}`.localeCompare(
          `${b.firstname} ${b.lastname}`
        );
        return fullName;
      }

      if (typeof a[property] === "string")
        return a[property]
          .toLowerCase()
          .localeCompare(b[property].toLowerCase());

      return a[property] - b[property];
    },
    [fights, gameDate]
  );

  const handleRequestSort = (property) => {
    setOrder(orderBy === property && order === "asc" ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredAndSortedFighters = useMemo(
    (gameId) => {
      const sortedFighters = [...fighters]
        .map((fighter) => {
          const statusObj = getFighterStatus(fighter, gameDate, fights) || {
            type: "UNKNOWN",
          };
          const formattedStatus = getStatusDisplay(statusObj);

          const finalStatus = (
            <Tooltip
              title={
                formattedStatus.type === "INJURED"
                  ? `${formattedStatus.details.type} (${formattedStatus.details.location})`
                  : formattedStatus.type === "BOOKED" ||
                    formattedStatus.type === "IN_CAMP"
                  ? `Fight: ${new Date(
                      formattedStatus.details.fightDate
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}`
                  : ""
              }
              arrow
            >
              <Chip
                label={formattedStatus}
                color={formattedStatus.color}
                size="small"
                icon={
                  formattedStatus.type === "INJURED" ? (
                    <LocalHospitalIcon />
                  ) : undefined
                }
              />
            </Tooltip>
          ); // Ensure this returns a readable string

          const formattedNationality = (
            <>
              {fighter.nationality}{" "}
              <CountryFlag nationality={fighter.nationality} />
            </>
          );

          const formattedRecord = `${fighter.wins ?? 0}-${
            fighter.losses ?? 0
          }-${fighter.draws ?? 0}`;

          const profileImage = (
            <img
              height="50"
              src={fighter.profile}
              alt={`${fighter.firstname} ${fighter.lastname}`}
              sx={{ objectFit: "contain" }}
            />
          );

          return {
            ...fighter,
            fullname: (
              <Link
                to={`/game/${gameId}/dashboard/${fighter.personid}`}
                style={{
                  textDecoration: "none",
                  color: "#0000EE",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                {fighter.firstname} {fighter.lastname}
              </Link>
            ),
            record: formattedRecord,
            nationality: formattedNationality,
            image: profileImage,
            status: finalStatus,
          };
        })
        .sort((a, b) => {
          return order === "asc"
            ? compareValues(a, b, orderBy)
            : -compareValues(a, b, orderBy);
        });

      return applyFilters(sortedFighters);
    },
    [fighters, order, orderBy, compareValues, applyFilters, gameDate, fights]
  );

  if (!gym) {
    return <Typography variant="h5">Loading gym details...</Typography>;
  }

  return (
    <Container
      align="center"
      maxWidth="xl"
      sx={{ position: "relative", zIndex: 2 }}
    >
      <Box sx={{ marginBottom: 4 }}>
        <img
          src={gym.logo}
          alt="Logo"
          style={{ width: "150px", height: "auto" }}
        />
      </Box>
      <Typography variant="h2" gutterBottom>
        {gym.name}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Location: {gym.location}
      </Typography>
      <Typography align="left" variant="h5" gutterBottom>
        Fighters:
      </Typography>
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        totalFighters={fighters.length}
        filteredCount={filteredAndSortedFighters.length}
      />
      <SortableTable
        columns={[
          { id: "ranking", label: "Ranking" },
          { id: "image", label: "" },
          { id: "fullname", label: "Name" },
          { id: "status", label: "Status" },
          { id: "gender", label: "Gender" },
          { id: "weightClass", label: "Weight Class" },
          { id: "fightingStyle", label: "Fighting Style" },
          { id: "nationality", label: "Nationality" },
          { id: "hometown", label: "Hometown" },
          { id: "record", label: "Record" },
        ]}
        data={filteredAndSortedFighters.map((fighter) => ({
          ...fighter,
          ranking: fighter.ranking != null ? fighter.ranking : "NR", // Display "NR" if no ranking
        }))}
        orderBy={orderBy}
        order={order}
        onRequestSort={handleRequestSort}
        sx={{ width: "100%" }}
      />
    </Container>
  );
};

export default GymPage;
