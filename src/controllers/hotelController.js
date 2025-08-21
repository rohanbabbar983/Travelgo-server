import { hotels } from "../data/hotels.js";

export const getHotels = (req, res, next) => {
  try {
    const { city } = req.query;
    if (city) {
      const filtered = hotels.filter(
        (hotel) => hotel.city.toLowerCase() === city.toLowerCase()
      );
      return res.json(filtered);
    }
    res.json(hotels);
  } catch (error) {
    next(error);
  }
};
