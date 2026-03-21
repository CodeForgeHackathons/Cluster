export type Review = {
  id: string;
  author: string;
  text: string;
  rating?: number;
};

export type Place = {
  id: string;
  photo: string;
  rating: number;
  title: string;
  location: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  fact: string; // "2-мя словами" в MVP (будем рендерить строку как 2 слова)
  cost: number;
  description: string;
  reviewsLabel: string;
  reviews: Review[];
  avalinTourUrl?: string;
};

export type Cluster = {
  id: string;
  coverImage: string;
  title: string;
  places: Place[];
};
