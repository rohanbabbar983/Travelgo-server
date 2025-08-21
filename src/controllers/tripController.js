import { trips } from "../data/trips.js";

export const getTrips = (req, res, next) => {
  try {
    const { city } = req.query;
    if (city) {
      const filtered = trips.filter(
        (trip) => trip.city.toLowerCase() === city.toLowerCase()
      );
      return res.json(filtered);
    }
    res.json(trips);
  } catch (error) {
    next(error);
  }
};
