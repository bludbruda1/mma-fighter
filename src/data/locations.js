/**
 * Mapping of UFC event locations and their associated venues
 * Organised by region/country with official venue names
 */
export const LOCATIONS = {
    // United States
    "Las Vegas, Nevada": [
      "T-Mobile Arena",
      "UFC Apex",
      "MGM Grand Garden Arena", 
      "Mandalay Bay Events Center",
      "Park Theater at Park MGM"
    ],
    "New York, New York": [
      "Madison Square Garden",
      "Barclays Center",
      "UBS Arena"
    ],
    "Los Angeles, California": [
      "Crypto.com Arena",
      "The Forum",
      "BMO Stadium",
      "Honda Center",
      "YouTube Theater"
    ],
    "San Francisco, California": [
      "Chase Center",
      "SAP Center"
    ],
    "San Diego, California": [
      "Pechanga Arena",
      "Snapdragon Stadium"
    ],
    "Sacramento, California": [
      "Golden 1 Center"
    ],
    "Houston, Texas": [
      "Toyota Center",
      "NRG Stadium"
    ],
    "Dallas, Texas": [
      "American Airlines Center",
      "AT&T Stadium"
    ],
    "Austin, Texas": [
      "Moody Center",
      "Frank Erwin Center"
    ],
    "San Antonio, Texas": [
      "AT&T Center",
      "Alamodome"
    ],
    "Phoenix, Arizona": [
      "Footprint Center",
      "State Farm Stadium",
      "Desert Diamond Arena"
    ],
    "Miami, Florida": [
      "Kaseya Center",
      "Hard Rock Stadium",
      "FLA Live Arena"
    ],
    "Orlando, Florida": [
      "Amway Center",
      "Camping World Stadium"
    ],
    "Tampa, Florida": [
      "Amalie Arena",
      "Raymond James Stadium"
    ],
    "Jacksonville, Florida": [
      "VyStar Veterans Memorial Arena",
      "TIAA Bank Field"
    ],
    "Boston, Massachusetts": [
      "TD Garden",
      "Fenway Park"
    ],
    "Chicago, Illinois": [
      "United Center",
      "Wintrust Arena",
      "Allstate Arena"
    ],
    "Detroit, Michigan": [
      "Little Caesars Arena",
      "Ford Field"
    ],
    "Denver, Colorado": [
      "Ball Arena",
      "Empower Field at Mile High"
    ],
    "Atlanta, Georgia": [
      "State Farm Arena",
      "Mercedes-Benz Stadium"
    ],
    "Minneapolis, Minnesota": [
      "Target Center",
      "U.S. Bank Stadium"
    ],
    "Seattle, Washington": [
      "Climate Pledge Arena",
      "T-Mobile Park"
    ],
    "Portland, Oregon": [
      "Moda Center",
      "Providence Park"
    ],
    "Nashville, Tennessee": [
      "Bridgestone Arena",
      "Nissan Stadium"
    ],
    "Charlotte, North Carolina": [
      "Spectrum Center",
      "Bank of America Stadium"
    ],
  
    // Canada
    "Toronto, Ontario": [
      "Scotiabank Arena",
      "Rogers Centre"
    ],
    "Montreal, Quebec": [
      "Bell Centre",
      "Olympic Stadium"
    ],
    "Vancouver, British Columbia": [
      "Rogers Arena",
      "BC Place"
    ],
    "Edmonton, Alberta": [
      "Rogers Place",
      "Commonwealth Stadium"
    ],
    "Calgary, Alberta": [
      "Scotiabank Saddledome",
      "McMahon Stadium"
    ],
  
    // Brazil
    "Rio de Janeiro, Brazil": [
      "Jeunesse Arena",
      "Maracanã Stadium",
      "Nilson Nelson Gymnasium"
    ],
    "São Paulo, Brazil": [
      "Ibirapuera Arena",
      "Allianz Parque",
      "Morumbi Stadium"
    ],
    "Curitiba, Brazil": [
      "Arena da Baixada",
      "Athletico Paranaense Stadium"
    ],
    "Brasília, Brazil": [
      "Nilson Nelson Gymnasium",
      "Mané Garrincha Stadium"
    ],
  
    // United Kingdom
    "London, England": [
      "The O2 Arena",
      "Wembley Arena",
      "Copper Box Arena",
      "Emirates Stadium"
    ],
    "Manchester, England": [
      "AO Arena",
      "Etihad Stadium",
      "Old Trafford"
    ],
    "Liverpool, England": [
      "M&S Bank Arena",
      "Anfield"
    ],
    "Glasgow, Scotland": [
      "OVO Hydro",
      "Hampden Park",
      "Celtic Park"
    ],
    "Cardiff, Wales": [
      "Principality Stadium",
      "Motorpoint Arena Cardiff"
    ],
    "Belfast, Northern Ireland": [
      "SSE Arena Belfast",
      "Windsor Park"
    ],
  
    // Europe
    "Paris, France": [
      "Accor Arena",
      "Stade de France",
      "Paris La Défense Arena"
    ],
    "Berlin, Germany": [
      "Mercedes-Benz Arena",
      "Olympic Stadium"
    ],
    "Amsterdam, Netherlands": [
      "Johan Cruyff Arena",
      "Ziggo Dome"
    ],
    "Stockholm, Sweden": [
      "Avicii Arena",
      "Friends Arena",
      "Tele2 Arena"
    ],
    "Copenhagen, Denmark": [
      "Royal Arena",
      "Parken Stadium"
    ],
    "Dublin, Ireland": [
      "3Arena",
      "Aviva Stadium",
      "Croke Park"
    ],
  
    // Asia & Middle East
    "Abu Dhabi, UAE": [
      "Etihad Arena",
      "du Forum",
      "Yas Marina Circuit"
    ],
    "Singapore": [
      "Singapore Indoor Stadium",
      "National Stadium"
    ],
    "Tokyo, Japan": [
      "Saitama Super Arena",
      "Tokyo Dome",
      "Ryōgoku Kokugikan"
    ],
    "Seoul, South Korea": [
      "Gocheok Sky Dome",
      "Olympic Gymnastics Arena"
    ],
    "Shanghai, China": [
      "Mercedes-Benz Arena",
      "Oriental Sports Center"
    ],
    "Macau, China": [
      "Cotai Arena",
      "Venetian Macao"
    ],
  
    // Australia & New Zealand
    "Sydney, Australia": [
      "Qudos Bank Arena",
      "Accor Stadium",
      "CommBank Stadium"
    ],
    "Melbourne, Australia": [
      "Rod Laver Arena",
      "Marvel Stadium",
      "AAMI Park"
    ],
    "Brisbane, Australia": [
      "Brisbane Entertainment Centre",
      "Suncorp Stadium"
    ],
    "Perth, Australia": [
      "RAC Arena",
      "Optus Stadium"
    ],
    "Auckland, New Zealand": [
      "Spark Arena",
      "Eden Park",
      "Mt Smart Stadium"
    ],
    "Wellington, New Zealand": [
        "BNZ Place"
      ],
  };
  
  /**
   * Helper function to get all available regions
   * @returns {string[]} Array of region names
   */
  export const getRegions = () => {
    const regions = {
      "United States": [
        "Las Vegas, Nevada",
        "New York, New York",
        "Los Angeles, California",
        "San Francisco, California",
        "San Diego, California",
        "Sacramento, California",
        "Houston, Texas",
        "Dallas, Texas",
        "Austin, Texas",
        "San Antonio, Texas",
        "Phoenix, Arizona",
        "Miami, Florida",
        "Orlando, Florida",
        "Tampa, Florida",
        "Jacksonville, Florida",
        "Boston, Massachusetts",
        "Chicago, Illinois",
        "Detroit, Michigan",
        "Denver, Colorado",
        "Atlanta, Georgia",
        "Minneapolis, Minnesota",
        "Seattle, Washington",
        "Portland, Oregon",
        "Nashville, Tennessee",
        "Charlotte, North Carolina"
      ],
      "Canada": [
        "Toronto, Ontario",
        "Montreal, Quebec",
        "Vancouver, British Columbia",
        "Edmonton, Alberta",
        "Calgary, Alberta"
      ],
      "Brazil": [
        "Rio de Janeiro, Brazil",
        "São Paulo, Brazil",
        "Curitiba, Brazil",
        "Brasília, Brazil"
      ],
      "United Kingdom": [
        "London, England",
        "Manchester, England",
        "Liverpool, England",
        "Glasgow, Scotland",
        "Cardiff, Wales",
        "Belfast, Northern Ireland"
      ],
      "Europe": [
        "Paris, France",
        "Berlin, Germany",
        "Amsterdam, Netherlands",
        "Stockholm, Sweden",
        "Copenhagen, Denmark",
        "Dublin, Ireland"
      ],
      "Asia & Middle East": [
        "Abu Dhabi, UAE",
        "Singapore",
        "Tokyo, Japan",
        "Seoul, South Korea",
        "Shanghai, China",
        "Macau, China"
      ],
      "Australia & New Zealand": [
        "Sydney, Australia",
        "Melbourne, Australia",
        "Brisbane, Australia",
        "Perth, Australia",
        "Auckland, New Zealand",
        "Wellington, New Zealand"
      ]
    };
    return regions;
  };
  
  /**
   * Helper function to get all locations in a region
   * @param {string} region - Name of the region
   * @returns {string[]} Array of locations in that region
   */
  export const getLocationsByRegion = (region) => {
    const regions = getRegions();
    return regions[region] || [];
  };
  
  /**
   * Helper function to get all venues for a location
   * @param {string} location - Name of the location
   * @returns {string[]} Array of venues in that location
   */
  export const getVenuesByLocation = (location) => {
    return LOCATIONS[location] || [];
  };