import { attractions } from "../data/attractions.js";

export const getAttractions = (req, res, next) => {
  try {
    const { city } = req.query;
    if (city) {
      const filtered = attractions.filter(
        (spot) => spot.city.toLowerCase() === city.toLowerCase()
      );
      return res.json(filtered);
    }
    res.json(attractions);
  } catch (error) {
    next(error);
  }
};
